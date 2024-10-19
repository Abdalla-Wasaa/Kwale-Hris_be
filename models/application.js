const mongoose = require('mongoose')
const applicationSchema = new mongoose.Schema({
 payrollId : String,
 leaveType : String,
 reason : String,
 startDate : String,
 endDate : String,
},
{
    timestamps:true
}
)

const ApplicationModel = mongoose.model("applications", applicationSchema)
module.exports= ApplicationModel