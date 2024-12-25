import database from "../../db/database.mjs";

const dbHelper = {
    connectToDatabase: async function connectToDatabase() {
        try {
            return await database.getDb();
        } catch (e) {
            console.error("Failed to connect to mongodb:", e.message);
            return { status: 500, error: `Error 500: Database connection failed: ${e.message}` };
        }
    },
    selectCollection: async function selectCollection(db, collectionName) {
        let collection;

        switch (collectionName) {
            case 'bikes':
                collection = db.bikes;
                break;
            case 'users':
                collection = db.users;
                break;
            case 'cities':
                collection = db.cities;
                break;
            default:
                return { status: 400, error: `Error 400: Invalid collection name: ${collectionName}` };
        }
        return collection;
    },
    findDocument: async function findDocument(db, filter, collection) {
        try {
            return await collection.find(filter).toArray();
        } catch (e) {
            console.error(`Error while trying to find document in collection: ${collection}`, e);
            return { status: 500, error: `Error 500: Something went wrong trying to find the document in: ${collection}` };
        } finally {
            await db.client.close();
        }
    }
}

export default dbHelper;
