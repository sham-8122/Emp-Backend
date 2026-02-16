module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Employee', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    salary: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  });
};
