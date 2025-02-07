import express from 'express';
const router = express.Router();

import * as fs from 'node:fs';
import bike from '../models/bike.mjs';
import admin from '../models/admin.mjs';
import dbHelper from "../utils/database/dbHelper.mjs";

const db = await dbHelper.connectToDatabase();

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

// Used when creating randomized routes
router.post('/addjson', async (req, res) => {
    let data = req.body.data;

    fs.appendFile('route-files/routes_sthlm3.txt', `${JSON.stringify(data)}\n`, (err) => {
        if (err) throw err;
    });
});

// Returns all routes from files as a json object
router.get('/allRoutes', async (req, res) => {
    let gbg1 = fs.readFileSync('route-files/routes_gbg1.txt', 'utf-8').split("\n");
    let gbg2 = fs.readFileSync('route-files/routes_gbg2.txt', 'utf-8').split("\n");
    let gbg3 = fs.readFileSync('route-files/routes_gbg3.txt', 'utf-8').split("\n");

    let sthlm1 = fs.readFileSync('route-files/routes_sthlm1.txt', 'utf-8').split("\n");
    let sthlm2 = fs.readFileSync('route-files/routes_sthlm2.txt', 'utf-8').split("\n");
    let sthlm3 = fs.readFileSync('route-files/routes_sthlm3.txt', 'utf-8').split("\n");

    let kk1 = fs.readFileSync('route-files/routes_kk1.txt', 'utf-8').split("\n");
    let kk2 = fs.readFileSync('route-files/routes_kk2.txt', 'utf-8').split("\n");
    let kk3 = fs.readFileSync('route-files/routes_kk3.txt', 'utf-8').split("\n");

    let allRoutes = [gbg1, gbg2, gbg3, sthlm1, sthlm2, sthlm3, kk1, kk2, kk3];

    // Transformation of all routes from strings to arrays
    for (let route of allRoutes) {
        for (let i = 0; i < route.length; i++) {
            route[i] = route[i].replaceAll("[", "");
            route[i] = route[i].replaceAll("]", "");
            route[i] = route[i].split(",");
        }
    }

    return res.status(200).json({
        "Göteborg": [gbg1, gbg2, gbg3],
        "Stockholm": [sthlm1, sthlm2, sthlm3],
        "Karlskrona": [kk1, kk2, kk3]
    });
})

// Stops all active rentals
router.put('/stopAllRides', async (req, res) => {
    const users = await admin.getAllFromCollection("users");

    for (const user of users) {
        if (user.renting_bike) {
            for (let i=0; i<user.ride_log.length; i++) {
                if (user.ride_log[i].complete_log === false) {
                    const userID = user._id.toString();
                    const bikeID = user.ride_log[i].bike_id.toString();

                    const response = await bike.stopRide(userID, bikeID);
                    console.log(response)
                }
            }
        }
    }
})

router.put('/resetAll', async (req, res) => {
    try {
        const bikes = await admin.getAllFromCollection("bikes");
        let bulkOps = [];

        // Track the next station index for each city
        const cityCounters = {};

        for (const bike of bikes) {
            const stations = cityLocations[bike.city];
            const totalStations = stations.length;

            // Initialize the counter for the city if not already set
            if (!cityCounters[bike.city]) {
                cityCounters[bike.city] = 0;
            }

            // Assign bike to the next station in a round-robin fashion
            const stationIndex = cityCounters[bike.city] % totalStations;
            const position = {
                latitude: stations[stationIndex].latitude,
                longitude: stations[stationIndex].longitude
            };

            // Prepare bulk update operation
            bulkOps.push({
                updateOne: {
                    filter: { _id: bike._id },
                    update: {
                        $set: {
                            current_location: {
                                longitude: position.longitude,
                                latitude: position.latitude
                            }
                        }
                    }
                }
            });

            // Move to the next station for the next bike
            cityCounters[bike.city]++;
        }

        await db.bikes.bulkWrite(bulkOps);

        res.status(200).json({ message: "All bikes have been reset to main stations evenly." });
    } catch (error) {
        console.error("Error resetting bikes:", error);
        res.status(500).json({ error: "Failed to reset bikes." });
    }
});

export default router;
