import type { Visit, DialysisMedication, InventoryItem } from '../../types/visit'
import type { FlowSheet } from '../../types/flowSheet'
import type { NursingProgressNote, NursingProgressNoteInput } from '../../types/nursingProgressNote'
import type {
  SocialWorkerProgressNote,
  SocialWorkerProgressNoteInput,
} from '../../types/socialWorkerProgressNote'
import type { Referral, ReferralInput } from '../../types/referral'
import type { DoctorProgressNote, DoctorProgressNoteInput } from '../../types/doctorProgressNote'
import type { Refusal, RefusalInput } from '../../types/refusal'
import type { VisitSignature, VisitSignatureInput } from '../../types/visitSignature'

export const MOCK_VISITS: Visit[] = [
  {
    id: 1,
    patientName: 'Ahmed Al-Rashid',
    patientId: 1,
    phone: '+966 50 123 4567',
    date: '2024-12-22',
    time: '09:00',
    type: 'Home Visit',
    status: 'completed',
    provider: 'Dr. Sarah Johnson',
    notes: 'Patient stable. Blood sugar levels within target range. Insulin dosage adjusted.',
    diagnosis: 'Type 2 Diabetes',
    address: 'Riyadh, Al Olaya District, Villa 45',
    duration: 45,
    medicalTeam: [
      { name: 'Dr. Sarah Johnson', role: 'Primary Physician', phone: '+966501234567' },
      { name: 'Nurse Aisha Al-Rashid', role: 'Attending Nurse', phone: '+966509876543' },
    ],
    nursingProgressNotes: [
      {
        id: 11,
        visitId: 1,
        note: 'Patient reports feeling well. Glucose checked before insulin administration — 142 mg/dL. No signs of hypoglycemia. Encouraged hydration.',
        author: 'Nurse Aisha Al-Rashid',
        createdAt: '2024-12-22T09:25:00.000Z',
      },
      {
        id: 12,
        visitId: 1,
        note: 'Injection site rotated to right abdomen. Patient tolerated well. Provided education on carb counting.',
        author: 'Nurse Aisha Al-Rashid',
        createdAt: '2024-12-22T09:40:00.000Z',
      },
    ],
    socialWorkerProgressNotes: [
      {
        id: 21,
        visitId: 1,
        note: 'Called to verify home support. Family able to assist with medication reminders. No financial concerns reported.',
        location: 'on_call',
        author: 'Sara Al-Mutairi, MSW',
        createdAt: '2024-12-22T09:55:00.000Z',
      },
    ],
    preTreatmentVitals: {
      temperature: '36.8 °C',
      respiratoryRate: '18 cpm',
      oxygenSaturation: '98%',
      bloodPressure: '128/82 mmHg',
      pulseRate: '76 bpm',
      preWeight: '72.4',
      dryWeight: '70.0',
      ufGoal: '2.4',
      rbs: '142',
    },
    doctorProgressNotes: [
      {
        id: 411,
        visitId: 1,
        note: 'Patient clinically stable post-dialysis. Continue current regimen. Review labs at next visit.',
        isAddendum: false,
        author: 'Dr. Sarah Johnson',
        createdAt: '2024-12-22T09:50:00.000Z',
      },
    ],
  },
  {
    id: 2,
    patientName: 'Fatima Al-Zahra',
    patientId: 2,
    phone: '+966 55 987 6543',
    date: '2024-12-22',
    time: '11:00',
    type: 'Clinic Visit',
    status: 'completed',
    provider: 'Dr. Sarah Johnson',
    notes: 'BP 130/85. Medication adjusted. Follow-up in 2 weeks.',
    diagnosis: 'Hypertension',
    address: 'Jeddah, Al Hamra Clinic',
    duration: 30,
    medicalTeam: [
      { name: 'Dr. Sarah Johnson', role: 'Primary Physician', phone: '+966501234567' },
      { name: 'Nurse Layla Nasser', role: 'Attending Nurse', phone: '+966507654321' },
      { name: 'Dr. Hani Al-Ghamdi', role: 'Cardiologist', phone: '+966502345678' },
    ],
    nursingProgressNotes: [
      {
        id: 31,
        visitId: 2,
        note: 'BP monitored in both arms: Right 132/86, Left 130/84. Patient denies dizziness. ECG reviewed with cardiologist.',
        author: 'Nurse Layla Nasser',
        createdAt: '2024-12-22T11:15:00.000Z',
      },
    ],
    socialWorkerProgressNotes: [
      {
        id: 41,
        visitId: 2,
        note: 'Follow-up regarding transportation to clinic visits. Arranged patient transport service.',
        location: 'in_center',
        author: 'Sara Al-Mutairi, MSW',
        createdAt: '2024-12-22T11:30:00.000Z',
      },
    ],
  },
  {
    id: 3,
    patientName: 'Khalid Al-Mansouri',
    patientId: 3,
    phone: '+966 54 456 7890',
    date: '2024-12-23',
    time: '08:30',
    type: 'Home Visit',
    status: 'in_progress',
    provider: 'Dr. Mohammed Al-Amri',
    notes: 'Urgent cardiac assessment required.',
    diagnosis: 'Chronic Heart Failure',
    address: 'Dammam, Al Faisaliyah, Building 12',
    duration: 60,
    medicalTeam: [
      { name: 'Dr. Mohammed Al-Amri', role: 'Primary Physician', phone: '+966503456789' },
      { name: 'Nurse Reem Al-Dosari', role: 'Attending Nurse', phone: '+966508765432' },
      { name: 'Dr. Faisal Al-Harbi', role: 'Cardiologist', phone: '+966504567890' },
    ],
    nursingProgressNotes: [
      {
        id: 51,
        visitId: 3,
        note: 'Initial cardiac assessment in progress. Vitals stable. Oxygen saturation 96% on room air.',
        author: 'Nurse Reem Al-Dosari',
        createdAt: '2024-12-23T08:45:00.000Z',
      },
    ],
    socialWorkerProgressNotes: [
      {
        id: 61,
        visitId: 3,
        note: 'Spoke with family about home care plan. Coordinating with cardiology for follow-up.',
        location: 'on_call',
        author: 'Sara Al-Mutairi, MSW',
        createdAt: '2024-12-23T09:00:00.000Z',
      },
    ],
  },
  {
    id: 4,
    patientName: 'Nora Al-Qahtani',
    patientId: 4,
    phone: '+966 50 234 5678',
    date: '2024-12-23',
    time: '10:00',
    type: 'Follow-up',
    status: 'start_procedure',
    provider: 'Dr. Sarah Johnson',
    notes: 'Inhaler technique improvement noted.',
    diagnosis: 'Asthma',
    address: 'Riyadh, Al Nuzha, Apt 203',
    duration: 30,
    medicalTeam: [
      { name: 'Dr. Sarah Johnson', role: 'Primary Physician', phone: '+966501234567' },
      { name: 'Nurse Maha Al-Otaibi', role: 'Attending Nurse', phone: '+966506543210' },
    ],
    nursingProgressNotes: [
      {
        id: 71,
        visitId: 4,
        note: 'Peak flow meter reading: 380 L/min. Patient demonstrates correct inhaler technique.',
        author: 'Nurse Maha Al-Otaibi',
        createdAt: '2024-12-23T10:15:00.000Z',
      },
    ],
    socialWorkerProgressNotes: [
      {
        id: 81,
        visitId: 4,
        note: 'Reviewed asthma action plan with patient. No barriers to medication adherence reported.',
        location: 'in_center',
        author: 'Sara Al-Mutairi, MSW',
        createdAt: '2024-12-23T10:30:00.000Z',
      },
    ],
  },
  {
    id: 5,
    patientName: 'Tariq Al-Otaibi',
    patientId: 7,
    phone: '+966 56 678 9012',
    date: '2024-12-21',
    time: '14:00',
    type: 'Emergency',
    status: 'completed',
    provider: 'Dr. Mohammed Al-Amri',
    notes: 'Breathing difficulties. Nebulizer treatment administered. Transferred to hospital.',
    diagnosis: 'COPD Exacerbation',
    address: 'Riyadh, Al Malaz, House 78',
    duration: 90,
    medicalTeam: [
      { name: 'Dr. Mohammed Al-Amri', role: 'Primary Physician', phone: '+966503456789' },
      { name: 'Nurse Sara Al-Anezi', role: 'Attending Nurse', phone: '+966505432109' },
    ],
    nursingProgressNotes: [
      {
        id: 91,
        visitId: 5,
        note: 'Emergency response: SpO2 dropped to 88%. Nebulizer with salbutamol administered. O2 via nasal cannula 2L/min.',
        author: 'Nurse Sara Al-Anezi',
        createdAt: '2024-12-21T14:10:00.000Z',
      },
      {
        id: 92,
        visitId: 5,
        note: 'Patient stabilized. Ambulance called for hospital transfer. Vitals documented for handover.',
        author: 'Nurse Sara Al-Anezi',
        createdAt: '2024-12-21T14:45:00.000Z',
      },
    ],
    socialWorkerProgressNotes: [
      {
        id: 101,
        visitId: 5,
        note: 'Contacted family for hospital transfer. Coordinated with insurance for admission.',
        location: 'on_call',
        author: 'Sara Al-Mutairi, MSW',
        createdAt: '2024-12-21T15:00:00.000Z',
      },
    ],
  },
  {
    id: 6,
    patientName: 'Layla Al-Hassan',
    patientId: 6,
    phone: '+966 58 345 6789',
    date: '2024-12-24',
    time: '13:30',
    type: 'Home Visit',
    status: 'end_procedure',
    provider: 'Dr. Amira Khalil',
    notes: 'Joint pain reassessment and physiotherapy guidance.',
    diagnosis: 'Rheumatoid Arthritis',
    address: 'Medina, Al Rawabi, Villa 22',
    duration: 45,
    medicalTeam: [
      { name: 'Dr. Amira Khalil', role: 'Primary Physician', phone: '+966507890123' },
      { name: 'Nurse Nadia Al-Shehri', role: 'Attending Nurse', phone: '+966504321098' },
    ],
    nursingProgressNotes: [
      {
        id: 111,
        visitId: 6,
        note: 'Joint ROM assessment completed. Morning stiffness duration: 45 mins. Pain scale 4/10.',
        author: 'Nurse Nadia Al-Shehri',
        createdAt: '2024-12-24T13:40:00.000Z',
      },
    ],
    socialWorkerProgressNotes: [
      {
        id: 121,
        visitId: 6,
        note: 'Referred to physiotherapy services. Discussed home adaptations for joint protection.',
        location: 'in_center',
        author: 'Sara Al-Mutairi, MSW',
        createdAt: '2024-12-24T14:00:00.000Z',
      },
    ],
  },
  {
    id: 7,
    patientName: 'Hessa Al-Shammari',
    patientId: 8,
    phone: '+966 53 789 0123',
    date: '2024-12-20',
    time: '16:00',
    type: 'Clinic Visit',
    status: 'completed',
    provider: 'Dr. Sarah Johnson',
    notes: 'Migraine triggers identified. New preventative medication prescribed.',
    diagnosis: 'Chronic Migraine',
    address: 'Jeddah, Al Rehab Clinic',
    duration: 40,
    medicalTeam: [
      { name: 'Dr. Sarah Johnson', role: 'Primary Physician', phone: '+966501234567' },
      { name: 'Nurse Huda Al-Zahrani', role: 'Attending Nurse', phone: '+966503210987' },
    ],
    nursingProgressNotes: [
      {
        id: 131,
        visitId: 7,
        note: 'Migraine frequency log reviewed. Patient reports 3-4 episodes per week, mostly afternoon.',
        author: 'Nurse Huda Al-Zahrani',
        createdAt: '2024-12-20T16:10:00.000Z',
      },
    ],
    socialWorkerProgressNotes: [
      {
        id: 141,
        visitId: 7,
        note: 'Discussed work accommodations with patient. Arranged meeting with occupational therapist.',
        location: 'in_center',
        author: 'Sara Al-Mutairi, MSW',
        createdAt: '2024-12-20T16:25:00.000Z',
      },
    ],
  },
]

