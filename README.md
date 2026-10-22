# SVG 编辑器 CLI — Lab1 Phase 1

TypeScript OOP、六种内置图形、Composite、Command、SVG 文件读写、完整 undo/redo。

需要 **Node.js 24+**。在全新目录安装运行：

```sh
npm install
npm run check
npm run format:check
npm test
npm run cli
```

输入 `help` 查看全部命令；以 EOF（macOS：Control-D）退出。也可回放示例：

```sh
npm run cli < examples/flowchart.txt
```

SVG 保存到 `examples/flowchart.svg`，可以直接用浏览器预览。读入原文外部示例：`read examples/other.svg`。

- [架构方案、过程记录、一致性自查、质量保证](doc/README.md)
- [逐条要求与验收清单](doc/REQUIREMENTS.md)
- [真实验证记录](doc/VERIFICATION.md)
- [作业原文](doc/phase_cli_1.md)

**阶段边界：** box 为后续插件阶段；本阶段 `create box` 按原文报 unknown shape type。

**文件保护：** 不自动删除本地文件。覆盖已有 SVG 前保留同目录唯一 `.bak`；失败 `.tmp` 和工程 `work/test-artifacts/` 测试工件保留，不进入 Git。`delete <id>` 只删除文档内图形，可撤销。已有安装目录避免使用会重建 node_modules 的 npm ci；用 npm install 即可。
