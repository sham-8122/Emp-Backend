require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 5000;

let server;

// --- UPDATE HERE: Add { alter: true } ---
// This tells the DB to add any missing columns (like profileImage)
sequelize.sync({ alter: true }) 
  .then(() => {
    console.log("✅ Database Connected & Synced Successfully.");
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ FATAL: Failed to connect to the database.");
    console.error(err);
    process.exit(1);
  });

// --- Graceful Shutdown Logic ---
const shutdown = (signal) => {
  console.info(`\n${signal} signal received. Shutting down gracefully.`);
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed.');
      sequelize.close().then(() => {
        console.log('✅ Database connection closed.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(reason);
  if (server) shutdown('unhandledRejection');
  else process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(error);
  if (server) shutdown('uncaughtException');
  else process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));