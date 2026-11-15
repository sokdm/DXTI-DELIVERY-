const crypto = require('crypto');

const deriveEncryptionKey = () => {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be configured with at least 32 characters');
  }
  return crypto.createHash('sha256').update(secret).digest();
};

const encryptSecret = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
};

const decryptSecret = (value) => {
  const [ivHex, tagHex, ciphertextHex] = value.split(':');
  if (!ivHex || !tagHex || !ciphertextHex) throw new Error('Stored webhook secret is invalid');
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveEncryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
};

const generateApiKey = (environment) => {
  const prefix = environment === 'production' ? 'crx_live_' : 'crx_test_';
  const secret = crypto.randomBytes(32).toString('base64url');
  return { key: `${prefix}${secret}`, prefix: `${prefix}${secret.slice(0, 8)}` };
};

module.exports = { encryptSecret, decryptSecret, generateApiKey };
