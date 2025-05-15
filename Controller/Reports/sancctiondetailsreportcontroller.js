// const ExcelJS = require('exceljs');
// const PDFDocument = require('pdfkit');
// const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = require('docx');
// const { Op } = require('sequelize');
// const { sequelize } = require('../../config/db');
// const initModels = require('../../models/init-models');

// require('dotenv').config();
// const models = initModels(sequelize);
// const { sanction_details } = models;

// exports.generateSanctionMasterReport = async (req, res) => {
//   const { fromDate, toDate, lenders, format, sortBy } = req.body;

//   try {
//     const start = new Date(fromDate);
//     const end = new Date(toDate);
//     end.setHours(23, 59, 59, 999);
//     if (isNaN(start) || isNaN(end)) {
//       return res.status(400).json({ error: 'Invalid date range provided' });
//     }

//     const whereClause = {
//       createdat: { [Op.between]: [start, end] }
//     };

//     if (lenders !== 'all') {
//       whereClause.lender_code = { [Op.in]: lenders };
//     }

//     const data = await sanction_details.findAll({
//       where: whereClause,
//       order: [[sortBy, 'ASC']],
//       raw: true,
//       logging: console.log // 👈 logs the raw SQL
//     });

//     const ORG_NAME = process.env.ORG_NAME || 'Organization Name';
//     const ORG_ADDRESS = process.env.ORG_ADDRESS || 'Organization Address';
//     const REPORT_TITLE = process.env.REPORT_TITLE || 'Sanction Master Details';

//     const headerInfo = [ORG_NAME, '', ORG_ADDRESS, '', REPORT_TITLE, ''];

//     const columns = [
//       { header: 'Sanction ID', key: 'sanction_id', width: 20 },
//       { header: 'Sanction Date', key: 'sanction_date', width: 15 },
//       { header: "Lender's Code", key: 'lender_code', width: 20 },
//       { header: "Lender's Name", key: 'lender_name', width: 25 },
//       { header: 'Facility Type', key: 'facility_type', width: 20 },
//       { header: 'Purpose of the Loan', key: 'loan_purpose', width: 25 },
//       { header: 'Interest Type', key: 'interest_type', width: 20 },
//       { header: 'Interest Rate', key: 'interest_rate', width: 15 },
//       { header: 'Loan Tenure', key: 'loan_tenure', width: 15 },
//       { header: 'Sanctioned Amount (₹)', key: 'sanction_amount', width: 25 },
//       { header: 'Processing Fee', key: 'processing_fee', width: 20 },
//       { header: 'Management Fee', key: 'management_fee', width: 20 },
//       { header: 'Other Expenses', key: 'other_expenses', width: 20 },
//       { header: 'Loan Status', key: 'loan_status', width: 15 },
//       { header: 'Loan Closure Date', key: 'loan_closure_date', width: 20 },
//     ];

//     if (format === 'excel') {
//       const workbook = new ExcelJS.Workbook();
//       const sheet = workbook.addWorksheet('Sanction Master');

//       // Add organization header rows
//       headerInfo.forEach(line => sheet.addRow([line]));
//       sheet.addRow([]);

//       // Set column headers
//       sheet.columns = columns;

//       // Optional: Bold the header row
//       const headerRow = sheet.getRow(sheet.lastRow.number); // Correctly reference the actual header
//       headerRow.font = { bold: true };

//       // Add data rows
//       data.forEach(row => {
//         const rowData = {};
//         columns.forEach(col => {
//           rowData[col.key] = row[col.key];
//         });
//         sheet.addRow(rowData);
//       });

//       // Set response headers
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', 'attachment; filename=Sanction_Master_Report.xlsx');
//       await workbook.xlsx.write(res);
//       res.end();

//     }
//      else if (format === 'pdf') {
//       const doc = new PDFDocument({ margin: 30 });
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', 'attachment; filename=Sanction_Master_Report.pdf');
//       doc.pipe(res);

//       headerInfo.forEach(line => doc.fontSize(12).text(line, { align: 'center' }));
//       doc.moveDown();

//       doc.fontSize(10).text(columns.map(col => col.header).join(' | '), { align: 'left' });
//       doc.moveDown();

//       data.forEach(row => {
//         const line = columns.map(col => row[col.key]).join(' | ');
//         doc.text(line, { align: 'left' });
//       });

//       doc.end();

//     } else if (format === 'word') {
//       const tableRows = [
//         new TableRow({
//           children: columns.map(col => new TableCell({
//             children: [new Paragraph({ text: col.header, bold: true })],
//             width: { size: 20, type: WidthType.PERCENTAGE },
//           })),
//         }),
//         ...data.map(row =>
//           new TableRow({
//             children: columns.map(col => new TableCell({
//               children: [new Paragraph(`${row[col.key] ?? ''}`)],
//               width: { size: 20, type: WidthType.PERCENTAGE },
//             })),
//           })
//         ),
//       ];

//       const doc = new Document({
//         sections: [{
//           children: [
//             ...headerInfo.map(line => new Paragraph({ text: line, alignment: AlignmentType.CENTER })),
//             new Paragraph(''),
//             new Table({ rows: tableRows }),
//           ],
//         }],
//       });

//       const buffer = await Packer.toBuffer(doc);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
//       res.setHeader('Content-Disposition', 'attachment; filename=Sanction_Master_Report.docx');
//       res.send(buffer);

//     } else {
//       res.status(400).json({ error: 'Invalid format selected' });
//     }
//   } catch (error) {
//     console.error('Error generating report:', error);
//     res.status(500).send('Server Error');
//   }
// };




const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, AlignmentType, WidthType } = require('docx');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/db');
const initModels = require('../../models/init-models');

require('dotenv').config();
const models = initModels(sequelize);
const { sanction_details } = models;

