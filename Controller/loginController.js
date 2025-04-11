const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sequelize } = require('../config/db');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { employee_master } = models;

module.exports.login = async (req, res) => {
  const { emp_id, passwd } = req.body;
  try {
    if (!employee_master) {
      return res.status(500).json({ message: "Model employee_master not found" });
    }

    const user = await employee_master.findOne({ where: { emp_id } });
    if (!user) return res.status(400).json({ message: "User not found" });
    // console.log('hi', user);

    // const saltRounds = 5;
    // const hashedpasswd = await bcrypt.hash(passwd,saltRounds);
    // console.log("hashpass:", hashedpasswd);
    if (user.emp_status !== "ACCEPTED" || user.access_status !== "GRANTED") return res.status(400).json({ message: "ACCESS DENIED!" })

    const validpasswd = await bcrypt.compare(passwd, user.passwd);
    if (!validpasswd) return res.status(400).json({ message: "Invalid Credentials" });
    // console.log('bye', validpasswd);

    const token = jwt.sign({ id: user.emp_id, Role: user.system_role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    console.log('nice', token, user.emp_id, 'Role: ', user.system_role);

    res.status(201).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
