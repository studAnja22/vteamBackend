import timestamp from '../utils/general/timestamp.mjs';
import bikeHelper from '../utils/api/bike/bikeHelper.mjs';
import validationHelper from '../utils/api/validationHelper.mjs';
import { ObjectId } from 'mongodb';
import userHelper from '../utils/api/user/userHelper.mjs';
import rentAndReturn from '../utils/api/rentAndReturn.mjs';

const bike = {
    createBike: async function createBike(body) {
        //Form needs city
        const city = await validationHelper.doesCityExist(body.city);

        if (city.error) {
            return city;//404 City not found
        }

        //Get random longitude latitude in chosen city (Stockholm, Göteborg or Karlskrona)
        const location = bikeHelper.randomStartLocation(body.city);
        const currentTimestamp = timestamp.getCurrentTime();

        return await bikeHelper.saveBike(body.city, location, currentTimestamp);
    },
    startRide: async function startRide(userId, bikeId) {
        if (!ObjectId.isValid(userId) || !ObjectId.isValid(bikeId)) {
            return { status: 400, error: `Invalid id format. id must be 24 characters. user id: ${userId}, bike id: ${bikeId}` };
        }

        const bike = await bikeHelper.getBike(bikeId);

        if (!bike) {
            return { status: 400, error: `Could not find bike with that id: ${bikeId}`};
        }

        const bikeAvailable = await validationHelper.bikeAvailable(bikeId);

        if (bikeAvailable.error) {
            return { status: 409, error: "Error: Bike already in use." };
        }

        const user = await userHelper.getUser(userId);

        if (!user) {
            return { status: 400, error: `Could not find bike with that id: ${bikeId}`};
        }

        const userCanOnlyRentOneBike = await validationHelper.oneRentLimitCheck(userId);

        if (userCanOnlyRentOneBike.error) {
            return { status: 409, error: "Error: User can only rent one bike." };
        }
        //All checks were good. Lets start renting the bike.
        return await rentAndReturn.start(userId, bikeId, bike);
    },
    stopRide: async function stopRide(userId, bikeId) {
        if (!ObjectId.isValid(userId) || !ObjectId.isValid(bikeId)) {
            return { status: 400, error: `Invalid id format. id must be 24 characters. user id: ${userId}, bike id: ${bikeId}` };
        }

        const bike = await bikeHelper.getBike(bikeId);

        if (!bike) {
            return { status: 400, error: `Could not find bike with that id: ${bikeId}`};
        }

        const user = await userHelper.getUser(userId);

        if (!user) {
            return { status: 400, error: `Could not find bike with that id: ${bikeId}`};
        }

        const hexUserId = ObjectId.createFromHexString(userId);
        const hexBikeId = ObjectId.createFromHexString(bikeId);
        const currentTimestamp = timestamp.getCurrentTime();

        // Calculate ride fare
        const filter = { _id: hexBikeId };
        const setValues = {
            status: "available",
            parked: true,
            rented: false,
            color_code: "green"
        };

        const rideLog = {
            user_id: hexUserId,
            time: {
                stop: currentTimestamp
            },
            location: {
            stop: {
                longitude: bike.current_location.longitude,
                latitude: bike.current_location.latitude,
                parking_type: null,//FIX THIS
            }
            },
            complete_log: true
        };

        return await bikeHelper.adjustRide(filter, setValues, rideLog);
    },
    increaseBattery: async function increaseBattery(bikeId, value) {
        if (!ObjectId.isValid(bikeId)) {
            return { status: 400, error: "Invalid id format. id must be 24 characters" };
        }

        const parsedValue = parseInt(value, 10);

        //Check if parsedValue is a positive number
        if (isNaN(parsedValue) || parsedValue <= 0) {
            return { status: 400, error: "value must be a positive number" };
        }

        const bike = await bikeHelper.getBike(bikeId);

        if (!bike) {
            return { status: 400, error: `Could not find bike with that id: ${bikeId}`};
        }

        const batteryChargingSum = bike.battery + parsedValue;
        const hexBikeId = ObjectId.createFromHexString(bikeId);

        let filter;
        let increase;
        //increase will max battery - set it to max value of 100
        if (batteryChargingSum > 100) {
            filter = { _id: hexBikeId };
            increase = { battery: 100 };
            return await bikeHelper.setValue(filter, increase);
        }

        //increase will not max battery - allow the increase
        filter = { _id: hexBikeId };
        increase = { battery: parsedValue };
        return await bikeHelper.adjustValue(filter, increase);
    },
    decreaseBattery: async function decreaseBattery(bikeId, value) {
        if (!ObjectId.isValid(bikeId)) {
            return { status: 400, error: "Invalid id format. id must be 24 characters" };
        }

        const parsedValue = parseInt(value, 10);

        //Check if parsedValue is a positive number
        if (isNaN(parsedValue) || parsedValue <= 0) {
            return { status: 400, error: "value must be a positive number" };
        }
        const bike = await bikeHelper.getBike(bikeId);

        if (!bike) {
            return { status: 400, error: `Could not find bike with that id: ${bikeId}`};
        }

        const batteryChargingSum = bike.battery - parsedValue;
        const hexBikeId = ObjectId.createFromHexString(bikeId);

        let filter;
        let decrease;
        //decrease will drain battery below zero - set it to min value of 0
        if (batteryChargingSum < 0) {
            filter = { _id: hexBikeId };
            decrease = { battery: 0 };
            return await bikeHelper.setValue(filter, decrease);
        }

        //increase will not drain battery below zero - allow the decrease
        filter = { _id: hexBikeId };
        decrease = { battery: -parsedValue };
        return await bikeHelper.adjustValue(filter, decrease);
    },
    updatePosition: async function updatePosition(body) {
        //update long lat
    }
};

export default bike;
