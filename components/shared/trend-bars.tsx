export function TrendBars({ trend }: { trend: number[] }) {
  const maxValue = Math.max(...trend);
  return (
    <div className="flex h-8 items-end gap-0.5">
      {trend.map((value, idx) => {
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div key={idx} className="w-1 bg-indigo-600 rounded-t" style={{ height: `${height}%` }} />
        );
      })}
    </div>
  );
}
