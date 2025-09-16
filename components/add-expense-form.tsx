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
import Tesseract from "tesseract.js";
import * as chrono from "chrono-node";

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
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [ocrSuggestion, setOcrSuggestion] = useState<{
    merchantName: string;
    totalAmount: string;
    transactionDate: Date | null;
    fullText: string;
    averageConfidence: number | null;
  } | null>(null);

  const toIsoAtNoon = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(12, 0, 0, 0);
    return copy.toISOString();
  };

  const [form, setForm] = useState({
    user_id: "",
    date: toIsoAtNoon(date),
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

  // split bill: groups and members
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedGroupName, setSelectedGroupName] = useState<string>("");
  const [groupMembers, setGroupMembers] = useState<{ user_id: string; display_name: string }[]>([]);

  // split method state
  const [splitMethod, setSplitMethod] = useState<"equal" | "percentage" | "custom">("equal");
  const [memberSplits, setMemberSplits] = useState<Record<string, number>>({});

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

  // keep form.date in sync with calendar selection (use noon to avoid timezone shift)
  useEffect(() => {
    setForm(prev => ({ ...prev, date: toIsoAtNoon(date) }));
  }, [date]);

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

  async function fetchGroups(userId: string) {
    const supabase = createClient();
    // get groups the user is a member of
    const { data: memRows } = await supabase
      .from("split_group_member")
      .select("group_id")
      .eq("user_id", userId);
    const groupIds = Array.from(new Set((memRows || []).map((r: any) => r.group_id)));
    if (groupIds.length === 0) {
      setGroups([]);
      return;
    }
    const { data: groupRows } = await supabase
      .from("split_groups")
      .select("id, name")
      .in("id", groupIds);
    setGroups((groupRows || []).map((g: any) => ({ id: String(g.id), name: g.name })));
  }

  async function fetchGroupMembers(groupId: number) {
    const supabase = createClient();
    const { data: memRows } = await supabase
      .from("split_group_member")
      .select("user_id")
      .eq("group_id", groupId);
    const memberIds: string[] = (memRows || []).map((r: any) => r.user_id);
    if (memberIds.length === 0) {
      setGroupMembers([]);
      return;
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", memberIds);
    const map: Record<string, string> = Object.fromEntries(
      (profiles || []).map((p: any) => [p.user_id, p.display_name || "Member"])
    );
    setGroupMembers(memberIds.map((id) => ({ user_id: id, display_name: map[id] || "Member" })));
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

  // Load groups when split bill toggled on; clear split state when off
  useEffect(() => {
    (async () => {
      if (form.is_split_bill && form.user_id) {
        if (groups.length === 0) {
          await fetchGroups(form.user_id);
        }
      } else {
        setSelectedGroupId("");
        setSelectedGroupName("");
        setGroupMembers([]);
        setSplitMethod("equal");
        setMemberSplits({});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.is_split_bill, form.user_id]);

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
        // Keep preview only; actual upload happens on submit via Supabase storage
        setFile(file);
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

  async function runOcrOnImage(dataUrl: string): Promise<{
    text: string;
    averageConfidence: number | null;
  }> {
    try {
      const result = await Tesseract.recognize(dataUrl, "eng", {
        logger: () => {},
      });
      const averageConfidence = (result as any)?.data?.confidence ?? null;
      return { text: (result as any).data?.text || "", averageConfidence };
    } catch (e) {
      return { text: "", averageConfidence: null };
    }
  }

  

  async function parseOcrText(text: string): Promise<{
    merchant?: string;
    amount?: number | null;
    date?: string;
    notes?: string;
  } | null> {
    try {
      const res = await fetch("/api/ocr/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Parse OCR failed", err);
        return null;
      }
      const data = await res.json();
      return data?.expense || null;
    } catch (e) {
      console.error("Parse OCR error", e);
      return null;
    }
  }

  function extractTotalAmountFromText(text: string): string {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const currencyAmountRegex = /(?:RM|MYR|SGD|S\$|USD|\$|€|£)?\s*([0-9]+(?:[.,][0-9]{2})?)/i;
    const totalKeywords = ["total", "amount", "balance due", "grand total", "subtotal"];

    let candidateAmounts: number[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();
      const hasKeyword = totalKeywords.some((kw) => lower.includes(kw));
      const matches = Array.from(line.matchAll(currencyAmountRegex));
      for (const m of matches) {
        const raw = m[1];
        if (!raw) continue;
        const normalized = raw.replace(/,/g, ".");
        const value = parseFloat(normalized);
        if (!Number.isNaN(value)) {
          // Give a small boost if near keyword
          candidateAmounts.push(hasKeyword ? value + 0.0001 : value);
        }
      }
    }

    if (candidateAmounts.length === 0) return "";

    const best = Math.max(...candidateAmounts);
    const bestStr = (Math.round((best % 1) * 100) === 0
      ? Math.floor(best).toString()
      : best.toFixed(2));
    return bestStr;
  }

  function extractMerchantNameFromText(text: string): string {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const ignorePatterns = /(receipt|invoice|tax|gst|vat|total|amount|cashier|change|tel|phone|order|table|item)/i;

    for (const line of lines) {
      const letters = line.replace(/[^A-Za-z]/g, "");
      if (letters.length >= 3 && !ignorePatterns.test(line)) {
        return line;
      }
    }
    return lines[0] || "";
  }

  function extractDateFromText(text: string): Date | null {
    const d = chrono.parseDate(text);
    if (d) return d;
    // Fallback regexes for common formats
    const dateRegexes = [
      /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/,
      /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/,
    ];
    for (const rx of dateRegexes) {
      const m = text.match(rx);
      if (m) {
        const parts = m.slice(1).map((p) => parseInt(p, 10));
        if (rx === dateRegexes[0]) {
          const [dd, mm, yyyy] = parts;
          const year = yyyy < 100 ? 2000 + yyyy : yyyy;
          return new Date(year, (mm || 1) - 1, dd || 1);
        } else {
          const [yyyy, mm, dd] = parts;
          return new Date(yyyy, (mm || 1) - 1, dd || 1);
        }
      }
    }
    return null;
  }

  const handleExtractFromReceipt = async () => {
    if (!receiptImage) {
      toast.error("Please upload or capture a receipt image first.");
      return;
    }
    try {
      setOcrLoading(true);
      let { text, averageConfidence } = await runOcrOnImage(receiptImage);

      

      if (!text || text.trim().length === 0) {
        throw new Error("OCR returned no text");
      }

      // Try Gemini parse first
      let parsed = await parseOcrText(text);

      let merchantName = parsed?.merchant || extractMerchantNameFromText(text);
      let totalAmount = "";
      if (parsed?.amount != null && !Number.isNaN(parsed.amount)) {
        const n = Number(parsed.amount);
        totalAmount = (Math.round(n * 100) % 100 === 0) ? String(Math.round(n)) : n.toFixed(2);
      } else {
        totalAmount = extractTotalAmountFromText(text);
      }

      let transactionDate: Date | null = null;
      if (parsed?.date && typeof parsed.date === "string") {
        const d = new Date(parsed.date);
        if (!Number.isNaN(d.getTime())) transactionDate = d;
      }
      if (!transactionDate) {
        transactionDate = extractDateFromText(text);
      }

      setOcrSuggestion({
        merchantName,
        totalAmount,
        transactionDate,
        fullText: text,
        averageConfidence,
      });
      setOcrDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to extract details. Try a clearer photo or different receipt.");
    } finally {
      setOcrLoading(false);
    }
  };

  const applyOcrSuggestionToForm = () => {
    if (!ocrSuggestion) return;
    if (ocrSuggestion.transactionDate) {
      setDate(ocrSuggestion.transactionDate);
    }
    setForm((prev) => ({
      ...prev,
      amount: ocrSuggestion.totalAmount || prev.amount,
      description: prev.description || ocrSuggestion.merchantName,
    }));
    setOcrDialogOpen(false);
    toast.success("OCR suggestions applied.");
  };

  const uploadReceipt = async (
    file: File,
    userId: string
  ): Promise<string | null> => {
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const filePath = `receipts/${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("expense-receipts")
        .upload(filePath, file, { upsert: false, cacheControl: "3600", contentType: file.type });
      if (error) {
        console.error("Image upload failed:", error.message);
        return null;
      }
      const { data: publicUrlData } = supabase.storage
        .from("expense-receipts")
        .getPublicUrl(filePath);
      return publicUrlData?.publicUrl || null;
    } catch (e: any) {
      console.error("Image upload failed:", e?.message || e);
      return null;
    }
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
    if (loading) return;
    setLoading(true);
    setResult(null);

    try {
      let imgPath = form.img_url;

      if (file) {
        const uploadedPath = await uploadReceipt(file, form.user_id);
        if (!uploadedPath) {
          toast.error("Failed to upload receipt.");
          setLoading(false);
          return;
        }
        imgPath = uploadedPath;
      } else if (receiptImage && !imgPath) {
        // If preview exists but no File (rare), block to ensure only URL is stored
        toast.error("Please reselect the receipt image to upload.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: form.category_id,
          img_url: imgPath || undefined,
          account_id: form.account_id ? parseInt(form.account_id) : undefined,
          group_id: form.group_id ? parseInt(form.group_id) : undefined,
          client_request_id: Date.now(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // If split bill, create expense_splits mirroring group add bill flow
        if (form.is_split_bill && selectedGroupId && groupMembers.length > 0) {
          try {
            const expenseId = data?.data?.id;
            const totalAmount = parseFloat(form.amount || "0");
            if (expenseId && totalAmount > 0) {
              const memberIds = groupMembers.map((m) => m.user_id);
              let rows: { user_id: string; amount: number }[] = [];
              if (splitMethod === "equal") {
                const base = Math.floor((totalAmount / memberIds.length) * 100) / 100;
                rows = memberIds.map((id) => ({ user_id: id, amount: base }));
                const sum = rows.reduce((a, r) => a + r.amount, 0);
                rows[rows.length - 1].amount = Math.round((rows[rows.length - 1].amount + (totalAmount - sum)) * 100) / 100;
              } else if (splitMethod === "percentage") {
                rows = memberIds.map((id) => {
                  const pct = Number(memberSplits[id] || 0);
                  return { user_id: id, amount: Math.round((totalAmount * (pct / 100)) * 100) / 100 };
                });
                const sum = rows.reduce((a, r) => a + r.amount, 0);
                rows[rows.length - 1].amount = Math.round((rows[rows.length - 1].amount + (totalAmount - sum)) * 100) / 100;
              } else {
                rows = memberIds.map((id) => ({ user_id: id, amount: Math.round(Number(memberSplits[id] || 0) * 100) / 100 }));
                const total = Math.round(rows.reduce((a, r) => a + r.amount, 0) * 100) / 100;
                if (Math.abs(total - totalAmount) > 0.01) {
                  throw new Error("Splits must sum to total amount");
                }
              }
              const supabase = createClient();
              const splitRows = rows.map((r) => ({ expense_id: expenseId, user_id: r.user_id, amount: r.amount }));
              const { error: splitErr } = await supabase.from("expense_splits").insert(splitRows);
              if (splitErr) throw splitErr;
            }
          } catch (err) {
            console.error(err);
            toast.error("Failed to create splits");
          }
        }
        onCancel?.();
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
        setSelectedGroupId("");
        setSelectedGroupName("");
        setGroupMembers([]);
        setSplitMethod("equal");
        setMemberSplits({});
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
              {/* <h3 className="text-sm font-medium text-foreground">Receipt</h3> */}
              <div className="grid grid-cols-2 gap-3">
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

            {/* OCR Actions */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleExtractFromReceipt}
                disabled={!receiptImage || ocrLoading}
                className="bg-form-bg text-foreground border-form-border border hover:bg-form-hover"
              >
                {ocrLoading ? "Extracting..." : "Extract details from receipt"}
              </Button>
            </div>

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

              {/* Split bill details */}
              {form.is_split_bill && (
                <div className="md:col-span-2 space-y-3">
                  {/* Group selection */}
                  <Button
                    type="button"
                    className="w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover"
                    onClick={() => setGroupModalOpen(true)}
                  >
                    {selectedGroupName || "Select Group"}
                  </Button>
                  {/* Split method */}
                  {selectedGroupId && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {(["equal","percentage","custom"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSplitMethod(m)}
                            className={`px-3 py-2 rounded-md border ${splitMethod===m?"bg-white/10 border-white/30":"border-white/10 hover:bg-white/5"}`}
                          >
                            {m.charAt(0).toUpperCase()+m.slice(1)}
                          </button>
                        ))}
                      </div>
                      {/* Member inputs */}
                      {splitMethod !== "equal" && (
                        <div className="space-y-2">
                          {groupMembers.map((m) => (
                            <div key={m.user_id} className="flex items-center justify-between gap-3">
                              <span className="text-sm">{m.display_name}</span>
                              {splitMethod === "percentage" ? (
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.01"
                                  value={memberSplits[m.user_id] ?? 0}
                                  onChange={(e) => setMemberSplits((p) => ({ ...p, [m.user_id]: Number(e.target.value) }))}
                                  className="w-28 bg-form-bg text-foreground border-form-border"
                                  placeholder="%"
                                />
                              ) : (
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={memberSplits[m.user_id] ?? 0}
                                  onChange={(e) => setMemberSplits((p) => ({ ...p, [m.user_id]: Number(e.target.value) }))}
                                  className="w-28 bg-form-bg text-foreground border-form-border"
                                  placeholder="$"
                                />
                              )}
                            </div>
                          ))}
                          {splitMethod === "percentage" && (
                            <p className="text-xs text-muted-foreground">Ensure total equals 100%.</p>
                          )}
                        </div>
                      )}
                      {/* Summary */}
                      <div className="rounded-md bg-white/5 border border-white/10 p-3 text-sm">
                        <p className="font-medium mb-2">Split summary</p>
                        <ul className="space-y-1">
                          {(() => {
                            const amt = parseFloat(form.amount || "0");
                            const ids = groupMembers.map((m) => m.user_id);
                            const calc = () => {
                              if (!amt || ids.length === 0) return [] as { id: string; amount: number }[];
                              if (splitMethod === "equal") {
                                const base = Math.floor((amt / ids.length) * 100) / 100;
                                const rows = ids.map((id) => ({ id, amount: base }));
                                const sum = rows.reduce((a, r) => a + r.amount, 0);
                                rows[rows.length - 1].amount = Math.round((rows[rows.length - 1].amount + (amt - sum)) * 100) / 100;
                                return rows;
                              }
                              if (splitMethod === "percentage") {
                                const rows = ids.map((id) => {
                                  const pct = Number(memberSplits[id] || 0);
                                  return { id, amount: Math.round((amt * (pct / 100)) * 100) / 100 };
                                });
                                const sum = rows.reduce((a, r) => a + r.amount, 0);
                                rows[rows.length - 1].amount = Math.round((rows[rows.length - 1].amount + (amt - sum)) * 100) / 100;
                                return rows;
                              }
                              return ids.map((id) => ({ id, amount: Math.round(Number(memberSplits[id] || 0) * 100) / 100 }));
                            };
                            const rows = calc();
                            return rows.map((r) => {
                              const m = groupMembers.find((x) => x.user_id === r.id);
                              return (
                                <li key={r.id} className="flex justify-between">
                                  <span className="text-muted-foreground">{m?.display_name || "Member"}</span>
                                  <span>${r.amount.toFixed(2)}</span>
                                </li>
                              );
                            });
                          })()}
                        </ul>
                      </div>
                    </div>
                  )}
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

      {/* Group Modal */}
      <SelectionModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        options={groups}
        selected={selectedGroupId}
        onSelect={async (id: string) => {
          const selected = groups.find((g) => g.id === id);
          setSelectedGroupId(id);
          setSelectedGroupName(selected?.name || "");
          setForm({ ...form, group_id: id });
          await fetchGroupMembers(parseInt(id));
        }}
        title="Select a Group"
      />

      {/* OCR Review Dialog */}
      <Dialog open={ocrDialogOpen} onOpenChange={setOcrDialogOpen}>
        <DialogContent className="flex flex-col gap-4 max-w-lg bg-form-bg border-form-border">
          <DialogTitle className="text-foreground">Review extracted details</DialogTitle>
          {ocrSuggestion && (
            <div className="space-y-2 text-sm text-foreground">
              <div><span className="font-medium">Merchant:</span> {ocrSuggestion.merchantName || "—"}</div>
              <div><span className="font-medium">Date:</span> {ocrSuggestion.transactionDate ? ocrSuggestion.transactionDate.toLocaleDateString() : "—"}</div>
              <div><span className="font-medium">Total:</span> {ocrSuggestion.totalAmount || "—"}</div>
              {ocrSuggestion.averageConfidence != null && (
                <div className="text-xs text-muted-foreground">OCR confidence: {ocrSuggestion.averageConfidence.toFixed(0)}%</div>
              )}
              <div className="mt-2">
                <div className="font-medium mb-1">Recognized text</div>
                <div className="max-h-48 overflow-auto whitespace-pre-wrap p-2 rounded border border-form-border bg-form-bg">
                  {ocrSuggestion.fullText}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button onClick={applyOcrSuggestionToForm} className="flex-1 bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">Apply</Button>
            <Button variant="outline" onClick={() => setOcrDialogOpen(false)} className="flex-1 bg-form-bg text-foreground border-form-border hover:bg-form-hover">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
