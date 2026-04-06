import { Visit, DialysisMedication, InventoryItem } from "../entities";
import { IVisitRepository } from "../repository";
import { MOCK_VISITS, MOCK_DIALYSIS_MEDICATIONS, MOCK_INVENTORY } from "./mockVisitData";

export class VisitRepository implements IVisitRepository {
  async getVisits(): Promise<Visit[]> {
    return MOCK_VISITS;
  }

  async getVisitById(id: number): Promise<Visit | undefined> {
    return MOCK_VISITS.find((v) => v.id === id);
  }

  async getMedications(): Promise<DialysisMedication[]> {
    return MOCK_DIALYSIS_MEDICATIONS;
  }

  async getInventory(): Promise<InventoryItem[]> {
    return MOCK_INVENTORY;
  }
}

export const visitRepository = new VisitRepository();
