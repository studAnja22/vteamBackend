import dbHelper from "../database/dbHelper.mjs";
import { ObjectId } from "mongodb";
import timestamp from "../general/timestamp.mjs";
import calculate from "../general/calculations.mjs";
import bike from "../../models/bike.mjs";
import userHelper from "./user/userHelper.mjs";

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

            /** Create Bike log and update bike statuses */
            let filter = { _id: hexBikeId };
            let setValues = {
                status: "rented",
                parked: false,
                rented: true,
                color_code: "white",
                charging: false,
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
                stop: null,
                timestamp_start: Date.now(),
                timestamp_stop: null,
            },
            location: {
            start: {
                longitude: bike.current_location.longitude,
                latitude: bike.current_location.latitude,
                start_from_parkingLot: bike.in_parking_zone,
            },
            stop: { 
                longitude: null,
                latitude: null,
                parked_in_parkingLot: null,
            }
            },
            ride_duration: null,
            price: null,
            complete_log: false
        };
        return log;
    },
    stop: async function stop(userId, bikeId, bike) {
        const db = await dbHelper.connectToDatabase();
        const session = await db.client.startSession();
        session.startTransaction();

        try {
            const currentTimestamp = timestamp.getCurrentTime();

            const hexBikeId = ObjectId.createFromHexString(bikeId);
            const hexUserId = ObjectId.createFromHexString(userId);

            /** Calculate time user had bike */
            const incompleteLog = bike.ride_log.find(log => log.complete_log === false);
            const timeDuration = Date.now() - incompleteLog.time.timestamp_start;

            /** Type of parking. In a parking zone or free parking? (bool)*/
            const startPosition = incompleteLog.location.start.start_from_parkingLot;
            const currentParkingType = await rentAndReturn.checkParking(bike);

            //Check if all went well.
            if (currentParkingType.error) {
                await session.abortTransaction();
                return { status: 500, error: "500: unexpected error occurred when trying to calculate parking zone." };
            }
            /** Calculate ride cost */
            const cost = calculate.rideCost(startPosition, currentParkingType, timeDuration);

            //Increase user debt.
            const user = await userHelper.getUser(userId);

            //check if it all went well
            if (user.error) {
                await session.abortTransaction();
                return { status: `${user.status}`, error: `${user.error}` };
            }

            let filter = { _id: hexUserId };
            let update = {
                monthly_debt: user.monthly_debt + cost
            };

            const addToUserDebt = userHelper.update(filter, update);
            //Check if it all went well
            if (addToUserDebt.error) {
                await session.abortTransaction();
                return { status: `${addToUserDebt.status}`, error: `${addToUserDebt.error}` };
            }

            const rideData = {
                db,
                session,
                currentTimestamp,
                hexBikeId,
                hexUserId,
                currentParkingType,
                timeDuration,
                cost,
                bike
            }
            /** Returns the bike and updates the ride_log.*/
            const returnBike = await rentAndReturn.endRideBike(rideData);
            //Check if all went well.
            if (returnBike.error) {
                await session.abortTransaction();
                return { status: 500, error: returnBike.error };
            }

            /** User returns bike */
            const userReturnsBike = await rentAndReturn.endRideUser(rideData);
            //Check if all went well.
            if (userReturnsBike.error) {
                await session.abortTransaction();
                return { status: 500, error: userReturnsBike.error };
            }

            await session.commitTransaction();
            return { status: 200, message: 'Ride stopped successfully' };
        } catch (e) {
            await session.abortTransaction();
            console.error("Internal server error while trying to rent :(", e);
            return { status: 500, error: "And unexpected error occurred while trying to rent the bike" };
        } finally {
            session.endSession();
            db.client.close();
        }
    },
    endRideBike: async function endRideBike({db, session, currentTimestamp, hexBikeId, hexUserId, currentParkingType, timeDuration, cost, bike}) {
        try {
            const collection = db.bikes;

            /** The bike is returned and is now available to be rented again. */
            const filter = { _id: hexBikeId };
            const setValues = {
                status: "available",
                parked: true,
                rented: false,
                color_code: "green"
            };

            const updateStatus = await rentAndReturn.updateValues(collection, filter, setValues, session);
            //Check if all went well.
            if (updateStatus.error) {
                return { status: 500, error: updateStatus.error };
            }

            /** Update bike log */
            const bikeLog = rentAndReturn.returnLog(currentTimestamp, bike, currentParkingType, timeDuration, cost);

            const updateBikeResult = await rentAndReturn.returnBike(collection, filter, bikeLog, hexUserId, session, "bike");
            //Check if all went well.
            if (updateBikeResult.error) {
                return { status: 500, error: updateBikeResult.error };
            }
            return { status: 200, message: 'Ride stopped successfully' };
        } catch (e) {
            console.error("Internal server error while trying to rent :(", e);
            return { status: 500, error: "And unexpected error occurred while trying to rent the bike" };
        }
    },
    endRideUser: async function endRideUser({db, session, currentTimestamp, hexBikeId, hexUserId, currentParkingType, timeDuration, cost, bike}) {
        try {
            const collection = db.users;

            /** The user returns the bike, so their renting_bike is set to false */
            const filter = { _id: hexUserId };
            const setValues = {
                renting_bike: false,
            }

            /** When a user returns the bike they're no longer renting, so, renting_bike status changes to false */
            const updateStatus = await rentAndReturn.updateValues(collection, filter, setValues, session);
            //Check if all went well.
            if (updateStatus.error) {
                return { status: 500, error: updateStatus.error };
            }

            /** Update bike log */
            const bikeLog = rentAndReturn.returnLog(currentTimestamp, bike, currentParkingType, timeDuration, cost);

            const updateUserRideLog = await rentAndReturn.returnBike(collection, filter, bikeLog, hexBikeId, session, "user");

            //Check if all went well.
            if (updateUserRideLog.error) {
                return { status: 500, error: updateUserRideLog.error };
            }
            return { status: 200, message: 'Ride stopped successfully' };
        } catch (e) {
            
            console.error("Internal server error while trying to rent :(", e);
            return { status: 500, error: "And unexpected error occurred while trying to rent the bike" };
        }
    },
    returnLog: function returnLog(timestamp, bike, parkingType, duration, cost) {
        const log = {
            time: {
                stop: timestamp,
                timestamp_stop: Date.now(),
            },
            location: {
            stop: { 
                longitude: bike.current_location.longitude,
                latitude: bike.current_location.latitude,
                parked_in_parkingLot: parkingType,
            }
            },
            ride_duration: duration,
            price: cost,
            complete_log: true
        };
        return log;
    },
    updateValues: async function updateValues(collection, filter, update, session) {
        try {
            const setUpdate = { $set: update };

            const result = await collection.updateOne(
                filter,
                setUpdate,
                { session }
            );

            if (result.matchedCount === 0) {
                return { status: 404, error: `updateValues: Found no match with filter: ${filter}` };
            }

            if (result.modifiedCount === 0) {
                return { status: 200, message: "No changes made in collection." };
            }

            return { status: 200, message: "Update bike status successfully." };
        } catch (e) {
            console.error("Internal server error while trying to update document", e);
            return { status: 500, error: `Error (500) while trying to return a bike.` };
        }
    },
    returnBike: async function returnBike(collection, filter, bikeLog, hexId, session, aFilter) {
        try {
            let arrayFilter;

            switch (aFilter) {
                case 'bike':
                    arrayFilter = [{ "log.user_id": hexId, "log.complete_log": false, }];
                    break;
                case 'user':
                    arrayFilter = [{ "log.bike_id": hexId, "log.complete_log": false, }];
                    break;
                }

            const setUpdate = { 
                $set: {
                    "ride_log.$[log].time.stop": bikeLog.time.stop,
                    "ride_log.$[log].time.timestamp_stop": bikeLog.time.timestamp_stop,
                    "ride_log.$[log].location.stop": bikeLog.location.stop,
                    "ride_log.$[log].ride_duration": bikeLog.ride_duration,
                    "ride_log.$[log].price": bikeLog.price,
                    "ride_log.$[log].complete_log": true
                    }
                };

            const result = await collection.updateOne(
                filter,
                setUpdate,
                { 
                    arrayFilters: arrayFilter,
                    session 
                }
            );

            if (result.matchedCount === 0) {
                return { status: 404, error: `Return bike: Found no match with filter: ${filter}` };
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
    checkParking: async function checkParking(bikeData) {
        /** Checks is parking is in a parking zone (returns true) or if it's free parking (returns false) */
        return await bike.typeOfParking(bikeData.city, bikeData.current_location.longitude, bikeData.current_location.latitude);
    }
};

export default rentAndReturn;
