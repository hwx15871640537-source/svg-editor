# SVG 编辑器 CLI — Lab1 Phase 1

TypeScript OOP、六种内置图形、Composite、Command、SVG 文件读写、undo/redo。

使用 **Node.js 24+**。在 svg-editor 目录的 VS Code 终端执行：

```sh
node -v
npm -v
npm install
npm run check
npm run format:check
npm test
npm run cli
```

当前目录已经安装依赖时，可以直接运行检查。看到 `svg>` 后输入 `help` 查看命令；macOS 用 Control-D 结束输入。

- [VS Code 运行与手工验收指南](doc/RUNNING.md)
- [架构方案、过程记录、一致性自查、质量保证](doc/README.md)
- [本轮复查报告](doc/REVIEW.md)
- [逐条要求与验收清单](doc/REQUIREMENTS.md)
- [历史验证记录](doc/VERIFICATION.md)
- [作业原文](doc/phase_cli_1.md)

回放原文示例：

```sh
npm run cli < examples/flowchart.txt
```

保存结果位于 examples/flowchart.svg，可拖入浏览器预览。读入外部示例使用 `read examples/other.svg`。

**阶段范围：** rect、circle、ellipse、line、text、g 为当前内置类型。box 属于后续插件阶段，当前 create box 输出约定错误。

**文件保留：** SVG 覆盖前保留唯一 .bak；失败 .tmp 与 work/ 测试工件保留。delete 命令操作 SVG 文档树，并支持 undo。依赖安装采用 npm install，现有文件和提交历史持续保留。
