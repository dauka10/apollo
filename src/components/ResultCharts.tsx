import { useState } from 'react';
import type { Question } from '../types';

type ChartType = 'bar' | 'pie' | 'doughnut' | 'column' | 'radial';

const CHART_COLORS = [
  '#ca641f', // accent
  '#5ba4cf', // research
  '#7c6fe0', // homework
  '#5bbd72', // success
  '#e07c6f', // else
  '#e0c56f', // yellow
  '#6fe0c5', // teal
  '#cf5ba4', // pink
];

interface ChartData {
  label: string;
  value: number;
  pct: number;
}

function getChartData(question: Question): ChartData[] {
  const otherCount = question.otherResponses.length;
  const total = question.options.reduce((s, o) => s + o.votes, 0) + otherCount;
  const items: ChartData[] = question.options.map((o) => ({
    label: o.text,
    value: o.votes,
    pct: total > 0 ? (o.votes / total) * 100 : 0,
  }));
  if (question.allowOther && otherCount > 0) {
    items.push({ label: 'Other', value: otherCount, pct: total > 0 ? (otherCount / total) * 100 : 0 });
  }
  return items;
}

function PieChart({ data }: { data: ChartData[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;
  let cumulative = 0;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="chart-empty">No votes yet</p>;

  const nonZero = data.filter((d) => d.value > 0);

  // Single slice = full circle
  if (nonZero.length === 1) {
    const idx = data.indexOf(nonZero[0]);
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="chart-svg">
        <circle cx={cx} cy={cy} r={r} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
        <text x={cx} y={cy} textAnchor="middle" dy="0.35em" fill="var(--text-primary)" fontSize="14" fontWeight="600">
          {nonZero[0].label}
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="chart-svg">
      {data.map((d, i) => {
        if (d.value === 0) return null;
        const fraction = d.value / total;
        const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        cumulative += fraction;
        const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        const largeArc = fraction > 0.5 ? 1 : 0;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        return <path key={i} d={path} fill={CHART_COLORS[i % CHART_COLORS.length]} />;
      })}
    </svg>
  );
}

function DoughnutChart({ data }: { data: ChartData[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 90;
  const innerR = 55;
  let cumulative = 0;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="chart-empty">No votes yet</p>;

  const nonZero = data.filter((d) => d.value > 0);

  if (nonZero.length === 1) {
    const idx = data.indexOf(nonZero[0]);
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="chart-svg">
        <circle cx={cx} cy={cy} r={outerR} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
        <circle cx={cx} cy={cy} r={innerR} fill="var(--bg-card)" />
        <text x={cx} y={cy} textAnchor="middle" dy="0.35em" fill="var(--text-primary)" fontSize="14" fontWeight="600">
          {total}
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="chart-svg">
      {data.map((d, i) => {
        if (d.value === 0) return null;
        const fraction = d.value / total;
        const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        cumulative += fraction;
        const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        const largeArc = fraction > 0.5 ? 1 : 0;

        const ox1 = cx + outerR * Math.cos(startAngle);
        const oy1 = cy + outerR * Math.sin(startAngle);
        const ox2 = cx + outerR * Math.cos(endAngle);
        const oy2 = cy + outerR * Math.sin(endAngle);
        const ix1 = cx + innerR * Math.cos(endAngle);
        const iy1 = cy + innerR * Math.sin(endAngle);
        const ix2 = cx + innerR * Math.cos(startAngle);
        const iy2 = cy + innerR * Math.sin(startAngle);

        const path = `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
        return <path key={i} d={path} fill={CHART_COLORS[i % CHART_COLORS.length]} />;
      })}
      <text x={cx} y={cy} textAnchor="middle" dy="0.35em" fill="var(--text-primary)" fontSize="16" fontWeight="600">
        {total}
      </text>
    </svg>
  );
}

function ColumnChart({ data }: { data: ChartData[] }) {
  const width = 300;
  const height = 180;
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barGap = 8;
  const barW = Math.min(40, (chartW - barGap * (data.length - 1)) / data.length);
  const totalBarsW = data.length * barW + (data.length - 1) * barGap;
  const offsetX = padding.left + (chartW - totalBarsW) / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
      {/* baseline */}
      <line x1={padding.left} y1={padding.top + chartH} x2={width - padding.right} y2={padding.top + chartH} stroke="var(--border)" strokeWidth="1" />
      {data.map((d, i) => {
        const barH = maxVal > 0 ? (d.value / maxVal) * (chartH - 10) : 0;
        const x = offsetX + i * (barW + barGap);
        const y = padding.top + chartH - barH;
        const truncated = d.label.length > 6 ? d.label.slice(0, 5) + '..' : d.label;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="600">
                {d.value}
              </text>
            )}
            <text x={x + barW / 2} y={padding.top + chartH + 14} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
              {truncated}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RadialBarChart({ data }: { data: ChartData[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 88;
  const ringWidth = 14;
  const gap = 4;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="chart-empty">No votes yet</p>;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="chart-svg">
      {data.map((d, i) => {
        const r = maxR - i * (ringWidth + gap);
        if (r <= 10) return null;
        const circumference = 2 * Math.PI * r;
        const fraction = d.value / maxVal;
        const filled = circumference * fraction;
        return (
          <g key={i}>
            {/* track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={ringWidth} opacity={0.3} />
            {/* filled arc */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={ringWidth}
              strokeDasharray={`${filled} ${circumference - filled}`}
              strokeDashoffset={circumference / 4}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

function ChartLegend({ data }: { data: ChartData[] }) {
  return (
    <div className="chart-legend">
      {data.map((d, i) => (
        <div key={i} className="chart-legend-item">
          <span className="chart-legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
          <span className="chart-legend-label">{d.label}</span>
          <span className="chart-legend-value">{d.value} ({Math.round(d.pct)}%)</span>
        </div>
      ))}
    </div>
  );
}

const CHART_LABELS: Record<ChartType, string> = {
  bar: 'Bar',
  pie: 'Pie',
  doughnut: 'Doughnut',
  column: 'Column',
  radial: 'Radial',
};

export function ResultCharts({ questions }: { questions: Question[] }) {
  const mcQuestions = questions.filter((q) => q.type === 'multiple_choice');
  if (mcQuestions.length === 0) return null;

  // Single shared chart type selector for all questions
  const [chartType, setChartType] = useState<ChartType>('bar');

  return (
    <div className="result-charts-section">
      <div className="result-charts-header">
        <h3>Visual Results</h3>
        <div className="chart-type-selector">
          {(Object.keys(CHART_LABELS) as ChartType[]).map((type) => (
            <button
              key={type}
              className={`chart-type-btn ${chartType === type ? 'active' : ''}`}
              onClick={() => setChartType(type)}
            >
              {CHART_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {mcQuestions.map((question, idx) => {
        const data = getChartData(question);
        const otherCount = question.otherResponses.length;
        const totalVotes = question.options.reduce((s, o) => s + o.votes, 0) + otherCount;

        return (
          <div key={question.id} className="result-chart-card">
            <span className="result-chart-question-num">Question {questions.indexOf(question) + 1}</span>
            <p className="result-chart-question-text">{question.text}</p>

            {chartType === 'bar' ? (
              <div className="result-bar-chart">
                {data.map((d, i) => {
                  const pct = totalVotes > 0 ? (d.value / totalVotes) * 100 : 0;
                  return (
                    <div key={i} className="result-bar-row">
                      <span className="result-bar-label">{d.label}</span>
                      <div className="result-bar-track">
                        <div
                          className="result-bar-fill"
                          style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                      </div>
                      <span className="result-bar-value">{Math.round(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="result-chart-visual">
                <div className="result-chart-graphic">
                  {chartType === 'pie' && <PieChart data={data} />}
                  {chartType === 'doughnut' && <DoughnutChart data={data} />}
                  {chartType === 'column' && <ColumnChart data={data} />}
                  {chartType === 'radial' && <RadialBarChart data={data} />}
                </div>
                <ChartLegend data={data} />
              </div>
            )}

            {idx < mcQuestions.length - 1 && <div className="result-chart-divider" />}
          </div>
        );
      })}
    </div>
  );
}
