const topics = [
  {
    section: 'Personal Finance Basics',
    title: 'Budgeting',
    description: 'A budget assigns every rupee a job so income, spending, saving, and debt repayment stay intentional instead of reactive.',
    example: 'If monthly income is 80,000 INR, you might allocate 40,000 to essentials, 16,000 to savings, 8,000 to debt prepayment, and the rest to lifestyle spending.',
    chartHint: 'Budget split bar',
    keyTakeaway: 'A good budget is not about restriction. It is about visibility and planned tradeoffs.',
    practicalTip: 'Review fixed costs first, cap discretionary spending next, and automate savings immediately after salary credit.'
  },
  {
    section: 'Personal Finance Basics',
    title: 'Emergency Funds',
    description: 'An emergency fund creates liquidity for job loss, medical bills, urgent travel, or repairs so you do not fall back on high-interest debt.',
    example: 'If core monthly expenses are 30,000 INR, a basic emergency fund target is 90,000 to 180,000 INR.',
    chartHint: 'Months of runway gauge',
    keyTakeaway: 'Emergency money should be safe and accessible, not locked into volatile investments.',
    practicalTip: 'Start with one month of expenses, then build toward three to six months in a savings account or liquid fund.'
  },
  {
    section: 'Personal Finance Basics',
    title: 'Saving Strategies',
    description: 'Saving works best when it is systematic. Random leftover saving usually fails because spending expands to match income.',
    example: 'If you auto-transfer 10,000 INR every month, you save 120,000 INR in a year before interest.',
    chartHint: 'Automatic transfer ladder',
    keyTakeaway: 'Consistency matters more than intensity. Small automated savings beats occasional large deposits.',
    practicalTip: 'Use separate buckets such as emergency fund, travel, annual bills, and long-term investing.'
  },
  {
    section: 'Investment Concepts',
    title: 'Time Value of Money',
    description: 'Money available today is more valuable than the same amount in the future because today’s money can be invested or used to avoid borrowing.',
    example: '10,000 INR today invested at 10% grows to 11,000 INR in one year, so receiving 10,000 INR next year is economically worse.',
    chartHint: 'Present vs future value line',
    keyTakeaway: 'Delaying investment often costs more than people realize because compounding time gets lost.',
    practicalTip: 'Start early even with smaller amounts. Time in the market is a major driver of long-term outcomes.'
  },
  {
    section: 'Investment Concepts',
    title: 'Compound Interest',
    description: 'Returns can generate further returns, which creates accelerating growth over long periods when contributions stay consistent.',
    example: '10,000 INR invested at 12% annual return compounds to roughly 31,000 INR in 10 years without new deposits.',
    chartHint: 'Growth curve',
    keyTakeaway: 'Compounding rewards patience, discipline, and uninterrupted investing behavior.',
    practicalTip: 'Reinvest returns and avoid frequent withdrawals if the goal is long-term wealth creation.'
  },
  {
    section: 'Investment Concepts',
    title: 'Risk vs Return',
    description: 'Higher expected returns usually require accepting higher volatility, uncertainty, and the possibility of temporary or permanent loss.',
    example: 'Equity funds may outperform fixed deposits over 10 years, but they can fall sharply over 6 to 12 months.',
    chartHint: 'Risk-return scatter',
    keyTakeaway: 'The right risk level is the one you can stay invested with during market stress.',
    practicalTip: 'Match asset allocation to goal duration. Short-term money should not sit in highly volatile assets.'
  },
  {
    section: 'Credit & Card Knowledge',
    title: 'Credit Score',
    description: 'A credit score summarizes borrowing behavior such as repayment history, credit mix, length of history, and utilization.',
    example: 'Two borrowers with the same income may get different loan rates if one has a much stronger repayment history.',
    chartHint: 'Credit band meter',
    keyTakeaway: 'The cheapest credit usually goes to the borrower who has already proven discipline.',
    practicalTip: 'Pay on time, avoid unnecessary loan applications, and keep old credit lines healthy if possible.'
  },
  {
    section: 'Credit & Card Knowledge',
    title: 'Credit Utilization Ratio',
    description: 'Using too much of your credit limit can signal stress, even when payments are made on time.',
    example: 'A 20,000 INR balance on a 100,000 INR combined limit is a 20% utilization ratio, which is generally healthy.',
    chartHint: 'Utilization meter',
    keyTakeaway: 'Low utilization supports a stronger score and reduces repayment pressure.',
    practicalTip: 'Try to stay below 30% utilization, and much lower if you are preparing for a major loan application.'
  },
  {
    section: 'Credit & Card Knowledge',
    title: 'Interest-Free Period',
    description: 'Credit cards can offer a grace period where no interest is charged if the full billed amount is repaid by the due date.',
    example: 'A purchase made just after the statement date may get almost a full billing cycle plus grace period before payment is due.',
    chartHint: 'Billing-cycle timeline',
    keyTakeaway: 'A credit card is useful only if you manage the billing cycle and repay in full.',
    practicalTip: 'Know your statement date and due date. Timing large purchases right after the statement date can improve cash flow.'
  },
  {
    section: 'Credit & Card Knowledge',
    title: 'Minimum Due vs Total Due',
    description: 'Paying only the minimum due avoids penalties but leaves the remaining balance to compound at high credit-card interest rates.',
    example: 'A 50,000 INR card bill paid at only 5% minimum may leave most of the balance attracting costly monthly interest.',
    chartHint: 'Payment impact comparison',
    keyTakeaway: 'Minimum due protects your account status, not your wallet.',
    practicalTip: 'If full payment is not possible, cut new discretionary spending immediately and create a fast payoff plan.'
  },
  {
    section: 'Credit & Card Knowledge',
    title: 'Credit Card Best Practices',
    description: 'Cards work well for convenience, rewards, and fraud protection when they are used as payment tools rather than borrowing tools.',
    example: 'A user who pays in full monthly can earn cashback and keep strong cash flow records without paying interest.',
    chartHint: 'Best-practice checklist',
    keyTakeaway: 'Treat the card like a debit instrument backed by your existing income, not future income.',
    practicalTip: 'Turn on due-date reminders, avoid EMI conversions for non-essential purchases, and track total card exposure weekly.'
  }
];

export const getEducationTopics = async (_req, res) => {
  return res.json({ topics });
};
