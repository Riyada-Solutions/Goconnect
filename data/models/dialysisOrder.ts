/**
 * Dialysis Order — contracts + the dynamic-form rule engine.
 *
 * The form is **fully data-driven**: every option list and every one of the
 * 24 visibility rules ships from `GET /api/dialysis-orders/options`. Nothing
 * here hardcodes a rule — `computeDialysisOrderState()` interprets the
 * `field_sets` / `dependent_options` / `constraints` / `visibility_rules`
 * payload, exactly like the web app does.
 *
 * `FALLBACK_DIALYSIS_ORDER_OPTIONS` (dialysis_order_repository) is the one
 * exception, and it is not a rule source: it's a frozen copy of the payload
 * used only when the app is offline and has never cached the real one, so a
 * nurse can still open (and queue) an order without connectivity.
 */

import { toOptionList } from './optionList'

// ─── Wire shapes ────────────────────────────────────────────────────────────

export interface DialysisOptionItem {
  key: string
  value: string
}

/** A `by_value` entry that carries presentation metadata alongside its list. */
export interface DialysisDependentEntry {
  unit?: string | null
  label?: string | null
  default?: string | null
  options: DialysisOptionItem[]
}

export interface DialysisDependentConfig {
  depends_on: string
  by_value: Record<string, DialysisOptionItem[] | DialysisDependentEntry>
}

export interface DialysisVolumeValueRule {
  /** `number` | `text` | null (null = the value box is hidden entirely). */
  input: 'number' | 'text' | null
  unit: string | null
  default: string | null
}

export interface DialysisOrderConstraints {
  other_value?: string
  otherable_fields?: string[]
  clear_on_change?: Record<string, string[]>
  blood_flow_rate?: {
    restricted_options: string[]
    restricted_when: Record<string, string[]>
  }
  dialyzer_cartridge?: {
    dry_weight_threshold: number
    restricted_options: string[]
    reveals_dialyzer_fields: string
  }
  volume_value?: Record<string, DialysisVolumeValueRule>
  tpa?: {
    defaults: Record<string, string>
    hidden_when: Record<string, string[]>
  }
}

/** Generic rule row as documented in §6.3 of the mobile guide. */
export interface DialysisVisibilityRule {
  field: string
  effect: 'visibility' | 'options' | 'visibility_and_options' | 'restrict_options' | 'clear_on_change'
  depends_on?: string
  show_when?: string[]
  hide_when?: string[]
  options_by_value?: Record<string, DialysisOptionItem[] | DialysisDependentEntry>
  restricted_options?: string[]
  restricted_when?: Record<string, string[]>
  clears?: string[]
}

export interface DialysisOrderOptions {
  /** order_type → the fields that only exist for that type. */
  field_sets: Record<string, string[]>
  options: Record<string, DialysisOptionItem[]>
  dependent_options: Record<string, DialysisDependentConfig>
  visibility_rules: DialysisVisibilityRule[]
  constraints: DialysisOrderConstraints
}

/** A stored order as returned by `GET /patients/{p}/dialysis-orders/{id}`. */
export interface DialysisOrder {
  id: number
  patientId: number | null
  orderType: string
  /** Raw field values exactly as stored (snake_case keys). */
  values: Record<string, any>
  /** Every "other"-able field with its free text substituted in — display-ready. */
  resolved: Record<string, any>
  /** Server-computed visibility, ready to drive the read-only screen. */
  visibility: { fields?: Record<string, boolean>; other_inputs?: Record<string, boolean> } | null
  tpa: Record<string, any> | null
  otherValues: Record<string, string>
  isAcknowledged: boolean
  acknowledgedAt: string | null
  acknowledgedBy: string | null
  canDelete: boolean
  provider: string | null
  nurse: string | null
  createdAt: string | null
  updatedAt: string | null
}

// ─── Form values ────────────────────────────────────────────────────────────

