# Lab1 Phase 1：架构设计、协作过程与验证

我依据 [作业原文](phase_cli_1.md) 开发本项目，先整理 [逐条验收清单](REQUIREMENTS.md)，再分阶段实现。我的目标是通过一个可运行的 CLI，体现封装、类层次、多态、Composite 和 Command，而不只是拼出几个命令。

本阶段内置 **rect、circle、ellipse、line、text、g**。我根据原文 4.4 明确排除后续插件阶段的 box；`create box` 按约定报未知类型，不能把未来示例误当成本阶段必做项。

## 架构方案

### 1. 模块划分与职责

| 模块 | 主要类 | 我给它的职责 | 不应承担的职责 |
|---|---|---|---|
| `src/model/` | Shape、Rect、Circle、Ellipse、Line、Text、Group、Document、ShapeFactory | 几何行为、属性白名单、树结构、唯一 id、父子关系与顺序 | 读终端、访问文件、管理 undo 栈 |
| `src/commands/` | Command、History、各编辑命令子类 | 把一条编辑封装为可撤销单元，管理历史和 I/O 屏障 | 解析 XML、读写文件、打印提示符 |
| `src/application/` | Editor、Renderer | 调度命令，协调文档和文件服务，生成约定的反馈、tree/show/help | 按图形标签修改坐标字段 |
| `src/io/` | SvgCodec、FileStore | 解析/序列化 SVG、自动补 id、读写与备份 | 知道 CLI 命令或操作历史 |
| `src/cli/` | Main、Tokenizer | 逐行读取、`svg>`、注释与双引号参数、输出结果 | 直接改图形、直接操纵 undo 栈 |
| `test/` | 各测试文件 | 内核、历史、读写、CLI、边界与架构检查 | 参与生产依赖 |

我把入口也封装在 `Main` 类中，保持生产代码一类一文件、文件名与类名一致。`examples/` 是可以回放的示例，不是业务模块。

```plantuml
@startuml
skinparam packageStyle rectangle
package "cli
Main / Tokenizer" as CLI
package "application
Editor / Renderer" as APP
package "commands
Command / History / concrete commands" as CMD
package "model
Shape hierarchy / Document / ShapeFactory" as MODEL
package "io
SvgCodec / FileStore" as IO
CLI --> APP : tokens / results
APP --> CMD : execute / undo / redo
APP --> MODEL : current document / rendering
APP --> IO : read / save
CMD --> MODEL : polymorphic edits / snapshots
IO --> MODEL : construct / serialize
@enduml
```

### 2. 设计模式及实际落地

**多态与封装。** `Shape` 是抽象基类，id、几何属性、样式和导入属性均封装为私有字段。访问属性时返回副本，容器 children 返回数组副本。`Rect.move` 改 x/y，`Circle.move` 改 cx/cy，`Line.move` 改两个端点，`Text.move` 改文本位置。调用方只需要 `Shape.move`，不需要 `switch(tag)`。

**Composite。** `Group extends Shape`，拥有 Shape 子节点。其 `move`、`scale` 递归调用子节点相同接口；delete 从 Document 移除整个子树。`set` 的公共样式对 g 同样有效，按 SVG 继承语义表现；g 没有 x、cx 等几何属性，因此设置这些属性仍按白名单报错。容器不是一类特殊 CLI 命令对象。

**Command（必选）。** `Command` 定义 execute/undo/redo；`CreateCommand`、`DeleteCommand`、`MoveCommand`、`ScaleCommand`、`SetCommand`、`GroupCommand`、`UngroupCommand`、`AddToCommand`、`ReorderCommand` 封装各自编辑。front/back 的行为只差方向，复用 ReorderCommand。

以移动为例，流程是：

```text
Main -> Tokenizer -> Editor
     -> History.execute(new MoveCommand(...), currentDocument)
     -> Command.execute: clone currentDocument
     -> MoveCommand.apply: document.find(id).move(dx, dy)
     -> 成功后提交候选文档、记录 Command、清空 redo
```

我没有让 CLI 直接写 `r1.x += dx`。这样写会使 CLI 知道各种图形的字段，还会绕过历史管理。我的实现让 Command 记录可撤销操作，再调用多态 `Shape.move`；统一操作和撤销记录分别有明确负责人。

