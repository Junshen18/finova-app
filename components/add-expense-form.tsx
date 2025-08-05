"use client";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent } from "react";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { FaCamera, FaUpload } from "react-icons/fa";
import { useRef } from "react";
import { toast } from "sonner";
import { SelectionModal } from "./selection-modal";

interface AddExpenseFormProps {
  onCancel?: () => void;
}

export function AddExpenseForm({ onCancel }: AddExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    user_id: "",
    date: date.toISOString(),
    amount: "",
    category: "",
    category_id: "",
    account_id: "",
    account_name: "",
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
        fetchAccounts(user.id);
      }
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cameraModalOpen) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          alert("Could not access camera: " + err.message);
          setCameraModalOpen(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraModalOpen]);

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

  async function fetchAccounts(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("account_categories")
      .select("id, user_id, name, is_default")
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order("name", { ascending: true });
    if (!error && data) {
      setAccounts(data);
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

  const handleScanReceiptClick = () => {
    setCameraModalOpen(true);
  };

  const handleUploadReceiptClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setForm((prev) => ({ ...prev, img_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "receipt.png", { type: "image/png" });
            setFile(file);
            const dataUrl = canvas.toDataURL("image/png");
            setReceiptImage(dataUrl);
            setCameraModalOpen(false);
          }
        }, "image/png");
      }
    }
  };

  const uploadReceipt = async (
    file: File,
    userId: string
  ): Promise<string | null> => {
    const supabase = createClient();
    const filePath = `receipts/${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("expense-receipts")
      .upload(filePath, file);

    if (error) {
      console.error("Image upload failed:", error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("expense-receipts")
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  };

  const sortedCategories = [
    ...categories.filter((cat) => cat.name !== "Other"),
    ...categories.filter((cat) => cat.name === "Other"),
  ];

  const sortedAccounts = [
    ...accounts.filter((acc) => acc.name !== "Other"),
    ...accounts.filter((acc) => acc.name === "Other"),
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let imgPath = form.img_url;

      if (file) {
        const uploadedPath = await uploadReceipt(file, form.user_id);
        if (!uploadedPath) {
          toast.error("Failed to upload receipt.");
          return;
        }
        imgPath = uploadedPath;
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: form.category_id,
          img_url: imgPath,
          account_id: form.account_id ? parseInt(form.account_id) : undefined,
          group_id: form.group_id ? parseInt(form.group_id) : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Expense added successfully");
        setFile(null);
        // Reset form
        setForm({
          user_id: form.user_id,
          date: new Date().toISOString(),
          amount: "",
          category: "",
          category_id: "",
          account_id: "",
          account_name: "",
          description: "",
          img_url: "",
          is_split_bill: false,
          group_id: "",
        });
        setReceiptImage(null);
      } else {
        toast.error("Failed to save expense.");
        console.error(data);
      }
    } catch (err) {
      toast.error("Something went wrong.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="border-0 shadow-sm bg-form-bg">
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Receipt Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Receipt</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  type="button"
                  className="w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover"
                  onClick={handleScanReceiptClick}
                >
                  <FaCamera className="mr-2" /> Scan Receipt
                </Button>
                <Button
                  type="button"
                  className="w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover"
                  onClick={handleUploadReceiptClick}
                >
                  <FaUpload className="mr-2" /> Upload Receipt
                </Button>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>

            {/* Receipt Preview */}
            {receiptImage && (
              <div className="flex justify-center">
                <img
                  src={receiptImage}
                  alt="Receipt Preview"
                  className="max-w-full max-h-40 rounded-lg border border-form-border"
                />
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div className="md:col-span-2">
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
              <div className="md:col-span-2">
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
              <div className="md:col-span-1">
                <Button
                  type="button"
                  className="w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover"
                  onClick={() => setCategoryModalOpen(true)}
                >
                  {form.category || "Select Category"}
                </Button>
              </div>

              {/* Account */}
              <div className="md:col-span-1">
                <Button
                  type="button"
                  className="w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover"
                  onClick={() => setAccountModalOpen(true)}
                >
                  {form.account_name || "Select Account"}
                </Button>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <Input
                  type="text"
                  placeholder="Notes"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full bg-form-bg text-foreground border-form-border placeholder:text-muted-foreground"
                />
              </div>

              {/* Split Bill */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    name="is_split_bill"
                    type="checkbox"
                    checked={form.is_split_bill}
                    onChange={handleChange}
                    className="rounded bg-form-bg border-form-border"
                  />
                  <span className="text-sm font-medium text-foreground">Split Bill with Friends</span>
                </label>
              </div>

              {/* Group ID */}
              {form.is_split_bill && (
                <div className="md:col-span-2">
                  <Input
                    name="group_id"
                    type="number"
                    placeholder="Group ID"
                    value={form.group_id}
                    onChange={handleChange}
                    className="w-full bg-form-bg text-foreground border-form-border placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>

            {/* Submit and Cancel Buttons */}
            <div className="flex flex-col gap-2 pt-4 justify-center">
              
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90 font-semibold"
              >
                {loading ? "Adding..." : "Add Expense"}
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
      </Card>

      {/* Camera Modal */}
      <Dialog open={cameraModalOpen} onOpenChange={setCameraModalOpen}>
        <DialogContent className="flex flex-col items-center gap-4 max-w-sm bg-form-bg border-form-border">
          <DialogTitle className="text-foreground">Scan Receipt</DialogTitle>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-xs rounded-lg border border-form-border"
          />
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleCapture}
              className="flex-1 bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90"
            >
              Capture
            </Button>
            <Button
              variant="outline"
              onClick={() => setCameraModalOpen(false)}
              className="flex-1 bg-form-bg text-foreground border-form-border hover:bg-form-hover"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <SelectionModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        options={sortedCategories}
        selected={form.category_id}
        onSelect={(id: string) => {
          const selectedCategory = sortedCategories.find(
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
        options={sortedAccounts}
        selected={form.account_id}
        onSelect={(id: string) => {
          const selectedAccount = sortedAccounts.find(
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
    </div>
  );
}
