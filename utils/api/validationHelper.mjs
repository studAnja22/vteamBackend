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
            console.log("validationHelper: This is collection:", collection);
            
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
    }
}

export default validationHelper;
