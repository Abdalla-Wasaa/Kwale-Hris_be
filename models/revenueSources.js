const mongoose = require('mongoose')
const RevenueSchema = new mongoose.Schema({
    ID : Number,
    revenue_id : Number,
    revenue_name : String,
    revenue_amount : Number,
    revenue_type_id : Number, 
    },
    {
        timestamps:true
    }
    )

const revenueModel = mongoose.model("revenueSource", RevenueSchema)
module.exports= revenueModel