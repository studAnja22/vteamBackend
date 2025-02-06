import express from 'express';
const router = express.Router();

import user from '../models/user.mjs';
import errorHelper from '../utils/general/errorHelper.mjs';
//Register a user account
router.post('/register', async (req, res) => {
    try {
        const result = await user.register(req.body);

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.message === "User successfully registered.") {
            return res.status(200).json({
                        "status": 200,
                        "message": "User successfully registered.",
                        "user": req.body.email
                    });
                }
    } catch (e) {
        console.error(`Error during user/register`, e);
        errorHelper.handleError(e, res);
    }
});
//Get details of a single account
router.get('/details/:email', async (req, res) => {
    try {
        const {email} = req.params;
        const result = await user.getDetails(email);

        if (result.error) {
            return res.status(result.status).json({
                "status": result.status,
                "error": result.error
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                "status": 404,
                "error": `No data found on this user with email: ${email}`
            });
        }

        return res.status(200).json({
            result
        });
    } catch (e) {
        console.error(`Error during user/register`, e);
        errorHelper.handleError(e, res);
    }
});

//User pay off their monthly debt with prepaid
router.put('/:userEmail/pay/prepaid/', async (req, res) => {
    try {
        const {userEmail} = req.params;
        const updateResult = await user.payDebt(userEmail, "prepaid");

        if (updateResult.error) {
            return res.status(updateResult.status).json({
                "status": updateResult.status,
                "error": updateResult.error
            });
        }

        return res.status(200).json({
            "status": updateResult.status,
            "message": "User has paid off their debt with prepaid."
        });
    } catch (e) {
        console.error("D:", e);
        return { status: 500, error: "Sadness" };
    }
});

//User pay off their monthly debt by monthly bill
router.put('/:userEmail/pay/bill/', async (req, res) => {
    try {
        const {userEmail} = req.params;
        const updateResult = await user.payDebt(userEmail, "bill");

        if (updateResult.error) {
            return res.status(updateResult.status).json({
                "status": updateResult.status,
                "error": updateResult.error
            });
        }

        return res.status(200).json({
            "status": updateResult.status,
            "message": "User has paid off their debt by monthly bill."
        });
    } catch (e) {
        console.error("D:", e);
        return { status: 500, error: "Sadness" };
    }
});


//Update user info: name
router.put('/update/name', async (req, res) => {
    try {
        const userEmail = req.body.email;
        const userName = req.body.name;
        const updateResult = await user.updateName(userEmail, userName);

        if (updateResult.error) {
            return res.status(updateResult.status).json({
                "status": updateResult.status,
                "error": updateResult.error
            });
        }

        return res.status(200).json({
            "status": updateResult.status,
            "message": "Name updated successfully."
        });
    } catch (e) {
        console.error("Internal server error while trying to update document");
        return { status: 500, error: "Error (500) while trying to update user name" };
    }
});
//Update user password
router.put('/update/password', async (req, res) => {
    try {
        const userEmail = req.body.email;
        const userPassword = req.body.password;
        const updateResult = await user.updatePassword(userEmail, userPassword);

        if (updateResult.error) {
            return res.status(updateResult.status).json({
                "status": updateResult.status,
                "error": updateResult.error
            });
        }

        return res.status(200).json({
            "status": updateResult.status,
            "message": "Successfully changed password."
        });
    } catch (e) {
        console.error("Internal server error while trying to update document");
        return { status: 500, error: "Error (500) while trying to update user name" };
    }
});
//Add money to prepaid card & the transaction log
router.put('/update/prepaid', async (req, res) => {
    try {
        const userEmail = req.body.email;
        const amountToAdd = parseInt(req.body.amount);
        const updateResult = await user.updatePrePaid(userEmail, amountToAdd);

        if (updateResult.error) {
            return res.status(updateResult.status).json({
                "status": updateResult.status,
                "error": updateResult.error
            });
        }

        return res.status(200).json({
            "status": updateResult.status,
            "message": "Successfully added funds to prepaid"
        });
    } catch (e) {
        console.error("Internal server error while trying to add funds to prepaid.", e);
        return { status: 500, error: "Error (500) while trying to add funds to prepaid." };
    }
});

//Update users img
router.put('/update/image', async (req, res) => {
    try {
        const userEmail = req.body.email;
        const userImage = req.body.image;
        const updateResult = await user.updateImage(userEmail, userImage);

        if (updateResult.error) {
            return res.status(updateResult.status).json({
                "status": updateResult.status,
                "error": updateResult.error
            });
        }

        return res.status(200).json({
            "status": updateResult.status,
            "message": "Successfully changed image."
        });
    } catch (e) {
        console.error("Internal server error while trying to update document");
        return { status: 500, error: "Error (500) while trying to update user profile picture" };
    }
})
export default router;
