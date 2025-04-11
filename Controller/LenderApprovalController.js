const { sequelize } = require("../config/db");
const initModels = require("../models/init-models");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");


const models = initModels(sequelize);
const { lender_master_staging, lender_master } = models;


exports.lenderCreate = async (req, res) => {
    const data = req.body;
    // console.log("DATA:", data.createdby);
    // console.log("Data2:", data.updatedby);
    let temp = data.createdby;
    const JWT_SECRET = process.env.JWT_SECRET;
    const decoded = jwt.verify(temp, JWT_SECRET);
    // console.log("decoded: ", decoded.id);
    const lenderData = {
        lender_code: data.lender_code,
        lender_name: data.lender_name,
        lender_type: data.lender_type,
        lender_address_1: data.lender_address_1,
        lender_address_2: data.lender_address_2,
        lender_address_3: data.lender_address_3,
        lender_contact_1: data.lender_contact_1,
        lender_contact_2: data.lender_contact_2 || null,
        lender_contact_3: data.lender_contact_3 || null,
        lender_email_id_1: data.lender_email_id_1,
        lender_email_id_2: data.lender_email_id_2 || null,
        lender_email_id_3: data.lender_email_id_3 || null,
        lender_spoc_name: data.lender_spoc_name,
        lender_spoc_contact: data.lender_spoc_contact,
        lender_spoc_email: data.lender_spoc_email,
        lender_escalation_name: data.lender_escalation_name || null,
        lender_escalation_contact: data.lender_escalation_contact || null,
        lender_escalation_email: data.lender_escalation_email || null,
        status: data.status,
        createdat: new Date(),
        updatedat: new Date(),
        createdby: decoded.id || null,
        updatedby: decoded.id || null,
        remarks: data.remarks || null,
        user_type: "N",
        approval_status: data.approval_status || "Approval Pending"
    };
    // console.log('Data from FD:  ', datagot);
    try {
        const newLender = await lender_master_staging.create(lenderData);
        res.status(201).json({ message: "Lender added successfully✅", data: newLender });
    } catch (error) {
        // console.error("Lender Error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// // LenderUpdate Data Staging and Main tables

exports.lenderupdate = async (req, res) => {
    const { lender_code, user_type } = req.body;
    const data = req.body;
    data.id = null;
    console.log("data: ", data);
    const newData = data;
    console.log("new object data: ", newData);

    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        const decoded = jwt.verify(data.createdby, JWT_SECRET);

        // Check for Approved record in lender_master
        const existingLender = await lender_master.findOne({
            where: {
                lender_code: lender_code,
                approval_status: "Approved"
            }
        });

        // Check for Rejected records in staging
        const rejectedStagingLenders = await lender_master_staging.findAll({
            where: { lender_code: lender_code, approval_status: "Rejected" }
        });

        // NEW RULE: If user_type = "N", check lender_master for duplicate
        if (user_type === "N") {
            const existsInMaster = await lender_master.findOne({
                where: { lender_code: lender_code }
            });

            if (existsInMaster) {
                return res.status(400).json({
                    status: "error",
                    message: "This lender_code already exists in master. Cannot create new record."
                });
            }

            const newRecord = {
                ...data,
                createdat: new Date(),
                updatedat: new Date(),
                approval_status: "Approval Pending",
                createdby: decoded.id,
                updatedby: decoded.id,
                user_type: "U", // Update to "U"
                id: null
            };

            const newStagingRecord = await lender_master_staging.create(newRecord);

            return res.status(201).json({
                status: "success",
                message: "New lender created with user_type updated to 'U'.",
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
                id: null
            };

            const newStagingRecord = await lender_master_staging.create(newRecord);

            return res.status(201).json({
                status: "success",
                message: "Record inserted .",
                NewStagingRecord: newStagingRecord
            });
        }

        // Proceed with update flow if existingLender found (edit case)
        let updatedFields = [];
        if (existingLender) {
            Object.keys(newData).forEach((key) => {
                if (newData[key] !== existingLender[key]) {
                    updatedFields.push(key);
                }
            });

            const existingStagingLender = await lender_master_staging.findOne({
                where: {
                    lender_code: lender_code,
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
                createdby: decoded.id,
                updatedby: decoded.id
            };

            const newStagingRecord = await lender_master_staging.create(recordWithPendingApproval);

            return res.status(201).json({
                status: "success",
                message: "Lender update request is in progress. No further updates allowed until approved.",
                NewStagingRecord: newStagingRecord,
                updatedFields: updatedFields
            });
        }

        // Check for pending edits again
        const existingStagingLender = await lender_master_staging.findOne({
            where: {
                lender_code: lender_code,
                approval_status: "Approval Pending"
            }
        });

        if (existingStagingLender) {
            return res.status(400).json({
                status: "error",
                message: "Lender already exists, no further updates allowed until approved."
            });
        }

        // If rejected record exists and master doesn't have this code, create new
        if (!existingLender && rejectedStagingLenders.length > 0) {
            const lastRejected = rejectedStagingLenders[rejectedStagingLenders.length - 1];

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
                user_type: "U",
                updated_fields: updatedFields,
                id: null
            };

            const newStagingRecord = await lender_master_staging.create(recordPendingApproval);

            return res.status(201).json({
                status: "success",
                message: "New record created for previously rejected lender_code.",
                NewStagingRecord: newStagingRecord,
                updatedFields: updatedFields
            });
        }

        // Final fallback: try updating the existing staging record
        const [updateCount, updatedRecords] = await lender_master_staging.update(data, {
            where: { lender_code: lender_code },
            returning: true
        });

        if (updateCount === 0) {
            return res.status(404).json({
                status: "error",
                message: "Lender not found or no changes detected."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Lender updated successfully.",
            updatedFields: updatedFields,
            UpdatedLender: updatedRecords ? updatedRecords[0] : null
        });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
    }
};



exports.lenderApprove = async (req, res) => {
    try {
        // Ensure req.body is an array for bulk insert
        if (!Array.isArray(req.body)) {
            return res.status(400).json({
                message: "Invalid data format, expected an array of lenders"
            });
        }

        // 1. Upsert lenders in lender_master (update if exists, create if new)
        const newLenders = await Promise.all(
            req.body.map(async (lender) => {
                const existingLender = await lender_master.findOne({
                    where: { lender_code: lender.lender_code }
                });

                if (existingLender) {
                    // Lender exists, update the record
                    await lender_master.update(
                        {
                            ...lender,
                            updatedat: new Date(),
                            remarks: lender.remarks,
                            approval_status: "Approved",
                        },
                        { where: { lender_code: lender.lender_code } }
                    );

                    return existingLender;
                } else {
                    // Lender does not exist, insert new record
                    const newLenderRecord = await lender_master.create({
                        ...lender,
                        updatedat: new Date(),
                        createdat: new Date(),
                        lender_code: lender.lender_code,
                        remarks: lender.remarks,
                        approval_status: "Approved",

                    });

                    return newLenderRecord;
                }
            })
        );

        // 2. Update lender_master_staging
        const updatedLenders = await Promise.all(
            req.body.map(async (lender) => {
                return await lender_master_staging.update(
                    {
                        updatedat: new Date(),
                        approval_status: "Approved",
                        user_type: "U",
                        remarks: lender.remarks  // Set remarks for each lender
                    },
                    {
                        where: {
                            lender_code: lender.lender_code,
                            lender_name: lender.lender_name,
                            approval_status: "Approval Pending"  // Only update those with "Approval Pending" status
                        }
                    }
                );
            })
        );
        console.log("Update staging: ", updatedLenders)

        res.status(201).json({
            message: "Lenders added successfully",
            datatoMain: newLenders,
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

// LenderMaster reject API
exports.lenderreject = async (req, res) => {
    try {
        // console.log("Received Lender Data:", req.body);

        // Ensure req.body is an array for bulk insert
        if (!Array.isArray(req.body)) {
            return res.status(400).json({
                message: "Invalid data format, expected an array of lenders"
            });
        }

        const updatePromises = req.body.map(lender => {
            return lender_master_staging.update(
                {
                    approval_status: "Rejected",
                    updatedat: new Date(),
                    user_type: lender.user_type,
                    remarks: lender.remarks,
                },
                { where: { lender_code: lender.lender_code, approval_status: "Approval Pending" } }
            );
        });

        // Wait for all updates to finish
        await Promise.all(updatePromises);

        res.status(201).json({
            message: "Lenders Rejected successfully"
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }

}

// LenderMasterCreate from maintable get approved API
exports.getLenders = async (req, res) => {
    try {
        const lenders = await lender_master_staging.findAll({
            attributes: [
                "lender_code", "lender_name", "lender_type", "status", "lender_email_id_1", "createdat", "updatedat", "approval_status"
            ], where: {
                approval_status: { [Op.or]: ["Approval Pending", "Rejected"] }
            }
        });
        const lendermain = await lender_master.findAll({
            attributes: [
                "lender_code", "lender_name", "lender_type", "status", "lender_email_id_1", "createdat", "updatedat", "approval_status"
            ], where: { approval_status: "Approved" }
        });

        return res.status(201).json({ success: true, data: lenders, mainData: lendermain });
    } catch (error) {
        console.error("Error fetching lenders:", error);
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


// // LenderMasterApproval Page API
exports.getLendesAll = async (req, res) => {
    const { lender_code, approval_status, lender_name, updatedat } = req.query;

    const originalDate = new Date(updatedat);
    const updatedDate = new Date(originalDate.getTime() + (5 * 60 + 30) * 60 * 1000);
    console.log("got: ", lender_code, approval_status, lender_name, updatedat)
    try {
        if (approval_status === 'Approved') {
            const lender = await lender_master.findOne({
                where: { lender_code, approval_status: approval_status, lender_name: lender_name, updatedat: updatedDate }
            });
            if (lender) {
                return res.status(200).json({ lender });
            } else {
                return res.status(404).json({ message: "Approved lender not found" });
            }
        } else if (approval_status === 'Approval Pending') {
            // Check if lender_code and approval_status is "Approval Pending" in lender_master_staging
            const lender = await lender_master_staging.findOne({
                where: { lender_code, approval_status: approval_status, lender_name: lender_name, updatedat: updatedDate }
            });

            if (lender) {
                return res.status(200).json({ lender });
            } else {
                return res.status(404).json({ message: "Approval Pending lender not found" });
            }
        } else if (approval_status === 'Rejected') {
            // Check if lender_code and approval_status is "Approval Pending" in lender_master_staging
            const lender = await lender_master_staging.findOne({
                where: { lender_code, approval_status: approval_status, lender_name: lender_name, updatedat: updatedDate }
            });

            if (lender) {
                return res.status(200).json({ lender });
            } else {
                return res.status(404).json({ message: "Rejected lender not found" });
            }
        } else {
            return res.status(400).json({ message: "Invalid approval status" });
        }
    } catch (error) {
        console.error("Error fetching lender details:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

//lender apprivalpending api

exports.lenderPending = async (req, res) => {
    try {
        // const { lender_code } = req.params;
        const lender = await lender_master_staging.findAll({
            where: { approval_status: "Approval Pending" }
        });

        if (!lender || lender.length === 0) {
            return res.status(404).json({ message: "Lender not found" });
        }

        res.status(200).json(lender);
    } catch (error) {
        console.error("Error fetching lender:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }

}

