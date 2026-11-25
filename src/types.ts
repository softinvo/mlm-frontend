export interface Dashboard {
  profile: {
    name: string; email: string; phone: string; status: string; kycStatus: string;
    memberCode: string; rank: string; joinedAt: string; sponsorCode: string | null;
    franchise: { name: string; code: string } | null;
  };
  wallet: { balancePaise: number; pendingCommissionPaise: number; totalEarnedPaise: number; totalWithdrawnPaise: number };
  team: { directs: number; totalDownline: number; levels: { level: number; members: number; earnedPaise: number }[] };
  earningsByMonth: { month: string; totalPaise: number }[];
  recentCommissions: { _id: string; level: number; amountPaise: number; status: string; createdAt: string }[];
  recentOrders: { _id: string; status: string; totalPaise: number; createdAt: string }[];
}

export type OtpChannel = 'SMS' | 'EMAIL';
export interface OtpSent { channel: OtpChannel; sentTo: string; expiresInMinutes: number }
export interface Profile {
  name: string; email: string; phone: string; dateOfBirth: string; gender: "" | "MALE" | "FEMALE" | "OTHER";
  address: { line1: string; line2: string; city: string; state: string; pincode: string };
  memberCode: string; rank: string; joinedAt: string; sponsorCode: string | null;
  franchise: { name: string; code: string } | null;
  otpChannel?: OtpChannel;
}
export type ProfileInput = Pick<Profile, "name" | "phone" | "dateOfBirth" | "gender" | "address">;

export interface TeamMember {
  id: string; memberCode: string; name: string; phone: string; rank: string; level: number; joinedAt: string; active: boolean;
  sponsorCode: string | null; sponsorName: string | null;
}
export type StatusFilter = "all" | "active" | "inactive";
export type SortKey = 'joined' | 'level' | 'name' | 'status';
export interface TeamQuery {
  page: number; limit: number; search?: string; status?: StatusFilter; level?: number; sort?: SortKey; dir?: 'asc' | 'desc';
}
export interface TeamPage { items: TeamMember[]; total: number; page: number; limit: number; pages: number }
export interface TeamSummary {
  windowDays: number; total: number; active: number; inactive: number;
  levels: { level: number; total: number; active: number; inactive: number }[];
}
export type LevelTeamPage = TeamPage & { summary: TeamSummary };
export type NonActivePage = TeamPage & { windowDays: number; inactiveTotal: number };

export type AddressLabel = 'HOME' | 'OFFICE' | 'OTHER';
export interface ShippingAddress {
  id: string; label: AddressLabel; fullName: string; phone: string; line1: string; line2: string;
  city: string; state: string; pincode: string; isDefault: boolean;
}
export type ShippingAddressInput = Omit<ShippingAddress, 'id' | 'isDefault'> & { isDefault?: boolean };

export type ShipmentStatus = 'PENDING' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export interface Shipment {
  id: string; orderNo: string; placedAt: string; totalPaise: number; status: ShipmentStatus;
  awaitingPayment?: boolean; courier: string | null; trackingId: string | null; expectedDelivery: string | null;
  items: { name: string; quantity: number; imageUrl?: string }[];
  address: { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string } | null;
  events: { status: ShipmentStatus; at: string; note: string | null }[];
}
export interface ShipmentQuery { page: number; limit: number; status?: ShipmentStatus }
export interface ShipmentPage { items: Shipment[]; total: number; page: number; limit: number; pages: number }

export type CommissionStatus = 'PENDING' | 'APPROVED' | 'REVERSED';
export interface CommissionRow {
  id: string; orderNo: string; level: number; status: CommissionStatus; createdAt: string;
  originalPaise: number; reversedPaise: number; amountPaise: number; releaseAt: string | null;
  fromName: string | null; fromCode: string | null;
}
export interface IncomeQuery { type: 'all' | 'direct' | 'level' | 'repurchase'; status?: CommissionStatus; page: number; limit: number }
export interface IncomePage {
  items: CommissionRow[]; total: number; page: number; limit: number; pages: number;
  summary: { approvedPaise: number; pendingPaise: number; reversedPaise: number };
}

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export interface WalletSummary {
  incomeBalancePaise: number; shoppingBalancePaise: number; withdrawnPaise: number; inProcessPaise: number;
  config: { minPaise: number; feePercent: number; tdsPercent: number };
  kyc: { status: KycStatus; accountHolder?: string; accountLast4?: string; ifsc?: string; panMasked?: string; note?: string | null };
}
export interface PayoutAccountInput { accountHolder: string; accountNumber: string; ifsc: string; pan: string }

