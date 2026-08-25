import React from "react";

export default function Home() {
  const connect = () => {
    window.location.href = "/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-4">AutoReply AI</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          An AI agent that connects to your Gmail and automatically replies to incoming emails with natural, contextual responses. You keep full control — turn it off anytime and specify addresses/domains the agent must never reply to.
        </p>
        <div className="flex gap-4">
          <button onClick={connect} className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700">
            Connect Gmail
          </button>
        </div>
        <div className="mt-6 text-sm text-slate-500">
          Requires Google OAuth and an AI provider (OpenAI by default). No passwords are stored in the browser.
        </div>
      </div>
    </div>
  );
}
