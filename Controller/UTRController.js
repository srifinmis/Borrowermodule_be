const { sequelize } = require('../config/db');
const initModels = require('../models/init-models');
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const models = initModels(sequelize);
const { sanction_details, executed_documents_staging, executed_documents, payment_details } = models;

//sending Create Executed Documents  
exports.UTRCreate = async (req, res) => {

    const data = req.body;
    let temp = data.createdby;
    const JWT_SECRET = process.env.JWT_SECRET;
    const decoded = jwt.verify(temp, JWT_SECRET);

    const executedData = {
        sanction_id: data.sanctionId,
        document_type: data.documentType,
        file_name: data.fileName,
        uploaded_date: data.uploadedDate,
        document_url: data.fileUrl || null, // Convert "" to null
        approval_status: data.approval_status || "Approval Pending",
        // createdat: new Date(),
        // updatedat: new Date(),
        lender_code: data.lender_code,
        user_type: "N",
        updatedby: decoded.id,
        createdby: decoded.id
    };
    // console.log('Data from FD:  ', data);
    try {

        const newRoc = await executed_documents_staging.create(executedData);
        res.status(201).json({ message: "Executed Documents added successfully", data: newRoc });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};