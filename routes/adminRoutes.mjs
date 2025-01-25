import express from 'express';
const router = express.Router();

import admin from '../models/admin.mjs';
import cities from '../models/cities.mjs';
import bike from '../models/bike.mjs';
import errorHelper from '../utils/general/errorHelper.mjs';

const validCollections = ['bikes', 'users', 'cities'];

/** Create an admin account */
router.post('/createAdmin', async (req, res) => {
    try {
        const result = await admin.createAdmin(req.body);

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.message === "Admin successfully saved") {
            return res.status(200).json({
                        "status": 200,
                        "message": "Admin successfully created.",
                        "user": req.body.email
                    });
                }
    } catch (e) {
        console.error(`Error during admin/createAdmin`, e);
        errorHelper.handleError(e, res);
    }
});

/** Admin get all data routes */

//Get all entries in chosen collection
router.get('/collections/:collectionName/data', async (req, res) => {
    try {
        const { collectionName } = req.params;

        if (!validCollections.includes(collectionName)) {
            return res.status(400).json({ status: 400, error: "Invalid collection name"});
        }

        const collectionData = await admin.getAllFromCollection(collectionName);

        return res.json(collectionData);
    } catch (e) {
        console.error(`Error in admin/collections/:collectionName/data:`, e);
        errorHelper.handleError(e, res);
    }
});
//Get the number of entries in chosen collection
router.get('/collections/:collectionName/count', async (req, res) => {
    try {
        const { collectionName } = req.params;

        if (!validCollections.includes(collectionName)) {
            return res.status(400).json({ status: 400, error: "Invalid collection name"});
        }

        const collectionData = await admin.countCollectionEntries(collectionName);

        return res.json({entries: collectionData});
    } catch (e) {
        console.error("Error trying to count entries in database", e);
        errorHelper.handleError(e, res);
    }
});

/**Admin City routes */

//Register a new city
router.post('/registerCity', async (req, res) => {
    try {
        const result = await cities.register(req.body);

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.message === "City was successfully saved.") {
            return res.status(200).json({
                        "status": 200,
                        "message": "City was successfully saved.",
                        "city": req.body.city
                    });
                }
    } catch (e) {
        console.error(`Error during admin/registerCity`, e);
        errorHelper.handleError(e, res);
    }
});

/** Parking lots
 * - Add a new parking lot */
router.put('/createParkingLot', async (req, res) => {
    //Form need these params (strings or floats): city, address, longitude, latitude, chargingStation
    try {
        const result = await cities.addParking(req.body);

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.message === "Success. City has now a new parking lot.") {
            return res.status(200).json({
                        "status": 200,
                        "message": `Success. City, ${req.body.city}, has now a new parking lot at ${req.body.address}.`,
                        "city": req.body.city,
                        "address": req.body.address
                    });
                }
    } catch (e) {
        console.error(`Error during admin/createParking`, e);
        errorHelper.handleError(e, res);
    }
});

//Remove a parking lot
router.put('/removeParkingLot', async (req, res) => {
    //Form need these params (strings): city, address
    try {
        const result = await cities.removeLocation(req.body, "parkingLot");

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.message === "Success. Location has been removed.") {
            return res.status(200).json({
                        "status": 200,
                        "message": `Success. City, ${req.body.city}, has now removed a parking lot at ${req.body.address}.`,
                        "city": req.body.city,
                        "address": req.body.address
                    });
                }
    } catch (e) {
        console.error(`Error during admin/removeParking`, e);
        errorHelper.handleError(e, res);
    }
});

/** Speed zones
 * - Add a new speed zone */
router.put('/createSpeedZone', async (req, res) => {
    //Form need these params (strings or floats): city, address, longitude, latitude, speedLimit
    try {
        const result = await cities.addSpeedZone(req.body);

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.message === "Success. City has now a new speed zone.") {
            return res.status(200).json({
                        "status": 200,
                        "message": `Success. City, ${req.body.city}, has now a new speed zone at ${req.body.address}.`,
                        "city": req.body.city,
                        "address": req.body.address,
                        "speed_limit": req.body.speedLimit
                    });
                }
    } catch (e) {
        console.error(`Error during admin/createSpeedZone`, e);
        errorHelper.handleError(e, res);
    }
});

//Remove a speed zone
router.put('/removeSpeedZone', async (req, res) => {
    //Form need these params (strings): city, address
    try {
        const result = await cities.removeLocation(req.body, "speedZone");

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.message === "Success. Location has been removed.") {
            return res.status(200).json({
                        "status": 200,
                        "message": `Success. City, ${req.body.city}, has now removed the speed zone at ${req.body.address}.`,
                        "city": req.body.city,
                        "address": req.body.address
                    });
                }
    } catch (e) {
        console.error(`Error during admin/removeParking`, e);
        errorHelper.handleError(e, res);
    }
});

/**Admin Bike routes */
router.post('/createBike', async (req, res) => {
    try {
        const result = await bike.createBike(req.body);

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.message === "Bike was successfully created.") {
            return res.status(200).json({
                        "status": 200,
                        "message": `Bike was successfully saved somewhere in ${req.body.city}`,
                        "city": req.body.city
                    });
                }
    } catch (e) {
        console.error(`Error during admin/createBike`, e);
        errorHelper.handleError(e, res);
    }
});

/**Admin User routes */

//Suspend a user
router.put('/:user/suspend_user', async (req, res) => {
    // :user is users _id.
    try {
        const { user } = req.params;

        const result = await admin.enableOrDisableUser(user, true);

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.message === "User data updated successfully.") {
            return res.status(200).json({
                "status": 200,
                "message": `User has been suspended successfully`,
            });
        }
    } catch (e) {
        console.error(`Error during admin/createBike`, e);
        errorHelper.handleError(e, res);
    }
});

router.put('/:user/revoke_suspension', async (req, res) => {
    // :user is users _id.
    try {
        const { user } = req.params;

        const result = await admin.enableOrDisableUser(user, false);

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.message === "User data updated successfully.") {
            return res.status(200).json({
                "status": 200,
                "message": `User suspension has been revoked successfully`,
            });
        }
    } catch (e) {
        console.error(`Error during admin/createBike`, e);
        errorHelper.handleError(e, res);
    }
});

export default router;
