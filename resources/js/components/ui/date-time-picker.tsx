import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
    value?: Date | string;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
}

export function DateTimePicker({ value, onChange, placeholder = 'Pick a date and time', className }: DateTimePickerProps) {
    const [date, setDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined);
    const [timeValue, setTimeValue] = React.useState<string>(
        value ? format(new Date(value), 'HH:mm') : '12:00'
    );

    // Get today's date at midnight for comparison
    const today = React.useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }, []);

    React.useEffect(() => {
        if (value) {
            const newDate = new Date(value);
            setDate(newDate);
            setTimeValue(format(newDate, 'HH:mm'));
        }
    }, [value]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            setDate(undefined);
            onChange?.(undefined);
            return;
        }

        // Preserve the time when selecting a new date
        const [hours, minutes] = timeValue.split(':').map(Number);
        selectedDate.setHours(hours, minutes);
        setDate(selectedDate);
        onChange?.(selectedDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setTimeValue(newTime);

        if (!date) return;

        const [hours, minutes] = newTime.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes);
        setDate(newDate);
        onChange?.(newDate);
    };

    return (
        <div className={cn('flex gap-2', className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={'outline'}
                        className={cn('flex-1 justify-start text-left font-normal', !date && 'text-muted-foreground')}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>{placeholder}</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        disabled={(date) => date < today}
                        defaultMonth={date || new Date()}
                    />
                </PopoverContent>
            </Popover>
            <div className="relative w-[130px]">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    type="time"
                    value={timeValue}
                    onChange={handleTimeChange}
                    className="pl-9"
                />
            </div>
        </div>
    );
}
