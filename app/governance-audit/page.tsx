"use client";

import { useState } from "react";

interface Question {
  id: number;
  q: string;
  hint: string;
  flagOnYes: boolean;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    q: "Can an admin assign an arbitrary oracle to a new collateral market without governance vote?",
    hint: "Drift could. It is how the CVT spoof token attack worked.",
    flagOnYes: true,
  },
  {
    id: 2,
    q: "Is the timelock less than 48 hours?",
    hint: "Drift had zero timelock. That is the worst case.",
    flagOnYes: true,
  },
  {
    id: 3,
    q: "Is the multisig 2 of 5 or below?",
    hint: "Compromise of 2 keys takes the protocol. Drift had this exact configuration.",
    flagOnYes: true,
  },
];

export default function GovernanceAuditPage() {
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const [protocol, setProtocol] = useState("");

  function answer(id: number, val: boolean) {
    setAnswers({ ...answers, [id]: val });
  }

  const yesCount = Object.values(answers).filter((v) => v === true).length;
  const allAnswered = QUESTIONS.every((q) => answers[q.id] !== undefined && answers[q.id] !== null);

  let verdict = "";
  let color = "";
  if (allAnswered) {
    if (yesCount === 3) {
      verdict = "EXACT DRIFT ATTACK PROFILE. CRITICAL.";
      color = "text-bunker-critical";
    } else if (yesCount === 2) {
      verdict = "HIGH RISK. Two of three Drift-profile criteria match.";
      color = "text-bunker-warn";
    } else if (yesCount === 1) {
      verdict = "ELEVATED. One Drift-profile criterion matches.";
      color = "text-bunker-warn";
    } else {
      verdict = "LOW. Does not match Drift attack profile.";
      color = "text-bunker-accent";
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div>
        <p className="font-mono text-bunker-muted text-sm">P11 / GOVERNANCE AUDIT</p>
        <h1 className="text-3xl font-bold">Drift Three-Question Screen</h1>
        <p className="text-bunker-muted mt-2">
          Three questions predict the Drift attack profile. Three yes answers means the protocol
          could be drained the same way Drift was. Run this on every protocol in your portfolio
          monthly.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block font-mono text-sm text-bunker-muted">Protocol name</label>
        <input
          value={protocol}
          onChange={(e) => setProtocol(e.target.value)}
          placeholder="e.g. New Lending Protocol X"
          className="w-full bg-bunker-panel border border-bunker-border rounded px-4 py-3 font-mono text-sm focus:outline-none focus:border-bunker-accent"
        />
      </div>

      {QUESTIONS.map((q) => {
        const a = answers[q.id];
        return (
          <div key={q.id} className="bg-bunker-panel border border-bunker-border rounded-lg p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="font-mono text-bunker-muted text-xs mt-1">Q{q.id}</div>
              <div className="flex-1">
                <div className="font-semibold">{q.q}</div>
                <div className="text-sm text-bunker-muted mt-1">{q.hint}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => answer(q.id, true)}
                className={`flex-1 py-2 rounded font-mono text-sm border ${
                  a === true
                    ? "bg-bunker-critical text-bunker-bg border-bunker-critical"
                    : "border-bunker-border hover:border-bunker-critical"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => answer(q.id, false)}
                className={`flex-1 py-2 rounded font-mono text-sm border ${
                  a === false
                    ? "bg-bunker-accent text-bunker-bg border-bunker-accent"
                    : "border-bunker-border hover:border-bunker-accent"
                }`}
              >
                No
              </button>
            </div>
          </div>
        );
      })}

      {allAnswered && (
        <div className="bg-bunker-panel border-2 border-bunker-border rounded-lg p-6">
          <div className="font-mono text-xs text-bunker-muted">VERDICT</div>
          <div className={`text-2xl font-bold mt-1 ${color}`}>{verdict}</div>
          <div className="text-sm text-bunker-muted mt-2">
            {protocol || "this protocol"} answered yes to {yesCount} of 3 Drift-profile questions.
          </div>
          {yesCount === 3 && (
            <div className="mt-4 text-sm text-bunker-text">
              Recommendation: exit positions before any signals fire. BunkerMode flags these
              protocols CRITICAL and pre-stages T3 auto-fire on any anomaly signal.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
