# SVG Editor — Lab1 Phase 1

TypeScript 面向对象的 SVG 命令行编辑器。支持六种图形、嵌套分组、SVG 读写与撤销重做。

## 运行

需要 Node.js 20 或更高版本。在本目录执行：

```sh
npm ci
npm run cli
```

输入 `help` 查看命令，按 Ctrl-D 退出。Windows 终端可使用 Ctrl-Z 后回车结束输入。

```sh
npm run check
npm run --silent cli < examples/flowchart.commands
```

第二条命令生成 `examples/flowchart.svg`，可直接在浏览器打开。
也可以 `npm run build` 后运行 `node dist/main.js`。

- [完整架构、过程记录、一致性自查和质量保证](doc/README.md)
- [PlantUML 架构图源码](doc/architecture.puml)
- [流程图命令脚本](examples/flowchart.commands)
- [生成的流程图](examples/flowchart.svg)
- [外部 SVG 导入样例](examples/other.svg)

已通过 TypeScript 严格编译和 39 项自动化测试。项目包含分阶段 Git 提交，最终版本使用本地 `final` 标签。按用户确认的交付范围，无需推送远程仓库。
