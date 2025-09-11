import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {params?.error === "account_locked" ? "Account locked" : "Sorry, something went wrong."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error === "account_locked" ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your account is currently locked. To request an unlock, please email our support team.
                  </p>
                  <p className="text-sm">
                    <a href="mailto:support@finova.app" className="underline underline-offset-4">support@finova.app</a>
                  </p>
                </div>
              ) : params?.error ? (
                <p className="text-sm text-muted-foreground">Code error: {params.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
