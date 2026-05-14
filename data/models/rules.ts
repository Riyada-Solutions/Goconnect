/**
 * Action-level permission keys returned by `GET /me/rules`.
 *
 * The backend returns a flat array of strings — every string in the array
 * grants the user the matching action. Anything NOT in the array (or unknown)
 * is treated as disabled.
 *
 * `ALL_RULE_ACTIONS` below is the canonical list the mobile app gates on; it
 * is the contract handed to the backend so they know which keys to support.
 */
export type RuleAction =
  // ── Dashboard / shell ─────────────────────────────────────────────
  | 'view_dashboard'
  | 'view_notifications'
  // ── Profile / account ─────────────────────────────────────────────
  | 'view_profile'
  | 'edit_profile'
  | 'change_avatar'
  | 'change_password'
  | 'delete_account'
  | 'logout'
  // ── App settings ──────────────────────────────────────────────────
  | 'toggle_biometric'
  | 'toggle_push_notifications'
  | 'toggle_email_notifications'
  | 'change_language'
  | 'change_theme'
  // ── Patients ──────────────────────────────────────────────────────
  | 'view_patients'
  | 'view_patient_detail'
  | 'view_patient_care_team'
  | 'call_patient'
  | 'navigate_to_patient_address'
  // ── Lab results ───────────────────────────────────────────────────
  | 'view_lab_results'
  | 'view_lab_order_pdf'
  | 'view_lab_result_pdf'
  // ── Schedule / appointments ───────────────────────────────────────
  | 'view_schedule'
  | 'view_appointment_detail'
  | 'confirm_appointment'
  | 'confirm_for_others'
  | 'cancel_appointment'
  | 'check_in_patient'
  // ── Visits (read) ─────────────────────────────────────────────────
  | 'view_visits'
  | 'view_visit_detail'
  | 'start_visit'
  | 'end_visit'
  // ── Visit submissions (write) ─────────────────────────────────────
  | 'submit_flow_sheet_outside_dialysis'
  | 'submit_flow_sheet_pre_treatment_vitals'
  | 'submit_flow_sheet_machines'
  | 'submit_flow_sheet_pain_assessment'
  | 'submit_flow_sheet_fall_risk'
  | 'submit_flow_sheet_nursing_actions'
  | 'submit_flow_sheet_dialysis_parameters'
  | 'submit_flow_sheet_alarms_test'
  | 'submit_flow_sheet_intake_output'
  | 'submit_flow_sheet_car'
  | 'submit_flow_sheet_access'
  | 'submit_flow_sheet_dialysate'
  | 'submit_flow_sheet_anticoagulation'
  | 'submit_flow_sheet_medications'
  | 'submit_flow_sheet_post_treatment'
  | 'submit_nursing_progress_note'
  | 'submit_doctor_progress_note'
  | 'submit_social_worker_progress_note'
  | 'submit_referral'
  | 'submit_refusal'
  | 'submit_sari_screening'
  | 'submit_inventory_usage'
  // ── Help & support ────────────────────────────────────────────────
  | 'view_help_support'
  | 'submit_support_message'

export const ALL_RULE_ACTIONS: RuleAction[] = [
  'view_dashboard',
  'view_notifications',

  'view_profile',
  'edit_profile',
  'change_avatar',
  'change_password',
  'delete_account',
  'logout',

  'toggle_biometric',
  'toggle_push_notifications',
  'toggle_email_notifications',
  'change_language',
  'change_theme',

  'view_patients',
  'view_patient_detail',
  'view_patient_care_team',
  'call_patient',
  'navigate_to_patient_address',

  'view_lab_results',
  'view_lab_order_pdf',
  'view_lab_result_pdf',

  'view_schedule',
  'view_appointment_detail',
  'confirm_appointment',
  'confirm_for_others',
  'cancel_appointment',
  'check_in_patient',

  'view_visits',
  'view_visit_detail',
  'start_visit',
  'end_visit',

  'submit_flow_sheet_outside_dialysis',
  'submit_flow_sheet_pre_treatment_vitals',
  'submit_flow_sheet_machines',
  'submit_flow_sheet_pain_assessment',
  'submit_flow_sheet_fall_risk',
  'submit_flow_sheet_nursing_actions',
  'submit_flow_sheet_dialysis_parameters',
  'submit_flow_sheet_alarms_test',
  'submit_flow_sheet_intake_output',
  'submit_flow_sheet_car',
  'submit_flow_sheet_access',
  'submit_flow_sheet_dialysate',
  'submit_flow_sheet_anticoagulation',
  'submit_flow_sheet_medications',
  'submit_flow_sheet_post_treatment',
  'submit_nursing_progress_note',
  'submit_doctor_progress_note',
  'submit_social_worker_progress_note',
  'submit_referral',
  'submit_refusal',
  'submit_sari_screening',
  'submit_inventory_usage',

  'view_help_support',
  'submit_support_message',
]

/** Backend response shape — backend now returns dotted keys (e.g.
 *  `patients.flowsheet.edit`, `visits.StartMyVisit`, `waiting-room.checkIn`).
 *  We keep this typed as a loose string array so unknown keys don't break
 *  the response parse. */
