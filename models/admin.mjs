import dbHelper from '../utils/database/dbHelper.mjs';
import validationHelper from '../utils/api/validationHelper.mjs';
import adminHelper from '../utils/api/admin/adminHelper.mjs';
import userHelper from '../utils/api/user/userHelper.mjs';
import bcryptHelper from '../utils/authentication/bcryptHelper.mjs';
import timestamp from '../utils/general/timestamp.mjs';
import bikeHelper from '../utils/api/bike/bikeHelper.mjs';

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
    enableOrDisable: async function enableOrDisable(target, id, decision) {
        // {target} "user" or "bike",{id} user id. {decision} bool, true or false.
        //Admin needs users _id to suspend them.
        let filter;
        let update;
        try {
            switch (target) {
                case "user":
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

                    filter = { _id: userExist._id};
                    update = {
                        account_suspended: decision
                    }
                    return await userHelper.update(filter, update);
                case "bike":
                    const bikeExist = await bikeHelper.getBike(id);

                    if (!bikeExist) {
                        return { status: 404, error: "No Bike found matching the given filter." };
                    }

                    if (bikeExist.disabled && decision) {
                        //disabled: true and decision is set to true.
                        //You can't disabled the the bike twice...
                        return { status: 400, error: "Bike is already disabled." };
                    }

                    if (!bikeExist.disabled && !decision) {
                        //disabled: false and decision is set to false
                        //Bike is not disabled, no need to set disabled to false again.
                        return { status: 400, error: "Bike is already enabled." };
                    }

                    filter = { _id: bikeExist._id};
                    update = {
                        disabled: decision
                    }

                    return await bikeHelper.setValue(filter, update);
                default:
                    return { status: 400, error: `admin.enableOrDisable() cannot be done. Target value needs to be 'user' or 'bike'. Target value submitted was: ${target}` };
            }
        } catch (e) {
            console.error(`Unexpected Error during admin.enableOrDisable`, e);
        }
    }
};

export default admin;
