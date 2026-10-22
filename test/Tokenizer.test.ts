import { test } from "node:test";
import assert from "node:assert/strict";
import { Tokenizer } from "../src/cli/Tokenizer.ts";
const t = new Tokenizer();
test("double quotes, empty content, colors and whole-line comments", () => {
  assert.deepEqual(t.parse("  # hi"), []);
  assert.deepEqual(t.parse(""), []);
  assert.deepEqual(t.parse('create text t 1 2 "My Diagram"'), [
    "create",
    "text",
    "t",
    "1",
    "2",
    "My Diagram",
  ]);
  assert.deepEqual(t.parse('set t text ""'), ["set", "t", "text", ""]);
  assert.deepEqual(t.parse("set r fill #fff"), ["set", "r", "fill", "#fff"]);
  assert.deepEqual(t.parse(String.raw`set t text "a \"b\" c"`), [
    "set",
    "t",
    "text",
    'a "b" c',
  ]);
  assert.throws(() => t.parse('set t text "unfinished'), /unterminated/);
});

test("quoted literal backslashes survive paths and mathematical text", () => {
  assert.deepEqual(t.parse(String.raw`read "C:\new\test.svg"`), [
    "read",
    String.raw`C:\new\test.svg`,
  ]);
  assert.deepEqual(t.parse(String.raw`set t text "\alpha + \beta"`), [
    "set",
    "t",
    "text",
    String.raw`\alpha + \beta`,
  ]);
  assert.deepEqual(t.parse(String.raw`set t text "a \\ b"`), [
    "set",
    "t",
    "text",
    String.raw`a \ b`,
  ]);
});
