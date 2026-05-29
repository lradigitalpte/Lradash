import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand, PutPublicAccessBlockCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

// --- Configuration ---
const DRY_RUN = process.env.DRY_RUN !== "false"; 

const OLD_BUCKET = process.env.OLD_AWS_BUCKET_NAME || "lradashboard";
const NEW_BUCKET = process.env.NEW_AWS_BUCKET_NAME || "lradash-storage-prod";
const REGION = process.env.NEW_AWS_REGION || "eu-north-1";

if (DRY_RUN) {
  console.log("🚀 DRY RUN MODE ENABLED. No changes will be made to S3 or Database.");
}

const oldS3 = new S3Client({
  region: process.env.OLD_AWS_REGION || REGION,
  credentials: {
    accessKeyId: process.env.OLD_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.OLD_AWS_SECRET_ACCESS_KEY
  }
});

const newS3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.NEW_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEW_AWS_SECRET_ACCESS_KEY
  }
});

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

// Helper to deep replace strings in a document while keeping types intact
function findAndReplaceUrls(obj, oldPrefix, newPrefix) {
  let hasChanges = false;
  const updates = {};

  function traverse(current, path = "") {
    if (!current || typeof current !== "object") return;

    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        const itemPath = path ? `${path}.${index}` : `${index}`;
        if (typeof item === "string" && item.includes(oldPrefix)) {
          updates[itemPath] = item.split(oldPrefix).join(newPrefix);
          hasChanges = true;
        } else {
          traverse(item, itemPath);
        }
      });
    } else {
      // Skip MongoDB specific types
      if (current._bsontype || current instanceof Date) return;

      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          const itemPath = path ? `${path}.${key}` : key;
          const val = current[key];
          if (typeof val === "string" && val.includes(oldPrefix)) {
            updates[itemPath] = val.split(oldPrefix).join(newPrefix);
            hasChanges = true;
          } else if (typeof val === "object" && val !== null) {
            traverse(val, itemPath);
          }
        }
      }
    }
  }

  traverse(obj);
  return { hasChanges, updates };
}

async function migrateS3Files() {
  console.log(`\n--- S3 File Migration (${DRY_RUN ? "DRY RUN" : "LIVE"}) ---`);
  
  if (!DRY_RUN) {
    try {
      await newS3.send(new HeadBucketCommand({ Bucket: NEW_BUCKET }));
      console.log(`✅ Bucket ${NEW_BUCKET} already exists.`);
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.log(`🔨 Creating new bucket: ${NEW_BUCKET} in region ${REGION}`);
        await newS3.send(new CreateBucketCommand({
          Bucket: NEW_BUCKET,
          CreateBucketConfiguration: { LocationConstraint: REGION }
        }));
        
        await newS3.send(new PutPublicAccessBlockCommand({
          Bucket: NEW_BUCKET,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            IgnorePublicAcls: false,
            BlockPublicPolicy: false,
            RestrictPublicBuckets: false,
          }
        }));

        await newS3.send(new PutBucketPolicyCommand({
          Bucket: NEW_BUCKET,
          Policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
              Sid: "PublicReadGetObject",
              Effect: "Allow",
              Principal: "*",
              Action: "s3:GetObject",
              Resource: `arn:aws:s3:::${NEW_BUCKET}/*`
            }]
          })
        }));

        await newS3.send(new PutBucketCorsCommand({
          Bucket: NEW_BUCKET,
          CORSConfiguration: {
            CORSRules: [{
              AllowedHeaders: ["*"],
              AllowedMethods: ["PUT", "POST", "DELETE", "GET"],
              AllowedOrigins: ["*"],
              ExposeHeaders: []
            }]
          }
        }));
        console.log(`✅ Bucket ${NEW_BUCKET} configured with public read access and CORS.`);
      } else {
        throw error;
      }
    }
  }

  console.log(`\n📋 Listing files in old bucket "${OLD_BUCKET}"...`);
  let isTruncated = true;
  let continuationToken = undefined;
  let totalFiles = 0;

  while (isTruncated) {
    const listResponse = await oldS3.send(new ListObjectsV2Command({
      Bucket: OLD_BUCKET,
      ContinuationToken: continuationToken,
    }));

    const contents = listResponse.Contents || [];
    for (const item of contents) {
      const fileKey = item.Key;
      console.log(`📦 ${DRY_RUN ? "[DRY RUN] Would copy" : "Copying"}: ${fileKey} (${item.Size} bytes)`);

      if (!DRY_RUN) {
        const getObjectResp = await oldS3.send(new GetObjectCommand({
          Bucket: OLD_BUCKET,
          Key: fileKey,
        }));
        
        // Stream properly
        const fileBuffer = await streamToBuffer(getObjectResp.Body);

        await newS3.send(new PutObjectCommand({
          Bucket: NEW_BUCKET,
          Key: fileKey,
          Body: fileBuffer,
          ContentType: getObjectResp.ContentType,
        }));
      }

      totalFiles++;
    }

    isTruncated = listResponse.IsTruncated;
    continuationToken = listResponse.NextContinuationToken;
  }
  
  console.log(`\n🎉 Successfully ${DRY_RUN ? "identified" : "migrated"} ${totalFiles} files to ${NEW_BUCKET}!`);
}

