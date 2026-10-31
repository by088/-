# Lab1 Phase 1：SVG CLI 编辑器

## 当前计划

使用 TypeScript、Command、Composite 与快照式 Memento 实现六种图形和全部 Phase 1 命令。

目录与依赖：`cli → application → domain`；`infrastructure → application 的文件端口 + domain`；`main.ts` 负责装配。
领域对象封装几何变换、属性验证和树操作，CLI 不直接操作 XML。每个类单独文件，文件名与类名一致。

命令先在文档副本上执行，成功才替换当前文档并入历史；文档类成功后清空历史并设置 IO 屏障。
图形类型分派仅在 ShapeFactory，命令名分派仅在 CommandRegistry，均列为后续插件化的待重构项。

## 开发顺序

1. 工程骨架与架构方案。
2. 领域模型、六种图形和树操作。
3. Command、历史管理、CLI 和 SVG 文件适配器。
4. 自动化验收、示例与完整文档。

## 过程记录

- 根据任务材料明确 Phase 1 不实现 box；用户确认完成代码与 README，无需远程推送。
- 先确定依赖方向和事务边界，再实现领域模型，避免命令处理器成为包含所有逻辑的上帝类。

尚未完成的验证与最终自查将在实现结束后补充，不将计划写成已通过的结果。
