const mongoose = require('mongoose')
const revenuesourceSchema = new mongoose.Schema({
    ID : Number,
    revenue_id : Number,
    revenue_name : String,
    revenue_amount : Number,
    revenue_type_id : Number,
},
{
    timestamps:true
})

const revenuesourceModel = mongoose.model("revenueSource", revenuesourceSchema)
module.exports= revenuesourceModel