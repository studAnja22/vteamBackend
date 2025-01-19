import express from 'express';
const router = express.Router();

import bike from '../models/bike.mjs';
//Start the ride
router.put('/start/:user_id/:bike_id', async (req, res) => {
    try {
        const { user_id, bike_id } = req.params;

        const startBikeResult = await bike.startRide(user_id, bike_id);

        if (startBikeResult.error) {
            return res.status(startBikeResult.status).json({
                "status": startBikeResult.status,
                "error": startBikeResult.error
            });
        }

        return res.status(200).json({
            "status": startBikeResult.status,
            "message": "Ride started successfully."
        });
    } catch (e) {
        console.error("Internal server error while trying to start the ride", e);
        return { status: 500, error: "Error (500) while trying to start the ride" };
    }
});
//Stop the ride
router.put('/stop/:user_id/:bike_id', async (req, res) => {
    try {
        const { user_id, bike_id } = req.params;

        const stopBikeResult = await bike.stopRide(user_id, bike_id);

        if (stopBikeResult.error) {
            return res.status(stopBikeResult.status).json({
                "status": stopBikeResult.status,
                "error": stopBikeResult.error
            });
        }

        return res.status(200).json({
            "status": stopBikeResult.status,
            "message": "Ride stopped successfully."
        });
    } catch (e) {
        console.error("Internal server error while trying to stop the ride", e);
        return { status: 500, error: "Error (500) while trying to stop the ride" };
    }
});

//Increase battery
router.put('/battery/increase/:amount/:bike_id', async (req, res) => {
    try {
        const { amount, bike_id } = req.params;

        const updateResult = await bike.increaseBattery(bike_id, amount);

        if (updateResult.error) {
            return res.status(updateResult.status).json({
                "status": updateResult.status,
                "error": updateResult.error
            });
        }

        return res.status(200).json({
            "status": updateResult.status,
            "message": "Battery updated successfully."
        });
    } catch (e) {
        console.error("Internal server error while trying to update bike battery", e);
        return { status: 500, error: "Error (500) while trying to update bike battery" };
    }
});

//decrease battery
router.put('/battery/decrease/:amount/:bike_id', async (req, res) => {
    try {
        const { amount, bike_id } = req.params;
        const updateResult = await bike.decreaseBattery(bike_id, amount);

        if (updateResult.error) {
            return res.status(updateResult.status).json({
                "status": updateResult.status,
                "error": updateResult.error
            });
        }

        return res.status(200).json({
            "status": updateResult.status,
            "message": "Battery updated successfully."
        });
    } catch (e) {
        console.error("Internal server error while trying to update bike battery", e);
        return { status: 500, error: "Error (500) while trying to update bike battery" };
    }
});

//Update bike position
router.put('/:bike_id/position/:longitude/:latitude', async (req, res) => {
    try {
        const { bike_id, longitude, latitude } = req.params;
        const position = {
            latitude: latitude,
            longitude: longitude
        }
        const updateResult = await bike.updatePosition(bike_id, position);

        if (updateResult.error) {
            return res.status(updateResult.status).json({
                "status": updateResult.status,
                "error": updateResult.error
            });
        }

        return res.status(200).json({
            "status": updateResult.status,
            "message": "Bikes location updated successfully."
        });
    } catch (e) {
        console.error("Internal server error while trying to update bike location", e);
        return { status: 500, error: "Error (500) while trying to update bike location" };
    }
});

export default router;
