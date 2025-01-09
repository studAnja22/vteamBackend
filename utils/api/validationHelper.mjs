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
                    console.log("found admin...");
                    
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
            return { status: 400, error: "Error (400) Form is incomplete: missing city name" };
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

        //Check if the form contains empty sting, null, zero (0) or undefined
        const notComplete = form.some(value => !value);

        if (notComplete) {
            return { status: 400, error: `Error (400) Form is incomplete. :(` };
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
    doesParkingLotExist: async function doesParkingLotExist(cityName, address) {
        const db = await dbHelper.connectToDatabase();

        try {
            let foundCity = await db.cities.findOne({
                    city: cityName,
                    $or: [{
                        "parking_locations.address": address,
                    }]

            });

            if (foundCity) {
                return { status: 404, error: `Error: Parking lot already on the this street ${address}` };
            }
            return false;
        } catch (e) {
            console.error("An error occurred while trying to find City in database");
            return { status: 500, error: "Error: Unexpected error occurred while looking for a city in the database" };
        } finally {
            await db.client.close();
        }
    }
}

export default validationHelper;
