import dbHelper from "../../database/dbHelper.mjs";
import timestamp from "../../general/timestamp.mjs";
import { ObjectId } from "mongodb";

const userHelper = {
    saveUser: async function saveUser(body, hashedPassword, timestamp) {
        const db = await dbHelper.connectToDatabase();

        try {
            let newUser = {
                name: "",
                img: "default",
                email: body.email,
                password: hashedPassword,
                account_created: timestamp,
                last_login: null,
                role: "user",
                status: "active",
                renting_bike: false,
                prepaid_balance: 0,
                monthly_debt: 0,
                transaction_log: [],
                payment_history: [],
                ride_log: []
            }

            await db.users.insertOne(newUser);
            return { status: 200, message: "User successfully registered." };
        } catch (e) {
            console.error("Failed to save user", e);
            return { status: 500, error: "Error (500) while trying to save user." };
        } finally {
            await db.client.close();
        }
    },
    getUser: async function getUser(id) {
        const db = await dbHelper.connectToDatabase();
        const userId = { _id: ObjectId.createFromHexString(id)};

        try {
            const foundUser = await db.users.findOne(userId);

            if (foundUser.matchedCount === 0) {
                return { status: 404, error: "No user found matching the given filter." };
            }
            return foundUser;
        } catch (e) {
            console.error("Error during getUser operation:", e);
            return { status: 500, error: "Failed to retrieve user document with id"};
        } finally {
            await db.client.close();
        }
    },
    update: async function update(filter, update) {
        const db = await dbHelper.connectToDatabase();
        try {
            const setUpdate = { $set: update };
            const result = await db.users.updateOne(
                filter,
                setUpdate,
            );

            if (result.matchedCount === 0) {
                return { status: 404, error: "No user found matching the given filter." };
            }

            if (result.modifiedCount === 0) {
                return { status: 200, message: "No changes made to the user data." };
            }

            return { status: 200, message: "User data updated successfully." };
        } catch (e) {
            console.error("Internal server error while trying to update document");
            return { status: 500, error: "Error (500) while trying to update user data" };
        } finally {
            db.client.close();
        }
    },
    increase: async function increase(filter, amountToAdd) {
        const db = await dbHelper.connectToDatabase();
        try {
            const currentTimestamp = timestamp.getCurrentTime();
            const increasePrePaidAndAddLogTransaction ={
                $inc: { prepaid_balance: amountToAdd },
                $push: {
                    transaction_log: {
                        transaction_type: "deposit",
                        timestamp: currentTimestamp,
                        amount_increased: amountToAdd,
                        notes: "Added funds to prepaid balance"
                    }
                }
            }

            const result = await db.users.updateOne(
                filter,
                increasePrePaidAndAddLogTransaction,
            );

            if (result.matchedCount === 0) {
                return { status: 404, error: "No user found matching the given filter." };
            }

            if (result.modifiedCount === 0) {
                return { status: 500, error: "Failed to update users prepaid balance." };
            }

            return { status: 200, message: "Funds been added successfully to your account." };
        } catch (e) {
            console.error("Internal server error while trying to update document");
            return { status: 500, error: "Error (500) while trying to add funds to prepaid balance." };
        } finally {
            db.client.close();
        }
    },
};

export default userHelper;
