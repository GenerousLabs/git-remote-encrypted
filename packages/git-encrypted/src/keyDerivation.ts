import argon2 from 'argon2';

// TODO: read salt from user's repository
const SALT = Buffer.from('deadbeef');

export const hash = async (password: string) => {
  const hash = await argon2.hash(password, {
    salt: SALT,
    raw: true,
    hashLength: 96,
  });
  return hash;
};