exports.generateSanctionDetailsReport = async (req, res) => {
    const { fromDate, toDate, lenders, format, sortBy } = req.body;

    try {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ error: 'Invalid date range provided' });
        }

        const whereClause = {
            sanction_date: { [Op.between]: [start, end] }
        };

        if (lenders !== 'all') {
            whereClause.lender_code = { [Op.in]: lenders };
        }

        const validSortFields = ['lender_code', 'sanction_id', 'sanction_date'];
        const sortColumn = validSortFields.includes(sortBy) ? sortBy : 'sanction_date';

        const data = await sanction_details.findAll({
            where: whereClause,
            order: [[sortColumn, 'ASC']],
            raw: true
        });

        const ORG_NAME = process.env.LENDER_HEADER_LINE1 || 'SRIFIN CREDIT PRIVATE LIMITED';
        const ORG_ADDRESS = process.env.ORG_ADDRESS || 'Unit No. 509, 5th Floor, Gowra Fountainhead, Sy. No. 83(P) & 84(P),Patrika Nagar, Madhapur, Hitech City, Hyderabad - 500081, Telangana.';
        const REPORT_TITLE = process.env.REPORT_TITLE || 'Sanction Details';

        const headerInfo = [
            ORG_NAME,
            '',
            ORG_ADDRESS,
            '',
        ];

        const columns = [
            { header: 'Sanction ID', key: 'sanction_id', width: 20 },
            { header: 'Lender Code', key: 'lender_code', width: 20 },
            { header: 'Facility Type', key: 'facility_type', width: 25 },
            { header: 'Sanction Date', key: 'sanction_date', width: 20 },
            { header: 'Sanction Amount (₹)', key: 'sanction_amount', width: 25 },
            { header: 'Tenure (Months)', key: 'tenure', width: 20 },
            { header: 'Interest Rate (%)', key: 'interest_rate', width: 20 },
            { header: 'Status', key: 'status', width: 20 },
            { header: 'Closure Date', key: 'closure_date', width: 20 }
        ];

        // === Excel Format ===
        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Sanction Details');

            const orgNameRow = sheet.addRow([ORG_NAME]);
            sheet.mergeCells(`A${orgNameRow.number}:I${orgNameRow.number}`);
            orgNameRow.font = { bold: true, size: 14 };
            orgNameRow.alignment = { horizontal: 'center' };

            sheet.addRow([]);
            const addressRow = sheet.addRow([ORG_ADDRESS]);
            sheet.mergeCells(`A${addressRow.number}:I${addressRow.number}`);
            addressRow.font = { size: 12 };
            addressRow.alignment = { horizontal: 'center' };
            sheet.addRow([]);

            const headerRow = sheet.addRow(columns.map(col => col.header));
            headerRow.font = { bold: true };
            headerRow.alignment = { horizontal: 'center' };
            columns.forEach((col, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            });

            data.forEach(row => {
                const rowData = columns.map(col => row[col.key] || '');
                const dataRow = sheet.addRow(rowData);
                rowData.forEach((_, idx) => {
                    const cell = dataRow.getCell(idx + 1);
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                });
            });

            columns.forEach((col, i) => {
                sheet.getColumn(i + 1).width = col.width || 20;
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Sanction_Details_Report.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        }

        // === PDF Format ===
        else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Sanction_Details_Report.pdf');
            doc.pipe(res);

            headerInfo.forEach(line => doc.fontSize(12).text(line, { align: 'center' }));
            doc.moveDown().fontSize(10).text(`Report: ${REPORT_TITLE}`, { align: 'center' }).moveDown(2);

            const charWidth = 6.5;
            const columnWidths = columns.map(col => col.header.length * charWidth);
            const startX = doc.page.margins.left;
            let y = doc.y;
            const rowHeight = 20;

            let x = startX;
            columns.forEach((col, i) => {
                doc.font('Helvetica-Bold').fontSize(10).text(col.header, x + 2, y + 5, {
                    width: columnWidths[i] - 4,
                    align: 'center'
                });
                x += columnWidths[i];
            });
            y += rowHeight;

            data.forEach(row => {
                x = startX;
                columns.forEach((col, i) => {
                    doc.font('Helvetica').fontSize(10).text(`${row[col.key] ?? ''}`, x + 2, y + 5, {
                        width: columnWidths[i] - 4,
                        align: 'center'
                    });
                    x += columnWidths[i];
                });
                y += rowHeight;
                if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
                    doc.addPage();
                    y = doc.y;
                }
            });

            doc.end();
        }

        // === Word Format ===
        else if (format === 'word') {
            const rows = [
                new TableRow({
                    children: columns.map(col =>
                        new TableCell({
                            children: [new Paragraph({ text: col.header, bold: true })],
                            width: { size: 100 / columns.length, type: WidthType.PERCENTAGE }
                        })
                    )
                }),
                ...data.map(row =>
                    new TableRow({
                        children: columns.map(col =>
                            new TableCell({
                                children: [new Paragraph(`${row[col.key] ?? ''}`)],
                                width: { size: 100 / columns.length, type: WidthType.PERCENTAGE }
                            })
                        )
                    })
                )
            ];

            const doc = new Document({
                sections: [{
                    children: [
                        ...headerInfo.map(line => new Paragraph({ text: line, alignment: AlignmentType.CENTER })),
                        new Paragraph(''),
                        new Table({ rows })
                    ]
                }]
            });

            const buffer = await Packer.toBuffer(doc);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', 'attachment; filename=Sanction_Details_Report.docx');
            res.send(buffer);
        }

        else {
            res.status(400).json({ error: 'Invalid format selected' });
        }

    } catch (err) {
        console.error('Error generating Sanction Details Report:', err);
        res.status(500).send('Server Error');
    }
};
