import "server-only";
import { AlmService } from "./alm-service";
import { orderDatabase, rewardDatabase } from "./firebase-admin";

export function almService() {
  return new AlmService(rewardDatabase(), orderDatabase());
}
