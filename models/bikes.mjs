import bcryptHelper from '../utils/authentication/bcryptHelper.mjs';
import dbHelper from '../utils/database/dbHelper.mjs';
import timestamp from '../utils/general/timestamp.mjs';
import bikeHelper from '../utils/api/bike/bikeHelper.mjs';
import validationHelper from '../utils/api/validationHelper.mjs';

const bikes = {
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
    }
};

export default bikes;
