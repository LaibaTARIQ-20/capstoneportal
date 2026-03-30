/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DebugPage() {
  const { user, loading } = useAuth();
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const snap = await getDocs(collection(db, "projects"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllProjects(data);
      setFetched(true);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="p-8">Not logged in</div>;

  return (
    <div className="p-8 font-mono text-sm bg-gray-950 text-green-400 min-h-screen">
      <h1 className="text-xl font-bold text-white mb-6">
        DEBUG — Faculty Project Matching
      </h1>

      <div className="mb-6 rounded-lg bg-gray-900 border border-green-700 p-4">
        <p className="text-yellow-400 font-bold mb-2">LOGGED IN USER:</p>
        <p>
          uid: <span className="text-white">{user.uid}</span>
        </p>
        <p>
          name: <span className="text-white">"{user.name}"</span>
        </p>
        <p>
          email: <span className="text-white">"{user.email}"</span>
        </p>
        <p>
          role: <span className="text-white">{user.role}</span>
        </p>
      </div>

      <div className="mb-4">
        <p className="text-yellow-400 font-bold mb-3">
          ALL PROJECTS IN FIRESTORE ({allProjects.length} total):
        </p>
        {!fetched && <p className="text-gray-400">Fetching...</p>}
        {allProjects.map((p, i) => {
          const matchById = p.supervisorId === user.uid;
          const matchByName =
            p.supervisor?.toLowerCase().trim() ===
            user.name?.toLowerCase().trim();
          const matchFuzzy =
            p.supervisor
              ?.toLowerCase()
              .replace(/^(dr\.?|prof\.?)\s+/i, "")
              .trim() ===
            user.name
              ?.toLowerCase()
              .replace(/^(dr\.?|prof\.?)\s+/i, "")
              .trim();
          const anyMatch = matchById || matchByName || matchFuzzy;

          return (
            <div
              key={p.id}
              className={`mb-3 rounded border p-3 ${anyMatch ? "border-green-500 bg-green-950" : "border-gray-700 bg-gray-900"}`}
            >
              <p className="text-white font-bold">
                {i + 1}. {p.title}
              </p>
              <p>
                supervisor field:{" "}
                <span className="text-cyan-400">"{p.supervisor}"</span>
              </p>
              <p>
                supervisorId:{" "}
                <span className="text-cyan-400">"{p.supervisorId}"</span>
              </p>
              <div className="mt-1 flex gap-3 text-xs">
                <span className={matchById ? "text-green-400" : "text-red-400"}>
                  {matchById ? "✓" : "✗"} UID match
                </span>
                <span
                  className={matchByName ? "text-green-400" : "text-red-400"}
                >
                  {matchByName ? "✓" : "✗"} exact name
                </span>
                <span
                  className={matchFuzzy ? "text-green-400" : "text-red-400"}
                >
                  {matchFuzzy ? "✓" : "✗"} fuzzy name
                </span>
                {anyMatch && (
                  <span className="text-green-300 font-bold">SHOULD SHOW</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allProjects.length === 0 && fetched && (
        <div className="rounded border border-red-500 bg-red-950 p-4">
          <p className="text-red-400 font-bold">
            NO PROJECTS IN DATABASE AT ALL
          </p>
          <p className="text-gray-300 mt-1">
            The projects collection is empty or Firestore connection failed.
          </p>
        </div>
      )}
    </div>
  );
}
