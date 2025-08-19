"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Application {
  id: string;
  user_id: string;
  reason: string;
  experience: string;
  portfolio_url: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  user: {
    email: string;
    display_name: string;
  };
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const supabase = createClient();
    
    const { data: applications, error } = await supabase
      .from("professional_applications")
      .select(`
        *,
        user:profiles(email, display_name)
      `)
      .order("submitted_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch applications");
      return;
    }

    setApplications(applications as Application[]);
    setIsLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("professional_applications")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // If approved, update user role
      if (status === "approved") {
        const application = applications.find(app => app.id === id);
        if (application) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ role: "professional" })
            .eq("user_id", application.user_id);

          if (profileError) throw profileError;
        }
      }

      toast.success(`Application ${status}`);
      fetchApplications();
    } catch (error) {
      toast.error("Failed to update application status");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Professional Role Applications</h1>
      
      <div className="space-y-4">
        {applications.map((application) => (
          <Card key={application.id}>
            <CardHeader>
              <CardTitle>{application.user.display_name}</CardTitle>
              <CardDescription>{application.user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Motivation</h3>
                  <p className="text-muted-foreground">{application.reason}</p>
                </div>
                
                {application.experience && (
                  <div>
                    <h3 className="font-medium">Experience</h3>
                    <p className="text-muted-foreground">{application.experience}</p>
                  </div>
                )}
                
                {application.portfolio_url && (
                  <div>
                    <h3 className="font-medium">Portfolio</h3>
                    <a 
                      href={application.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {application.portfolio_url}
                    </a>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {application.status === "pending" ? (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate(application.id, "approved")}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(application.id, "rejected")}
                        variant="outline"
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm font-medium">
                      Status: {application.status}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {applications.length === 0 && (
          <div className="text-center text-muted-foreground">
            No applications found
          </div>
        )}
      </div>
    </div>
  );
}
