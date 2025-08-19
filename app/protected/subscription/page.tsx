import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  return (
    <div className="px-4 py-8 max-w-5xl mx-auto text-foreground">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Subscription</h1>
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="annual">Annual</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <PlanCard title="Free" price="$0" period="/mo" features={["Track expenses", "Basic insights", "1 device"]} cta="Current plan" disabled />
            <PlanCard title="Pro" price="$6" period="/mo" features={["All Free features", "Advanced analytics", "Unlimited devices", "Priority support"]} cta="Go Pro" primary />
          </div>
        </TabsContent>

        <TabsContent value="annual">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <PlanCard title="Free" price="$0" period="/yr" features={["Track expenses", "Basic insights", "1 device"]} cta="Current plan" disabled />
            <PlanCard title="Pro" price="$60" period="/yr" note="Save 17%" features={["All Free features", "Advanced analytics", "Unlimited devices", "Priority support"]} cta="Go Pro" primary />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlanCard({ title, price, period, features, cta, primary, disabled, note }: { title: string; price: string; period: string; features: string[]; cta: string; primary?: boolean; disabled?: boolean; note?: string }) {
  return (
    <div className={`rounded-2xl border p-6 md:p-8 ${primary ? "border-[#E9FE52] bg-white/5" : "border-white/10 bg-white/5"}`}>
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {note && <span className="text-xs px-2 py-1 rounded-full bg-[#E9FE52] text-black">{note}</span>}
      </div>
      <div className="flex items-end gap-1 mb-6">
        <span className="text-4xl font-bold text-white">{price}</span>
        <span className="text-sm text-zinc-400">{period}</span>
      </div>
      <ul className="space-y-2 mb-6 text-sm text-zinc-200">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E9FE52]" />
            {f}
          </li>
        ))}
      </ul>
      <Button disabled={disabled} className={`${primary ? "bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90" : "bg-white/10 text-white hover:bg-white/20"} w-full`}>{cta}</Button>
    </div>
  );
}