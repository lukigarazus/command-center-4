import { useMemo } from 'react';

interface HeatmapProps {
  data: { date: string }[]; // Array of objects with date strings
  startDate?: Date;
  endDate?: Date;
}

export const Heatmap = ({ data, startDate, endDate }: HeatmapProps) => {
  const { cells, counts } = useMemo(() => {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());

    // Create a map of date string to count
    const dateCountMap = new Map<string, number>();

    data.forEach((item) => {
      const dateStr = item.date.split('T')[0]; // Get YYYY-MM-DD part
      dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
    });

    // Get max count for color intensity
    const maxCount = Math.max(...Array.from(dateCountMap.values()), 1);

    // Generate cells for each day in the range
    const cells: { date: Date; count: number; intensity: number }[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = dateCountMap.get(dateStr) || 0;
      const intensity = count > 0 ? count / maxCount : 0;

      cells.push({
        date: new Date(currentDate),
        count,
        intensity,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { cells, counts: dateCountMap };
  }, [data, startDate, endDate]);

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'rgb(var(--color-bg-surface))';

    // Use accent color with varying opacity
    const alpha = 0.2 + (intensity * 0.8); // Range from 0.2 to 1.0
    return `rgba(var(--color-accent), ${alpha})`;
  };

  // Group cells by week
  const weeks: typeof cells[][] = [];
  let currentWeek: typeof cells = [];

  cells.forEach((cell, index) => {
    const dayOfWeek = cell.date.getDay();

    if (index === 0 && dayOfWeek !== 0) {
      // Fill empty days at the start of the first week
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: new Date(0), count: 0, intensity: -1 });
      }
    }

    currentWeek.push(cell);

    if (dayOfWeek === 6 || index === cells.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((cell, dayIndex) => {
              if (cell.intensity === -1) {
                // Empty cell for alignment
                return <div key={dayIndex} className="w-3 h-3" />;
              }

              return (
                <div
                  key={dayIndex}
                  className="w-3 h-3 rounded-sm border border-primary/20"
                  style={{ backgroundColor: getIntensityColor(cell.intensity) }}
                  title={`${cell.date.toLocaleDateString()}: ${cell.count} meeting${cell.count !== 1 ? 's' : ''}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
