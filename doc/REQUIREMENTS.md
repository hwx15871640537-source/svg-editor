# Phase 1 要求与验收清单

权威原文：[phase_cli_1.md](phase_cli_1.md)。以下清单保留所有本阶段约束；勾选表示已实现并有验证，验证结果见 README。

- [ ] Git 分步真实提交、推送 GitHub/Gitee；最终提交标记 final，截止前推送（需用户提供仓库、认证及截止时间）。
- [ ] doc/README.md：职责与 PlantUML 图、Command 落地、依赖规则、变化点、讨论修订、一致性自查、质量保证。
- [ ] TypeScript OOP，封装字段、类层次、多态、一类一文件；禁止公共数据袋及分散类型分派。
- [ ] 仅命令分发与图形工厂允许按名字分派，在架构中列为待重构。
- [ ] Composite：容器/叶子统一 move、scale、set、delete；子树移动缩放递归生效。
- [ ] REPL 提示符 svg>，逐行输入，整行 # 注释，双引号支持空格，浮点坐标。
- [ ] id 大小写敏感且全局唯一；create/group 必填；read 缺 id 按标签名+序号补全，逐条输出指定 warning，避开所有显式 id。
- [ ] 错误一行 error: 前缀，失败不修改文档、路径、撤销/重做状态；编辑成功摘要，显示命令直接输出。
- [ ] init [w] [h] 默认 800×600；read <file.svg>；save [file.svg] 默认读入路径；canvas [w] [h]。
- [ ] create 六类及全部参数：rect x y w h [fill]；circle cx cy r [fill]；ellipse cx cy rx ry [fill]；line x1 y1 x2 y2 [stroke]；text x y content；g。
- [ ] 六类均支持尾部 in <containerId>；省略挂根；默认不写 fill/stroke。
- [ ] delete 子树；move 增量；scale 正 factor 同乘所有几何位置和尺寸。
- [ ] set 公共 fill/stroke/stroke-width、各类几何属性、text 的 text 内容；其余属性精确报错。
- [ ] group 多个现有图形，原相对顺序；拒绝祖先后代同时选择；ungroup 提升子节点并占据原位置，拒绝根级容器。
- [ ] addto 移到容器末尾，阻止循环；front/back 仅调整同级次序。
- [ ] tree [id] 内联关键几何属性、Unicode 树线；show <id> 父级与属性；help 全部语法。
- [ ] undo/redo 一条编辑一个单元；撤销结构、顺序、属性完整恢复；新编辑清 redo；显示不入栈。
- [ ] init/read/save/canvas 修改后 undo/redo 精确报 io 禁止；canvas 查询及失败命令不封锁。
- [ ] 4.2 全部本阶段错误逐字验证；未知类型含插件提示；未知属性包含属性名。
- [ ] SVG XML read/save、嵌套、转义、自动 id、读写失败原子性、浏览器可读；data-kind=box 无插件降级普通 g。
- [ ] 完整会话 6 与流程图 6.1 A 可回放；证明尺寸、中文 text、容器移动及撤销。
- [ ] 单元、集成、边界及架构检查；运行结果如实记录。

## 明确排除

4.4 与 6.1 B 是后续插件化阶段：box、ShapeProvider、派生部件 id、label/fill 传播、插件恢复、禁止拆解插件复合图形。本阶段不实现 box；create box 输出 unknown shape type。原文“cannot ungroup composite shape”在本阶段没有可创建的对应类型，不伪造 box 来验收。

## 原文未明确的规则（设计决策，不冒充原文）

1. 跨父 group：按原文档深度优先顺序收编，在首个选中节点原父级、原位置插入新 g。同父输入顺序不改变原 z-order。
2. front 为 SVG 绘制最前（数组末尾），back 为数组头。addto 拒绝把自身或祖先放入后代。
3. 空历史报 nothing to undo/redo。成功 I/O 清空历史并封锁；下一次成功编辑解除封锁。失败不解锁或清历史。
4. init 单参数只指定宽，高默认 600；canvas 修改要求宽高成对；尺寸正数，半径/宽高/stroke-width 非负，全部数字有限。
5. 无默认保存路径报 error: no file path. use 'save <file.svg>'；save 成功记住路径。
6. 支持本阶段六类 SVG 和 translate/scale 容器变换；其他变换或未知图形拒绝读入，避免静默损坏。忽略注释与 XML 声明；不执行 DTD/实体扩展。
7. 树列宽动态对齐（示例空格为排版）；show 根父级显示 svg；输出计数包括全部 g 和叶子，不含 svg 根。
8. help 在无文档时可用；空行、注释不产生输出。不新增 exit 命令，以 EOF 退出。
