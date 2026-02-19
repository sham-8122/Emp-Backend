const { Employee, SalaryHistory, PayrollRecord, Allowance } = require("../models");
const { fn, col, Op } = require("sequelize");
const { sendPaySlipEmail } = require('../services/mail.service');
const { v4: uuidv4 } = require('uuid');

/**
 * Helper: Standard Percentage Calculation (Top-Down)
 * Used when a new employee is added or when total CTC is explicitly changed.
 */
const calculateStandardBreakup = (totalSalary) => {
  const basic = Math.round(totalSalary * 0.40);
  const hra = Math.round(totalSalary * 0.20);
  const da = Math.round(totalSalary * 0.10);
  const travel = Math.round(totalSalary * 0.05);
  const special = totalSalary - (basic + hra + da + travel);
  return { basic, hra, da, travel, special };
};

/**
 * Helper: Recalculate Total Salary (Bottom-Up)
 * Sums standard fields + custom allowances and updates the main salary column.
 */
const recalculateTotalSalary = async (employeeId) => {
  const emp = await Employee.findByPk(employeeId, { include: [Allowance] });
  
  // Sum of custom rows
  const customSum = emp.Allowances ? emp.Allowances.reduce((acc, curr) => acc + curr.amount, 0) : 0;
  
  // Sum of standard components
  const standardSum = (emp.basic || 0) + (emp.hra || 0) + (emp.da || 0) + (emp.travel || 0) + (emp.special || 0);
  
  const newTotal = standardSum + customSum;
  
  if (newTotal !== emp.salary) {
    await emp.update({ salary: newTotal });
  }
  return newTotal;
};

const findEmployeeByUUID = async (uuid) => {
  return await Employee.findOne({ 
    where: { employeeCode: uuid },
    include: [Allowance]
  });
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
   GET SINGLE EMPLOYEE
============================== */
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await findEmployeeByUUID(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Self-Healing: Populate breakdown if it's an old record with 0s
    if (employee.salary > 0 && employee.basic === 0) {
      const breakdown = calculateStandardBreakup(employee.salary);
      await employee.update(breakdown);
    }

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
    const { salary, ...otherData } = req.body;
    
    // Auto-calculate initial breakdown based on total salary
    const breakdown = calculateStandardBreakup(salary);

    const employee = await Employee.create({ 
      ...otherData, 
      salary, 
      profileImage,
      ...breakdown 
    });

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
   UPDATE EMPLOYEE / COMPONENTS
============================== */
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { employeeCode: req.params.id } });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const profileImage = req.file ? req.file.path : undefined;
    const { name, email, role, salary, basic, hra, da, travel, special } = req.body;

    let updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (profileImage) updateData.profileImage = profileImage;

    // IF UPDATING SPECIFIC COMPONENTS (from Salary Details)
    if (basic !== undefined || hra !== undefined || da !== undefined || travel !== undefined || special !== undefined) {
      if (basic !== undefined) updateData.basic = parseFloat(basic);
      if (hra !== undefined) updateData.hra = parseFloat(hra);
      if (da !== undefined) updateData.da = parseFloat(da);
      if (travel !== undefined) updateData.travel = parseFloat(travel);
      if (special !== undefined) updateData.special = parseFloat(special);
      
      await employee.update(updateData);
      // Trigger recalculation to update 'salary' column (Total CTC)
      await recalculateTotalSalary(employee.id);
    } 
    // IF UPDATING TOTAL SALARY (from Edit Employee Form)
    else if (salary !== undefined && Number(salary) !== employee.salary) {
      const breakdown = calculateStandardBreakup(salary);
      updateData = { ...updateData, salary, ...breakdown };
      await employee.update(updateData);
    } else {
      await employee.update(updateData);
    }

    // Refresh and send back
    const updated = await findEmployeeByUUID(req.params.id);
    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   ADD CUSTOM ALLOWANCE
============================== */
exports.addAllowance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { employeeCode: req.params.id } });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const { label, amount } = req.body;
    await Allowance.create({ 
      label, 
      amount: parseFloat(amount), 
      EmployeeId: employee.id 
    });

    // Auto-update Total CTC
    await recalculateTotalSalary(employee.id);

    const updated = await findEmployeeByUUID(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   DELETE EMPLOYEE
============================== */
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { employeeCode: req.params.id } });
    if (!employee) return res.status(404).json({ message: "Not found" });
    await employee.destroy();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   GET SALARY HISTORY
============================== */
exports.getSalaryHistory = async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { employeeCode: req.params.id } });
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
   GET PAYROLL HISTORY
============================== */
exports.getPayrollHistory = async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { employeeCode: req.params.id } });
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
   CREDIT SALARY
============================== */
exports.creditSalary = async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { employeeCode: req.params.id } });
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

    const htmlBody = `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #4f46e5;">Salary Slip</h2>
        <p>Hello ${employee.name},</p>
        <p>Total Gross: <strong>₹${employee.salary.toLocaleString()}</strong></p>
        <p>Basic: ₹${employee.basic.toLocaleString()}</p>
        <p>HRA: ₹${employee.hra.toLocaleString()}</p>
        <p>DA: ₹${employee.da.toLocaleString()}</p>
        <p>Travel: ₹${employee.travel.toLocaleString()}</p>
        <p>Special: ₹${employee.special.toLocaleString()}</p>
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
   SEED UUIDs
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