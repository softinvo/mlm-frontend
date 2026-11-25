import { Link } from 'react-router-dom';
import { useSettings } from '../SiteContext';
import LegalPage from '../LegalPage';

export default function Terms() {
  const SITE = useSettings();
  const DISCLAIMER = SITE.disclaimer;
  const n = SITE.name;
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      intro={<>Please read these terms before you create an account or buy from {n}. By signing up or using the website and member portal you agree to them.</>}
      sections={[
        { id: 'who', title: 'Who these terms apply to', body: <>
          <p>These terms apply to everyone who visits our website, creates an account as a member, or buys products from us or from one of our franchises. “We”, “us” and “{n}” mean the company and its head office. A “franchise” is a business authorised by us to sell our products and serve members. A “member” is a person with an account on our member portal.</p>
        </> },
        { id: 'eligibility', title: 'Eligibility and your account', body: <>
          <ul>
            <li>You must be at least 18 years old and able to enter into a contract under Indian law.</li>
            <li>You join with a <strong>sponsor code</strong> and a <strong>franchise code</strong>. Please give accurate details: your name, email address and mobile number must be your own.</li>
            <li>You may hold <strong>one account</strong>. Creating several accounts, or using someone else’s identity, is not allowed.</li>
            <li>Keep your password private. You are responsible for activity on your account. Tell us straight away if you think someone else has used it.</li>
          </ul>
        </> },
        { id: 'products', title: 'Products, prices and orders', body: <>
          <ul>
            <li>Joining kits and repurchase products are sold at the prices shown, which <strong>include applicable taxes</strong>. Prices can change; an order keeps the price it was placed at.</li>
            <li>You can buy from a franchise by paying at the counter, or by paying from your <strong>shopping wallet</strong>. For a wallet payment the franchise sends a request which <strong>you must approve</strong> in your portal before any money is taken. Approve only purchases you are making yourself.</li>
            <li>A franchise can only sell what it has in stock. An order is confirmed when payment is received.</li>
            <li>We and our franchises work to deliver on time but cannot guarantee delivery dates. You can follow each order in <em>Purchase History</em>.</li>
          </ul>
        </> },
        { id: 'refunds', title: 'Cancellations, returns and refunds', body: <>
          <ul>
            <li>An order that has not shipped can be cancelled. An unpaid order is simply cancelled; a paid one is refunded.</li>
            <li>If a product arrives damaged, wrong or incomplete, raise a ticket under <Link to="/contact">Help &amp; Support</Link> with a photo within a reasonable time of delivery and we will arrange a replacement or refund.</li>
            <li>Refunds for wallet payments go back to your shopping wallet. Refunds for payments made at a franchise are returned by that franchise.</li>
            <li>When an order is refunded, any <strong>commission earned on it is reversed</strong> in the same proportion, even if it has already been credited.</li>
          </ul>
        </> },
        { id: 'commission', title: 'Commission', body: <>
          {DISCLAIMER && <p>{DISCLAIMER}</p>}
          <ul>
            <li>Commission is paid <strong>only on verified retail product sales</strong>, for example a delivered order placed by a customer in your team. Signing up a person, or buying a joining kit, does not by itself earn commission for recruiting.</li>
            <li>The levels and percentages are those shown on our Opportunity page and in your portal at the time the order is delivered. We may change them for future orders with notice; orders already placed keep the rate they were bought under.</li>
            <li>Commission first shows as <em>pending</em>. It is held for a <strong>cooling-off period</strong> (currently 7 days after delivery) and is credited to your income wallet when that ends. Commission on a refunded or cancelled order is reversed.</li>
            <li>There is a limit on the total commission paid out on any one order, so that payouts always stay within the retail value of the sale.</li>
            <li>We do not promise any level of income. Your results depend on your own effort and on your team’s genuine retail purchases.</li>
          </ul>
        </> },
        { id: 'wallets', title: 'Wallets, withdrawals and tax', body: <>
          <ul>
            <li>You have an <strong>income wallet</strong> (commission) and a <strong>shopping wallet</strong> (money you can spend on products). Money can be moved from your income wallet to your shopping wallet. Income cannot be sent to other members.</li>
            <li>You can add money to your shopping wallet by sending a payment and submitting a fund request. The wallet is credited only after the head office confirms the payment.</li>
            <li>To withdraw, you must first add your bank details and PAN and have them <strong>verified</strong>. Withdrawals have a minimum amount, are reviewed by the head office and are paid to your verified bank account only.</li>
            <li>We may deduct any <strong>tax at source (TDS)</strong> and charges required by law or shown in your portal before paying a withdrawal. You are responsible for reporting your income and paying any tax due on it.</li>
          </ul>
        </> },
        { id: 'conduct', title: 'What you must not do', body: <>
          <ul>
            <li>Make false or misleading claims about income, earnings, our products or our company, including claims that earnings are guaranteed or that anyone will “get rich”.</li>
            <li>Present the opportunity as a way to earn from recruitment alone, or pressure anyone to join or to buy more than they need.</li>
            <li>Buy products only to qualify for or inflate commission, trade with your own accounts, or otherwise manipulate orders, wallets or the network.</li>
            <li>Send spam, harass others, or use the portal to break the law.</li>
            <li>Try to access other people’s accounts or data, or to disrupt or probe our systems.</li>
          </ul>
        </> },
        { id: 'franchises', title: 'Franchises', body: <>
          <p>Franchises are independent businesses authorised to sell our products. They work within plans (such as Premium, Standard and Mini) set by the head office, hold stock supplied to them, and work from a prepaid balance. A franchise helps members with orders, payments and verification, but <strong>only the head office approves money decisions</strong> such as crediting a top-up or paying a withdrawal. Franchise owners agree separately to the terms of their franchise arrangement with us.</p>
        </> },
        { id: 'suspension', title: 'Suspension and ending your membership', body: <>
          <ul>
            <li>You can stop using your account at any time. Ask us to close it, and any money owed to you will be paid to your verified bank account subject to these terms.</li>
            <li>We may suspend or end an account, hold commission or reverse it if we reasonably believe these terms have been broken, the law has been broken, or details are false. Where we can, we will tell you why and give you a chance to respond.</li>
          </ul>
        </> },
        { id: 'liability', title: 'Our responsibility', body: <>
          <p>We provide the website and portal “as is” and work to keep them available and accurate, but they may occasionally be unavailable or contain errors. To the fullest extent the law allows, we are not liable for indirect or consequential loss, or for loss caused by events outside our control. Nothing in these terms limits liability that cannot be limited by law, or your rights as a consumer.</p>
        </> },
        { id: 'privacy', title: 'Your information', body: <>
          <p>How we collect and use your personal information is described in our <Link to="/privacy">Privacy Policy</Link>, which forms part of these terms.</p>
        </> },
        { id: 'changes', title: 'Changes to these terms', body: <>
          <p>We may update these terms from time to time. The date at the top shows when they were last changed. If a change materially affects you, we will tell you in your portal or by email. Continuing to use your account after a change means you accept it.</p>
        </> },
        { id: 'law', title: 'Governing law and disputes', body: <>
          <p>These terms are governed by the laws of India. If you have a complaint, please raise it first with our support team through the portal or the <Link to="/contact">contact page</Link>; we aim to resolve it quickly. If it cannot be resolved, the courts at the location of our head office have jurisdiction, subject to any rights you have as a consumer to approach your local consumer forum.</p>
        </> },
        { id: 'contact', title: 'Contact us', body: <>
          <p>Questions about these terms? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>, call {SITE.phone}, or write to {SITE.address}.</p>
        </> },
      ]}
    />
  );
}
