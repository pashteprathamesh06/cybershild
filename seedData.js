const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

/**
 * Seeds the database with:
 *  - An initial admin user (from ADMIN_EMAIL / ADMIN_PASSWORD env vars)
 *  - Learning Center modules (10 categories)
 *  - AI Scam Simulator scenarios (6 types, multiple each)
 *
 * Run with: npm run seed  (from the backend/ directory)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const LearningContent = require('../models/LearningContent');
const SimulatorQuestion = require('../models/SimulatorQuestion');

const learningModules = [
  {
    title: 'Recognizing Phishing Attempts',
    category: 'Phishing Awareness',
    summary: 'Learn how attackers craft phishing emails and links to steal your credentials.',
    content:
      'Phishing is a social-engineering attack where scammers impersonate trusted entities (banks, employers, popular services) to trick victims into revealing sensitive information or clicking malicious links. Common signs include mismatched sender addresses, urgent language, generic greetings, and links that don\'t match the claimed destination. Always hover over links before clicking, verify sender domains carefully, and never enter credentials on a page you reached via an unsolicited link.',
    keyTakeaways: [
      'Check the actual sender email address, not just the display name',
      'Hover over links to preview the real destination before clicking',
      'Legitimate organizations rarely ask for passwords or OTPs via email/SMS',
      'When in doubt, navigate to the official website directly instead of clicking links',
    ],
    icon: 'mail-warning',
    order: 1,
  },
  {
    title: 'How OTP Scams Work',
    category: 'OTP Scams',
    summary: 'Understand how fraudsters trick victims into revealing one-time passwords.',
    content:
      'OTP (One-Time Password) scams involve tricking victims into sharing the OTP sent to their phone, allowing attackers to complete transactions or account takeovers. Scammers often pose as bank officials, delivery agents, or support staff and create urgency ("your account will be blocked") to pressure victims into sharing the code. No legitimate bank or service will ever ask you to share an OTP over a call, SMS, or chat.',
    keyTakeaways: [
      'Never share an OTP with anyone, even someone claiming to be from your bank',
      'OTPs are meant only for you to enter on official apps or websites',
      'Be suspicious of unsolicited calls asking to "verify" a transaction',
      'Report and block numbers that request OTPs',
    ],
    icon: 'key-round',
    order: 2,
  },
  {
    title: 'Spotting UPI Fraud',
    category: 'UPI Fraud',
    summary: 'Common tactics used in UPI-based payment scams and how to avoid them.',
    content:
      'UPI fraud often tricks victims into approving a "collect request" believing it will credit money instead of debiting it. Scammers may pose as buyers on marketplace apps, asking victims to accept a payment request to "receive" a refund or sale amount. Remember: receiving money never requires entering a UPI PIN — a PIN is only needed to send/authorize a payment.', 
    keyTakeaways: [
      'You never need to enter a UPI PIN to RECEIVE money',
      'Carefully read any payment request before approving it',
      'Be wary of buyers/sellers who rush you or refuse standard payment flows',
      'Enable transaction alerts and review them promptly',
    ],
    icon: 'indian-rupee',
    order: 3,
  },
  {
    title: 'Banking Fraud Red Flags',
    category: 'Banking Fraud',
    summary: 'Warning signs of fraudulent calls, SMS, and emails claiming to be from your bank.',
    content:
      'Banking fraud schemes include fake KYC update requests, card blocking threats, and fraudulent loan offers. Attackers often spoof caller IDs or use SMS sender IDs resembling real banks. Always verify by calling the number printed on your physical card or the bank\'s official website — never a number provided in the suspicious message itself.',
    keyTakeaways: [
      'Banks do not ask for full card details, PINs, or passwords over calls/SMS',
      'Verify suspicious messages using officially published contact numbers',
      'Enable two-factor authentication wherever available',
      'Report suspicious bank communications to your bank\'s fraud helpline',
    ],
    icon: 'landmark',
    order: 4,
  },
  {
    title: 'Understanding Social Engineering',
    category: 'Social Engineering',
    summary: 'The psychological tactics scammers use: urgency, fear, authority, and trust.',
    content:
      'Social engineering exploits human psychology rather than technical vulnerabilities. Common tactics include creating urgency ("act now or lose access"), invoking fear ("legal action will be taken"), impersonating authority (police, tax officials, executives), and building false trust over time (romance scams, fake friendships). Recognizing these emotional triggers is the first step to resisting manipulation.',
    keyTakeaways: [
      'Pause before acting on any message that creates strong urgency or fear',
      'Authority figures rarely demand immediate payment or secrecy',
      'Verify identity through an independent, trusted channel',
      'It is okay to hang up, delete, or ignore suspicious contact attempts',
    ],
    icon: 'brain',
    order: 5,
  },
  {
    title: 'Building Strong Password Habits',
    category: 'Password Security',
    summary: 'Best practices for creating and managing secure, unique passwords.',
    content:
      'Weak or reused passwords are one of the leading causes of account compromise. Use long, unique passphrases for every account, consider a reputable password manager, and change passwords immediately if a service you use reports a data breach. Avoid using easily guessable personal information like birthdays or names.',
    keyTakeaways: [
      'Use a unique password for every important account',
      'Longer passphrases are generally stronger than short complex ones',
      'A password manager makes unique, strong passwords practical',
      'Change passwords immediately after any breach notification',
    ],
    icon: 'lock',
    order: 6,
  },
  {
    title: 'Why Multi-Factor Authentication Matters',
    category: 'MFA Security',
    summary: 'How MFA protects your accounts even if your password is compromised.',
    content:
      'Multi-Factor Authentication (MFA) adds a second layer of verification beyond your password, such as an authenticator app code or hardware security key. Even if a scammer steals your password, MFA can stop them from accessing your account. Prefer app-based or hardware authenticators over SMS-based codes where possible, as SMS can be intercepted via SIM-swap attacks.',
    keyTakeaways: [
      'Enable MFA on email, banking, and social media accounts',
      'App-based authenticators are generally more secure than SMS codes',
      'Never share MFA codes with anyone, including "support staff"',
      'Keep backup codes stored securely in case you lose your device',
    ],
    icon: 'shield-check',
    order: 7,
  },
  {
    title: 'Identifying Fake Job Offers',
    category: 'Fake Job Scams',
    summary: 'How to spot fraudulent job postings and recruitment scams.',
    content:
      'Fake job scams lure victims with unrealistic salaries for minimal work, then request upfront "registration" or "training" fees, or trick victims into money-laundering schemes. Legitimate employers never ask candidates to pay for a job offer. Research the company independently, verify recruiter identities on official channels, and be skeptical of offers made without a proper interview process.',
    keyTakeaways: [
      'Legitimate employers never ask you to pay to receive a job or offer letter',
      'Verify the company and recruiter through official, independent channels',
      'Be cautious of offers with unrealistically high pay for minimal effort',
      'Never share bank details or make payments during a "hiring process"',
    ],
    icon: 'briefcase',
    order: 8,
  },
  {
    title: 'Avoiding Investment Scams',
    category: 'Investment Scams',
    summary: 'Common patterns in fraudulent investment and crypto schemes.',
    content:
      'Investment scams promise unrealistically high, guaranteed returns with little to no risk — a major red flag, since all legitimate investments carry risk. Scammers often use fake testimonials, countdown timers, and pressure to invest quickly. Ponzi-style schemes pay early investors using new investors\' money until they collapse. Always research investment platforms through official regulatory bodies before committing funds.',
    keyTakeaways: [
      'Guaranteed high returns with no risk is a classic scam signal',
      'Verify investment platforms with official financial regulators',
      'Be wary of pressure to invest quickly or recruit others',
      'Never invest money you cannot afford to lose based on social media tips alone',
    ],
    icon: 'trending-up',
    order: 9,
  },
  {
    title: 'Everyday Safe Internet Practices',
    category: 'Safe Internet Practices',
    summary: 'General habits that keep you safer online across all platforms.',
    content:
      'Good baseline digital hygiene reduces your overall risk: keep software updated, avoid public Wi-Fi for sensitive transactions (or use a VPN), regularly review app permissions, back up important data, and think before sharing personal information publicly. Cultivating a habit of healthy skepticism toward unsolicited messages is one of the strongest defenses against scams.',
    keyTakeaways: [
      'Keep your operating system, browser, and apps updated',
      'Avoid sensitive transactions on unsecured public Wi-Fi',
      'Regularly review privacy settings and app permissions',
      'When something feels off, pause and verify before acting',
    ],
    icon: 'globe',
    order: 10,
  },
];

const simulatorScenarios = [
  {
    scenarioType: 'Fake Bank Message',
    messageText:
      'Dear Customer, your account will be BLOCKED within 24 hours due to KYC non-compliance. Click here to update immediately: http://bank-kyc-verify.xyz-secure.info',
    isScam: true,
    explanation:
      'This message uses urgency (24-hour deadline) and fear (account blocking) to pressure quick action. The link uses a suspicious, non-official domain rather than the bank\'s real website.',
    learningTips: [
      'Banks never send KYC links via unsolicited SMS with unofficial domains',
      'Always visit your bank\'s app or official website directly to check account status',
    ],
    difficulty: 'Easy',
  },
  {
    scenarioType: 'Fake Bank Message',
    messageText:
      'Your monthly e-statement for account ending in 4821 is now available in your net banking portal. No action is required.',
    isScam: false,
    explanation:
      'This is a routine, informational notification with no links, no urgency, and no request for personal information — consistent with legitimate bank communication.',
    learningTips: [
      'Legitimate notifications are typically informational and don\'t pressure immediate action',
      'Still, always access your account through the official app rather than any embedded link',
    ],
    difficulty: 'Easy',
  },
  {
    scenarioType: 'Fake Job Offer',
    messageText:
      'Congratulations! You are selected for a Work-From-Home data entry job paying $2000/week. To receive your offer letter, pay a refundable registration fee of $50 via this link.',
    isScam: true,
    explanation:
      'Legitimate employers never charge candidates a fee to receive a job offer. The unrealistically high pay for minimal work is also a classic red flag.',
    learningTips: [
      'Never pay money to receive a job offer, even if called "refundable"',
      'Research the company independently before engaging further',
    ],
    difficulty: 'Easy',
  },
  {
    scenarioType: 'Fake Delivery Message',
    messageText:
      'Your package could not be delivered due to incomplete address. Pay a $1.99 redelivery fee here: http://track-parcel-update.co/pay to reschedule.',
    isScam: true,
    explanation:
      'Delivery scams use a small, easy-to-approve payment to harvest card details. Legitimate couriers use their official app or website, not unsolicited links for micro-payments.',
    learningTips: [
      'Verify delivery issues directly through the courier\'s official app or tracking number',
      'Be suspicious of small payment requests via unfamiliar links — they are designed to feel low-risk',
    ],
    difficulty: 'Medium',
  },
  {
    scenarioType: 'Fake Reward Message',
    messageText:
      'CONGRATULATIONS! You have WON a brand new iPhone 15 in our anniversary lucky draw! Claim now within 2 hours: http://claim-your-prize-now.win',
    isScam: true,
    explanation:
      'Unsolicited prize notifications for contests you never entered, combined with urgency and a suspicious domain, are hallmark signs of a reward scam.',
    learningTips: [
      'You cannot win a contest you never entered',
      'Legitimate prize claims never require urgent action within hours',
    ],
    difficulty: 'Easy',
  },
  {
    scenarioType: 'Fake Account Verification',
    messageText:
      'Security Alert: We noticed a login attempt from a new device. If this wasn\'t you, secure your account immediately: [Official app notification, no link, prompts in-app review]',
    isScam: false,
    explanation:
      'This describes a standard in-app security notification without an external link or request for credentials — consistent with genuine account security alerts from major platforms.',
    learningTips: [
      'Genuine security alerts typically direct you to review activity within the official app, not an external link',
      'Still verify by opening the app manually rather than tapping notification links when unsure',
    ],
    difficulty: 'Medium',
  },
  {
    scenarioType: 'Fake Investment Message',
    messageText:
      'Join our exclusive crypto trading group! Guaranteed 300% returns in 30 days. Limited slots available — invest now with as little as $100.',
    isScam: true,
    explanation:
      'Guaranteed high returns with no mentioned risk, combined with artificial scarcity ("limited slots"), are classic signs of an investment scam or Ponzi scheme.',
    learningTips: [
      'All legitimate investments carry risk — "guaranteed returns" is a major red flag',
      'Verify investment opportunities through official financial regulatory bodies',
    ],
    difficulty: 'Medium',
  },
  {
    scenarioType: 'Fake Account Verification',
    messageText:
      'URGENT: Your social media account will be permanently deleted in 1 hour unless you verify your identity by entering your password here: http://social-verify-secure.net',
    isScam: true,
    explanation:
      'The combination of extreme urgency, threat of permanent loss, and a request for a password via an external unofficial link is a textbook phishing/account-takeover attempt.',
    learningTips: [
      'Platforms never ask for your password via an external link',
      'Extreme time pressure ("1 hour") is designed to prevent careful thinking — pause and verify instead',
    ],
    difficulty: 'Easy',
  },
];

async function seed() {
  try {
    await connectDB();

    // --- Admin user ---
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cybershield.ai';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'CyberShield Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`✅ Admin user created: ${adminEmail}`);
    } else {
      console.log('ℹ️  Admin user already exists, skipping.');
    }

    // --- Learning content ---
    await LearningContent.deleteMany({});
    await LearningContent.insertMany(learningModules);
    console.log(`✅ Seeded ${learningModules.length} learning modules`);

    // --- Simulator scenarios ---
    await SimulatorQuestion.deleteMany({});
    await SimulatorQuestion.insertMany(simulatorScenarios);
    console.log(`✅ Seeded ${simulatorScenarios.length} simulator scenarios`);

    console.log('🎉 Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
