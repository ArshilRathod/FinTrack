import { useMemo, useState } from 'react';
import { ArrowRightLeft, CreditCard, Sparkles, Landmark } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { compareCards, creditCards } from '../lib/creditCardTools';
import { compareLoans, loanProducts } from '../lib/loanTools';

type NumericComparison = {
  id: string;
  title: string;
  options: Array<{
    name: string;
    metrics: Record<string, string>;
  }>;
  example: string;
};

const numericComparisons: NumericComparison[] = [
  {
    id: 'savings-vs-fd-vs-mf',
    title: 'Savings Account vs Fixed Deposit vs Mutual Funds',
    options: [
      {
        name: 'Savings Account',
        metrics: {
          'Typical annual return': '2.5%–4%',
          'Lock-in': 'None',
          'Withdrawal time': 'Instant',
          'Risk level (1–5)': '1',
          'Tax on interest': 'Yes',
          'Ideal horizon': '< 1 year'
        }
      },
      {
        name: 'Fixed Deposit (FD)',
        metrics: {
          'Typical annual return': '5%–7.5%',
          'Lock-in': 'Yes',
          'Withdrawal time': '1–3 days',
          'Risk level (1–5)': '2',
          'Tax on interest': 'Yes',
          'Ideal horizon': '1–5 years'
        }
      },
      {
        name: 'Mutual Funds',
        metrics: {
          'Typical annual return': '8%–12% (long-term)',
          'Lock-in': 'No (ELSS has 3y)',
          'Withdrawal time': '1–3 days',
          'Risk level (1–5)': '3–4',
          'Tax on gains': 'Yes',
          'Ideal horizon': '5+ years'
        }
      }
    ],
    example: '₹1,00,000 for 3 months → Savings. ₹1,00,000 for 2 years → FD. ₹1,00,000 for 7 years → Mutual Funds.'
  },
  {
    id: 'sip-vs-lumpsum',
    title: 'SIP vs Lump Sum',
    options: [
      {
        name: 'SIP',
        metrics: {
          'Minimum amount': '₹500/month',
          'Risk timing': 'Lower (averaged)',
          'Best for': 'Monthly income',
          'Ideal horizon': '3–10 years',
          'Example': '₹5,000/month'
        }
      },
      {
        name: 'Lump Sum',
        metrics: {
          'Minimum amount': '₹10,000+',
          'Risk timing': 'Higher (timing matters)',
          'Best for': 'One-time surplus',
          'Ideal horizon': '5+ years',
          'Example': '₹50,000 once'
        }
      }
    ],
    example: 'If you invest ₹5,000/month for 12 months, total = ₹60,000. Lump sum = ₹60,000 once.'
  },
  {
    id: 'debit-vs-credit',
    title: 'Debit Card vs Credit Card',
    options: [
      {
        name: 'Debit Card',
        metrics: {
          'Payment source': 'Your bank balance',
          'Billing cycle': 'No',
          'Rewards rate': '0%–1%',
          'Interest rate': '0%',
          'Fraud liability': 'Lower protection',
          'Credit score impact': 'No'
        }
      },
      {
        name: 'Credit Card',
        metrics: {
          'Payment source': 'Bank pays first',
          'Billing cycle': 'Yes (30–45 days)',
          'Rewards rate': '1%–5%',
          'Interest rate': '30%–42% APR',
          'Fraud liability': 'Higher protection',
          'Credit score impact': 'Yes'
        }
      }
    ],
    example: '₹2,000 spend → debit = immediate balance drop. Credit = bill later.'
  },
  {
    id: 'fd-vs-rd',
    title: 'FD vs RD',
    options: [
      {
        name: 'Fixed Deposit (FD)',
        metrics: {
          'Contribution': 'One-time',
          'Typical return': '5%–7.5%',
          'Tenure options': '6–60 months',
          'Penalty on exit': 'Yes',
          'Best for': 'Lump sum'
        }
      },
      {
        name: 'Recurring Deposit (RD)',
        metrics: {
          'Contribution': 'Monthly',
          'Typical return': '5%–7%',
          'Tenure options': '6–60 months',
          'Penalty on exit': 'Yes',
          'Best for': 'Monthly savings'
        }
      }
    ],
    example: 'FD: ₹1,00,000 for 24 months. RD: ₹5,000/month for 24 months.'
  },
  {
    id: 'term-vs-health',
    title: 'Term Insurance vs Health Insurance',
    options: [
      {
        name: 'Term Insurance',
        metrics: {
          'Typical cover': '₹50L–₹1Cr',
          'Monthly premium': '₹500–₹1,500',
          'Payout trigger': 'Death',
          'Tax benefit': 'Yes',
          'Best for': 'Dependents'
        }
      },
      {
        name: 'Health Insurance',
        metrics: {
          'Typical cover': '₹5L–₹20L',
          'Monthly premium': '₹400–₹1,200',
          'Payout trigger': 'Hospitalization',
          'Tax benefit': 'Yes',
          'Best for': 'Everyone'
        }
      }
    ],
    example: 'Age 28: term cover ₹1Cr (₹900/month) + health cover ₹10L (₹700/month).'
  }
];

