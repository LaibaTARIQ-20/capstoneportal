"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addFaculty } from "@/services/faculty/faculty.service";
import { DESIGNATIONS, DEPARTMENTS } from "@/constants";
import toast from "react-hot-toast";
import type { FacultyFormData } from "@/types";
import {
  Button,
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormField,
  Input,
  Select,
} from "@/components/ui";

export default function AddFacultyPage() {
  const router = useRouter();

  const [form, setForm] = useState<FacultyFormData>({
    name: "",
    email: "",
    password: "",
    gender: "Male",
    department: "",
    designation: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof FacultyFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.department ||
      !form.designation ||
      !form.phone
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await addFaculty(form);
      toast.success(`${form.name} added successfully`);
      router.push("/admin/faculty");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(
          error.message.includes("email-already-in-use")
            ? "This email is already registered"
            : error.message,
        );
      } else {
        toast.error("Failed to add faculty");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add New Faculty"
        subtitle="Create a new faculty account with login access."
        onBack={() => router.push("/admin/faculty")}
        backLabel="Back to Faculty"
      />

      <Card>
        <CardHeader
          title="Faculty Information"
          subtitle="All fields are required"
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Full Name" required className="col-span-1 sm:col-span-2 lg:col-span-3">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Dr. John Smith"
              />
            </FormField>

            <FormField label="Email Address" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="john@university.edu"
              />
            </FormField>

            <FormField label="Password" required hint="Minimum 6 characters">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min. 6 characters"
              />
            </FormField>

            <FormField label="Department" required>
              <Select
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder="Select department"
                options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
              />
            </FormField>

            <FormField label="Designation" required>
              <Select
                value={form.designation}
                onChange={(e) => set("designation", e.target.value)}
                placeholder="Select designation"
                options={DESIGNATIONS.map((d) => ({ value: d, label: d }))}
              />
            </FormField>

            <FormField label="Gender" required>
              <Select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value as "Male" | "Female")}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                ]}
              />
            </FormField>

            <FormField label="Phone" required>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. 03001234567"
              />
            </FormField>
          </div>
        </CardBody>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/faculty")}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={submitting}
            loadingLabel="Adding…"
            onClick={handleSubmit}
          >
            Add Faculty
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
