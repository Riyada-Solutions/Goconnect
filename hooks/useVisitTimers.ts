import { useCallback, useEffect, useRef, useState } from "react";

export type VisitPhase = "in_progress" | "start_procedure" | "end_procedure" | "completed";

export function useVisitTimers(initialPhase: VisitPhase) {
  const [visitTimerStart, setVisitTimerStart] = useState<number | null>(
    initialPhase === "in_progress" ? Date.now() : null,
  );
  const [procedureTimerStart, setProcedureTimerStart] = useState<number | null>(
    initialPhase === "start_procedure" ? Date.now() : null,
  );
  const [visitElapsed, setVisitElapsed] = useState(0);
  const [procedureElapsed, setProcedureElapsed] = useState(0);
  const visitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const procTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visitTimerStart) {
      visitTimerRef.current = setInterval(() => {
        setVisitElapsed(Date.now() - visitTimerStart);
      }, 1000);
    }
    return () => {
      if (visitTimerRef.current) clearInterval(visitTimerRef.current);
    };
  }, [visitTimerStart]);

  useEffect(() => {
    if (procedureTimerStart) {
      procTimerRef.current = setInterval(() => {
        setProcedureElapsed(Date.now() - procedureTimerStart);
      }, 1000);
    }
    return () => {
      if (procTimerRef.current) clearInterval(procTimerRef.current);
    };
  }, [procedureTimerStart]);

  const stopVisitTimer = useCallback(() => {
    if (visitTimerRef.current) clearInterval(visitTimerRef.current);
  }, []);

  const startProcedureTimer = useCallback((t: number) => setProcedureTimerStart(t), []);

  const stopProcedureTimer = useCallback(() => {
    if (procTimerRef.current) clearInterval(procTimerRef.current);
  }, []);

  return {
    visitElapsed,
    procedureElapsed,
    stopVisitTimer,
    startProcedureTimer,
    stopProcedureTimer,
    setVisitTimerStart,
  };
}
