import { getSettings, upsertSettings } from '../store/dataStore.js';

export const getSettingsController = async (req, res) => {
  const settings = await getSettings(req.user.id);
  return res.json(settings);
};

export const updateSettings = async (req, res) => {
  const settings = await upsertSettings(req.user.id, req.body);
  return res.json(settings);
};
