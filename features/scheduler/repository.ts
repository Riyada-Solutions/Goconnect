import { Slot } from "./entities";

export interface ISchedulerRepository {
  getSlots(): Promise<Slot[]>;
  getSlotById(id: number): Promise<Slot | undefined>;
}
