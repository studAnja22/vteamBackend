import bcryptHelper from '../utils/authentication/bcryptHelper.mjs';
import dbHelper from '../utils/database/dbHelper.mjs';
import timestamp from '../utils/general/timestamp.mjs';
import userHelper from '../utils/api/user/userHelper.mjs';
import validationHelper from '../utils/api/validationHelper.mjs';

const user = {
    register: async function register(body) {
        const collection = "users";
        const completeForm = validationHelper.isFormComplete(body);

        if (completeForm.error) {
            return completeForm;//Form incomplete
        }

        if (body.password.length < 8) {
            return { status: 400, error: "Password must be at least 8 characters long" };
        }

        const uniqEmail = await validationHelper.isEmailAvailable(body.email, collection);

        if (uniqEmail.error) {
            return uniqEmail;//Email is a duplicate
        }

        const hashedPassword = await bcryptHelper.hashPassword(String(body.password));
        const currentTimestamp = timestamp.getCurrentTime();

        return await userHelper.saveUser(body, hashedPassword, currentTimestamp);
    },
    getDetails: async function getDetails(userEmail) {
        if (!userEmail) {
            return { status: 400, error: "Unable to get users data without their email." };
        }

        const filter = {
            email: userEmail
        }

        const db = await dbHelper.connectToDatabase();
        if (db.error) {
            return db;//Could not connect to database
        }
        const collection = db.users;
        return await dbHelper.findDocument(db, filter, collection);
    },
    updateName: async function updateName(userEmail, userName) {
        if (!userEmail) {
            return { status: 400, error: "Missing users email - can't update user name." };
        }

        const filter = { email: userEmail };
        const updateName = { name: String(userName) };

        return await userHelper.update(filter, updateName);
    },
    updatePassword: async function updatePassword(userEmail, userPassword) {
        if (!userEmail) {
            return { status: 400, error: "Missing users email - can't update user password." };
        }

        if (!userPassword || userPassword.length < 8) {
            return { status: 400, error: "New password must be at least 8 characters long" };
        }

        const securePassword = await bcryptHelper.hashPassword(String(userPassword));

        if (securePassword.error) {
            return securePassword;//Failed to hash the password.
        }

        const filter = { email: userEmail };
        const updatePassword = { password: securePassword };

        return await userHelper.update(filter, updatePassword);
    },
    updatePrePaid: async function updatePrePaid(userEmail, amountToAdd) {
        if (!userEmail) {
            return { status: 400, error: "Missing users email - can't add money to prepaid card." };
        }

        if (isNaN(amountToAdd) || amountToAdd <= 0) {
            return res.status(400).json({ 
                status: 400,
                error: "Invalid amount. Please provide a positive number."
            });
        }

        const filter = { email: userEmail };
        return await userHelper.increase(filter, amountToAdd);
    },
    updateImage: async function updateImage(userEmail, userImage) {
        if (!userEmail) {
            return { status: 400, error: "Missing users email - can't update users profile picture." };
        }

        if (!userImage) {
            return { status: 400, error: "Somehow there's no user image in the form..." };
        }

        const filter = { email: userEmail };
        const updatePassword = { img: userImage };

        return await userHelper.update(filter, updatePassword);
    }
};

export default user;
