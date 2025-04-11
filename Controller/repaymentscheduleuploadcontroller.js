const { sequelize } = require('../config/db');
const initModels = require('../models/init-models');
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const moment = require("moment");

const models = initModels(sequelize);
const { repayment_schedule_staging, repayment_schedule, alert_management, tranche_details, sanction_details } = models;
exports.uploadRepaymentSchedule = async (req, res) => {
    try {
        const data = req.body;

        // console.log("Received Data:", JSON.stringify(data, null, 2)); // Debugging

        // Ensure data is properly structured
        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: "No repayment schedule data provided" });
        }

        // Extract `fileData` from the request
        const records = data[0]?.fileData;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ message: "Missing or invalid fileData" });
        }

        // Ensure `createdby` exists in the first record
        if (!records[0]?.createdby) {
            return res.status(400).json({ message: "JWT token is missing in 'createdby' field" });
        }

        const JWT_SECRET = process.env.JWT_SECRET;

        let decoded;
        try {
            decoded = jwt.verify(records[0].createdby, JWT_SECRET);
            console.log(decoded)
        } catch (err) {
            return res.status(401).json({ message: "Invalid token", error: err.message });
        }

        // Prepare bulk data
        const sanitizedData = records.map(record => ({
            repayment_id: record.repayment_id || null,
            sanction_id: record.sanction_id,
            tranche_id: record.tranche_id,
            due_date: record.due_date ? new Date(record.due_date) : null,
            principal_due: record.principal_due || 0,
            interest_due: record.interest_due || 0,
            total_due: record.total_due || 0,
            approval_status: record.status || "Approval Pending",
            createdby: decoded.id,
            updatedby: decoded.id,
            remarks: record.remarks || null,
            createdat: record.createdat ? new Date(record.createdat) : new Date(),
            updatedat: new Date(),
        }));

        // Perform bulk insertion
        const newRepayments = await repayment_schedule_staging.bulkCreate(sanitizedData);

        return res.status(201).json({
            message: "Repayment schedule sent to Approval!",
            data: newRepayments
        });

    } catch (error) {
        console.error("Upload Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.RSfetchAll = async (req, res) => {
    try {
        // const { lender_code } = req.params;
        const repaymentschedule = await repayment_schedule_staging.findAll({
            where: { approval_status: "Approval Pending" }
        });

        if (!repaymentschedule || repaymentschedule.length === 0) {
            return res.status(404).json({ message: "repayment Schedule Details not found" });
        }
        // console.log("repaymentschedule: ", repaymentschedule)
        res.status(201).json({ success: true, data: repaymentschedule });
    } catch (error) {
        console.error("Error fetching repaymentschedule:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
// SanctionDetails reject API
exports.scheduleReject = async (req, res) => {
    console.log("Received Rejected Data:", req.body);
    try {
        // console.log("Received Lender Data:", req.body);

        // Ensure req.body is an array for bulk insert
        if (!Array.isArray(req.body)) {
            return res.status(400).json({
                message: "Invalid data format, expected an array of Schedule"
            });
        }

        const updatePromises = req.body.map(schedule => {
            return repayment_schedule_staging.update(
                { approval_status: "Rejected", remarks: schedule.remarks },
                { where: { sanction_id: schedule.sanction_id, tranche_id: schedule.tranche_id, approval_status: "Approval Pending" } }
                // { where: { sanction_id: schedule.sanction_id, tranche_id: schedule.tranche_id, due_date: schedule.due_date } }
            );
        });

        // Wait for all updates to finish
        await Promise.all(updatePromises);

        res.status(201).json({
            message: "Schedule Rejected successfully"
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}


exports.scheduleApprove = async (req, res) => {
    console.log("approve schedule: ", req.body)
    try {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({
                message: "Invalid data format, expected an array of Schedule"
            });
        }
        const checkexisting = await tranche_details.findAll({
            where: { tranche_id: req.body.tranche_id }
        });
        console.log("existing: ", checkexisting)
        const checkexistingsanction = await sanction_details.findAll({
            where: { tranche_id: req.body.tranche_id }
        });
        console.log("existing: ", checkexistingsanction)

        const newSchedule = await Promise.all(
            req.body.map(async (schedule) => {
                await repayment_schedule.create({
                    ...schedule,
                    remarks: schedule.remarks,
                    approval_status: "Approved",
                });
                // Ensure alert_management is updated
                return await upsertAlertManagement(schedule);
            })
        );

        const updatedSchedule = await Promise.all(
            req.body.map(async (schedule) => {
                return await repayment_schedule_staging.update(
                    {
                        approval_status: "Approved",
                        remarks: schedule.remarks
                    },
                    {
                        where: {
                            sanction_id: schedule.sanction_id,
                            tranche_id: schedule.tranche_id,
                            // due_date: schedule.due_date,
                            approval_status: "Approval Pending"
                        }
                    }
                );
            })
        );

        res.status(201).json({
            message: "Sanction added successfully",
            datatoMain: newSchedule,
            StagingUpdate: updatedSchedule
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// Function to upsert alert in alert_management table
const upsertAlertManagement = async (schedule) => {
    const alert_start_date = moment(schedule.due_date).subtract(7, "days").format("YYYY-MM-DD");
    const alert_end_date = moment(schedule.due_date).format("YYYY-MM-DD");
    const alert_time = "21:00";
    const alert_frequency = "Daily";
    const to_addr = "vishal.intern@srifincredit.com";
    const cc_addr = "singuvishal123@gmail.com";

    // Generate cron expression
    const cron_expression = generateCronExpression(alert_start_date, alert_end_date, alert_time);
    // Insert new alert
    return await alert_management.create({
        sanction_id: schedule.sanction_id,
        tranche_id: schedule.tranche_id,
        alert_time,
        alert_start_date,
        alert_end_date,
        alert_frequency,
        cron_expression,
        to_addr,
        cc_addr
    });
};

// Function to generate cron expression
const generateCronExpression = (alert_start_date, alert_end_date, alert_time) => {
    const [hour, minute] = alert_time.split(":");
    return `${minute} ${hour} * * *`;
};
