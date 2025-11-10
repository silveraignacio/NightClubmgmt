import { signToken, hashPassword, comparePasswords } from '../services/authService';

describe('Auth Service', () => {
  describe('signToken', () => {
    it('should generate a valid JWT token', () => {
      const token = signToken('user-id', 'test@example.com', 'admin', 'club-id');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('Password hashing', () => {
    const plainPassword = 'testPassword123';

    it('should hash a password', async () => {
      const hashedPassword = await hashPassword(plainPassword);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should correctly compare passwords', async () => {
      const hashedPassword = await hashPassword(plainPassword);
      const isMatch = await comparePasswords(plainPassword, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const hashedPassword = await hashPassword(plainPassword);
      const isMatch = await comparePasswords('wrongPassword', hashedPassword);
      expect(isMatch).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);
      expect(hash1).not.toBe(hash2); // Salt makes each hash unique
    });
  });
});
