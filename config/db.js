require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,

        });
        console.log("mongodb connection success! ");
    } catch (err) {
        console.log("mongodb connection failed!", err.message);
    }
};

module.exports = {
    connectDB,
};
