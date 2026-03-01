import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const REGION = process.env.AWS_REGION!
const BUCKET = process.env.AWS_BUCKET_NAME!

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

/** Public URL for a stored object key */
export function getPublicUrl(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`
}

/**
 * Extract the S3 key from a stored public URL.
 * Returns null if the URL doesn't match our bucket.
 */
export function keyFromUrl(url: string): string | null {
  const prefix = `https://${BUCKET}.s3.${REGION}.amazonaws.com/`
  if (!url.startsWith(prefix)) {
    return null
  }
  return url.slice(prefix.length)
}

/**
 * Create a presigned PUT URL so the browser can upload directly to S3.
 * @param key      - S3 object key (path inside bucket)
 * @param fileType - MIME type of the file
 * @param expiresIn - URL validity in seconds (default 5 minutes)
 */
export async function createPresignedUploadUrl(
  key: string,
  fileType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType
  })
  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Delete an object from S3 by its key.
 * Silently ignores missing objects.
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
    await s3Client.send(command)
  } catch (err: any) {
    // If it doesn't exist, that's fine
    if (err?.name !== "NoSuchKey") {
      throw err
    }
  }
}