type ComparisonKey = 'cards' | 'loans' | 'savings_fd_mf' | 'sip_lumpsum' | 'debit_credit' | 'fd_rd' | 'term_health';

export const ComparisonsPage = () => {
  const [activeCategory, setActiveCategory] = useState<ComparisonKey>('cards');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const topicMap: Record<ComparisonKey, string | null> = {
    cards: null,
    loans: null,
    savings_fd_mf: 'savings-vs-fd-vs-mf',
    sip_lumpsum: 'sip-vs-lumpsum',
    debit_credit: 'debit-vs-credit',
    fd_rd: 'fd-vs-rd',
    term_health: 'term-vs-health'
  };

  const comparison = useMemo(() => {
    if (activeCategory === 'cards') return compareCards(selectedCards);
    if (activeCategory === 'loans') return compareLoans(selectedLoans);
    return [];
  }, [activeCategory, selectedCards, selectedLoans]);

  const toggleSelection = (name: string) => {
    if (activeCategory === 'cards') {
      setSelectedCards((prev) => {
        if (prev.includes(name)) return prev.filter((item) => item !== name);
        if (prev.length >= 2) return prev;
        return [...prev, name];
      });
      return;
    }
    if (activeCategory === 'loans') {
      setSelectedLoans((prev) => {
        if (prev.includes(name)) return prev.filter((item) => item !== name);
        if (prev.length >= 2) return prev;
        return [...prev, name];
      });
    }
  };

  const catalog = activeCategory === 'cards' ? creditCards : loanProducts;
  const selectedCount = activeCategory === 'cards' ? selectedCards.length : selectedLoans.length;
  const activeTopicId = topicMap[activeCategory];
  const activeTopic = numericComparisons.find((topic) => topic.id === activeTopicId) || null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <SectionHeader
          eyebrow="Comparisons"
          title="Compare financial options, one category at a time"
          description="Select a category. Your comparison appears below."
          action={<Sparkles className="text-emerald-500 dark:text-emerald-200" size={26} />}
        />

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('cards')}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              activeCategory === 'cards'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <CreditCard size={14} />
            Credit cards
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('loans')}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              activeCategory === 'loans'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Landmark size={14} />
            Loans
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('savings_fd_mf')}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              activeCategory === 'savings_fd_mf'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Sparkles size={14} />
            Savings vs FD vs MF
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('sip_lumpsum')}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              activeCategory === 'sip_lumpsum'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Sparkles size={14} />
            SIP vs Lump Sum
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('debit_credit')}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              activeCategory === 'debit_credit'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Sparkles size={14} />
            Debit vs Credit
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('fd_rd')}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              activeCategory === 'fd_rd'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Sparkles size={14} />
            FD vs RD
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('term_health')}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              activeCategory === 'term_health'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Sparkles size={14} />
            Term vs Health
          </button>
        </div>

        {activeCategory === 'cards' || activeCategory === 'loans' ? (
          <>
            <SectionHeader
              eyebrow=""
              title={activeCategory === 'cards' ? 'Pick two cards to compare deeply' : 'Pick two loans to compare deeply'}
              description={
                activeCategory === 'cards'
                  ? 'Compare two cards across many parameters in a clean, side‑by‑side view.'
                  : 'Compare two loans across type, rate, tenure, and limits in a clean, side‑by‑side view.'
              }
              action={<ArrowRightLeft className="text-emerald-500 dark:text-emerald-200" size={24} />}
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {catalog.map((item) => {
                const isSelected =
                  activeCategory === 'cards' ? selectedCards.includes(item.name) : selectedLoans.includes(item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleSelection(item.name)}
                    className={`text-left rounded-[24px] border p-4 transition ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-500/10 shadow-soft'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.bank}</p>
                    {activeCategory === 'cards' ? (
                      <>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">₹{(item as any).annualFee} fee</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{(item as any).rewardType}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{(item as any).interestRate}% APR</span>
                        </div>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          Best for {(item as any).bestUseCases.join(', ')}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{(item as any).loanType} loan</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{(item as any).interestRate}% rate</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{(item as any).maxTenureYears} yrs</span>
                        </div>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          ₹{(item as any).minLoanAmount.toLocaleString('en-IN')} to ₹{(item as any).maxLoanAmount.toLocaleString('en-IN')}
                        </p>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Comparison view</p>
                <p className="text-xs text-slate-500 dark:text-slate-300">{selectedCount}/2 selected</p>
              </div>
              {comparison.length < 2 ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Select two items to unlock the detailed comparison window.
                </p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-0 border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <div className="px-4 py-3">Parameter</div>
                    <div className="px-4 py-3 text-slate-900 dark:text-white">{comparison[0].name}</div>
                    <div className="px-4 py-3 text-slate-900 dark:text-white">{comparison[1].name}</div>
                  </div>
                  {(activeCategory === 'cards'
                    ? [
                        { label: 'Bank', key: 'bank' },
                        { label: 'Annual fee', key: 'annualFee', format: (v: number) => `₹${v}` },
                        { label: 'Interest rate', key: 'interestRate', format: (v: number) => `${v}% APR` },
                        { label: 'Reward type', key: 'rewardType' },
                        { label: 'Best for', key: 'bestFor' }
                      ]
                    : [
                        { label: 'Bank', key: 'bank' },
                        { label: 'Loan type', key: 'loanType' },
                        { label: 'Interest rate', key: 'interestRate', format: (v: number) => `${v}%` },
                        { label: 'Max tenure', key: 'maxTenureYears', format: (v: number) => `${v} years` },
                        { label: 'Processing fee', key: 'processingFee', format: (v: number) => `${v}%` },
                        { label: 'Min income', key: 'minIncome', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
                        {
                          label: 'Loan amount range',
                          key: 'minLoanAmount',
                          format: (_: number, row: any) =>
                            `₹${row.minLoanAmount.toLocaleString('en-IN')}–₹${row.maxLoanAmount.toLocaleString('en-IN')}`
                        },
                        { label: 'Prepayment penalty', key: 'prepaymentPenalty' }
                      ]
                  ).map((row, index) => (
                    <div
                      key={row.label}
                      className={`grid grid-cols-[1.2fr_1fr_1fr] gap-0 text-sm ${
                        index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-950/40'
                      }`}
                    >
                      <div className="px-4 py-4 font-semibold text-slate-600 dark:text-slate-300">{row.label}</div>
                      <div className="px-4 py-4 text-slate-900 dark:text-white">
                        {row.format ? row.format((comparison[0] as any)[row.key], comparison[0]) : (comparison[0] as any)[row.key]}
                      </div>
                      <div className="px-4 py-4 text-slate-900 dark:text-white">
                        {row.format ? row.format((comparison[1] as any)[row.key], comparison[1]) : (comparison[1] as any)[row.key]}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <SectionHeader
              eyebrow=""
              title={activeTopic?.title || 'Numeric comparison'}
              description="Numeric comparison with a simple example."
            />

            {activeTopic ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{activeTopic.title}</h3>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Numeric comparison table</p>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                      <div className="px-4 py-3">Parameter</div>
                      {activeTopic.options.map((opt) => (
                        <div key={opt.name} className="px-4 py-3 text-slate-900 dark:text-white">
                          {opt.name}
                        </div>
                      ))}
                    </div>
                    {Object.keys(activeTopic.options[0].metrics).map((metric, index) => (
                      <div
                        key={metric}
                        className={`grid grid-cols-[1.2fr_1fr_1fr_1fr] text-sm ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-950/40'
                        }`}
                      >
                        <div className="px-4 py-4 font-semibold text-slate-600 dark:text-slate-300">{metric}</div>
                        {activeTopic.options.map((opt) => (
                          <div key={opt.name + metric} className="px-4 py-4 text-slate-900 dark:text-white">
                            {opt.metrics[metric]}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <details className="group rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Example scenario</p>
                      <h3 className="mt-1 text-xl font-bold">Simple numeric example</h3>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 group-open:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-open:text-white">
                      Expand
                    </span>
                  </summary>
                  <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-slate-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-slate-200">
                    {activeTopic.example}
                  </div>
                </details>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
};
