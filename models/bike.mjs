import timestamp from '../utils/general/timestamp.mjs';
import bikeHelper from '../utils/api/bike/bikeHelper.mjs';
import validationHelper from '../utils/api/validationHelper.mjs';
import { ObjectId } from 'mongodb';
import userHelper from '../utils/api/user/userHelper.mjs';
import rentAndReturn from '../utils/api/rentAndReturn.mjs';
import admin from './admin.mjs';
import calculate from '../utils/general/calculations.mjs';

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
    increaseValue: async function increaseValue(bikeId, value, target) {
        if (!ObjectId.isValid(bikeId)) {
            console.log("Why are we here??", bikeId.length);
            
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

        const hexBikeId = ObjectId.createFromHexString(bikeId);

        let filter;
        let increase;
        let update;
        let result;
        switch (target) {
            case "battery":
                if (bike.battery === 100) {
                    return { status: 400, error: `Bikes battery is fully charged (100), can't increase battery more.`};
                }

                const batteryChargingSum = bike.battery + parsedValue;

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
                result = await bikeHelper.setValue(filter, update);
                if (result.error) {
                    //Something went wrong when trying up set charging: true.
                    return result;
                }
                //Increase battery
                return await bikeHelper.adjustValue(filter, increase);
            case "speed":
                if (bike.current_speed === 20) {
                    return { status: 400, error: `Bikes speed is currently at max speed, cannot go faster than this.`};
                }

                const speedSum = bike.current_speed + parsedValue;

                //increase will max speed - set it to max value of 100
                if (speedSum > 20) {
                    filter = { _id: hexBikeId };
                    update = { current_speed: 20 };
                    return await bikeHelper.setValue(filter, update);
                }

                //increase will not max speed - allow the increase
                filter = { _id: hexBikeId };
                increase = { current_speed: parsedValue };

                //Increase speed
                return await bikeHelper.adjustValue(filter, increase);
            default:
                return { status: 400, error: `Current target to increase not valid (target: ${target}). Valid targets: speed, battery.`};
            }
    },
    decreaseValue: async function decreaseValue(bikeId, value, target) {
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

        const hexBikeId = ObjectId.createFromHexString(bikeId);

        let filter;
        let decrease;
        let update;

        switch (target) {
            case "battery":
                if (bike.battery === 0) {
                    return { status: 400, error: `Bikes battery is currently 0, cannot decrease it anymore. Please charge the bike...`};
                }

                const batteryChargingSum = bike.battery - parsedValue;

                //decrease will drain battery below zero - set it to min value of 0
                if (batteryChargingSum < 0) {
                    filter = { _id: hexBikeId };
                    update = { battery: 0, charging: false };
                    return await bikeHelper.setValue(filter, update);
                }
        
                //decrease will not drain battery below zero - allow the decrease
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
                
            case "speed":
                if (bike.current_speed === 0) {
                    return { status: 400, error: `Bikes speed is currently at 0. Can't decrease it anymore than that...`};
                }

                const speedSum = bike.current_speed - parsedValue;

                //decrease will go below zero. Set speed to 0.
                if (speedSum < 0) {
                    filter = { _id: hexBikeId };
                    update = { current_speed: 0 };
                    return await bikeHelper.setValue(filter, update);
                }

                //decrease will not stop the bike - allow the decrease
                filter = { _id: hexBikeId };
                decrease = { current_speed: -parsedValue };

                //decrease speed
                return await bikeHelper.adjustValue(filter, decrease);
            default:
                return { status: 400, error: `Current target to decrease not valid (target: ${target}). Valid targets: speed, battery.`};
        }
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
    },
    typeOfParking: async function typeOfParking(cityName, bikeLon, bikeLat) {
        const data = await admin.getAllFromCollection("cities");

        const city = data.find(city => city.city === cityName);

        if (!city) {
            return { status: 400, error: `Unable to find city with name ${cityName}`};
        }

        const parkingLots = city.parking_locations;

        for (let i = 0; i < parkingLots.length; i++) {
            const { longitude, latitude } = parkingLots;

            const distance = calculate.haversine(bikeLon, bikeLat, longitude, latitude);

            if (distance <= 40) {
                //Bike is within a parking zone
                return true;
            }
        }
        //Bike is not near a parking lot
        return false;
    }
};

export default bike;
