import { Dashboard } from './types';

export const mockDashboard: Dashboard = {
  profile: {
    name: 'Demo Member', email: 'demo@example.com', phone: '9876543210', status: 'ACTIVE',
    kycStatus: 'VERIFIED', memberCode: 'M1A2B3C4D5', rank: 'SILVER', joinedAt: '2026-03-12T00:00:00Z',
    sponsorCode: 'MROOT00001', franchise: { name: 'Pune Remote Point', code: 'RF-PUN-01' },
  },
  wallet: { balancePaise: 482500, pendingCommissionPaise: 125000, totalEarnedPaise: 1260000, totalWithdrawnPaise: 777500 },
  team: {
    directs: 6, totalDownline: 23,
    levels: [6, 9, 5, 2, 1, 0, 0, 0].map((members, i) => ({ level: i + 1, members, earnedPaise: members * 21000 })),
  },
  earningsByMonth: [
    ['2026-06', 120000], ['2026-07', 185000], ['2026-08', 160000],
    ['2026-09', 240000], ['2026-10', 310000], ['2026-11', 245000],
  ].map(([month, totalPaise]) => ({ month: month as string, totalPaise: totalPaise as number })),
  recentCommissions: [
    { _id: '1', level: 1, amountPaise: 22000, status: 'APPROVED', createdAt: '2026-11-15T10:00:00Z' },
    { _id: '2', level: 2, amountPaise: 550, status: 'PENDING', createdAt: '2026-11-14T10:00:00Z' },
    { _id: '3', level: 1, amountPaise: 42000, status: 'APPROVED', createdAt: '2026-11-10T10:00:00Z' },
  ],
  recentOrders: [
    { _id: 'a', status: 'DELIVERED', totalPaise: 55000, createdAt: '2026-11-02T10:00:00Z' },
    { _id: 'b', status: 'PAID', totalPaise: 105000, createdAt: '2026-10-21T10:00:00Z' },
  ],
};

// ───────── Demo-mode data for profile + team (mirrors backend behaviour) ─────────
import { LevelTeamPage, NonActivePage, Profile, ProfileInput, TeamMember, TeamPage, TeamQuery, TeamSummary } from './types';

let profile: Profile = {
  name: 'Demo Member', email: 'demo@example.com', phone: '9876543210', dateOfBirth: '1990-05-17', gender: 'MALE',
  address: { line1: '12 MG Road', line2: '', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
  memberCode: 'M1A2B3C4D5', rank: 'SILVER', joinedAt: '2026-03-12T00:00:00Z', sponsorCode: 'MROOT00001',
  franchise: { name: 'Pune Remote Point', code: 'RF-PUN-01' },
};
export const mockGetProfile = () => structuredClone(profile);
export const mockUpdateProfile = (input: ProfileInput) => { profile = { ...profile, ...input }; return structuredClone(profile); };

const names = ['Asha Verma', 'Bilal Khan', 'Chitra Rao', 'Dev Patel', 'Esha Nair', 'Farhan Ali', 'Gauri Joshi', 'Harsh Mehta',
  'Isha Kapoor', 'Jatin Sharma', 'Kavya Iyer', 'Lakshman Das', 'Meera Pillai', 'Naveen Reddy', 'Omkar Patil', 'Pooja Singh',
  'Qasim Sheikh', 'Rhea Malhotra', 'Sameer Gupta', 'Tanvi Desai', 'Uday Kulkarni', 'Vidya Menon', 'Wasim Akram', 'Yash Bansal'];
const levelPlan = [4, 6, 6, 4, 2, 2];                       // members per level 1..6
const team: TeamMember[] = [];
let n = 0;
levelPlan.forEach((count, i) => {
  for (let k = 0; k < count; k++, n++) {
    team.push({
      id: `m${n}`, memberCode: `MDEMO${String(n + 2).padStart(4, '0')}`, name: names[n % names.length],
      phone: `98XXXXXX${String(10 + n).slice(-2)}`, rank: n % 7 === 0 ? 'SILVER' : 'ASSOCIATE', level: i + 1,
      joinedAt: new Date(Date.UTC(2026, 10 - (n % 8), 20 - (n % 18))).toISOString(), active: n % 3 !== 0, sponsorCode: null, sponsorName: null,
    });
  }
});
// Each member is sponsored by someone on the level above (level 1 is sponsored by "you").
const byLevel = (l: number) => team.filter((m) => m.level === l);
team.forEach((m, i) => {
  const above = byLevel(m.level - 1);
  const sp = above.length ? above[i % above.length] : null;
  m.sponsorCode = sp?.memberCode ?? null;
  m.sponsorName = sp?.name ?? null;
});
team.sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));

function filterTeam(q: TeamQuery, forceLevel?: number, forceStatus?: 'inactive'): TeamPage {
  const level = forceLevel ?? q.level;
  const status = forceStatus ?? q.status ?? 'all';
  const s = q.search?.toLowerCase();
  const rows = team.filter((m) =>
    (!level || m.level === level) &&
    (status === 'all' || m.active === (status === 'active')) &&
    (!s || m.name.toLowerCase().includes(s) || m.memberCode.toLowerCase().includes(s)));
  const dir = q.dir === "asc" ? 1 : -1;
  const cmp: Record<string, (a: TeamMember, b: TeamMember) => number> = {
    joined: (a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt),
    level: (a, b) => a.level - b.level,
    name: (a, b) => a.name.localeCompare(b.name),
    status: (a, b) => Number(a.active) - Number(b.active),
  };
  rows.sort((a, b) => dir * (cmp[q.sort ?? "joined"](a, b)) || +new Date(b.joinedAt) - +new Date(a.joinedAt));
  const pages = Math.max(1, Math.ceil(rows.length / q.limit));
  return { items: rows.slice((q.page - 1) * q.limit, q.page * q.limit), total: rows.length, page: q.page, limit: q.limit, pages };
}

