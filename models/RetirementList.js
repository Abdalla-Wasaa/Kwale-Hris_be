const mongoose = require('mongoose')
const retirementSchema = new mongoose.Schema({
    payrollId:String,
    reason : String,
    retirementDate: Date,
    status:String
  });
  
const RetirementListModel = mongoose.model('RetirementList', retirementSchema);
module.exports= RetirementListModel




