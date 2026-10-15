import {
  Building2,
  Mail,
  Briefcase,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';

export interface SampleItem {
  id: string;
  title: string;
  category: string;
  channel: string;
  expectedRisk: 'low' | 'medium' | 'high';
  text: string;
}

export const DEMO_SAMPLES: SampleItem[] = [
  {
    id: 'sample-adversarial-urgent-benign',
    title: 'HR Urgent Deadline (Safe)',
    category: 'Adversarial Benign',
    channel: 'Email',
    expectedRisk: 'low',
    text: `From: "HR Benefits Operations" <benefits@company.internal>
Subject: Final Notice: Submit Q4 Benefits Open Enrollment Today

Dear Team,
Action required immediately! This is our final notice that annual health insurance open enrollment portal will be deactivated today without delay at 5:00 PM sharp.
If you do not submit your selections immediately, your current elections will automatically rollover.
Please log in to your employee self-service intranet at https://intranet.company.internal/benefits or stop by the HR desk on the 3rd floor.

Best regards,
Corporate Human Resources`,
  },
  {
    id: 'sample-adversarial-polite-phishing',
    title: 'Polite Travel Phish (Malicious)',
    category: 'Adversarial Phish',
    channel: 'Email',
    expectedRisk: 'high',
    text: `From: Accounts Payable <billing@corporate-partners.com>
Subject: Updated Corporate Expense Reimbursement Form

Hello there,
Hope you are having a wonderful and productive week.
When you have a brief moment this afternoon, could you please take a look at the revised company expense reimbursement policy document uploaded to our secure portal:
http://login-microsoft365.paypa1-secure.com/auth
Feel free to reach out if you have any questions at all.

Warm regards,
Accounting Support Team`,
  },
  {
    id: 'sample-bank-kyc',
    title: 'Bank KYC SMS (Malicious)',
    category: 'Urgent Smishing',
    channel: 'SMS',
    expectedRisk: 'high',
    text: 'Dear Customer, your SBI account will be blocked within 24 hours. Your KYC is expired! Please update your KYC immediately and verify your identity at http://sbi-kyc-update.top/login to restore access.',
  },
  {
    id: 'sample-microsoft-expiry',
    title: 'Microsoft 365 Expiry',
    category: 'Credential Phishing',
    channel: 'Email',
    expectedRisk: 'high',
    text: `From: "IT Helpdesk" <support@microsoft-security-portal.xyz>
Reply-To: credential-collector@freemail.ru
Subject: Final Notice: Office 365 Password Expires Today

Dear user,
Your Microsoft 365 work account password will expire within 12 hours.
All cloud documents and corporate emails will be permanently deactivated.
Login immediately to avoid account suspension:
http://login-microsoft365.paypa1-secure.com/auth

Security Operations Team`,
  },
  {
    id: 'sample-ceo-giftcard',
    title: 'CEO Gift-Card BEC',
    category: 'Executive Fraud',
    channel: 'Email',
    expectedRisk: 'high',
    text: `From: "Chief Executive Officer" <ceo.office.direct@gmail.com>
Subject: Quick favor - Urgent

Hi, are you at your desk? I am currently busy in an executive board meeting and cannot take calls.
I need an urgent confidential favor: please purchase 5 Apple gift cards worth $200 each for our client presentation.
Do not discuss with HR or finance right now. Send the card PIN codes directly to this email without delay.`,
  },
  {
    id: 'sample-courier-fee',
    title: 'Courier Customs Fee',
    category: 'Smishing',
    channel: 'SMS',
    expectedRisk: 'high',
    text: 'FedEx Courier Notification: Your parcel #FX-889102 is on hold at customs clearance. Delivery failed due to pending clearance charge of $2.99. Pay immediately to release your package: https://bit.ly/fedex-clearance-fee',
  },
];

interface SampleSelectorProps {
  onSelectSample: (text: string) => void;
  selectedId: string | null;
}

export function SampleSelector({ onSelectSample, selectedId }: SampleSelectorProps) {
  const getIcon = (id: string) => {
    switch (id) {
      case 'sample-adversarial-urgent-benign':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'sample-adversarial-polite-phishing':
        return <Mail className="w-4 h-4 text-rose-500" />;
      case 'sample-bank-kyc':
        return <Building2 className="w-4 h-4 text-rose-500" />;
      case 'sample-microsoft-expiry':
        return <Mail className="w-4 h-4 text-rose-500" />;
      case 'sample-ceo-giftcard':
        return <Briefcase className="w-4 h-4 text-rose-500" />;
      case 'sample-courier-fee':
        return <PackageCheck className="w-4 h-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>⚡ Adversarial Test Cases & Samples:</span>
        </label>
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60">
          Challenge 7 Verified
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {DEMO_SAMPLES.map((sample) => {
          const isSelected = selectedId === sample.id;
          return (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample.text)}
              type="button"
              className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all material-state-layer cursor-pointer ${
                isSelected
                  ? 'border-blue-500/80 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30 material-elevation-2'
                  : 'border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 material-elevation-1'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800 shrink-0 mt-0.5 shadow-2xs">
                {getIcon(sample.id)}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="font-bold text-[13px] truncate">{sample.title}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span className="truncate">{sample.channel}</span>
                  <span>•</span>
                  <span
                    className={
                      sample.expectedRisk === 'high'
                        ? 'text-rose-500 font-bold'
                        : sample.expectedRisk === 'medium'
                        ? 'text-amber-500 font-bold'
                        : 'text-emerald-500 font-bold'
                    }
                  >
                    {sample.expectedRisk.toUpperCase()}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
