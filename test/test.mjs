import 'dotenv/config'
import request from "supertest";
import { expect } from "chai";

/**---- import ----*/
import app from "../app.mjs";

let testUser = {
    email: `FancyUser2${Date.now()}@test.se`,
    password: "superSafePassword"
}

let userWithShortPassword = {
    email: `FancyUser2${Date.now()}@test.se`,
    password: "short"
}

const incompleteForm = {
    email: "",
    password: "",
}

let userId;
const testBikeId = "67a28ea739966188c6fb1925";

describe("POST users", () => {
    before(function (done) {
    this.timeout(3000);
    setTimeout(done, 2000);
    });

    it("Shouldn't register user if form is incomplete", (done) => {
        request(app)
            .post("/user/register")
            .send(incompleteForm)
            .expect(400)
            .then((res) => {
                expect(res.body.error).to.be.eql("Error (400) Form is incomplete: missing email or password");
                done();
            })
            .catch((err) => done(err));
        });

    it("Shouldn't register new user with short password.", (done) => {
        request(app)
            .post("/user/register")
            .send(userWithShortPassword)
            .expect(400)
            .then((res) => {
                expect(res.body.error).to.be.eql("Password must be at least 8 characters long");
                done();
            })
            .catch((err) => done(err));
        });

    it("Should register new user with uniq email.", (done) => {
        request(app)
            .post("/user/register")
            .send(testUser)
            .expect(200)
            .then((res) => {
                expect(res.body.user).to.be.eql(testUser.email);
                done();
            })
            .catch((err) => done(err));
        });

    it("Shouldn't register user if username is taken.", (done) => {
    request(app)
        .post("/user/register")
        .send(testUser)
        .expect(409)
        .then((res) => {
            expect(res.body.error).to.be.eql("Error: Email already in use");
            done();
        })
        .catch((err) => done(err));
    });
});

describe("GET users", () => {
    before(function (done) {
    this.timeout(3000);
    setTimeout(done, 2000);
    });

    it("Shouldn't get user data with wrong username", (done) => {
        request(app)
            .get("/user/details/Ops")
            .expect(404)
            .then((res) => {
                expect(res.body.error).to.be.eql("No user found matching the given filter. email: Ops");
                done();
            })
            .catch((err) => done(err));
        });

    it("Should get user details.", (done) => {
        request(app)
            .get(`/user/details/${testUser.email}`)
            .expect(200)
            .then((res) => {
                userId = res.body.result._id;
                expect(res.body.result.email).to.be.eql(testUser.email);
            done();
            })
            .catch((err) => done(err));
        });
});

describe("PUT users", () => {
    before(function (done) {
    this.timeout(3000);
    setTimeout(done, 2000);
    });

    it("Should add funds to prepaid card.", (done) => {
        request(app)
            .put("/user/update/prepaid")
            .send({
                email: testUser.email,
                amount: 2000
            })
            .expect(200)
            .then((res) => {
                expect(res.body.message).to.be.eql("Successfully added funds to prepaid");
                done();
            })
            .catch((err) => done(err));
        });
});

describe("POST oAuth", () => {
    before(function (done) {
    this.timeout(3000);
    setTimeout(done, 2000);
    });

    it("Should login user", (done) => {
        request(app)
            .post("/oauth/login")
            .send(testUser)
            .expect(201)
            .then((res) => {
                expect(res.body.message).to.be.eql("User successfully logged in");
                done();
            })
            .catch((err) => done(err));
        });
});

describe("POST admin", () => {
    before(function (done) {
    this.timeout(3000);
    setTimeout(done, 2000);
    });

    it("Should create a bike", (done) => {
        request(app)
            .post("/admin/createBike")
            .send({
                city: "Stockholm"
            })
            .expect(200)
            .then((res) => {
                expect(res.body.message).to.be.eql("Bike was successfully saved somewhere in Stockholm");
                done();
            })
            .catch((err) => done(err));
        });
});

describe("PUT bikes", () => {
    before(function (done) {
    this.timeout(3000);
    setTimeout(done, 2000);
    });

    it("Shouldn't start a ride with invalid id", (done) => {
        request(app)
            .put(`/bike/start/${userId}/${testBikeId}1`)
            .expect(400)
            .then((res) => {
                expect(res.body.error).to.be.eql(`Invalid id format. id must be 24 characters. user id: ${userId}, bike id: ${testBikeId}1`);
                done();
            })
            .catch((err) => done(err));
        });

    it("Should start a ride for user", (done) => {
        request(app)
            .put(`/bike/start/${userId}/${testBikeId}`)
            .expect(200)
            .then((res) => {
                expect(res.body.message).to.be.eql("Ride started successfully.");
                done();
            })
            .catch((err) => done(err));
        });

    it("Shouldn't start a ride for user who is already renting a bike", (done) => {
        request(app)
            .put(`/bike/start/${userId}/${testBikeId}`)
            .expect(409)
            .then((res) => {
                expect(res.body.error).to.be.eql("Error: User can only rent one bike.");
                done();
            })
            .catch((err) => done(err));
        });

    it("Should stop a ride for user", (done) => {
        request(app)
            .put(`/bike/stop/${userId}/${testBikeId}`)
            .expect(200)
            .then((res) => {
                expect(res.body.message).to.be.eql("Ride stopped successfully.");
                done();
            })
            .catch((err) => done(err));
        });
});

describe("PUT users", () => {
    before(function (done) {
    this.timeout(3000);
    setTimeout(done, 2000);
    });

    it("Should pay for ride with prepaid", (done) => {
        request(app)
            .put(`/user/${testUser.email}/pay/prepaid/`)
            .expect(200)
            .then((res) => {
                expect(res.body.message).to.be.eql("User has paid off their debt with prepaid.");
                done();
            })
            .catch((err) => done(err));
        });
});

describe("POST oAuth", () => {
    before(function (done) {
    this.timeout(3000);
    setTimeout(done, 2000);
    });

    it("Should logout user", (done) => {
        request(app)
            .post("/oauth/logout")
            .send(testUser)
            .expect(201)
            .then((res) => {
                expect(res.body.message).to.be.eql("User successfully logged out");
                done();
            })
            .catch((err) => done(err));
        });

    it("Shouldn't logout user when user is already logged out.", (done) => {
        request(app)
            .post("/oauth/logout")
            .send(testUser)
            .expect(400)
            .then((res) => {
                expect(res.body.message).to.be.eql("User already logged out.");
                done();
            })
            .catch((err) => done(err));
        });

    // after(function (done) {
    // process.exit(0);
    // });
});