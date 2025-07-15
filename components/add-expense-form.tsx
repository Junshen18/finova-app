"use client";
import { Button } from "./ui/button";
import { ChangeEvent } from "react";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "./ui/select";

export function AddExpenseForm() {
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [categories, setCategories] = useState<{ name: string }[]>([]);

  const [form, setForm] = useState({
    user_id: "",
    date: date.toISOString(),
    amount: "",
    category: "",
    account_id: "",
    description: "",
    img_url: "",
    is_split_bill: false,
    group_id: "",
  });

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setForm((prev) => ({ ...prev, user_id: user?.id || "" }));
      if (user?.id) {
        fetchCategories(user.id);
      }
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCategories(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("expense_categories")
      .select("id, name, icon, color, is_default")
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });
    if (!error && data) {
      setCategories(data);
    }
  }

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let checked = false;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      checked = e.target.checked;
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date"
                  className="w-full justify-between font-normal"
                >
                  {date ? date.toLocaleDateString() : "Select date"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
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
                />
              </PopoverContent>
            </Popover>
            <Input type="number" placeholder="Amount" />
            <Select
              onValueChange={(value) => setForm({ ...form, category: value })}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue
                  placeholder="Select a category"
                  className="bg-black"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input type="text" placeholder="Account" />
            <Input type="text" placeholder="Notes" />
            <Input type="text" placeholder="Image" />
            <label className="flex items-center gap-2">
              <input
                name="is_split_bill"
                type="checkbox"
                checked={form.is_split_bill}
                onChange={handleChange}
              />
              Split Bill
            </label>
            {form.is_split_bill && (
              <input
                name="group_id"
                type="number"
                placeholder="Group ID"
                value={form.group_id}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
