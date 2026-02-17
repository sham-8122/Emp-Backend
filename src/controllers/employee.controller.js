const { Employee, SalaryHistory, PayrollRecord } = require("../models");
const { fn, col, Op } = require("sequelize");
const { sendPaySlipEmail } = require('../services/mail.service');
const { v4: uuidv4 } = require('uuid'); // --- FIXED: Top-level import only once ---

// Helper: Salary component logic
const calculateBreakup = (totalSalary) => {
  const basic = Math.round(totalSalary * 0.40);
  const hra = Math.round(totalSalary * 0.20);
  const da = Math.round(totalSalary * 0.10);
  const travel = Math.round(totalSalary * 0.05);
  const special = totalSalary - (basic + hra + da + travel);
  return { basic, hra, da, travel, special };
};

// Helper: Find by UUID logic
const findEmployeeByUUID = async (uuid) => {
  return await Employee.findOne({ where: { employeeCode: uuid } });
};

/* ==============================
   GET ALL EMPLOYEES
============================== */
exports.getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    const sort = req.query.sort || "createdAt_DESC";
    const role = req.query.role || "";

    const offset = (page - 1) * limit;
    const [sortField, sortOrder] = sort.split('_');
    
    let whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (role) whereClause.role = role;

    const { count, rows } = await Employee.findAndCountAll({
      where: whereClause,
      order: [[sortField, sortOrder]],
      limit: limit,
      offset: offset,
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      employees: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   GET SINGLE EMPLOYEE (By UUID)
============================== */
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await findEmployeeByUUID(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   CREATE EMPLOYEE
============================== */
exports.createEmployee = async (req, res) => {
  try {
    const profileImage = req.file ? req.file.path : null;
    const employee = await Employee.create({ ...req.body, profileImage });

    await SalaryHistory.create({
      EmployeeId: employee.id,
      previousSalary: 0,
      newSalary: employee.salary,
      incrementDate: new Date()
    });

    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   UPDATE EMPLOYEE (By UUID)
============================== */
exports.updateEmployee = async (req, res) => {
  try {
    const currentEmployee = await findEmployeeByUUID(req.params.id);
    if (!currentEmployee) return res.status(404).json({ message: "Not found" });

    const newSalary = parseFloat(req.body.salary);
    if (newSalary !== currentEmployee.salary) {
      await SalaryHistory.create({
        EmployeeId: currentEmployee.id,
        previousSalary: currentEmployee.salary,
        newSalary: newSalary
      });
    }

    let updateData = { ...req.body, salary: newSalary };
    if (req.file) updateData.profileImage = req.file.path;

    await Employee.update(updateData, { where: { id: currentEmployee.id } });
    res.json(await Employee.findByPk(currentEmployee.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   DELETE EMPLOYEE (By UUID)
============================== */
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await findEmployeeByUUID(req.params.id);
    if (!employee) return res.status(404).json({ message: "Not found" });
    await employee.destroy();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   GET HISTORY (By UUID)
============================== */
exports.getSalaryHistory = async (req, res) => {
  try {
    const employee = await findEmployeeByUUID(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const history = await SalaryHistory.findAll({
      where: { EmployeeId: employee.id },
      order: [['incrementDate', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   GET PAYROLL (By UUID)
============================== */
exports.getPayrollHistory = async (req, res) => {
  try {
    const employee = await findEmployeeByUUID(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const history = await PayrollRecord.findAll({
      where: { EmployeeId: employee.id },
      order: [['paymentDate', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   CREDIT SALARY (By UUID)
============================== */
exports.creditSalary = async (req, res) => {
  try {
    const employee = await findEmployeeByUUID(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const currentYear = today.getFullYear();

    const existing = await PayrollRecord.findOne({
      where: { EmployeeId: employee.id, month: currentMonth, year: currentYear }
    });

    if (existing) {
      return res.status(400).json({ message: `Salary for ${currentMonth} already credited!` });
    }

    await PayrollRecord.create({
      EmployeeId: employee.id,
      month: currentMonth,
      year: currentYear,
      amount: employee.salary
    });

    res.json({ message: `Salary credited successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   SEND PAY SLIP
============================== */
exports.sendPaySlip = async (req, res) => {
  try {
    const employee = await findEmployeeByUUID(req.params.id);
    if (!employee) return res.status(404).json({ message: "Not found" });

    const breakup = calculateBreakup(employee.salary);
    const htmlBody = `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #4f46e5;">Salary Slip</h2>
        <p>Hello ${employee.name},</p>
        <p>Total Gross: <strong>₹${employee.salary.toLocaleString()}</strong></p>
      </div>`;
    
    const result = await sendPaySlipEmail(employee, htmlBody);
    res.json(result.success ? { message: "Sent!" } : { message: "Failed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   GET STATS
============================== */
exports.getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.count();
    const totalSalary = await Employee.sum("salary");
    const avgSalary = await Employee.findOne({
      attributes: [[fn("AVG", col("salary")), "avgSalary"]],
      raw: true,
    });
    const highestPaid = await Employee.findOne({ order: [["salary", "DESC"]] });

    res.json({
      totalEmployees,
      totalSalary: totalSalary || 0,
      averageSalary: Number(avgSalary?.avgSalary || 0).toFixed(2),
      highestPaidEmployee: highestPaid ? highestPaid.name : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   ONE-TIME FIX: SEED UUIDs
============================== */
exports.seedUUIDs = async (req, res) => {
  try {
    const employees = await Employee.findAll({ where: { employeeCode: null } });
    let count = 0;
    for (const emp of employees) {
      emp.employeeCode = uuidv4();
      await emp.save();
      count++;
    }
    res.json({ message: `Successfully generated UUIDs for ${count} employees.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};