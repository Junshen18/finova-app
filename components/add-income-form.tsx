"use client";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Input } from "./ui/input";
import { SelectionModal } from "./selection-modal";

interface AddIncomeFormProps {
  onCancel?: () => void;
}

export function AddIncomeForm({ onCancel }: AddIncomeFormProps) {
    const [date, setDate] = useState<Date>(new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
    const [accountModalOpen, setAccountModalOpen] = useState(false);

    const [form, setForm] = useState({
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
                            className="bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90 font-semibold"
                        >
                            Add Income
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