/** The repair engine: the finite ladder the layout walks when a window breaks the contract. */
export type { RepairInput, RepairResult, RepairRung, RepairValidator } from "./repair";
export {
  REPAIR_LADDER,
  describeRepair,
  repairForSize,
  repairProfile,
  repairRungIds,
} from "./repair";
