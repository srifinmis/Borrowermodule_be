const { sequelize } = require('../config/db');
const initModels = require('../models/init-models');
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");

// const tranche_details = require('../models/tranche_details');

const models = initModels(sequelize);
const { tranche_details_staging, tranche_details } = models;

// Sending Create Executed Documents  
exports.trancheCreate = async (req, res) => {
    const data = req.body;
    let temp = data.createdby;
    const JWT_SECRET = process.env.JWT_SECRET;
    const decoded = jwt.verify(temp, JWT_SECRET);

    const trancheData = {
        tranche_id: data.tranche_id,
        sanction_id: data.sanction_id,
        tranche_date: data.tranche_date,
        tranche_number: data.tranche_number,
        tranche_amount: data.tranche_amount || null,
        interest_type: data.interest_type,
        interest_rate: data.interest_rate || null,
        tenure_months: data.tenure_months || null,
        principal_start_date: data.principal_start_date,
        interest_start_date: data.interest_start_date,
        principal_payment_frequency: data.principal_payment_frequency,
        interest_payment_frequency: data.interest_payment_frequency,
        applicable_of_leap_year: data.applicable_of_leap_year,
        interest_calculation_days: data.interest_calculation_days,
        createdat: data.createdat || new Date(),
        updatedat: data.updatedat || new Date(),
        remarks: data.remarks || null,
        approval_status: data.approval_status || "Approval Pending",
        createdby: decoded.id,
        updatedby: decoded.id,
        user_type: "N",
        lender_code: data.lender_code,
        current_ac_no: data.current_ac_no,
        bank_name: data.bank_name,
        bank_branch: data.bank_branch,
        location: data.location,
        ifsc_code: data.ifsc_code,
        conf_acc_no: data.conf_acc_no
    };

    try {
        const newTranche = await tranche_details_staging.create(trancheData);
        res.status(201).json({ message: "Tranche added successfully", data: newTranche });
    } catch (error) {
        console.error("Tranche Error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Tranche Staging from main table get approved API all data
exports.trancheFetch = async (req, res) => {
    const datagot = req.body;
    try {
        const tranche = await tranche_details_staging.findAll({
            attributes: [
                "lender_code", "tranche_id", "sanction_id", "tranche_amount", "interest_type", "interest_rate", "approval_status", "createdat", "updatedat"
            ], where: {
                approval_status: { [Op.or]: ["Approval Pending", "Rejected"] }
            }
        });
        const tranchemain = await tranche_details.findAll({
            attributes: [
                "lender_code", "tranche_id", "sanction_id", "tranche_amount", "interest_type", "interest_rate", "approval_status", "createdat", "updatedat"
            ], where: { approval_status: "Approved" }
        });

        return res.status(201).json({ success: true, data: tranche, mainData: tranchemain });
    } catch (error) {
        console.error("Error fetching tranche:", error);
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.trancheTwo = async (req, res) => {

    const datagot = req.body;
    try {
        const tranchemain = await tranche_details.findAll({
            attributes: [
                "tranche_id", "sanction_id", "lender_code"
            ], where: { approval_status: "Approved" }
        });

        return res.status(201).json({ success: true, data: tranchemain });
    } catch (error) {
        console.error("Error fetching tranche:", error);
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}



// Tranche View get by tranche_id Page API
exports.trancheView = async (req, res) => {
    const { lender_code, sanction_id, tranche_id, approval_status, updatedat } = req.query;
    const originalDate = new Date(updatedat);
    const updatedDate = new Date(originalDate.getTime() + (5 * 60 + 30) * 60 * 1000);
    console.log("backend tranche 5 getall: ", lender_code, sanction_id, tranche_id, approval_status, updatedDate);
    // console.log("backend 2 getall: ", tranche_id, approval_status);
    try {
        if (approval_status === 'Approved') {
            const tranche = await tranche_details.findOne({
                where: { lender_code: lender_code, sanction_id: sanction_id, tranche_id: tranche_id, approval_status: approval_status, updatedat: updatedDate }
            });
            if (tranche) {
                return res.status(200).json({ tranche });
            } else {
                return res.status(404).json({ message: "Approved Tranche not found" });
            }
        } else if (approval_status === 'Approval Pending') {
            const tranche = await tranche_details_staging.findOne({
                where: { lender_code: lender_code, sanction_id: sanction_id, tranche_id: tranche_id, approval_status: approval_status, updatedat: updatedDate }
            });
            if (tranche) {
                return res.status(200).json({ tranche });
            } else {
                return res.status(404).json({ message: "Approval Pending Tranche not found" });
            }
        }
        else if (approval_status === 'Rejected') {
            const tranche = await tranche_details_staging.findOne({
                where: { lender_code: lender_code, sanction_id: sanction_id, tranche_id: tranche_id, approval_status: approval_status, updatedat: updatedDate }
            });
            if (tranche) {
                return res.status(200).json({ tranche });
            } else {
                return res.status(404).json({ message: "Rejected Tranche not found" });
            }
        } else {
            return res.status(400).json({ message: "Invalid approval status" });
        }

    } catch (error) {
        console.error("Error fetching Sanction:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Tranche Update Data Staging and Main tables
exports.trancheUpdate = async (req, res) => {
    const { sanction_id, tranche_id, lender_code, user_type } = req.body;
    const data = req.body;
    data.id = null;
    console.log("data: ", data);
    const newData = data;
    console.log("new object data: ", newData);
    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        const decoded = jwt.verify(data.createdby, JWT_SECRET);
        // Check if the sanction exists in sanction_details with approval_status: "Approved"
        const existingSanction = await tranche_details.findOne({
            where: {
                sanction_id: sanction_id,
                lender_code: lender_code,
                tranche_id: tranche_id,
                approval_status: "Approved"
            }
        });

        // Check for Rejected records in staging
        const rejectedStagingSanction = await tranche_details_staging.findAll({
            where: { lender_code: lender_code, sanction_id: sanction_id, tranche_id: tranche_id, approval_status: "Rejected" }
        });

        // NEW RULE: If user_type = "N", check lender_master for duplicate
        if (user_type === "N") {

            const existsInMaster = await tranche_details.findOne({
                where: { sanction_id: sanction_id, lender_code: lender_code, tranche_id: tranche_id }
            });
            if (existsInMaster) {
                return res.status(400).json({
                    status: "error",
                    message: "This sanction_id,lender_code,Tranche_id combination already exists. Cannot create new record."
                });
            }
            const newRecord = {
                ...data,
                createdat: new Date(),
                updatedat: new Date(),
                approval_status: "Approval Pending",
                createdby: decoded.id,
                updatedby: decoded.id,
                user_type: data.user_type, // Update to "U"
                id: null
            };

            const newStagingRecord = await tranche_details_staging.create(newRecord);

            return res.status(201).json({
                status: "success",
                message: "New ROC Form created.",
                NewStagingRecord: newStagingRecord
            });
        }

        // If user_type is "U", skip master check and insert directly
        if (user_type === "U") {
            const newRecord = {
                ...data,
                createdat: new Date(),
                updatedat: new Date(),
                approval_status: "Approval Pending",
                createdby: decoded.id,
                updatedby: decoded.id,
                user_type: "U",
                id: null
            };

            const newStagingRecord = await tranche_details_staging.create(newRecord);
            console.log("record: ", newRecord)

            return res.status(201).json({
                status: "success",
                message: "Record inserted for user_type U.",
                NewStagingRecord: newStagingRecord
            });
        }


        // Proceed with update flow if existingSanction found (edit case)
        let updatedFields = [];
        if (existingSanction) {
            Object.keys(newData).forEach((key) => {
                if (newData[key] !== existingSanction[key]) {
                    updatedFields.push(key);
                }
            });

            const existingStagingLender = await tranche_details_staging.findOne({
                where: {
                    lender_code: lender_code,
                    sanction_id: sanction_id,
                    tranche_id: tranche_id,
                    approval_status: "Approval Pending"
                }
            });

            if (existingStagingLender) {
                return res.status(400).json({
                    status: "error",
                    message: "There is already a record in progress for edit, no further updates allowed!"
                });
            }

            const recordWithPendingApproval = {
                ...data,
                createdat: new Date(),
                updatedat: new Date(),
                updated_fields: updatedFields,
                approval_status: "Approval Pending",
                id: null,
                user_type: "U",
                createdby: decoded.id,
                updatedby: decoded.id
            };

            const newStagingRecord = await tranche_details_staging.create(recordWithPendingApproval);

            return res.status(201).json({
                status: "success",
                message: "Tranche Details update request is in progress. No further updates allowed until approved.",
                NewStagingRecord: newStagingRecord,
                updatedFields: updatedFields
            });
        }

        // Check for pending edits again
        const existingStagingLender = await tranche_details_staging.findOne({
            where: {
                lender_code: lender_code,
                sanction_id: sanction_id,
                tranche_id: tranche_id,
                approval_status: "Approval Pending"
            }
        });

        if (existingStagingLender) {
            return res.status(400).json({
                status: "error",
                message: "Tranche Details already exists, no further updates allowed until approved."
            });
        }

        // If rejected record exists and master doesn't have this code, create new
        if (!existingSanction && rejectedStagingSanction.length > 0) {
            const lastRejected = rejectedStagingSanction[rejectedStagingSanction.length - 1];

            updatedFields = [];
            Object.keys(newData).forEach((key) => {
                if (newData[key] !== lastRejected[key]) {
                    updatedFields.push(key);
                }
            });

            const recordPendingApproval = {
                ...data,
                createdat: new Date(),
                updatedat: new Date(),
                approval_status: "Approval Pending",
                createdby: decoded.id,
                updatedby: decoded.id,
                // user_type: "U",
                updated_fields: updatedFields,
                id: null
            };

            const newStagingRecord = await tranche_details_staging.create(recordPendingApproval);

            return res.status(201).json({
                status: "success",
                message: "New record created for previously rejected lender_code.",
                NewStagingRecord: newStagingRecord,
                updatedFields: updatedFields
            });
        }

        // Final fallback: try updating the existing staging record
        const [updateCount, updatedRecords] = await tranche_details_staging.update(data, {
            where: { lender_code: lender_code, sanction_id: sanction_id, tranche_id: tranche_id },
            returning: true
        });

        if (updateCount === 0) {
            return res.status(404).json({
                status: "error",
                message: "Trnache Details not found or no changes detected."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Trnache Details updated successfully.",
            updatedFields: updatedFields,
            UpdatedLender: updatedRecords ? updatedRecords[0] : null
        });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
    }
};


// Tranche Details Approval API
exports.trancheApprove = async (req, res) => {
    try {
        console.log("approve Tranche backend:", req.body)
        if (!Array.isArray(req.body)) {
            return res.status(400).json({
                message: "Invalid data format, expected an array of Tranche"
            });
        }
        // 1. Upsert lenders in lender_master (update if exists, create if new)
        const newSanction = await Promise.all(
            req.body.map(async (sanction) => {
                const existingSanction = await tranche_details.findOne({
                    where: {
                        sanction_id: sanction.sanction_id,
                        lender_code: sanction.lender_code,
                        tranche_id: sanction.tranche_id
                    }
                });

                if (existingSanction) {
                    // Lender exists, update the record
                    await tranche_details.update(
                        {
                            ...sanction,
                            updatedat: new Date(),
                            remarks: sanction.remarks,
                            approval_status: "Approved",
                        },
                        {
                            where: {
                                sanction_id: sanction.sanction_id,
                                lender_code: sanction.lender_code,
                                tranche_id: sanction.tranche_id
                            }
                        }
                    );

                    return existingSanction;
                } else {
                    // Lender does not exist, insert new record
                    const newLenderRecord = await tranche_details.create({
                        ...sanction,
                        sanction_id: sanction.sanction_id,
                        createdat: new Date(),
                        updatedat: new Date(),
                        remarks: sanction.remarks,
                        approval_status: "Approved",

                    });

                    return newLenderRecord;
                }
            })
        );

        // 2. Update lender_master_staging
        const updatedLenders = await Promise.all(
            req.body.map(async (sanction) => {
                return await tranche_details_staging.update(
                    {
                        approval_status: "Approved",
                        user_type: "U",
                        remarks: sanction.remarks  // Set remarks for each lender
                    },
                    {
                        where: {
                            sanction_id: sanction.sanction_id,
                            lender_code: sanction.lender_code,
                            tranche_id: sanction.tranche_id,
                            id: sanction.id,
                            approval_status: "Approval Pending"  // Only update those with "Approval Pending" status
                        }
                    }
                );
            })
        );
        console.log("Update staging: ", updatedLenders)

        res.status(201).json({
            message: "Tranche added successfully",
            datatoMain: newSanction,
            StagingUpdate: updatedLenders
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
// Tranche reject API
exports.trancheReject = async (req, res) => {
    try {
        console.log("Received Tranche rejection Data:", req.body);

        // Ensure req.body is an array for bulk insert
        if (!Array.isArray(req.body)) {
            return res.status(400).json({
                message: "Invalid data format, expected an array of Tranche"
            });
        }

        const updatePromises = req.body.map(sanction => {
            return tranche_details_staging.update(
                {
                    approval_status: "Rejected",
                    user_type: sanction.user_type,
                    remarks: sanction.remarks
                },
                {
                    where: {
                        sanction_id: sanction.sanction_id,
                        id: sanction.id,
                        lender_code: sanction.lender_code,
                        tranche_id: sanction.tranche_id,
                        approval_status: "Approval Pending"
                    }
                }
            );
        });

        // Wait for all updates to finish
        await Promise.all(updatePromises);

        res.status(201).json({
            message: "Roc Form Rejected successfully"
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}


// Tranche approval pending API
exports.tranchePending = async (req, res) => {
    try {
        const tranchePending = await tranche_details_staging.findAll({
            where: { approval_status: "Approval Pending" }
        });

        if (!tranchePending || tranchePending.length === 0) {
            return res.status(404).json({ message: "No Pending Tranches found" });
        }

        res.status(201).json({ success: true, data: tranchePending });
    } catch (error) {
        console.error("Error fetching tranche:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};