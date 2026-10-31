# Lab1 Phase 1：SVG 编辑器（CLI）

TypeScript 面向对象的 SVG 命令行编辑器。支持六种图形、嵌套分组、SVG 读写与撤销重做。

Git 仓库：[https://github.com/by088/-](https://github.com/by088/-)（克隆地址：`https://github.com/by088/-.git`）。

## 运行

需要 Node.js 20 或更高版本。在本目录执行：

```sh
npm ci
npm run cli
```

输入 `help` 查看命令，按 Ctrl-D 退出。Windows 终端可使用 Ctrl-Z 后回车结束输入。

```sh
npm run --silent cli < examples/flowchart.commands
```

运行该脚本会生成 `examples/flowchart.svg`，可直接在浏览器打开。
也可以 `npm run build` 后运行 `node dist/main.js`。

- [项目文档](doc/README.md)
- [PlantUML 架构图源码](doc/architecture.puml)
- [流程图命令脚本](examples/flowchart.commands)
- [生成的流程图](examples/flowchart.svg)
- [外部 SVG 导入样例](examples/other.svg)
