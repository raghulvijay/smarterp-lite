export function linearRegression(values) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  values.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: yMean - slope * xMean };
}

export function buildForecastData(revenueData, monthsAhead = 3) {
  if (!revenueData || revenueData.length < 2) return revenueData ?? [];

  const values = revenueData.map((d) => d.revenue ?? 0);
  const { slope, intercept } = linearRegression(values);

  const historical = revenueData.map((d, i) => ({ ...d, forecast: null }));

  const lastDate = new Date();
  const forecasted = Array.from({ length: monthsAhead }, (_, k) => {
    const futureIdx = values.length + k;
    const revenue   = Math.max(0, Math.round(intercept + slope * futureIdx));
    const d = new Date(lastDate.getFullYear(), lastDate.getMonth() + k + 1, 1);
    const month = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    return { month, revenue: null, forecast: revenue, key: `forecast-${k}` };
  });

  return [...historical, ...forecasted];
}

export function getProjectedNextMonth(revenueData) {
  if (!revenueData || revenueData.length < 2) return null;
  const values = revenueData.map((d) => d.revenue ?? 0);
  const { slope, intercept } = linearRegression(values);
  return Math.max(0, Math.round(intercept + slope * values.length));
}
