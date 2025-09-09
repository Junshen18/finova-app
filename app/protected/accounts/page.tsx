import AccountsOverview from "@/components/accounts-overview";

export default function AccountPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground pt-6 px-4 md:ml-64">
      <div className="flex flex-col items-start justify-start w-full h-full gap-6 max-w-6xl mx-auto">
        <AccountsOverview />
      </div>
    </div>
  );
}


