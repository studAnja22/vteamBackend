import dbHelper from "../../database/dbHelper.mjs";

const adminHelper = {
    saveAdmin: async function saveAdmin(body, hashedPassword, timestamp) {
        const db = await dbHelper.connectToDatabase();

        try {
            let newAdmin = {
                name: null,
                email: body.email,
                password: hashedPassword,
                account_created: timestamp,
                last_login: null,
                role: "admin",
                status: "active",
                activity_log: []
            }

            await db.admin.insertOne(newAdmin);
            return { status: 200, message: "Admin successfully saved" };
        } catch (e) {
            console.error("Failed to save admin", e);
            return { status: 500, error: `Error 500: Something went wrong trying to save admin.` };
        } finally {
            await db.client.close();
        }
    }
}

export default adminHelper;
