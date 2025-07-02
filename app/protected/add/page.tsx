import { ThemeSwitcher } from "@/components/theme-switcher";

export default function AddPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      AddPage
      <ThemeSwitcher />
    </div>
  );
}