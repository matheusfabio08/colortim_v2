import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('password utils', () => {
  it('should hash and verify correctly', async () => {
    const hash = await hashPassword('mypassword123');
    expect(hash).not.toBe('mypassword123');
    expect(await verifyPassword('mypassword123', hash)).toBe(true);
    expect(await verifyPassword('wrongpassword', hash)).toBe(false);
  });
});