export interface DialysisOrderTpaValues {
  arterial_line_tpa: string
  arterial_line_saline: string
  venous_line_tpa: string
  venous_line_saline: string
  tpa_frequency: string
  tpa_other_frequency: string
}

export interface DialysisOrderFormValues {
  /** Every scalar select/text field, keyed by its wire name. */
  fields: Record<string, string>
  dwell_volume: { arterial: string; venous: string }
  tpa_check: boolean
  tpa: DialysisOrderTpaValues
  /** Free text for any field whose value is `other`. */
  other_values: Record<string, string>
}

/** Fields shared by both order types (i.e. not in any `field_sets` entry). */
export const DIALYSIS_COMMON_FIELDS = [
  'modality', 'dry_weight', 'uf', 'vascular_access', 'access_subtype', 'access_site',
  'needle_gauge', 'dwell_type', 'volume_value', 'dwell_volume', 'frequency',
  'other_frequency', 'duration', 'blood_flow_rate', 'tpa_check', 'dialysate_type',
  'picar', 'lactate_percent', 'dialyzer_type', 'dialyzer_surface_area',
  'administration_type', 'bolus_value', 'hourly_value', 'additional_information',
] as const

export const EMPTY_TPA: DialysisOrderTpaValues = {
  arterial_line_tpa: '',
  arterial_line_saline: '',
  venous_line_tpa: '',
  venous_line_saline: '',
  tpa_frequency: '',
  tpa_other_frequency: '',
}

export const TPA_VALUE_KEYS: (keyof DialysisOrderTpaValues)[] = [
  'arterial_line_tpa', 'arterial_line_saline', 'venous_line_tpa',
  'venous_line_saline', 'tpa_frequency', 'tpa_other_frequency',
]

export function emptyDialysisOrderValues(): DialysisOrderFormValues {
  return {
    fields: {},
    dwell_volume: { arterial: '', venous: '' },
    tpa_check: false,
    tpa: { ...EMPTY_TPA },
    other_values: {},
  }
}

// ─── Rule engine ────────────────────────────────────────────────────────────

export interface DialysisOrderFieldState {
  /** field name → rendered? */
  visible: Record<string, boolean>
  /** field name → its free-text "other" box rendered? */
  otherVisible: Record<string, boolean>
  /** field name → the option list to render right now. */
  optionsFor: Record<string, DialysisOptionItem[]>
  /** field name → option keys that must be greyed out / unselectable. */
  disabledOptions: Record<string, string[]>
  /** field name → unit suffix ("IU", "%", "ML"…). */
  units: Record<string, string | null>
  /** field name → label override (e.g. "Hourly Maintenance IU"). */
  labels: Record<string, string | null>
  /** `volume_value` input kind, driven by rules 11–13. */
  volumeInput: 'number' | 'text' | null
  /** Inline hints the mockup renders under specific fields. */
  notes: { distal: boolean; bloodFlowCapped: boolean; cartridgeRestricted: boolean }
  /** False until an order type is picked — render only that one dropdown. */
  showForm: boolean
}

const AV_ACCESS = ['av_fistula', 'av_graft']

export { toOptionList }

const isEntry = (v: any): v is DialysisDependentEntry =>
  !!v && !Array.isArray(v) && typeof v === 'object' && 'options' in v

/** Resolve a `by_value` cell into its option list regardless of shape. */
function entryOptions(v: any): DialysisOptionItem[] {
  if (!v) return []
  return isEntry(v) ? toOptionList(v.options) : toOptionList(v)
}

/** A `by_value` / `options_by_value` cell with its list coerced to an array. */
function normalizeCell(cell: any): DialysisOptionItem[] | DialysisDependentEntry {
  return isEntry(cell) ? { ...cell, options: toOptionList(cell.options) } : toOptionList(cell)
}

/**
 * Normalise the raw `/dialysis-orders/options` payload once, at the edge, so
 * the rule engine and the form only ever see canonical option arrays.
 */
