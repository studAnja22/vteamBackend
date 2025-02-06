import bcryptHelper from '../utils/authentication/bcryptHelper.mjs';
import timestamp from '../utils/general/timestamp.mjs';
import userHelper from '../utils/api/user/userHelper.mjs';
import validationHelper from '../utils/api/validationHelper.mjs';
import auth from './auth.mjs';

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

        return await userHelper.getUser(userEmail);
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

        const userData = await auth.emailExists(userEmail, "data");

        if (!userData) {
            return { status: 404, error: "Something went wrong, Unable to find user." };
        }

        if (isNaN(amountToAdd) || amountToAdd <= 0) {
            return { status: 400, error: "Invalid amount. Please provide a positive number." };
        }
        const prepaidBalance = userData.prepaid_balance;

        const filter = { email: userEmail };
        return await userHelper.increase(filter, amountToAdd, prepaidBalance);
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
    },
    payDebt: async function payDebt(userEmail, typeOfPayment) {
        if (!userEmail) {
            return { status: 400, error: "Missing users email - can't add money to prepaid card." };
        }

        const userData = await auth.emailExists(userEmail, "data");

        if (!userData) {
            return { status: 404, error: "Something went wrong, Unable to find user." };
        }

        const prepaidBalance = userData.prepaid_balance;
        const userDebt = userData.monthly_debt;

        //No partial payment accepted.
        if (userDebt > prepaidBalance) {
            //Not enough balance to pay off the debt in full.
            return { status: 400, error: "Not enough funds on prepaid card to pay off the debt." };
        }

        if (userDebt === 0) {
            return { status: 400, error: "User is debt free." };
        }

        const filter = { email: userEmail };

        return await userHelper.payment(filter, typeOfPayment, userDebt, prepaidBalance)
    }
};

export default user;
