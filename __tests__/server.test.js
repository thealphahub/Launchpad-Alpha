const request = require('supertest');
const bs58 = require('bs58');
const nacl = require('tweetnacl');

jest.mock('../imageGenerator', () => ({
  generateImageFromPrompt: jest.fn().mockResolvedValue('http://example.com/image.png'),
}));

jest.mock('../generateTokenWebsite', () => ({
  generateTokenWebsite: jest.fn().mockReturnValue('/public/test/index.html'),
}));

jest.mock('../telegramBot', () => ({
  createTokenGroup: jest.fn(),
}));

jest.mock('../solanaToken', () => ({
  createSolanaToken: jest.fn().mockResolvedValue('token-address'),
}));

const app = require('../server');

describe('API endpoints', () => {
  describe('POST /launch', () => {
    it('returns success for valid input', async () => {
      const res = await request(app)
        .post('/launch')
        .send({ name: 'My Token', ticker: 'MTK', imagePrompt: 'prompt', description: 'desc' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ success: true }));
      expect(res.body.url).toContain('/beta/my-token.html');
    });

    it('returns error for missing name', async () => {
      const res = await request(app)
        .post('/launch')
        .send({ ticker: 'MTK' });
      expect(res.statusCode).not.toBe(200);
    });
  });

  describe('POST /claim', () => {
    it('returns success for valid input', async () => {
      const keyPair = nacl.sign.keyPair();
      const message = 'claim';
      const signature = nacl.sign.detached(new TextEncoder().encode(message), keyPair.secretKey);
      const res = await request(app)
        .post('/claim')
        .send({
          slug: 'my-token',
          wallet: bs58.encode(keyPair.publicKey),
          message,
          signature: Array.from(signature),
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ success: true, token: 'token-address' });
    });

    it('returns 400 for missing parameters', async () => {
      const res = await request(app).post('/claim').send({});
      expect(res.statusCode).toBe(400);
    });
  });
});
