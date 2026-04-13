import { sanitizeUser, updateUser } from '../store/dataStore.js';
import { clearUserCache } from '../middleware/auth.js';

export const getProfile = async (req, res) => {
  return res.json(sanitizeUser(req.user));
};

export const updateProfile = async (req, res) => {
  console.log('[Profile Update] Body:', JSON.stringify(req.body, null, 2));
  const firstName = req.body.firstName?.trim() || '';
  const lastName = req.body.lastName?.trim() || '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || req.body.name?.trim() || req.user.name;

  const user = await updateUser(req.user.id, {
    name,
    email: req.body.email?.toLowerCase(),
    firstName,
    lastName,
    phone: req.body.phone?.trim() || '',
    bio: req.body.bio?.trim() || '',
    gender: req.body.gender || 'Prefer not to say',
    dob: req.body.dob || '',
    city: req.body.city?.trim() || '',
    state: req.body.state?.trim() || '',
    country: req.body.country?.trim() || '',
    photoUrl: req.body.photoUrl || '',
    riskPreference: req.body.riskPreference
  });

  await clearUserCache(req.user.id);

  return res.json(sanitizeUser(user));
};
