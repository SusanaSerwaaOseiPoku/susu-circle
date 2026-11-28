export function calculateContributionTotal(contributions) {
  if (!Array.isArray(contributions) || contributions.length === 0) {
    return 0;
  }

  let totalCents = 0;
  for (const entry of contributions) {
    const amount =
      typeof entry === "number" ? entry : Number(entry?.amount);
    if (Number.isFinite(amount) && amount > 0) {
      totalCents += Math.round(amount * 100);
    }
  }

  return totalCents / 100;
}
