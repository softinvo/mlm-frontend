import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { homeFor, isMemberRole, useAuth } from './auth';
import MemberLayout from './components/MemberLayout';
import WrongApp from './pages/WrongApp';
import { allItems } from './nav';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import LevelTeam from './pages/LevelTeam';
import Login from './pages/Login';
import MyDirect from './pages/MyDirect';
import NonActiveTeam from './pages/NonActiveTeam';
import Placeholder from './pages/Placeholder';
import SiteLayout from './site/SiteLayout';
import BlockPage from './site/BlockPage';
import Privacy from './site/pages/Privacy';
import Terms from './site/pages/Terms';
import SupportNew from './pages/SupportNew';
import SupportTicket from './pages/SupportTicket';
import SupportTickets from './pages/SupportTickets';
import FundHistory from './pages/FundHistory';
import FundRequestPage from './pages/FundRequestPage';
import TopupWallet from './pages/TopupWallet';
import P2PTransfer from './pages/P2PTransfer';
import LedgerPage from './pages/LedgerPage';
import WalletTransfer from './pages/WalletTransfer';
import WithdrawalHistory from './pages/WithdrawalHistory';
import WithdrawalRequest from './pages/WithdrawalRequest';
import IncomeNotActive from './pages/IncomeNotActive';
import ForgotPassword from './pages/ForgotPassword';
import CashbackPage from './pages/CashbackPage';
import PurchaseStatus from './pages/PurchaseStatus';
import RewardsStatus from './pages/RewardsStatus';
import IncomePage from './pages/IncomePage';
import ShippingAddress from './pages/ShippingAddress';
import PurchaseHistory from './pages/PurchaseHistory';
import ProfileSettings from './pages/ProfileSettings';
import Register from './pages/Register';

// Built pages; everything else in the sidebar still shows the "coming soon" placeholder.
const pages: Record<string, ReactElement> = {
  "/dashboard/profile/settings": <ProfileSettings />,
  "/dashboard/profile/password": <ChangePassword />,
  "/dashboard/income/direct-sponsor": <IncomePage kind="direct" />,
  "/dashboard/income/level": <IncomePage kind="level" />,
  "/dashboard/income/cashback": <CashbackPage />,
  "/dashboard/team/global-purchase": <PurchaseStatus />,
  "/dashboard/team/rewards": <RewardsStatus />,
  "/dashboard/income/repurchase-royalty": <IncomePage kind="repurchase" />,
  "/dashboard/income/rank-rewards": <IncomeNotActive kind="rank-rewards" />,
  "/dashboard/income/global-magic": <IncomeNotActive kind="global-magic" />,
  "/dashboard/income/global-rank-royalty": <IncomeNotActive kind="global-rank" />,
  "/dashboard/income/team-passive": <IncomeNotActive kind="team-passive" />,
  "/dashboard/wallet/passbook": <LedgerPage wallet="income" />,
  "/dashboard/wallet/shopping-history": <LedgerPage wallet="shopping" />,
  "/dashboard/wallet/withdrawal-request": <WithdrawalRequest />,
  "/dashboard/wallet/withdrawal-history": <WithdrawalHistory />,
  "/dashboard/wallet/transfer": <WalletTransfer />,
  "/dashboard/wallet/p2p": <P2PTransfer />,
  "/dashboard/deposit/topup": <TopupWallet />,
  "/dashboard/deposit/fund-request": <FundRequestPage />,
  "/dashboard/deposit/fund-history": <FundHistory />,
  "/dashboard/profile/shipping-address": <ShippingAddress />,
  "/dashboard/profile/purchase-history": <PurchaseHistory />,
  "/dashboard/support/tickets": <SupportTickets />,
  "/dashboard/support/new": <SupportNew />,
  "/dashboard/team/direct": <MyDirect />,
  "/dashboard/team/levels": <LevelTeam />,
  "/dashboard/team/non-active": <NonActiveTeam />,
};

export default function App() {
  const { authed, role } = useAuth();
  const home = authed ? homeFor(role) : '/login';
  const isMember = authed && role === 'MEMBER';
  // Franchise and head-office accounts have their own app; if one is signed in here, point them there (the public website stays open to everyone).
  const wrongApp = authed && !isMemberRole(role);
  return (
    <Routes>
      {/* Public website */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<BlockPage page="home" />} />
        <Route path="/about" element={<BlockPage page="about" />} />
        <Route path="/products" element={<BlockPage page="products" />} />
        <Route path="/franchise" element={<BlockPage page="franchise" />} />
        <Route path="/opportunity" element={<BlockPage page="opportunity" />} />
        <Route path="/gallery" element={<BlockPage page="gallery" />} />
        <Route path="/contact" element={<BlockPage page="contact" />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/login" element={authed ? <Navigate to={home} /> : <Login />} />
        <Route path="/register" element={authed ? <Navigate to={home} /> : <Register />} />
        <Route path="/forgot-password" element={authed ? <Navigate to={home} /> : <ForgotPassword />} />
      </Route>

      <Route path="/dashboard/profile/shipping-history" element={<Navigate to="/dashboard/profile/purchase-history" replace />} />
      {/* Members */}
      <Route path="/dashboard" element={wrongApp ? <WrongApp /> : isMember ? <MemberLayout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        {allItems.map((i) => (
          <Route key={i.path} path={i.path.replace('/dashboard/', '')} element={pages[i.path] ?? <Placeholder />} />
        ))}
        <Route path="support/tickets/:id" element={<SupportTicket />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
