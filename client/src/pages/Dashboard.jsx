import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [history, setHistory] = useState([]);
  const [never, setNever] = useState([]);
  const [newNever, setNewNever] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const r = await axios.get("/api/me", { withCredentials: true });
      setMe(r.data);
      const h = await axios.get("/api/history", { withCredentials: true });
      setHistory(h.data);
      const n = await axios.get("/api/never-reply", { withCredentials: true });
      setNever(n.data);
    } catch (err) {
      console.error(err);
      // if unauthenticated, redirect to home
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  async function toggleAgent() {
    await axios.post("/api/agent/toggle", { enabled: !me.agentEnabled }, { withCredentials: true });
    load();
  }

  async function addNever() {
    if (!newNever) return;
    await axios.post("/api/never-reply", { value: newNever }, { withCredentials: true });
    setNewNever("");
    load();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="text-sm text-slate-500">{me.email}</div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/history" className="text-sm text-blue-600">History</Link>
          <button onClick={toggleAgent} className={`px-4 py-2 rounded-lg ${me.agentEnabled ? "bg-green-600 text-white" : "bg-gray-300"}`}>
            Agent {me.agentEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
          <div className="text-sm text-slate-500">Emails processed</div>
          <div className="text-2xl font-semibold">{history.length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
          <div className="text-sm text-slate-500">Auto replies sent</div>
          <div className="text-2xl font-semibold">{history.filter(h => h.wasAutoSent).length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
          <div className="text-sm text-slate-500">Needs review</div>
          <div className="text-2xl font-semibold">{history.filter(h => h.needsReview).length}</div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold mb-2">Recent conversations</h3>
        <div className="space-y-4">
          {history.slice(0, 6).map(h => (
            <div key={h.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <div className="flex justify-between">
                <div><strong>{h.sender}</strong> <span className="text-slate-500">— {h.subject}</span></div>
                <div className="text-sm text-slate-400">{new Date(h.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">{h.originalBody.slice(0, 200)}{h.originalBody.length>200?"...":""}</div>
              <div className="mt-2 text-sm text-slate-700"><strong>AI:</strong> {h.aiResponse.slice(0,200)}{h.aiResponse.length>200?"...":""}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Never Reply list</h3>
        <div className="flex gap-2 mb-4">
          <input value={newNever} onChange={e=>setNewNever(e.target.value)} placeholder="email or domain" className="border p-2 rounded w-64" />
          <button onClick={addNever} className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
        </div>
        <div>
          {never.map(n => (
            <div key={n.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded mb-2">
              <div>{n.value}</div>
              <button onClick={async()=>{await axios.delete(`/api/never-reply/${n.id}`,{withCredentials:true}); load();}} className="text-red-500">Remove</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
