export function formatAmount(amount, currency) {
  const value = Number(amount);
  const formatted = (Number.isFinite(value) ? value : 0).toFixed(2);
  if (currency === "KSH") return `KSh ${formatted}`;
  return `$${formatted}`;
}
