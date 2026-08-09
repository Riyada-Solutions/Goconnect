// Maps a queued offline mutation's URL to a human-readable action name, so
// the pending-changes list shows "Vitals" instead of "POST /visits/803/forms/flowsheet".
const ACTION_LABELS: Array<[RegExp, string]> = [
  [/\/forms\/flowsheet$/, 'Vitals'],
  [/\/forms\/nursing-progress-note$/, 'Nursing Progress Note'],
  [/\/forms\/progress-notes$/, 'Doctor Progress Note'],
  [/\/forms\/morse-falls-risk-assessment$/, 'Fall Risk Assessment'],
  [/\/forms\/respiratory-illness-screening$/, 'SARI Screening'],
  [/\/forms\/dis-of-hemodialysis$/, 'Refusal Form'],
  [/\/forms\/referrals$/, 'Referral'],
  [/\/forms\/social-worker-progress-note$/, 'Social Worker Note'],
  [/\/forms\/allergies$/, 'Allergies'],
  [/\/forms\/blood-sugar$/, 'Blood Sugar'],
  [/\/forms\/social-assessment$/, 'Social Assessment'],
  [/\/forms\/incidents$/, 'Incident Report'],
  [/\/forms\/visual-triage-checklist$/, 'Visual Triage Checklist'],
  [/\/forms\/consent-form$/, 'Travel Consent Form'],
  [/\/forms\/patient-responsibility$/, 'Patient Responsibility'],
  [/\/forms\/consent-for-hemodialysis$/, 'General Consent for Hemodialysis'],
  [/\/forms\/enrollments-checklist$/, 'Enrollments Checklist'],
  [/\/forms\/patient-assessment$/, 'Patient Assessment'],
  [/\/actions\/patient-medications\//, 'Medication Administration'],
  [/\/patient-inventory\/use-multiple$/, 'Inventory Usage'],
  [/\/patient-inventory\/use$/, 'Inventory Usage'],
  [/\/start-procedure$/, 'Start Procedure'],
  [/\/end-procedure$/, 'End Procedure'],
  [/\/edit-time$/, 'Procedure Time'],
  [/\/checkout-without-sap$/, 'Checkout'],
  [/\/checkout$/, 'Checkout'],
  [/\/close$/, 'Close Visit'],
  [/\/reopen$/, 'Reopen Visit'],
]

/** Friendly label for a queued mutation's action, falling back to a cleaned-up URL. */
export function describeQueuedAction(url: string): string {
  for (const [pattern, label] of ACTION_LABELS) {
    if (pattern.test(url)) return label
  }
  // Fallback: last non-numeric URL segment, title-cased.
  const segments = url.split('/').filter(Boolean)
  const last = [...segments].reverse().find((s) => !/^\d+$/.test(s)) ?? 'Change'
  return last
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Visit id parsed from a queued mutation's URL (e.g. "/visits/803/forms/flowsheet" -> "803"). */
export function describeVisitContext(url: string, visitId?: string): string | null {
  const id = visitId ?? url.match(/\/visits\/(\d+)/)?.[1]
  return id ? `Visit #${id}` : null
}
