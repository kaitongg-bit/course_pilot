import { useState, useRef, useCallback } from 'react';
import { Clock } from 'lucide-react';

export interface DaySchedule {
    day: string;
    times: string[];
}

interface TimeSelectorProps {
    selectedSchedule: DaySchedule[];
    onChange: (schedule: DaySchedule[]) => void;
}

const DAYS = [
    { value: 'M', label: 'Mon' },
    { value: 'T', label: 'Tue' },
    { value: 'W', label: 'Wed' },
    { value: 'R', label: 'Thu' },
    { value: 'F', label: 'Fri' },
    { value: 'S', label: 'Sat' },
    { value: 'U', label: 'Sun' },
];

const TIMES = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM'
];

// Display only hourly labels
const HOUR_TIMES = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM'
];

export function TimeSelector({ selectedSchedule, onChange }: TimeSelectorProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');
    const gridRef = useRef<HTMLDivElement>(null);

    const isTimeSelected = (dayValue: string, time: string): boolean => {
        const daySchedule = selectedSchedule.find(s => s.day === dayValue);
        return daySchedule ? daySchedule.times.includes(time) : false;
    };

    const toggleTimeSlot = useCallback((dayValue: string, time: string, forceMode?: 'select' | 'deselect') => {
        const daySchedule = selectedSchedule.find(s => s.day === dayValue);
        const isCurrentlySelected = daySchedule?.times.includes(time) || false;

        const mode = forceMode || (isCurrentlySelected ? 'deselect' : 'select');

        if (mode === 'select' && !isCurrentlySelected) {
            if (!daySchedule) {
                onChange([...selectedSchedule, { day: dayValue, times: [time] }]);
            } else {
                onChange(
                    selectedSchedule.map(s =>
                        s.day === dayValue ? { ...s, times: [...s.times, time] } : s
                    )
                );
            }
        } else if (mode === 'deselect' && isCurrentlySelected) {
            if (daySchedule) {
                const newTimes = daySchedule.times.filter(t => t !== time);
                if (newTimes.length === 0) {
                    onChange(selectedSchedule.filter(s => s.day !== dayValue));
                } else {
                    onChange(
                        selectedSchedule.map(s =>
                            s.day === dayValue ? { ...s, times: newTimes } : s
                        )
                    );
                }
            }
        }
    }, [selectedSchedule, onChange]);

    const handleMouseDown = (dayValue: string, time: string) => {
        setIsDragging(true);
        const isCurrentlySelected = isTimeSelected(dayValue, time);
        const mode = isCurrentlySelected ? 'deselect' : 'select';
        setDragMode(mode);
        toggleTimeSlot(dayValue, time, mode);
    };

    const handleMouseEnter = (dayValue: string, time: string) => {
        if (isDragging) {
            toggleTimeSlot(dayValue, time, dragMode);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleClearAll = () => {
        onChange([]);
    };

    const handleSelectAll = () => {
        const fullSchedule = DAYS.map(day => ({
            day: day.value,
            times: [...TIMES]
        }));
        onChange(fullSchedule);
    };

    const getTotalSelectedSlots = (): number => {
        return selectedSchedule.reduce((sum, s) => sum + s.times.length, 0);
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#CC0033]" />
                    <span className="text-sm text-[#2E2E2E]">
                        Select your available times
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-[#CC0033] hover:underline"
                    >
                        Select All
                    </button>
                    {getTotalSelectedSlots() > 0 && (
                        <>
                            <span className="text-gray-300">|</span>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-xs text-[#CC0033] hover:underline"
                            >
                                Clear All
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Grid Container */}
            <div
                ref={gridRef}
                className="bg-white rounded-xl border border-[#E5E7EB] p-4 overflow-x-auto"
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div className="inline-block min-w-full">
                    {/* Day Headers */}
                    <div className="flex mb-2">
                        <div className="w-20 flex-shrink-0" /> {/* Spacer for time labels */}
                        {DAYS.map((day) => (
                            <div
                                key={day.value}
                                className="flex-1 text-center min-w-[40px] px-1"
                            >
                                <div className="text-xs text-[#2E2E2E]">{day.label}</div>
                                <div className="text-[10px] text-gray-500">{day.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Time Grid */}
                    <div className="space-y-0">
                        {TIMES.map((time, timeIndex) => {
                            const showLabel = HOUR_TIMES.includes(time);

                            return (
                                <div key={time} className="flex items-stretch">
                                    {/* Time Label */}
                                    <div className="w-20 flex-shrink-0 flex items-center justify-end pr-2">
                                        {showLabel && (
                                            <span className="text-[10px] text-[#2E2E2E]">
                                                {time}
                                            </span>
                                        )}
                                    </div>

                                    {/* Day Cells */}
                                    {DAYS.map((day) => {
                                        const isSelected = isTimeSelected(day.value, time);

                                        return (
                                            <div
                                                key={`${day.value}-${time}`}
                                                className="flex-1 min-w-[40px]"
                                            >
                                                <div
                                                    className={`
                            h-6 border border-[#E5E7EB] cursor-pointer transition-colors select-none
                            ${isSelected
                                                            ? 'bg-[#CC0033] hover:bg-[#AA0028]'
                                                            : 'bg-white hover:bg-[#FEF2F2]'
                                                        }
                            ${timeIndex === 0 ? 'rounded-t' : ''}
                            ${timeIndex === TIMES.length - 1 ? 'rounded-b' : ''}
                          `}
                                                    onMouseDown={() => handleMouseDown(day.value, time)}
                                                    onMouseEnter={() => handleMouseEnter(day.value, time)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Summary */}
            {getTotalSelectedSlots() > 0 && (
                <div className="text-xs text-center text-gray-500">
                    {getTotalSelectedSlots()} time slot{getTotalSelectedSlots() !== 1 ? 's' : ''} selected
                </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-center text-gray-400">
                Click and drag to select time slots
            </div>
        </div>
    );
}
