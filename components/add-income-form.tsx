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

interface AddIncomeFormProps {
  onCancel?: () => void;
}

export function AddIncomeForm({ onCancel }: AddIncomeFormProps) {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>(new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
    const [accountModalOpen, setAccountModalOpen] = useState(false);

    const [form, setForm] = useState({
        user_id: "",
        date: date.toISOString(),
        amount: "",
        category: "",
        category_id: "",
        account_id: "",
        account_name: "",
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
            await Promise.all([
                fetchIncomeCategories(userId || undefined),
                fetchAccounts(userId || undefined),
            ]);
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchIncomeCategories(userId?: string) {
        const supabase = createClient();
        let query = supabase
            .from("income_categories")
            .select("id, name, is_default");

        if (userId) {
            query = query.or(`user_id.eq.${userId},is_default.eq.true`);
        } else {
            query = query.eq("is_default", true);
        }

        query = query.order("is_default", { ascending: false }).order("name", { ascending: true });

        const { data } = await query;
        if (data) setCategories(data as any);
    }

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
        if (loading) return;
        setLoading(true);
        try {
            if (!form.user_id || !form.amount || !form.date || !form.category_id) {
                toast.error("Please fill in date, amount and category");
                return;
            }
            const res = await fetch("/api/income", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: form.user_id,
                    date: form.date,
                    amount: parseFloat(form.amount),
                    category_id: form.category_id,
                    account_id: form.account_id ? parseInt(form.account_id) : undefined,
                    description: form.description,
                    client_request_id: Date.now(),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to add income");
            toast.success("Income added successfully");
            setForm(prev => ({
                ...prev,
                date: new Date().toISOString(),
                amount: "",
                category: "",
                category_id: "",
                account_id: "",
                account_name: "",
                description: "",
            }));
            onCancel?.();
        } catch (err: any) {
            toast.error(err?.message || "Failed to add income");
        } finally {
            setLoading(false);
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

                    {/* Category */}
                    <div>
                        <Button
                            type="button"
                            className="w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover"
                            onClick={() => setCategoryModalOpen(true)}
                        >
                            {form.category || "Select Category"}
                        </Button>
                    </div>

                    {/* Account */}
                    <div>
                        <Button
                            type="button"
                            className="w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover"
                            onClick={() => setAccountModalOpen(true)}
                        >
                            {form.account_name || "Select Account"}
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
                            disabled={loading}
                            className="bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90 font-semibold"
                        >
                            {loading ? "Adding..." : "Add Income"}
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

            {/* Category Modal */}
            <SelectionModal
                open={categoryModalOpen}
                onOpenChange={setCategoryModalOpen}
                options={categories}
                selected={form.category_id}
                onSelect={(id: string) => {
                    const selectedCategory = categories.find(
                        (cat) => cat.id === id
                    );
                    setForm({
                        ...form,
                        category: selectedCategory?.name || "",
                        category_id: id,
                    });
                }}
                title="Select a Category"
            />

            {/* Account Modal */}
            <SelectionModal
                open={accountModalOpen}
                onOpenChange={setAccountModalOpen}
                options={accounts}
                selected={form.account_id}
                onSelect={(id: string) => {
                    const selectedAccount = accounts.find(
                        (acc) => acc.id === id
                    );
                    setForm({
                        ...form,
                        account_name: selectedAccount?.name || "",
                        account_id: id,
                    });
                }}
                title="Select an Account"
            />
        </Card>
    );
}