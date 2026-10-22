# 在 VS Code 中运行与验收

## 1. 打开工程

选择“文件 → 打开文件夹”，打开 svg-editor 文件夹。左侧应能看到 package.json、src、test、doc、examples。选择“终端 → 新建终端”。VS Code 出现工作区信任提示时，由你确认是否信任当前作业目录。

在终端输入：

```sh
pwd
node -v
npm -v
```

pwd 应指向 svg-editor；Node 版本应为 v24 或更高。若出现 command not found，可从 [Node.js 官方下载页](https://nodejs.org/en/download) 选择 Node.js 24 LTS，安装后重新打开终端。

## 2. 运行自动检查

当前目录已有依赖时可直接执行下面三条命令；首次安装依赖用 `npm install`。

```sh
npm run check
npm run format:check
npm test
```

预期：类型检查正常返回终端提示符；格式检查显示 All matched files use Prettier code style；测试末尾显示 fail 0。最新测试数量见 REVIEW.md。

测试输出中的每个勾号表示一项通过。测试工件保存在 work/test-artifacts 和 work/specification-runs，可保留检查。

## 3. 亲自输入命令

执行：

```sh
npm run cli
```

看到 `svg-editor 0.1` 和 `svg>` 后，逐条输入下面内容。每条命令后按回车；输入内容从 init 开始，省略提示符本身。

```text
init 400 200
create g scene
create rect r1 10 20 100 50 #4a90d9 in scene
create text t1 20 40 "你好 SVG" in scene
tree
move scene 30 10
show r1
undo
show r1
redo
show r1
set t1 text "验收通过"
scale scene 2
delete r1
undo
save work/manual-check.svg
undo
read work/manual-check.svg
tree
create box n1
```

关键验收点：

| 操作 | 预期 |
|---|---|
| 初始 tree | svg (400x200)，scene 内有 r1 和 t1 |
| move 后 show r1 | x=40 y=30 width=100 height=50 |
| undo 后 show r1 | x=10 y=20 width=100 height=50 |
| redo 后 show r1 | x=40 y=30 width=100 height=50 |
| scale scene 2 | r1 位置为 (80,60)，尺寸为 200×100，文字位置也随几何规则缩放 |
| delete r1 后 undo | 输出 rect#r1 restored into g#scene |
| save | saved to work/manual-check.svg (3 elements) |
| save 后 undo | error: undo not allowed after io command，这是原文规定的历史屏障 |
| read 后 tree | 保留 scene、r1、t1，文字为“验收通过” |
| create box n1 | error: unknown shape type: box (is the plugin loaded?)，符合后续阶段边界 |

空行状态按 Control-D 结束 CLI，返回普通终端。

## 4. 预览真正的 SVG

在 Finder 中找到工程 work/manual-check.svg，将它拖到浏览器窗口。画面应包含蓝色矩形和“验收通过”文字。也可查看 examples/flowchart.svg：应有蓝色“开始”节点、橙色“处理数据 v2”节点和连接线。

自动回放原文流程图：

```sh
npm run cli < examples/flowchart.txt
```

这条命令保存 examples/flowchart.svg。已有 SVG 覆盖前会保留同目录的唯一 .bak 备份。

## 5. 如何分辨问题来源

| 现象 | 排查 |
|---|---|
| node/npm: command not found | 检查 Node.js 安装及终端环境，重新打开终端 |
| ENOENT、找不到 package.json | 用 pwd 检查是否位于 svg-editor |
| ERR_MODULE_NOT_FOUND | 在工程目录安装依赖 |
| 错误提示提到 TypeScript 语法 | 检查 node -v，使用 Node.js 24+ |
| 输入 init 后 shell 提示 command not found | 先用 npm run cli 启动，等待 svg> |
| cannot write file | 检查保存目录和写入权限；先完成 npm test，确保 work 目录已建立 |
| 测试出现红色失败项 | 保留完整错误输出，按测试名定位，再确认需求与实现 |

## 6. 项目文件保留规则

运行只会新增测试工件和保存结果；覆盖 SVG 前先建立备份。现有提交和标签用于追踪版本。当前项目采用保留工件的测试方式。

## 本次电脑上的临时环境

本次 VS Code 终端通过已有 Node.js v24.19.0 与 npm 11.6.2 完成验证。当前终端的 npm 命令可直接使用；关闭后，临时环境会结束。新终端可按第 1 节安装官方 Node.js 24，再使用相同命令。
