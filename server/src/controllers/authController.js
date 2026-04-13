import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { createUser, findUserByEmail, sanitizeUser, updateUser } from '../store/dataStore.js';
import { generateToken } from '../utils/tokens.js';

const authResponse = (user) => ({
  token: generateToken(user.id),
  user: sanitizeUser(user)
});

const getGoogleClient = () => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return null;
  }

  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser({ name, email, password: hashedPassword });

  return res.status(201).json(authResponse(user));
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.password) {
    return res.status(401).json({ message: 'You signed up with Google. Please use "Forgot password" to set a password for direct login.' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json(authResponse(user));
};

export const forgotPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: 'No account found for this email' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await updateUser(user.id, { password: hashedPassword });

  return res.json({ message: 'Password updated successfully. You can log in now.' });
};

export const googleLogin = async (req, res) => {
  const { credential, accessToken } = req.body;
  const googleClient = getGoogleClient();

  if (!googleClient) {
    return res.status(503).json({ message: 'Google sign-in is not configured on the server' });
  }

  let payload;

  if (credential) {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } else if (accessToken) {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      return res.status(401).json({ message: 'Google account could not be verified' });
    }

    payload = await response.json();
  } else {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  if (!payload?.email || !payload.email_verified) {
    return res.status(401).json({ message: 'Google account could not be verified' });
  }

  let user = await findUserByEmail(payload.email);

  if (!user) {
    user = await createUser({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      photoUrl: payload.picture || ''
    });
  } else if (payload.picture && !user.photoUrl) {
    user = await updateUser(user.id, { photoUrl: payload.picture });
  }

  return res.json(authResponse(user));
};
