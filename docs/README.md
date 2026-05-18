# 慧展业 文档索引

本目录是 慧展业（smart-expand）项目所有可读文档的入口。代码、配置、脚手架请见仓库根目录与各模块。

## 目录约定

- 一级目录全部使用英文小写（kebab-case 或单词）。中文目录已废弃。
- 不在 `docs/` 根级直接放散文件，必须归入对应一级目录。
- 工程性文档（CI、贡献指南、分支保护说明）放 `.github/`，不进 `docs/`。

## 一级目录

| 目录 | 用途 |
|---|---|
| [`prd/`](prd/) | 产品需求文档（PRD），含正式需求、原型、草稿、版本台账与归档，详见 [`prd/requirements/`](prd/requirements/) 与 [`prd/prototypes/`](prd/prototypes/) |

## 跨目录工作流

- 新增需求：先在 [`prd/drafts/`](prd/drafts/) 起草，原型确认落地后迁入 [`prd/requirements/`](prd/requirements/)，并在 [`prd/versions/changelog.md`](prd/versions/changelog.md) 登记。
- 版本升级：在 `prd/requirements/` 内创建新版本文件（`*-vX.Y.md`），旧版被替代后迁入 [`prd/archive/`](prd/archive/)。
- 源文档仓库：<https://github.com/akarozu/hui-zhan-ye-doc>

## 贡献入口

- 仓库说明：[`../README.md`](../README.md)
