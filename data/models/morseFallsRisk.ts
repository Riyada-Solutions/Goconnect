/**
 * Morse Falls Risk Assessment — wire shape.
 *
 * The backend uses a flat boolean flag for each scoring option (so the score
 * for each category is encoded as the *one* `<category>_<points>` flag set to
 * `true`), plus the computed `morse_total_score`, plus per-action booleans
 * grouped by risk band (`low_*`, `mod_*`, `high_*`).
 *
 *   POST /visits/{id}/forms/morse-falls-risk-assessment
 */

export interface MorseFallsRiskAssessmentResponse {
  // History of Falling (a) — choose exactly one
  history_fall_0?:    boolean
  history_fall_25?:   boolean
  // Secondary Diagnosis (b)
  secondary_dx_0?:    boolean
  secondary_dx_15?:   boolean
  // Ambulatory Aid (c)
  ambulatory_aid_0?:  boolean
  ambulatory_aid_15?: boolean
  ambulatory_aid_30?: boolean
  // IV Therapy (d)
  iv_therapy_0?:      boolean
  iv_therapy_20?:     boolean
  // Gait / Transfer (e)
  gait_0?:            boolean
  gait_10?:           boolean
  gait_20?:           boolean
  // Mental Status (f)
  mental_status_0?:   boolean
  mental_status_15?:  boolean
  // Total score (sum of the selected options)
  morse_total_score?: number
  // Low-risk actions (0–24)
  low_safe_environment?:     boolean
  low_patient_education?:    boolean
  low_standard_precautions?: boolean
  // Moderate-risk actions (25–44)
  mod_keep_bed_low?:      boolean
  mod_reassess_24h?:      boolean
  mod_assist_ambulation?: boolean
  mod_review_medications?: boolean
  // High-risk actions (≥45)
  high_protocol?:               boolean
  high_bed_alarm?:              boolean
  high_family_education?:       boolean
  high_frequent_monitoring?:    boolean
  high_reassess_every_shift?:   boolean
  high_nurse_assisted_mobility?: boolean
}

export interface MorseFallsRiskAssessmentInput {
  visitId: number | string
  morseValues: {
    a: number | null  // History of Falling: 0 | 25
    b: number | null  // Secondary Diagnosis: 0 | 15
    c: number | null  // Ambulatory Aid: 0 | 15 | 30
    d: number | null  // IV Therapy: 0 | 20
    e: number | null  // Gait / Transfer: 0 | 10 | 20
    f: number | null  // Mental Status: 0 | 15
  }
  morseTotal: number
  /** Keyed by the UI's short action ids (see ACTION_UI_TO_API). */
  morseActions: Record<string, boolean>
}

/**
 * UI keys used by MorseFallScaleSheet → wire keys used by the backend.
 * Both sides need to agree, so this single map is the source of truth.
 */
export const ACTION_UI_TO_API = {
  // Low (0–24)
  standard_fp: 'low_standard_precautions',
  patient_edu: 'low_patient_education',
  safe_env:    'low_safe_environment',
  // Moderate (25–44)
  assist_amb:   'mod_assist_ambulation',
  bed_low:      'mod_keep_bed_low',
  review_meds:  'mod_review_medications',
  reassess_24:  'mod_reassess_24h',
  // High (≥45)
  hr_protocol:    'high_protocol',
  bed_alarm:      'high_bed_alarm',
  nurse_mobility: 'high_nurse_assisted_mobility',
  freq_monitor:   'high_frequent_monitoring',
  family_edu:    'high_family_education',
  reassess_shift: 'high_reassess_every_shift',
} as const satisfies Record<string, keyof MorseFallsRiskAssessmentResponse>

export type MorseUiActionKey = keyof typeof ACTION_UI_TO_API

const ACTION_API_TO_UI: Record<string, string> = Object.fromEntries(
  Object.entries(ACTION_UI_TO_API).map(([ui, api]) => [api, ui]),
)

/** Build the POST body from the UI's morse state. */
export function buildMorseFallsRiskBody(
  input: Pick<MorseFallsRiskAssessmentInput, 'morseValues' | 'morseTotal' | 'morseActions'>,
): MorseFallsRiskAssessmentResponse {
  const { morseValues: mv, morseTotal, morseActions } = input
  const body: MorseFallsRiskAssessmentResponse = {
    history_fall_0:    mv.a === 0,
    history_fall_25:   mv.a === 25,
    secondary_dx_0:    mv.b === 0,
    secondary_dx_15:   mv.b === 15,
    ambulatory_aid_0:  mv.c === 0,
    ambulatory_aid_15: mv.c === 15,
    ambulatory_aid_30: mv.c === 30,
    iv_therapy_0:      mv.d === 0,
    iv_therapy_20:     mv.d === 20,
    gait_0:            mv.e === 0,
    gait_10:           mv.e === 10,
    gait_20:           mv.e === 20,
    mental_status_0:   mv.f === 0,
    mental_status_15:  mv.f === 15,
    morse_total_score: morseTotal,
  }
  for (const [uiKey, apiKey] of Object.entries(ACTION_UI_TO_API)) {
    ;(body as Record<string, unknown>)[apiKey] = !!morseActions[uiKey]
  }
  return body
}

/** Inverse of `buildMorseFallsRiskBody` — used when hydrating from GET. */
export function parseMorseFallsRiskResponse(raw: any): {
  morseValues: MorseFallsRiskAssessmentInput['morseValues']
  morseTotal: number
  morseActions: Record<string, boolean>
} | undefined {
  if (!raw || typeof raw !== 'object') return undefined

  const pickNum = (...checks: Array<[unknown, number]>): number | null => {
    for (const [flag, value] of checks) {
      if (flag === true || flag === '1' || flag === 1) return value
    }
    return null
  }

  const morseValues = {
    a: pickNum([raw.history_fall_25, 25], [raw.history_fall_0, 0]),
    b: pickNum([raw.secondary_dx_15, 15], [raw.secondary_dx_0, 0]),
    c: pickNum([raw.ambulatory_aid_30, 30], [raw.ambulatory_aid_15, 15], [raw.ambulatory_aid_0, 0]),
    d: pickNum([raw.iv_therapy_20, 20], [raw.iv_therapy_0, 0]),
    e: pickNum([raw.gait_20, 20], [raw.gait_10, 10], [raw.gait_0, 0]),
    f: pickNum([raw.mental_status_15, 15], [raw.mental_status_0, 0]),
  }

  const morseTotal = typeof raw.morse_total_score === 'number'
    ? raw.morse_total_score
    : Number(raw.morse_total_score ?? 0) || 0

  const morseActions: Record<string, boolean> = {}
  for (const [apiKey, uiKey] of Object.entries(ACTION_API_TO_UI)) {
    const v = raw[apiKey]
    if (v === true || v === '1' || v === 1) morseActions[uiKey] = true
  }

  return { morseValues, morseTotal, morseActions }
}
