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
3. create a dotenv file (`.env`) file with these variables:
- PORT: the port number to run the server. Example: 1337
- DB_MONGO: your MongoDB username - for authenticating the database cluster
- DB_PASS: your MongoDB password - paired with the username for authentication
- NODE_ENV: the environment mode for the app. Example "development", "production" or "test".
- SALT_ROUNDS: (integer) used for hashing the password with bcrypt. Example: 10
4. Run the server `nodemon app.mjs`

This repo also contains a Dockerfile.
To run this app with docker please ensure you have installed docker.

1. Build your docker image. `docker build -t name:tag .`
2. Run the container. `docker run --rm -p 8081:1337 --name server name:tag`
The app will run your server on localhost:8081/
Example: `http://localhost:8081/admin/collections/bikes/data`

## API routes
### /user routes
Example on localhost: `localhost:1337/user/details`
- `POST /register`: Register a new user
- `GET /details`: Get all of a single users details
- `PUT /update/name`: Update the users name
- `PUT /update/password`: Update the users password
- `PUT /update/prepaid`: Update the users prepaid card (and log it in their transaction log)

### /admin routes
Example on localhost: `http://localhost:1337/admin/collections/users/data`
- `POST /createAdmin`: Create an admin account
- `GET /collections/:collectionName/data`: View all entries in chosen collection (users, bikes or cities)
- `GET /collections/:collectionName/count`: View how many entries are in chosen collection (users, bikes or cities)

## Known issues
The module errorHelper.handleError(); in directory utils/general/errorHelper.mjs is not well tested and might have unaddressed flaws in it's current state.

## Development
The backend is currently in development and more features will be added shortly.
In future updates, the user and admin will be able to login along with other amazing features. Error handling will be improved.
There will be really cool bikes and cities added too.