module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Employee', {
    // --- NEW: Add UUID Column ---
    employeeCode: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Automatically generates a UUID
      allowNull: true, // Allow true initially so existing rows don't crash
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
    salary: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
};