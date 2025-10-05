import { useState } from 'react';
import { useEvents } from '../../shared/contexts/EventContext';

export default function CalendarApp() {
  const events = useEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateSelect = async (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);

    // Emit event with selected date at noon UTC to avoid timezone issues
    const dateAtNoon = new Date(Date.UTC(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
      12, 0, 0
    ));

    await events.emit('calendar-date-selected', {
      date: dateAtNoon.toISOString(),
      timestamp: Date.now(),
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  return (
    <div className="min-h-screen bg-primary p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface rounded-lg shadow p-6 border border-primary">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePreviousMonth}
              className="px-4 py-2 text-secondary hover:text-primary hover:bg-surface-hover rounded transition-colors"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold text-primary">{monthName}</h2>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 text-secondary hover:text-primary hover:bg-surface-hover rounded transition-colors"
            >
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Weekday Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-secondary py-2"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Calendar days */}
            {days.map((day) => (
              <button
                key={day}
                onClick={() => handleDateSelect(day)}
                className={`
                  aspect-square flex items-center justify-center rounded-lg
                  transition-all
                  ${
                    isSelectedDate(day)
                      ? 'bg-accent text-white font-bold'
                      : isToday(day)
                      ? 'bg-accent/20 text-accent font-semibold'
                      : 'hover:bg-surface-hover text-primary'
                  }
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Selected Date Display */}
          {selectedDate && (
            <div className="mt-6 pt-6 border-t border-primary">
              <p className="text-sm text-secondary">Selected Date:</p>
              <p className="text-lg font-semibold text-primary">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
