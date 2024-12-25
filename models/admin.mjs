import dbHelper from '../utils/database/dbHelper.mjs';
import validationHelper from '../utils/api/validationHelper.mjs';
import adminHelper from '../utils/api/admin/adminHelper.mjs';
import bcryptHelper from '../utils/authentication/bcryptHelper.mjs';
import timestamp from '../utils/general/timestamp.mjs';

const admin = {
    getAllFromCollection: async function getAllFromCollection(collectionName) {
        const db = await dbHelper.connectToDatabase();
        const collection = await dbHelper.selectCollection(db, collectionName);

        try {
            return await collection.find().toArray();
        } catch (e) {
            console.error(`Error trying to get all data in collection: ${collectionName}:`, e);
            throw new Error(`500: Failed to gather collection data: ${e.message}`);
        } finally {
            await db.client.close();
        }
    },
    countCollectionEntries: async function countCollectionEntries(collectionName) {
        const db = await dbHelper.connectToDatabase();
        const collection = await dbHelper.selectCollection(db, collectionName);
        try {
            const result = await collection.countDocuments();
            console.log("Result count", result);
            
            return await collection.countDocuments();
        } catch (e) {
            console.error(`Error while trying to count entries in collection: ${collectionName}:`, e);
            throw new Error(`500: Failed to count collection entries: ${e.message}`);
        } finally {
            await db.client.close();
        }
    },
    createAdmin: async function createAdmin(body) {
        const collection = "admin";
        const completeForm = validationHelper.isFormComplete(body);

        if (completeForm.error) {
            return completeForm;//Form incomplete
        }

        if (body.password.length < 8) {
            return { status: 400, error: "Password must be at least 8 characters long" };
        }

        const uniqEmail = await validationHelper.isEmailAvailable(body.email, collection);
        console.log("Uniq email??", uniqEmail);
        
        if (uniqEmail.error) {
            return uniqEmail;//Email is a duplicate
        }

        const hashedPassword = await bcryptHelper.hashPassword(body.password);
        const currentTimestamp = timestamp.getCurrentTime();

        return await adminHelper.saveAdmin(body, hashedPassword, currentTimestamp);
    }
};

export default admin;
