import { MongoClient, ObjectId } from 'mongodb';

let mongoClient;
export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  if (!mongoClient) {
    mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await mongoClient.connect();
  }
  const dbName = process.env.MONGODB_DB || (() => {
    try {
      const u = new URL(uri);
      const name = (u.pathname || '').replace(/^\//, '');
      return name || 'buildwise';
    } catch {
      return 'buildwise';
    }
  })();
  return mongoClient.db(dbName);
}

export { ObjectId };


