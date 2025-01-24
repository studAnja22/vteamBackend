import 'dotenv/config';
import express from 'express';
import auth from "../models/auth.mjs";

const router = express();

router.get("/getAccessToken", async (req, res) => {
    const params = `?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${req.query.code}`;

    await fetch(`https://github.com/login/oauth/access_token${params}`, {
        method: "POST",
        headers: {
            "Accept": "application/json"
        }
    }).then((response) => {
        return response.json();
    }).then((data) => {
        res.json(data);
    });
});

router.get("/getUserData", async (req, res) => {
    req.get("Authorization");
    await fetch("https://api.github.com/user", {
        method: "GET",
        headers: {
            "Authorization": req.get("Authorization")
        }
    }).then((response) => {
        return response.json()
    }).then((data) => {
        res.json(data);
    });
});

router.post("/login", async (req, res) => {
    try {
        const result = await auth.login(req.body, req);

        if (result.data.type == 'fail') {
            return res.status(400).json({ message: result.data.message });
        }

        if (result.data.type == 'success') {
            return res.status(201).json({
                message: result.data.message,
                _id: result.data.user.user_id,
                email: result.data.user.email,
                token: result.data.token
            });
        }
    } catch (e) {
        console.error("Error logging in...:", e);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
