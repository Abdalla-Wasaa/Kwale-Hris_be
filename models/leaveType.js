const mongoose = require('mongoose')
const leaveTypeSchema = new mongoose.Schema({
    leaveTypeName : String,
    description : String,
    
},
{
    timestamps:true
}
)

const LeaveTypeModel = mongoose.model("leavetypes", leaveTypeSchema)
module.exports= LeaveTypeModel