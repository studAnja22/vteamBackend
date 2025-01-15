import timestamp from '../utils/general/timestamp.mjs';
import bikeHelper from '../utils/api/bike/bikeHelper.mjs';
import validationHelper from '../utils/api/validationHelper.mjs';

const bike = {
    createBike: async function createBike(body) {
        //Form needs city
        const city = await validationHelper.doesCityExist(body.city);

        if (city.error) {
            return city;//404 City not found
        }

        //Get random longitude latitude in chosen city (Stockholm, Göteborg or Karlskrona)
        const location = bikeHelper.randomStartLocation(body.city);
        const currentTimestamp = timestamp.getCurrentTime();

        return await bikeHelper.saveBike(body.city, location, currentTimestamp);
    },
    increaseBattery: async function increaseBattery(bikeId, value) {
        if (!bikeId || !value) {
            return { status: 400, error: "Missing bikeId or value. Unable to update battery." };
        }
        //Check if number is positive
        const parsedValue = parseInt(value, 10);

        if (isNaN(parsedValue) || parsedValue <= 0) {
            return res.status(400).json({ error: 'Invalid value. It must be a positive number.' });
        }

        const filter = { _id: bikeId };
        const increase = { battery: value };

        return await bikeHelper.updateBattery(filter, increase);
    },
    decreaseBattery: async function decreaseBattery(bikeId, value) {
        if (!bikeId || !value) {
            return { status: 400, error: "Missing bikeId or value. Unable to update battery." };
        }
        //Check if number is positive
        const parsedValue = parseInt(value, 10);

        if (isNaN(parsedValue) || parsedValue <= 0) {
            return res.status(400).json({ error: 'Invalid value. It must be a positive number.' });
        }

        const filter = { _id: bikeId };
        const decrease = { battery: -value };

        return await bikeHelper.updateBattery(filter, decrease);
    }
};

export default bike;