export function normalizeDialysisOrderOptions(raw: any): DialysisOrderOptions {
  const options: Record<string, DialysisOptionItem[]> = {}
  for (const [field, list] of Object.entries(raw?.options ?? {})) options[field] = toOptionList(list)

  const dependent_options: Record<string, DialysisDependentConfig> = {}
  for (const [field, cfg] of Object.entries<any>(raw?.dependent_options ?? {})) {
    if (!cfg || typeof cfg !== 'object') continue
    const by_value: Record<string, DialysisOptionItem[] | DialysisDependentEntry> = {}
    for (const [driver, cell] of Object.entries<any>(cfg.by_value ?? {})) by_value[driver] = normalizeCell(cell)
    dependent_options[field] = { depends_on: String(cfg.depends_on ?? ''), by_value }
  }

  const visibility_rules: DialysisVisibilityRule[] = (
    Array.isArray(raw?.visibility_rules) ? raw.visibility_rules : []
  ).map((rule: any) => {
    if (!rule?.options_by_value || typeof rule.options_by_value !== 'object') return rule
    const options_by_value: Record<string, DialysisOptionItem[] | DialysisDependentEntry> = {}
    for (const [driver, cell] of Object.entries<any>(rule.options_by_value)) {
      options_by_value[driver] = normalizeCell(cell)
    }
    return { ...rule, options_by_value }
  })

  const field_sets: Record<string, string[]> = {}
  for (const [type, list] of Object.entries(raw?.field_sets ?? {})) {
    field_sets[type] = Array.isArray(list) ? list.map(String) : Object.values(list ?? {}).map(String)
  }

  return {
    field_sets,
    options,
    dependent_options,
    visibility_rules,
    constraints: raw?.constraints ?? {},
  }
}

function dependentEntry(
  opts: DialysisOrderOptions,
  field: string,
  values: DialysisOrderFormValues,
): DialysisOptionItem[] | DialysisDependentEntry | undefined {
  const cfg = opts.dependent_options?.[field]
  if (!cfg) return undefined
  const driver = values.fields[cfg.depends_on] ?? ''
  return cfg.by_value?.[driver]
}

/**
 * Evaluate every rule against the current form values.
 *
 * Order matters: the structural rules (field sets, dependent lists,
 * constraints) run first, then any `visibility_rules` the API sent are
 * applied on top — so a backend-side rule change wins over our derivation
 * without needing a new app release.
 */
