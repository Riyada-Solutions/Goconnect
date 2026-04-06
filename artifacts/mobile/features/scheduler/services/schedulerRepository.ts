import { Slot } from "../entities";
import { ISchedulerRepository } from "../repository";
import { MOCK_SLOTS } from "./mockSchedulerData";

export class SchedulerRepository implements ISchedulerRepository {
  async getSlots(): Promise<Slot[]> {
    return MOCK_SLOTS;
  }

  async getSlotById(id: number): Promise<Slot | undefined> {
    return MOCK_SLOTS.find((s) => s.id === id);
  }
}

export const schedulerRepository = new SchedulerRepository();
