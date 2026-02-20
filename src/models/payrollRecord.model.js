module.exports = (sequelize, DataTypes) => {
  return sequelize.define('PayrollRecord', {
    month: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    grossAmount: { // Original Salary
      type: DataTypes.FLOAT,
      allowNull: false
    },
    deductionAmount: { // Total subtracted
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    netAmount: { // Final paid: gross - deduction
      type: DataTypes.FLOAT,
      allowNull: false
    },
    paymentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Credited"
    }
  });
};