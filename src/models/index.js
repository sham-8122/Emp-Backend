const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user.model')(sequelize, Sequelize);
db.Employee = require('./employee.model')(sequelize, Sequelize);
// --- 1. Import New Model ---
db.SalaryHistory = require('./salaryHistory.model')(sequelize, Sequelize);
db.PayrollRecord = require('./payrollRecord.model')(sequelize, Sequelize);

// --- 2. Define Associations ---
db.Employee.hasMany(db.SalaryHistory, { onDelete: 'CASCADE' });
db.SalaryHistory.belongsTo(db.Employee);

db.Employee.hasMany(db.PayrollRecord, { onDelete: 'CASCADE' });
db.PayrollRecord.belongsTo(db.Employee);

module.exports = db;