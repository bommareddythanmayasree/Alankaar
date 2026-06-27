/**
 * Formats a number as Indian Rupee currency.
 * e.g. 4500 → "₹4,500"  |  125000 → "₹1,25,000"
 */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Compact formatter for chart axis labels.
 * e.g. 100000 → "₹1L"  |  50000 → "₹50k"
 */
export const formatCurrencyCompact = (value: number): string => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
  return `₹${value}`;
};
