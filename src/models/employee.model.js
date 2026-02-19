module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Employee', {
    employeeCode: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: true,
      unique: true
    },
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
    salary: { // This is Total CTC
      type: DataTypes.FLOAT,
      allowNull: false
    },
    // --- NEW COLUMNS FOR CUSTOM BREAKDOWN ---
    basic: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    hra: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    da: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    travel: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    special: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
};