function summary(): TeamSummary {
  const levels = Array.from({ length: 8 }, (_, i) => {
    const at = team.filter((m) => m.level === i + 1);
    const active = at.filter((m) => m.active).length;
    return { level: i + 1, total: at.length, active, inactive: at.length - active };
  });
  return {
    windowDays: 30, levels,
    total: team.length, active: team.filter((m) => m.active).length, inactive: team.filter((m) => !m.active).length,
  };
}

export function mockCsv(q: TeamQuery) {
  const rows = filterTeam({ ...q, page: 1, limit: 10000 }).items;
  const head = "Member ID,Name,Level,Sponsor ID,Sponsor name,Rank,Joined,Mobile,Status";
  const lines = rows.map((m) => [m.memberCode, m.name, m.level, m.level === 1 ? "You" : m.sponsorCode, m.level === 1 ? "" : m.sponsorName,
    m.rank, m.joinedAt.slice(0, 10), m.phone, m.active ? "Active" : "Inactive"].join(","));
  return "\uFEFF" + [head, ...lines].join("\r\n") + "\r\n";
}

export const mockDirect = (q: TeamQuery) => filterTeam(q, 1);
export const mockLevels = (q: TeamQuery): LevelTeamPage => ({ ...filterTeam(q), summary: summary() });
export const mockNonActive = (q: TeamQuery): NonActivePage => ({
  ...filterTeam(q, undefined, 'inactive'), windowDays: 30, inactiveTotal: summary().inactive,
});

// ───────── Demo-mode shipping data ─────────
import { Shipment, ShipmentPage, ShipmentQuery, ShipmentStatus, ShippingAddress, ShippingAddressInput } from './types';

let addresses: ShippingAddress[] = [
  { id: 'a1', label: 'HOME', fullName: 'Demo Member', phone: '9876543210', line1: '12 MG Road, Flat 4B', line2: 'Near City Mall', city: 'Pune', state: 'Maharashtra', pincode: '411001', isDefault: true },
  { id: 'a2', label: 'OFFICE', fullName: 'Demo Member', phone: '9876543210', line1: 'Tower 2, Business Park', line2: '', city: 'Mumbai', state: 'Maharashtra', pincode: '400051', isDefault: false },
];
let addrSeq = 3;
export const mockAddresses = () => ({ items: structuredClone(addresses), max: 10 });
export function mockCreateAddress(input: ShippingAddressInput): ShippingAddress {
  const isDefault = !!input.isDefault || addresses.length === 0;
  if (isDefault) addresses = addresses.map((a) => ({ ...a, isDefault: false }));
  const a: ShippingAddress = { ...input, id: `a${addrSeq++}`, isDefault };
  addresses = [a, ...addresses];
  return structuredClone(a);
}
export function mockUpdateAddress(id: string, input: ShippingAddressInput): ShippingAddress {
  if (input.isDefault) addresses = addresses.map((a) => ({ ...a, isDefault: false }));
  addresses = addresses.map((a) => (a.id === id ? { ...a, ...input, isDefault: input.isDefault || a.isDefault } : a));
  return structuredClone(addresses.find((a) => a.id === id)!);
}
export function mockSetDefault(id: string) { addresses = addresses.map((a) => ({ ...a, isDefault: a.id === id })); }
export function mockDeleteAddress(id: string) {
  const wasDefault = addresses.find((a) => a.id === id)?.isDefault;
  addresses = addresses.filter((a) => a.id !== id);
  if (wasDefault && addresses[0]) addresses[0].isDefault = true;
}

const FLOW: ShipmentStatus[] = ['PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const NOTE: Record<string, string> = { PENDING: 'Order placed', PACKED: 'Packed at warehouse', SHIPPED: 'Handed to courier', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Order cancelled' };
const DAY = 86_400_000;
const shipPlan: [ShipmentStatus, number][] = [['PACKED', 1], ['SHIPPED', 3], ['OUT_FOR_DELIVERY', 5], ['CANCELLED', 12], ['DELIVERED', 20],
  ...Array.from({ length: 9 }, (_, k): [ShipmentStatus, number] => ['DELIVERED', 40 + k * 15])];
