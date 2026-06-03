import { useEffect, useRef, useState } from "react";

import { DateTimeConverter } from "@/utils/datetime";

export type VisitPhase = "in_progress" | "start_procedure" | "end_procedure" | "completed";

// Stored timestamps are KSA wall-clock labelled UTC; `instant()` returns the
// true epoch so `now − start` matches the web view (off-by-3h otherwise).
const toEpoch = (v?: string | number | null): number | null =>
  typeof v === "number" ? v : DateTimeConverter.instant(v);

interface Opts {
  /** Server `start_time` — the instant the visit started. */
  visitStart?: string | number | null;
  /** Server `end_time` — set once the visit is checked out. */
  visitEnd?: string | number | null;
  /** Server `start_procedure_time` — the instant the procedure started. */
  procedureStart?: string | number | null;
  /** Server `end_procedure_time` — set once the procedure ends. */
  procedureEnd?: string | number | null;
}

/**
 * Elapsed timers for the visit + procedure, driven entirely by the server
 * timestamps (not by imperative start/stop), so they survive reloads and match
 * the web view. For each timer:
 *
 *  • start set, no end  → live count-up from `start` → now (ticks every 1s).
 *  • start set + end set → frozen total duration (`end − start`).
 *  • start set, no end, but not active → frozen at `now − start` (e.g. the
 *    nurse ended it before the server end-timestamp round-trips).
 *  • no start           → 0.
 *
 * The visit timer runs for the whole active visit (through the procedure) and
 * freezes once `end_time` lands / the visit is `completed`. The procedure timer
 * runs while the procedure is in progress and freezes on `end_procedure_time`.
 */
export function useVisitTimers(phase: VisitPhase, opts: Opts = {}) {
  const visitStartMs = toEpoch(opts.visitStart);
  const visitEndMs = toEpoch(opts.visitEnd);
  const procStartMs = toEpoch(opts.procedureStart);
  const procEndMs = toEpoch(opts.procedureEnd);

  const [visitElapsed, setVisitElapsed] = useState(0);
  const [procedureElapsed, setProcedureElapsed] = useState(0);

  // ── Visit timer ─────────────────────────────────────────────────────────
  const visitActive = phase !== "completed";
  useEffect(() => {
    if (visitStartMs == null) {
      setVisitElapsed(0);
      return;
    }
    // Finished: show the frozen total even after a reload of a completed visit.
    if (visitEndMs != null) {
      setVisitElapsed(Math.max(0, visitEndMs - visitStartMs));
      return;
    }
    // Completed but no end timestamp yet — freeze at the current elapsed.
    if (!visitActive) {
      setVisitElapsed(Math.max(0, Date.now() - visitStartMs));
      return;
    }
    // Running — count up from the server start to now.
    const tick = () => setVisitElapsed(Math.max(0, Date.now() - visitStartMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [visitActive, visitStartMs, visitEndMs]);

  // ── Procedure timer ───────────────────────────────────────────────────────
  // Falls back to a locally-captured "now" when the nurse taps Start Procedure
  // before the server's `start_procedure_time` round-trips.
  const procFallback = useRef<number | null>(null);
  const procActive = phase === "start_procedure";
  useEffect(() => {
    // Finished: frozen total from the server timestamps.
    if (procStartMs != null && procEndMs != null) {
      procFallback.current = null;
      setProcedureElapsed(Math.max(0, procEndMs - procStartMs));
      return;
    }
    if (!procActive) {
      // Not running: freeze at now−start if it had started, else reset.
      procFallback.current = null;
      setProcedureElapsed(procStartMs != null ? Math.max(0, Date.now() - procStartMs) : 0);
      return;
    }
    // Running — count up. Use the server start, or a local fallback if it
    // hasn't arrived yet.
    if (procStartMs == null && procFallback.current == null) {
      procFallback.current = Date.now();
    }
    const start = procStartMs ?? procFallback.current!;
    const tick = () => setProcedureElapsed(Math.max(0, Date.now() - start));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [procActive, procStartMs, procEndMs]);

  return { visitElapsed, procedureElapsed };
}
