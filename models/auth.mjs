import 'dotenv/config'

import dbHelper from '../utils/database/dbHelper.mjs';
import userHelper from '../utils/api/user/userHelper.mjs';
import timestamp from '../utils/general/timestamp.mjs';

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
        const userExists = await auth.emailExists(body.email, "check");
        const userData = await auth.emailExists(body.email, "data");
        //Email not found in database - return.
        if (!userExists || !userData) {
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
        //User can only sign in once on a device at a time
        if(userData.currently_logged_in) {
            return {
                data: {
                    type: "fail",
                    message: "User already signed in",
                    user: {
                        email: userInputEmail
                    }
                }
            }
        }

        const storedHashedPassword = userData.password;

        //Compare passwords. true or false.
        const passwordCorrect = await auth.comparePasswords(userInputPassword, storedHashedPassword);

        if (passwordCorrect) {
            const currentTimestamp = timestamp.getCurrentTime();
            //Password correct. Collect a jwt token.
            const payload = { email: userInputEmail };
            const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h'});

            // Changes key value to show user has signed in on a device
            const filter = {
                _id: userData._id
            }
            const update = {
                currently_logged_in: true,
                last_login: currentTimestamp
            }

            const result = await userHelper.update(filter, update);
            if (result.status === 200) {
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
                //Failed to update users status. 404 or 500 error
                return {
                    data: {
                        type: "fail",
                        message: "500, internal server error while trying to sign into account",
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
        const email = body;
        console.log("email exists", email);
        
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
    },
    logout: async function logout(body) {
        const userData = await auth.emailExists(body.email, "data");

        //Email not found in database - return.
        if (!userData) {
            return {
                data: {
                    type: "fail",
                    message: "Unable to find user.",
                    user: {
                        email: body.email
                    }
                }
            }
        }

        if (!userData.currently_logged_in) {
            return {
                data: {
                    type: "fail",
                    message: "User already logged out.",
                    user: {
                        email: body.email
                    }
                }
            }
        }

        const filter = {
            _id: userData._id
        }
        const update = {
            currently_logged_in: false,
        }

        const result = await userHelper.update(filter, update);
        //All went well, user has signed out
        if (result.status === 200) {
            return {
                data: {
                    type: "success",
                    message: "User successfully logged out",
                    user: {
                        email: body.email,
                        user_id: userData._id.toString()
                        }
                    }
                }
            }
        //Failed to update users status. 404 or 500 error
        return {
            data: {
                type: "fail",
                message: "500, internal server error while trying to sign into account",
                user: {
                    email: body.email,
                    user_id: userData._id.toString()
                    }
                }
            }
    }
}

export default auth;