const shipments: Shipment[] = shipPlan.map(([status, ago], i) => {
  const placed = Date.UTC(2026, 10, 18) - ago * DAY;
  const steps = status === 'CANCELLED' ? (['PENDING', 'CANCELLED'] as ShipmentStatus[]) : FLOW.slice(0, FLOW.indexOf(status) + 1);
  const shipped = steps.includes('SHIPPED');
  const big = i % 2 === 0;
  return {
    id: `s${i}`, orderNo: '#8F0D' + (0xE7 + i).toString(16).toUpperCase().padStart(2, '0'), placedAt: new Date(placed).toISOString(),
    totalPaise: big ? 105000 : 55000, status, courier: shipped ? ['Delhivery', 'Blue Dart', 'DTDC'][i % 3] : null,
    trackingId: shipped ? 'TRK' + (7_000_000 + i * 1311) : null,
    expectedDelivery: shipped && status !== 'DELIVERED' ? new Date(placed + 5 * DAY).toISOString() : null,
    items: [{ name: big ? 'Package B' : 'Package A', quantity: 1 }],
    address: { fullName: 'Demo Member', phone: '9876543210', line1: '12 MG Road, Flat 4B', line2: 'Near City Mall', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    events: steps.map((st, k) => ({ status: st, at: new Date(placed + k * DAY).toISOString(), note: NOTE[st] })),
  };
});
export const mockShipments = (q: ShipmentQuery): ShipmentPage => {
  const rows = shipments.filter((s) => !q.status || s.status === q.status);
  return { items: rows.slice((q.page - 1) * q.limit, q.page * q.limit), total: rows.length, page: q.page, limit: q.limit, pages: Math.max(1, Math.ceil(rows.length / q.limit)) };
};

// ───────── Demo-mode income ─────────
import { CommissionRow, IncomePage, IncomeQuery } from './types';

const commissionRows: CommissionRow[] = Array.from({ length: 16 }, (_, i) => {
  const level = i % 4 < 2 ? 1 : (i % 4);              // mix of direct (L1) and deeper levels
  const gross = i % 3 === 0 ? 105000 : 55000;
  const pct = [10, 5, 3, 2][level - 1];
  const original = Math.floor((gross * pct) / 100);
  const status: CommissionRow['status'] = i < 3 ? 'PENDING' : i === 6 || i === 11 ? 'REVERSED' : 'APPROVED';
  const reversed = status === 'REVERSED' ? original : i === 8 ? Math.floor(original / 2) : 0;
  const created = Date.UTC(2026, 10, 17) - i * 2.3 * 86_400_000;
  return {
    id: `c${i}`, orderNo: '#B9F2' + (0xA0 + i).toString(16).toUpperCase(), level, status, createdAt: new Date(created).toISOString(),
    originalPaise: original, reversedPaise: reversed, amountPaise: original - reversed,
    releaseAt: status === 'PENDING' ? new Date(created + 7 * 86_400_000).toISOString() : null,
    fromName: names[(i * 5) % names.length], fromCode: `MDEMO${String(i + 2).padStart(4, '0')}`,
  };
});

/** Demo: repurchase royalty (4% level 1, 1% levels 2-6, 0.5% levels 7-10) on product orders. */
const repurchaseRows: CommissionRow[] = Array.from({ length: 9 }, (_, i) => {
  const level = [1, 2, 1, 3, 7, 1, 4, 10, 2][i];
  const net = [220000, 120000, 35000, 90000, 150000, 62000, 48000, 200000, 78000][i];
  const pct = [4, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5][level - 1];
  const original = Math.floor((net * pct) / 100);
  const status: CommissionRow['status'] = i < 2 ? 'PENDING' : i === 5 ? 'REVERSED' : 'APPROVED';
  const created = Date.UTC(2026, 10, 18) - i * 3.1 * 86_400_000;
  return {
    id: `r${i}`, orderNo: '#C7D1' + (0x40 + i).toString(16).toUpperCase(), level, status, createdAt: new Date(created).toISOString(),
    originalPaise: original, reversedPaise: status === 'REVERSED' ? original : 0, amountPaise: status === 'REVERSED' ? 0 : original,
    releaseAt: status === 'PENDING' ? new Date(created + 7 * 86_400_000).toISOString() : null,
    fromName: names[(i * 3) % names.length], fromCode: `MDEMO${String(i + 4).padStart(4, '0')}`,
  };
});

export function mockCommissions(q: IncomeQuery): IncomePage {
  const ofType = (q.type === 'repurchase' ? repurchaseRows : commissionRows).filter((r) => q.type === 'all' || q.type === 'repurchase' || (q.type === 'direct' ? r.level === 1 : r.level >= 2));
  const rows = ofType.filter((r) => !q.status || r.status === q.status);
  const sum = (s: string) => ofType.filter((r) => r.status === s).reduce((n, r) => n + r.amountPaise, 0);
  return {
    items: rows.slice((q.page - 1) * q.limit, q.page * q.limit), total: rows.length, page: q.page, limit: q.limit,
    pages: Math.max(1, Math.ceil(rows.length / q.limit)),
    summary: { approvedPaise: sum('APPROVED'), pendingPaise: sum('PENDING'), reversedPaise: ofType.reduce((n, r) => n + r.reversedPaise, 0) },
  };
}

// ───────── Demo-mode wallet ─────────
import { EntriesPage, EntriesQuery, EntryType, PayoutAccountInput, WalletEntryRow, WalletSummary, WithdrawalPage, WithdrawalQuery, WithdrawalRow } from './types';

const wState = {
  income: 26250, shopping: 10000,
  kyc: { status: 'VERIFIED', accountHolder: 'Demo Member', accountLast4: '9012', ifsc: 'HDFC0001234', panMasked: 'ABCDE••••F', note: null } as WalletSummary['kyc'],
};
const cfg = { minPaise: 10000, feePercent: 15, tdsPercent: 0 };
let wSeq = 100;
const at = (daysAgo: number) => new Date(Date.UTC(2026, 10, 18, 9) - daysAgo * 86_400_000).toISOString();
const mkEntry = (type: EntryType, amountPaise: number, balanceAfterPaise: number, note: string, daysAgo: number): WalletEntryRow =>
  ({ id: `e${wSeq++}`, type, amountPaise, balanceAfterPaise, note, createdAt: at(daysAgo) });

// newest first
const incomeEntries: WalletEntryRow[] = [
  mkEntry('TRANSFER_OUT', -10000, 26250, 'Moved to shopping wallet', 0),
  mkEntry('WITHDRAWAL_DEBIT', -15000, 36250, 'Withdrawal request', 1),
  mkEntry('WITHDRAWAL_REFUND', 10000, 51250, 'Withdrawal rejected: Bank account name does not match KYC', 3),
  mkEntry('WITHDRAWAL_DEBIT', -10000, 41250, 'Withdrawal request', 4),
  mkEntry('WITHDRAWAL_DEBIT', -20000, 51250, 'Withdrawal request', 7),
  mkEntry('COMMISSION_CREDIT', 10500, 71250, 'Level 1 commission', 9),
  mkEntry('COMMISSION_REVERSAL', -5250, 60750, 'Refund clawback', 20),
  mkEntry('COMMISSION_CREDIT', 5500, 66000, 'Level 1 commission', 17),
  mkEntry('COMMISSION_CREDIT', 10500, 60500, 'Level 1 commission', 26),
];
const shoppingEntries: WalletEntryRow[] = [mkEntry('TRANSFER_IN', 10000, 10000, 'Moved from income wallet', 0)];
let withdrawals: WithdrawalRow[] = [
  { id: 'w3', requestedAt: at(1), amountPaise: 15000, feePaise: 0, tdsPaise: 0, netPaise: 15000, status: 'REQUESTED', payoutRef: null, rejectReason: null, processedAt: null, account: 'Demo Member •••• 9012' },
  { id: 'w2', requestedAt: at(4), amountPaise: 10000, feePaise: 0, tdsPaise: 0, netPaise: 10000, status: 'REJECTED', payoutRef: null, rejectReason: 'Bank account name does not match KYC', processedAt: at(3), account: 'Demo Member •••• 9012' },
  { id: 'w1', requestedAt: at(7), amountPaise: 20000, feePaise: 0, tdsPaise: 0, netPaise: 20000, status: 'PAID', payoutRef: 'UTR2026111700123', rejectReason: null, processedAt: at(6), account: 'Demo Member •••• 9012' },
];
const fail = (status: number, msg: string): never => { throw Object.assign(new Error(msg), { status }); };

export const mockWalletSummary = (): WalletSummary => ({
  incomeBalancePaise: wState.income, shoppingBalancePaise: wState.shopping,
  withdrawnPaise: withdrawals.filter((w) => w.status === 'PAID').reduce((n, w) => n + w.amountPaise, 0),
  inProcessPaise: withdrawals.filter((w) => w.status === 'REQUESTED' || w.status === 'APPROVED').reduce((n, w) => n + w.amountPaise, 0),
  config: cfg, kyc: structuredClone(wState.kyc),
});
export function mockSavePayout(i: PayoutAccountInput) {
  wState.kyc = { status: 'PENDING', accountHolder: i.accountHolder, accountLast4: i.accountNumber.slice(-4), ifsc: i.ifsc.toUpperCase(), panMasked: `${i.pan.slice(0, 5).toUpperCase()}••••${i.pan.slice(-1).toUpperCase()}`, note: null };
  return mockWalletSummary();
}
export function mockEntries(q: EntriesQuery): EntriesPage {
  const all = q.wallet === 'income' ? incomeEntries : shoppingEntries;
  const rows = all.filter((e) => !q.type || e.type === q.type);
  return { items: rows.slice((q.page - 1) * q.limit, q.page * q.limit), total: rows.length, page: q.page, limit: q.limit, pages: Math.max(1, Math.ceil(rows.length / q.limit)), balancePaise: q.wallet === 'income' ? wState.income : wState.shopping };
}
export function mockRequestWithdrawal(amount: number) {
  if (wState.kyc.status !== 'VERIFIED') fail(400, 'Your payout account must be verified before you can withdraw');
  if (amount < cfg.minPaise) fail(400, `Minimum withdrawal is ₹${cfg.minPaise / 100}`);
  if (amount > wState.income) fail(400, 'Insufficient wallet balance');
  wState.income -= amount;
  incomeEntries.unshift(mkEntry('WITHDRAWAL_DEBIT', -amount, wState.income, 'Withdrawal request', 0));
  withdrawals.unshift({ id: `w${wSeq++}`, requestedAt: new Date().toISOString(), amountPaise: amount, feePaise: Math.round(amount * cfg.feePercent / 100), tdsPaise: 0, netPaise: amount - Math.round(amount * cfg.feePercent / 100), status: 'REQUESTED', payoutRef: null, rejectReason: null, processedAt: null, account: `${wState.kyc.accountHolder} •••• ${wState.kyc.accountLast4}` });
  return { id: withdrawals[0].id, status: 'REQUESTED' as const, amountPaise: amount, netPaise: amount - Math.round(amount * cfg.feePercent / 100) };
}
export const mockWithdrawals = (q: WithdrawalQuery): WithdrawalPage => {
  const rows = withdrawals.filter((w) => !q.status || w.status === q.status);
  return { items: rows.slice((q.page - 1) * q.limit, q.page * q.limit), total: rows.length, page: q.page, limit: q.limit, pages: Math.max(1, Math.ceil(rows.length / q.limit)) };
};
export function mockCancelWithdrawal(id: string) {
  const w = withdrawals.find((x) => x.id === id);
  if (!w || w.status !== 'REQUESTED') fail(409, 'Only requests that are still waiting can be cancelled');
  w!.status = 'CANCELLED';
  wState.income += w!.amountPaise;
  incomeEntries.unshift(mkEntry('WITHDRAWAL_REFUND', w!.amountPaise, wState.income, 'Withdrawal cancelled', 0));
  return { id, status: 'CANCELLED' as const };
}
export function mockTransfer(amount: number) {
  if (amount < 100) fail(400, 'Minimum transfer is ₹1');
  if (amount > wState.income) fail(400, 'Insufficient wallet balance');
  wState.income -= amount; wState.shopping += amount;
  incomeEntries.unshift(mkEntry('TRANSFER_OUT', -amount, wState.income, 'Moved to shopping wallet', 0));
  shoppingEntries.unshift(mkEntry('TRANSFER_IN', amount, wState.shopping, 'Moved from income wallet', 0));
  return { incomeBalancePaise: wState.income, shoppingBalancePaise: wState.shopping };
}

// ───────── Demo-mode member-to-member transfers ─────────
import { P2PItem, P2PPage, P2PQuery, P2PRecipient, P2PSendInput } from './types';

const directory: Record<string, string> = {
  MDEMO0002: 'Asha Verma', MDEMO0003: 'Bilal Khan', MDEMO0004: 'Chitra Rao', MDEMO0005: 'Dev Patel', MDEMO0006: 'Esha Nair',
};
const SELF_CODE = 'M1A2B3C4D5';
const P2P_LIMIT = 1_000_000;
const mask = (n: string) => { const p = n.split(' '); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0]; };
const p2pItems: P2PItem[] = [
  { id: 'p2', direction: 'RECEIVED', amountPaise: 5000, note: 'Thanks for the help', counterparty: 'Asha V.', createdAt: at(2) },
  { id: 'p1', direction: 'SENT', amountPaise: 10000, note: null, counterparty: 'Bilal K.', createdAt: at(5) },
];
const p2pKeys = new Map<string, P2PItem>();
const sentToday = () => p2pItems.filter((t) => t.direction === 'SENT' && Date.now() - +new Date(t.createdAt) < 86_400_000).reduce((n, t) => n + t.amountPaise, 0);

