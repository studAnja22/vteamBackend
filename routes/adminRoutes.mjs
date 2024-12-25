import express from 'express';
const router = express.Router();

import admin from '../models/admin.mjs';
import errorHelper from '../utils/general/errorHelper.mjs';

const validCollections = ['bikes', 'users', 'cities'];

router.post('/createAdmin', async (req, res) => {
    try {
        const result = await admin.createAdmin(req.body, res);

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


export default router;
