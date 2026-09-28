import { describe, expect, it } from "vitest";
import { openState } from "@/lib/contact-places";

// Dates are in UTC; London is UTC+1 in September (BST) and UTC+0 in January.
describe("openState (London hours, Mon–Fri 9–6)", () => {
  it("is open on a weekday afternoon", () => {
    expect(openState(new Date("2026-09-23T13:00:00Z")).open).toBe(true); // Wed 14:00 BST
  });

  it("uses London time, not the visitor's", () => {
    // 08:30 UTC is 09:30 in London during BST: already open.
    expect(openState(new Date("2026-09-23T08:30:00Z")).open).toBe(true);
    // In winter London is on UTC, so 08:30 UTC is before opening.
    expect(openState(new Date("2026-01-14T08:30:00Z"))).toEqual({
      open: false,
      label: "closed · opens today at 9am (London)",
    });
  });

  it("points to Monday over the weekend", () => {
    expect(openState(new Date("2026-09-26T12:00:00Z")).label).toBe("closed · back Monday at 9am (London)");
  });

  it("says tomorrow on a weekday evening", () => {
    expect(openState(new Date("2026-09-23T19:00:00Z")).label).toBe("closed · back tomorrow at 9am (London)");
  });

  it("warns in the last hour", () => {
    expect(openState(new Date("2026-09-23T16:30:00Z")).label).toMatch(/closing soon/); // 17:30 BST
  });
});
