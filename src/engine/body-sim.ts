/**
 * ASTRA — Simulated instrumented finger (v3.3.0-rc.5)
 * ═══════════════════════════════════════════════════
 * A one-joint finger pressing on an object, with a 4 × 4 tactile array, two
 * skin-stretch sensors over the joint, a heated contact thermistor with a
 * heat-flux reading, a torque estimate, and three interoceptive variables
 * (actuator temperature, state of charge, board temperature).
 *
 * Its only purpose is to exercise the two channels, the manipulations and the
 * comparator end to end: every sample is `origin: 'simulated'`, and the
 * withdrawal analysis never accepts simulated observations as evidence for or
 * against the kinaesthetic thesis (fcs/kinaesthetic-withdrawal.ts). The
 * physics is deliberately elementary — first-order joint, linear contact
 * spring, lumped thermal nodes — and makes no claim about any real device.
 *
 * Randomness comes from a LOCAL stream (congruence.ts `localRng`), so a
 * simulation never advances ASTRA's global generator.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import { localRng } from './congruence.js';
import type { SomatosensoryReading } from './somatosensory.js';
import type { InteroceptiveReading } from './interoception.js';
import type { EfferenceCopy } from './reafference.js';

export interface BodySimConfig {
  seed: number;
  /** Control and acquisition period (ms). */
  dtMs: number;
  /** Acquisition delay after the command, < dtMs (ms). */
  acquisitionLagMs: number;
  /** Interoceptive sampling period, in control periods. */
  interoEvery: number;
  tauMs: number;
  contactAngleRad: number;
  contactStiffnessNPerRad: number;
  objectTempC: number;
  /** Contact heat-transfer coefficient (W/m²K): high for metal, low for wood. */
  objectContactCoefficient: number;
  heaterTempC: number;
  ambientC: number;
  noise: number;
  clockDomain: string;
}

export const DEFAULT_BODY_SIM_CONFIG: BodySimConfig = Object.freeze({
  seed: 1,
  dtMs: 10,
  acquisitionLagMs: 8,
  interoEvery: 5,
  tauMs: 60,
  contactAngleRad: 0.6,
  contactStiffnessNPerRad: 20,
  objectTempC: 22,
  objectContactCoefficient: 800,
  heaterTempC: 34,
  ambientC: 22,
  noise: 0.002,
  clockDomain: 'sim-finger-0',
});

export interface BodySession {
  efference: EfferenceCopy[];
  somatosensory: SomatosensoryReading[];
  interoceptive: InteroceptiveReading[];
  /** Command magnitude per interoceptive sample, the declared load (a command quantity). */
  interoceptiveLoad: number[];
  config: BodySimConfig;
}

/** Default command: a slow sweep through contact with steps, so the return depends on the command. */
export function defaultCommand(k: number, rng: () => number, hold: { v: number; until: number }): number {
  if (k >= hold.until) { hold.v = 0.2 + 0.9 * rng(); hold.until = k + 15 + Math.floor(rng() * 25); }
  return hold.v + 0.15 * Math.sin((2 * Math.PI * k) / 120);
}

/** The object under the finger at a given step (probe sessions change it between probes). */
export interface ContactObject { contactCoefficient: number; tempC: number }

/**
 * Runs `steps` control periods and returns the three timestamped streams.
 * `command` overrides the default command; `objectAt` overrides the object
 * (default: `objectContactCoefficient` and `objectTempC` of the config).
 */
