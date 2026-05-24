# Phase 8: リファクタ

## 1. 必須リファクタ

本タスクで生まれる重複は最小化されているため、必須リファクタは **なし**。

## 2. 任意リファクタ（実施しない理由付き）

| 候補 | 判断 |
|---|---|
| `zoneTone` / `statusTone` を `apps/web/src/lib/public/member-tone.ts` 等に切り出し | 現状 1 箇所利用のため切り出さない（YAGNI / CLAUDE.md §「Don't add features beyond what the task requires」） |
| Segmented primitive を `@/components/ui` 配下で内部 generic 化 | 既存 API で十分。本タスクで lift しない |
| `legacy-public.css` を component-scoped CSS Modules に分解 | スコープ外。CONST_007 / 単一サイクル完了原則 |

## 3. 完了条件

- 必須リファクタなしを宣言
- 任意リファクタは判断根拠込みで「実施しない」を明記
