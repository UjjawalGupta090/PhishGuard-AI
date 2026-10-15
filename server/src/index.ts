import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

async function startServer() {
  // Connect to MongoDB
  try {
    console.log(`Connecting to MongoDB at: ${env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error) {
    console.warn('⚠️ Warning: MongoDB connection failed on startup.');
    console.warn('   Ensure MongoDB is running (e.g. `docker compose up -d` or local mongod).');
    console.warn(`   Error: ${error instanceof Error ? error.message : error}`);
  }

  // Start Express server
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 PhishGuard Server running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`   Gemini LLM: ${env.GEMINI_API_KEY ? `Configured (${env.GEMINI_MODEL})` : 'Disabled (Offline Rules-Only Mode)'}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      } catch (err) {
        console.error('Error during MongoDB disconnect:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
