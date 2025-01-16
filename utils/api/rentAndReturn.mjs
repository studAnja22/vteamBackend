import dbHelper from "../database/dbHelper.mjs";
import { ObjectId } from "mongodb";
import timestamp from "../general/timestamp.mjs";

const rentAndReturn = {
    start: async function start(userId, bikeId, bike) {
        const db = await dbHelper.connectToDatabase();
        const session = await db.client.startSession();
        session.startTransaction();

        try {
            let collection;

            const currentTimestamp = timestamp.getCurrentTime();
            const hexBikeId = ObjectId.createFromHexString(bikeId);
            const hexUserId = ObjectId.createFromHexString(userId);

            /** Create Bike log */
            let filter = { _id: hexBikeId };
            let setValues = {
                status: "rented",
                parked: false,
                rented: true,
                color_code: "white"
            };
            const bikeLog = rentAndReturn.makeLog('bike', currentTimestamp, hexUserId, bike);

            collection = db.bikes;

            const updateBikeResult = await rentAndReturn.rent(collection, filter, setValues, bikeLog, session);
            //Check if all went well.
            if (updateBikeResult.error) {
                await session.abortTransaction();
                return { status: 500, error: updateBikeResult.error };
            }

            /** Create User log */
            filter = { _id: hexUserId };
            setValues = {
                renting_bike: true,
            }
            const userLog = rentAndReturn.makeLog('user', currentTimestamp, hexBikeId, bike);

            collection = db.users;

            const updateUserResult = await rentAndReturn.rent(collection, filter, setValues, userLog, session);
            //Check if all went well.
            if (updateUserResult.error) {
                await session.abortTransaction();
                return { status: 500, error: updateUserResult.error };
            }

            //All went well, lets commit these changes.
            await session.commitTransaction();
            return { status: 200, message: 'Ride started successfully' };
        } catch (e) {
            await session.abortTransaction();
            console.error("Internal server error while trying to rent :(", e);
            return { status: 500, error: "And unexpected error occurred while trying to rent the bike" };
        } finally {
            session.endSession();
            db.client.close();
        }
    },
    rent: async function rent(collection, filter, update, log, session) {
        try {
            const pushUpdate = {
                $set: update,
                $push: {
                    ride_log: log
                },
            };

            const result = await collection.updateOne(
                filter,
                pushUpdate,
                { session }
            );

            if (result.matchedCount === 0) {
                return { status: 404, error: `Found no match with filter: ${filter}` };
            }

            if (result.modifiedCount === 0) {
                return { status: 200, message: "No changes made in collection." };
            }

            return { status: 200, message: "Update successful." };
        } catch (e) {
            console.error("Internal server error while trying to update document", e);
            return { status: 500, error: `Error (500) while trying to rent a bike.` };
        }
    },
    makeLog: function makeLog(logType, timestamp, id, bike) {
        let logKey;

        if (logType === 'bike') {
            logKey = 'user_id';
        }

        if (logType === 'user') {
            logKey = 'bike_id';
        }

        const log = {
            [logKey]: id,
            time: {
                start: timestamp,
                stop: null
            },
            location: {
            start: {
                longitude: bike.current_location.longitude,
                latitude: bike.current_location.latitude,
                parking_type: null,//FIX THIS
            },
            stop: { 
                longitude: null,
                latitude: null,
                parking_type: null,
            }
            },
            price: null,
            complete_log: false
        };
        return log
    }
};

export default rentAndReturn;
