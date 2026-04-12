import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Stats {
  totalProjects: number;
  totalFaculty: number;
}

export function useStats() {
  const [stats, setStats]     = useState<Stats>({ totalProjects: 0, totalFaculty: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [projectsSnap, facultySnap] = await Promise.all([
          getDocs(collection(db, "projects")),
          getDocs(query(collection(db, "users"), where("role", "==", "faculty"))),
        ]);
        setStats({
          totalProjects: projectsSnap.size,
          totalFaculty: facultySnap.size,
        });
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  return { stats, loading };
}