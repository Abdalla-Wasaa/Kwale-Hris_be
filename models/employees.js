const mongoose = require('mongoose')
const EmployeeSchema = new mongoose.Schema({
    payrollId:String,
    salutation : String,
    fname : String,
    lname : String,
    surname:String,
    email : String,
    kra:String,
    empNationalId:String,
    address : String,
    gender :  String,
    ethnicity : String,
    religion : String,
    phoneNumber : String,
    dob: { type: Date, required: true },
    bloodGroup :String,
    specialNeeds : String,
    userType : String,
    password : String,
    maritalStatus:String,
    homeCounty:String,
    homeSubCounty:String,
    homeWard:String,
    homeVillage:String,
    postalNumber:String,
    postalCode:String
   
},
{
    timestamps:true
}
)

const EmployeeModel = mongoose.model("employees", EmployeeSchema)
module.exports= EmployeeModel