export function computeDialysisOrderState(
  opts: DialysisOrderOptions,
  values: DialysisOrderFormValues,
): DialysisOrderFieldState {
  const v = (name: string) => values.fields[name] ?? ''
  const orderType = v('order_type')
  const access = v('vascular_access')
  const dwell = v('dwell_type')
  const dialysate = v('dialysate_type')
  const cartridge = v('dialyzer_cartridge')

  const isAV = AV_ACCESS.includes(access)
  const otherKey = opts.constraints?.other_value ?? 'other'

  const visible: Record<string, boolean> = {}
  const otherVisible: Record<string, boolean> = {}
  const optionsFor: Record<string, DialysisOptionItem[]> = {}
  const disabledOptions: Record<string, string[]> = {}
  const units: Record<string, string | null> = {}
  const labels: Record<string, string | null> = {}

  // Rule 1 — the type-specific field sets. Anything no field set claims is
  // common and renders as soon as a type is chosen.
  const allTypeFields = new Set<string>()
  Object.values(opts.field_sets ?? {}).forEach((list) => {
    if (Array.isArray(list)) list.forEach((f) => allTypeFields.add(f))
  })
  const active = opts.field_sets?.[orderType]
  const activeTypeFields = new Set(Array.isArray(active) ? active : [])

  for (const field of Object.keys(opts.options ?? {})) {
    if (field === 'order_type') continue
    visible[field] = allTypeFields.has(field) ? activeTypeFields.has(field) : true
  }
  for (const field of DIALYSIS_COMMON_FIELDS) {
    if (visible[field] === undefined) visible[field] = true
  }
  activeTypeFields.forEach((f) => { visible[f] = true })

  // Rules 3, 4, 5 — vascular access drives three fields on and off.
  visible.needle_gauge = isAV
  visible.dwell_type = access === 'permacath'
  visible.dwell_volume = ['cvc_temporary', 'permacath'].includes(access)

  // Rules 11–13 — the dwell value box follows the dwell type.
  const volumeRule = opts.constraints?.volume_value?.[dwell]
  const dwellValueShown = visible.dwell_type && !!dwell && dwell !== otherKey && volumeRule?.input != null
  visible.volume_value = dwellValueShown
  units.volume_value = dwellValueShown ? volumeRule?.unit ?? null : null

  // Rules 14–17 — the anticoagulation branch.
  const bolusCfg = dependentEntry(opts, 'bolus_value', values)
  const hourlyCfg = dependentEntry(opts, 'hourly_value', values)
  visible.bolus_value = !!bolusCfg
  visible.hourly_value = !!hourlyCfg
  if (isEntry(bolusCfg)) units.bolus_value = bolusCfg.unit ?? null
  if (isEntry(hourlyCfg)) {
    units.hourly_value = hourlyCfg.unit ?? null
    labels.hourly_value = hourlyCfg.label ?? null
  }

  // Rules 7 & 18 — TPA. Rule 7 outranks rule 18: on AV access the whole
  // section is gone, checkbox included, whatever the box says.
  const tpaHiddenWhen = opts.constraints?.tpa?.hidden_when ?? {}
  const tpaHidden = Object.entries(tpaHiddenWhen).some(([field, vals]) => vals.includes(v(field)))
  visible.tpa_check = !tpaHidden
  const tpaPanel = !tpaHidden && values.tpa_check
  visible.tpa_panel = tpaPanel
  // Rule 19 — free-text TPA frequency.
  visible.tpa_other_frequency = tpaPanel && values.tpa.tpa_frequency === otherKey

  // Rules 20–21 — dialysate type reveals exactly one of these.
  visible.picar = dialysate === 'bicarbonate'
  visible.lactate_percent = dialysate === 'lactate'

  // Rule 24 — Conventional always shows the dialyzer pair; Portable only
  // reveals it for the cartridge the API nominates.
  const cartridgeCfg = opts.constraints?.dialyzer_cartridge
  const dialyzerShown =
    !!orderType &&
    (!activeTypeFields.has('dialyzer_cartridge') ||
      cartridge === (cartridgeCfg?.reveals_dialyzer_fields ?? '124'))
  visible.dialyzer_type = dialyzerShown
  visible.dialyzer_surface_area = dialyzerShown

  // Rule 6 — catheter access caps the blood flow rate.
  const bfr = opts.constraints?.blood_flow_rate
  const bfrRestricted = !!bfr && Object.entries(bfr.restricted_when ?? {}).some(
    ([field, vals]) => vals.includes(v(field)),
  )
  if (bfrRestricted && bfr) disabledOptions.blood_flow_rate = bfr.restricted_options

  // Rule 23 — a very low dry weight leaves "Other" as the only cartridge.
  const dryWeight = parseFloat(v('dry_weight')) || 0
  const cartridgeRestricted =
    !!cartridgeCfg && dryWeight > 0 && dryWeight < cartridgeCfg.dry_weight_threshold
  if (cartridgeRestricted && cartridgeCfg) {
    disabledOptions.dialyzer_cartridge = cartridgeCfg.restricted_options
  }

  // Option lists: dependent first (rules 2, 8, 14–16), static otherwise.
  for (const field of Object.keys(opts.options ?? {})) optionsFor[field] = toOptionList(opts.options[field])
  for (const field of Object.keys(opts.dependent_options ?? {})) {
    optionsFor[field] = entryOptions(dependentEntry(opts, field, values))
  }

  // Backend-authored rules win over everything derived above.
  for (const rule of opts.visibility_rules ?? []) {
    const driver = rule.depends_on ? v(rule.depends_on) : ''
    if (rule.effect === 'visibility' || rule.effect === 'visibility_and_options') {
      if (rule.show_when) visible[rule.field] = rule.show_when.includes(driver)
      else if (rule.hide_when) visible[rule.field] = !rule.hide_when.includes(driver)
    }
    if (rule.effect === 'options' || rule.effect === 'visibility_and_options') {
      const cell = rule.options_by_value?.[driver]
      optionsFor[rule.field] = entryOptions(cell)
      if (isEntry(cell)) {
        units[rule.field] = cell.unit ?? units[rule.field] ?? null
        labels[rule.field] = cell.label ?? labels[rule.field] ?? null
      }
      if (rule.effect === 'options' && rule.options_by_value) {
        visible[rule.field] = optionsFor[rule.field].length > 0
      }
    }
    if (rule.effect === 'restrict_options') {
      const hit = Object.entries(rule.restricted_when ?? {}).some(([f, vals]) => vals.includes(v(f)))
      if (hit && rule.restricted_options) disabledOptions[rule.field] = rule.restricted_options
      else delete disabledOptions[rule.field]
    }
  }

  // The universal "other" rule — any visible list field sitting on `other`
  // gets a free-text box. `frequency` is the documented exception: its text
  // lives in the standalone `other_frequency` field, not in `other_values`.
  for (const field of opts.constraints?.otherable_fields ?? []) {
    if (field === 'frequency') continue
    otherVisible[field] = visible[field] !== false && v(field) === otherKey
  }
  visible.other_frequency = v('frequency') === otherKey

  return {
    visible,
    otherVisible,
    optionsFor,
    disabledOptions,
    units,
    labels,
    volumeInput: dwellValueShown ? volumeRule?.input ?? 'text' : null,
    notes: {
      distal: v('access_subtype') === 'distal',
      bloodFlowCapped: bfrRestricted,
      cartridgeRestricted,
    },
    showForm: !!orderType,
  }
}

