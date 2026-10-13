import { ChivaStatus } from "./Chiva";

export interface ChivaFilterOptions {
  status?: ChivaStatus;
  minCapacity?: number;
  date?: Date;
}
