import dbHelper from '../utils/database/dbHelper.mjs';
import validationHelper from '../utils/api/validationHelper.mjs';
import adminHelper from '../utils/api/admin/adminHelper.mjs';
import userHelper from '../utils/api/user/userHelper.mjs';
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

        if (uniqEmail.error) {
            return uniqEmail;//Email is a duplicate
        }

        const hashedPassword = await bcryptHelper.hashPassword(body.password);
        const currentTimestamp = timestamp.getCurrentTime();

        return await adminHelper.saveAdmin(body, hashedPassword, currentTimestamp);
    },
    enableOrDisableUser: async function enableOrDisableUser(id, decision) {
        // {id} user id. {decision} bool, true or false.
        //Admin needs users _id to suspend them. 
        try {
            const userExist = await userHelper.getUser(id);

            if (userExist.error) {
                return userExist;
            }

            if (userExist.account_suspended && decision) {
                //account_suspended: true and decision is set to true.
                //You can't suspend the user twice...
                return { status: 400, error: "User has already been suspended." };
            }

            if (!userExist.account_suspended && !decision) {
                //account_suspended: false and decision is set to false
                //User is not suspended, so there's no need to change the value to false again.
                return { status: 400, error: "Users suspension has already been revoked." };
            }

            const filter = { _id: userExist._id};
            const update = {
                account_suspended: decision
            }
            return await userHelper.update(filter, update);
        } catch (e) {
            console.error(`Error during admin/:user/suspend_user`, e);
        }
    }
};

export default admin;