export function simulateFinger(
  steps: number,
  config: Partial<BodySimConfig> = {},
  command?: (k: number) => number,
  objectAt?: (k: number) => ContactObject,
): BodySession {
  const c: BodySimConfig = { ...DEFAULT_BODY_SIM_CONFIG, ...config };
  if (!(Number.isInteger(steps) && steps > 0 && steps <= 100_000)) throw new RangeError('steps must be an integer in [1, 100000]');
  if (!(c.acquisitionLagMs >= 0 && c.acquisitionLagMs < c.dtMs)) throw new RangeError('acquisitionLagMs must lie in [0, dtMs)');
  const rng = localRng(c.seed);
  const n = () => {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const hold = { v: 0.5, until: 0 };
  const cmd = command ?? ((k: number) => defaultCommand(k, rng, hold));

  let theta = 0, omega = 0, tSurf = c.heaterTempC, tAct = c.ambientC + 5, soc = 0.95, tBoard = 38;
  const alpha = 1 - Math.exp(-c.dtMs / c.tauMs);
  const rows = 4, cols = 4;
  const profile = Array.from({ length: rows * cols }, (_, i) => {
    const r = Math.floor(i / cols) - 1.5, q = (i % cols) - 1.5;
    return Math.exp(-(r * r + q * q) / 2.5);
  });
  const profSum = profile.reduce((s, v) => s + v, 0);

  const out: BodySession = { efference: [], somatosensory: [], interoceptive: [], interoceptiveLoad: [], config: c };
  let loadAcc = 0;
  for (let k = 0; k < steps; k++) {
    const t0 = k * c.dtMs;
    const u = cmd(k);
    if (!Number.isFinite(u)) throw new RangeError(`command at step ${k} is not finite`);
    out.efference.push({ t: t0, clockDomain: c.clockDomain, origin: 'simulated', command: [u], commandId: `k${k}` });

    // Joint: first-order tracking, held back by the contact spring.
    const penetration = Math.max(0, theta - c.contactAngleRad);
    const reaction = 0.3 * c.contactStiffnessNPerRad * penetration;
    const prevTheta = theta;
    theta += alpha * (u - theta) - (alpha * reaction) / 10;
    omega = (theta - prevTheta) / (c.dtMs / 1000);
    const pen = Math.max(0, theta - c.contactAngleRad);
    const force = c.contactStiffnessNPerRad * pen;
    const torque = 0.8 * (u - theta) + 0.05 * force;

    // Thermal: heated sensor relaxing toward the heater, pulled toward the object on contact.
    const obj = objectAt ? objectAt(k) : { contactCoefficient: c.objectContactCoefficient, tempC: c.objectTempC };
    const hObj = force > 0 ? obj.contactCoefficient : 0;
    const hHeat = 400;
    const tEq = (hHeat * c.heaterTempC + hObj * obj.tempC) / (hHeat + hObj);
    tSurf += (1 - Math.exp(-c.dtMs / 80)) * (tEq - tSurf);
    const flux = hObj * (tSurf - obj.tempC);

    const normalN = profile.map((p) => Math.max(0, (force * p) / profSum + c.noise * n()));
    out.somatosensory.push({
      t: t0 + c.acquisitionLagMs, clockDomain: c.clockDomain, origin: 'simulated',
      taxels: { rows, cols, normalN, shearXN: normalN.map((f) => 0.02 * omega * f) },
      vibrationRms: Math.abs(omega) * 0.01 * (force > 0 ? 1 : 0.2) + Math.abs(c.noise * n()),
      stretch: [0.12 * theta + c.noise * n(), 0.06 * theta + c.noise * n()],
      thermal: { surfaceTempC: tSurf + 0.01 * n(), neutralTempC: 32, heated: true, heatFluxWm2: flux + 5 * n() },
      joints: [{ id: 'mcp', angleRad: theta + c.noise * n(), velocityRadS: omega, torqueNm: torque }],
      sourceSignals: ['taxel-array-0', 'stretch-0', 'stretch-1', 'thermistor-0', 'encoder-mcp', 'torque-mcp'],
    });

    // Interoception: actuator heats with effort², board follows slowly, charge drains with effort.
    tAct += (c.dtMs / 1000) * (2.5 * torque * torque - 0.05 * (tAct - c.ambientC));
    tBoard += (c.dtMs / 1000) * (0.02 * (tAct - tBoard));
    soc = Math.max(0, soc - (c.dtMs / 1000) * (0.0004 + 0.002 * Math.abs(torque)));
    loadAcc += Math.abs(u);
    if ((k + 1) % c.interoEvery === 0) {
      out.interoceptive.push({
        t: t0 + c.acquisitionLagMs, clockDomain: c.clockDomain, origin: 'simulated',
        values: { actuatorTempC: tAct + 0.02 * n(), stateOfCharge: soc + 0.0005 * n(), boardTempC: tBoard + 0.02 * n() },
        sourceSignals: ['actuator-thermistor', 'fuel-gauge', 'board-thermistor'],
      });
      out.interoceptiveLoad.push(loadAcc / c.interoEvery);
      loadAcc = 0;
    }
  }
  return out;
}
