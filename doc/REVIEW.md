# 2026-10-22 复查与 VS Code 验收记录

## 本轮结论

本轮修订已在本机 VS Code 集成终端运行：84 项自动测试通过，失败数为 0。严格类型检查和格式检查通过。CLI 实际完成创建、容器移动、undo/redo、缩放、删除恢复、保存、读回和阶段边界错误验证。

## 逐项复查与修订

| 原文要求/检查点 | 检查结果与修订 | 验证证据 |
|---|---|---|
| 本阶段六类图形与 box 阶段边界 | 内置 rect/circle/ellipse/line/text/g；create box 输出原文错误 | Model、Editor、Cli 测试及 VS Code 会话 |
| OOP、类层次、字段封装、一类一文件 | Shape 多态行为和 Group 组合，生产文件各含同名类 | Architecture.test.ts |
| Command 和 Composite | 每条编辑一个历史单元，g 与叶子统一接口，嵌套操作递归生效 | Model、History、Editor 测试 |
| 模块职责和依赖方向 | 代码 import 符合文档表格；两处分派入口列为后续重构点 | AST 全量依赖检查 |
| 全部命令及精确错误 | 原文典型会话、参数边界和状态保持通过验证 | Editor、Specification 测试 |
| group 语法 | 按 id1/id2… 收紧为至少两个成员，失败保留 redo | 新增 Editor 回归 |
| SVG read/save 和 id 补全 | 预留显式 id，再为缺 id 元素分配标签序号；保存和读回保留结构 | SvgCodec、Specification 测试 |
| 原文背景 SVG 的 scale | 补充数值字号与线宽的同步规范化，保留字号/线宽继承 | 新增 SvgCodec 回归和原文背景示例提取测试 |
| CLI scale 几何语义 | 同乘原文白名单中的几何属性，字号和 stroke-width 保持属性值 | 新增专门回归 |
| 一行错误 | 增加孤立回车的归一化处理 | Editor 回归 |
| PlantUML 架构图 | 包名改为单行合法标签，保留五模块与依赖箭头 | Markdown 图代码与模块表核对 |
| README 表述 | 根 README 与 doc/README 改为直接陈述，保留四节必交内容与第一人称过程记录 | 关键词扫描与章节检查 |
| 本地文件保留 | 测试和演示工件留在 work，覆盖前备份，保存文件与历史持续保留 | FileStore 回归及文件核验 |
| 标签和推送 | 历史 final=b0bc7a0 已核验；本轮修订追加提交，上传和标签更新单独核对 | Git 记录及后续远端核验 |

## 从上传原文直接生成的验收

Specification.test.ts 读取 doc/phase_cli_1.md：

- 第 6 节完整典型会话：19 条命令，核对反馈、精确错误及保存结果。
- 第 6.1 A 节流程图：14 条命令，保存 8 元素 SVG，验证容器移动撤销和中文文本。
- 第 0 节嵌套 transform SVG：验证矩形 x=260、width=96、文本 font-size=12.8 和 text-anchor=middle。

树输出的比较归一化排版空格，并允许线条显示额外的 stroke 摘要。其余命令反馈逐条匹配原文。

## VS Code 实际环境与操作

1. 打开当前 svg-editor 工程。
2. 用户亲自确认工作区信任。
3. 集成终端最初显示 node/npm command not found，工程路径正确。
4. 使用本机已有 Node.js v24.19.0 和 npm 11.6.2 配置当前终端会话；系统配置和 shell 配置文件保持原样。
5. 在 VS Code 终端执行 npm run check、npm run format:check、npm test。

终端实际测试汇总：

```text
ℹ tests 84
ℹ suites 0
ℹ pass 84
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 611.756167
```

后续单独核对类型检查退出码 0；格式检查显示：

```text
Checking formatting...
All matched files use Prettier code style!
```

当前会话的临时 Node/npm 设置在关闭终端后失效。长期使用可按 RUNNING.md 安装官方 Node.js 24。

## 真实 CLI 演示

执行 npm run cli，终端出现 svg-editor 0.1 和 svg>。输入运行验收指南的命令，观察到：

```text
move scene 30 10 -> g#scene moved by (30,10)
show r1         -> x=40 y=30 width=100 height=50
undo            -> g#scene moved back by (-30,-10)
show r1         -> x=10 y=20 width=100 height=50
redo            -> g#scene moved by (30,10)
```

缩放、删除和恢复后，实际保存与读回：

```text
svg> save work/manual-check.svg
saved to work/manual-check.svg (3 elements)
svg> undo
error: undo not allowed after io command
svg> read work/manual-check.svg
read work/manual-check.svg (3 elements)
svg> tree
svg (400x200)
└── g#scene
    ├── rect#r1  x=80 y=60 w=200 h=100 fill=#4a90d9
    └── text#t1  (100,100) "验收通过"
svg> create box n1
error: unknown shape type: box (is the plugin loaded?)
```

已核对磁盘中 work/manual-check.svg 的 XML，与上述状态一致。浏览器可通过打开该本地文件预览；操作步骤见 RUNNING.md。

## 支持范围与提交状态

本轮围绕原文 Phase 1 要求修订。完整 CSS、相对字体单位、复杂 SVG 变换和插件机制列为后续扩展；具体范围见 doc/README.md。根级容器 ungroup 错误与 I/O 屏障保留原文规则。

代码修复提交为 def81b5；文档、运行指南和本报告以独立后续提交保存。此前 final 标签和所有旧提交持续保留；最新上传与 final 更新以实际远端状态为准。
