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

/** Backend response shape. */
export interface RulesResponse {
  rules: RuleAction[]
}
