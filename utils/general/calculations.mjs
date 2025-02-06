
const calculate = {
    haversine: function haversine(bikeLon, bikeLat, parkingLon, parkingLat) {
        const earthRadiusInMeters = 6371000;

        if (bikeLat === parkingLat && bikeLon === parkingLon) {
            //Bike has not moved from the parking lot
            return 0;
        }
        const diffLat = calculate.convertDegreeToRadians(bikeLat - parkingLat);
        const diffLon = calculate.convertDegreeToRadians(bikeLon - parkingLon);
        const bikeLatRadians = calculate.convertDegreeToRadians(bikeLat);
        const parkingLatRadians = calculate.convertDegreeToRadians(parkingLat);

        const a = Math.pow(Math.sin(diffLat/2), 2) + Math.pow(Math.sin(diffLon), 2) * Math.cos(bikeLatRadians) * Math.cos(parkingLatRadians);

        const c = 2 * Math.asin(Math.sqrt(a));

        return earthRadiusInMeters * c;
    },
    convertDegreeToRadians: function convertDegreeToRadians(degree) {
        return (degree * Math.PI)/180;
    },
    rideCost: function rideCost(start, finish, time) {
        /**
         * start: parking lot(true) or free parking (false)
         * finish: parking lot(true) or free parking (false)
         * time: duration of ride in ms
         * 
         * The rate is currently 2,5 kr/min, which is 2,5/60000 = 0.00004167 kr/ms
         */
        const rate = 0.00004167;
        const startFee = 30;//konvertera till ms och returnera sedan konverterat till totala priset i kr.

        let cost = startFee + (rate * time);

        //Check for discounts and extra fees
        if (start && finish) {
            //User started from a parking zone and left the bike in a parking zone
            //Good user gets a little discount
            cost = cost - 10;
            if (cost <= 0) {
                return 0;
            }
            return Math.floor(cost);
        }

        if (start && !finish || !start && !finish) {
            //User started from a parking zone or free parking, but left the bike in free parking.
            //Bad user gets an extra fee
            return Math.floor(cost + 20);
        }

        if (!start && finish) {
            //User brought bike from free parking back to a parking zone.
            //Good user bringing the bike home. Big reward. much grateful
            cost = cost - 20;
            if (cost <= 0) {
                return 0;
            }
            return Math.floor(cost);
        }
    }
}

export default calculate;
