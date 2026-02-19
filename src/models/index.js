const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user.model')(sequelize, Sequelize);
db.Employee = require('./employee.model')(sequelize, Sequelize);
db.SalaryHistory = require('./salaryHistory.model')(sequelize, Sequelize);
db.PayrollRecord = require('./payrollRecord.model')(sequelize, Sequelize);
// --- NEW MODEL ---
db.Allowance = require('./allowance.model')(sequelize, Sequelize);

// Associations
db.Employee.hasMany(db.SalaryHistory, { onDelete: 'CASCADE' });
db.SalaryHistory.belongsTo(db.Employee);

db.Employee.hasMany(db.PayrollRecord, { onDelete: 'CASCADE' });
db.PayrollRecord.belongsTo(db.Employee);

// --- NEW ASSOCIATION ---
db.Employee.hasMany(db.Allowance, { onDelete: 'CASCADE' });
db.Allowance.belongsTo(db.Employee);

module.exports = db;