/**
 * Apply one field change, running the clear-on-change table (§6.2) and the
 * default-seeding rules (12, 16) so the form can never hold a combination
 * the server would reject with a 422.
 */
export function applyDialysisOrderChange(
  opts: DialysisOrderOptions,
  values: DialysisOrderFormValues,
  field: string,
  value: string,
): DialysisOrderFormValues {
  const otherKey = opts.constraints?.other_value ?? 'other'
  const next: DialysisOrderFormValues = {
    ...values,
    fields: { ...values.fields, [field]: value },
    dwell_volume: { ...values.dwell_volume },
    tpa: { ...values.tpa },
    other_values: { ...values.other_values },
  }

  // §6.2 clear-on-change — straight from `constraints.clear_on_change`.
  for (const cleared of opts.constraints?.clear_on_change?.[field] ?? []) {
    next.fields[cleared] = ''
    delete next.other_values[cleared]
  }
  for (const rule of opts.visibility_rules ?? []) {
    if (rule.effect === 'clear_on_change' && rule.field === field) {
      for (const cleared of rule.clears ?? []) {
        next.fields[cleared] = ''
        delete next.other_values[cleared]
      }
    }
  }

  // Free text is meaningless once the field leaves `other`.
  if (value !== otherKey) delete next.other_values[field]
  if (field === 'frequency' && value !== otherKey) next.fields.other_frequency = ''

  // Rule 7 — AV access forces TPA off and wipes its values.
  if (field === 'vascular_access') {
    const hiddenWhen = opts.constraints?.tpa?.hidden_when ?? {}
    const hidden = Object.entries(hiddenWhen).some(([f, vals]) =>
      vals.includes(f === field ? value : next.fields[f] ?? ''))
    if (hidden && next.tpa_check) {
      next.tpa_check = false
      next.tpa = { ...EMPTY_TPA }
    }
    next.dwell_volume = { arterial: '', venous: '' }
  }

  // Rules 11–13 — swapping the dwell type swaps the value box and its default.
  if (field === 'dwell_type') {
    const rule = opts.constraints?.volume_value?.[value]
    next.fields.volume_value = rule?.default ?? ''
  }

  // Rules 14–17 — a new anticoagulation type invalidates the old doses and
  // seeds the documented Saline default.
  if (field === 'administration_type') {
    const bolusCfg = opts.dependent_options?.bolus_value?.by_value?.[value]
    const hourlyCfg = opts.dependent_options?.hourly_value?.by_value?.[value]
    if (!bolusCfg) next.fields.bolus_value = ''
    if (!hourlyCfg) next.fields.hourly_value = ''
    else if (isEntry(hourlyCfg) && hourlyCfg.default && !next.fields.hourly_value) {
      next.fields.hourly_value = hourlyCfg.default
    }
  }

  return next
}