export const MOCK_DIALYSIS_MEDICATIONS: DialysisMedication[] = [
  {
    id: 1,
    drugName: 'ADENOCOR 6MG-2ML VIAL',
    form: 'Lozenge',
    dosage: '1',
    frequency: 'Once monthly',
    route: 'Intracardiac',
    duration: 'Until next visit',
    durationPeriod: '',
    adminType: '',
    instructions: '',
  },
  {
    id: 2,
    drugName: 'ADENOCOR 6MG-2ML VIAL',
    form: 'Spray',
    dosage: '1',
    frequency: 'Three times weekly',
    route: 'Otic',
    duration: 'Until cancelled / chronic',
    durationPeriod: 'During Dialysis',
    adminType: '',
    instructions: '1',
  },
  {
    id: 3,
    drugName: 'ARANESP 40MCG-0.4ML PRE-FILLED SYRINGE',
    form: 'Injection',
    dosage: '40MCG',
    frequency: 'three times a week',
    route: '',
    duration: '',
    durationPeriod: '',
    adminType: '',
    instructions: '',
  },
]

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 1, name: 'Dialysis Kit', itemNumber: 'DK-10234', available: 7 },
  { id: 2, name: 'Blood Glucose Strips', itemNumber: 'BGS-45678', available: 12 },
  { id: 3, name: 'Insulin Syringes (10 pack)', itemNumber: 'IS-78901', available: 25 },
  { id: 4, name: 'Sterile Gauze Pads', itemNumber: 'SGP-23456', available: 50 },
  { id: 5, name: 'IV Start Kit', itemNumber: 'IV-34567', available: 3 },
  { id: 6, name: 'BP Cuff (Disposable)', itemNumber: 'BP-56789', available: 15 },
]

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function mockGetVisits(): Promise<Visit[]> {
  await delay(500)
  return MOCK_VISITS
}