**Memento 辅助 Command。** 每个成功命令保存编辑前后的 Document 深拷贝。undo/redo 恢复快照，不用反向浮点运算猜回原值；分组、跨父移动和顺序也能完整恢复。命令真正执行的是具体业务操作，并非只给整份文档快照换个 Command 名字。

代价是每次命令时间和历史空间至少与文档规模相关；当前查找、校验和克隆还会重复遍历，**没有宣称整条命令是 O(n)**。我接受这个作业规模下的成本，大文档阶段再引入索引和差量命令。

**失败原子性。** Command 只修改候选副本；apply 失败时原文档、undo、redo 都不变。read 先完整解析与验证，再替换当前文档和路径；canvas 修改也先验证候选文档。save 写成功才更新路径并设置历史屏障。

**历史屏障。** init/read/save/canvas 修改成功后，History 清空旧栈并禁止 undo 与 redo，二者都输出原文指定的 `error: undo not allowed after io command`。下一次成功编辑解除屏障。tree/show/help/canvas 查询不入栈，失败命令不解除屏障，也不清 redo。

**两处名字分派（待重构）。**

1. `Editor` 中命令名到 Handler 的注册表。
2. `ShapeFactory` 中图形类型到构造定义的注册表，CLI 创建与 SVG 读入共用。

我将这两处列为未来插件化阶段待重构点。当前不额外实现插件框架。SvgCodec 对 transform 字符串做语法解析，结果转换为数值操作，然后调用多态方法，不再引入第三个名字到实现的注册表。

### 3. 依赖方向规则

| 来源 | 可以依赖 | 原因 |
|---|---|---|
| model | model | 核心规则独立于输入、存储和历史 |
| commands | commands、model | 可撤销操作只围绕实体执行 |
| io | io、model、文件/XML 库 | 格式适配与磁盘访问隔离在边界 |
| application | application、commands、model、io | 负责协调各层 |
| cli | cli、application、Node 输入输出 | 输入通道只对应用层负责 |
| test | 所有模块、测试/分析工具 | 验证行为与结构 |

我不允许 model 反向依赖 application，也不允许 commands 访问 io 或终端。生产第三方依赖只放在 io，Node 终端输入输出只放在 cli。违反规则的依赖应列为待处理项，而不能在文档中默认它合理。

### 4. 变化点假设

| 我预期的变化 | 当前保留的扩展位置 | 本阶段没有提前做什么 |
|---|---|---|
| 增加图形或 box | Shape 子类、ShapeFactory 的集中构造入口 | 不实现 ShapeProvider、插件加载、box 派生部件和传播属性 |
| 新增编辑命令 | Command 子类与 Editor 注册入口 | 不建立通用脚本语言 |
| 改为鼠标/agent 输入 | Editor 与 Command 不依赖终端；Tokenizer/Main 是边界 | 不实现图形界面或网络服务 |
| 新的存储格式 | SvgCodec 独立，FileStore 与模型分离 | 不同时支持多个格式，暂不增加只有一个实现的 Codec 抽象 |
| 大文档和长历史 | History 与 Command 集中持有快照，Document 集中查找 | 不提前优化差量撤销、持久化索引或历史容量策略 |
| 展示格式调整 | Renderer 集中负责 tree/show | 不把展示字符串塞入文件存储层 |

## 过程记录

以下记录采用我的项目视角，依据真实的用户—AI 讨论、实际代码和运行反馈整理；测试运行由协作智能体执行，没有补写未发生的对话或人工检查。

### 1. 我先确认统一接口和 undo 的关系

我提出“统一接口？方便调用？方便 undo 操作等等？”，同时要求严格满足文档、分批提交以及记录思考。讨论后我区分了两个职责：多态解决“不同图形如何完成相同操作”，Command 解决“怎样把一条操作记录为可撤销单元”。因此我选择 `MoveCommand -> Shape.move`，而不是在 CLI 中直接修改 `r1.x`。

### 2. 我纠正阶段范围与不明确规则

我要求以上传文件为准。AI 重新读到完整原文后，确认 box 属后续阶段，并注意到根级容器不能 ungroup、save 也设置撤销屏障等容易漏读的规则。我将其加入测试，没有照常见绘图软件习惯自行改写。

