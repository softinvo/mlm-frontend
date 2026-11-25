import { CashbackData, OtpChannel, OtpSent, PurchaseStatusData, RewardsData } from './types';
import {
  mockCancelFund, mockFundInfo, mockFunds, mockSubmitFund, mockP2PHistory, mockP2PLookup, mockP2PSend, mockCancelWithdrawal, mockEntries, mockRequestWithdrawal, mockSavePayout, mockTransfer, mockWalletSummary, mockWithdrawals,
  mockCommissions, mockAddresses, mockCreateAddress, mockDeleteAddress, mockSetDefault, mockPublicCatalog, mockPurchases, mockShipments, mockSupport, mockUpdateAddress,
  mockCashback, mockPurchaseStatus, mockRewards, mockCsv, mockDashboard, mockDirect, mockGetProfile, mockLevels, mockNonActive, mockUpdateProfile } from './mock';
import { FundInfo, FundPage, FundQuery, FundSubmit } from './types';
import { P2PItem, P2PPage, P2PQuery, P2PRecipient, P2PSendInput } from './types';
import { EntriesPage, EntriesQuery, PayoutAccountInput, WalletSummary, WithdrawalPage, WithdrawalQuery, WithdrawalStatus } from './types';
import type { SiteContent } from './site/types';
import { ContactInput, NewTicketInput, PublicCatalog, PublicPhoto, PurchasePage, PurchaseQuery, Ticket, TicketPage } from './types';
import { IncomePage, IncomeQuery, ShipmentPage, ShipmentQuery, ShippingAddress, ShippingAddressInput } from './types';
import { Dashboard, LevelTeamPage, NonActivePage, Profile, ProfileInput, TeamPage, TeamQuery } from './types';

export const DEMO = import.meta.env.VITE_DEMO === '1';
// Backend base URL (e.g. http://localhost:4000). Empty = same origin / dev proxy.
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '');
const TOKEN_KEY = 'mlm_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string[]>) {
    super(message);
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = await res.json().catch(() => ({}));
  // Expired/invalid session on an authenticated call: drop the token and go to login.
  if (res.status === 401 && token && !path.startsWith("/auth/")) {
    setToken(null);
    window.location.assign("/login");
  }
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'Request failed', body.details);
  return body as T;
}

export interface RegisterInput {
  name: string; email: string; phone: string; password: string; sponsorCode: string; franchiseCode: string;
}

const qs = (q: TeamQuery) => {
  const p = new URLSearchParams({ page: String(q.page), limit: String(q.limit) });
  if (q.search) p.set("search", q.search);
  if (q.status && q.status !== "all") p.set("status", q.status);
  if (q.level) p.set("level", String(q.level));
  if (q.sort) p.set("sort", q.sort);
  if (q.dir) p.set("dir", q.dir);
  return p.toString();
};
/** In demo mode, a failed call to the real backend means "backend not running" and we use sample data. A real answer (like a validation error) is passed on. */
const offline = <T,>(e: unknown, fallback: T): T => { if (e instanceof ApiError && e.status !== 502 && e.status !== 503 && e.status !== 504) throw e; return fallback; };
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 250));

