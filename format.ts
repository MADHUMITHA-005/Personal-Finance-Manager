export function formatCurrency(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency}${formatted}`;
}

export function formatMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-');
  return { year: parseInt(y), month: parseInt(m) - 1 };
}

export function monthLabel(key: string): string {
  const { year, month } = parseMonthKey(key);
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getMonthKeys(): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(formatMonthKey(d.getFullYear(), d.getMonth()));
  }
  return keys;
}

export function isCurrentMonth(key: string): boolean {
  const now = new Date();
  return key === formatMonthKey(now.getFullYear(), now.getMonth());
}
