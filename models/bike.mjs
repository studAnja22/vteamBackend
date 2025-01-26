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

        /**Checking if the user exists and if the user isn't already renting a bike */
        const user = await userHelper.getUser(userId);

        if (!user) {
            return { status: 400, error: `Could not find user with that id: ${userId}`};
        }

        if (user.renting_bike) {
            return { status: 409, error: "Error: User can only rent one bike." };
        }

        /**Checking if the bike exists and if it's available to be rented */
        const bike = await bikeHelper.getBike(bikeId);

        if (!bike) {
            return { status: 400, error: `Could not find bike with that id: ${bikeId}`};
        }
        console.log("");
        
        const available = !bike.rented;//An available bike have rented: false.

        if (!available) {
            //Bike is not available as it currently have rented: true.
            return { status: 409, error: "Error: Bike already in use." };
        }

        //All checks were good. Lets start renting the bike.
        return await rentAndReturn.start(userId, bikeId, bike);
    },
    stopRide: async function stopRide(userId, bikeId) {
        if (!ObjectId.isValid(userId) || !ObjectId.isValid(bikeId)) {
            return { status: 400, error: `Invalid id format. id must be 24 characters. user id: ${userId}, bike id: ${bikeId}` };
        }

        /** Does user exist and are they renting a the bike? */
        const user = await userHelper.getUser(userId);

        if (!user) {
            //User does not exists
            return { status: 400, error: `Could not find user with that id: ${userId}`};
        }
        //User is renting a bike
        if (!user.renting_bike) {
            return { status: 409, error: "Error: User currently not renting a bike." };
        }

        /**Checking if the bike exists and if it's currently being rented so we can return it */
        const bike = await bikeHelper.getBike(bikeId);

        if (!bike) {
            //Bike does not exists
            return { status: 400, error: `Could not find bike with that id: ${bikeId}`};
        }
        //User is renting this bike
        const bikeRented = await validationHelper.bikeIsRentedByUser(bikeId, userId);

        if (bikeRented.error) {
            return { status: 409, error: "Error: Bike not rented by user" };
        }

        //All checks were good. Lets stop renting the bike.
        // return { status: 400, message: `testing things in stop`};
        return await rentAndReturn.stop(userId, bikeId, bike);
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

        if (bike.battery === 100) {
            return { status: 400, error: `Bikes battery is fully charged (100), can't increase battery more.`};
        }

        const batteryChargingSum = bike.battery + parsedValue;
        const hexBikeId = ObjectId.createFromHexString(bikeId);

        let filter;
        let increase;
        let update;
        //increase will max battery - set it to max value of 100
        if (batteryChargingSum > 100) {
            filter = { _id: hexBikeId };
            update = { battery: 100, charging: false, };
            return await bikeHelper.setValue(filter, update);
        }

        //increase will not max battery - allow the increase
        filter = { _id: hexBikeId };
        update = { charging: true };
        increase = { battery: parsedValue };
        //Bike is currently charging
        const result = await bikeHelper.setValue(filter, update);
        if (result.error) {
            //Something went wrong when trying up set charging: true.
            return result;
        }
        //Increase battery
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

        if (bike.battery === 0) {
            return { status: 400, error: `Bikes battery is currently 0, cannot decrease it anymore. Please charge the bike...`};
        }

        const batteryChargingSum = bike.battery - parsedValue;
        const hexBikeId = ObjectId.createFromHexString(bikeId);

        let filter;
        let decrease;
        let update;
        //decrease will drain battery below zero - set it to min value of 0
        if (batteryChargingSum < 0) {
            filter = { _id: hexBikeId };
            update = { battery: 0, charging: false };
            return await bikeHelper.setValue(filter, update);
        }

        //increase will not drain battery below zero - allow the decrease
        filter = { _id: hexBikeId };
        decrease = { battery: -parsedValue };
        update = { charging: false };
        //Bike isn't charging
        const result = await bikeHelper.setValue(filter, update);
        if (result.error) {
            //Something went wrong when trying up set charging: false
            return result;
        }
        //Battery is draining...
        return await bikeHelper.adjustValue(filter, decrease);
    },
    updatePosition: async function updatePosition(bikeId, position) {
        if (!ObjectId.isValid(bikeId)) {
            return { status: 400, error: "Invalid id format. id must be 24 characters" };
        }
        if (!position.longitude || !position.latitude) {
            return { status: 400, error: `Can't update bikes position without longitude and latitude`};
        }

        const parsedLongitude = parseFloat(position.longitude);
        const parsedLatitude = parseFloat(position.latitude);

        //Check if parsed values are a numbers
        if (isNaN(parsedLongitude) || isNaN(parsedLatitude)) {
            return { status: 400, error: "Longitude/Latitude must be a number" };
        }

        const bike = await bikeHelper.getBike(bikeId);

        if (!bike) {
            return { status: 400, error: `Could not find bike with that id: ${bikeId}`};
        }
        const hexBikeId = ObjectId.createFromHexString(bikeId);
        const filter = {_id: hexBikeId };
        const currentPosition = {
            current_location: {
                longitude: parsedLongitude,
                latitude: parsedLatitude
            }
        }
        return await bikeHelper.setValue(filter, currentPosition);
    }
};

export default bike;
