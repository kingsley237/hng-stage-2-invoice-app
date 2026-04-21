import { Invoice, InvoiceItem } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function generateId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let id = '';
  for (let i = 0; i < 2; i++) {
    id += letters[Math.floor(Math.random() * letters.length)];
  }
  for (let i = 0; i < 4; i++) {
    id += digits[Math.floor(Math.random() * digits.length)];
  }
  return id;
}

export function calculatePaymentDue(createdAt: string, paymentTerms: number): string {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + paymentTerms);
  return date.toISOString().split('T')[0];
}

export function calculateItemTotal(item: InvoiceItem): number {
  return item.quantity * item.price;
}

export function calculateInvoiceTotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0);
}

export function loadFromStorage(key: string): Invoice[] | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveToStorage(key: string, data: Invoice[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.error('Failed to save to localStorage');
  }
}