"use client";
import { useProfile } from "@/hooks/useProfile";

export function ProfileName() {
  const { profile, loading, error } = useProfile();

  if (loading) return <span>Loading...</span>;
  if (error) return <span>Error</span>;
  if (!profile) return <span>No name</span>;

  return <span>{profile.display_name}</span>;
} 