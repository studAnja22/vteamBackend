import dbHelper from "../database/dbHelper.mjs";

const validationHelper = {
    isFormComplete: function isFormComplete(body) {
        const email = body.email;
        const password = body.password;

        if (!email || !password) {
            return { status: 400, error: "Error (400) Form is incomplete: missing email or password" };
        }
        return true;//Form is completed
    },
    isEmailAvailable: async function isEmailAvailable(userEmail, collection) {
        const db = await dbHelper.connectToDatabase();

        try {
            const filter = { email: userEmail };
            let foundEmail = "";

            switch (collection) {
                case 'users':
                    foundEmail = await db.users.findOne(filter);
                    break;
                case 'admin':
                    foundEmail = await db.admin.findOne(filter);
                    break;
                default:
                    return { status: 400, error: "Error: Invalid collection name (user or admin)" };
            }

            if (foundEmail) {
                return { status: 409, error: "Error: Email already in use" };
            }
            return true;//Email is available
        } catch (e) {
            console.error("An error occurred while trying to find email in database");
            return { status: 500, error: "Error: Unexpected error occurred while checking email i database" };
        } finally {
            await db.client.close();
        }
    },
    isCityFormComplete: function isCityFormComplete(body) {
        const city = body.city;

        if (!city) {
            return { status: 400, error: "Error (400) City Form is incomplete: missing city name" };
        }
        return true;//Form is completed
    },
    isCityAvailable: async function isCityAvailable(cityName) {
        const db = await dbHelper.connectToDatabase();

        try {
            const filter = { city: cityName };
            let foundCity = await db.cities.findOne(filter);

            if (foundCity) {
                return { status: 409, error: "Error: City already in use" };
            }
            return true;//City is available
        } catch (e) {
            console.error("An error occurred while trying to find City in database");
            return { status: 500, error: "Error: Unexpected error occurred while looking for a city in the database" };
        } finally {
            await db.client.close();
        }
    },
    isParkingFormComplete: function isParkingFormComplete(body) {
        const form = [body.city, body.address, body.longitude, body.latitude, body.chargingStation];
        let invalidElement = false;

        //Check if the form contains empty sting, null or undefined
        for (let i = 0; i < form.length; i++) {
            if (form[i] === undefined || form[i] === null || form[i] === "") {
                invalidElement = true;
                break;
            }
        }

        if (invalidElement) {
            return { status: 400, error: `Error (400) Parking form is incomplete.` };
        }
        return true;//Form is complete
    },
    doesCityExist: async function doesCityExist(cityName) {
        const db = await dbHelper.connectToDatabase();

        try {
            const filter = { city: cityName };
            let foundCity = await db.cities.findOne(filter);

            if (!foundCity) {
                return { status: 404, error: "Error: City not found" };
            }
            return true;//City is found
        } catch (e) {
            console.error("An error occurred while trying to find City in database");
            return { status: 500, error: "Error: Unexpected error occurred while looking for a city in the database" };
        } finally {
            await db.client.close();
        }
    },
    isParkingLotAvailable: async function isParkingLotAvailable(cityName, address) {
        const db = await dbHelper.connectToDatabase();

        try {
            let foundParking = await db.cities.findOne({
                    city: cityName,
                    $or: [{
                        "parking_locations.address": address,
                    }]

            });

            if (foundParking) {
                return { status: 404, error: `Error: Parking lot already on this street ${address}` };
            }
            return true;//parking lot is available to be registered
        } catch (e) {
            console.error("An error occurred while trying to find City in database");
            return { status: 500, error: "Error: Unexpected error occurred while looking for a city in the database" };
        } finally {
            await db.client.close();
        }
    },
    isSpeedZoneFormComplete: function isSpeedZoneFormComplete(body) {
        const form = [body.city, body.address, body.longitude, body.latitude, body.speedLimit];
        let invalidElement = false;

        //Check if the form contains empty sting, null or undefined
        for (let i = 0; i < form.length; i++) {
            if (form[i] === undefined || form[i] === null || form[i] === "") {
                invalidElement = true;
                break;
            }
        }

        if (invalidElement) {
            return { status: 400, error: `Error (400) Speed zone form is incomplete.` };
        }
        return true;//Form is complete
    },
    isSpeedZoneAvailable: async function isSpeedZoneAvailable(cityName, address) {
        const db = await dbHelper.connectToDatabase();

        try {
            let foundSpeedZone = await db.cities.findOne({
                    city: cityName,
                    $or: [{
                        "speed_zones.address": address,
                    }]

            });

            if (foundSpeedZone) {
                return { status: 404, error: `Error: Speed zone already registered on this street ${address}` };
            }
            return true;//Speed zone available to be registered
        } catch (e) {
            console.error("An error occurred while trying to find City in database");
            return { status: 500, error: "Error: Unexpected error occurred while looking for a city in the database" };
        } finally {
            await db.client.close();
        }
    },
    doesLocationExists: async function doesLocationExists(cityName, address, targetLocation) {
        const db = await dbHelper.connectToDatabase();
        try {
            let foundSpeedZone = "";

            switch (targetLocation) {
                case 'parkingLot':
                    foundSpeedZone = await db.cities.findOne({
                        city: cityName,
                        $or: [{
                            "parking_locations.address": address,
                        }]
                    });
                    break;
                case 'speedZone':
                    foundSpeedZone = await db.cities.findOne({
                        city: cityName,
                        $or: [{
                            "speed_zones.address": address,
                        }]
                    });
                    break;
                default:
                    return { status: 400, error: "Error: invalid target location. (Valid: parkingLot or speedZone)" };
            }

            if (!foundSpeedZone) {
                return { status: 404, error: `Error: '${address}' is not registered in ${targetLocation}` };
            }
            return true;//Location exists in parking_location OR speed_zone
        } catch (e) {
            console.error("An error occurred while trying to find City in database");
            return { status: 500, error: "Error: Unexpected error occurred while looking for a city in the database" };
        } finally {
            await db.client.close();
        }
    },
    isRemoveFormComplete: function isRemoveFormComplete(body) {
        const city = body.city;
        const address = body.address;

        if (!city || !address) {
            return { status: 400, error: "Error (400) Remove Form (Parking or Speed zone) is incomplete: missing city or address" };
        }
        return true;//Form is completed
    }
}

export default validationHelper;