/** Rule 18 — toggling the TPA box seeds its four defaults, or wipes all six. */
export function applyTpaToggle(
  opts: DialysisOrderOptions,
  values: DialysisOrderFormValues,
  checked: boolean,
): DialysisOrderFormValues {
  if (!checked) return { ...values, tpa_check: false, tpa: { ...EMPTY_TPA } }
  const defaults = opts.constraints?.tpa?.defaults ?? {}
  const tpa = { ...values.tpa }
  for (const [key, def] of Object.entries(defaults)) {
    const k = key as keyof DialysisOrderTpaValues
    if (!tpa[k]) tpa[k] = def
  }
  return { ...values, tpa_check: true, tpa }
}

// ─── Validation ─────────────────────────────────────────────────────────────

/** Client-side mirror of §7. Returns `{ field: message }`, empty when valid. */
export function validateDialysisOrder(
  opts: DialysisOrderOptions,
  values: DialysisOrderFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {}
  const v = (name: string) => (values.fields[name] ?? '').trim()

  if (!v('order_type')) errors.order_type = 'Required'
  if (!v('dry_weight')) errors.dry_weight = 'Required'
  else if (v('dry_weight').length > 191) errors.dry_weight = 'Too long (max 191)'
  if (!v('vascular_access')) errors.vascular_access = 'Required'
  if (!v('access_site')) errors.access_site = 'Required'
  // Modality is only mandatory on Conventional orders.
  if (v('order_type') === '1' && !v('modality')) errors.modality = 'Required'

  const state = computeDialysisOrderState(opts, values)
  const otherKey = opts.constraints?.other_value ?? 'other'
  for (const field of opts.constraints?.otherable_fields ?? []) {
    if (field === 'frequency') continue
    if (state.otherVisible[field] && !(values.other_values[field] ?? '').trim()) {
      errors[`other_values.${field}`] = 'Required'
    }
  }
  if (v('frequency') === otherKey && !v('other_frequency')) errors.other_frequency = 'Required'

  return errors
}

// ─── Serialization ──────────────────────────────────────────────────────────

/**
 * Build the POST/PUT body. §8: the **whole** form goes up every time — never
 * a partial patch — but only the fields the rules currently render, so a
 * hidden leftover can't trip the server's context-sensitive validation.
 */
