export type EngineType = "gas" | "diesel" | "hybrid" | "ev";
export type VehicleCategory = "Pickup Truck" | "SUV" | "Sedan";

const BASE_GAS = 0.252;
const BASE_DIESEL = 0.27;
const BASE_HYBRID = 0.14;

function categoryFactor(cat: VehicleCategory) {
  if (cat === "Pickup Truck") return 1.25;
  if (cat === "SUV") return 1.1;
  return 1.0;
}

function speedFactor(speedKmh: number, kind: "gas" | "diesel" | "hybrid") {
  if (kind === "hybrid") {
    if (speedKmh < 25) return 0.95;
    if (speedKmh > 90) return 1.05;
    return 1.0;
  }
  if (speedKmh < 25) return 1.15;
  if (speedKmh > 90) return 1.10;
  return 1.0;
}

function kmFrom(distanceM: number) {
  return distanceM / 1000;
}

function speedKmh(distanceM: number, durationSec: number) {
  const km = kmFrom(distanceM);
  const h = Math.max(durationSec, 1) / 3600;
  return km / h;
}

export function gasCO2(distanceM: number, durationSec: number, cat: VehicleCategory) {
  const km = kmFrom(distanceM);
  const sp = speedKmh(distanceM, durationSec);
  return km * BASE_GAS * categoryFactor(cat) * speedFactor(sp, "gas");
}

export function dieselCO2(distanceM: number, durationSec: number, cat: VehicleCategory) {
  const km = kmFrom(distanceM);
  const sp = speedKmh(distanceM, durationSec);
  return km * BASE_DIESEL * categoryFactor(cat) * speedFactor(sp, "diesel");
}

export function hybridCO2(distanceM: number, durationSec: number, cat: VehicleCategory) {
  const km = kmFrom(distanceM);
  const sp = speedKmh(distanceM, durationSec);
  return km * BASE_HYBRID * categoryFactor(cat) * speedFactor(sp, "hybrid");
}

export function evCO2() {
  return 0;
}

export function co2ForEngine(distanceM: number, durationSec: number, cat: VehicleCategory, engine: EngineType) {
  if (engine === "gas") return gasCO2(distanceM, durationSec, cat);
  if (engine === "diesel") return dieselCO2(distanceM, durationSec, cat);
  if (engine === "hybrid") return hybridCO2(distanceM, durationSec, cat);
  return evCO2();
}

type RouteLite = { distanceM: number; durationSec: number };

export function estimateCO2SavedPerRoute(routes: RouteLite[], cat: VehicleCategory, engine: EngineType) {
  const gasArr = routes.map(r => gasCO2(r.distanceM, r.durationSec, cat));
  if (engine === "ev") return gasArr.map(v => +v.toFixed(3));
  if (engine === "hybrid") {
    const hybridArr = routes.map(r => hybridCO2(r.distanceM, r.durationSec, cat));
    return gasArr.map((g, i) => +(g - hybridArr[i]).toFixed(3));
  }
  const actual = routes.map(r => (engine === "diesel" ? dieselCO2(r.distanceM, r.durationSec, cat) : gasCO2(r.distanceM, r.durationSec, cat)));
  const worst = Math.max(...actual);
  return actual.map(v => +(worst - v).toFixed(3));
}