# 慧展业 文档中心 / Docs Index

> 慧展业（smart-expand）客户经理工作台需求与版本文档汇总。
> 内容来源：[`akarozu/hui-zhan-ye-doc`](https://github.com/akarozu/hui-zhan-ye-doc)（已整理迁入本仓库 `docs/prd/`）。

## 目录结构

```
docs/
├── README.md                  ← 本文件（总索引 / 检索入口）
└── prd/                       ← 产品需求文档（PRD）总目录
    ├── requirements/          ← 正式需求文档（已落地）
    │   └── hui-zhan-ye-frontend-v1.0.md
    ├── versions/              ← 版本台账与变更日志
    │   └── changelog.md
    ├── drafts/                ← 草稿仓库（尚未落地的需求）
    │   └── README.md
    └── archive/               ← 归档备份（废弃版本）
        └── README.md
```

| 目录 | 用途 | 对应源仓库目录 |
|------|------|----------------|
| [`prd/requirements/`](./prd/requirements/) | 已落地正式需求文档 | `02-正式需求文档/` |
| [`prd/versions/`](./prd/versions/) | 版本台账与变更记录 | `03-版本管理文件/` |
| [`prd/drafts/`](./prd/drafts/) | 尚未落地的草稿 | `01-草稿仓库/` |
| [`prd/archive/`](./prd/archive/) | 废弃版本归档 | `04-归档备份/` |

---

## 文档清单

### 正式需求

| 文档 | 当前版本 | 落地日期 | 关联原型 |
|------|----------|----------|----------|
| [慧展业前端 - 产品需求文档](./prd/requirements/hui-zhan-ye-frontend-v1.0.md) | v1.0 (含 v1.6 拓展) | 2026-05-17 | 慧展业_收单工作台_20260427.html |

### 版本管理

| 文档 | 说明 |
|------|------|
| [版本总台账 / Changelog](./prd/versions/changelog.md) | 全部需求文档的版本变更历史 |

---

## 按模块检索 — 慧展业前端 v1.0

下表把需求文档主要章节按业务模块整理，方便定位字段、交互、字段规范来源。

| 模块 | 主要内容 | 章节锚点 |
|------|----------|----------|
| 产品概述 | 产品定位、目标用户、客户端类型 | [§1](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#1-产品概述) |
| 页面结构 | 整体架构、页面清单 | [§2](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#2-页面结构与导航) |
| 首页（收单工作台） | KPI 概览、通知横幅、快捷操作、商户列表 | [§3](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#3-首页---收单工作台) |
| 收入明细页 | 入口、筛选、交易记录 | [§3.5](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#35-收入明细页) |
| 历史业绩页 | 月度数据、年度业绩汇总（v1.6 拓展） | [§3.6](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#36-历史业绩页) |
| 商户详情页 | 经营/资产、他行同名转出、商机、基础信息、状态、操作、额度管理弹窗、动态二级页 | [§4](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#4-商户详情页) |
| 动态消息 | 分类 Tab、消息条目、政策/培训/通知二级页 | [§5](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#5-动态消息) |
| 我的中心 | 个人信息、操作 | [§6](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#6-我的中心) |
| 补贴政策 | 活期月日均补贴档位 | [§7](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#7-补贴政策全局) |
| 字段规范汇总 | 金额、日期时间、枚举值定义 | [§8](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#8-字段规范汇总) |
| 交互规范 | 跳转、数据加载、空状态、异常处理 | [§9](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#9-交互规范) |
| 性能要求 | 首屏、切换、滚动、懒加载、分页 | [§10](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#10-性能要求) |
| 响应式适配 | 320–428px 断点策略 | [§11](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#11-响应式适配) |
| 页面路径地图 | 路由总览树形图 | [§12](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#12-页面路径地图) |
| 待确认项 | 产品/技术待办问题 | [§13](./prd/requirements/hui-zhan-ye-frontend-v1.0.md#13-待确认项) |

---

## 文档管理规范

1. **新增需求**：先在 `prd/drafts/` 起草，原型确认落地后迁入 `prd/requirements/`，并在 `prd/versions/changelog.md` 登记一行。
2. **版本升级**：直接在 `prd/requirements/` 内创建新版本文件（如 `*-v1.1.md`），旧版若被替代则迁入 `prd/archive/`。
3. **变更类型**：ADD（新增）/ EXTEND（拓展）/ MODIFY（修改）/ DEPRECATE（废弃）。
4. **命名规范**：
   - 正式文档：`<feature-name>-vX.Y.md`（小写连字符，便于检索与跨平台兼容）
   - 草稿：`<feature-name>-draft-vX.Y.md`
   - 归档：原文件名 + `-deprecated-YYYY-MM-DD`
5. **关联原型**：所有正式需求需在文档顶部 frontmatter 注明关联原型文件名。

---

## 关联资源

- **源文档仓库**：<https://github.com/akarozu/hui-zhan-ye-doc>
- **慧展业原型站点**：<https://zhanye.qintnt.top>
- **本仓库 README**：[`../README.md`](../README.md)
