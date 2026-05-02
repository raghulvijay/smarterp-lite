import { memo } from "react";
import { LineChart, Line } from "recharts";

const ICON_COLORS = {
  indigo: { bg: "rgba(79,70,229,0.12)",  color: "#4f46e5" },
  green:  { bg: "rgba(22,163,74,0.12)",  color: "#16a34a" },
  amber:  { bg: "rgba(217,119,6,0.12)",  color: "#d97706" },
  blue:   { bg: "rgba(37,99,235,0.12)",  color: "#2563eb" },
  red:    { bg: "rgba(220,38,38,0.12)",  color: "#dc2626" },
  violet: { bg: "rgba(124,58,237,0.12)", color: "#7c3aed" },
};

const SummaryCard = memo(function SummaryCard({
  icon, label, value, trend, trendUp,
  color = "indigo", animDelay = 0,
  sparkline, sparklinePct,
}) {
  const { bg, color: iconColor } = ICON_COLORS[color] || ICON_COLORS.indigo;

  const sparkData = (sparkline || []).map((v) => ({ v }));
  const hasSparkline = sparkline && sparkline.length > 1;
  const sparkUp  = hasSparkline && sparkline[sparkline.length - 1] >= sparkline[0];
  const sparkColor = sparkUp ? "#16a34a" : "#ef4444";

  return (
    <div className="summary-card" style={{ animationDelay: `${animDelay}ms` }}>
      <div className="summary-card-icon" style={{ background: bg }}>
        <i className={`bi ${icon}`} style={{ color: iconColor }} />
      </div>
      <div className="summary-card-body">
        <div className="summary-card-label">{label}</div>

        <div className="d-flex align-items-baseline gap-2 flex-wrap">
          <div className="summary-card-value">{value}</div>
          {sparklinePct !== undefined && (
            <span style={{
              fontSize: "0.75rem", fontWeight: 700,
              color: sparklinePct >= 0 ? "#16a34a" : "#ef4444",
            }}>
              {sparklinePct >= 0 ? "▲" : "▼"} {Math.abs(sparklinePct)}%
            </span>
          )}
        </div>

        {hasSparkline ? (
          <div style={{ marginTop: 6, lineHeight: 0 }}>
            <LineChart width={72} height={22} data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </div>
        ) : trend ? (
          <div className="summary-card-trend" style={{ color: trendUp ? "#16a34a" : "#dc2626" }}>
            <i className={`bi bi-arrow-${trendUp ? "up" : "down"}-right`} />
            {trend}
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default SummaryCard;
