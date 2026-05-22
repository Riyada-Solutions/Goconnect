/**
 * Dialysis machine catalog entry returned by `GET /settings/machines`.
 *
 * The catalog row carries operational metadata (which branch the machine is
 * in, which patient it's reserved for, asset/warmer numbers). The Flow Sheet
 * selector cares about `id` (sent as `machine_id`) and a human-readable label
 * built from `machineNumber` + `name`.
 */
export interface Machine {
  id: number
  /** Free-form label — in production this is usually the assigned patient's
   *  name (e.g. "MAHMOUD RABIEA"). May be empty. */
  name: string
  /** Asset / serial number printed on the machine (e.g. "50803"). */
  machineNumber: string | null
  /** "center" | "home" — where the machine operates. */
  system: string | null
  contactNumber: string | null
  warmerNumber: string | null
  branchId: number | null
  isBackup: boolean
  /** If set, this machine is reserved for the given patient id. */
  isolatedToPatient: number | null
}

/**
 * Normalize a single machine record. The backend keys are snake_case; we
 * also accept camelCase fallbacks so this stays resilient to API tweaks.
 * Records without an `id` are dropped.
 */
export function parseMachine(raw: any): Machine | null {
  if (!raw || typeof raw !== 'object') return null
  const idRaw = raw.id ?? raw.machineId ?? raw.machine_id
  const id = idRaw != null ? Number(idRaw) : NaN
  if (!Number.isFinite(id)) return null
  return {
    id,
    name: String(raw.name ?? raw.title ?? raw.label ?? '').trim(),
    machineNumber: raw.machine_number ?? raw.machineNumber ?? null,
    system: raw.system ?? null,
    contactNumber: raw.contact_number ?? raw.contactNumber ?? null,
    warmerNumber: raw.warmer_number ?? raw.warmerNumber ?? null,
    branchId: raw.branch_id ?? raw.branchId ?? null,
    isBackup: raw.is_backup === true || raw.isBackup === true,
    isolatedToPatient: raw.isolated_to_patient ?? raw.isolatedToPatient ?? null,
  }
}

/**
 * Build the label shown in the selector: `{machine_number} — {warmer_number}`.
 * Falls back gracefully when either piece is missing.
 */
export function machineDisplayLabel(m: Machine): string {
  const mn = m.machineNumber?.trim() || null
  const wn = m.warmerNumber?.trim() || null
  if (mn && wn) return `${mn} — ${wn}`
  return mn ?? wn ?? m.name?.trim() ?? `Machine ${m.id}`
}
