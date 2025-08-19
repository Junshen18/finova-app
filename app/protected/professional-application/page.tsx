"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PendingApplicationBanner } from "@/components/pending-application-banner";

export default function ProfessionalApplicationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    reason: "",
    experience: "",
    portfolio_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit an application");
        return;
      }

      const response = await fetch("/api/professional-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      toast.success("Application submitted successfully");
      // Reset form
      setForm({
        reason: "",
        experience: "",
        portfolio_url: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Professional Role Application</h1>
      
      <PendingApplicationBanner />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Why do you want to become a professional?
          </label>
          <Textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            required
            className="min-h-[100px]"
            placeholder="Explain your motivation and goals..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Relevant Experience
          </label>
          <Textarea
            name="experience"
            value={form.experience}
            onChange={handleChange}
            className="min-h-[100px]"
            placeholder="Share your relevant experience..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Portfolio URL (Optional)
          </label>
          <Input
            type="url"
            name="portfolio_url"
            value={form.portfolio_url}
            onChange={handleChange}
            placeholder="https://your-portfolio.com"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </div>
  );
}
