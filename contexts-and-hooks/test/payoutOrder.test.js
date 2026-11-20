import assert from "node:assert/strict";
import test from "node:test";
import { getPayoutOrder } from "../src/state/payoutOrder.js";

test("keeps the member order and assigns one-based positions", () => {
  const result = getPayoutOrder([
    { id: "esi", name: " Esi " },
    { id: "ama", name: "Ama" },
  ]);

  assert.deepEqual(result, [
    { id: "esi", name: "Esi", position: 1 },
    { id: "ama", name: "Ama", position: 2 },
  ]);
});

test("returns an empty order when the group has no members", () => {
  assert.deepEqual(getPayoutOrder([]), []);
});

test("handles a non-array and incomplete member rows", () => {
  assert.deepEqual(getPayoutOrder(null), []);
  assert.deepEqual(getPayoutOrder([null, { id: "", name: "  " }]), [
    { id: "member-1", name: "Unnamed member", position: 1 },
    { id: "member-2", name: "Unnamed member", position: 2 },
  ]);
});
