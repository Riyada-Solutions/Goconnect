import type { LabResult } from '../models/labResult'

const PDF_SAMPLE = 'https://www.orimi.com/pdf-test.pdf'

export const MOCK_LAB_RESULTS: LabResult[] = [
  {
    id: 139,
    patientId: 1,
    labCompany: 'Al Borg Medical Laboratories',
    addedBy: 'Waleed abdelrahman',
    addedAt: '2026/01/22 03:54 PM',
    dueDate: '2026/01/22',
    status: 'result_ready',
    nurseAcknowledged: false,
    resultPdfUrl: PDF_SAMPLE,
  },
  {
    id: 140,
    patientId: 1,
    labCompany: 'Saudi German Hospital Lab',
    addedBy: 'Dr. Sarah Johnson',
    addedAt: '2026/01/18 09:12 AM',
    dueDate: '2026/01/20',
    status: 'acknowledged',
    nurseAcknowledged: true,
    resultPdfUrl: PDF_SAMPLE,
  },
  {
    id: 141,
    patientId: 1,
    labCompany: 'Al Mouwasat Lab',
    addedBy: 'Dr. Sarah Johnson',
    addedAt: '2026/01/25 10:30 AM',
    dueDate: '2026/01/27',
    status: 'pending',
    nurseAcknowledged: false,
    resultPdfUrl: null,
  },
  {
    id: 142,
    patientId: 2,
    labCompany: 'Al Borg Medical Laboratories',
    addedBy: 'Dr. Ibrahim',
    addedAt: '2026/01/20 02:15 PM',
    dueDate: '2026/01/21',
    status: 'result_ready',
    nurseAcknowledged: true,
    resultPdfUrl: PDF_SAMPLE,
  },
  {
    id: 143,
    patientId: 3,
    labCompany: 'King Fahad Medical City Lab',
    addedBy: 'Dr. Hassan',
    addedAt: '2026/01/19 11:00 AM',
    dueDate: '2026/01/20',
    status: 'in_progress',
    nurseAcknowledged: false,
    resultPdfUrl: null,
  },
  {
    id: 144,
    patientId: 3,
    labCompany: 'Al Borg Medical Laboratories',
    addedBy: 'Dr. Hassan',
    addedAt: '2026/01/15 08:45 AM',
    dueDate: '2026/01/16',
    status: 'result_ready',
    nurseAcknowledged: false,
    resultPdfUrl: PDF_SAMPLE,
  },
]

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function mockGetLabResultsByPatient(
  patientId: number,
): Promise<LabResult[]> {
  await delay(2000)
  return MOCK_LAB_RESULTS.filter((r) => r.patientId === patientId)
}

export async function mockAcknowledgeLabResult(id: number): Promise<LabResult> {
  await delay(500)
  const idx = MOCK_LAB_RESULTS.findIndex((r) => r.id === id)
  if (idx < 0) throw new Error('Lab result not found')
  const updated: LabResult = {
    ...MOCK_LAB_RESULTS[idx],
    nurseAcknowledged: true,
    status: 'acknowledged',
  }
  MOCK_LAB_RESULTS[idx] = updated
  return updated
}
