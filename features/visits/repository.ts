import { Visit, DialysisMedication, InventoryItem } from "./entities";

export interface IVisitRepository {
  getVisits(): Promise<Visit[]>;
  getVisitById(id: number): Promise<Visit | undefined>;
  getMedications(): Promise<DialysisMedication[]>;
  getInventory(): Promise<InventoryItem[]>;
}
