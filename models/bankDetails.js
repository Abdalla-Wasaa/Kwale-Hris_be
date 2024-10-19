const mongoose = require('mongoose')
const bankDetailsSchema = new mongoose.Schema({
    payrollId : String,
    bankAccountName : String,
    bankBranch : String,
    bankAccountNumber : String,
    nhifNumber : String,
    nssfNumber : String,
    
},
{
    timestamps:true
}
)

const BankDetailsModel = mongoose.model("bankdetails", bankDetailsSchema)
module.exports= BankDetailsModel