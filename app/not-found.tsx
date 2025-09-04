import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Page not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The page you are looking for doesn’t exist or has been moved.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/protected/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


