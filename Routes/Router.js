const express = require("express");
// const multer = require('multer');
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
const { login } = require("../Controller/loginController");
const { lenderCreate,
    getLenders,
    getLendesAll,
    lenderApprove,
    lenderreject,
    lenderPending,
    lenderupdate } = require("../Controller/LenderApprovalController");
const { getLoadData } = require("../Controller/borrowingLoadController");
const { cronalert } = require("../Controller/alertTriggerController");
const { generateCronExpression } = require("../Controller/cronExpressionController");
const { alertData } = require("../Controller/alertApiController");

// Sanction
const { sanctionApprove } = require("../Controller/sanctionController");
const { lenderCodes } = require("../Controller/sanctionController");
const { sanctionUpdate } = require("../Controller/sanctionController");
const { sanctionView } = require("../Controller/sanctionController");
const { sanctionReject } = require("../Controller/sanctionController");
const { sanctionFetch } = require("../Controller/sanctionController");
const { sanctionPending } = require("../Controller/sanctionController");
const { sanctionCreate } = require("../Controller/sanctionController");

// ROC Form
const { sanctionId, rocValidate } = require("../Controller/rocformController")
const { rocCreate } = require("../Controller/rocformController")
const { rocFetch } = require("../Controller/rocformController")
const { rocView } = require("../Controller/rocformController")
const { rocUpdate } = require("../Controller/rocformController")
const { rocApprove } = require("../Controller/rocformController")
const { rocReject } = require("../Controller/rocformController")
const { rocPending } = require("../Controller/rocformController")

// Bank Account Repayment 
const { bankCreate,
    bankFetch,
    bankView,
    bankUpdate,
    bankApprove,
    bankReject,
    bankPending } = require("../Controller/repaymentController")


// Executed Documents 
const { executedCreate,
    executedFetch,
    executedView,
    executedUpdate,
    executedApprove,
    executedReject,
    executedPending,
    viewdocument,
    executedValidate } = require("../Controller/executedDocxController");

// Tranche
const { trancheCreate,
    trancheFetch,
    trancheView,
    trancheUpdate,
    trancheApprove,
    trancheReject,
    tranchePending,
    trancheTwo } = require("../Controller/trancheController");

//upload
const { uploadFileToS3 } = require("../s3_Bucket/S3service")
const { uploadFileToLocal } = require("../s3_Bucket/localstorage")

//repayment
const { uploadRepaymentSchedule,
    RSfetchAll,
    scheduleApprove,
    scheduleReject } = require("../Controller/repaymentscheduleuploadcontroller");

const { intrestCreate,
    intrestFetch,
    intrestView,
    intrestUpdate,
    intrestPending,
    intrestApprove,
    intrestReject,
    interestThree } = require("../Controller/IntrestRateController");

// 

const router = express.Router();

router.post("/Login", login);

// Post Main Table API
router.post("/Lender/create", lenderCreate);
router.get("/lender/list", getLenders);
router.post("/lender/Approve", lenderApprove);
router.post("/lender/reject", lenderreject);
router.get("/lender/details", getLendesAll);
router.patch("/lender/update/:lender_code", lenderupdate);
router.get("/lender/pendingdata", lenderPending);
router.get("/Load/AllData", getLoadData);
// router.get("/lender/fetchlendercodes", getLendercodes)

// Sanctiondetails API's
router.get("/sanction/lendercodes", lenderCodes);
router.post("/sanction/create", sanctionCreate);
router.get("/sanction/fetchAll", sanctionFetch);
router.get("/sanction/details", sanctionView);
router.patch("/sanction/update/:sanction_id", sanctionUpdate);
router.post("/sanction/Approve", sanctionApprove);
router.post("/sanction/reject", sanctionReject)
router.get("/sanction/pendingData", sanctionPending);

// ROC Form
// use all sanctionid requests
router.get("/roc/sanctionid", sanctionId);

router.post("/roc/create", rocCreate);
router.get("/roc/fetchAll", rocFetch);
router.get("/roc/details", rocView);
router.patch("/roc/update/:sanction_id", rocUpdate);
router.post("/roc/Approve", rocApprove);
router.post("/roc/reject", rocReject);
router.get("/roc/pendingData", rocPending);
router.get("/roc/validate",rocValidate)

// Bank Account Repayment
// router.get("/bankrepayment/sanctionid", sanctionId);
router.post("/bankrepayment/create", bankCreate);
router.get("/bankrepayment/fetchAll", bankFetch);
router.get("/bankrepayment/details", bankView);
router.patch("/bankrepayment/update/:sanction_id", bankUpdate);
router.post("/bankrepayment/Approve", bankApprove);
router.post("/bankrepayment/reject", bankReject);
router.get("/bankrepayment/pendingData", bankPending);

// Executed Documents API's
router.post("/executed/create", executedCreate);
router.get("/executed/fetchAll", executedFetch);
router.get("/executed/details/:sanction_id", executedView);
router.patch("/executed/update/:sanction_id", executedUpdate);
router.post("/executed/Approve", executedApprove);
router.post("/executed/reject", executedReject);
router.get("/executed/pendingData", executedPending);
router.get("/executed/document/:sanction_id", viewdocument);
router.get("/executed/validate", executedValidate);

// Tranche
router.post("/tranche/create", trancheCreate)
router.get("/tranche/fetchAll", trancheFetch);
router.get("/tranche/details", trancheView);
router.patch("/tranche/update/:tranche_id", trancheUpdate);
router.post("/tranche/Approve", trancheApprove);
router.post("/tranche/reject", trancheReject);
router.get("/tranche/pendingData", tranchePending);
// Tranche id,sanction_id api,lender_code
router.get("/tranche/findTwo", trancheTwo);

// Intrest Rate
router.post("/interest/create", intrestCreate)
router.get("/interest/fetchAll", intrestFetch)
router.get("/interest/details", intrestView);
router.patch("/interest/update/:sanction_id", intrestUpdate);
router.post("/interest/Approve", intrestApprove);
router.post("/interest/reject", intrestReject);
router.get("/interest/pendingData", intrestPending);
router.get("/interest/findthree", interestThree);

// Upload Repayment 
// router.post("/uploadrepayment/create",uploadRepayment);

// cron API's
router.post("/crons/alert", cronalert);
router.post("/cron/create", generateCronExpression)

//repayment 
router.get("/alert/findall", alertData);

//upload
router.post("/upload-s3", uploadFileToS3);
router.post("/upload-local", uploadFileToLocal);

// Repayment Schedule
router.post("/upload-repayment-schedule", uploadRepaymentSchedule);
router.get("/repayment/schedule/fetchAll", RSfetchAll);
router.post("/schedule/Approve", scheduleApprove);
router.post("/schedule/Reject", scheduleReject);

module.exports = router;
