import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

export const hashPassword = async (password) => {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    return false;
  }
  return await bcrypt.compare(password, hashedPassword);
};

export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generatePasswordResetExpiry = () => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
};


