import { usdToLamports } from "@mercato/shared";
import { SurgeService } from "../backend/src/pricing/surge.service";

const CAPABILITY = "geocoder";
const BASE_USD = 0.002;
const EXPECTED_SURGED = BASE_USD * (1 + 0.5 * 4);

let exitCode = 0;
let fakeNow = 1_000_000;
const realNow = Date.now.bind(Date);

Date.now = () => fakeNow;

function check(label: string, ok: boolean): void {
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}`);
  if (!ok) exitCode = 1;
}

function closeEnough(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-12;
}

const surge = new SurgeService();

const empty = surge.getCurrentPrice(CAPABILITY, BASE_USD);
check("empty window usd is base price", closeEnough(empty.usd, BASE_USD));

for (let i = 0; i < 4; i++) {
  surge.recordRequest(CAPABILITY);
}

const surged = surge.getCurrentPrice(CAPABILITY, BASE_USD);
check("4 requests usd surges to 0.006", closeEnough(surged.usd, EXPECTED_SURGED));
check("surged lamports is integer", Number.isInteger(surged.lamports));

fakeNow += 61_000;
const expired = surge.getCurrentPrice(CAPABILITY, BASE_USD);
check("after 61s window resets to base usd", closeEnough(expired.usd, BASE_USD));

const lamports = usdToLamports(BASE_USD);
check("usdToLamports returns integer", Number.isInteger(lamports));

Date.now = realNow;
process.exit(exitCode);
