const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

// Mock data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  siteAddress: 'https://example.com'
};

// Helper function to generate token for testing
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'testsecret', {
    expiresIn: '1h'
  });
};

describe('Auth API', () => {
  let token;
  let userId;

  // Before all tests, connect to the database
  beforeAll(async () => {
    // Use a test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/model-donation-platform-test';
    await mongoose.connect(mongoUri);
  });

  // After all tests, disconnect and cleanup
  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // Test user registration
  describe('POST /api/auth/register', () => {
    // This test would require a valid invitation code
    // For testing purposes, we might need to mock the invitation validation
    it('should return 400 if invitation code is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          invitationCode: 'invalid-code'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // Test user login
  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      const user = new User(testUser);
      await user.save();
      userId = user._id;
    });

    it('should login user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      
      // Save token for protected route tests
      token = res.body.token;
    });

    it('should return 401 with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // Test protected routes
  describe('GET /api/auth/me', () => {
    it('should get current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // Test invitation generation
  describe('POST /api/auth/invite', () => {
    it('should generate invitation code with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/invite')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'invite@example.com'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.invitation).toHaveProperty('code');
      expect(res.body.invitation).toHaveProperty('email', 'invite@example.com');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/invite')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          email: 'invite@example.com'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
