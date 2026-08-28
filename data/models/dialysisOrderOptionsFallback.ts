import type { DialysisOrderOptions } from './dialysisOrder'

/**
 * Frozen copy of `GET /dialysis-orders/options`.
 *
 * **Not** a rule source — the app always prefers the live payload (and the
 * cached copy of it). This only stands in when the very first open happens
 * offline, so a nurse can still fill an order and let it queue instead of
 * facing an empty screen. Any drift resolves itself the moment the real
 * payload lands.
 */
export const FALLBACK_DIALYSIS_ORDER_OPTIONS: DialysisOrderOptions = {
  field_sets: {
    '1': ['dialysate_sodium', 'potassium', 'bicarbonate', 'calcium', 'temperature'],
    '2': [
      'dialysate_volume', 'dialyzer_cartridge', 'electrolyte_sodium', 'electrolyte_potassium',
      'electrolyte_calcium', 'electrolyte_glucose', 'dialysate_temperature', 'dialysate_bath',
    ],
  },
  options: {
    order_type: [
      { key: '1', value: 'Conventional Dialysis' },
      { key: '2', value: 'Portable Low Dialysate Dialysis' },
    ],
    vascular_access: [
      { key: 'av_fistula', value: 'AV-Fistula' },
      { key: 'av_graft', value: 'AV-Graft' },
      { key: 'cvc_temporary', value: 'Central Venous Catheter (CVC) – Temporary' },
      { key: 'permacath', value: 'Permacath' },
      { key: 'other', value: 'Other' },
    ],
    access_site: [
      { key: 'right', value: 'Right' },
      { key: 'left', value: 'Left' },
      { key: 'other', value: 'Other' },
    ],
    needle_gauge: [
      { key: '15g', value: '15G' }, { key: '16g', value: '16G' },
      { key: '17g', value: '17G' }, { key: 'other', value: 'Other' },
    ],
    dwell_type: [
      { key: 'heparin', value: 'Heparin' },
      { key: 'saline', value: 'Normal Saline' },
      { key: 'other', value: 'Other' },
    ],
    frequency: [
      { key: 'twice', value: 'Twice per week' }, { key: 'three', value: 'Three per week' },
      { key: 'four', value: 'Four per week' }, { key: 'five', value: 'Five per week' },
      { key: 'other', value: 'Other' },
    ],
    duration: [
      { key: '3', value: '3 hours' }, { key: '3.5', value: '3.5 hours' },
      { key: '4', value: '4 hours' }, { key: '4.5', value: '4.5 hours' },
      { key: '5', value: '5 hours' }, { key: 'other', value: 'Other' },
    ],
    blood_flow_rate: [
      { key: '200', value: '200 mL/min' }, { key: '250', value: '250 mL/min' },
      { key: '300', value: '300 mL/min' }, { key: '350', value: '350 mL/min' },
      { key: '400', value: '400 mL/min' }, { key: '450', value: '450 mL/min' },
      { key: '500', value: '500 mL/min' }, { key: 'other', value: 'Other' },
    ],
    dialysate_type: [
      { key: 'bicarbonate', value: 'Bicarbonate' },
      { key: 'lactate', value: 'Lactate' },
      { key: 'other', value: 'Other' },
    ],
    picar: [{ key: '35', value: '35' }, { key: 'other', value: 'Other' }],
    lactate_percent: [
      { key: '40', value: '40%' }, { key: '45', value: '45%' }, { key: 'other', value: 'Other' },
    ],
    administration_type: [
      { key: 'UFH', value: 'Unfractionated Heparin (UFH)' },
      { key: 'LMWH', value: 'Low Molecular Weight Heparin (LMWH)' },
      { key: 'Saline', value: 'Saline Flushes' },
      { key: 'None', value: 'None / Free' },
    ],
    dialysate_sodium: [
      { key: '130', value: '130 mmol/L' }, { key: '135', value: '135 mmol/L' },
      { key: '138', value: '138 mmol/L' }, { key: '140', value: '140 mmol/L' },
      { key: 'other', value: 'Other' },
    ],
    potassium: [
      { key: '1', value: '1 mmol/L' }, { key: '2', value: '2 mmol/L' },
      { key: '3', value: '3 mmol/L' }, { key: 'other', value: 'Other' },
    ],
    bicarbonate: [
      { key: '30', value: '30 mmol/L' }, { key: '35', value: '35 mmol/L' },
      { key: '38', value: '38 mmol/L' }, { key: '40', value: '40 mmol/L' },
      { key: 'other', value: 'Other' },
    ],
    calcium: [
      { key: '1.25', value: '1.25 mmol/L' }, { key: '1.5', value: '1.5 mmol/L' },
      { key: '1.75', value: '1.75 mmol/L' }, { key: 'other', value: 'Other' },
    ],
    temperature: [
      { key: '35.5', value: '35.5 °C' }, { key: '36.0', value: '36.0 °C' },
      { key: '36.5', value: '36.5 °C' }, { key: '37.0', value: '37.0 °C' },
      { key: 'other', value: 'Other' },
    ],
    dialyzer_type: [
      { key: 'High Flux', value: 'High Flux' }, { key: 'Low Flux', value: 'Low Flux' },
      { key: 'other', value: 'Other' },
    ],
    dialyzer_surface_area: [
      { key: '1.0', value: '1.0 m²' }, { key: '1.2', value: '1.2 m²' }, { key: '1.4', value: '1.4 m²' },
      { key: '1.5', value: '1.5 m²' }, { key: '1.6', value: '1.6 m²' }, { key: '1.7', value: '1.7 m²' },
      { key: '1.8', value: '1.8 m²' }, { key: '2.0', value: '2.0 m²' }, { key: '2.2', value: '2.2 m²' },
      { key: 'other', value: 'Other' },
    ],
    dialysate_volume: [
      { key: '20', value: '20 L' }, { key: '25', value: '25 L' }, { key: '30', value: '30 L' },
      { key: '35', value: '35 L' }, { key: '40', value: '40 L' }, { key: '45', value: '45 L' },
      { key: '50', value: '50 L' }, { key: '55', value: '55 L' }, { key: '60', value: '60 L' },
      { key: 'other', value: 'Other' },
    ],
    dialyzer_cartridge: [
      { key: '172', value: 'Cartridge 172' }, { key: '124', value: 'Cartridge 124' },
      { key: 'other', value: 'Other' },
    ],
    electrolyte_sodium: [{ key: '140', value: '140 mmol/L' }, { key: 'other', value: 'Other' }],
    electrolyte_potassium: [
      { key: '1', value: '1 mmol/L' }, { key: '2', value: '2 mmol/L' },
      { key: '3', value: '3 mmol/L' }, { key: 'other', value: 'Other' },
    ],
    electrolyte_calcium: [{ key: '1.5', value: '1.5 mmol/L' }, { key: 'other', value: 'Other' }],
    electrolyte_glucose: [{ key: '1', value: '1 g' }, { key: 'other', value: 'Other' }],
    dialysate_temperature: [
      { key: '35.5', value: '35.5 °C' }, { key: '36.0', value: '36.0 °C' },
      { key: '36.5', value: '36.5 °C' }, { key: '37.0', value: '37.0 °C' },
      { key: 'other', value: 'Other' },
    ],
    // Rule 24 — the one list with no "Other" option.
    dialysate_bath: [
      { key: '140', value: 'Sodium 140' }, { key: '123', value: 'Potassium 1, 2, 3' },
      { key: '1.5', value: 'Calcium 1.5' }, { key: '1', value: 'Glucose 1' },
    ],
    tpa_frequency: [
      { key: 'twice', value: 'Twice per week' }, { key: 'three', value: 'Three per week' },
      { key: 'four', value: 'Four per week' }, { key: 'five', value: 'Five per week' },
      { key: 'other', value: 'Other' },
    ],
  },
  dependent_options: {
    modality: {
      depends_on: 'order_type',
      by_value: {
        '1': [
          { key: '1', value: 'Hemodialysis (HD)' },
          { key: '2', value: 'Hemodiafiltration (HDF)' },
          { key: 'other', value: 'Other' },
        ],
        '2': [
          { key: '1', value: 'Hemodialysis (HD)' },
          { key: 'other', value: 'Other' },
        ],
      },
    },
    access_subtype: {
      depends_on: 'vascular_access',
      by_value: {
        cvc_temporary: [
          { key: 'internal_jugular', value: 'Internal Jugular' },
          { key: 'femoral', value: 'Femoral' }, { key: 'other', value: 'Other' },
        ],
        permacath: [
          { key: 'internal_jugular', value: 'Internal Jugular' },
          { key: 'femoral', value: 'Femoral' }, { key: 'other', value: 'Other' },
        ],
        av_fistula: [
          { key: 'radiocephalic', value: 'Radiocephalic' },
          { key: 'brachiochephalic', value: 'Brachiochephalic' },
          { key: 'brachiobasilic', value: 'Brachiobasilic' },
          { key: 'other', value: 'Other' },
        ],
        av_graft: [
          { key: 'arm', value: 'Arm' }, { key: 'forearm', value: 'Forearm' },
          { key: 'distal', value: 'Distal' }, { key: 'other', value: 'Other' },
        ],
        other: [{ key: 'other', value: 'Other' }],
      },
    },
    bolus_value: {
      depends_on: 'administration_type',
      by_value: {
        UFH: {
          unit: 'IU',
          options: [
            { key: '200', value: '200 IU' }, { key: '300', value: '300 IU' },
            { key: '400', value: '400 IU' }, { key: '500', value: '500 IU' },
            { key: '600', value: '600 IU' }, { key: '700', value: '700 IU' },
            { key: '800', value: '800 IU' }, { key: '900', value: '900 IU' },
            { key: '1000', value: '1000 IU' }, { key: 'other', value: 'Other' },
          ],
        },
        LMWH: {
          unit: 'mg',
          options: [
            { key: '20', value: '20 mg' }, { key: '30', value: '30 mg' },
            { key: '40', value: '40 mg' }, { key: '50', value: '50 mg' },
            { key: '60', value: '60 mg' }, { key: '70', value: '70 mg' },
            { key: '80', value: '80 mg' }, { key: '90', value: '90 mg' },
            { key: '100', value: '100 mg' }, { key: 'other', value: 'Other' },
          ],
        },
      },
    },
    hourly_value: {
      depends_on: 'administration_type',
      by_value: {
        UFH: {
          unit: 'IU',
          label: 'Hourly Maintenance IU',
          default: null,
          options: [
            { key: '200', value: '200' }, { key: '250', value: '250' },
            { key: '300', value: '300' }, { key: '350', value: '350' },
            { key: '400', value: '400' }, { key: '450', value: '450' },
            { key: '500', value: '500' }, { key: 'other', value: 'Other' },
          ],
        },
        Saline: {
          unit: 'ML',
          label: 'Hourly Maintenance ML',
          default: '50_1',
          options: [
            { key: '50_0.5', value: '50 every half hour' },
            { key: '50_1', value: '50 every hour' },
            { key: '100_0.5', value: '100 every half hour' },
            { key: '100_1', value: '100 every hour' },
            { key: 'other', value: 'Other' },
          ],
        },
      },
    },
  },
  visibility_rules: [],
  constraints: {
    other_value: 'other',
    otherable_fields: [
      'modality', 'vascular_access', 'access_subtype', 'access_site', 'needle_gauge',
      'dwell_type', 'frequency', 'duration', 'blood_flow_rate', 'dialysate_type', 'picar',
      'lactate_percent', 'bolus_value', 'hourly_value', 'dialysate_sodium', 'potassium',
      'bicarbonate', 'calcium', 'temperature', 'dialyzer_type', 'dialyzer_surface_area',
      'dialysate_volume', 'dialyzer_cartridge', 'electrolyte_sodium', 'electrolyte_potassium',
      'electrolyte_calcium', 'electrolyte_glucose', 'dialysate_temperature', 'tpa_frequency',
    ],
    clear_on_change: {
      vascular_access: ['access_subtype', 'blood_flow_rate'],
      dialysate_type: ['picar', 'lactate_percent'],
      dry_weight: ['dialyzer_cartridge'],
      order_type: ['modality'],
    },
    blood_flow_rate: {
      restricted_options: ['400', '450', '500'],
      restricted_when: { vascular_access: ['cvc_temporary', 'permacath'] },
    },
    dialyzer_cartridge: {
      dry_weight_threshold: 20,
      restricted_options: ['172', '124'],
      reveals_dialyzer_fields: '124',
    },
    volume_value: {
      heparin: { input: 'number', unit: 'IU/ml', default: null },
      saline: { input: 'text', unit: '%', default: '0.9' },
      other: { input: null, unit: null, default: null },
    },
    tpa: {
      defaults: {
        arterial_line_tpa: '1.0',
        arterial_line_saline: '0.8',
        venous_line_tpa: '1.0',
        venous_line_saline: '0.9',
      },
      hidden_when: { vascular_access: ['av_fistula', 'av_graft'] },
    },
  },
}
