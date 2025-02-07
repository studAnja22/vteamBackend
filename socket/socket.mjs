/**------- Sockets -------*/
import { Server } from 'socket.io';
import bike from '../models/bike.mjs';
import admin from '../models/admin.mjs';
import dbHelper from "../utils/database/dbHelper.mjs";
import { ObjectId } from "mongodb";
const db = await dbHelper.connectToDatabase();

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', async (socket) => {
        const all_bikes = await admin.getAllFromCollection("bikes");
        socket.emit("initial_data", all_bikes);

        // one user
        socket.on("single_content", async (data) => {
            await bike.updatePosition(data.bikeID, data.position);
            const updated_bikes = await admin.getAllFromCollection("bikes");

            io.emit("single_content", updated_bikes);
        });

        // multiple users
        socket.on("content", async (data) => {
            let bulkOps = [];

            for (const rental of data.rentals) {
                const latitude = rental[2][data.i];
                const longitude = rental[2][data.i+1];
                if (latitude && longitude) {
                    bulkOps.push({ updateOne: { filter: { _id: ObjectId.createFromHexString(rental[1]) }, update: { $set: { current_location: { longitude: longitude, latitude: latitude } } } } })
                }
            }

            db.bikes.bulkWrite(bulkOps)
                .then(result => console.log(result))
                .catch(err => console.error(err));

            const updated_bikes = await admin.getAllFromCollection("bikes");

            io.emit("content", updated_bikes);
        });

        socket.on('disconnect', () => {
            console.log("Disconnected");
        });
    });
}

export default initSocket;
