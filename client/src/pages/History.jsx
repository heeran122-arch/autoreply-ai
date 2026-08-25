import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function History() {
  const [hist, setHist] = useState([]);

  useEffect(() => {
    axios.get("/api/history", { withCredentials: true }).then(r => setHist(r.data)).catch(()=>window.location.href="/");
  }, []);

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">History</h2>
        <Link to="/dashboard" className="text-sm text-blue-600">Dashboard</Link>
      </header>

      <div className="space-y-4">
        {hist.map(h => (
          <div key={h.id} className="p-4 bg-white dark:bg-slate-900 rounded-lg shadow">
            <div className="flex justify-between">
              <div><strong>{h.sender}</strong> — {h.subject}</div>
              <div className="text-sm text-slate-400">{new Date(h.createdAt).toLocaleString()}</div>
            </div>
            <div className="mt-2 text-sm text-slate-600"><strong>Original:</strong><div className="mt-1 whitespace-pre-wrap">{h.originalBody}</div></div>
            <div className="mt-2 text-sm text-slate-700"><strong>AI response:</strong><div className="mt-1 whitespace-pre-wrap">{h.aiResponse || (h.needsReview ? "(Needs Review)" : "")}</div></div>
            <div className="mt-2 text-xs text-slate-500">Auto-sent: {h.wasAutoSent ? "Yes" : "No"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
