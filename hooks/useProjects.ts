import { useEffect, useState, useCallback } from "react";
import { getAllProjects, deleteProject, bulkDeleteProjects, updateProjectStatus } from "@/services/projects/projects.service";
import type { Project, ProjectStatus } from "@/types";

export function useProjects(supervisorId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllProjects();
      setProjects(
        supervisorId
          ? data.filter((p) => p.supervisorId === supervisorId)
          : data
      );
    } catch {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [supervisorId]);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = useCallback(async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const bulkRemove = useCallback(async (ids: string[]) => {
    await bulkDeleteProjects(ids);
    setProjects((prev) => prev.filter((p) => !ids.includes(p.id)));
  }, []);

  const changeStatus = useCallback(async (id: string, status: ProjectStatus) => {
    await updateProjectStatus(id, status);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  }, []);

  return { projects, loading, error, remove, bulkRemove, changeStatus, refetch: fetch };
}