export const api = {
  login: async (email: string, password: string) =>
    DEMO ? { token: 'demo', role: 'MEMBER' } : request<{ token: string; role: string; name: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: async (input: RegisterInput) =>
    DEMO ? { token: 'demo' } : request<{ token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  profile: async (): Promise<Profile> => (DEMO ? delay(mockGetProfile()) : request<Profile>("/member/profile")),
  updateProfile: async (input: ProfileInput): Promise<Profile> =>
    DEMO ? delay(mockUpdateProfile(input)) : request<Profile>("/member/profile", { method: "PATCH", body: JSON.stringify(input) }),
  changePassword: async (currentPassword: string, newPassword: string) =>
    DEMO
      ? delay(currentPassword === "wrong" ? Promise.reject(new ApiError(400, "Current password is incorrect")) : { ok: true })
      : request<{ ok: true }>("/account/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
  teamDirect: async (q: TeamQuery): Promise<TeamPage> => (DEMO ? delay(mockDirect(q)) : request<TeamPage>(`/member/team/direct?${qs(q)}`)),
  teamLevels: async (q: TeamQuery): Promise<LevelTeamPage> => (DEMO ? delay(mockLevels(q)) : request<LevelTeamPage>(`/member/team/levels?${qs(q)}`)),
  teamNonActive: async (q: TeamQuery): Promise<NonActivePage> => (DEMO ? delay(mockNonActive(q)) : request<NonActivePage>(`/member/team/non-active?${qs(q)}`)),
  exportLevelTeam: async (q: TeamQuery) => {
    let blob: Blob;
    if (DEMO) {
      blob = new Blob([mockCsv(q)], { type: "text/csv;charset=utf-8" });
    } else {
      const res = await fetch(`${API_BASE}/api/member/team/levels/export?${qs(q)}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new ApiError(res.status, "Could not export the team list");
      blob = await res.blob();
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "level-team.csv"; a.click();
    URL.revokeObjectURL(url);
  },
  addresses: async () => (DEMO ? delay(mockAddresses()) : request<{ items: ShippingAddress[]; max: number }>("/member/shipping-addresses")),
  createAddress: async (input: ShippingAddressInput) =>
    DEMO ? delay(mockCreateAddress(input)) : request<ShippingAddress>("/member/shipping-addresses", { method: "POST", body: JSON.stringify(input) }),
  updateAddress: async (id: string, input: ShippingAddressInput) =>
    DEMO ? delay(mockUpdateAddress(id, input)) : request<ShippingAddress>(`/member/shipping-addresses/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  setDefaultAddress: async (id: string) => {
    if (DEMO) { mockSetDefault(id); return delay({ ok: true }); }
    return request<ShippingAddress>(`/member/shipping-addresses/${id}/default`, { method: "POST" });
  },
  deleteAddress: async (id: string) => {
    if (DEMO) { mockDeleteAddress(id); return delay({ ok: true }); }
    return request<{ ok: true }>(`/member/shipping-addresses/${id}`, { method: "DELETE" });
  },
  shipments: async (q: ShipmentQuery): Promise<ShipmentPage> => {
    if (DEMO) return delay(mockShipments(q));
    const p = new URLSearchParams({ page: String(q.page), limit: String(q.limit) });
    if (q.status) p.set("status", q.status);
    return request<ShipmentPage>(`/member/shipping-history?${p}`);
  },
  // The public website always shows REAL content from the backend (even in demo mode, which only fakes the member dashboard). Demo mode falls back to sample data only when the backend can't be reached.
  publicSite: async (): Promise<SiteContent> => request<SiteContent>('/public/site'),
  publicCatalog: async (): Promise<PublicCatalog> => (DEMO ? request<PublicCatalog>('/public/catalog').catch((e) => offline(e, mockPublicCatalog())) : request('/public/catalog')),
  publicGallery: async (): Promise<{ items: PublicPhoto[] }> => (DEMO ? request<{ items: PublicPhoto[] }>('/public/gallery').catch((e) => offline(e, { items: [] })) : request('/public/gallery')),
  sendContact: async (b: ContactInput): Promise<{ ok: true }> => (DEMO ? request<{ ok: true }>('/public/contact', { method: 'POST', body: JSON.stringify(b) }).catch((e) => offline(e, { ok: true as const })) : request('/public/contact', { method: 'POST', body: JSON.stringify(b) })),
  supportSummary: async (): Promise<{ open: number; needsReply: number }> => (DEMO ? delay(mockSupport.summary()) : request("/member/support/summary")),
  tickets: async (view: 'open' | 'closed' | 'all', page: number): Promise<TicketPage> =>
    DEMO ? delay(mockSupport.list(view, page)) : request(`/member/support/tickets?view=${view}&page=${page}&limit=8`),
  createTicket: async (b: NewTicketInput): Promise<Ticket> => (DEMO ? delay(mockSupport.create(b)) : request("/member/support/tickets", { method: "POST", body: JSON.stringify(b) })),
  ticket: async (id: string): Promise<Ticket> => (DEMO ? delay(mockSupport.get(id)) : request(`/member/support/tickets/${id}`)),
  replyTicket: async (id: string, message: string, attachments?: string[]): Promise<Ticket> => (DEMO ? delay(mockSupport.reply(id, message, attachments)) : request(`/member/support/tickets/${id}/reply`, { method: "POST", body: JSON.stringify({ message, attachments }) })),
  supportUploadUrl: async (extension: string): Promise<{ uploadUrl: string; downloadUrl: string; contentType: string }> => request("/member/support/upload-url", { method: "POST", body: JSON.stringify({ extension }) }),
  closeTicket: async (id: string): Promise<Ticket> => (DEMO ? delay(mockSupport.setStatus(id, 'CLOSED')) : request(`/member/support/tickets/${id}/close`, { method: "POST" })),
  reopenTicket: async (id: string): Promise<Ticket> => (DEMO ? delay(mockSupport.setStatus(id, 'OPEN')) : request(`/member/support/tickets/${id}/reopen`, { method: "POST" })),
  rateTicket: async (id: string, stars: number, comment?: string): Promise<Ticket> => (DEMO ? delay(mockSupport.rate(id, stars, comment)) : request(`/member/support/tickets/${id}/rate`, { method: "POST", body: JSON.stringify({ stars, comment }) })),
  purchases: async (q: PurchaseQuery): Promise<PurchasePage> => {
    if (DEMO) return delay(mockPurchases(q));
    return request<PurchasePage>(`/member/purchases?${new URLSearchParams({ page: String(q.page), limit: String(q.limit), status: q.status, type: q.type })}`);
  },
  commissions: async (q: IncomeQuery): Promise<IncomePage> => {
    if (DEMO) return delay(mockCommissions(q));
    const p = new URLSearchParams({ type: q.type, page: String(q.page), limit: String(q.limit) });
    if (q.status) p.set("status", q.status);
    return request<IncomePage>(`/member/commissions?${p}`);
  },
  cashback: async (): Promise<CashbackData> => (DEMO ? delay(mockCashback()) : request<CashbackData>('/member/cashback')),
  purchaseStatus: async (): Promise<PurchaseStatusData> => (DEMO ? delay(mockPurchaseStatus()) : request<PurchaseStatusData>('/member/team/purchases')),
  rewards: async (): Promise<RewardsData> => (DEMO ? delay(mockRewards()) : request<RewardsData>('/member/rewards')),
  wallet: async (): Promise<WalletSummary> => (DEMO ? delay(mockWalletSummary()) : request<WalletSummary>("/member/wallet")),
  savePayoutAccount: async (i: PayoutAccountInput): Promise<WalletSummary> =>
    DEMO ? delay(mockSavePayout(i)) : request<WalletSummary>("/member/wallet/payout-account", { method: "PUT", body: JSON.stringify(i) }),
  walletEntries: async (q: EntriesQuery): Promise<EntriesPage> => {
    if (DEMO) return delay(mockEntries(q));
    const p = new URLSearchParams({ wallet: q.wallet, page: String(q.page), limit: String(q.limit) });
    if (q.type) p.set("type", q.type);
    return request<EntriesPage>(`/member/wallet/entries?${p}`);
  },
  sendWithdrawalOtp: async (channel: OtpChannel): Promise<OtpSent> =>
    DEMO ? delay({ channel, sentTo: channel === 'SMS' ? 'XXXXXX4321' : 'de••••@example.com', expiresInMinutes: 10 }) : request<OtpSent>("/member/withdrawals/otp", { method: "POST", body: JSON.stringify({ channel }) }),
  requestWithdrawal: async (amountPaise: number, otp: string) =>
    DEMO ? delay(mockRequestWithdrawal(amountPaise)) : request<{ id: string; status: WithdrawalStatus; amountPaise: number; netPaise: number }>("/member/withdrawals", { method: "POST", body: JSON.stringify({ amountPaise, otp }) }),
  setOtpChannel: async (channel: OtpChannel) => (DEMO ? delay({ otpChannel: channel }) : request<{ otpChannel: OtpChannel }>("/member/otp-channel", { method: "PUT", body: JSON.stringify({ channel }) })),
  forgotPassword: async (identifier: string, channel: OtpChannel) =>
    DEMO ? delay({ ok: true, message: 'If an account matches, we have sent a code. It is valid for a few minutes.' }) : request<{ ok: true; message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ identifier, channel }) }),
  resetPassword: async (identifier: string, otp: string, password: string) =>
    DEMO ? delay({ ok: true }) : request<{ ok: true }>("/auth/forgot-password/reset", { method: "POST", body: JSON.stringify({ identifier, otp, password }) }),
  withdrawals: async (q: WithdrawalQuery): Promise<WithdrawalPage> => {
    if (DEMO) return delay(mockWithdrawals(q));
    const p = new URLSearchParams({ page: String(q.page), limit: String(q.limit) });
    if (q.status) p.set("status", q.status);
    return request<WithdrawalPage>(`/member/withdrawals?${p}`);
  },
  cancelWithdrawal: async (id: string) => (DEMO ? delay(mockCancelWithdrawal(id)) : request<{ id: string; status: WithdrawalStatus }>(`/member/withdrawals/${id}/cancel`, { method: "POST" })),
  transfer: async (amountPaise: number) =>
    DEMO ? delay(mockTransfer(amountPaise)) : request<{ incomeBalancePaise: number; shoppingBalancePaise: number }>("/member/wallet/transfer", { method: "POST", body: JSON.stringify({ amountPaise }) }),
  p2pLookup: async (code: string) =>
    DEMO ? delay(mockP2PLookup(code)) : request<P2PRecipient>(`/member/transfers/lookup?code=${encodeURIComponent(code)}`),
  p2pSend: async (i: P2PSendInput) =>
    DEMO ? delay(mockP2PSend(i)) : request<P2PItem>("/member/transfers", { method: "POST", body: JSON.stringify(i) }),
  p2pHistory: async (q: P2PQuery): Promise<P2PPage> =>
    DEMO ? delay(mockP2PHistory(q)) : request<P2PPage>(`/member/transfers?direction=${q.direction}&page=${q.page}&limit=${q.limit}`),
  fundInfo: async () => (DEMO ? delay(mockFundInfo()) : request<FundInfo>("/member/fund-requests/info")),
  submitFund: async (i: FundSubmit) => (DEMO ? delay(mockSubmitFund(i)) : request<{ id: string; status: string }>("/member/fund-requests", { method: "POST", body: JSON.stringify(i) })),
  funds: async (q: FundQuery): Promise<FundPage> => {
    if (DEMO) return delay(mockFunds(q));
    const p = new URLSearchParams({ page: String(q.page), limit: String(q.limit) });
    if (q.status) p.set("status", q.status);
    return request<FundPage>(`/member/fund-requests?${p}`);
  },
  cancelFund: async (id: string) => (DEMO ? delay(mockCancelFund(id)) : request<{ id: string; status: string }>(`/member/fund-requests/${id}/cancel`, { method: "POST" })),
  dashboard: async () => (DEMO ? mockDashboard : request<Dashboard>('/member/dashboard')),
};
