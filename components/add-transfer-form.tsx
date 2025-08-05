"use client";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Input } from "./ui/input";
import { SelectionModal } from "./selection-modal";

interface AddTransferFormProps {
  onCancel?: () => void;
}

export function AddTransferForm({ onCancel }: AddTransferFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [fromAccountModalOpen, setFromAccountModalOpen] = useState(false);
  const [toAccountModalOpen, setToAccountModalOpen] = useState(false);

  const [form, setForm] = useState({
    date: date.toISOString(),
    amount: "",
    from_account_id: "",
    from_account_name: "",
    to_account_id: "",
    to_account_name: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Card className="border-0 shadow-sm bg-form-bg">
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          {/* Date */}
          <div>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date"
                  className="w-full justify-between font-normal bg-form-bg text-foreground border-form-border hover:bg-form-hover"
                >
                  {date ? date.toLocaleDateString() : "Select date"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0 bg-form-bg border-form-border"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    if (date) {
                      setDate(date);
                    }
                    setCalendarOpen(false);
                  }}
                  className="bg-form-bg text-foreground"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount */}
          <div>
            <Input
              type="number"
              placeholder="Amount"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full bg-form-bg text-foreground border-form-border placeholder:text-muted-foreground"
            />
          </div>

          {/* From Account */}
          <div>
            <Button
              type="button"
              className="w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover"
              onClick={() => setFromAccountModalOpen(true)}
            >
              {form.from_account_name || "From Account"}
            </Button>
          </div>

          {/* To Account */}
          <div>
            <Button
              type="button"
              className="w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover"
              onClick={() => setToAccountModalOpen(true)}
            >
              {form.to_account_name || "To Account"}
            </Button>
          </div>

          {/* Notes */}
          <div>
            <Input
              type="text"
              placeholder="Notes"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full bg-form-bg text-foreground border-form-border placeholder:text-muted-foreground"
            />
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="flex flex-col gap-2 pt-4 justify-center">
            <Button
              type="submit"
              className="bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90 font-semibold"
            >
              Add Transfer
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="bg-muted text-muted-foreground border-border hover:bg-accent"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
