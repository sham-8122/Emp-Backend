module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Allowance', {
    label: {
      type: DataTypes.STRING, // e.g., "Internet Allowance"
      allowNull: false
    },
    amount: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  });
};