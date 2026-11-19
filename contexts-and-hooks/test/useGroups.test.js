import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { useGroups } from "../src/hooks/useGroups.js";

function GroupsConsumer() {
  useGroups();
  return null;
}

test("useGroups explains that it must be rendered inside GroupsProvider", () => {
  assert.throws(
    () => renderToStaticMarkup(createElement(GroupsConsumer)),
    /useGroups must be used within a GroupsProvider/,
  );
});
