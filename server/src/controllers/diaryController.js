import { createDiary, deleteDiary, getDiaryById, listDiaries, updateDiary, listExpenses, updateExpense } from '../store/dataStore.js';

export const getDiaries = async (req, res) => {
  const result = await listDiaries(req.user.id, req.query);
  if (result.pagination) {
    return res.json(result);
  }
  return res.json(result.items);
};

export const createNewDiary = async (req, res) => {
  const diary = await createDiary({
    ...req.body,
    user: req.user.id
  });
  return res.status(201).json(diary);
};

export const getSingleDiary = async (req, res) => {
  const diary = await getDiaryById(req.user.id, req.params.id);
  if (!diary) {
    return res.status(404).json({ message: 'Diary not found' });
  }
  return res.json(diary);
};

export const updateExistingDiary = async (req, res) => {
  const diary = await updateDiary(req.user.id, req.params.id, req.body);
  if (!diary) {
    return res.status(404).json({ message: 'Diary not found' });
  }
  return res.json(diary);
};

export const removeDiary = async (req, res) => {
  const removed = await deleteDiary(req.user.id, req.params.id);
  if (!removed) {
    return res.status(404).json({ message: 'Diary not found' });
  }
  return res.json({ message: 'Diary deleted' });
};

export const addExpensesToDiary = async (req, res) => {
  const { expenseIds } = req.body;
  const diaryId = req.params.id;

  if (!Array.isArray(expenseIds)) {
    return res.status(400).json({ message: 'expenseIds must be an array' });
  }

  const results = await Promise.all(
    expenseIds.map(id => updateExpense(req.user.id, id, { diaryId }))
  );

  return res.json({ message: `${results.filter(Boolean).length} expenses added to diary` });
};

export const getUntrackedExpenses = async (req, res) => {
  const result = await listExpenses(req.user.id, { untracked: true });
  return res.json(result.items);
};