export async function mockGetVisitById(id: number): Promise<Visit | undefined> {
  await delay(700)
  return MOCK_VISITS.find((v) => v.id === id)
}

export async function mockGetMedications(): Promise<DialysisMedication[]> {
  await delay(400)
  return MOCK_DIALYSIS_MEDICATIONS
}

export async function mockGetInventory(): Promise<InventoryItem[]> {
  await delay(400)
  return MOCK_INVENTORY
}

export async function mockSubmitFlowSheet(payload: FlowSheet): Promise<void> {
  await new Promise((r) => setTimeout(r, 500))
  const idx = findVisitIndex(payload.visitId)
  if (idx >= 0) {
    MOCK_VISITS[idx] = { ...MOCK_VISITS[idx], flowSheet: payload }
  }
  const patientBytes = payload.patientSignature?.dataUrl.length ?? 0
  const nurseBytes = payload.nurseSignature?.dataUrl.length ?? 0
  console.log(
    `[mockSubmitFlowSheet] saved flow sheet for visit ${payload.visitId} — patient signature: ${patientBytes}b, nurse signature: ${nurseBytes}b`,
  )
}

let nextNursingNoteId = 100
let nextSocialWorkerNoteId = 200
let nextReferralId = 300
let nextDoctorNoteId = 400
let nextRefusalId = 500
let nextSignatureId = 600

