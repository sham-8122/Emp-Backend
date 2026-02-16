const { Employee } = require("../models");
const { fn, col, Op } = require("sequelize"); // Import Op for search operators

/* ==============================
   GET EMPLOYEES (SEARCH + PAGINATION)
============================== */
exports.getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || ""; // Get search term
    const offset = (page - 1) * limit;

    // Dynamic Search Condition
    const searchCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } }, // Case-insensitive (Postgres)
            { email: { [Op.iLike]: `%${search}%` } },
            { role: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await Employee.findAndCountAll({
      where: searchCondition,
      order: [["createdAt", "DESC"]],
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
   CREATE EMPLOYEE
============================== */
exports.createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   UPDATE EMPLOYEE
============================== */
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    await Employee.update(req.body, { where: { id } });
    const updatedEmployee = await Employee.findByPk(id);
    res.json(updatedEmployee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   DELETE EMPLOYEE
============================== */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    if (!employee) return res.status(404).json({ message: "Not found" });
    await employee.destroy();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==============================
   STATS
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