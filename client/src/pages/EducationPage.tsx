import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRightLeft, BarChart3, BookOpenText, CheckCircle2, Lightbulb, Target } from 'lucide-react';
import api from '../api/client';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import type { Topic } from '../lib/types';

const sectionDescriptions: Record<string, string> = {
  'Personal Finance Basics': 'Core money habits that create stability, cash control, and resilience before investing or borrowing more.',
  'Investment Concepts': 'Foundational investing ideas that help you think in time horizons, compounding, and risk-adjusted decisions.',
  'Credit & Card Knowledge': 'Practical credit behavior that protects your score, lowers borrowing cost, and avoids expensive mistakes.'
};

const sectionUi: Record<
  string,
  {
    comparisonTitle: string;
    leftCard: { label: string; title: string; body: string };
    rightCard: { label: string; title: string; body: string };
    mistakes: string[];
    actionSteps: string[];
  }
> = {
  'Personal Finance Basics': {
    comparisonTitle: 'Stable cash flow vs reactive money management',
    leftCard: {
      label: 'Healthy setup',
      title: 'Planned money system',
      body: 'Income is assigned across essentials, savings, debt, and lifestyle before the month gets busy.'
    },
    rightCard: {
      label: 'Risky setup',
      title: 'Unplanned spending pattern',
      body: 'Savings happen only if money is left at month-end, which usually leads to inconsistent progress.'
    },
    mistakes: [
      'Treating savings as optional instead of scheduling it first',
      'Using emergency money for lifestyle upgrades',
      'Ignoring annual bills while budgeting only monthly cash flow'
    ],
    actionSteps: [
      'Split income into essentials, safety, goals, and lifestyle',
      'Set one emergency fund target and one monthly saving target',
      'Review fixed costs before reducing small discretionary spends'
    ]
  },
  'Investment Concepts': {
    comparisonTitle: 'Long-term investing vs short-term chasing',
    leftCard: {
      label: 'Disciplined approach',
      title: 'Time + consistency',
      body: 'Small regular investing, reinvested returns, and patience usually beat frequent switching and market timing.'
    },
    rightCard: {
      label: 'Weak approach',
      title: 'Noise-driven decisions',
      body: 'Jumping in after hype and exiting after fear often destroys the compounding advantage.'
    },
    mistakes: [
      'Taking equity risk with money needed soon',
      'Comparing every investment only by last year return',
      'Stopping SIPs after short periods of market volatility'
    ],
    actionSteps: [
      'Match risk level to the time horizon of your goal',
      'Use compounding as the default frame, not quick wins',
      'Review allocation, not just returns'
    ]
  },
  'Credit & Card Knowledge': {
    comparisonTitle: 'Credit card used as tool vs used as debt',
    leftCard: {
      label: 'Strong behavior',
      title: 'Card as payment instrument',
      body: 'The full bill is paid on time, utilization stays controlled, and the card supports rewards plus fraud protection.'
    },
    rightCard: {
      label: 'Expensive behavior',
      title: 'Card as rolling debt',
      body: 'Minimum dues, high utilization, and EMI conversions on non-essential spends quickly raise borrowing cost.'
    },
    mistakes: [
      'Paying only minimum due and assuming that is enough',
      'Keeping balances close to the credit limit',
      'Using future salary to justify present card spending'
    ],
    actionSteps: [
      'Track statement date, due date, and total due',
      'Keep utilization comfortably below 30%',
      'Use reminders and autopay for full bill payment when possible'
    ]
  }
};

