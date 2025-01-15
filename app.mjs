import 'dotenv/config'

const port = process.env.PORT || 1337;

/**---- import packages ----*/
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';

/**---- import routes ----*/
import admin from './routes/adminRoutes.mjs';
import user from './routes/userRoutes.mjs';
import bike from './routes/bikeRoutes.mjs';

/**------- Express settings -------*/
const app = express();

app.disable('x-powered-by');

app.set("view engine", "ejs");

app.use(express.static(path.join(process.cwd(), "public")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

// don't show the log when it is test
if (process.env.NODE_ENV !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')); // 'combined' outputs the Apache style LOGs
}

app.get("/", (req, res) => res.send({ message: "Hello world! :D" }));

/**------- Routes -------*/
app.use("/admin", admin);
app.use("/user", user);
app.use("/bike", bike);

// app.mjs
console.log("Hello, your app.mjs is running!");

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
