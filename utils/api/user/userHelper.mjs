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
                currently_logged_in: false,
                role: "user",
                status: "active",
                account_suspended: false,
                renting_bike: false,
                prepaid_balance: 0,
                monthly_debt: 0,
                transaction_log: [],
                payment_history: [],
                ride_log: [],
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
    getUser: async function getUser(userEmail) {
        const db = await dbHelper.connectToDatabase();
        const filter = { email: userEmail };

        try {
            const foundUser = await db.users.findOne(filter);

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
    increase: async function increase(filter, amountToAdd, prepaidBalance) {
        /**
         * Currently part of increasing prepaid_balance and adding a transaction_log
         * function should probably have a name change to reflect that.
         */
        const db = await dbHelper.connectToDatabase();
        const session = await db.client.startSession();
        session.startTransaction();

        try {
            const currentTimestamp = timestamp.getCurrentTime();
            const increasePrePaidAndAddLogTransaction ={
                $inc: { prepaid_balance: amountToAdd },
                $push: {
                    transaction_log: {
                        transaction_type: "deposit",
                        timestamp: currentTimestamp,
                        prepaid_balance_before: prepaidBalance,
                        prepaid_balance_after: prepaidBalance + amountToAdd,
                        amount_increased: amountToAdd,
                        notes: `${amountToAdd} has been added to prepaid balance.`
                    }
                }
            }

            const result = await db.users.updateOne(
                filter,
                increasePrePaidAndAddLogTransaction,
            );

            if (result.matchedCount === 0) {
                await session.abortTransaction();
                return { status: 404, error: "No user found matching the given filter." };
            }

            if (result.modifiedCount === 0) {
                await session.abortTransaction();
                return { status: 500, error: "Failed to update users prepaid balance." };
            }

            return { status: 200, message: "Funds been added successfully to your account." };
        } catch (e) {
            await session.abortTransaction();
            console.error("Internal server error while trying to update document");
            return { status: 500, error: "Error (500) while trying to add funds to prepaid balance." };
        } finally {
            session.endSession();
            db.client.close();
        }
    },
    payment: async function payment(filter, typeOfPayment, amountToPay, balance) {
        /**
         * User can pay with prepaid card or a monthly bill.
         */
        const db = await dbHelper.connectToDatabase();

        try {
            const currentTimestamp = timestamp.getCurrentTime();
            let payment;

            switch (typeOfPayment) {
                case "prepaid":
                    payment ={
                        $inc: { 
                            prepaid_balance: -amountToPay,
                            monthly_debt: -amountToPay,
                        },
                        $push: {
                            payment_history: {
                                transaction_type: "payment",
                                timestamp: currentTimestamp,
                                prepaid_balance_before: balance,
                                prepaid_balance_after: balance - amountToPay,
                                monthly_debt: amountToPay,
                                monthly_debt_paid: amountToPay,
                                current_debt: 0,
                                notes: `Payment method: prepaid. ${amountToPay} has been deducted from prepaid balance.`
                            }
                        }
                    }
                    break;
                case "bill":
                    payment ={
                        $inc: {
                            monthly_debt: -amountToPay,
                        },
                        $push: {
                            payment_history: {
                                transaction_type: "payment",
                                timestamp: currentTimestamp,
                                monthly_debt: amountToPay,
                                monthly_debt_paid: amountToPay,
                                current_debt: 0,
                                notes: `Payment method: Monthly bill. User has paid ${amountToPay} in full.`
                            }
                        }
                    }
                    break;
                default:
                    return { status: 400, error: `Payment method ${typeOfPayment} not supported. Valid options are: bill, prepaid.` };
            }

            const result = await db.users.updateOne(
                filter,
                payment,
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
    }
};

export default userHelper;