function findVisitIndex(visitId: number): number {
  return MOCK_VISITS.findIndex((v) => v.id === visitId)
}

export async function mockSubmitNursingProgressNote(payload: NursingProgressNoteInput): Promise<NursingProgressNote> {
  await new Promise((r) => setTimeout(r, 500))
  const record: NursingProgressNote = {
    id: nextNursingNoteId++,
    visitId: payload.visitId,
    note: payload.note,
    author: 'Nurse (mock)',
    createdAt: new Date().toISOString(),
  }
  const idx = findVisitIndex(payload.visitId)
  if (idx >= 0) {
    const existing = MOCK_VISITS[idx].nursingProgressNotes ?? []
    MOCK_VISITS[idx] = { ...MOCK_VISITS[idx], nursingProgressNotes: [record, ...existing] }
  }
  return record
}

export async function mockSubmitDoctorProgressNote(
  payload: DoctorProgressNoteInput,
): Promise<DoctorProgressNote> {
  await new Promise((r) => setTimeout(r, 500))
  const idx = findVisitIndex(payload.visitId)
  const vitalsSnapshot = idx >= 0 ? MOCK_VISITS[idx].preTreatmentVitals : undefined
  const record: DoctorProgressNote = {
    id: nextDoctorNoteId++,
    visitId: payload.visitId,
    note: payload.note,
    vitalsSnapshot,
    isAddendum: payload.isAddendum,
    parentNoteId: payload.parentNoteId,
    author: 'Dr. (mock)',
    createdAt: new Date().toISOString(),
  }
  if (idx >= 0) {
    const existing = MOCK_VISITS[idx].doctorProgressNotes ?? []
    MOCK_VISITS[idx] = { ...MOCK_VISITS[idx], doctorProgressNotes: [record, ...existing] }
  }
  return record
}