export type EntryType =
  | 'COMMISSION_CREDIT' | 'COMMISSION_REVERSAL' | 'FRANCHISE_CREDIT' | 'CASHBACK_CREDIT' | 'CASHBACK_REVERSAL' | 'WITHDRAWAL_DEBIT' | 'WITHDRAWAL_REFUND'
  | 'ADJUSTMENT' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'SHOPPING_SPEND' | 'SHOPPING_REFUND' | 'P2P_OUT' | 'P2P_IN' | 'DEPOSIT';
export interface CashbackItem { id: string; orderId: string; baseVolumePaise: number; percentPerDay: number; dailyPaise: number; daysTotal: number; daysPaid: number; paidPaise: number; remainingPaise: number; status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'; startedAt: string; nextCreditAt: string | null }
export interface CashbackData {
  config: { enabled: boolean; percentPerDay: number; maxDays: number; maxTotalPercent: number; includePackages: boolean; days: number };
  totals: { earnedPaise: number; upcomingPaise: number; active: number };
  items: CashbackItem[];
}
export interface WalletEntryRow { id: string; type: EntryType; amountPaise: number; balanceAfterPaise: number | null; note: string | null; createdAt: string }
export interface EntriesQuery { wallet: 'income' | 'shopping'; type?: EntryType; page: number; limit: number }
export interface EntriesPage { items: WalletEntryRow[]; total: number; page: number; limit: number; pages: number; balancePaise: number }

export type WithdrawalStatus = 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED' | 'CANCELLED';
export interface WithdrawalRow {
  id: string; requestedAt: string; amountPaise: number; feePaise: number; tdsPaise: number; netPaise: number; status: WithdrawalStatus;
  payoutRef: string | null; rejectReason: string | null; processedAt: string | null; account: string | null;
}
export interface WithdrawalQuery { status?: WithdrawalStatus; page: number; limit: number }
export interface WithdrawalPage { items: WithdrawalRow[]; total: number; page: number; limit: number; pages: number }


export interface P2PRecipient { memberCode: string; name: string }
export interface P2PItem { id: string; direction: 'SENT' | 'RECEIVED'; amountPaise: number; note: string | null; counterparty: string; createdAt: string }
export interface P2PPage { items: P2PItem[]; total: number; page: number; limit: number; pages: number; sentTodayPaise: number; dailyLimitPaise: number }
export interface P2PQuery { direction: 'all' | 'sent' | 'received'; page: number; limit: number }
export interface P2PSendInput { toMemberCode: string; amountPaise: number; note?: string; clientKey: string }

export type PaymentMode = 'UPI' | 'IMPS' | 'NEFT' | 'RTGS' | 'CASH_DEPOSIT';
export type FundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export interface FundInfo {
  instructions: { accountName: string | null; accountNumber: string | null; ifsc: string | null; bank: string | null; upiId: string | null } | null;
  limits: { minPaise: number; maxPaise: number; maxOpen: number; maxAgeDays: number };
  shoppingBalancePaise: number; modes: PaymentMode[];
}
export interface FundRow {
  id: string; createdAt: string; amountPaise: number; approvedPaise: number | null; mode: PaymentMode; reference: string; paidOn: string;
  note: string | null; status: FundStatus; reviewNote: string | null; reviewedAt: string | null;
}
export interface FundPage {
  items: FundRow[]; total: number; page: number; limit: number; pages: number;
  summary: { creditedPaise: number; pendingPaise: number; pendingCount: number };
}
export interface FundSubmit { amountPaise: number; mode: PaymentMode; reference: string; paidOn: string; note?: string }
export interface FundQuery { status?: FundStatus; page: number; limit: number }


// ───────── Purchase history ─────────
export type PurchaseFilter = 'all' | 'paid' | 'shipping' | 'delivered' | 'awaiting' | 'cancelled' | 'refunded';
export type PurchaseType = 'all' | 'joining' | 'repurchase';
export interface PurchaseItem { kind: 'JOINING' | 'REPURCHASE'; name: string; sku: string | null; imageUrl: string; quantity: number; unitPricePaise: number; linePaise: number }
export interface Purchase {
  id: string; orderNo: string; placedAt: string; paidAt: string | null; status: 'PLACED' | 'PAID' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  totalPaise: number; refundedPaise: number; paymentMethod: string | null; shop: { name: string; code: string } | null; items: PurchaseItem[];
  shipment: { status: ShipmentStatus; courier: string | null; trackingId: string | null; expectedDelivery: string | null; events: { status: ShipmentStatus; at: string; note: string | null }[]; address: Shipment['address'] };
}
export interface PurchaseQuery { page: number; limit: number; status: PurchaseFilter; type: PurchaseType }
export interface PurchasePage {
  items: Purchase[]; total: number; page: number; limit: number; pages: number;
  summary: { spentPaise: number; refundedPaise: number; orders: number; units: number; lastPurchaseAt: string | null };
}

// ───────── Public website ─────────
export interface PublicItem { id: string; name: string; description: string; pricePaise: number; imageUrl: string }
export interface PublicPlan { name: string; description: string; rank: number; discountPercent: number; investmentPaise: number; maxMembers: number }
export interface PublicCatalog { packages: PublicItem[]; products: PublicItem[]; cashback?: { percentPerDay: number; days: number; totalPercent: number; includesPackages: boolean } | null; plans?: PublicPlan[]; plan: { levels: { level: number; percent: number }[]; repurchaseLevels?: { level: number; percent: number }[] } | null }
export interface PublicPhoto { id: string; url: string; caption: string }
export interface ContactInput { name: string; email: string; phone?: string; subject?: string; message: string; website?: string }

// ───────── Help & support ─────────
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_USER' | 'RESOLVED' | 'CLOSED';
export type TicketCategory = 'ORDER' | 'PAYMENT' | 'TOPUP' | 'WITHDRAWAL' | 'KYC' | 'ACCOUNT' | 'COMMISSION' | 'STOCK' | 'RECHARGE' | 'OTHER';
export interface TicketRow { id: string; number: string; subject: string; category: TicketCategory; status: TicketStatus; updatedAt: string; createdAt: string; needsYourReply: boolean; last: { from: 'USER' | 'ADMIN'; text: string; at: string } | null }
export interface TicketPage { items: TicketRow[]; total: number; page: number; limit: number; pages: number; needsReply: number }
export interface TicketMessage { id: string; from: 'USER' | 'ADMIN'; author: string; body: string; at: string; attachments?: string[] }
export interface Ticket {
  id: string; number: string; subject: string; category: TicketCategory; priority: string; status: TicketStatus; orderRef: string | null; createdAt: string; updatedAt: string;
  resolvedAt: string | null; closedAt: string | null; assignedName: string | null; needsYourReply: boolean; canReopen: boolean; canRate: boolean; rating: { stars: number; comment: string } | null; messages: TicketMessage[];
}
export interface NewTicketInput { category: TicketCategory; subject: string; message: string; priority?: 'LOW' | 'NORMAL' | 'HIGH'; orderRef?: string; attachments?: string[] }

export interface PurchaseStatusData {
  windowDays: number;
  totals: { teamSize: number; buyers: number; active: number; orders: number; valuePaise: number; recentOrders: number; recentValuePaise: number };
  levels: { level: number; members: number; buyers: number; active: number; orders: number; valuePaise: number }[];
  recent: { id: string; at: string; status: string; valuePaise: number; kind: string; buyerName: string; buyerCode: string; level: number }[];
}
export interface RewardsData {
  rank: string; next: string | null; configured: boolean;
  ladder: { rank: string; current: boolean; held: boolean; requirement: { minTeamVolumePaise: number; minActiveDirects: number } | null; progress: { volumePct: number; directsPct: number; met: boolean } | null }[];
  stats: { teamVolumePaise: number; directs: number; activeDirects: number; windowDays: number };
}
