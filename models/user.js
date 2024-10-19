const mongoose = require('mongoose')
const UserSchema = new mongoose.Schema({
    fname : String,
    lname : String,
    email : String,
    mobile : String,
    // designation : String,
    employeeId :String,
    username : String,
    userType : String,
    password : String
})

const UserModel = mongoose.model("users", UserSchema)
module.exports= UserModel