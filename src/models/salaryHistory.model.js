module.exports = (sequelize, DataTypes) => {
  return sequelize.define('SalaryHistory', {
    previousSalary: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    newSalary: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    incrementDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
};