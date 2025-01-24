import 'dotenv/config'

import dbHelper from '../utils/database/dbHelper.mjs';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

const auth = {
    login: async function login(body) {
        const userInputEmail = body.email;
        const userInputPassword = body.password;

        //Check if user submitted email and password
        if (!userInputEmail || !userInputPassword) {
            return {
                data: {
                    type: "fail",
                    message: "email or password missing",
                    user: {
                        email: userInputEmail
                    }
                }
            }
        }
        //Check if user in db
        const userExists = await auth.emailExists(body, "check");
        //Email not found in database - return.
        if (!userExists) {
            return {
                data: {
                    type: "fail",
                    message: "incorrect username",
                    user: {
                        email: userInputEmail
                    }
                }
            }
        }

        const userData = await auth.emailExists(body, "data");

        if (!userData) {
            return {
                data: {
                    type: "fail",
                    message: "500. Couldn't get user data.",
                    user: {
                        email: userInputEmail
                    }
                }
            }
        }

        const db = await dbHelper.connectToDatabase();
        let storedHashedPassword;
        //Get hashed password from database
        try {
            const filter = { email: userInputEmail };
            const user = await db.users.findOne(filter);

            storedHashedPassword = user.password;
        } catch (e) {
            console.error('Error getting password from database:', e);
            return { error: "An error occurred while trying to get the password from database" };
        } finally {
            await db.client.close();
        }

        //Compare passwords. true or false.
        const passwordCorrect = await auth.comparePasswords(userInputPassword, storedHashedPassword);

        if (passwordCorrect) {
            //Password correct. Collect a jwt token.
            const payload = { email: userInputEmail };

            const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h'});

            return {
                data: {
                    type: "success",
                    message: "User successfully logged in",
                    user: {
                        email: userInputEmail,
                        user_id: userData._id.toString()
                    },
                    token: token
                }
            }
        }

        //Password was incorrect
        return {
            data: {
                type: "fail",
                message: "incorrect password",
                user: {
                    email: userInputEmail
                }
            }
        }
    },
    emailExists: async function emailExists(body, task) {
        const email = body.email;

        const db = await dbHelper.connectToDatabase();
        try {
            const filter = { email: email };
            const foundEmail = await db.users.findOne(filter);

            switch (task) {
                case "check":
                    //Email was found in the database
                    if (foundEmail) {
                        return true;
                    }
                    //Email not found in the database
                    return false;
                case "data":
                    // return user data or null if it didn't find user
                    return foundEmail;
                default:
                    return false;
            }
        } catch (e) {
            console.error("Error: an error occurred while checking if user email already in db");
            return null;
        } finally {
            await db.client.close();
        }
    },
    comparePasswords: async function comparePasswords(userInputPassword, storedHashedPassword) {
        try {
            const result = await bcrypt.compare(userInputPassword, storedHashedPassword);
            if (result) {
                // Passwords match, authentication successful. returns true
                return result;
            } else {
                // Passwords not a match, authentication failed. returns false
                return result;
            }
        } catch (e) {
            console.error('Error comparing passwords:', e);
            return { error: "Error during password comparison" };
        }
    },
    checkToken: function checkToken(req, res, next) {
        let token = req.headers['x-access-token'];

        //No Token
        if (!token) {
            //Ensure these are empty
            auth.token = "";
            auth.user = "";
            return res.status(401).json({
                errors: {
                    status: 401,
                    source: req.path,
                    title: "No token",
                    detail: "No token provided in request headers"
                }
            });
        }

        //Token exists. Lets verify it.
        jwt.verify(token, jwtSecret, function(e, decoded) {
            if (e) {
                // not a valid token
                return res.status(500).json({
                    errors: {
                        status: 500,
                        source: req.path,
                        title: "Failed authentication",
                        detail: e.message
                    }
                });
            }
            // Valid token proceed to next route
            req.user = { email: decoded.email};
            return next();
        });
    },
    isTokenValid: function isTokenValid(req, res) {
        let token = req.headers['x-access-token'];

        if (token) {
            try {
                jwt.verify(token, jwtSecret);
                // Token is valid
                return true;
            } catch (e) {
                // Token invalid
                console.error("Invalid token.");
                return false;
            }
        } else {
            // No token saved
            console.error("No token found.")
            return false;
        }
    }
}

export default auth;
