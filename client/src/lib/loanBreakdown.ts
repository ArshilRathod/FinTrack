import type { Loan } from './types';

export type BreakdownRow = {
  year: string;
  openingValue: number;
  contribution: number;
  interestOrGrowth: number;
  closingValue: number;
  note: string;
};

const toMonthEndDate = (date: Date, monthOffset: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + monthOffset);
  return next;
};

const generateLoanBreakdown = (item: Loan): BreakdownRow[] => {
  const rows: BreakdownRow[] = [];
  const startDate = item.startDate ? new Date(item.startDate) : new Date(item.nextEmiDate);
  const monthlyRate = item.interestRate > 0 ? item.interestRate / 100 / 12 : 0;
  const totalMonths = Math.max(0, item.tenure || 0);
  let outstanding = item.loanAmount;
  let currentYear = startDate.getFullYear();
  let openingValue = outstanding;
  let emiPaidThisYear = 0;
  let interestThisYear = 0;

  for (let monthIndex = 0; monthIndex < totalMonths && outstanding > 0; monthIndex += 1) {
    const date = toMonthEndDate(startDate, monthIndex);
    const year = date.getFullYear();

    if (year !== currentYear) {
      rows.push({
        year: String(currentYear),
        openingValue,
        contribution: emiPaidThisYear,
        interestOrGrowth: interestThisYear,
        closingValue: outstanding,
        note: 'EMI paid during the year'
      });
      currentYear = year;
      openingValue = outstanding;
      emiPaidThisYear = 0;
      interestThisYear = 0;
    }

    const interestPortion = outstanding * monthlyRate;
    const emi = item.emiAmount || 0;
    const principalPortion = Math.max(0, Math.min(outstanding, emi - interestPortion));
    outstanding = Math.max(0, outstanding - principalPortion);
    emiPaidThisYear += emi;
    interestThisYear += interestPortion;
  }

  rows.push({
    year: String(currentYear),
    openingValue,
    contribution: emiPaidThisYear,
    interestOrGrowth: interestThisYear,
    closingValue: outstanding,
    note: outstanding <= 0 ? 'Loan closes in this year' : 'Projected outstanding after this year'
  });

  return rows;
};

const generateFdBreakdown = (item: Loan): BreakdownRow[] => {
  const rows: BreakdownRow[] = [];
  const maturityDate = new Date(item.nextEmiDate);
  const startDate = item.startDate ? new Date(item.startDate) : new Date();
  const today = new Date();
  const endDate = maturityDate < today ? maturityDate : today;
  let openingValue = item.loanAmount;

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const finalMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= finalMonth) {
    const monthStart = cursor.getTime() === new Date(startDate.getFullYear(), startDate.getMonth(), 1).getTime()
      ? startDate
      : new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = cursor.getTime() === finalMonth.getTime()
      ? endDate
      : new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

    const daysInPeriod = Math.max(1, Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));
    const interest = openingValue * (item.interestRate / 100) * (daysInPeriod / 365);
    const closingValue = openingValue + interest;

    rows.push({
      year: monthStart.toISOString().slice(0, 7),
      openingValue,
      contribution: 0,
      interestOrGrowth: interest,
      closingValue,
      note: 'Accrued interest for this period'
    });

    openingValue = closingValue;
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return rows;
};

export const getBreakdownRows = (item: Loan): BreakdownRow[] => {
  if (item.type === 'loan') return generateLoanBreakdown(item);
  if (item.type === 'fd') return generateFdBreakdown(item);
  return [];
};
