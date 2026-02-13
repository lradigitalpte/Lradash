const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const boardSchema = new mongoose.Schema({}, { strict: false });
const BoardModel = mongoose.model('Board', boardSchema, 'boards');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const boards = await BoardModel.find({}).limit(10);
    console.log('Total boards:', boards.length);
    boards.forEach((b, i) => {
      console.log(`Board ${i+1}:`, {
        _id: b._id,
        title: b.title,
        owner: b.owner,
        members: b.members
      });
    });
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
