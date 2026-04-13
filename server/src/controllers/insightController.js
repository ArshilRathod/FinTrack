import { listExpenses, listLoans, listRecurringPayments } from '../store/dataStore.js';
import { generateInsights, groupExpensesByCategory, isLoanItem } from '../utils/finance.js';

const buildFallbackAiInsights = ({ monthlyIncome, monthlyExpense, categoryTotals, loans }) => {
  const expenseInsights = generateInsights({
    monthlyIncome,
    monthlyExpense,
    categoryTotals,
    loans
  });

  const savingsInsights = [
    {
      title: 'Savings Snapshot',
      tone: monthlyIncome > monthlyExpense ? 'positive' : 'warning',
      description:
        monthlyIncome > 0
          ? `Estimated savings this month: ₹${Math.max(0, Math.round(monthlyIncome - monthlyExpense)).toLocaleString()}.`
          : 'Add monthly income to see savings insights.'
    },
    {
      title: 'Emergency Buffer',
      tone: 'info',
      description: 'Aim for 3-6 months of expenses as an emergency fund.'
    }
  ];

  const investmentInsights = [
    {
      title: 'Investment Starter',
      tone: 'info',
      description: 'Consider a small SIP to build consistent investment habits.'
    }
  ];

  return { expenseInsights, savingsInsights, investmentInsights };
};

export const getInsights = async (req, res) => {
  const [expenseResult, loans] = await Promise.all([listExpenses(req.user.id), listLoans(req.user.id)]);
  const expenses = expenseResult.items;

  const monthlyExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const monthlyExpense = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = groupExpensesByCategory(monthlyExpenses);
  const baseInsights = generateInsights({
    monthlyIncome: req.user.monthlyIncome,
    monthlyExpense,
    categoryTotals,
    loans
  });

  return res.json({
    insights: [
      ...baseInsights,
      {
        title: 'Weekly Spending Summary',
        tone: 'info',
        description: `You have spent ${Math.round(monthlyExpense / 4 || 0)} on average per week this month.`
      },
      {
        title: 'Savings Optimization',
        tone: 'positive',
        description: 'Automate your savings goal right after salary credit to reduce decision friction.'
      }
    ]
  });
};

export const getAiInsights = async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ message: 'GEMINI_API_KEY is not configured' });
  }

  const [expenseResult, loans, recurringPayments] = await Promise.all([
    listExpenses(req.user.id),
    listLoans(req.user.id),
    listRecurringPayments(req.user.id)
  ]);

  const expenses = expenseResult.items;
  const now = new Date();
  const monthlyExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const monthlyExpense = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = groupExpensesByCategory(monthlyExpenses).filter((item) => item.amount > 0);
  const topCategory = [...categoryTotals].sort((a, b) => b.amount - a.amount)[0] || null;
  const monthlyIncome = Number(req.user.monthlyIncome) || 0;
  const savingsGoal = Number(req.user.savingsGoal) || 0;
  const recurringMonthly = recurringPayments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const loanEmiTotal = loans.filter(isLoanItem).reduce((sum, loan) => sum + (Number(loan.emiAmount) || 0), 0);
  const investmentSignals = monthlyExpenses.filter((exp) => {
    const note = `${exp.notes || ''} ${exp.paymentMethod || ''}`.toLowerCase();
    return note.includes('invest') || note.includes('mutual') || note.includes('sip') || exp.category === 'Investment';
  });

  const summary = {
    monthlyIncome,
    savingsGoal,
    monthlyExpense,
    recurringMonthly,
    loanEmiTotal,
    topCategory,
    categoryTotals,
    investmentSignals: {
      count: investmentSignals.length,
      total: investmentSignals.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
    }
  };

  const prompt = `
You are a personal finance insights assistant.
Using the JSON data below, return JSON only with keys:
expenseInsights, savingsInsights, investmentInsights.
Each is an array of 2-3 items with { "title", "description", "tone" }.
Tone must be one of: critical, warning, positive, info.
Keep descriptions under 200 characters.

DATA:
${JSON.stringify(summary)}
`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 512
          }
        })
      }
    );

    if (!response.ok) {
      const fallback = buildFallbackAiInsights({ monthlyIncome, monthlyExpense, categoryTotals, loans });
      return res.json({ ...fallback, generatedAt: new Date().toISOString(), source: 'gemini' });
    }

    const data = await response.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';

    const cleaned = String(rawText).replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed?.expenseInsights || !parsed?.savingsInsights || !parsed?.investmentInsights) {
      throw new Error('Invalid AI payload');
    }

    return res.json({
      expenseInsights: parsed.expenseInsights,
      savingsInsights: parsed.savingsInsights,
      investmentInsights: parsed.investmentInsights,
      generatedAt: new Date().toISOString(),
      source: 'gemini'
    });
  } catch (error) {
    const fallback = buildFallbackAiInsights({ monthlyIncome, monthlyExpense, categoryTotals, loans });
    return res.json({ ...fallback, generatedAt: new Date().toISOString(), source: 'gemini' });
  }
};
