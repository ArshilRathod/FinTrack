export type CreditCard = {
  name: string;
  bank: string;
  annualFee: number;
  interestRate: number;
  rewardType: 'cashback' | 'travel' | 'points' | 'fuel';
  bestUseCases: Array<'shopping' | 'travel' | 'beginner' | 'groceries' | 'fuel' | 'commute' | 'dining'>;
  minIncome: number;
};

export type UserProfile = {
  income: number;
  spendingGoal: CreditCard['bestUseCases'][number];
  isBeginner: boolean;
};

export const creditCards: CreditCard[] = [
  {
    name: 'Starter Cashback',
    bank: 'Nova Bank',
    annualFee: 0,
    interestRate: 36,
    rewardType: 'cashback',
    bestUseCases: ['shopping', 'beginner'],
    minIncome: 25000
  },
  {
    name: 'Travel Lite',
    bank: 'Skyline Bank',
    annualFee: 999,
    interestRate: 34,
    rewardType: 'travel',
    bestUseCases: ['travel'],
    minIncome: 45000
  },
  {
    name: 'Everyday Rewards',
    bank: 'Union Bank',
    annualFee: 499,
    interestRate: 32,
    rewardType: 'points',
    bestUseCases: ['shopping', 'groceries'],
    minIncome: 30000
  },
  {
    name: 'Fuel Saver',
    bank: 'Axis Metro',
    annualFee: 500,
    interestRate: 33,
    rewardType: 'fuel',
    bestUseCases: ['fuel', 'commute'],
    minIncome: 30000
  },
  {
    name: 'Premium Travel Pro',
    bank: 'Horizon Bank',
    annualFee: 2999,
    interestRate: 30,
    rewardType: 'travel',
    bestUseCases: ['travel', 'dining'],
    minIncome: 80000
  },
  {
    name: 'No-Fee Student',
    bank: 'Bright Bank',
    annualFee: 0,
    interestRate: 38,
    rewardType: 'cashback',
    bestUseCases: ['beginner', 'shopping'],
    minIncome: 20000
  }
];

const scoreCard = (card: CreditCard, profile: UserProfile) => {
  const { income, spendingGoal, isBeginner } = profile;

  if (income < card.minIncome) return -Infinity;

  let score = 0;

  if (card.bestUseCases.includes(spendingGoal)) {
    score += 40;
  }

  if (isBeginner) {
    if (card.annualFee === 0) score += 25;
    if (card.bestUseCases.includes('beginner')) score += 15;
  }

  score += Math.max(0, 40 - card.interestRate);

  return score;
};

export const recommendCards = (profile: UserProfile, topN = 3) => {
  return creditCards
    .map((card) => ({ card, score: scoreCard(card, profile) }))
    .filter((item) => item.score > -Infinity)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((item) => item.card);
};

export const compareCards = (selectedCards: Array<CreditCard | string>) => {
  const cards =
    typeof selectedCards[0] === 'string'
      ? creditCards.filter((card) => selectedCards.includes(card.name))
      : (selectedCards as CreditCard[]);

  return cards.map((card) => ({
    name: card.name,
    bank: card.bank,
    annualFee: card.annualFee,
    interestRate: card.interestRate,
    rewardType: card.rewardType,
    bestFor: card.bestUseCases.join(', ')
  }));
};

export const simulateInterest = (amount: number, interestRate: number) => {
  const monthlyRate = interestRate / 100 / 12;
  const interestForMonth = amount * monthlyRate;

  return {
    unpaidAmount: amount,
    monthlyRate,
    interestForMonth: Math.round(interestForMonth)
  };
};
