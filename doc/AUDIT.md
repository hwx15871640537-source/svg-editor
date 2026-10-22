# 全量审查记录（2026-10-22）

## 结论与依据

本轮逐项阅读老师原文并检查生产实现、已有测试和文档。项目内原文副本与用户附件经字节比较一致。检查发现两个此前缺少回归覆盖的边界，修复提交为 fea6f8d。最终自动测试 94 项通过、0 失败，TypeScript 严格类型检查与 Prettier 检查通过。

## 发现与修正

1. **默认保存目标。** 原文第 3 节明确，无参数 save 保存到读入路径。旧实现会在显式另存后切换默认目标。新增 source/copy 双文件回归在旧实现失败，修正后默认保存更新 source，copy 内容保持另存时的版本。首次 init 后的显式 save 建立备用默认目标，后续 read 重新建立原始路径。
2. **引号中的反斜线。** 原文要求双引号支持带空格参数；旧解析器还会消耗普通反斜线，把路径中的 n/t 转成控制字符。新增路径和数学文本回归在旧实现失败。修正后通常按字面保留反斜线，双反斜线与反斜线加引号用于转义。这项转义细则作为设计选择记录。

## 要求、实现和验证映射

| 原文要求 | 实现检查 | 验证依据 |
|---|---|---|
| 1.1 分步 Git、远端、final | 保留既有历史，修复和审查文档分别提交；本轮最终远端状态单独核验 | Git 日志、Desktop 上传状态；既有 final=23467fa 持续保留至新版本标签处理 |
| 1.2 四类文档内容 | doc/README.md 含职责表、PlantUML 包图、Command、依赖、变化点、过程、自查和质量保证 | 阅读全部章节，检查直接陈述措辞 |
| 2 通用输入与 id | Main/Tokenizer/ShapeFactory/Document；全局大小写敏感 id；预留显式 id 后补号 | Tokenizer、Model、SvgCodec、Cli 测试 |
| 2.1 OOP 与两处名字分派 | Shape 层次、多态 move/scale、私有字段、具体 Command；注册表集中于 Editor 与 ShapeFactory | 全部生产代码审阅；Architecture AST 检查一类一文件、字段封装、依赖与 switch |
| Composite | Group 递归 move/scale；Document 处理树与容器删除；set 使用公共样式与自身几何白名单 | Model 与 Editor 的嵌套、结构往返、溢出失败原子性测试 |
| 3 文档命令 | init/read/save/canvas；查询尺寸保持历史，成功修改建立历史屏障 | 新增四种操作逐项验证 undo/redo、失败编辑和查询后的屏障保持 |
| 3 编辑命令 | 九类具体 Command；front/back 共用 ReorderCommand | 创建、删除、移动、缩放、set、group/ungroup/addto、层序逐项检查，撤销重做恢复顺序 |
| 4.1 六类及 in | 工厂参数表与老师表格对应；省略样式保持 SVG 默认 | 全六类、全几何属性与公共样式、in、无样式序列化测试 |
| 4.2 精确错误 | Editor 统一前缀并消除错误中的换行；业务对象产生规定消息 | 逐项错误表及失败后状态、redo 保持测试；复合类型错误归后续插件阶段 |
| 4.3 Command 历史 | 先在候选副本执行，再提交快照与历史；新成功编辑清 redo | History、Editor 的结构恢复、查询跳过、失败保持分支测试 |
| 4.4 阶段边界 | 六类内置；create box 返回带插件提示的 unknown shape type | 错误断言；导入 data-kind=box 作为普通 g 保留元数据 |
| 5 tree/show | Renderer 内联几何、Unicode 树、父级和属性 | 原文输出回放、Editor 断言；树列空白按排版归一化 |
| 6 与 6.1 A | Specification 从老师 Markdown 直接提取命令和背景 SVG | 19 条典型命令、14 条流程图命令和嵌套变换读写；6.1 B 属后续阶段 |
| SVG 文件读写 | SAX 严格解析、工厂建模、自有 XML 转义；FileStore 写前备份 | 缺 id、冲突、中文、特殊字符、表现属性、解析失败、不可写与备份字节一致测试 |

## 验证结果

本轮在项目目录运行 Node.js 24.19.0：

```text
node --test test/*.test.ts
ℹ tests 94
ℹ pass 94
ℹ fail 0
ℹ duration_ms 405.72425

tsc --noEmit
退出码 0

prettier --check src test
All matched files use Prettier code style!
```

测试启动真实 CLI 子进程，覆盖提示符、脚本回放、错误与 EOF。此前 VS Code 交互演示和浏览器预览保存在 REVIEW.md；本轮新增检查通过本机终端执行。所有测试工件与旧文件保留。

## 支持范围与设计选择

原文完整 SVG 标准的实现范围没有逐项枚举。当前支持本阶段六类、嵌套 g、普通数值尺寸、匹配画布的 viewBox、translate 和正数等比 scale；复杂 CSS、路径、旋转、矩阵、任意 viewBox 映射等列为后续扩展。未知图形与不支持的变换明确报错。老师列出的本阶段示例已回放通过。

跨父 group 的目标位置、空历史反馈、首次 init 后默认保存目标、引号转义和动态列宽是显式设计选择，详见 REQUIREMENTS.md。快照历史随文档及命令数量增长；大文档性能与历史容量控制保留为后续改进。

本轮检查范围内，原文明确的本阶段功能、架构与文档条款均有对应实现和检查依据。自动测试提供已覆盖场景的证据；其结果用于与人工源码审查共同评估质量。