export const EducationPage = () => {
  const { data } = useQuery<{ topics: Topic[] }>({
    queryKey: ['education'],
    queryFn: async () => (await api.get('/education')).data
  });

  const grouped = data?.topics.reduce<Record<string, Topic[]>>((acc, topic) => {
    acc[topic.section] = [...(acc[topic.section] || []), topic];
    return acc;
  }, {});

  const sections = useMemo(() => Object.keys(grouped || {}), [grouped]);
  const [activeSection, setActiveSection] = useState(sections[0] || '');

  useEffect(() => {
    if (!sections.length) return;
    if (!sections.includes(activeSection)) {
      setActiveSection(sections[0]);
    }
  }, [sections, activeSection]);

  const topics = grouped?.[activeSection] || [];
  const meta = sectionUi[activeSection];
  const leadTopic = topics[0];
  const isCreditSection = activeSection === 'Credit & Card Knowledge';
  const [cardLimit, setCardLimit] = useState('');
  const [plannedSpend, setPlannedSpend] = useState('');
  const limitValue = Number(cardLimit || 0);
  const spendValue = Number(plannedSpend || 0);
  const safeSpend = limitValue ? Math.round(limitValue * 0.3) : 0;
  const spendStatus =
    limitValue && spendValue
      ? spendValue <= safeSpend
        ? 'Within a safer range'
        : 'Above a safer range'
      : '';

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <SectionHeader
          eyebrow="Finance education"
          title="A practical learning hub, not just a glossary"
          description="Each track mixes explanation, comparison, real-world examples, action steps, and mistakes to avoid so users can learn and decide faster."
          action={<BookOpenText className="text-emerald-500 dark:text-emerald-200" size={26} />}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-slate-500 dark:text-slate-300">Topic library</p>
            <h3 className="mt-2 text-3xl font-bold">{data?.topics.length || 0}</h3>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-slate-500 dark:text-slate-300">Core tracks</p>
            <h3 className="mt-2 text-3xl font-bold">3</h3>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-slate-500 dark:text-slate-300">Learning style</p>
            <h3 className="mt-2 text-2xl font-bold">Applied, comparative, visual</h3>
          </div>
        </div>
      </Card>

      <div>
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Explore by track</p>
              <h2 className="mt-2 text-2xl font-bold">Pick a section to focus on</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeSection === section
                      ? 'border-slate-950 bg-slate-950 text-white shadow-soft dark:border-white dark:bg-white/10 dark:text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-[22px] border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {sectionDescriptions[activeSection]}
          </div>
        </Card>
      </div>

      {isCreditSection ? (
        <Card>
          <SectionHeader
            eyebrow={activeSection}
            title="Credit cards, made simple"
            description="A credit card is a short‑term loan you repay every month. Use it well and it builds trust. Use it poorly and it becomes expensive debt."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">What it is</p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                A card that lets you buy now while the bank pays first. You repay the bank later.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">What it’s not</p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">It is not extra income.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Why it matters</p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Your repayment behavior helps build your credit score for future loans.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">How it works</p>
                  <h3 className="mt-2 text-2xl font-bold">Real‑life flow, step by step</h3>
                </div>
                <ArrowRightLeft size={18} className="mt-1 text-accent" />
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  'You swipe the card to pay.',
                  'The bank pays the merchant.',
                  'You receive a monthly statement.',
                  'You repay the full bill before the due date.',
                  'If you don’t, interest starts on the unpaid amount.'
                ].map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-3xl bg-white px-4 py-4 text-sm dark:bg-slate-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white dark:bg-accent">
                      {index + 1}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Example: Spend ₹10,000 → statement on April 30 → due date May 15. Pay full = ₹10,000. Pay minimum = interest starts on the rest.
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Safe usage rules</p>
              <h3 className="mt-2 text-2xl font-bold">Keep it simple, keep it safe</h3>
              <div className="mt-5 space-y-3">
                {[
                  'Pay total due, not minimum due',
                  'Keep spending below 30% of your limit',
                  'Never use the card for cash emergencies',
                  'Set autopay for full payment',
                  'Track the statement date and due date'
                ].map((rule) => (
                  <div key={rule} className="flex items-start gap-3 rounded-3xl bg-white px-4 py-4 dark:bg-slate-900">
                    <CheckCircle2 size={18} className="mt-0.5 text-emerald-500" />
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <details className="group rounded-[28px] border border-slate-100 bg-slate-50 p-6 open:shadow-soft dark:border-slate-800 dark:bg-slate-950">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BarChart3 size={18} className="text-accent" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Costs & charges</p>
                    <h3 className="mt-1 text-2xl font-bold">What you pay for</h3>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 group-open:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-open:text-white">
                  Expand
                </span>
              </summary>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'Interest',
                    body: 'Charged only if you don’t pay the full amount by the due date.'
                  },
                  {
                    title: 'Minimum due',
                    body: 'Smallest amount to avoid late fee, but the rest keeps costing interest.'
                  },
                  {
                    title: 'Fees',
                    body: 'Late fee, annual fee, or EMI conversion fee depending on the card.'
                  }
                ].map((item) => (
                  <div key={item.title} className="rounded-3xl border border-slate-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.body}</p>
                  </div>
                ))}
              </div>
            </details>

            <details className="group rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft size={18} className="text-accent" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Mistake vs smart move</p>
                    <h3 className="mt-1 text-2xl font-bold">Short, scannable contrasts</h3>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 group-open:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-open:text-white">
                  Expand
                </span>
              </summary>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {[
                  { bad: 'Pay minimum due', good: 'Pay full amount' },
                  { bad: 'Use 90% of limit', good: 'Stay under 30%' },
                  { bad: 'Pay after due date', good: 'Pay 2–3 days early' },
                  { bad: 'Open many cards fast', good: 'Start with one card' }
                ].map((pair) => (
                  <div key={pair.bad} className="rounded-3xl border border-slate-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Mistake</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{pair.bad}</p>
                    <div className="mt-3 h-px bg-slate-100 dark:bg-slate-800" />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">Smart move</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{pair.good}</p>
                  </div>
                ))}
              </div>
            </details>

            <details className="group rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-rose-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Common mistakes</p>
                    <h3 className="mt-1 text-2xl font-bold">Avoid these costly traps</h3>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 group-open:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-open:text-white">
                  Expand
                </span>
              </summary>
              <div className="mt-5 space-y-3">
                {[
                  'Paying only the minimum due',
                  'Using the card to cover monthly essentials',
                  'Missing the due date by even one day',
                  'Using most of your credit limit every month',
                  'Taking a new card for rewards before clearing old dues'
                ].map((mistake) => (
                  <div key={mistake} className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-200">
                    {mistake}
                  </div>
                ))}
              </div>
            </details>

            <details className="group rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Lightbulb size={18} className="text-amber-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Myth vs reality</p>
                    <h3 className="mt-1 text-2xl font-bold">Clear beginner misconceptions</h3>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 group-open:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-open:text-white">
                  Expand
                </span>
              </summary>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  { myth: 'Minimum due is enough', fact: 'Debt stays and interest grows.' },
                  { myth: 'More spending builds score faster', fact: 'Lower usage is healthier.' },
                  { myth: 'Cards are bad by default', fact: 'They’re safe when paid in full.' }
                ].map((item) => (
                  <div key={item.myth} className="rounded-3xl border border-slate-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Myth</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.myth}</p>
                    <div className="mt-3 h-px bg-slate-100 dark:bg-slate-800" />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">Reality</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.fact}</p>
                  </div>
                ))}
              </div>
            </details>

            <details className="group rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Target size={18} className="text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">First‑time setup checklist</p>
                    <h3 className="mt-1 text-2xl font-bold">Do this right after you get a card</h3>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 group-open:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-open:text-white">
                  Expand
                </span>
              </summary>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  'Enable autopay for full amount',
                  'Set a reminder 3 days before due date',
                  'Start with one card only',
                  'Pick one category to use it for',
                  'Track statement date + due date'
                ].map((step) => (
                  <div key={step} className="flex items-start gap-3 rounded-3xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <CheckCircle2 size={18} className="mt-0.5 text-emerald-500" />
                    {step}
                  </div>
                ))}
              </div>
            </details>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Simulate your first month</p>
              <h3 className="mt-2 text-2xl font-bold">Spend → statement → due date</h3>
              <div className="mt-5 grid gap-3">
                {[
                  'Day 1–20: Spend ₹10,000',
                  'Day 30: Statement generated',
                  'Day 45: Due date'
                ].map((item) => (
                  <div key={item} className="rounded-3xl bg-white px-4 py-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-slate-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-slate-200">
                  Pay full → ₹0 interest next month
                </div>
                <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-slate-700 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-slate-200">
                  Pay minimum → interest on remaining amount
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Safe usage helper</p>
              <h3 className="mt-2 text-2xl font-bold">See what’s safe for your limit</h3>
              <div className="mt-5 grid gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                    Card limit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cardLimit}
                    onChange={(event) => setCardLimit(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="e.g., 50000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                    Planned spend (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={plannedSpend}
                    onChange={(event) => setPlannedSpend(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="e.g., 12000"
                  />
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  Safe usage target (30%):{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₹{safeSpend ? safeSpend.toLocaleString('en-IN') : '—'}
                  </span>
                  {spendStatus ? (
                    <span className={`ml-2 font-semibold ${spendValue <= safeSpend ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {spendStatus}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Decision guide</p>
              <h3 className="mt-2 text-2xl font-bold">Should you use a credit card?</h3>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/25">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Yes, if you can</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li>Pay the full bill every month</li>
                    <li>Track your statement and due date</li>
                    <li>Spend on planned expenses only</li>
                  </ul>
                </div>
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/25">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Wait, if you</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li>Struggle to repay loans or bills</li>
                    <li>Need credit to cover essentials</li>
                    <li>Often miss bill payments</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">What to do next</p>
              <h3 className="mt-2 text-2xl font-bold">Start calm and confident</h3>
              <div className="mt-5 space-y-3">
                {[
                  'Set a monthly reminder for the due date',
                  'Start with one simple card, not many',
                  'Use it only for planned expenses',
                  'Pay the full amount 2–3 days early'
                ].map((step) => (
                  <div key={step} className="flex items-start gap-3 rounded-3xl bg-white px-4 py-4 dark:bg-slate-900">
                    <CheckCircle2 size={18} className="mt-0.5 text-emerald-500" />
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Credit cards are safe when you pay in full, stay under 30%, and never miss the due date.
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <SectionHeader eyebrow={activeSection} title={activeSection} description="Key ideas, comparisons, examples, and next steps — expanded when you need them." />

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Section overview</p>
                  <h3 className="mt-2 text-2xl font-bold">{leadTopic?.title}</h3>
                </div>
                <BarChart3 size={18} className="mt-1 text-accent" />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{leadTopic?.description}</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-white px-4 py-4 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Lightbulb size={16} className="text-amber-500" />
                    <p className="text-sm font-semibold">Key takeaway</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{leadTopic?.keyTakeaway}</p>
                </div>

                <div className="rounded-3xl bg-white px-4 py-4 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Target size={16} className="text-emerald-500" />
                    <p className="text-sm font-semibold">Practical tip</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{leadTopic?.practicalTip}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Quick actions</p>
              <h3 className="mt-2 text-2xl font-bold">What a user should do next</h3>
              <div className="mt-5 space-y-3">
                {meta?.actionSteps.map((step) => (
                  <div key={step} className="flex items-start gap-3 rounded-3xl bg-white px-4 py-4 dark:bg-slate-900">
                    <CheckCircle2 size={18} className="mt-0.5 text-emerald-500" />
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <details className="group rounded-[28px] border border-slate-100 bg-slate-50 p-6 open:shadow-soft dark:border-slate-800 dark:bg-slate-950">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft size={18} className="text-accent" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Comparison</p>
                    <h3 className="mt-1 text-2xl font-bold">{meta?.comparisonTitle}</h3>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 group-open:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-open:text-white">
                  Toggle
                </span>
              </summary>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/25">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{meta?.leftCard.label}</p>
                  <h4 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{meta?.leftCard.title}</h4>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{meta?.leftCard.body}</p>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/25">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">{meta?.rightCard.label}</p>
                  <h4 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{meta?.rightCard.title}</h4>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{meta?.rightCard.body}</p>
                </div>
              </div>
            </details>

            <details className="group rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Practical examples</p>
                  <h3 className="mt-1 text-2xl font-bold">Real-world situations</h3>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 group-open:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-open:text-white">
                  {topics.length} examples
                </span>
              </summary>
              <div className="mt-5 grid gap-4">
                {topics.map((topic) => (
                  <div key={topic.title} className="rounded-3xl border border-slate-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{topic.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{topic.example}</p>
                  </div>
                ))}
              </div>
            </details>

            <details className="group rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-rose-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Mistakes to avoid</p>
                    <h3 className="mt-1 text-2xl font-bold">Common traps in this section</h3>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 group-open:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-open:text-white">
                  {meta?.mistakes.length} pitfalls
                </span>
              </summary>
              <div className="mt-5 space-y-3">
                {meta?.mistakes.map((mistake) => (
                  <div key={mistake} className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-200">
                    {mistake}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </Card>
      )}
    </div>
  );
};
