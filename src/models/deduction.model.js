module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Deduction', {
    reason: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    month: {
      type: DataTypes.STRING, // e.g., "February"
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'applied'),
      defaultValue: 'pending'
    }
  });
};