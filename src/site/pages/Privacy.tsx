import { Link } from 'react-router-dom';
import { useSettings } from '../SiteContext';
import LegalPage from '../LegalPage';

export default function Privacy() {
  const SITE = useSettings();
  const DISCLAIMER = SITE.disclaimer;
  const n = SITE.name;
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro={<>Your privacy matters to us. This policy explains what personal information {n} collects, why, who can see it and the choices you have.</>}
      sections={[
        { id: 'collect', title: 'What we collect', body: <>
          <ul>
            <li><strong>Account details:</strong> your name, email address, mobile number, password (stored only in a scrambled, one-way form), your sponsor and franchise.</li>
            <li><strong>Identity and bank details (KYC):</strong> your bank account holder name, account number, IFSC and PAN, which you give us so that we can pay withdrawals. These are only needed if you want to withdraw.</li>
            <li><strong>Delivery addresses</strong> you save, and the address copied onto each order.</li>
            <li><strong>Orders and money records:</strong> what you buy, payments, wallet entries, top-ups, withdrawals, commission, and refunds.</li>
            <li><strong>Support information:</strong> tickets you raise, your messages and any photos you attach, and messages sent through the website contact form.</li>
            <li><strong>Technical information:</strong> your sign-in session, and basic logs needed to keep the service secure.</li>
          </ul>
        </> },
        { id: 'use', title: 'How we use it', body: <>
          <ul>
            <li>To create and run your account, process orders and deliver products.</li>
            <li>To calculate and pay commission, and to verify and pay your withdrawals.</li>
            <li>To show you your team and income, and to show your sponsor and franchise what they need to support you.</li>
            <li>To answer your questions and resolve problems.</li>
            <li>To prevent fraud, misuse and multiple accounts, to keep a record of important actions, and to meet legal, tax and accounting duties.</li>
          </ul>
          <p>We do not sell your personal information.</p>
        </> },
        { id: 'share', title: 'Who can see your information', body: <>
          <ul>
            <li><strong>The head office</strong> sees what it needs to run the business, approve payments and give support.</li>
            <li><strong>Your franchise</strong> sees your name, member ID, contact details, orders and requests so it can serve you, and it helps verify your bank details. Franchises above yours in the network can see members below them, but never another franchise’s money.</li>
            <li><strong>Your sponsor and upline</strong> see limited details of people in their team, such as name, member ID, rank and activity. They <strong>never see your bank account number or PAN</strong>.</li>
            <li><strong>Delivery and payment partners</strong> receive only what they need, such as your delivery address and phone number for a courier.</li>
            <li><strong>Authorities</strong>, where the law requires us to share information.</li>
          </ul>
        </> },
        { id: 'security', title: 'How we protect it', body: <>
          <ul>
            <li>Bank account numbers are <strong>encrypted</strong> in our database, and your PAN is shown only in a masked form. Passwords are never stored in readable form.</li>
            <li>Sensitive views, such as a franchise opening someone’s full bank details, are <strong>logged</strong>.</li>
            <li>Access is limited by role, and every sign-in is checked again on each request, so suspended accounts lose access immediately.</li>
            <li>Photos you attach to a support ticket are stored under a hard-to-guess address. Please avoid sharing documents with numbers you would not want a support agent to see.</li>
          </ul>
          <p>No system is perfectly secure, so please also keep your password private.</p>
        </> },
        { id: 'retention', title: 'How long we keep it', body: <>
          <p>We keep your account information while your account is open. Records of orders, payments, commission and withdrawals are kept for as long as accounting, tax and other laws require, even after an account is closed. Support tickets are kept so that we can look back at earlier help. When information is no longer needed, we delete it or make it anonymous.</p>
        </> },
        { id: 'rights', title: 'Your choices and rights', body: <>
          <ul>
            <li>See and update your name, mobile number and addresses yourself in your portal. Ask us to correct anything else.</li>
            <li>Ask for a copy of the personal information we hold about you.</li>
            <li>Ask us to delete your information. We will do so unless we must keep some of it by law (for example order and payment records).</li>
            <li>Withdraw consent for things that depend on it, and complain to us if you think your information has been mishandled.</li>
          </ul>
          <p>To use any of these rights, write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. We may need to confirm it is really you first.</p>
        </> },
        { id: 'cookies', title: 'Cookies and storage on your device', body: <>
          <p>We do not use advertising or tracking cookies. Our website stores a small amount of data in your browser so that it works: your sign-in session and your light or dark theme choice. You can clear this at any time in your browser settings; you will simply be signed out.</p>
        </> },
        { id: 'children', title: 'Children', body: <>
          <p>Our services are for people aged 18 and over. We do not knowingly collect information from children. If you believe a child has given us their information, please contact us and we will delete it.</p>
        </> },
        { id: 'changes', title: 'Changes to this policy', body: <>
          <p>We may update this policy as our services change. The date at the top shows the latest version. If a change significantly affects how we use your information, we will tell you in your portal or by email. See also our <Link to="/terms">Terms &amp; Conditions</Link>.</p>
        </> },
        { id: 'grievance', title: 'Contact and complaints', body: <>
          <p>For privacy questions or complaints, contact our grievance contact at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>, call {SITE.phone}, or write to {SITE.address} ({SITE.hours}). We aim to reply within a few working days.</p>
        </> },
      ]}
    />
  );
}
