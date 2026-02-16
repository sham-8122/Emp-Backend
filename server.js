require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => {
  console.log("Database Connected");
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