export function mockP2PLookup(code: string): P2PRecipient {
  const c = code.trim().toUpperCase();
  if (c === SELF_CODE) fail(400, 'You can’t send to yourself');
  if (!directory[c]) fail(404, 'No active member found with that ID');
  return { memberCode: c, name: mask(directory[c]) };
}
export function mockP2PSend(i: P2PSendInput): P2PItem {
  const dup = p2pKeys.get(i.clientKey);
  if (dup) return dup;
  const r = mockP2PLookup(i.toMemberCode);
  if (i.amountPaise < 100) fail(400, 'Minimum transfer is ₹1');
  if (i.amountPaise > wState.shopping) fail(400, 'Insufficient wallet balance');
  if (sentToday() + i.amountPaise > P2P_LIMIT) fail(400, `This would exceed your daily limit of ₹${P2P_LIMIT / 100}`);
  wState.shopping -= i.amountPaise;
  shoppingEntries.unshift(mkEntry('P2P_OUT', -i.amountPaise, wState.shopping, `Sent to ${r.name} (${r.memberCode})`, 0));
  const t: P2PItem = { id: `p${wSeq++}`, direction: 'SENT', amountPaise: i.amountPaise, note: i.note ?? null, counterparty: r.name, createdAt: new Date().toISOString() };
  p2pItems.unshift(t); p2pKeys.set(i.clientKey, t);
  return t;
}
export function mockP2PHistory(q: P2PQuery): P2PPage {
  const rows = p2pItems.filter((t) => q.direction === 'all' || t.direction === q.direction.toUpperCase());
  return { items: rows.slice((q.page - 1) * q.limit, q.page * q.limit), total: rows.length, page: q.page, limit: q.limit, pages: Math.max(1, Math.ceil(rows.length / q.limit)), sentTodayPaise: sentToday(), dailyLimitPaise: P2P_LIMIT };
}

