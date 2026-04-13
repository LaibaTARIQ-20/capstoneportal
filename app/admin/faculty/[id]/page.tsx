"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Save, Mail } from "lucide-react";
import toast from "react-hot-toast";

import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormField,
  Input,
  Select,
  Button,
  Avatar,
  Badge,
} from "@/components/ui";

interface Faculty {
  id: string;
  name: string;
  email: string;
  gender: string;
  department: string;
  designation: string;
  phone: string;
  joinedAt?: { seconds: number };
}

function DesignationBadge({ designation }: { designation: string }) {
  const map: Record<string, import("@/components/ui").BadgeColor> = {
    "Professor":           "purple",
    "Associate Professor": "blue",
    "Assistant Professor": "cyan",
    "Lecturer":            "green",
  };
  return (
    <Badge color={map[designation] || "gray"}>
      {designation || "—"}
    </Badge>
  );
}

export default function AdminFacultyDetailPage() {
  const params  = useParams();
  const id      = params?.id as string;
  const router  = useRouter();
  const { user, loading } = useAuth();

  const [faculty, setFaculty]   = useState<Faculty | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving]     = useState(false);

  const [name, setName]               = useState("");
  const [gender, setGender]           = useState("Male");
  const [department, setDepartment]   = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone]             = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push("/faculty/dashboard"); return; }
  }, [user, loading, router]);

  useEffect(() => {
    if (!id || loading || !user) return;
    const fetchData = async () => {
      setFetching(true);
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (!snap.exists()) { router.push("/admin/faculty"); return; }
        const data = { id: snap.id, ...snap.data() } as Faculty;
        setFaculty(data);
        setName(data.name || "");
        setGender(data.gender || "Male");
        setDepartment(data.department || "");
        setDesignation(data.designation || "");
        setPhone(data.phone || "");
      } catch {
        toast.error("Failed to load faculty");
        router.push("/admin/faculty");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id, user, loading, router]);

  const handleSave = async () => {
    if (!name || !department || !designation || !phone) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", id), {
        name, gender, department, designation, phone,
        updatedAt: Timestamp.now(),
      });
      toast.success("Faculty updated successfully");
      setFaculty((prev) =>
        prev ? { ...prev, name, gender, department, designation, phone } : prev
      );
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (ts?: { seconds: number }) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-PK", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  if (loading || fetching) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );

  if (!user || !faculty) return null;

  return (
    <>
      <PageHeader
        title={name || faculty.name}
        onBack={() => router.push("/admin/faculty")}
        backLabel="Back to Faculty"
        action={
          <Button
            variant="success"
            onClick={handleSave}
            loading={saving}
            icon={<Save />}
            loadingLabel="Saving..."
          >
            Save Changes
          </Button>
        }
      />

      {/* Profile banner */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-5 flex-wrap">
            <Avatar name={name || faculty.name} size="xl" color="blue" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h1 className="text-lg font-bold text-gray-900">{name || faculty.name}</h1>
                <DesignationBadge designation={designation || faculty.designation} />
                <Badge color={(gender || faculty.gender) === "Female" ? "pink" : "blue"}>
                  {gender || faculty.gender}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Mail size={13} className="text-gray-400" />{faculty.email}
                </span>
                <span className="text-sm text-gray-500">
                  Joined: {formatDate(faculty.joinedAt)}
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader
          title="Edit Faculty Details"
          subtitle="Update the faculty member information below"
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Full Name" className="col-span-1 sm:col-span-2 lg:col-span-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <FormField label="Department">
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Software Engineering"
              />
            </FormField>

            <FormField label="Designation">
              <Select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Select designation"
                options={[
                  { value: "Professor", label: "Professor" },
                  { value: "Associate Professor", label: "Associate Professor" },
                  { value: "Assistant Professor", label: "Assistant Professor" },
                  { value: "Lecturer", label: "Lecturer" },
                ]}
              />
            </FormField>

            <FormField label="Gender">
              <Select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                ]}
              />
            </FormField>

            <FormField label="Phone">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 03001234567"
              />
            </FormField>
          </div>
        </CardBody>
        <CardFooter>
          <Button variant="outline" type="button" onClick={() => router.push("/admin/faculty")}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