async function migrateDatabaseUrls() {
  console.log(`\n--- Database URL Migration (${DRY_RUN ? "DRY RUN" : "LIVE"}) ---`);
  
  const MONGO_URI = process.env.DATABASE_URL;
  if (!MONGO_URI) {
      throw new Error("DATABASE_URL is not set in .env.local!");
  }
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB.");
    const db = client.db(); 
    
    const oldUrlPrefix = `https://${OLD_BUCKET}.s3.${process.env.OLD_AWS_REGION || REGION}.amazonaws.com`;
    const newUrlPrefix = `https://${NEW_BUCKET}.s3.${REGION}.amazonaws.com`;
    
    console.log(`🔍 Searching for: ${oldUrlPrefix}`);
    console.log(`🔄 Replacing with: ${newUrlPrefix}`);

    const collections = await db.listCollections().toArray();
    let totalUpdates = 0;

    for (const collInfo of collections) {
      if (collInfo.name.startsWith("system.")) continue;
      const coll = db.collection(collInfo.name);
      
      const cursor = coll.find({});
      
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const { hasChanges, updates } = findAndReplaceUrls(doc, oldUrlPrefix, newUrlPrefix);
        
        if (hasChanges) {
          if (DRY_RUN) {
            console.log(`🔄 [DRY RUN] Would update document ID: ${doc._id} in collection '${collInfo.name}'`);
            console.log("   Changes:", JSON.stringify(updates, null, 2));
          } else {
            await coll.updateOne({ _id: doc._id }, { $set: updates });
            console.log(`🔄 Updated document ID: ${doc._id} in collection '${collInfo.name}'`);
          }
          totalUpdates++;
        }
      }
    }
    
    console.log(`\n🎉 Successfully ${DRY_RUN ? "found" : "updated"} ${totalUpdates} documents in MongoDB!`);

  } catch (error) {
    console.error("Database Migration Error:", error);
  } finally {
    await client.close();
  }
}

async function start() {
  try {
    await migrateS3Files();
    await migrateDatabaseUrls();
    console.log(`\n✅ Migration Process Finished.`);
    if (DRY_RUN) {
      console.log(`\n💡 To perform the actual migration, run: $env:DRY_RUN="false"; node scripts/migrate-s3-and-db.mjs`);
    } else {
      console.log(`📝 Next Step: Update your .env.local to use the new AWS credentials and bucket name for the app!`);
    }
  } catch (err) {
    console.error("\n❌ Migration failed:", err);
  }
}

start();