// ───────── Demo-mode deposits ─────────
import { FundInfo, FundPage, FundQuery, FundRow, FundSubmit } from './types';

const fundLimits = { minPaise: 10000, maxPaise: 5000000, maxOpen: 3, maxAgeDays: 30 };
let funds: FundRow[] = [
  { id: 'f3', createdAt: at(1), amountPaise: 150000, approvedPaise: null, mode: 'UPI', reference: 'UTR402611180099', paidOn: at(1), note: null, status: 'PENDING', reviewNote: null, reviewedAt: null },
  { id: 'f2', createdAt: at(4), amountPaise: 50000, approvedPaise: null, mode: 'IMPS', reference: 'IMPS6120004455', paidOn: at(4), note: null, status: 'REJECTED', reviewNote: 'Payment not found in the bank statement', reviewedAt: at(3) },
  { id: 'f1', createdAt: at(9), amountPaise: 100000, approvedPaise: 100000, mode: 'NEFT', reference: 'NEFT20261109771', paidOn: at(9), note: null, status: 'APPROVED', reviewNote: 'Matched', reviewedAt: at(8) },
];
const normRef = (r: string) => r.trim().toUpperCase().replace(/[\s\-/]/g, '');

export const mockFundInfo = (): FundInfo => ({
  instructions: { accountName: 'Example Direct Sales Pvt Ltd', accountNumber: '000123456789', ifsc: 'HDFC0000123', bank: 'HDFC Bank, Pune', upiId: 'example@hdfcbank' },
  limits: fundLimits, shoppingBalancePaise: wState.shopping, modes: ['UPI', 'IMPS', 'NEFT', 'RTGS', 'CASH_DEPOSIT'],
});
export function mockSubmitFund(i: FundSubmit) {
  if (i.amountPaise < fundLimits.minPaise) fail(400, `Minimum top-up is ₹${fundLimits.minPaise / 100}`);
  if (i.amountPaise > fundLimits.maxPaise) fail(400, `Maximum per request is ₹${fundLimits.maxPaise / 100}`);
  if (!/^[A-Za-z0-9\-/]{6,30}$/.test(i.reference.trim())) fail(400, 'Enter the bank reference / UTR (6 to 30 letters or digits)');
  if (funds.some((f) => (f.status === 'PENDING' || f.status === 'APPROVED') && normRef(f.reference) === normRef(i.reference))) fail(409, 'This payment reference has already been submitted');
  if (funds.filter((f) => f.status === 'PENDING').length >= fundLimits.maxOpen) fail(400, `You already have ${fundLimits.maxOpen} requests waiting. Wait for them to be reviewed or cancel one.`);
  const row: FundRow = { id: `f${wSeq++}`, createdAt: new Date().toISOString(), amountPaise: i.amountPaise, approvedPaise: null, mode: i.mode, reference: i.reference.trim(), paidOn: new Date(i.paidOn).toISOString(), note: i.note ?? null, status: 'PENDING', reviewNote: null, reviewedAt: null };
  funds.unshift(row);
  return { id: row.id, status: row.status };
}
export function mockFunds(q: FundQuery): FundPage {
  const rows = funds.filter((f) => !q.status || f.status === q.status);
  const sum = (s: FundRow['status'], k: 'amountPaise' | 'approvedPaise') => funds.filter((f) => f.status === s).reduce((n, f) => n + (f[k] ?? 0), 0);
  return {
    items: rows.slice((q.page - 1) * q.limit, q.page * q.limit), total: rows.length, page: q.page, limit: q.limit, pages: Math.max(1, Math.ceil(rows.length / q.limit)),
    summary: { creditedPaise: sum('APPROVED', 'approvedPaise'), pendingPaise: sum('PENDING', 'amountPaise'), pendingCount: funds.filter((f) => f.status === 'PENDING').length },
  };
}
export function mockCancelFund(id: string) {
  const f = funds.find((x) => x.id === id);
  if (!f || f.status !== 'PENDING') fail(409, 'Only requests that are still waiting can be cancelled');
  f!.status = 'CANCELLED';
  return { id, status: 'CANCELLED' as const };
}

