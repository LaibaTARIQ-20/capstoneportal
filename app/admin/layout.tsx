// app/admin/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { PageSpinner } from "@/components/ui";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      router.push("/faculty/dashboard");
      return;
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") return <PageSpinner />;

  return <AdminLayout>{children}</AdminLayout>;
}
