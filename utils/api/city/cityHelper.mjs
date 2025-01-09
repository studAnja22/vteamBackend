import dbHelper from "../../database/dbHelper.mjs";
import timestamp from "../../general/timestamp.mjs";

const cityHelper = {
    saveCity: async function saveCity(cityName, timestamp) {
        const db = await dbHelper.connectToDatabase();

        try {
            let newCity = {
                city: cityName,
                city_registered: timestamp,
                status: "active",
                parking_locations: [],
                speed_zones: []
            }

            await db.cities.insertOne(newCity);
            return { status: 200, message: "City was successfully saved." };
        } catch (e) {
            console.error("Failed to save the city. Sad times.", e);
            return { status: 500, error: `Error 500: Something went wrong trying to save the city. Ops...` };
        } finally {
            await db.client.close();
        }
    },
    addParking: async function addParking(body) {
        const db = await dbHelper.connectToDatabase();
        try {
            const currentTimestamp = timestamp.getCurrentTime();
            const filter = { city: body.city };
            let isChargingStation = false;

            if (body.chargingStation === 'true') {
                isChargingStation = true;
            }

            const newParkingLot = {
                $push: {
                    parking_locations: {
                        status: "active",
                        registered: currentTimestamp,
                        address: body.address,
                        longitude: body.longitude,
                        latitude: body.latitude,
                        charging_station: isChargingStation,
                        maintenance: false,
                    }
                }
            }

            const result = await db.cities.updateOne(
                filter,
                newParkingLot,
            );

            if (result.matchedCount === 0) {
                return { status: 404, error: "No City found matching the given filter." };
            }

            if (result.modifiedCount === 0) {
                return { status: 500, error: "Failed to add a new parking lot to City" };
            }

            return { status: 200, message: "Success. City has now a new parking lot." };
        } catch (e) {
            console.error("Internal server error while trying to update document", e);
            return { status: 500, error: "Error (500) while trying to add a new parking lot to the City." };
        } finally {
            db.client.close();
        }
    }
}

export default cityHelper;