export function buildDialysisOrderBody(
  opts: DialysisOrderOptions,
  values: DialysisOrderFormValues,
): Record<string, unknown> {
  const state = computeDialysisOrderState(opts, values)
  const body: Record<string, unknown> = {}
  const put = (key: string, value: unknown) => {
    if (value !== '' && value != null) body[key] = value
  }

  put('order_type', values.fields.order_type ?? '')
  for (const [field, value] of Object.entries(values.fields)) {
    if (field === 'order_type') continue
    if (state.visible[field] === false) continue
    put(field, value)
  }

  if (state.visible.dwell_volume && (values.dwell_volume.arterial || values.dwell_volume.venous)) {
    body.dwell_volume = { ...values.dwell_volume }
  }

  // `tpa_check` always goes up — even `false` — so the server can clear a
  // previously-saved TPA block.
  body.tpa_check = values.tpa_check

  const otherKey = opts.constraints?.other_value ?? 'other'
  const other: Record<string, string> = {}
  for (const field of opts.constraints?.otherable_fields ?? []) {
    if (field === 'frequency') continue
    const text = values.other_values[field]
    if (values.fields[field] === otherKey && text) other[field] = text
  }
  if (values.tpa_check && state.visible.tpa_panel) {
    for (const key of TPA_VALUE_KEYS) {
      const value = values.tpa[key]
      if (value) other[key] = value
    }
  }
  if (Object.keys(other).length) body.other_values = other

  return body
}

const asString = (v: unknown): string => (v == null ? '' : String(v))

/** Normalize one order row from the API into {@link DialysisOrder}. */
export function mapDialysisOrderFromApi(raw: any): DialysisOrder {
  const name = (v: any) => (v && typeof v === 'object' ? v.name ?? null : v ?? null)
  return {
    id: Number(raw?.id),
    patientId: raw?.patient_id != null ? Number(raw.patient_id) : null,
    orderType: asString(raw?.order_type),
    values: raw ?? {},
    resolved: raw?.resolved ?? {},
    visibility: raw?.visibility ?? null,
    tpa: raw?.tpa ?? null,
    otherValues: raw?.other_values ?? {},
    isAcknowledged: !!(raw?.is_acknowledged ?? raw?.isAcknowledged),
    acknowledgedAt: raw?.acknowledged_at ?? null,
    acknowledgedBy: name(raw?.acknowledged_by),
    // A missing `can_delete` means the API didn't say — assume deletable and
    // let the 400 speak, same as the web app.
    canDelete: raw?.can_delete ?? true,
    provider: name(raw?.provider),
    nurse: name(raw?.nurse),
    createdAt: raw?.created_at ?? null,
    updatedAt: raw?.updated_at ?? null,
  }
}

/** Hydrate the editable form from a stored order. */
export function dialysisOrderToFormValues(
  opts: DialysisOrderOptions,
  order: DialysisOrder,
): DialysisOrderFormValues {
  const values = emptyDialysisOrderValues()
  const raw = order.values ?? {}

  values.fields.order_type = asString(raw.order_type)
  const scalarFields = new Set<string>([
    ...Object.keys(opts.options ?? {}),
    ...Object.keys(opts.dependent_options ?? {}),
    ...DIALYSIS_COMMON_FIELDS,
  ])
  for (const field of scalarFields) {
    if (field === 'dwell_volume' || field === 'tpa_check') continue
    if (raw[field] != null) values.fields[field] = asString(raw[field])
  }

  if (raw.dwell_volume && typeof raw.dwell_volume === 'object') {
    values.dwell_volume = {
      arterial: asString(raw.dwell_volume.arterial),
      venous: asString(raw.dwell_volume.venous),
    }
  }

  const tpa = order.tpa ?? {}
  values.tpa_check = !!(tpa.check ?? raw.tpa_check)
  for (const key of TPA_VALUE_KEYS) {
    values.tpa[key] = asString(tpa[key] ?? order.otherValues?.[key] ?? '')
  }

  for (const [key, value] of Object.entries(order.otherValues ?? {})) {
    if ((TPA_VALUE_KEYS as string[]).includes(key)) continue
    values.other_values[key] = asString(value)
  }

  return values
}

/** Human label for an option key, falling back to the raw key. */
export function labelForOption(list: DialysisOptionItem[] | undefined, key: string): string {
  if (!key) return ''
  return toOptionList(list).find((o) => o.key === key)?.value ?? key
}
