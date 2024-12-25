import 'dotenv/config'

import bcrypt from 'bcryptjs';

const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

const bcryptHelper = {
    hashPassword: async function hashPassword(password) {
        try {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            return hashedPassword;
        } catch (e) {
            console.error("Error occurred while hashing the password:", e.message);
            return { status: 500, error: `Error 500: Failed to hash the password: ${e.message}` };
        }
    }
}

export default bcryptHelper;
