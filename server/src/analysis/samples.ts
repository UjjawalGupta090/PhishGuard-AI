import { RiskLevel } from '../types/contract.js';

export interface SampleMessage {
  id: string;
  title: string;
  channel: 'sms' | 'email' | 'chat';
  expectedRisk: RiskLevel;
  description: string;
  text: string;
}

export const SAMPLE_MESSAGES: SampleMessage[] = [
  {
    id: 'sample-adversarial-urgent-benign',
    title: 'HR Urgent Benefits Deadline (Safe)',
    channel: 'email',
    expectedRisk: 'low',
    description: 'Adversarial Test 1: Legitimate operational message containing high-urgency deadlines ("immediately", "final notice") but pointing to safe internal corporate resources without credential theft.',
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
    title: 'Polite Travel Expense Phish (High)',
    channel: 'email',
    expectedRisk: 'high',
    description: 'Adversarial Test 2: Courteous corporate email with zero urgency or aggressive demands, but embedding a definitive credential harvesting link on a lookalike domain.',
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
    title: 'Bank KYC Suspension Alert',
    channel: 'sms',
    expectedRisk: 'high',
    description: 'Classic Indian smishing SMS impersonating SBI with urgency and credential theft URL',
    text: 'Dear Customer, your SBI account will be blocked within 24 hours. Your KYC is expired! Please update your KYC immediately and verify your identity at http://sbi-kyc-update.top/login to restore access.',
  },
  {
    id: 'sample-microsoft-expiry',
    title: 'Microsoft 365 Password Expiry',
    channel: 'email',
    expectedRisk: 'high',
    description: 'IT Helpdesk corporate credential phishing email with spoofed headers and typosquatted link',
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
    title: 'CEO Urgent Gift Card Request',
    channel: 'email',
    expectedRisk: 'high',
    description: 'Executive impersonation business email compromise (BEC) requesting untraceable gift cards',
    text: `From: "Chief Executive Officer" <ceo.office.direct@gmail.com>
Subject: Quick favor - Urgent

Hi, are you at your desk? I am currently busy in an executive board meeting and cannot take calls.
I need an urgent confidential favor: please purchase 5 Apple gift cards worth $200 each for our client presentation.
Do not discuss with HR or finance right now. Send the card PIN codes directly to this email without delay.`,
  },
  {
    id: 'sample-courier-fee',
    title: 'Courier Customs Clearance Fee',
    channel: 'sms',
    expectedRisk: 'high',
    description: 'Logistics delivery smishing demanding upfront customs payment via shortened link',
    text: 'FedEx Courier Notification: Your parcel #FX-889102 is on hold at customs clearance. Delivery failed due to pending clearance charge of $2.99. Pay immediately to release your package: https://bit.ly/fedex-clearance-fee',
  },
  {
    id: 'sample-fake-job',
    title: 'Telegram WFH Job Offer',
    channel: 'chat',
    expectedRisk: 'high',
    description: 'Task-based work from home scam promising unrealistic daily income with Telegram contact',
    text: 'Congratulations! Part-time work from home vacancy available. Earn Rs. 5000 to 10000 daily simply by reviewing products and liking YouTube videos. Zero investment required, guaranteed profit daily. Contact our HR manager immediately on WhatsApp +91 9876543210 to claim your bonus.',
  },
  {
    id: 'sample-safe-email',
    title: 'Normal Internal Team Sync',
    channel: 'email',
    expectedRisk: 'low',
    description: 'Legitimate workplace email using standard conversational language without phishing signals',
    text: `From: Sarah Jenkins <sarah.jenkins@company.com>
Subject: Urgent meeting tomorrow - Q3 Product Roadmap

Hi Team,
Hope you are having a productive week.
We have an urgent meeting tomorrow morning at 10:00 AM in Conference Room B to finalize the Q3 product launch timeline.
Please review the attached project agenda doc on our internal Google Drive folder beforehand.
Looking forward to speaking with everyone.

Best regards,
Sarah`,
  },
];
