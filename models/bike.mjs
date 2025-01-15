import timestamp from '../utils/general/timestamp.mjs';
import bikeHelper from '../utils/api/bike/bikeHelper.mjs';
import validationHelper from '../utils/api/validationHelper.mjs';
import { ObjectId } from 'mongodb';

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
    startRide: async function startRide(body) {
        // Vi behöver, user id, bike id.
        /**
         * Vad ska vi göra?
         * VI ska uppdatera loggen och ändra lite stats till true/false
         */
    },
    stopRide: async function stopRide(body) {
        // uder id, bike id
        /**
         * Vad ska vi göra?
         * VI ska uppdatera loggen och ändra lite stats till true/false
         */
    },
    increaseBattery: async function increaseBattery(bikeId, value) {
        if (!bikeId || !value) {
            return { status: 400, error: "Missing bikeId or value. Unable to update battery." };
        }
        if (!ObjectId.isValid(bikeId)) {
            return { status: 400, error: "Invalid id format. id must be 24 characters" };
        }
        const id = ObjectId.createFromHexString(bikeId);
        const parsedValue = parseInt(value, 10);

        //Check if number is positive
        if (isNaN(parsedValue) || parsedValue <= 0) {
            return { status: 400, error: "value must be a positive number" };
        }
        const bike = await bikeHelper.getBike(bikeId);
        const batteryChargingSum = bike.battery + parsedValue;

        let filter;
        let increase;
        //increase will max battery - set it to max value
        if (batteryChargingSum > 100) {
            filter = { _id: id };
            increase = { battery: 100 };
            return await bikeHelper.setValue(filter, increase);
        }

        //increase will not max battery - allow the increase
        filter = { _id: id };
        increase = { battery: parsedValue };
        return await bikeHelper.adjustValue(filter, increase);
    },
    decreaseBattery: async function decreaseBattery(bikeId, value) {
        if (!bikeId || !value) {
            return { status: 400, error: "Missing bikeId or value. Unable to update battery." };
        }
        if (!ObjectId.isValid(bikeId)) {
            return { status: 400, error: "Invalid id format. id must be 24 characters" };
        }
        const id = ObjectId.createFromHexString(bikeId);
        const parsedValue = parseInt(value, 10);

        //Check if number is positive
        if (isNaN(parsedValue) || parsedValue <= 0) {
            return { status: 400, error: "value must be a positive number" };
        }
        const bike = await bikeHelper.getBike(bikeId);
        const batteryChargingSum = bike.battery - parsedValue;

        let filter;
        let decrease;
        //increase will max battery - set it to max value
        if (batteryChargingSum < 0) {
            filter = { _id: id };
            decrease = { battery: 0 };
            return await bikeHelper.setValue(filter, decrease);
        }

        //increase will not max battery - allow the increase
        filter = { _id: id };
        decrease = { battery: -parsedValue };
        return await bikeHelper.adjustValue(filter, decrease);
    },
};

export default bike;
