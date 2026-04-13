export type LoanProduct = {
  name: string;
  bank: string;
  loanType: 'personal' | 'home' | 'auto' | 'education' | 'business';
  interestRate: number;
  maxTenureYears: number;
  processingFee: number;
  minIncome: number;
  minLoanAmount: number;
  maxLoanAmount: number;
  prepaymentPenalty: boolean;
};

export const loanProducts: LoanProduct[] = [
  {
    name: 'Flex Personal Loan',
    bank: 'Nova Bank',
    loanType: 'personal',
    interestRate: 12.5,
    maxTenureYears: 5,
    processingFee: 1.5,
    minIncome: 30000,
    minLoanAmount: 50000,
    maxLoanAmount: 1500000,
    prepaymentPenalty: true
  },
  {
    name: 'Smart Auto Loan',
    bank: 'Axis Metro',
    loanType: 'auto',
    interestRate: 9.2,
    maxTenureYears: 7,
    processingFee: 1.0,
    minIncome: 35000,
    minLoanAmount: 100000,
    maxLoanAmount: 2000000,
    prepaymentPenalty: false
  },
  {
    name: 'Home Advantage',
    bank: 'Horizon Bank',
    loanType: 'home',
    interestRate: 8.4,
    maxTenureYears: 25,
    processingFee: 0.75,
    minIncome: 50000,
    minLoanAmount: 500000,
    maxLoanAmount: 25000000,
    prepaymentPenalty: false
  },
  {
    name: 'Future Education Loan',
    bank: 'Union Bank',
    loanType: 'education',
    interestRate: 10.5,
    maxTenureYears: 10,
    processingFee: 0.5,
    minIncome: 25000,
    minLoanAmount: 200000,
    maxLoanAmount: 4000000,
    prepaymentPenalty: false
  },
  {
    name: 'Growth Business Loan',
    bank: 'Skyline Bank',
    loanType: 'business',
    interestRate: 14.0,
    maxTenureYears: 5,
    processingFee: 2.0,
    minIncome: 60000,
    minLoanAmount: 300000,
    maxLoanAmount: 5000000,
    prepaymentPenalty: true
  },
  {
    name: 'Budget Personal Loan',
    bank: 'Bright Bank',
    loanType: 'personal',
    interestRate: 13.8,
    maxTenureYears: 4,
    processingFee: 1.0,
    minIncome: 28000,
    minLoanAmount: 50000,
    maxLoanAmount: 800000,
    prepaymentPenalty: true
  }
];

export const compareLoans = (selectedLoans: Array<LoanProduct | string>) => {
  const loans =
    typeof selectedLoans[0] === 'string'
      ? loanProducts.filter((loan) => selectedLoans.includes(loan.name))
      : (selectedLoans as LoanProduct[]);

  return loans.map((loan) => ({
    name: loan.name,
    bank: loan.bank,
    loanType: loan.loanType,
    interestRate: loan.interestRate,
    maxTenureYears: loan.maxTenureYears,
    processingFee: loan.processingFee,
    minIncome: loan.minIncome,
    minLoanAmount: loan.minLoanAmount,
    maxLoanAmount: loan.maxLoanAmount,
    prepaymentPenalty: loan.prepaymentPenalty ? 'Yes' : 'No'
  }));
};
