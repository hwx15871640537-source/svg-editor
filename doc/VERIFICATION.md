# 最终源码真实验证记录

验证环境：Node.js v24.19.0；TypeScript 5.9.3；macOS；用户时区 Asia/Shanghai；2026-10-22。

以下输出由实际子进程捕获。此环境调用 bundled Node 的绝对路径，对应用户项目中的 npm 脚本。验证后仅更新报告和提交元数据。

## npm run check

退出码：0

```text
(无错误输出)
```

## npm run format:check

退出码：0

```text
Checking formatting...
All matched files use Prettier code style!
```

## npm test

退出码：0

```text
✔ all production imports follow documented dependency direction (33.313834ms)
✔ one class per file, matching name, encapsulated fields and no switch(tag) (12.204917ms)
✔ actual CLI: prompt, script replay, errors are single-line and EOF exits (186.340875ms)
✔ no document: save (2.292584ms)
✔ no document: canvas (0.277709ms)
✔ no document: create g g (0.169958ms)
✔ no document: delete a (0.126083ms)
✔ no document: move a 1 2 (0.167375ms)
✔ no document: scale a 2 (0.235875ms)
✔ no document: set a fill red (0.298583ms)
✔ no document: group g a (0.711541ms)
✔ no document: ungroup a (0.181375ms)
✔ no document: addto a b (0.220083ms)
✔ no document: front a (0.096458ms)
✔ no document: back a (0.077542ms)
✔ no document: tree (0.062917ms)
✔ no document: show a (0.059417ms)
✔ no document: undo (0.054042ms)
✔ no document: redo (0.0545ms)
✔ init dimensions, help and comments (0.734583ms)
✔ exact error and failure atomicity: create rect r1 0 0 1 1 (3.801ms)
✔ exact error and failure atomicity: delete r9 (0.77625ms)
✔ exact error and failure atomicity: create g new in node9 (0.846458ms)
✔ exact error and failure atomicity: create g new in r1 (0.5055ms)
✔ exact error and failure atomicity: create hexagon new (0.847459ms)
✔ exact error and failure atomicity: create box new 1 2 3 4 "Title" (0.33ms)
✔ exact error and failure atomicity: group bad r1 scene (0.485417ms)
✔ exact error and failure atomicity: ungroup scene (0.7355ms)
✔ exact error and failure atomicity: scale r1 0 (0.978125ms)
✔ exact error and failure atomicity: scale r1 -2 (0.964666ms)
✔ exact error and failure atomicity: scale r1 NaN (0.317667ms)
✔ exact error and failure atomicity: set r1 invalid x (0.608208ms)
✔ exact error and failure atomicity: set scene x 4 (0.247959ms)
✔ exact error and failure atomicity: set r1 text hi (0.260458ms)
✔ exact error and failure atomicity: set r1 id z (0.273209ms)
✔ exact error and failure atomicity: ungroup r1 (0.855375ms)
✔ exact error and failure atomicity: addto scene scene (0.653958ms)
✔ document sample transcript, exact move/set/delete summaries (1.517ms)
✔ all create types with in clause, all geometries scale, set whitelist (10.285709ms)
✔ every structural edit supports undo/redo and preserves exact order (1.991667ms)
✔ display does not enter history or clear redo; branches do (0.292708ms)
✔ I/O barriers, default paths, errors and failed read/save preserve history (7.977416ms)
✔ read warning sample count and default save path (2.855792ms)
✔ invalid input leaves state and history unchanged: create (0.362083ms)
✔ invalid input leaves state and history unchanged: create rect (0.1995ms)
✔ invalid input leaves state and history unchanged: create rect a 1 2 3 (0.191584ms)
✔ invalid input leaves state and history unchanged: create g (0.221542ms)
✔ invalid input leaves state and history unchanged: create g a unexpected (0.236083ms)
✔ invalid input leaves state and history unchanged: move r1 1 (0.214041ms)
✔ invalid input leaves state and history unchanged: move r1 NaN 0 (0.262208ms)
✔ invalid input leaves state and history unchanged: canvas 20 (0.211375ms)
✔ invalid input leaves state and history unchanged: canvas -1 2 (0.267833ms)
✔ invalid input leaves state and history unchanged: set r1 width -1 (0.194875ms)
✔ invalid input leaves state and history unchanged: set r1 stroke-width -2 (0.132875ms)
✔ invalid input leaves state and history unchanged: set r1 x Infinity (0.161625ms)
✔ invalid input leaves state and history unchanged: group empty (0.165334ms)
✔ invalid input leaves state and history unchanged: group new r1 r1 (0.15525ms)
✔ invalid input leaves state and history unchanged: tree a b (0.139042ms)
✔ invalid input leaves state and history unchanged: undo a (0.125333ms)
✔ invalid input leaves state and history unchanged: redo a (0.124125ms)
✔ invalid input leaves state and history unchanged: help a (0.141375ms)
✔ file store leaves old file intact on failed writes (0.794416ms)
✔ z-order front/back and cross-parent group follow original traversal order (0.350417ms)
✔ overflow while recursively editing never partially commits (0.328417ms)
✔ successful overwrite keeps a byte-for-byte backup and never cleans files (1.623083ms)
✔ one group command is one undo unit; redo branch and failure atomicity (4.525458ms)
✔ I/O blocks undo and redo until successful edit (0.903625ms)
✔ six polymorphic shapes and recursive Composite geometry (2.77575ms)
✔ group order, ancestry and nested ungroup (2.222791ms)
✔ identity, whitelist, numeric validation and box boundary (0.292792ms)
✔ reserve explicit ids before assigning, nested ids and case sensitivity (8.956291ms)
✔ all six types, XML attributes and text roundtrip, box marker degrades to g (2.347542ms)
✔ translate and scale normalize nested groups without double-transform (2.135917ms)
✔ reject malformed, duplicate, unsupported and unsafe XML (2.418208ms)
✔ preserve imported presentation attributes from original background example without expanding set whitelist (1.158875ms)
✔ double quotes, empty content, colors and whole-line comments (11.632125ms)
ℹ tests 76
ℹ suites 0
ℹ pass 76
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 491.575209
```

## Git 与上传证据

此前用户通过 Desktop 分步上传，origin/main 与 push reflog 已核对到 37bf390；后续最终提交/标签上传需再次核对，不能用本地测试替代远端证据。

未运行文件清理、仓库重置或系统文件操作；此次测试工件保留在工程 work/test-artifacts/。
