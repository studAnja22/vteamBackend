import dbHelper from "../../database/dbHelper.mjs";
import { ObjectId } from 'mongodb';

const cityLocations = {
    "Stockholm": [
        { latitude: 59.3293, longitude: 18.0686 },//Central Station
        { latitude: 59.3328, longitude: 18.0649 },//Gamla Stan
        { latitude: 59.3428, longitude: 18.0493 },//Odenplan
    ],
    "Göteborg": [
        { latitude: 57.7089, longitude: 11.9746 },//Central Station
        { latitude: 57.7072, longitude: 11.9668 },//Avenyn
        { latitude: 57.7058, longitude: 11.9646 },//Haga
    ],
    "Karlskrona": [
        { latitude: 56.1612, longitude: 15.5869 },//Naval Museum
        { latitude: 56.1608, longitude: 15.5895 },//Stortorget
        { latitude: 56.1624, longitude: 15.5827 },//Campus Gräsvik
    ]
};

const bikeHelper = {
    saveBike: async function saveBike(cityName, location, timestamp) {
        const db = await dbHelper.connectToDatabase();

        try {
            let bike = {
                registered: timestamp,
                city: cityName,
                current_location: {
                    longitude: location.longitude,
                    latitude: location.latitude
                },
                current_speed: 0,
                status: "available",
                battery: 100,
                parked: true,
                rented: false,
                in_parking_zone: true,
                in_free_parking: false,
                disabled: false,
                color_code: "green",
                ride_log: []
            }

            await db.bikes.insertOne(bike);
            return { status: 200, message: "Bike was successfully created." };
        } catch (e) {
            console.error("Failed to save the bike.", e);
            return { status: 500, error: `Error 500: Something went wrong trying to save the bike. sorry...` };
        } finally {
            await db.client.close();
        }
    },
    getBike: async function getBike(id) {
        const db = await dbHelper.connectToDatabase();
        const bikeId = { _id: ObjectId.createFromHexString(id)};

        try {
            const foundBike = await db.bikes.findOne(bikeId);
            return foundBike;
        } catch (e) {
            console.error("Error during getOne operation:", e);
            throw new Error("Failed to retrieve bike document with id: ", documentId);
        } finally {
            await db.client.close();
        }
    },
    randomStartLocation: function randomStartLocation(city) {
        const locationList = cityLocations[city];
        const randomIndex = Math.floor(Math.random() * locationList.length);
        return locationList[randomIndex];
    },
    adjustValue: async function adjustValue(filter, update) {
        //filter, update: value to increase or decrease
        const db = await dbHelper.connectToDatabase();

        try {
            const incUpdate = { $inc: update };
            const result = await db.bikes.updateOne(
                filter,
                incUpdate,
            );

            if (result.matchedCount === 0) {
                return { status: 404, error: "No bike found matching the given filter." };
            }

            if (result.modifiedCount === 0) {
                return { status: 200, message: "No changes made to the bike data." };
            }
            console.log("Updated bike fine");
            
            return { status: 200, message: "bike battery updated successfully." };
        } catch (e) {
            console.error("Internal server error while trying to update document", e);
            return { status: 500, error: "Error (500) while trying to update bike battery" };
        } finally {
            db.client.close();
        }
    },
    setValue: async function setValue(filter, update) {
        const db = await dbHelper.connectToDatabase();
        try {
            const setUpdate = { $set: update };
            const result = await db.bikes.updateOne(
                filter,
                setUpdate,
            );

            if (result.matchedCount === 0) {
                return { status: 404, error: "No bike found matching the given filter." };
            }

            if (result.modifiedCount === 0) {
                return { status: 200, message: "No changes made to the bike data." };
            }
            console.log("Set bike yay");
            
            return { status: 200, message: "bike battery updated successfully." };
        } catch (e) {
            console.error("Internal server error while trying to update document");
            return { status: 500, error: "Error (500) while trying to update bike data" };
        } finally {
            db.client.close();
        }
    },
}

export default bikeHelper;
