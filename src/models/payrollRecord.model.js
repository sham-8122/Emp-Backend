module.exports = (sequelize, DataTypes) => {
  return sequelize.define('PayrollRecord', {
    month: {
      type: DataTypes.STRING, // e.g., "February"
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER, // e.g., 2026
      allowNull: false
    },
    amount: {
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