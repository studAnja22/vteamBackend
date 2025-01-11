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
        /**The form needs the following params:
         *  city, address, longitude, latitude, chargingStation
         * */
        const completeForm = validationHelper.isParkingFormComplete(body);

        if (completeForm.error) {
            return completeForm;//Form incomplete
        }

        const cityExist = await validationHelper.doesCityExist(body.city)

        if (cityExist.error) {
            return cityExist;//City not found
        }

        const parkingAvailable = await validationHelper.isParkingLotAvailable(body.city, body.address);
        
        if (parkingAvailable.error) {
            return parkingAvailable;//Parking lot already in the city
        }

        return await cityHelper.addParking(body);
    },
    addSpeedZone: async function addSpeedZone(body) {
        const completeForm = validationHelper.isSpeedZoneFormComplete(body);

        if (completeForm.error) {
            return completeForm;//Form incomplete
        }

        const cityExist = await validationHelper.doesCityExist(body.city)

        if (cityExist.error) {
            return cityExist;//City not found
        }

        const zoneAvailable = await validationHelper.isSpeedZoneAvailable(body.city, body.address);
        
        if (zoneAvailable.error) {
            return zoneAvailable;//Speed Zone already registered in the city
        }

        return await cityHelper.addSpeedZone(body);
    },
    removeLocation: async function removeLocation(body, location) {
        //To remove a parking lot you need the following params: city, address.
        const completeForm = validationHelper.isRemoveFormComplete(body);

        if (completeForm.error) {
            return completeForm;//Form incomplete
        }

        const cityExist = await validationHelper.doesCityExist(body.city)

        if (cityExist.error) {
            return cityExist;//404 City not found
        }

        const locationExists = await validationHelper.doesLocationExists(body.city, body.address, location);

        if (locationExists.error) {
            return locationExists;//404 parking not found.
        }

        return await cityHelper.removeLocation(body, location);
    }
}

export default cities;