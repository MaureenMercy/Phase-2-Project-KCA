import { describe, expect, it } from "vitest";
import { createInitialStore } from "@/lib/seed";
import { validateElection1Readiness } from "@/lib/electoral";
import {
  decodeStorePatch,
  encodeStorePatch,
  restoreStorePhotos,
  splitCookieChunks,
  stripStorePhotos,
} from "@/lib/store-persist";

describe("serverless store patch", () => {
  it("round-trips seat allocations without the portrait payloads", () => {
    const seed = createInitialStore();
    seed.electoralUnits = seed.electoralUnits.map((unit) => ({
      ...unit,
      delegateSeats: 2,
      seatStatus: "SUBMITTED",
    }));
    seed.election.stage = "VOTING";

    const encoded = encodeStorePatch(seed);
    expect(encoded.length).toBeGreaterThan(100);
    expect(splitCookieChunks(encoded).length).toBeGreaterThan(0);

    const restored = restoreStorePhotos(decodeStorePatch(encoded), createInitialStore());
    expect(restored.election.stage).toBe("VOTING");
    expect(restored.electoralUnits.every((unit) => unit.delegateSeats === 2)).toBe(true);
    expect(validateElection1Readiness(restored).some((issue) => issue.code === "seats")).toBe(
      false,
    );
    expect(restored.delegateCandidates[0]?.photo.startsWith("data:")).toBe(true);
    expect(restored.cabinetCandidates[0]?.photo.startsWith("data:")).toBe(true);
  });

  it("strips photos so the cookie payload stays small", () => {
    const seed = createInitialStore();
    const stripped = stripStorePhotos(seed);
    expect(JSON.stringify(stripped).length).toBeLessThan(JSON.stringify(seed).length);
    expect(stripped.delegateCandidates.every((item) => item.photo === "")).toBe(true);
  });
});
