# WizardsOnWheels Backend API
This backend is currently under development.
This is a backend API for handling a school project - a bike rental service.

## Features (under development)
- Registration of admin and user accounts
- Admin controls for handling users
- User controls for handling their account

## Setup instructions
1. clone the repository
2. npm install
3. install and create a dotenv file (`.env`) file (npm install dotenv --save) with these variables:
- PORT: the port number to run the server. Example: 1337
- DB_MONGO: your MongoDB username - for authenticating the database cluster
- DB_PASS: your MongoDB password - paired with the username for authentication
- NODE_ENV: the environment mode for the app. Example "development", "production" or "test".
- SALT_ROUNDS: (integer) used for hashing the password with bcrypt. Example: 10
4. Run the server with either `nodemon app.mjs` or `node app.mjs`

This repo also contains a Dockerfile.
To run this app with docker please ensure you have installed docker.

1. Build your docker image. `docker build -t name:tag .`
2. Run the container. `docker run --rm -p 8081:1337 --name server name:tag`
The app will run your server on localhost:8081/
Example: `http://localhost:8081/admin/collections/bikes/data`

## API routes
### /user routes
Example on localhost: `localhost:1337/user/details`
- `POST /register`: Register a new user.
- `GET /details`: Get all data on one user.
- `PUT /update/name`: Update the users name.
- `PUT /update/password`: Update the users password.
- `PUT /update/prepaid`: Update the users prepaid card (and log it in their transaction log).
- `PUT /update/image`: User can update their profile picture.
The form needs the following params:  
`email`: The users email.  
`image`: The image user want to change to.  

Example of complete form:  
{  
  "email": "teat@test",  
  "image": "cool.png"  
}  

### /admin routes
Example on localhost: `http://localhost:1337/admin/collections/users/data`
- `POST /createAdmin`: Create an admin account
- `GET /collections/:collectionName/data`: View all entries in chosen collection (users, bikes or cities)
- `GET /collections/:collectionName/count`: View how many entries are in chosen collection (users, bikes or cities)

#### /admin city routes  
In the city collection we store data about a city, its parking lots and speed zones.  
The following routes handles registering a city, adding and removing parking lots and speed zones.  

- `POST /registerCity`: Register a city. (example: city: Gävle)  
  
##### Create a parking lot or speed zone
- `PUT /createParkingLot`: Add a new parking lot to a city. 
The form needs the following params:  
`city` (string): The name of the City.  
`address` (string): The address of the parking lot.  
`longitude` (float): The longitude of the parking lot.  
`latitude` (float): The latitude of the parking lot.  
`chargingStation` (string or bool): ("true" or "false") Indicates if the parking lot has a charging station.  

Example of complete form:  
{  
  "city": "Göteborg",  
  "address": "Cool Street 1",  
  "longitude": 1.23,  
  "latitude": 4.56,  
  "chargingStation": "true"  
}

- `PUT /createSpeedZone`: Add a new speed zone to a city  
The form need the following params:  
`city` (string): The name of the City.  
`address` (string): The address of the parking lot.  
`longitude` (float): The longitude of the parking lot.  
`latitude` (float): The latitude of the parking lot.  
`speedLimit` (int): The speed limit of the zone  
  
##### Remove a parking lot or speed zone
- `PUT /removeParkingLot`: Removes a parking lot.  
The form needs the following params: `city` and `address`
- `PUT /removeSpeedZone`: Removes a speed zone.  
The form needs the following params: `city` and `address`

### /admin bike routes  
- `POST /createBike`: Create a bike on a random location in a city.  
The form need the following params:  
`city`: The city name. Currently only these 3 are valid:  
`Stockholm`, `Göteborg` and `Karlskrona`.

### /bike routes
- `PUT /battery/increase/:amount/:bike_id`: charge battery. example /battery/increase/10/:bike123 will increase bike123 with battery with 10 point. Battery will never exceed 100 points.
- `PUT /battery/decrease/:amount/:bike_id`: drain battery. Battery will never be lower than 0 points.


## Known issues
The module errorHelper.handleError(); in directory utils/general/errorHelper.mjs is not well tested and might have unaddressed flaws in it's current state.

## Development
The backend is currently in development and more features will be added shortly.
In future updates, the user and admin will be able to login along with other amazing features. Error handling will be improved.
There will be really cool bikes and cities added too.