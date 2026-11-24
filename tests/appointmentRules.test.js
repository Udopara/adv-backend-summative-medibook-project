import {
  computeRefundPercent,
  computeRefundAmount,
  validateSlot,
  parseApptDatetime,
} from "../src/libs/appointmentRules.js";

describe("Unit Tests (Pure Functions)", () => {
  describe("Refund Calculator (Part C.3)", () => {
    const fixedNow = new Date("2026-11-20T10:00:00.000Z");

    test("Tier 1 (> 48h notice): returns 100% refund for 72 hours notice", () => {
      const apptDate = new Date("2026-11-23T10:00:00.000Z");
      expect(computeRefundPercent(apptDate, fixedNow)).toBe(100);
    });

    test("Boundary 1 (Exactly 48h notice): returns 50% refund", () => {
      const apptDate = new Date("2026-11-22T10:00:00.000Z");
      expect(computeRefundPercent(apptDate, fixedNow)).toBe(50);
    });

    test("Tier 2 (24h - 48h notice): returns 50% refund for 36 hours notice", () => {
      const apptDate = new Date("2026-11-21T22:00:00.000Z");
      expect(computeRefundPercent(apptDate, fixedNow)).toBe(50);
    });

    test("Boundary 2 (Exactly 24h notice): returns 50% refund", () => {
      const apptDate = new Date("2026-11-21T10:00:00.000Z");
      expect(computeRefundPercent(apptDate, fixedNow)).toBe(50);
    });

    test("Tier 3 (< 24h notice): returns 0% refund for 12 hours notice", () => {
      const apptDate = new Date("2026-11-20T22:00:00.000Z");
      expect(computeRefundPercent(apptDate, fixedNow)).toBe(0);
    });

    test("Refund amount calculation: correctly computes 50% of consultation fee", () => {
      expect(computeRefundAmount(25000, 50)).toBe(12500);
      expect(computeRefundAmount(15000, 100)).toBe(15000);
      expect(computeRefundAmount(20000, 0)).toBe(0);
    });
  });

  describe("Slot Validation & Working Hours (Part C.2)", () => {
    const fixedNow = new Date(2026, 10, 20, 8, 0, 0)

    test("Valid slot: accepts future slot on boundary within hours (e.g. 09:00, 14:30, 16:30)", () => {
      const slot9am = new Date(2026, 10, 21, 9, 0, 0);
      const slot230pm = new Date(2026, 10, 21, 14, 30, 0);
      const lastSlot = new Date(2026, 10, 21, 16, 30, 0);

      expect(validateSlot(slot9am, fixedNow)).toBeNull();
      expect(validateSlot(slot230pm, fixedNow)).toBeNull();
      expect(validateSlot(lastSlot, fixedNow)).toBeNull();
    });

    test("Edge case: 17:00 exactly is rejected (clinic closes at 17:00, last 30-min slot is 16:30)", () => {
      const closingTime = new Date(2026, 10, 21, 17, 0, 0);
      expect(validateSlot(closingTime, fixedNow)).toMatch(
        /within working hours/i,
      );
    });

    test("Edge case: 09:15 is rejected (not on a 30-minute slot boundary)", () => {
      const offBoundary = new Date(2026, 10, 21, 9, 15, 0);
      expect(validateSlot(offBoundary, fixedNow)).toMatch(
        /30-minute slot boundary/i,
      );
    });

    test("Past date is rejected", () => {
      const pastSlot = new Date(2026, 10, 19, 10, 0, 0);
      expect(validateSlot(pastSlot, fixedNow)).toMatch(/in the future/i);
    });

    test("Edge case: Malformed or impossible dates are rejected by parser", () => {
      expect(parseApptDatetime("2026-02-30 10:00")).toBeNull();
      expect(parseApptDatetime("2026-11-20 25:00")).toBeNull();
      expect(parseApptDatetime("not-a-date")).toBeNull();
      expect(parseApptDatetime("")).toBeNull();
    });
  });
});
