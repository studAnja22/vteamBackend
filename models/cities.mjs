import validationHelper from '../utils/api/validationHelper.mjs'
import timestamp from '../utils/general/timestamp.mjs'
import cityHelper from '../utils/api/city/cityHelper.mjs';

const cities = {
    register: async function register(body) {
        const completeForm = validationHelper.isCityFormComplete(body);

        if (completeForm.error) {
            return completeForm;//Form incomplete
        }

        const newCity = await validationHelper.isCityAvailable(body.city);

        if (newCity.error) {
            return newCity;//City is a duplicate
        }

        const currentTimestamp = timestamp.getCurrentTime();

        return await cityHelper.saveCity(body.city, currentTimestamp);
    },
    addParking: async function addParking(body) {
        //
        const completeForm = validationHelper.isParkingFormComplete(body);

        if (completeForm.error) {
            return completeForm;//Form incomplete
        }

        const cityExist = await validationHelper.doesCityExist(body.city)

        if (cityExist.error) {
            return cityExist;//City not found
        }

        const parkingExist = await validationHelper.doesParkingLotExist(body.city, body.address);
        
        if (parkingExist.error) {
            return parkingExist;//Parking lot already in the city
        }

        return await cityHelper.addParking(body);
    }
}

export default cities;