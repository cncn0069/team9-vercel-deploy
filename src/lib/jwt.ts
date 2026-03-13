import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

export const signAccessToken = (payload: any) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });

export const signRefreshToken = (payload: any) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as any;
  } catch (e) {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as any;
  } catch (e) {
    return null;
  }
};