跨父 group 插入位置、空撤销栈、front/back 的数组方向等没有完全指定。我把采用的规则单列在 [验收清单](REQUIREMENTS.md)，与老师明确要求区分，避免把自己的决定写成原文。

### 3. 我用测试确认快照方案是否解决撤销难点

内核阶段先验证类层次、容器递归和父子顺序，再实现 Command。测试把小数位置移动后撤销，确认恢复的是原始值；分组只撤销一次就还原所有原父级与顺序；失败编辑不破坏已有 redo。由此我保留快照方案，同时在架构中写明内存和遍历成本，没有假装它适合无限大的文档。

### 4. 我从失败测试中发现 SVG 转义问题

SVG round-trip 测试加入含 `&`、引号、中文和首尾空格的属性/文本后，发现 xml-js 序列化属性时没有完整转义 `&`，导致保存结果无法读回。我让 AI 检查实际输出和库实现，修订为 SvgCodec 统一转义输出，xml-js 只负责结构解析。新增回归还覆盖字面量 `&amp;`，防止二次转义改变文本内容。

### 5. 我发现“严格解析”也必须验证输入结束

扩展到 70 项测试时，`<svg><rect` 竟被接受为空文档。检查后发现 xml-js 没有关闭 SAX 流；仅补 close 仍不够，因为 SAX 默认错误回调不直接抛出。我改为显式注册抛错回调、执行 write 和 close，再解析结构。回归证明失败 read 不替换当前文档、不修改默认路径，也不清 redo。

同一轮还有一个引号测试失败，实际是测试字符串本身丢失了反斜线，不是 Tokenizer 的实现问题。我修正为 String.raw，再确认嵌套引号能保留。这个过程提醒我不能一看到红色测试就盲目改业务代码。

### 6. 我让文档约束反过来检查代码

检查原文背景示例时，发现读取必须保留 `font-size`、`text-anchor` 等表现属性，但不能因此扩张 CLI 的 set 白名单。我把额外导入属性与可编辑属性分开，补上克隆与读写往返测试。

我还把 Main 改为同名入口类，统一格式，并用 TypeScript AST 自动检查依赖方向、每文件一个同名类、私有/受保护字段和无 switch 分派。这里我不是只在 README 宣称“架构一致”，而是给出可运行的检查。

### 7. 我追加了本地文件保护约束

我明确要求不得删除本地文件，尤其系统文件。AI 据此停止自动清理，移除了 FileStore 的临时文件删除及测试的目录清理；此后测试工件保留在工程 `work/test-artifacts/`。save 覆盖已有 SVG 前先创建唯一 `.bak`，写失败时保留 `.tmp` 供检查。作业中的 delete 只删除内存文档树的节点，仍是一个可撤销 Command。

### 8. 我分阶段提交，并用实际证据确认推送

本地历史依次包含：要求/方案、图形内核、Command 历史、SVG 读写、完整 CLI/集成测试、架构与文件保护修订，以及最终文档验收。提交在对应阶段真实生成，未通过事后拆分一次成品伪造过程。

我自己通过 GitHub Desktop 创建并发布仓库，提供地址并确认 Push origin 成功。AI 核对到 `origin/main = 37bf390`，reflog 有 `update by push`，此前的 `fbc6315` 也有独立推送记录。命令行无法获得 Desktop 认证，因此没有声称命令行推送成功。后续新增提交和 final 标签必须继续通过 Desktop 上传并复核。

截止日期由我补充为 **2026-10-31**，具体时刻未提供；目标是 2026-10-22 完成。最终标签由最终提交完成后创建，不能仅写在 README 中冒充已提交。

## 一致性自查

### 1. 实际目录与方案是否一致？

一致：生产代码实际分为 model、commands、application、io、cli，另有 test、examples、doc。没有增加未说明的业务层。

修订已经记录：Main 入口也采用同名类；导入属性单独封装；快照作为 Command 的实现策略；增加 AST 架构检查及文件保留规则。临时工件在 work/，不参与生产依赖或 Git 提交。

### 2. 依赖方向有没有违反？

