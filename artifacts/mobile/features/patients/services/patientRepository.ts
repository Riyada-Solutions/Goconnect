import { Patient, PatientAlert } from "../entities";
import { IPatientRepository } from "../repository";
import { MOCK_PATIENTS, MOCK_PATIENT_ALERTS } from "./mockPatientData";

export class PatientRepository implements IPatientRepository {
  async getPatients(): Promise<Patient[]> {
    return MOCK_PATIENTS;
  }

  async getPatientById(id: number): Promise<Patient | undefined> {
    return MOCK_PATIENTS.find((p) => p.id === id);
  }

  async getPatientAlerts(patientId: number): Promise<PatientAlert | undefined> {
    return MOCK_PATIENT_ALERTS[patientId];
  }
}

export const patientRepository = new PatientRepository();
