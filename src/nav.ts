import type { IconName } from './components/Icon';

export interface NavItem { label: string; path: string }
export interface NavGroup { label: string; icon: IconName; items: NavItem[] }

const item = (label: string, path: string): NavItem => ({ label, path: `/dashboard/${path}` });

export const navGroups: NavGroup[] = [
  {
    label: 'Profile', icon: 'user',
    items: [
      item('Profile Setting', 'profile/settings'),
      item('Change Password', 'profile/password'),
      item('Shipping Address', 'profile/shipping-address'),
      item('Purchase History', 'profile/purchase-history'),
    ],
  },
  {
    label: 'My Team', icon: 'users',
    items: [
      item('My Direct', 'team/direct'),
      item('Level Team', 'team/levels'),
      item('Non Active Team', 'team/non-active'),
      item('Global Purchase Status', 'team/global-purchase'),
      item('Rewards & Awards Status', 'team/rewards'),
    ],
  },
  {
    label: 'Deposit / Top Up', icon: 'card',
    items: [
      item('Topup Wallet', 'deposit/topup'),
      item('Fund Request', 'deposit/fund-request'),
      item('Fund History', 'deposit/fund-history'),
    ],
  },
  {
    label: 'Income', icon: 'trend',
    items: [
      item('CashBack Reward', 'income/cashback'),
      item('Direct Sponsor Income', 'income/direct-sponsor'),
      item('Level Income', 'income/level'),
      item('Global Magic Income', 'income/global-magic'),
      item('Global Rank Royalty Income', 'income/global-rank-royalty'),
      item('Repurchase Royalty Income', 'income/repurchase-royalty'),
      item('Team Passive Income', 'income/team-passive'),
      item('Rank Rewards Income', 'income/rank-rewards'),
    ],
  },
  {
    label: 'Withdrawal / Wallet', icon: 'wallet',
    items: [
      item('Withdrawal Request', 'wallet/withdrawal-request'),
      item('Wallet Transfer', 'wallet/transfer'),
      item('Withdrawal History', 'wallet/withdrawal-history'),
      item('P2P Transfer', 'wallet/p2p'),
      item('Shopping Wallet History', 'wallet/shopping-history'),
      item('Passbook', 'wallet/passbook'),
    ],
  },
  {
    label: 'Help & Support', icon: 'chat',
    items: [
      item('My Tickets', 'support/tickets'),
      item('New Ticket', 'support/new'),
    ],
  },
];

export const allItems: (NavItem & { group: string })[] = navGroups.flatMap((g) =>
  g.items.map((i) => ({ ...i, group: g.label })),
);

export const findRoute = (pathname: string) => allItems.find((i) => i.path === pathname);
