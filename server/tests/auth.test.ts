import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { AnalysisRecord } from '../src/models/AnalysisRecord.js';

describe('Authentication & User Management API', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await AnalysisRecord.deleteMany({});
    }
  });

  describe('CSRF Protection', () => {
    it('rejects state-changing requests lacking X-Requested-With header with 403', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'csrf@test.com', password: 'Password1234!' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_HEADER_MISSING');
    });
  });

  describe('POST /api/auth/signup', () => {
    it('rejects password shorter than 10 characters', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'test@example.com', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates user and sets httpOnly cookies on valid signup', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'newuser@example.com', password: 'SecurePassword123!' });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('newuser@example.com');
      expect(res.body.user).not.toHaveProperty('passwordHash');

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('access_token=') && c.includes('HttpOnly'))).toBe(true);
      expect(cookies.some((c) => c.includes('refresh_token=') && c.includes('HttpOnly'))).toBe(true);
    });

    it('rejects duplicate email signup', async () => {
      await request(app)
        .post('/api/auth/signup')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'duplicate@example.com', password: 'SecurePassword123!' });

      const res = await request(app)
        .post('/api/auth/signup')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'duplicate@example.com', password: 'SecurePassword123!' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USER_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'loginuser@example.com', password: 'SecurePassword123!' });
    });

    it('returns generic "Invalid credentials." for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'loginuser@example.com', password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid credentials.');
    });

    it('returns generic "Invalid credentials." for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'nonexistent@example.com', password: 'SomePassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid credentials.');
    });

    it('logs in successfully and returns tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'loginuser@example.com', password: 'SecurePassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('loginuser@example.com');
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.includes('access_token='))).toBe(true);
    });
  });

  describe('Guest-to-Account History Migration', () => {
    it('reassigns guest records to the user upon signup', async () => {
      const guestSession = 'guest-session-uuid-999';

      // Seed a guest analysis record
      const record = new AnalysisRecord({
        sessionId: guestSession,
        riskLevel: 'high',
        finalScore: 85,
        indicatorSummary: [],
        textHash: 'dummyhash123',
        redactedPreview: 'Dear user, verify account...',
        explanationSummary: 'Phishing detected',
        aiAvailable: false,
        channelGuess: 'email',
      });
      await record.save();

      // Sign up with this guest X-Session-Id header
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('X-Session-Id', guestSession)
        .send({ email: 'migrated@example.com', password: 'SecurePassword123!' });

      expect(signupRes.status).toBe(201);
      const newUserId = signupRes.body.user.id;

      // Verify the record was migrated
      const updatedRecord = await AnalysisRecord.findById(record._id);
      expect(updatedRecord?.userId?.toString()).toBe(newUserId);
      expect(updatedRecord?.sessionId).toBeUndefined();
    });
  });

  describe('Account Lifecycle: GET /me & DELETE /me', () => {
    it('retrieves user profile and deletes account with all associated history', async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'lifecycle@example.com', password: 'SecurePassword123!' });

      const cookies = signupRes.headers['set-cookie'] as unknown as string[];
      const userId = signupRes.body.user.id;

      // Add a record for this user
      await new AnalysisRecord({
        userId,
        sessionId: 'dummy',
        riskLevel: 'low',
        finalScore: 10,
        indicatorSummary: [],
        textHash: 'hash321',
        redactedPreview: 'Meeting tomorrow...',
        explanationSummary: 'Safe email',
        aiAvailable: false,
        channelGuess: 'email',
      }).save();

      // 1. GET /api/auth/me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('lifecycle@example.com');

      // 2. DELETE /api/auth/me
      const deleteRes = await request(app)
        .delete('/api/auth/me')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', cookies);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify user and their history are completely purged
      const userAfter = await User.findById(userId);
      expect(userAfter).toBeNull();
      const recordsAfter = await AnalysisRecord.find({ userId });
      expect(recordsAfter.length).toBe(0);
    });
  });
});