当前自动检查没有发现违反。`test/Architecture.test.ts` 遍历全部生产 TypeScript 文件，用 AST 读取 import 并按上表校验；不是仅抽查文字。

人工抽查点也与规则一致：

- MoveCommand 仅导入 Document 与 Command，没有 CLI 或 FileStore。
- Document 只依赖 Shape、Group，不知道 XML、终端或历史。
- SvgCodec 依赖 model、xml-js、sax，不导入 Editor 或 commands。
- Main 通过 Editor 调用应用，不导入具体 Shape 或文件存储。

两处名字分派仍是已声明的后续待重构点，不算作已完成的插件化。测试和示例文件中的辅助函数不属于生产 OOP 模型。

## 质量保证手段

### 1. 要求追踪与实际验证

| 验证维度 | 证据 |
|---|---|
| 命令与精确错误 | Editor.test.ts 逐条覆盖无文档错误、重复/缺失 id、in 错误、未知类型、属性白名单、根级 ungroup、scale 非正等 |
| OOP 与 Composite | Model.test.ts 覆盖六种类型、容器递归、深克隆、唯一 id、祖先后代约束 |
| Command 历史 | History.test.ts 与 Editor.test.ts 覆盖单命令粒度、前后状态、失败保留 redo、I/O 屏障、新编辑分支 |
| 顺序与结构 | 跨父 group、front/back、addto、嵌套 ungroup、整棵子树 delete/恢复 |
| SVG | SvgCodec.test.ts 覆盖六类、嵌套、两遍补 id、冲突避让、XML 转义、中文/空白、解析失败、变换、box 标记降级 |
| 文件保护 | 保存失败不破坏原文件，覆盖前备份字节完全一致，不调用清理删除函数 |
| 实际入口 | Cli.test.ts 启动真实 Node 子进程，验证提示符、错误一行、引号、脚本输入与 EOF |
| 架构与静态质量 | Architecture.test.ts、严格 TypeScript 检查、统一格式检查 |
| 原文案例 | examples/flowchart.txt 已回放并生成 8 元素 flowchart.svg；examples/other.svg 的警告和 7 元素计数有断言 |

最终源码本轮测试 **76 项通过、0 失败**；严格类型检查和格式检查通过。具体输出保存在 [验证记录](VERIFICATION.md)，命令可以复现：

```sh
npm ci
npm run check
npm run format:check
npm test
npm run cli < examples/flowchart.txt
```

我没有把“测试通过”等同于不存在任何缺陷；这些测试为要求、错误和边界提供了可追溯证据。此前真实失败及修复也保留在过程记录中。

### 2. 明确的实现范围与限制

- 本项目是作业要求的六类 SVG 子集，不是完整 SVG 编辑器。未知图形、DTD、自定义实体、非等比或非正 scale、rotate/matrix 等未支持变换会拒绝读入；viewBox 仅支持与画布一致的 `0 0 w h`。root 宽高缺省采用 800×600。
- translate/等比 scale 读入时规范化到几何坐标；这不提供复杂 CSS、相对字体单位或任意 SVG 渲染上下文的等价变换保证。没有把此扩展声称为完整 SVG 标准支持。
- 原文未指定的附加参数错误使用 `error: invalid arguments`；空历史等规则详见验收清单。
- tree 采用动态列宽保证可读，几何内容与 Unicode 树结构遵循原文，空格不是固定截图列号。
- 快照历史不设容量上限；大文档性能需要后续优化。
- 覆盖前备份与保留工件是我追加的文件保护要求，会占用额外磁盘空间；不会自动清理用户文件。
- npm ci 是全新安装的标准命令，**会由 npm 重建 node_modules**；遵守我本地不删除文件的要求时，在已有目录使用 npm install，或在全新目录安装，协作智能体不会对现有目录执行 npm ci。

### 3. 提交验收的最后核对

仓库：[hwx15871640537-source/svg-editor](https://github.com/hwx15871640537-source/svg-editor)，分支 main。

本地最终提交与 final 标签可用下列只读命令确认；远端标签上传以实际 GitHub/推送记录为准。本文不把待上传状态写成已完成。

```sh
git log --oneline --reverse
git status --short
git show final --no-patch
git log -1 origin/main
```
