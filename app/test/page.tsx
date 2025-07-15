"use client";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Select, SelectLabel, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select";

function getTodayDateTimeLocal() {
  const now = new Date();
  now.setSeconds(0, 0); // Remove seconds and ms for input compatibility
  return now.toISOString().slice(0, 16);
}

export default function TestExpenseForm() {
  const [form, setForm] = useState({
    user_id: "",
    date: getTodayDateTimeLocal(),
    amount: "",
    category: "",
    account_id: "",
    description: "",
    img_url: "",
    is_split_bill: false,
    group_id: "",
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      setUserLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setForm((prev) => ({ ...prev, user_id: user?.id || "" }));
      setUserLoading(false);
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: form.amount ? parseFloat(form.amount) : undefined,
          account_id: form.account_id ? parseInt(form.account_id) : undefined,
          group_id: form.group_id ? parseInt(form.group_id) : undefined,
        }),
      });
      const data = await res.json();
      // setResult(data);
      toast.success("Expense added successfully");
    } catch (err) {
      // setResult({ error: "Request failed." });
      toast.error("Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Test Add Expense</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {/* User ID is auto-filled and hidden */}
        {userLoading ? (
          <div>Loading user...</div>
        ) : null}
        {/* Date defaults to today */}
        <input name="date" type="datetime-local" placeholder="Date" value={form.date} onChange={handleChange} required className="border p-2 rounded" />
        <input name="amount" type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={handleChange} required className="border p-2 rounded" />
        {/* Category dropdown */}
        <Select onValueChange={(value) => setForm({ ...form, category: value })}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a category" className=""/>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                        </SelectItem>
                    ))}
                {/* <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
                <SelectItem value="grapes">Grapes</SelectItem>
                <SelectItem value="pineapple">Pineapple</SelectItem> */}
                </SelectGroup>
            </SelectContent>
        </Select>
        {/* <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        >
          <option value="" disabled>
            Select Category
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.icon ? `${cat.icon} ` : ""}{cat.name}
            </option>
          ))}
        </select> */}
        <input name="account_id" type="number" placeholder="Account ID" value={form.account_id} onChange={handleChange} required className="border p-2 rounded" />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} className="border p-2 rounded" />
        <input name="img_url" placeholder="Image URL" value={form.img_url} onChange={handleChange} className="border p-2 rounded" />
        <label className="flex items-center gap-2">
          <input name="is_split_bill" type="checkbox" checked={form.is_split_bill} onChange={handleChange} />
          Is Split Bill
        </label>
        {/* Only show group_id if is_split_bill is true */}
        {form.is_split_bill && (
          <input name="group_id" type="number" placeholder="Group ID" value={form.group_id} onChange={handleChange} className="border p-2 rounded" />
        )}
        <button type="submit" disabled={loading || userLoading || !form.user_id} className="bg-violet-600 text-white p-2 rounded mt-2">
          {loading ? "Submitting..." : "Add Expense"}
        </button>
      </form>
      {result && (
        <pre className="mt-4 p-2 bg-gray-100 rounded text-sm overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