// ───────── Demo-mode purchase history ─────────
import { Purchase, PurchasePage, PurchaseQuery } from './types';

const deliveryFor = (i: number, status: Purchase['status'], placed: number): Purchase['shipment'] => {
  const stage: ShipmentStatus = status === 'CANCELLED' ? 'CANCELLED' : status === 'PLACED' ? 'PENDING' : status === 'DELIVERED' || status === 'PARTIALLY_REFUNDED' || status === 'REFUNDED' ? 'DELIVERED' : (['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'PENDING'] as ShipmentStatus[])[i % 4];
  const steps = stage === 'CANCELLED' ? (['PENDING', 'CANCELLED'] as ShipmentStatus[]) : FLOW.slice(0, FLOW.indexOf(stage) + 1);
  const shipped = steps.includes('SHIPPED');
  return {
    status: stage, courier: shipped ? ['Delhivery', 'Blue Dart', 'DTDC'][i % 3] : null, trackingId: shipped ? 'TRK' + (7_000_000 + i * 1311) : null,
    expectedDelivery: shipped && stage !== 'DELIVERED' ? new Date(placed + 5 * DAY).toISOString() : null,
    events: steps.map((st, k) => ({ status: st, at: new Date(placed + k * DAY).toISOString(), note: NOTE[st] })),
    address: { fullName: 'Demo Member', phone: '9876543210', line1: '12 MG Road, Flat 4B', line2: 'Near City Mall', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
  };
};
const purchaseRows: Purchase[] = Array.from({ length: 14 }, (_, i) => {
  const joining = i % 5 === 0;
  const qty = joining ? 1 : (i % 3) + 1;
  const unit = joining ? (i % 2 ? 105000 : 55000) : [20000, 35000, 28000][i % 3];
  const total = unit * qty;
  const status: Purchase['status'] = i === 1 ? 'PLACED' : i === 4 ? 'CANCELLED' : i === 7 ? 'PARTIALLY_REFUNDED' : i === 10 ? 'REFUNDED' : i < 4 ? 'PAID' : 'DELIVERED';
  const refunded = status === 'REFUNDED' ? total : status === 'PARTIALLY_REFUNDED' ? Math.floor(total / 2) : 0;
  const placed = Date.UTC(2026, 10, 18) - i * 6 * 86_400_000;
  const paid = status !== 'PLACED' && status !== 'CANCELLED';
  return {
    id: `p${i}`, orderNo: '#7C1A' + (0x30 + i).toString(16).toUpperCase(), placedAt: new Date(placed).toISOString(), paidAt: paid ? new Date(placed + 3_600_000).toISOString() : null,
    status, totalPaise: total, refundedPaise: refunded, paymentMethod: !paid ? null : i % 3 === 0 ? 'Cash at the shop' : i % 3 === 1 ? 'Shopping wallet' : 'UPI at the shop',
    shop: { name: i % 2 ? 'Mumbai Remote Point' : 'Pune Remote Point', code: i % 2 ? 'RF-MUM-01' : 'RF-PUN-01' }, shipment: deliveryFor(i, status, placed),
    items: [{ kind: joining ? 'JOINING' : 'REPURCHASE', name: joining ? (i % 2 ? 'Package B' : 'Package A') : `Sample Repurchase Product ${(i % 3) + 1}`, sku: joining ? null : `RP-00${(i % 3) + 1}`, imageUrl: '', quantity: qty, unitPricePaise: unit, linePaise: total }],
  };
});
export const mockPurchases = (q: PurchaseQuery): PurchasePage => {
  const match = (p: Purchase) =>
    (q.status === 'all' || (q.status === 'paid' && ['PAID', 'DELIVERED', 'PARTIALLY_REFUNDED'].includes(p.status)) || (q.status === 'shipping' && ['PAID', 'PARTIALLY_REFUNDED'].includes(p.status) && p.shipment.status !== 'DELIVERED') || (q.status === 'delivered' && p.shipment.status === 'DELIVERED') || (q.status === 'awaiting' && p.status === 'PLACED') || (q.status === 'cancelled' && p.status === 'CANCELLED') || (q.status === 'refunded' && ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(p.status)))
    && (q.type === 'all' || p.items.some((i) => i.kind === (q.type === 'joining' ? 'JOINING' : 'REPURCHASE')));
  const rows = purchaseRows.filter(match);
  const paid = purchaseRows.filter((p) => ['PAID', 'DELIVERED', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(p.status));
  return {
    items: rows.slice((q.page - 1) * q.limit, q.page * q.limit), total: rows.length, page: q.page, limit: q.limit, pages: Math.max(1, Math.ceil(rows.length / q.limit)),
    summary: { spentPaise: paid.reduce((n, p) => n + p.totalPaise - p.refundedPaise, 0), refundedPaise: paid.reduce((n, p) => n + p.refundedPaise, 0), orders: paid.filter((p) => p.status !== 'REFUNDED').length, units: paid.filter((p) => p.status !== 'REFUNDED').reduce((n, p) => n + p.items.reduce((m, i) => m + i.quantity, 0), 0), lastPurchaseAt: purchaseRows[0].placedAt },
  };
};


// ───────── Demo-mode support ─────────
import { NewTicketInput, Ticket, TicketPage, TicketStatus } from './types';

const t0 = Date.UTC(2026, 10, 18);
let tickets: Ticket[] = [
  { id: 't1', number: 'SUP-000014', subject: 'Withdrawal still pending after 3 days', category: 'WITHDRAWAL', priority: 'NORMAL', status: 'WAITING_ON_USER', orderRef: null, createdAt: new Date(t0 - 3 * 86_400_000).toISOString(), updatedAt: new Date(t0 - 3_600_000).toISOString(), resolvedAt: null, closedAt: null, assignedName: 'Support team', needsYourReply: true, canReopen: false, canRate: false, rating: null,
    messages: [{ id: 'a', from: 'USER', author: 'Demo Member', body: 'I asked for a withdrawal of ₹1,000 three days ago and it still shows pending.', at: new Date(t0 - 3 * 86_400_000).toISOString() }, { id: 'b', from: 'ADMIN', author: 'Support team', body: 'Thanks for flagging this. Your bank details were verified, but the IFSC looks mistyped. Could you confirm the IFSC code printed on your cheque book?', at: new Date(t0 - 3_600_000).toISOString() }] },
  { id: 't2', number: 'SUP-000009', subject: 'Order #8F0D12 delivered to the wrong city', category: 'ORDER', priority: 'NORMAL', status: 'RESOLVED', orderRef: '#8F0D12', createdAt: new Date(t0 - 12 * 86_400_000).toISOString(), updatedAt: new Date(t0 - 9 * 86_400_000).toISOString(), resolvedAt: new Date(t0 - 9 * 86_400_000).toISOString(), closedAt: null, assignedName: 'Support team', needsYourReply: false, canReopen: true, canRate: true, rating: null,
    messages: [{ id: 'c', from: 'USER', author: 'Demo Member', body: 'The courier marked it delivered but I live in Pune and it went to Mumbai.', at: new Date(t0 - 12 * 86_400_000).toISOString() }, { id: 'd', from: 'ADMIN', author: 'Support team', body: 'We have asked the courier to redeliver it to your Pune address. It will reach you in 2 days.', at: new Date(t0 - 9 * 86_400_000).toISOString() }] },
];
const rowOf = (t: Ticket) => ({ id: t.id, number: t.number, subject: t.subject, category: t.category, status: t.status, updatedAt: t.updatedAt, createdAt: t.createdAt, needsYourReply: t.needsYourReply, last: ((m) => (m ? { from: m.from, text: m.body.slice(0, 140), at: m.at } : null))(t.messages[t.messages.length - 1]) });
const touch = (t: Ticket, status: TicketStatus) => { t.status = status; t.updatedAt = new Date().toISOString(); t.needsYourReply = status === 'WAITING_ON_USER'; t.canRate = ['RESOLVED', 'CLOSED'].includes(status) && !t.rating; t.canReopen = ['RESOLVED', 'CLOSED'].includes(status); };
export const mockSupport = {
  summary: () => ({ open: tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length, needsReply: tickets.filter((t) => t.status === 'WAITING_ON_USER').length }),
  list: (view: 'open' | 'closed' | 'all', page: number): TicketPage => {
    const rows = tickets.filter((t) => view === 'all' || (view === 'open') === !['RESOLVED', 'CLOSED'].includes(t.status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { items: rows.slice((page - 1) * 8, page * 8).map(rowOf), total: rows.length, page, limit: 8, pages: Math.max(1, Math.ceil(rows.length / 8)), needsReply: tickets.filter((t) => t.status === 'WAITING_ON_USER').length };
  },
  create: (b: NewTicketInput): Ticket => {
    const now = new Date().toISOString();
    const t: Ticket = { id: `t${tickets.length + 1}`, number: `SUP-${String(15 + tickets.length).padStart(6, '0')}`, subject: b.subject, category: b.category, priority: b.priority ?? 'NORMAL', status: 'OPEN', orderRef: b.orderRef ?? null, createdAt: now, updatedAt: now, resolvedAt: null, closedAt: null, assignedName: null, needsYourReply: false, canReopen: false, canRate: false, rating: null, messages: [{ id: 'm1', from: 'USER', author: 'Demo Member', body: b.message, attachments: b.attachments, at: now }] };
    tickets = [t, ...tickets]; return structuredClone(t);
  },
  get: (id: string): Ticket => structuredClone(tickets.find((t) => t.id === id)!),
  reply: (id: string, message: string, attachments?: string[]): Ticket => { const t = tickets.find((x) => x.id === id)!; t.messages.push({ id: `m${t.messages.length + 1}`, from: 'USER', author: 'Demo Member', body: message, attachments, at: new Date().toISOString() }); touch(t, 'OPEN'); return structuredClone(t); },
  setStatus: (id: string, s: TicketStatus): Ticket => { const t = tickets.find((x) => x.id === id)!; touch(t, s); return structuredClone(t); },
  rate: (id: string, stars: number, comment?: string): Ticket => { const t = tickets.find((x) => x.id === id)!; t.rating = { stars, comment: comment ?? '' }; t.canRate = false; return structuredClone(t); },
};


// ───────── Demo-mode public website ─────────
import { PublicCatalog } from './types';
export const mockPublicCatalog = (): PublicCatalog => ({
  packages: [{ id: 'k1', name: 'Package A', description: 'Starter pack to begin with.', pricePaise: 55000, imageUrl: '' }, { id: 'k2', name: 'Package B', description: 'Family pack with a wider range.', pricePaise: 105000, imageUrl: '' }],
  products: [1, 2, 3].map((n) => ({ id: `p${n}`, name: `Sample Repurchase Product ${n}`, description: 'A product you can use every day.', pricePaise: [20000, 35000, 28000][n - 1], imageUrl: '' })),
  cashback: { percentPerDay: 1, days: 30, totalPercent: 30, includesPackages: false },
  plans: [{ name: 'Mini', description: 'Small counter or kiosk', rank: 1, discountPercent: 3, investmentPaise: 2_500_000, maxMembers: 100 }, { name: 'Standard', description: 'Regular franchise', rank: 2, discountPercent: 5, investmentPaise: 10_000_000, maxMembers: 500 }, { name: 'Premium', description: 'Large franchise', rank: 3, discountPercent: 8, investmentPaise: 50_000_000, maxMembers: 0 }],
  plan: { levels: [40, 1, 1, 1, 1, 1, 0.5, 0.5].map((percent, i) => ({ level: i + 1, percent })), repurchaseLevels: [4, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5].map((percent, i) => ({ level: i + 1, percent })) },
});

/** Demo: a member with two purchases earning cashback (1% a day for up to 30 days). */
import type { CashbackData, PurchaseStatusData, RewardsData } from './types';
export const mockCashback = (): CashbackData => {
  const day = 86_400_000, now = Date.now();
  const mk = (id: string, base: number, daysPaid: number, startedDaysAgo: number): CashbackData['items'][number] => {
    const daily = Math.floor(base / 100), total = 30, done = daysPaid >= total;
    const started = new Date(now - startedDaysAgo * day);
    return { id, orderId: `66a0${id}00000000000000c1`, baseVolumePaise: base, percentPerDay: 1, dailyPaise: daily, daysTotal: total, daysPaid, paidPaise: daily * daysPaid, remainingPaise: done ? 0 : (total - daysPaid) * daily, status: done ? 'COMPLETED' : 'ACTIVE', startedAt: started.toISOString(), nextCreditAt: done ? null : new Date(started.getTime() + (daysPaid + 1) * day).toISOString() };
  };
  const items = [mk('a1', 70000, 12, 12), mk('a2', 125000, 30, 40)];
  return {
    config: { enabled: true, percentPerDay: 1, maxDays: 30, maxTotalPercent: 30, includePackages: false, days: 30 },
    totals: { earnedPaise: items.reduce((n, i) => n + i.paidPaise, 0), upcomingPaise: items.reduce((n, i) => n + i.remainingPaise, 0), active: items.filter((i) => i.status === 'ACTIVE').length },
    items,
  };
};

/** Demo: a team's buying across levels. */
export const mockPurchaseStatus = (): PurchaseStatusData => {
  const day = 86_400_000, now = Date.now();
  const lv = [[6, 5, 4, 14, 912500], [9, 6, 3, 17, 1120000], [7, 4, 2, 9, 640000], [5, 2, 1, 4, 312000], [3, 1, 0, 2, 98000], [2, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
  const levels = lv.map(([members, buyers, active, orders, valuePaise], i) => ({ level: i + 1, members, buyers, active, orders, valuePaise }));
  const sum = (k: 'members' | 'buyers' | 'active' | 'orders' | 'valuePaise') => levels.reduce((n, l) => n + l[k], 0);
  const who = [['Asha Verma', 'MDEMO0002', 1, 'Repurchase', 82000], ['Rohit Nair', 'MDEMO0005', 2, 'Joining package', 55000], ['Meera Iyer', 'MDEMO0007', 1, 'Repurchase', 134000], ['Kabir Shah', 'MDEMO0011', 3, 'Repurchase', 47500], ['Divya Rao', 'MDEMO0014', 2, 'Joining package', 105000]] as const;
  return {
    windowDays: 30,
    totals: { teamSize: sum('members'), buyers: sum('buyers'), active: sum('active'), orders: sum('orders'), valuePaise: sum('valuePaise'), recentOrders: 19, recentValuePaise: 1420000 },
    levels,
    recent: who.map(([buyerName, buyerCode, level, kind, valuePaise], i) => ({ id: `t${i}`, at: new Date(now - i * 2.4 * day).toISOString(), status: 'DELIVERED', valuePaise, kind, buyerName, buyerCode, level })),
  };
};

/** Demo: rank progress (requirements shown as the head office might publish them). */
export const mockRewards = (): RewardsData => ({
  rank: 'ASSOCIATE', next: 'SILVER', configured: true,
  stats: { teamVolumePaise: 3062500, directs: 6, activeDirects: 4, windowDays: 30 },
  ladder: [
    { rank: 'ASSOCIATE', current: true, held: true, requirement: null, progress: null },
    { rank: 'SILVER', current: false, held: false, requirement: { minTeamVolumePaise: 5000000, minActiveDirects: 4 }, progress: { volumePct: 61, directsPct: 100, met: false } },
    { rank: 'GOLD', current: false, held: false, requirement: { minTeamVolumePaise: 20000000, minActiveDirects: 8 }, progress: { volumePct: 15, directsPct: 50, met: false } },
    { rank: 'DIAMOND', current: false, held: false, requirement: null, progress: null },
  ],
});
