import { Patient, PatientAlert } from "./entities";

export interface IPatientRepository {
  getPatients(): Promise<Patient[]>;
  getPatientById(id: number): Promise<Patient | undefined>;
  getPatientAlerts(patientId: number): Promise<PatientAlert | undefined>;
}