export async function mockSubmitVisitSignature(
  payload: VisitSignatureInput,
): Promise<VisitSignature> {
  await new Promise((r) => setTimeout(r, 300))
  const record: VisitSignature = {
    id: nextSignatureId++,
    visitId: payload.visitId,
    kind: payload.kind,
    dataUrl: payload.dataUrl,
    signedAt: payload.signedAt,
  }
  console.log(`[mockSubmitVisitSignature] saved ${record.kind} signature for visit ${record.visitId} (${record.dataUrl.length} bytes)`)
  return record
}

export async function mockSubmitRefusal(payload: RefusalInput): Promise<Refusal> {
  await new Promise((r) => setTimeout(r, 500))
  const record: Refusal = {
    id: nextRefusalId++,
    visitId: payload.visitId,
    types: payload.types,
    reason: payload.reason,
    risks: payload.risks,
    witness: payload.witness,
    unableToSignReason: payload.unableToSignReason,
    relative: payload.relative,
    doctor: payload.doctor,
    interpreter: payload.interpreter,
    author: 'Nurse (mock)',
    createdAt: new Date().toISOString(),
  }
  const idx = findVisitIndex(payload.visitId)
  if (idx >= 0) {
    const existing = MOCK_VISITS[idx].refusals ?? []
    MOCK_VISITS[idx] = { ...MOCK_VISITS[idx], refusals: [record, ...existing] }
  }
  return record
}

export async function mockSubmitReferral(payload: ReferralInput): Promise<Referral> {
  await new Promise((r) => setTimeout(r, 500))
  const record: Referral = {
    id: nextReferralId++,
    visitId: payload.visitId,
    referralDate: payload.referralDate,
    primaryPhysician: 'Physician',
    referralBy: 'Waleed abdelrahman',
    status: 'Active',
    referralType: payload.referralType,
    referralHospital: payload.referralHospital,
    printOptions: payload.printOptions,
    referralReason: payload.referralReason,
    completionDate: payload.completionDate,
    comments: payload.comments,
    attachmentUri: payload.attachmentUri,
    attachmentName: payload.attachmentName,
    createdAt: new Date().toISOString(),
  }
  const idx = findVisitIndex(payload.visitId)
  if (idx >= 0) {
    const existing = MOCK_VISITS[idx].referrals ?? []
    MOCK_VISITS[idx] = { ...MOCK_VISITS[idx], referrals: [record, ...existing] }
  }
  return record
}

export async function mockSubmitSocialWorkerProgressNote(
  payload: SocialWorkerProgressNoteInput,
): Promise<SocialWorkerProgressNote> {
  await new Promise((r) => setTimeout(r, 500))
  const record: SocialWorkerProgressNote = {
    id: nextSocialWorkerNoteId++,
    visitId: payload.visitId,
    note: payload.note,
    location: payload.location,
    author: 'Social Worker (mock)',
    createdAt: new Date().toISOString(),
  }
  const idx = findVisitIndex(payload.visitId)
  if (idx >= 0) {
    const existing = MOCK_VISITS[idx].socialWorkerProgressNotes ?? []
    MOCK_VISITS[idx] = { ...MOCK_VISITS[idx], socialWorkerProgressNotes: [record, ...existing] }
  }
  return record
}
