const mongoose = require('mongoose')
const departmentSchema = new mongoose.Schema({
    departmentName : String,
    description : String,
    
},
{
    timestamps:true
}
)

const DepartmentModel = mongoose.model("departments", departmentSchema)
module.exports= DepartmentModel