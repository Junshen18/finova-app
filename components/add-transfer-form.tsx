"use client";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { SelectionModal } from "./selection-modal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
    user_id: "",
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

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      setForm(prev => ({ ...prev, user_id: userId || "" }));
      await fetchAccounts(userId || undefined);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAccounts(userId?: string) {
    const supabase = createClient();
    let query = supabase
      .from("account_categories")
      .select("id, user_id, name, is_default");

    if (userId) {
      query = query.or(`user_id.eq.${userId},is_default.eq.true`);
    } else {
      query = query.eq("is_default", true);
    }

    query = query.order("name", { ascending: true });

    const { data } = await query;
    if (data) setAccounts(data as any);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      if (!form.user_id || !form.amount || !form.date || !form.from_account_id || !form.to_account_id) {
        toast.error("Please fill date, amount, from and to accounts");
        return;
      }

      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: form.user_id,
          date: form.date,
          amount: parseFloat(form.amount),
          from_account_id: parseInt(form.from_account_id),
          to_account_id: parseInt(form.to_account_id),
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add transfer");

      toast.success("Transfer added successfully");
      setForm(prev => ({
        ...prev,
        date: new Date().toISOString(),
        amount: "",
        from_account_id: "",
        from_account_name: "",
        to_account_id: "",
        to_account_name: "",
        description: "",
      }));
      onCancel?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add transfer");
    }
  }

  return (
    <Card className="border-0 shadow-sm bg-form-bg">
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
        </form>
      </CardContent>

      {/* From Account Modal */}
      <SelectionModal
        open={fromAccountModalOpen}
        onOpenChange={setFromAccountModalOpen}
        options={accounts}
        selected={form.from_account_id}
        onSelect={(id: string) => {
          const selected = accounts.find(acc => acc.id === id);
          setForm(prev => ({
            ...prev,
            from_account_id: id,
            from_account_name: selected?.name || "",
          }));
        }}
        title="Select From Account"
      />

      {/* To Account Modal */}
      <SelectionModal
        open={toAccountModalOpen}
        onOpenChange={setToAccountModalOpen}
        options={accounts}
        selected={form.to_account_id}
        onSelect={(id: string) => {
          const selected = accounts.find(acc => acc.id === id);
          setForm(prev => ({
            ...prev,
            to_account_id: id,
            to_account_name: selected?.name || "",
          }));
        }}
        title="Select To Account"
      />
    </Card>
  );
}
