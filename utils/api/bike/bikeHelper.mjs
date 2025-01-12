import dbHelper from "../../database/dbHelper.mjs";

const cityLocations = {
    "Stockholm": [
        { latitude: 59.3293, longitude: 18.0686 },//Central Station
        { latitude: 59.3328, longitude: 18.0649 },//Gamla Stan
        { latitude: 59.3428, longitude: 18.0493 },//Odenplan
    ],
    "Göteborg": [
        { latitude: 57.7089, longitude: 11.9746 },//Central Station
        { latitude: 57.7072, longitude: 11.9668 },//Avenyn
        { latitude: 57.7058, longitude: 11.9646 },//Haga
    ],
    "Karlskrona": [
        { latitude: 56.1612, longitude: 15.5869 },//Naval Museum
        { latitude: 56.1608, longitude: 15.5895 },//Stortorget
        { latitude: 56.1624, longitude: 15.5827 },//Campus Gräsvik
    ]
};

const bikeHelper = {
    saveBike: async function saveBike(cityName, location, timestamp) {
        const db = await dbHelper.connectToDatabase();

        try {
            let bike = {
                registered: timestamp,
                city: cityName,
                current_location: {
                    longitude: location.longitude,
                    latitude: location.latitude
                },
                current_speed: 0,
                status: "available",
                battery: 100,
                parked: true,
                rented: false,
                disabled: false,
                color_code: "green",
                ride_log: []
            }

            await db.bikes.insertOne(bike);
            return { status: 200, message: "Bike was successfully created." };
        } catch (e) {
            console.error("Failed to save the bike.", e);
            return { status: 500, error: `Error 500: Something went wrong trying to save the bike. sorry...` };
        } finally {
            await db.client.close();
        }
    },
    randomStartLocation: function randomStartLocation(city) {
        const locationList = cityLocations[city];
        const randomIndex = Math.floor(Math.random() * locationList.length);
        return locationList[randomIndex];
    }
}

export default bikeHelper;
