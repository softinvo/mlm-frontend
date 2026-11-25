import { TicketCategory, TicketStatus } from './types';

export const CATEGORIES: { key: TicketCategory; label: string; hint: string }[] = [
  { key: 'ORDER', label: 'An order or delivery', hint: 'Late, missing or wrong items' },
  { key: 'PAYMENT', label: 'A payment or wallet payment request', hint: 'Charged wrongly or a request you did not expect' },
  { key: 'TOPUP', label: 'A top-up / fund request', hint: 'Money you sent that has not been credited' },
  { key: 'WITHDRAWAL', label: 'A withdrawal', hint: 'Pending, rejected or not received' },
  { key: 'KYC', label: 'Bank details (KYC)', hint: 'Verification stuck or rejected' },
  { key: 'COMMISSION', label: 'Income or commission', hint: 'Something missing from your earnings' },
  { key: 'ACCOUNT', label: 'My account or login', hint: 'Profile, password or access' },
  { key: 'OTHER', label: 'Something else', hint: '' },
];
export const categoryLabel = (c: string) => CATEGORIES.find((x) => x.key === c)?.label ?? c;

export const STATUS_LABEL: Record<TicketStatus, string> = { OPEN: 'Open', IN_PROGRESS: 'In progress', WAITING_ON_USER: 'Waiting for your reply', RESOLVED: 'Solved', CLOSED: 'Closed' };
export const STATUS_BADGE: Record<TicketStatus, string> = { OPEN: 'pending', IN_PROGRESS: '', WAITING_ON_USER: 'pending', RESOLVED: 'delivered', CLOSED: 'cancelled' };
