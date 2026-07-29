'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDatabase, closeDatabase } = require('./config/database');

let server;

/**
 * Closes the HTTP listener and the database pool before exiting so in-flight
 * requests finish and MySQL connections are released cleanly.
 */
const shutdown = async (signal, exitCode = 0) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    logger.error('Shutdown timed out after 10s, forcing exit');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed');
    }
    await closeDatabase();
    clearTimeout(forceExit);
    process.exit(exitCode);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

const start = async () => {
  try {
    await connectDatabase();

    server = app.listen(env.port, () => {
      logger.info(`${env.appName} API running in ${env.nodeEnv} mode`);
      logger.info(`Listening on http://localhost:${env.port}${env.apiPrefix}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${env.port} is already in use`);
      } else {
        logger.error('HTTP server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  shutdown('uncaughtException', 1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
