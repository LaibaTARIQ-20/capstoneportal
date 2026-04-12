import { useEffect, useState, useCallback } from "react";
import {
  getAllFaculty,
  addFaculty,
  updateFaculty,
  deleteFaculty,
  bulkDeleteFaculty,
} from "@/services/faculty/faculty.service";
import type { UserProfile, FacultyFormData } from "@/types";

export function useFaculty() {
  const [faculty, setFaculty] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllFaculty();
      setFaculty(data);
    } catch {
      setError("Failed to load faculty");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (data: FacultyFormData) => {
    const newMember = await addFaculty(data);
    setFaculty((prev) => [newMember, ...prev]);
  }, []);

  const update = useCallback(async (id: string, data: Partial<UserProfile>) => {
    await updateFaculty(id, data);
    setFaculty((prev) =>
      prev.map((f) => (f.uid === id ? { ...f, ...data } : f))
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteFaculty(id);
    setFaculty((prev) => prev.filter((f) => f.uid !== id));
  }, []);

  const bulkRemove = useCallback(async (ids: string[]) => {
    await bulkDeleteFaculty(ids);
    setFaculty((prev) => prev.filter((f) => !ids.includes(f.uid)));
  }, []);

  return { faculty, loading, error, add, update, remove, bulkRemove, refetch: fetch };
}