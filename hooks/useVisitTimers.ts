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
  /** Server `start_procedure_time` — the instant the procedure started. */
  procedureStart?: string | number | null;
}

/**
 * Elapsed timers for the visit + procedure, driven by the server timestamps and
 * the current phase (not by imperative start/stop). Both count the *real* time
 * since their start instant, so they survive reloads and match the web view:
 *
 *  • Visit timer    — counts from `start_time` for the whole active visit and
 *                     keeps running through the procedure; freezes once
 *                     `completed`.
 *  • Procedure timer — counts from `start_procedure_time` while the procedure
 *                     is in progress; freezes when it ends.
 */
export function useVisitTimers(phase: VisitPhase, opts: Opts = {}) {
  const visitStartMs = toEpoch(opts.visitStart);
  const procStartMs = toEpoch(opts.procedureStart);

  const [visitElapsed, setVisitElapsed] = useState(0);
  const [procedureElapsed, setProcedureElapsed] = useState(0);

  // Visit timer — active for any non-completed phase.
  const visitActive = phase !== "completed";
  useEffect(() => {
    if (!visitActive || visitStartMs == null) return;
    const tick = () => setVisitElapsed(Math.max(0, Date.now() - visitStartMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [visitActive, visitStartMs]);

  // Procedure timer — active while the procedure is running. Falls back to a
  // locally-captured "now" when the nurse taps Start Procedure before the
  // server's `start_procedure_time` round-trips.
  const procFallback = useRef<number | null>(null);
  const procActive = phase === "start_procedure";
  useEffect(() => {
    if (!procActive) {
      procFallback.current = null;
      return;
    }
    if (procStartMs == null && procFallback.current == null) {
      procFallback.current = Date.now();
    }
    const start = procStartMs ?? procFallback.current!;
    const tick = () => setProcedureElapsed(Math.max(0, Date.now() - start));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [procActive, procStartMs]);

  return { visitElapsed, procedureElapsed };
}
