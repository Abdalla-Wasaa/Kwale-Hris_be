const { connectDB } = require("./config/db");
const cors = require('cors')
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const salt = 10;
const jwt = require('jsonwebtoken');
const multer = require('multer');
const XLSX = require('xlsx');
const csvtojson = require('csvtojson');
const cron = require('node-cron');
const https = require('https');
const axios = require('axios');
const express = require ('express');
const EmployeeModel = require("./models/employees");
const DepartmentModel = require("./models/departments");
const LeaveTypeModel = require("./models/leaveType");
const ApplicationModel = require("./models/application");
const WorkDetailModel = require("./models/workDetails");
const BankDetailsModel = require("./models/bankDetails");
const educationBackgroundModel = require("./models/educationBackground");
const RelationshipDetailModel = require("./models/relationshipDetails");
const UserModel = require("./models/user");
const RetirementListModel = require("./models/RetirementList");
const businessModel = require("./models/business");
const businessPermitModel = require("./models/businessPermit");
const vehicleModel = require("./models/vehicle");
const propertyModel = require("./models/property");
const plotModel = require("./models/plot");
const revenuesourceModel = require("./models/revenuesource");
const houseandstallModel = require("./models/houseandstalls");
const cessModel = require("./models/cess");
const receiptModel = require("./models/receipt");
const businessTypeModel = require("./models/businessTypes");
const idTypeModel = require("./models/idType");
const businessCategoryModel = require("./models/businessCategory");
const activityCodeModel = require("./models/activityCodes");
const subcountyModel = require("./models/subcounty");
const wardModel = require("./models/ward");
const ClampingFeeModel = require("./models/clampingFee");
const productModel = require("./models/product");
const orderModel = require("./models/order");
const POSFeeChargeModel = require("./models/posFeeCharge");
connectDB();

const app = express();
app.use(express.json())
app.use(cookieParser())
app.use(cors({
// origin: ["https://kwale-hris-app.onrender.com", "http://localhost:4000"],
origin: ["https://kwale-hris-app.onrender.com","http://localhost:3000","http://172.20.10.7:3000","http://192.168.1.108:3003","https://epay1-rho.vercel.app","https://epay-mobile-app.vercel.app"],
methods: ["GET", "POST", "PUT"],
credentials: true
}))

const storage = multer.diskStorage({
destination: function (req, file, cb) {
    cb(null, './uploads');
},
filename: function (req, file, cb) {
    cb(null, file.originalname);
}
});

const upload = multer(
{ storage: storage ,
limits: { fileSize: 5 * 1024 * 1024 }
},
);

//KwaleAppEnforcement Proxy Endpoints
// Start Login

