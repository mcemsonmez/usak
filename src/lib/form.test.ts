import { describe, expect, it } from "vitest";
import { areaField } from "./form";

describe("areaField", () => {
  it("accepts the ways people type an area", () => {
    expect(areaField.parse("52")).toBe(52);
    expect(areaField.parse("47,5")).toBe(48);
    expect(areaField.parse("47.4 m2")).toBe(47);
    expect(areaField.parse("52 m²")).toBe(52);
    expect(areaField.parse(undefined)).toBeUndefined();
  });
  it("rejects nonsense with a readable message", () => {
    const r = areaField.safeParse("big");
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/Enter the area in m²/);
    expect(areaField.safeParse("-5").success).toBe(false);
  });
});
