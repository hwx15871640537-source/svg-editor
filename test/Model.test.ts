import { test } from "node:test";
import assert from "node:assert/strict";
import { Document } from "../src/model/Document.ts";
import { ShapeFactory } from "../src/model/ShapeFactory.ts";
const f = new ShapeFactory();
test("six polymorphic shapes and recursive Composite geometry", () => {
  const d = new Document();
  const g = f.create("g", "g", []);
  d.insert(g);
  for (const [t, p] of [
    ["rect", ["1", "2", "3", "4"]],
    ["circle", ["1", "2", "3"]],
    ["ellipse", ["1", "2", "3", "4"]],
    ["line", ["1", "2", "3", "4"]],
    ["text", ["1", "2", "hello"]],
  ] as const)
    d.insert(f.create(t, t, [...p]), d.container("g"));
  g.move(10, 20);
  g.scale(2);
  assert.equal(d.find("rect").attributes().x, "22");
  assert.equal(d.find("circle").attributes().cy, "44");
  assert.equal(d.find("line").attributes().x2, "26");
  assert.equal(d.find("text").content, "hello");
  assert.equal(d.find("rect").attributes().fill, undefined);
  const copy = d.clone();
  copy.find("rect").set("x", "99");
  assert.equal(d.find("rect").attributes().x, "22");
});
test("group order, ancestry and nested ungroup", () => {
  const d = new Document();
  d.insert(f.create("g", "outer", []));
  const p = d.container("outer");
  for (const id of ["a", "b", "c"])
    d.insert(f.create("rect", id, ["0", "0", "1", "1"]), p);
  d.regroup("inner", ["c", "a"]);
  assert.deepEqual(
    d.find("inner").children.map((s) => s.id),
    ["a", "c"],
  );
  assert.throws(
    () => d.regroup("bad", ["outer", "a"]),
    /cannot group a container into its own descendant: outer/,
  );
  d.ungroup("inner");
  assert.deepEqual(
    p.children.map((s) => s.id),
    ["a", "c", "b"],
  );
  assert.throws(
    () => d.ungroup("outer"),
    /cannot ungroup top-level container: outer/,
  );
  assert.throws(() => d.addTo("outer", "outer"), /own descendant/);
});
test("identity, whitelist, numeric validation and box boundary", () => {
  const d = new Document();
  d.insert(f.create("rect", "A", ["0", "0", "1", "1"]));
  d.insert(f.create("g", "a", []));
  assert.throws(() => d.insert(f.create("g", "A", [])), /id already exists: A/);
  assert.throws(() => d.find("A").set("id", "new"), /unknown attribute: id/);
  assert.throws(
    () => f.create("box", "b", []),
    /unknown shape type: box \(is the plugin loaded\?\)/,
  );
  assert.throws(() => d.find("A").scale(0), /scale factor must be positive/);
  assert.throws(() => d.find("A").set("width", "-1"), /non-negative/);
});
