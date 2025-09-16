"use client";

import AccountsOverview from "@/components/accounts-overview";
import { useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function AccountPage() {
  const supabase = useMemo(() => createClient(), []);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState<{ id: number; name: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const requestDelete = useCallback((acc: { id: number; name: string }) => {
    setTarget(acc);
    setConfirmOpen(true);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!target) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("You are not signed in."); return; }

      const id = target.id;

      // Delete related transactions owned by the user under this account
      const [expDel, incDel, trfFromDel, trfToDel] = await Promise.all([
        supabase.from("expense_transactions").delete().eq("user_id", user.id).eq("account_id", id),
        supabase.from("income_transactions").delete().eq("user_id", user.id).eq("account_id", id),
        supabase.from("transfer_transactions").delete().eq("user_id", user.id).eq("from_account_id", id),
        supabase.from("transfer_transactions").delete().eq("user_id", user.id).eq("to_account_id", id),
      ]);

      if (expDel.error || incDel.error || trfFromDel.error || trfToDel.error) {
        const err = expDel.error || incDel.error || trfFromDel.error || trfToDel.error;
        toast.error(err?.message || "Failed to delete related transactions");
        return;
      }

      const { error: accErr } = await supabase.from("account_categories").delete().eq("id", id);
      if (accErr) { toast.error(accErr.message || "Failed to delete account"); return; }

      toast.success("Account and related balances deleted");
      setConfirmOpen(false);
      setTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete";
      toast.error(message);
    }
  }, [supabase, target]);

  return (
    <div className="flex min-h-screen bg-background text-foreground pt-6 px-4">
      <div className="flex flex-col items-start justify-start w-full h-full gap-6 max-w-6xl mx-auto">
        <AccountsOverview key={refreshKey} onRequestDelete={requestDelete} />
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting “{target?.name}” will also delete all balances and transactions recorded under this account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="bg-red-600 hover:bg-red-600/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