export interface RulesResponse {
  rules: string[]
}

/**
 * Maps each semantic FE rule key onto the backend rule string(s) needed to
 * grant it. Multiple backend keys mean "any of them is enough" (logical OR).
 *
 * Actions that are pure UI affordances (theme, language, biometrics, logout,
 * etc.) are NOT in this map; `can()` treats unmapped actions as **allowed**
 * so adding a new FE rule never silently locks users out before the backend
 * adds a matching key.
 */
export const FE_RULE_TO_BACKEND: Partial<Record<RuleAction, string | string[]>> = {
  // ── Dashboard / shell ─────────────────────────────────────────────
  view_dashboard:      ['dashboard.view', 'dashboard'],
  view_notifications:  ['custom-notifications.view', 'custom-notifications'],

  // ── Profile / account ─────────────────────────────────────────────
  view_profile:        'employees.viewMyAccount',

  // ── Patients ──────────────────────────────────────────────────────
  view_patients:                'patients',
  view_patient_detail:          ['patients.dashboard', 'patients'],
  view_patient_care_team:       'patients.dashboard',

  // ── Lab results ───────────────────────────────────────────────────
  view_lab_results:     'patients.lab-results',
  view_lab_order_pdf:   'patients.lab-orders',
  view_lab_result_pdf:  'patients.lab-results',

  // ── Schedule / appointments ───────────────────────────────────────
  view_schedule:           ['appointments.viewMyAppointments', 'appointments.viewAllAppointments', 'appointments'],
  view_appointment_detail: ['waiting-room.viewAppointmentDetails', 'appointments.viewMyAppointments', 'appointments.viewAllAppointments'],
  confirm_appointment:     ['appointments.editMyAppointments', 'appointments.editAllAppointments'],
  confirm_for_others:      'appointments.confirmForOthers',
  cancel_appointment:      ['appointments.editMyAppointments', 'appointments.editAllAppointments'],
  check_in_patient:        'waiting-room.checkIn',

  // ── Visits ────────────────────────────────────────────────────────
  view_visits:        ['visits.viewEditMyVisits', 'visits.ViewAllVisits', 'visits'],
  view_visit_detail:  ['waiting-room.viewVisitDetails', 'visits.viewEditMyVisits', 'visits.ViewAllVisits'],
  start_visit:        ['visits.StartMyVisit', 'visits.StartAllVisits'],
  end_visit:          ['visits.EndMyVisit', 'visits.EndAllVisits'],

  // ── Flow sheet submissions — all gated by the patient flowsheet edit rule ──
  submit_flow_sheet_outside_dialysis:    'patients.flowsheet.edit',
  submit_flow_sheet_pre_treatment_vitals:'patients.flowsheet.edit',
  submit_flow_sheet_machines:            'patients.flowsheet.edit',
  submit_flow_sheet_pain_assessment:     'patients.flowsheet.edit',
  submit_flow_sheet_fall_risk:           ['patients.flowsheet.edit', 'patients.morse-falls-risk-assessment.edit'],
  submit_flow_sheet_nursing_actions:     'patients.flowsheet.edit',
  submit_flow_sheet_dialysis_parameters: 'patients.flowsheet.edit',
  submit_flow_sheet_alarms_test:         'patients.flowsheet.edit',
  submit_flow_sheet_intake_output:       'patients.flowsheet.edit',
  submit_flow_sheet_car:                 'patients.flowsheet.edit',
  submit_flow_sheet_access:              ['patients.flowsheet.edit', 'patients.vascular-access-assessment.edit'],
  submit_flow_sheet_dialysate:           'patients.flowsheet.edit',
  submit_flow_sheet_anticoagulation:     'patients.flowsheet.edit',
  submit_flow_sheet_medications:         ['patients.flowsheet.edit', 'patients.medications.edit'],
  submit_flow_sheet_post_treatment:      'patients.flowsheet.edit',

  // ── Progress notes / referrals / screenings ───────────────────────
  submit_nursing_progress_note:       'patients.nursing-progress-note.edit',
  submit_doctor_progress_note:        'patients.progress-notes.edit',
  submit_social_worker_progress_note: 'patients.social-worker-progress-note.edit',
  submit_referral:                    'patients.referrals.edit',
  submit_sari_screening:              'patients.respiratory-illness-screening.edit',
  submit_inventory_usage:             ['inventory.use-item', 'inventory.createUsage'],

  // ── Support ───────────────────────────────────────────────────────
  submit_support_message: 'ticketing.createTickets',
}

/** Returns true when the user has any of the backend rules mapped to `action`.
 *  If the action has no mapping, returns `true` (treated as always allowed). */
export function isActionAllowed(
  action: RuleAction,
  granted: ReadonlySet<string>,
): boolean {
  const mapped = FE_RULE_TO_BACKEND[action]
  if (mapped === undefined) return true
  const keys = Array.isArray(mapped) ? mapped : [mapped]
  return keys.some(k => granted.has(k))
}
