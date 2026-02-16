const router = require("express").Router();
const employeeController = require("../controllers/employee.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/admin.middleware"); // Import

router.get("/stats", verifyToken, employeeController.getEmployeeStats);
router.get("/", verifyToken, employeeController.getEmployees);
router.post("/", verifyToken, employeeController.createEmployee);
router.put("/:id", verifyToken, employeeController.updateEmployee);

// Protect DELETE route with isAdmin
router.delete("/:id", verifyToken, isAdmin, employeeController.deleteEmployee);

module.exports = router;