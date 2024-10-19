const mongoose = require('mongoose')
const RelationshipDetailSchema = new mongoose.Schema({
    payrollId : String,
    relationship : String,
    fullName : String,
    phoneNumber:String,
    email : String,
    role : String,
    nationalId : String,
 
},
{
    timestamps:true
}
)

const RelationshipDetailModel = mongoose.model("relationshipdetails", RelationshipDetailSchema)
module.exports= RelationshipDetailModel