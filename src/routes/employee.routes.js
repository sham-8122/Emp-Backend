const router = require("express").Router();
const employeeController = require("../controllers/employee.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/admin.middleware");
const upload = require("../middlewares/upload.middleware");

// 1. Static/Global Routes (Must come first)
router.get("/stats", verifyToken, employeeController.getEmployeeStats);
router.get("/", verifyToken, employeeController.getEmployees);
router.post("/seed-uuids", verifyToken, employeeController.seedUUIDs); // --- FIXED: Moved above dynamic routes ---

// 2. Dynamic Routes (Lookups by UUID)
router.get("/:id", verifyToken, employeeController.getEmployeeById); 
router.get("/:id/history", verifyToken, employeeController.getSalaryHistory);
router.get("/:id/payroll", verifyToken, employeeController.getPayrollHistory);

// 3. Action Routes
router.post("/", verifyToken, upload.single('image'), employeeController.createEmployee);
router.put("/:id", verifyToken, upload.single('image'), employeeController.updateEmployee);
router.post("/:id/send-payslip", verifyToken, employeeController.sendPaySlip);
router.post("/:id/credit-salary", verifyToken, employeeController.creditSalary);

// 4. Admin Only
router.delete("/:id", verifyToken, isAdmin, employeeController.deleteEmployee);

module.exports = router;