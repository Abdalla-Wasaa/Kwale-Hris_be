const mongoose = require('mongoose')
const educationBackgroundSchema = new mongoose.Schema({
    payrollId : String,
    institutionName : String,
    achievements : String,
    graduationYear : String,
    courseName : String,
},
{
    timestamps:true
}
)

const educationBackgroundModel = mongoose.model("educationbackgrounds", educationBackgroundSchema)
module.exports= educationBackgroundModel