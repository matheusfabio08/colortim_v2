import { signAccessToken, verifyAccessToken, signTokenPair } from '../../src/utils/jwt';
import { UnauthorizedError } from '../../src/utils/AppError';

const payload = { userId: 'user-123', username: 'testuser', role: 'Admin' };

describe('jwt utils', () => {
  it('should sign and verify access token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it('should throw on invalid token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow(UnauthorizedError);
  });

  it('should return token pair', () => {
    const { accessToken, refreshToken } = signTokenPair(payload);
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(accessToken).not.toBe(refreshToken);
  });
});
