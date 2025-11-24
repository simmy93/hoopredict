import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
    value?: Date | string;
    onChange?: (date: Date | undefined) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined)
  const [time, setTime] = React.useState<string>("10:30:00")

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setOpen(false)

    if (selectedDate && time) {
      const [hours, minutes] = time.split(':')
      selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      onChange?.(selectedDate)
    } else {
      onChange?.(selectedDate)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)

    if (date && newTime) {
      const [hours, minutes] = newTime.split(':')
      const newDate = new Date(date)
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      onChange?.(newDate)
    }
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="date" className="px-1">
          Date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date"
              className="w-32 justify-between font-normal"
            >
              {date ? date.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="time" className="px-1">
          Time
        </Label>
        <Input
          type="time"
          id="time"
          step="1"
          value={time}
          onChange={handleTimeChange}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  )
}
