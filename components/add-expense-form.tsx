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
import { Dialog, DialogContent } from "./ui/dialog"; // Use your modal/dialog component
import { FaCamera } from "react-icons/fa";
import { useRef } from "react";

export function AddExpenseForm() {
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  useEffect(() => {
    if (cameraModalOpen) {
      // Start camera
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
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
      // Stop camera
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
        const dataUrl = canvas.toDataURL("image/png");
        setReceiptImage(dataUrl);
        setForm((prev) => ({ ...prev, img_url: dataUrl }));
        setCameraModalOpen(false);
      }
    }
  };

  // Move "Other" to the end
  const sortedCategories = [
    ...categories.filter((cat) => cat.name !== "Other"),
    ...categories.filter((cat) => cat.name === "Other"),
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <Button type="button" className="w-full bg-black text-white border-input border justify-start px-3 py-1" onClick={handleScanReceiptClick}>
                <FaCamera /> Scan Receipt
              </Button>
              <Button type="button" className="w-full bg-black text-white border-input border justify-start px-3 py-1" onClick={handleUploadReceiptClick}>
                <FaCamera /> Upload Receipt
              </Button>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            
            <Dialog open={cameraModalOpen} onOpenChange={setCameraModalOpen}>
              <DialogContent className="flex flex-col items-center gap-4">
                <video ref={videoRef} autoPlay playsInline className="w-full max-w-xs rounded border" />
                <Button onClick={handleCapture} className="w-full bg-black text-white">Capture</Button>
                <Button variant="outline" onClick={() => setCameraModalOpen(false)} className="w-full">Cancel</Button>
              </DialogContent>
            </Dialog>
            {receiptImage && (
              <div className="my-2">
                <img src={receiptImage} alt="Receipt Preview" className="max-w-full max-h-40 rounded border" />
              </div>
            )}
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
            <Button
              type="button"
              className="w-full bg-black text-white border-input border justify-start px-3 py-1"
              onClick={() => setCategoryModalOpen(true)}
            >
              {form.category || "Select a Category"}
            </Button>
            <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
              <DialogContent>
                <div className="grid grid-cols-2 gap-2">
                  {sortedCategories.map((cat) => (
                    <Button
                      key={cat.name}
                      variant={form.category === cat.name ? "default" : "outline"}
                      onClick={() => {
                        setForm({ ...form, category: cat.name });
                        setCategoryModalOpen(false);
                      }}
                    >
                      {cat.name}
                    </Button>
                  ))}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // Handle add new category logic here
                      setCategoryModalOpen(false);
                      // Optionally open another modal for adding
                    }}
                  >
                    + Add
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              type="button"
              className="w-full bg-black text-white border-input border justify-start px-3 py-1"
              onClick={() => setCategoryModalOpen(true)}
            >
              {form.category || "Select an Account"}
            </Button>
            <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
              <DialogContent>
                <div className="grid grid-cols-2 gap-2">
                  {sortedCategories.map((cat) => (
                    <Button
                      key={cat.name}
                      variant={form.category === cat.name ? "default" : "outline"}
                      onClick={() => {
                        setForm({ ...form, category: cat.name });
                        setCategoryModalOpen(false);
                      }}
                    >
                      {cat.name}
                    </Button>
                  ))}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // Handle add new category logic here
                      setCategoryModalOpen(false);
                      // Optionally open another modal for adding
                    }}
                  >
                    + Add
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Input type="text" placeholder="Notes" />
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
