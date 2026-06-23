import { userRepository } from '../repositories/user.repository';
import { verifyPassword } from '../utils/password';
import { signTokenPair, verifyRefreshToken, JwtPayload } from '../utils/jwt';
import { UnauthorizedError } from '../utils/AppError';

export const authService = {
  async login(username: string, password: string) {
    const user = await userRepository.findByUsername(username);
    if (!user || !user.is_active) throw new UnauthorizedError('Credenciais inválidas');

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new UnauthorizedError('Credenciais inválidas');

    const payload: JwtPayload = { userId: user.id, username: user.username, role: user.role };
    const tokens = signTokenPair(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await userRepository.storeRefreshToken(user.id, tokens.refreshToken, expiresAt);

    return {
      user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role },
      sessionToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await userRepository.findRefreshToken(refreshToken);
    if (!stored) throw new UnauthorizedError('Refresh token inválido');
    if (new Date() > stored.expires_at) {
      await userRepository.deleteRefreshToken(refreshToken);
      throw new UnauthorizedError('Refresh token expirado');
    }
    const user = await userRepository.findById(stored.user_id);
    if (!user || !user.is_active) throw new UnauthorizedError('Usuário inativo');

    const newPayload: JwtPayload = { userId: user.id, username: user.username, role: user.role };
    const tokens = signTokenPair(newPayload);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await userRepository.storeRefreshToken(user.id, tokens.refreshToken, expiresAt);
    await userRepository.deleteRefreshToken(refreshToken);

    return { sessionToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  },

  async logout(userId: string) {
    await userRepository.deleteAllRefreshTokens(userId);
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user || !user.is_active) throw new UnauthorizedError('Usuário inativo');
    return { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role };
  },
};