app.post('/proxy/authenticate', async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and Password are required.' });
    }
  
    try {
      const agent = new https.Agent({ rejectUnauthorized: false }); 
  
      const response = await axios.get(
        'https://197.248.169.230:447/api/Auth/SystemAuthenticateEnforce',
        {
          params: { username, password },
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          httpsAgent: agent, 
        }
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error('Error calling the external API:', error.message);
      console.error('Full error details:', error);
  
      if (error.response) {
        res.status(error.response.status).json({
          error: error.response.data || 'Error from external API',
        });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });
  // End login

// Start fetching ParkingUnits
app.get('/api/proxy/parking-units', async (req, res) => {
    try {
      const response = await axios.post('http://197.248.169.226:8085/api/ParkingUnit');
      res.status(200).json(response.data);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching parking units' });
    }
  });
  // End Fetch
  
  // Start fetching Vehicletypes
  app.get('/api/proxy/vehicle-types', async (req, res) => {
    const parkingUnitId = req.query.Id; // Retrieve query parameter
    console.log('Received parkingUnitId:', parkingUnitId); // Log received parameter
  
    if (!parkingUnitId) {
      return res.status(400).json({ error: 'Parking unit Id is required' });
    }
  
    try {
      console.log('Sending request to external API with Id:', parkingUnitId);
  
      // Send the Id as a query parameter
      const response = await axios.post(
        `http://197.248.169.226:8085/api/VehicleTypes?Id=${parkingUnitId}`
      );
  
      console.log('External API response:', response.data); // Log the response
      res.status(200).json(response.data); // Forward the response to the frontend
    } catch (err) {
      console.error('Error fetching vehicle types from external API:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
  
      res.status(500).json({ error: 'Error fetching vehicle types' });
    }
  });
  
  
  // End Fetch

  // handleSearch EnforcementApp
  app.post('/proxy/KCGUSSDValidator', async (req, res) => {
    try {
      // Log the request body
      console.log('Proxy received request body:', req.body);
  
      // Forward the request to the external API
      const response = await axios.post(
        'http://197.248.169.226:8085/api/KCGUSSDValidator',
        req.body,
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      // Log the response from the external API
      console.log('External API Response:', response.data);
  
      // Send the response back to the front end
      res.status(response.status).json(response.data);
    } catch (error) {
      // Log the error details
      console.error('Error communicating with external API:', error.message);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
  
      // Send an error response to the front end
      res.status(error.response?.status || 500).json({
        message: 'Error occurred while connecting to external API',
        error: error.response?.data || error.message,
      });
    }
  });
  

//Artisan Section
const calculateRetirementDate = (dob, specialNeeds) => {
    const retirementAge = specialNeeds === "N/A" ? 60 : 65;
    const dobDate = new Date(dob);
    const retirementDate = new Date(dobDate.setFullYear(dobDate.getFullYear() + retirementAge));
    return retirementDate;
};

// Schedule task to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    const today = new Date();
    try {
        const employees = await EmployeeModel.find();

        for (const employee of employees) {
            const retirementDate = calculateRetirementDate(employee.dob, employee.specialNeeds);

            // Check if the employee already exists in the RetirementListModel
            const alreadyRetired = await RetirementListModel.findOne({ payrollId: employee.payrollId });

            if (retirementDate <= today && !alreadyRetired) {
                // Only create a new retirement entry if the employee doesn't already exist in the list
                await RetirementListModel.create({
                    payrollId: employee.payrollId,
                    reason: "Congratulations! You’ve reached retirement age!",
                    status: "Pending",
                    retirementDate: retirementDate,
                });
                console.log(`Added retirement entry for ${employee.payrollId}`);
            } else if (alreadyRetired) {
                console.log(`Employee with payrollId ${employee.payrollId} is already in the retirement list.`);
            }
        }
    } catch (error) {
        console.error('Error processing retirement list:', error);
    }
});


// API to add retirement
app.post("/addRetirement", (req, res) => {
    const newRetirement = {
        ...req.body,
        status: "Pending", // Ensure new entries have status "Pending"
    };

    RetirementListModel.create(newRetirement)
        .then(employees => res.json(employees))
        .catch(err => res.json(err));
});



app.get('/retirementList', async (req, res) => {

try {
    const retirementList = await RetirementListModel.aggregate([            
        {
            $lookup: {
                from: 'workdetails',
                localField: 'payrollId',
                foreignField: 'payrollId',
                as: 'WorkDetails'
            }
        },
        {
            $lookup: {
                from: 'employees',
                localField: 'payrollId',
                foreignField: 'payrollId',
                as: 'EmployeeDetails'
            }
        },
        { $unwind: { path: "$EmployeeDetails", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$WorkDetails", preserveNullAndEmptyArrays: true } }
    ]);

    // Check if the result is empty and handle accordingly
    if (retirementList.length === 0) {
        return res.status(404).json({ error: 'Retirement List is Empty' });
    }

    res.json(retirementList);
} catch (err) {
    console.error('Error fetching retirement list:', err);
    res.status(500).json({ error: 'Internal server error' });
}
});

app.get('/approvedRetirementList', async (req, res) => {
try {
    const retirementList = await RetirementListModel.aggregate([  
        // Match only those with status "Approved"
        { 
            $match: { status: "Approved" } 
        },          
        {
            $lookup: {
                from: 'workdetails',
                localField: 'payrollId',
                foreignField: 'payrollId',
                as: 'WorkDetails'
            }
        },
        {
            $lookup: {
                from: 'employees',
                localField: 'payrollId',
                foreignField: 'payrollId',
                as: 'EmployeeDetails'
            }
        },
        { $unwind: { path: "$EmployeeDetails", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$WorkDetails", preserveNullAndEmptyArrays: true } }
    ]);

    // Check if the result is empty and handle accordingly
    if (retirementList.length === 0) {
        return res.status(404).json({ error: 'No Approved Retirements Found' });
    }

    res.json(retirementList);
} catch (err) {
    console.error('Error fetching retirement list:', err);
    res.status(500).json({ error: 'Internal server error' });
}
});

app.put("/approveTermination/:id", (req, res) => {
const id = req.params.id;
req.body['status'] = 'Approved'
RetirementListModel.findByIdAndUpdate({ _id: id }, {
        status: req.body.status
    })
    .then(retirementList => res.json(retirementList))
    .catch(err => res.json(err))
});

app.put("/disapproveTermination/:id", (req, res) => {
const id = req.params.id;
req.body['status'] = 'Pending'
RetirementListModel.findByIdAndUpdate({ _id: id }, {
        status: req.body.status
    })
    .then(retirementList => res.json(retirementList))
    .catch(err => res.json(err))
});

// End of Artisan

app.post('/uploadEmployeesData', upload.single('file'), async (req, res) => {
    try {
        // Read the Excel file
        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Assumes data is in the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Loop through each employee record in the data
        for (const employee of data) {
            // Check if the employee already exists in the database
            const existingEmployee = await EmployeeModel.findOne({ payrollId: employee.payrollId });

            if (existingEmployee) {
                // If the employee exists, update the record
                await EmployeeModel.updateOne(
                    { payrollId: employee.payrollId },
                    { $set: employee }
                );
            } else {
                // If the employee does not exist, create a new record
                await EmployeeModel.create(employee);
            }
        }

        // Send response
        res.status(200).json({ message: 'Data successfully uploaded!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload data' });
    }
});

app.post('/uploadEmployeesWorkData', upload.single('file'), async (req, res) => {
try {
    // Read the Excel file
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assumes data is in the first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

      // Loop through each employee record in the data
      for (const employee of data) {
        // Check if the employee already exists in the database
        const existingEmployee = await WorkDetailModel.findOne({ payrollId: employee.payrollId });

        if (existingEmployee) {
            // If the employee exists, update the record
            await WorkDetailModel.updateOne(
                { payrollId: employee.payrollId },
                { $set: employee }
            );
        } else {
            // If the employee does not exist, create a new record
            await WorkDetailModel.create(employee);
        }
    };

    // Send response
    res.status(200).json({ message: 'Data successfully uploaded!' });
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload data' });
}
});

app.post('/uploadEmployeesRelationshipData', upload.single('file'), async (req, res) => {
try {
    // Read the Excel file
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assumes data is in the first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Insert data into MongoDB
    await RelationshipDetailModel.insertMany(data);

    // Send response
    res.status(200).json({ message: 'Data successfully uploaded!' });
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload data' });
}
});

app.post('/uploadEmployeesBankData', upload.single('file'), async (req, res) => {
try {
    // Read the Excel file
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assumes data is in the first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Insert data into MongoDB
    await BankDetailsModel.insertMany(data);

    // Send response
    res.status(200).json({ message: 'Data successfully uploaded!' });
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload data' });
}
});

app.post('/uploadEmployeesEducationData', upload.single('file'), async (req, res) => {
try {
    // Read the Excel file
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assumes data is in the first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Insert data into MongoDB
    await educationBackgroundModel.insertMany(data);

    // Send response
    res.status(200).json({ message: 'Data successfully uploaded!' });
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload data' });
}
});

app.post("/register", (req, res) => {
const{lname,fname,email,username,employeeId,mobile,userType,password} = req.body;
bcrypt.hash(password, salt)
    .then(hash => {
        UserModel.create({lname,fname,email,username,employeeId,mobile,userType,password : hash})
            .then(users => res.json(users))
            .catch(err => res.json(err))
    }).catch(err => console.log(err.message))
})

app.post("/login", async(req, res) => {
const { employeeId, password } = req.body;
UserModel.findOne({ employeeId: employeeId })
    .then(
        user => {
            if (user) {
                bcrypt.compare(password, user.password).then(result => {
                    if (result) {
                        const accessToken = jwt.sign({ id: user._id, fname: user.fname,employeeId:user.employeeId, lname: user.lname,mobile:user.mobile, email: user.email, userType: user.userType },
                            "jwt-access-token-secret-key", { expiresIn: '3599' });
                        const refreshToken = jwt.sign({ email: user.email, id: user._id},
                            "jwt-refresh-token-secret-key", { expiresIn: '3599' })

                        res.cookie('accessToken', accessToken, { maxAge: 60000, httpOnly: true, secure: true, sameSite: 'strict' })
                        res.cookie('refreshToken', refreshToken, { maxAge: 300000, httpOnly: true, secure: true, sameSite: 'strict' })
                        res.status(200).json({ accessToken: accessToken, id:user._id, fname: user.fname,lname:user.lname,employeeId:user.employeeId, mobile:user.mobile, email:user.email, userType: user.userType });
                    } else {
                        res.status(403).json({ error: "Please provide a valid username/password combination" });
                    }
                })

            } else {
                res.status(403).json({ error: "Wrong email/password combination for " + employeeId });
            }
        }
    ).catch(err => res.json(err))

})

const verifyUser = (req, res, next) => {
const accessToken = req.cookies.accessToken;
if (!accessToken) {
    if (renewToken(req, res)) {
        next()
    }
} else {
    jwt.verify(accessToken, "jwt-access-token-secret-key", (err, decoded) => {
        if (err) {
            return res.json({ valid: false, message: 'Invalid Token' })
        } else {
            req.email = decoded.email
            next()
        }
    })
}
}

const renewToken = (req, res) => {
const refreshToken = req.cookies.refreshToken;
let exist = false;
if (!refreshToken) {
    return res.json({ valid: false, Message: 'Invalid refresh token' })
} else {
    jwt.verify(refreshToken, "jwt-refresh-token-secret-key", (err, decoded) => {
        if (err) {
            return res.json({ valid: false, message: 'Invalid Refresh Token' })
        } else {
            const accessToken = jwt.sign({ email: decoded.email },
                "jwt-access-token-secret-key", { expiresIn: '3599' })
            res.cookie('accessToken', accessToken, { maxAge: 60000 })
            exist = true;
        }
    })

}
return exist;
}

app.post("/createEmployee", (req, res) => {
const {payrollId,salutation,lname,fname,surname,email,kra,phoneNumber,dob,id,ethnicity,gender,bloodGroup,religion,address,userType,password } = req.body;
bcrypt.hash(password, salt)
    .then(hash => {
        EmployeeModel.create({payrollId,salutation,lname,fname,surname,email,kra,phoneNumber,dob,id,ethnicity,religion,address,gender,bloodGroup,userType,password : hash })
            .then(employees => res.json(employees))
            .catch(err => res.json(err))
    }).catch(err => console.log(err.message))
});

app.post("/createDepartment", (req, res) => {
DepartmentModel.create(req.body)
    .then(departments => res.json(departments))
    .catch(err => res.json(err))
});

app.post('/addWorkDetails',(req,res)=>{
WorkDetailModel.create(req.body)
.then(workDetails => res.json(workDetails))
.catch(err => res.json(err))
    
});

app.get('/getWorkDetails/:prollId',(req,res)=>{
const id = req.params.prollId
WorkDetailModel.find({payrollId:id})
.then(workDetails => res.json(workDetails))
.catch(err => res.json(err))
});

app.put('/updateWorkDetails/:payrollId',(req,res)=>{
const{payrollId,department,division,payGroup,jobGroup,pensionScheme,firstAppointment,currentAppointment,deployment,subcounty,ward,dutyStation,salaryScalePoint,incrementalMonth} = req.body;
const id = req.params.prollId;
WorkDetailModel.findOneAndUpdate({payrollId:id},{payrollId,department,division,payGroup,jobGroup,pensionScheme,firstAppointment,currentAppointment,deployment,subcounty,ward,dutyStation,salaryScalePoint,incrementalMonth})
.then(workDetails => res.json(workDetails))
.catch(err => res.json(err))
});

app.get('/getEductnDetails/:prollId',(req,res)=>{
const id = req.params.prollId
educationBackgroundModel.find({payrollId:id})
.then(educationDetails => res.json(educationDetails))
.catch(err => res.json(err))
});
app.get('/getEducationDetails/:Id',(req,res)=>{
const id = req.params.Id
educationBackgroundModel.find({_id:id})
.then(educationDetails => res.json(educationDetails))
.catch(err => res.json(err))
});

app.post('/addEducationDetails',(req,res) =>{
educationBackgroundModel.create(req.body)
.then(educationDetails => res.json(educationDetails))
.catch(err => res.json(err))
});

app.put('/updateEducationDetails/:Id',(req,res)=>{
const {payrollId,institutionName, graduationYear, achievements,courseName} = req.body;
const id = req.params.Id;
educationBackgroundModel.findOneAndUpdate({_id:id},{payrollId,institutionName, graduationYear, achievements,courseName})
.then(educationDetails => res.json(educationDetails))
.catch(err => res.json(err))
});


app.post('/addRelationshipDetails',(req,res) =>{
RelationshipDetailModel.create(req.body)
.then(relationshipDetails => res.json(relationshipDetails))
.catch(err => res.json(err))
});

app.get('/getRelationshipDetails/:prollId',(req,res)=>{
const id = req.params.prollId
RelationshipDetailModel.find({payrollId:id})
.then(relationshipDetails => res.json(relationshipDetails))
.catch(err => res.json(err))
});
app.get('/getRltnshpDetails/:Id',(req,res)=>{
const id = req.params.Id
RelationshipDetailModel.find({_id:id})
.then(relationshipDetails => res.json(relationshipDetails))
.catch(err => res.json(err))
});
app.put('/updateRelationshipDetails/:Id',(req,res)=>{
const {payrollId,relationship,fullName,email,role,nationalId,phoneNumber} = req.body;
const id = req.params.Id;
RelationshipDetailModel.findOneAndUpdate({_id:id},{payrollId,relationship,fullName,email,role,nationalId,phoneNumber})
.then(relationshipDetails => res.json(relationshipDetails))
.catch(err => res.json(err))
});

app.post('/addBankDetails',(req,res)=>{
BankDetailsModel.create(req.body)
.then(bankDetails => res.json(bankDetails))
.catch(err => res.json(err))
    
});

app.get('/getBankDetails/:prollId',(req,res)=>{
const id = req.params.prollId
BankDetailsModel.find({payrollId:id})
.then(bankDetails => res.json(bankDetails))
.catch(err => res.json(err))
})

app.put('/updateBankDetails/:prollId',(req,res)=>{
const {bankAccountName,bankAccountNumber,bankBranch,payrollId,nssfNumber,nhifNumber} = req.body;
const id = req.params.prollId;
BankDetailsModel.findOneAndUpdate({payrollId:id},{bankAccountName,bankAccountNumber,bankBranch,payrollId,nssfNumber,nhifNumber})
.then(bankDetails => res.json(bankDetails))
.catch(err => res.json(err))
});  



app.post("/createLeaveType", (req, res) => {
LeaveTypeModel.create(req.body)
    .then(leaveTypes => res.json(leaveTypes))
    .catch(err => res.json(err))
});

app.post("/createApplication", (req, res) => {
ApplicationModel.create(req.body)
    .then(applications => res.json(applications))
    .catch(err => res.json(err))
});

app.get('/getLeaveTypes',(req,res)=>{
LeaveTypeModel.find({})
.then(leaveTypes=> res.json(leaveTypes))
.catch(err => res.json(err))
});

app.get('/employeeDetails/:id', async (req, res) => {
const { ObjectId } = require('mongodb');
const id = new ObjectId(req.params.id);

try {
    const employeeDetails = await EmployeeModel.aggregate([
        { $match: { _id: id } },
        {
            $lookup: {
                from: 'workdetails',
                localField: 'payrollId',
                foreignField: 'payrollId',
                as: 'WorkDetails'
            }
        },
        {
            $lookup: {
                from: 'bankdetails',
                localField: 'payrollId',
                foreignField: 'payrollId',
                as: 'bankDetails'
            }
        },
        {
            $lookup: {
                from: 'relationshipdetails',
                localField: 'payrollId',
                foreignField: 'payrollId',
                as: 'relationshipDetails'
            }
        },
        { $unwind: { path: "$bankDetails", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$WorkDetails", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$relationshipDetails", preserveNullAndEmptyArrays: true } }
    ]);

    // Check if the result is empty and handle accordingly
    if (employeeDetails.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employeeDetails);

} catch (err) {
    console.error('Error fetching employee details:', err);
    res.status(500).json({ error: 'Internal server error' });
}
});



app.get("/getApplications",async (req, res) => {
try{
    const applications = await ApplicationModel.aggregate(
        [
            
            {
                $lookup:{
                    from:'employees',
                    localField:'payrollId',
                    foreignField:'payrollId',
                    as:'employeeDetails'
                }
            },
            {$unwind:"$employeeDetails"}

        ]
    );
    res.json(applications);
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
}
});
app.get('/getDepartments',(req,res)=>{
DepartmentModel.find({})
.then(departments=> res.json(departments))
.catch(err => res.json(err))
});

app.get('/employeeList', async (req, res) => {

try {
    const employeeDetails = await EmployeeModel.aggregate([            
        {
            $lookup: {
                from: 'workdetails',
                localField: 'payrollId',
                foreignField: 'payrollId',
                as: 'WorkDetails'
            }
        },
        {
            $lookup: {
                from: 'bankdetails',
                localField: 'payrollId',
                foreignField: 'payrollId',
                as: 'bankDetails'
            }
        },
        {
            $lookup: {
                from: 'relationshipdetails',
                localField: 'payrollId',
                foreignField: 'payrollId',
                as: 'relationshipDetails'
            }
        },
        { $unwind: { path: "$bankDetails", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$WorkDetails", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$relationshipDetails", preserveNullAndEmptyArrays: true } }
    ]);

    // Check if the result is empty and handle accordingly
    if (employeeDetails.length === 0) {
        return res.status(404).json({ error: 'Employees not found' });
    }

    res.json(employeeDetails);
} catch (err) {
    console.error('Error fetching employee details:', err);
    res.status(500).json({ error: 'Internal server error' });
}
});

app.get('/getEmployees',(req,res)=>{
EmployeeModel.find({})
.then(employees=> res.json(employees))
.catch(err => res.json(err))
});

app.get('/getEmployee/:id',(req,res)=>{
const id = req.params.id
EmployeeModel.find({_id:id})
.then(employees=> res.json(employees))
.catch(err => res.json(err))
});


app.put("/updateEmployee/:id", (req, res) => {
const {payrollId,salutation,lname,fname,surname,email,kra,phoneNumber,dob,nationalId,ethnicity,gender,bloodGroup,religion,address,userType } = req.body;
const id = req.params.id;
EmployeeModel.findByIdAndUpdate({ _id: id }, {payrollId,salutation,lname,fname,surname,email,kra,phoneNumber,dob,nationalId,ethnicity,religion,address,gender,bloodGroup,userType})
    .then(employees => res.json(employees))
    .catch(err => res.json(err))
});

app.get('/xEmployee/:id', async(req, res) => {
const id = req.params.id;
try {
    const employee = await EmployeeModel.aggregate([
        {$match : {_id:id}},
        {
            $lookup:{
                from:'workdetails',
                localField:'payrollId',
                foreignField:'payrollId',
                as:'workData'
            }
        },
        {$unwind:"$workData"}
    

    ]);
    res.json(employee);
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
}
});


//Kwale Revenue APIs
//0. Revenue sources
app.post("/createRevenueSource", (req, res) => {
    revenuesourceModel.create(req.body)
        .then(revenue => res.json(revenue))
        .catch(err => res.json(err))
    });

app.get('/getRevenueSource',(req,res)=>{
    revenuesourceModel.find({})
    .then(revenueSources=> res.json(revenueSources))
    .catch(err => res.json(err))
    });

// 1. Business Permit Module
app.post("/createBusiness", (req, res) => {
    businessModel.create(req.body)
        .then(businesses => res.json(businesses))
        .catch(err => res.json(err))
    });
app.post("/createBusinessType", (req, res) => {
    businessTypeModel.create(req.body)
        .then(busiType => res.json(busiType))
        .catch(err => res.json(err))
    });
app.get('/getBusinessTypes',(req,res)=>{
    businessTypeModel.find({})
    .then(busiTypes=> res.json(busiTypes))
    .catch(err => res.json(err))
    });
app.post("/createIdType", (req, res) => {
    idTypeModel.create(req.body)
        .then(idType => res.json(idType))
        .catch(err => res.json(err))
    });
app.get('/getIdTypes',(req,res)=>{
    idTypeModel.find({})
    .then(idTypes=> res.json(idTypes))
    .catch(err => res.json(err))
    });
app.post("/createSubcounty", (req, res) => {
    subcountyModel.create(req.body)
        .then(subcounty => res.json(subcounty))
        .catch(err => res.json(err))
    });
app.get('/getSubcounty',(req,res)=>{
    subcountyModel.find({})
    .then(subcounties=> res.json(subcounties))
    .catch(err => res.json(err))
    });
    app.post("/createWard", (req, res) => {
        wardModel.create(req.body)
            .then(ward => res.json(ward))
            .catch(err => res.json(err))
        });
    app.get('/getWard/:Name',(req,res)=>{
        const name = req.params.Name;
        wardModel.find({Name:name})
        .then(ward=> res.json(ward))
        .catch(err => res.json(err))
        });

app.post("/createBusinessCategory", (req, res) => {
    businessCategoryModel.create(req.body)
        .then(businessCategory => res.json(businessCategory))
        .catch(err => res.json(err))
    });
app.get('/getBusinessCategory',(req,res)=>{
    businessCategoryModel.find({})
    .then(businessCategories=> res.json(businessCategories))
    .catch(err => res.json(err))
    });
app.post("/createActivityCode", (req, res) => {
    activityCodeModel.create(req.body)
        .then(activityCode => res.json(activityCode))
        .catch(err => res.json(err))
    });
app.get('/getActivityCode/:Code',(req,res)=>{
    const code = req.params.Code;
    activityCodeModel.find({Code:code})
    .then(activityCode=> res.json(activityCode))
    .catch(err => res.json(err))
    });

app.post("/createBusinessPermit", (req, res) => {
    businessPermitModel.create(req.body)
        .then(permits => res.json(permits))
        .catch(err => res.json(err))
    });

app.post('/getBusiness',(req,res)=>{
    const businessName = req.body.businessName
    businessModel.find({BusinessName:businessName})
    .then(business=> res.json(business))
    .catch(err => res.json(err))
    });

app.post('/BusinessInspection', async (req, res) => {
const {
    userId,
    businessName,
    businessNumber,
    subCountyId,
    telephoneNumber,
    idNumber,
    wardId,
    zoneId
} = req.body;

// Optional: Decide which field to use (name or number)
const payload = {
    userId,
    businessName,
    businessNumber,
    telephoneNumber,
    idNumber,
    subCountyId,
    wardId,
    zoneId
};
    
try {
    const agent = new https.Agent({ rejectUnauthorized: false });

    const response = await axios.post(
    'https://197.248.169.230:450/api/Enforcement/BusinessInspection',
    payload,
    {
        headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        },
        httpsAgent: agent,
    }
    );

    res.status(response.status).json(response.data);
} catch (error) {
    console.error('Error calling the external API:', error.message);
    if (error.response) {
    res.status(error.response.status).json({
        error: error.response.data || 'Error from external API',
    });
    } else {
    res.status(500).json({ error: 'Internal Server Error' });
    }
}
});

app.post('/getBusinessWithOptions', (req, res) => {
    const businessName = req.body.businessName;
    businessModel.find({ BusinessName: businessName })
    .then(business => {
        if (business.length > 0) {
            res.json(business);
        } else {
            businessModel.find({ BusinessName: { $regex: businessName, $options: 'i' } })
            .then(suggestions => res.json({ message: 'No exact match found. Here are some suggestions:', suggestions }))
            .catch(err => res.json(err));
        }
    })
    .catch(err => res.json(err));
});

app.post('/getPermit',(req,res)=>{
    const businessName = req.body.businessName
    businessPermitModel.find({BusinessName:businessName})
    .then(permit=> res.json(permit))
    .catch(err => res.json(err))
    });

// 2. Vehicle Module
app.post("/createVehicle", (req, res) => {
    vehicleModel.create(req.body)
        .then(vehicle => res.json(vehicle))
        .catch(err => res.json(err))
    });

app.post('/getVehicle',(req,res)=>{
    const vehicleNumber = req.body.vehicleNumber
    vehicleModel.find({VehicleNumber:vehicleNumber})
    .then(vehicle=> res.json(vehicle))
    .catch(err => res.json(err))
    });

app.post('/VehicleInspection', async (req, res) => {
    const { userId, vehicleNumber } = req.body;
    
    // Basic validation
    if (!vehicleNumber) {
        return res.status(400).json({ error: 'Missing required fields:  vehicleNumber' });
    }
    
    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
    
        const response = await axios.post(
        'https://197.248.169.230:450/api/Enforcement/NonPSVInspectionn',
        {
            userId,
            vehicleNumber
        },
        {
            headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            },
            httpsAgent: agent,
        }
        );
    
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error calling the external API:', error.message);
        if (error.response) {
        res.status(error.response.status).json({
            error: error.response.data || 'Error from external API',
        });
        } else {
        res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    });

app.post('/VehicleClamping', async (req, res) => {
            const { userId, vehicleNumber, clampingCharge,vehicleType } = req.body;
    
    // Basic validation
    if (!vehicleNumber || !clampingCharge || !vehicleType) {
        return res.status(400).json({ error: 'All fields are required!' });
    }
    
    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
    
        const response = await axios.post(
        'https://197.248.169.230:450/api/Enforcement/VehicleClamping',
        {
            userId,
            vehicleNumber,
            clampingCharge,
            vehicleType
        },
        {
            headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            },
            httpsAgent: agent,
        }
        );
    
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error calling the external API:', error.message);
        if (error.response) {
        res.status(error.response.status).json({
            error: error.response.data || 'Error from external API',
        });
        } else {
        res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    });

app.post('/getVehicleWithOptions', (req, res) => {
    const vehicleNumber = req.body.vehicleNumber;
    vehicleModel.find({ VehicleNumber: vehicleNumber })
    .then(vehicle => {
        if (vehicle.length > 0) {
            res.json(vehicle);
        } else {
            vehicleModel.find({ VehicleNumber: { $regex: vehicleNumber, $options: 'i' } })
            .then(suggestions => res.json({ message: 'No exact match found. Here are some suggestions:', suggestions }))
            .catch(err => res.json(err));
        }
    })
    .catch(err => res.json(err));
});

app.post('/MpesaCodeValidate', async (req, res) => {
    const { userId, referenceNumber } = req.body;
    
    // Basic validation
    if (!referenceNumber) {
        return res.status(400).json({ error: 'Missing required fields:  referenceNumber' });
    }
    
    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
    
        const response = await axios.post(
        'https://197.248.169.230:450/api/Enforcement/MpesaCodeValidate',
        {
            userId,
            referenceNumber
        },
        {
            headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            },
            httpsAgent: agent,
        }
        );
    
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error calling the external API:', error.message);
        if (error.response) {
        res.status(error.response.status).json({
            error: error.response.data || 'Error from external API',
        });
        } else {
        res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    });

app.post("/createClampingFee", (req, res) => {
    ClampingFeeModel.create(req.body)
        .then(clampingFee => res.json(clampingFee))
        .catch(err => res.json(err))
    });
app.get('/getClampingFees',(req,res)=>{
    ClampingFeeModel.find({})
    .then(clampingFees=> res.json(clampingFees))
    .catch(err => res.json(err))
    });

app.post('/GetVehicleTypePerParkingUnit', async (req, res) => {
    try {
        const agent = new https.Agent({ rejectUnauthorized: false, checkServerIdentity: () => null });

        const response = await axios.post(
            'https://197.248.169.230:450/api/Enforcement/GetVehicleTypePerParkingUnit/5',
            {}, 
            {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                httpsAgent: agent,
            }
        );

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error calling the external API:', error.message);
        if (error.response) {
            res.status(error.response.status).json({
                error: error.response.data || 'Error from external API',
            });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});
    

// 3. Property Module
app.post("/createProperty", (req, res) => {
    propertyModel.create(req.body)
        .then(property => res.json(property))
        .catch(err => res.json(err))
    });

app.post('/getPropertyPlotsByUPN', async (req, res) => {
    const upn = req.body.upn;

    try {
        
        const [properties, plots] = await Promise.all([
            propertyModel.find({ UPN: upn }),
            plotModel.find({ UPN: upn })
        ]);
        
        res.json({ properties, plots });
    } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/getPropertyPlotsByLR', async (req, res) => {
    const lr = req.body.lr;

    try {
        
        const [properties, plots] = await Promise.all([
            propertyModel.find({ LrNumber: lr }),
            plotModel.find({ LrNumber: lr })
        ]);
        
        res.json({ properties, plots });
    } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/getPropertyByLR',(req,res)=>{
    const lr = req.body.lr
    propertyModel.find({LrNumber:lr})
    .then(property=> res.json(property))
    .catch(err => res.json(err))
    });

app.post('/PropertyInspection', async (req, res) => {
    const { userId, propertyNumber, upnNumber, subCountyId, wardId, zoneId } = req.body;
    
    // Basic validation
    if (!propertyNumber) {
        return res.status(400).json({ error: 'Missing required fields:  propertyNumber' });
    }
    
    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
    
        const response = await axios.post(
        'https://197.248.169.230:450/api/Enforcement/PropertyInspection',
        {
            userId,
            propertyNumber,
            upnNumber,
            subCountyId,
            wardId,
            zoneId,
        },
        {
            headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            },
            httpsAgent: agent,
        }
        );
    
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error calling the external API:', error.message);
        if (error.response) {
        res.status(error.response.status).json({
            error: error.response.data || 'Error from external API',
        });
        } else {
        res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    });
    


// 4. Plot Module
app.post("/createPlot", (req, res) => {
    plotModel.create(req.body)
        .then(plot => res.json(plot))
        .catch(err => res.json(err))
    });

app.post('/getPlotByUPN',(req,res)=>{
    const upn = req.body.upn
    plotModel.find({UPN:upn})
    .then(plot=> res.json(plot))
    .catch(err => res.json(err))
    });

app.post('/getPlotByLR',(req,res)=>{
    const lr = req.body.lr
    plotModel.find({LrNumber:lr})
    .then(plot=> res.json(plot))
    .catch(err => res.json(err))
    });

app.post('/PlotRentInspection', async (req, res) => {
    const { userId, propertyNumber, upnNumber, subCountyId, wardId, zoneId } = req.body;
    
    // Basic validation
    if (!propertyNumber) {
        return res.status(400).json({ error: 'Missing required fields:  propertyNumber' });
    }
    
    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
    
        const response = await axios.post(
        'https://197.248.169.230:450/api/Enforcement/PlotRentInspection',
        {
            userId,
            propertyNumber,
            upnNumber,
            subCountyId,
            wardId,
            zoneId,
        },
        {
            headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            },
            httpsAgent: agent,
        }
        );
    
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error calling the external API:', error.message);
        if (error.response) {
        res.status(error.response.status).json({
            error: error.response.data || 'Error from external API',
        });
        } else {
        res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    });

app.post("/createReceipt", (req, res) => {
    receiptModel.create(req.body)
        .then(receipt => res.json(receipt))
        .catch(err => res.json(err))
    });

// 5. Houses And Stalls

app.post("/createHouseAndStalls", (req, res) => {
    houseandstallModel.create(req.body)
        .then(houseORstall => res.json(houseORstall))
        .catch(err => res.json(err))
    });

app.post('/getHouseAndStalls',(req,res)=>{
    const houseOrStallNumber = req.body.houseOrStallNumber
    houseandstallModel.find({HouseOrStallNumber:houseOrStallNumber})
    .then(houseORstall=> res.json(houseORstall))
    .catch(err => res.json(err))
    });


app.post('/StallInspection', async (req, res) => {
    const { userId, stallNumber } = req.body;
    
    // Basic validation
    if (!stallNumber) {
        return res.status(400).json({ error: 'Missing required fields:  stallNumber' });
    }
    
    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
    
        const response = await axios.post(
        'https://197.248.169.230:450/api/Enforcement/StallInspection',
        {
            userId,
            stallNumber
        },
        {
            headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            },
            httpsAgent: agent,
        }
        );
    
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error calling the external API:', error.message);
        if (error.response) {
        res.status(error.response.status).json({
            error: error.response.data || 'Error from external API',
        });
        } else {
        res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    });

    //biling
    app.post('/Billing', async (req, res) => {
        const { userId, phoneNumber, customerName, emailAddress, plateNumber, idNumber,quantity,entityId, entityTopay, amountTopay, feeId } = req.body;
        
        // Basic validation
        if (!plateNumber) {
            return res.status(400).json({ error: 'Missing required fields:  plateNumber' });
        }
        
        try {
            const agent = new https.Agent({ rejectUnauthorized: false });
        
            const response = await axios.post(
            'https://197.248.169.230:450/api/Enforcement/Billing',
            {
                userId,
                phoneNumber,
                customerName,
                emailAddress,
                plateNumber,
                idNumber,
                quantity,
                feeId,
                entityId,
                amountTopay,
                entityTopay
            },
            {
                headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                },
                httpsAgent: agent,
            }
            );
        
            res.status(response.status).json(response.data);
        } catch (error) {
            console.error('Error calling the external API:', error.message);
            if (error.response) {
            res.status(error.response.status).json({
                error: error.response.data || 'Error from external API',
            });
            } else {
            res.status(500).json({ error: 'Internal Server Error' });
            }
        }
        });


// 6. Cess

app.post('/createCess', async (req, res) => {
    try {
        const { RevenueId, TransactionCode,Amount,Description, PaymodeId,CustomerName, UnitQty,ServedBy} = req.body;

        // Capture the current date and time in EAT (UTC+3)
        const transactionDate = new Date(); // Automatically takes the current timestamp

        const newTransaction = new cessModel({ RevenueId,TransactionCode, Amount, Description, TransactionDate: transactionDate, PaymodeId,CustomerName,UnitQty, ServedBy});

        await newTransaction.save();
        res.status(201).json({ message: 'Transaction saved successfully', transaction: newTransaction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.post('/getCess',(req,res)=>{
    const TransactionCode = req.body.TransactionCode
    cessModel.find({TransactionCode:TransactionCode})
    .then(cess=> res.json(cess))
    .catch(err => res.json(err))
    });

app.post('/getCessByClient',(req,res)=>{
    const CustomerName = req.body.CustomerName
    cessModel.find({CustomerName:CustomerName})
    .then(cess=> res.json(cess))
    .catch(err => res.json(err))
    });

app.post('/getCessWithOptions', async (req, res) => {
    try {
        const { CustomerName } = req.body;

        // Get today's date in EAT (UTC+3) and normalize time
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of the day

        const startOfDay = new Date(today);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999); // End of today

        // Find transactions matching CustomerName and today's date
        const cess = await cessModel.find({
            CustomerName: CustomerName,
            TransactionDate: { $gte: startOfDay, $lt: endOfDay }
        });

        if (cess.length > 0) {
            // Convert TransactionDate to EAT before sending the response
            const formattedCess = cess.map(transaction => ({
                ...transaction._doc,
                TransactionDate: new Date(transaction.TransactionDate).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
            }));

            return res.json(formattedCess);
        }

        // If no exact match, return suggestions
        const suggestions = await cessModel.find({
            CustomerName: { $regex: CustomerName, $options: 'i' },
            TransactionDate: { $gte: startOfDay, $lt: endOfDay }
        });

        if (suggestions.length > 0) {
            const formattedSuggestions = suggestions.map(transaction => ({
                ...transaction._doc,
                TransactionDate: new Date(transaction.TransactionDate).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
            }));

            return res.json({ message: 'No exact match found. Here are some suggestions:', suggestions: formattedSuggestions });
        }

        res.json({ message: 'No transactions found for today.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
    

    /*Daraja Api */
  
// const { auth } = require('express-oauth2-jwt-bearer');
// const { config } = require('dotenv');

const createToken = async () => {
    const secret = "Rh9pySrCnhXZOsVdfwnecVpG0GYHpbjQGigcrUH4haiH5d5saHhkQRuZc41l1lGM";
    const consumer = "AXnhnb9qQ2IXaFb3FzATGWK45LoVWa4nvxNbocDqCXz17368";
    const auth = Buffer.from(`${consumer}:${secret}`).toString("base64");

    try {
        const response = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
                headers: {
                    Authorization: `Basic ${auth}`,
                }
            }
        );
        return response.data.access_token;
    } catch (err) {
        console.error(err);
        throw new Error(err.message); // Propagate the error up
    }
};

app.post("/stkPush", async (req, res) => {
try {
const stkToken = await createToken();

const secret = "Rh9pySrCnhXZOsVdfwnecVpG0GYHpbjQGigcrUH4haiH5d5saHhkQRuZc41l1lGM";
const consumer = "AXnhnb9qQ2IXaFb3FzATGWK45LoVWa4nvxNbocDqCXz17368";
const auth = Buffer.from(`${consumer}:${secret}`).toString("base64");
const shortcode = 174379;
const phoneNumber = req.body.phoneNumber.substring(1);
const billAmount = Number(req.body.billAmount);
const billNumber = req.body.billNumber;
const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

const date = new Date();
const timestamp = date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");
const data = {    
                    // "BusinessShortCode": shortcode,    
                    // "Password": password,    
                    // "Timestamp": timestamp,    
                    // "TransactionType": "CustomerPayBillOnline",    
                    // "Amount": amount,    
                    // "PartyA": `254${phone}`,    
                    // "PartyB": shortcode,    
                    // "PhoneNumber": `254${phone}`, 
                    // "ProjectName": projectName,   
                    // "CallBackURL": "https://mydomain.com/pat",    
                    // "AccountReference": "Generous reach Donations",    
                    // "TransactionDesc": "Testing Stk Push"
                    
                                        
                    "BusinessShortCode": shortcode,    
                    "Password": password,    
                    "Timestamp":timestamp,    
                    "TransactionType": "CustomerPayBillOnline",    
                    "Amount": billAmount,    
                    "PartyA":"254716483231",    
                    "PartyB":shortcode,    
                    "PhoneNumber":`254${phoneNumber}`,    
                    "CallBackURL": "https://mydomain.com/pat", 
                    "BillNumber": billNumber,   
                    "AccountReference":"KWALE COUNTY GOVERNMENT",    
                    "TransactionDesc":"Testing Stk Push"
                };
            
        

await axios.post(url, data, {
    headers: {
        Authorization: `Bearer ${stkToken}`,
    }
}).then((response) => {
    console.log(response.data);
    res.status(200).json(response.data);
}).catch((err) => {
    console.error("stkPush error:", err);
    res.status(400).json(err.message);
});
} catch (error) {
console.error("Token retrieval error:", error);
res.status(400).json(error.message);
}
});

app.post('/uploadVehicleData', upload.single('file'), async (req, res) => {
    try {
        // Read the Excel file
        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Assumes data is in the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet,{raw: false});

        // Loop through each employee record in the data
        for (const vehicle of data) {
            // Check if the employee already exists in the database
            const existingVehicle = await vehicleModel.findOne({ VehicleNumber: vehicle.VehicleNumber });

            if (existingVehicle) {
                // If the employee exists, update the record
                await vehicleModel.updateOne(
                    { VehicleNumber: vehicle.VehicleNumber },
                    { $set: vehicle }
                );
            } else {
                // If the employee does not exist, create a new record
                await vehicleModel.create(vehicle);
            }
        }

        // Send response
        res.status(200).json({ message: 'Data successfully uploaded!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload data' });
    }
});

app.post('/uploadBusinessData', upload.single('file'), async (req, res) => {
    try {
        // Read the Excel file
        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Assumes data is in the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet,{raw: false});

        // Loop through each employee record in the data
        for (const business of data) {
            // Check if the employee already exists in the database
            const existingBusiness = await businessModel.findOne({ BusinessName: business.BusinessName });

            if (existingBusiness) {
                // If the employee exists, update the record
                await businessModel.updateOne(
                    { BusinessName: business.BusinessName },
                    { $set: business }
                );
            } else {
                // If the employee does not exist, create a new record
                await businessModel.create(business);
            }
        }

        // Send response
        res.status(200).json({ message: 'Data successfully uploaded!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload data' });
    }
});

app.post('/uploadBusinessPermitData', upload.single('file'), async (req, res) => {
    try {
       
        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet,{raw: false});

        
        for (const permit of data) {
          
            const existingPermit = await businessPermitModel.findOne({ BusinessName: permit.BusinessName });

            if (existingPermit) {
            
                await businessPermitModel.updateOne(
                    { BusinessName: permit.BusinessName },
                    { $set: permit }
                );
            } else {
             
                await businessPermitModel.create(permit);
            }
        }

        // Send response
        res.status(200).json({ message: 'Data successfully uploaded!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload data' });
    }
});


//ROBERT STK

app.post('/addPOSfeeCharges',(req,res)=>{
POSFeeChargeModel.create(req.body)
.then(posFeeCharges => res.json(posFeeCharges))
.catch(err => res.json(err))
    
});

app.get('/getPOSfeeCharges',(req,res)=>{
    POSFeeChargeModel.find({})
    .then(posFeeCharges=> res.json(posFeeCharges))
    .catch(err => res.json(err))
    });

app.post('/uploadPOSfeeCharges', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log("Received file:", req.file); // Log the received file

    try {
        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        console.log('Parsed data:', data);  // Log the parsed data

        if (!data.length) {
            return res.status(400).json({ error: 'No valid data found in the file' });
        }

        for (const posFeeCharge of data) {
            const { FeeId } = posFeeCharge;
            if (!FeeId) {
                console.warn('Missing FeeId for one of the records');
                continue;
            }

            const existingPOSFeeCharge = await POSFeeChargeModel.findOne({ FeeId });
            if (existingPOSFeeCharge) {
                await POSFeeChargeModel.updateOne({ FeeId }, { $set: posFeeCharge });
                console.log(`Updated FeeId: ${FeeId}`);
            } else {
                await POSFeeChargeModel.create(posFeeCharge);
                console.log(`Inserted new record: ${FeeId}`);
            }
        }

        res.status(200).json({ message: 'Data successfully uploaded!' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Failed to upload data' });
    }
});



   /*Daraja Api */

   app.post("/BotSTKPush", async (req, res) => {
    try {
      const { phoneNumber, amount } = req.body;
  
      if (!/^07\d{8}$/.test(phoneNumber)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }
  
      const consumer = "AXnhnb9qQ2IXaFb3FzATGWK45LoVWa4nvxNbocDqCXz17368";
      const secret = "Rh9pySrCnhXZOsVdfwnecVpG0GYHpbjQGigcrUH4haiH5d5saHhkQRuZc41l1lGM";
      const shortcode = 174379;
      const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
      const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
      const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");
  
      const auth = Buffer.from(`${consumer}:${secret}`).toString("base64");
      const tokenRes = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
        headers: { Authorization: `Basic ${auth}` },
      });
  
      const stkToken = tokenRes.data.access_token;
  
      const data = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: `254${phoneNumber.substring(1)}`,
        PartyB: shortcode,
        PhoneNumber: `254${phoneNumber.substring(1)}`,
        CallBackURL: "http://41.72.195.2:8081/api/C2B/lnmo",
        AccountReference: "AccountReference",
        TransactionDesc: "Udhhya Eslip",
      };
  
      const response = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", data, {
        headers: {
          Authorization: `Bearer ${stkToken}`,
          "Content-Type": "application/json",
        },
      });
  
      res.status(200).json(response.data);
    } catch (error) {
      console.error("STK Push Error:", error.response?.data || error.message);
      res.status(500).json({ error: error.response?.data || error.message });
    }
  });
  

app.post('/proxy/stkPush', async (req, res) => {
    const { Phone, Amount, AccountReference } = req.body;

    if (!Phone || !Amount || !AccountReference) {
        return res.status(400).json({ error: 'All Fields are required.' });
    }

    try {
        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios.post(
            'http://www.clickfusion.co.ke/kcg/webhook.php',
            { Phone, Amount, AccountReference },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                httpsAgent: agent,
            }
        );

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error calling the external API:', error.message);
        console.error('Full error details:', error);

        if (error.response) {
            res.status(error.response.status).json({
                error: error.response.data || 'Error from external API',
            });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});
  
//WhatsappBot

app.post("/createProduct", (req, res) => {
    productModel.create(req.body)
        .then(product => res.json(product))
        .catch(err => res.json(err))
    });
app.get('/getProducts',(req,res)=>{
    productModel.find({})
    .then(products=> res.json(products))
    .catch(err => res.json(err))
    });

app.post("/createOrder", (req, res) => {
    orderModel.create(req.body)
        .then(order => res.json(order))
        .catch(err => res.json(err))
    });
app.get('/getOrders',(req,res)=>{
    orderModel.find({})
    .then(orders=> res.json(orders))
    .catch(err => res.json(err))
    });

// async function sendTemplateMessage(){
//     const response = await axios ({
//         url: "https://graph.facebook.com/v22.0/683430791513718/messages",
//         method: 'post',
//         headers:{
//             // 'Authorization':`Bearer ${process.env.WHATSAPP_TOKEN}`,
//             'Content-Type':'application/json'
//         },
//         data:JSON.stringify({
//             messaging_product:'whatsapp',
//             to:'254724221766',
//             type:'template',
//             template:{
//                 name:'hello_world',
//                 language:{
//                     code:'en_US'
//                 }
//             }
//         })
//     })
//     console.log(response)
// }
// sendTemplateMessage();

// async function sendTextMessage(){
//     const response = await axios ({
//         url: "https://graph.facebook.com/v22.0/683430791513718/messages",
//         method: 'post',
//         headers:{
//             // 'Authorization':`Bearer ${process.env.WHATSAPP_TOKEN}`,
//             'Content-Type':'application/json'
//         },
//         data:JSON.stringify({
//             messaging_product:'whatsapp',
//             to:'254724221766',
//             type:'text',
//             text:{
//              body: 'Welcome to chatbot world!'
//             }
//         })
//     })
//     console.log(response)
// }

// sendTextMessage();

const sessions = {}; // In-memory session store

app.post('/whatsapp', async (req, res) => {
  const from = req.body.From;
  const msg = req.body.Body.trim().toLowerCase();
  let reply = '';

  if (!sessions[from]) {
    sessions[from] = { stage: 'menu' };
  }

  const session = sessions[from];

  switch (session.stage) {
    case 'menu':
      reply = 'Welcome! Please select a product:\n';
      products.forEach(p => {
        reply += `${p.id}. ${p.name} - KES ${p.price}\n`;
      });
      session.stage = 'awaiting_product';
      break;

    case 'awaiting_product':
      const selected = products.find(p => p.id == msg);
      if (selected) {
        session.product = selected;
        session.stage = 'awaiting_quantity';
        reply = `You selected *${selected.name}*. Enter quantity:`;
      } else {
        reply = "Invalid product ID. Please try again.";
      }
      break;

    case 'awaiting_quantity':
      const quantity = parseInt(msg);
      if (!isNaN(quantity) && quantity > 0) {
        session.quantity = quantity;
        session.stage = 'awaiting_phone';
        reply = `Total amount is KES ${session.product.price * quantity}.\nPlease enter your M-Pesa phone number (e.g. 2547XXXXXXXX):`;
      } else {
        reply = "Please enter a valid quantity.";
      }
      break;

    case 'awaiting_phone':
      const phone = msg;
      const total = session.product.price * session.quantity;

      try {
        await stkPush(phone, total);
        reply = `STK Push sent for KES ${total} to ${phone}. Complete the payment. Thank you!`;
      } catch (e) {
        console.error(e.response?.data || e.message);
        reply = "Failed to send STK push. Try again later.";
      }

      delete sessions[from]; // Clear session after order
      break;

    default:
      reply = "Session error. Please type anything to restart.";
      delete sessions[from];
  }

  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Message>${reply}</Message>
    </Response>
  `);
});

app.listen(4000,()=>{
console.log("Server listening on port 4000")
})