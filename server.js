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
connectDB();

const app = express();
app.use(express.json())
app.use(cookieParser())
app.use(cors({
// origin: ["https://kwale-hris-app.onrender.com", "http://localhost:4000"],
origin: ["https://kwale-hris-app.onrender.com"],
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

//KwaleAppEnforcement Proxy Endpoint

app.post('/proxy/authenticate', async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and Password are required.' });
    }
  
    try {
      const agent = new https.Agent({ rejectUnauthorized: false }); // Temporarily disable SSL validation
  
      const response = await axios.get(
        'https://197.248.169.230:447/api/Auth/SystemAuthenticateEnforce',
        {
          params: { username, password },
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          httpsAgent: agent, // Add custom HTTPS agent
        }
      );
  
      // Forward the response back to the client
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error('Error calling the external API:', error.message);
      console.error('Full error details:', error); // Log the full error for debugging
  
      if (error.response) {
        res.status(error.response.status).json({
          error: error.response.data || 'Error from external API',
        });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
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

app.listen(4000,()=>{
console.log("Server listening on port 4000")
})