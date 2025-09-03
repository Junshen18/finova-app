import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileName } from "@/components/profile-name";
import ClientSidebarWrapper from "@/components/client-sidebar-wrapper";
import ManualAddModal from "@/components/manual-add-modal";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }


  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-row ">
        <ClientSidebarWrapper />
        <div className="flex-1 flex flex-col w-full h-full md:pl-64 mb-20 md:mb-0">
          {children}
        </div>
      </div>
    </main>
  );
}
