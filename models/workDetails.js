const mongoose = require('mongoose')
const WorkDetailSchema = new mongoose.Schema({
    payrollId:String,
    jobGroup: String,
    payGroup: String,
    pensionScheme : String,
    division: String,
    department : String,
    firstAppointmentDate : String,
    currentAppointmentDate : String,
    dutyStation :String,
    salaryScalePoint : String,
    deployment:String,
    subcounty : String,
    ward : String,
    incrementalMonth : String,
    jobDesignation:String,
    engagementType:String,
    contractEndDate:String,
    village:String,
    designationName:String

    
},
{
    timestamps:true
}
)

const WorkDetailModel = mongoose.model("workdetails", WorkDetailSchema)
module.exports= WorkDetailModel