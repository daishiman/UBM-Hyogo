# Architecture Decision Records (ADR) — UBM 兵庫支部会

本ディレクトリはリポジトリの設計判断履歴 (Architecture Decision Records) を集約する。

## 命名規約

- ファイル名: `NNNN-<slug>.md`
  - `NNNN` は 4桁ゼロ詰め連番（`0001` から開始）
  - `<slug>` は kebab-case の短い識別子
- 各 ADR は以下の必須セクションを備える。
  - Status（Proposed / Accepted / Deprecated / Superseded by ADR-XXXX）
  - Context（なぜこの判断が必要だったか）
  - Decision（採用した方針）
  - Consequences（採用結果のメリット・デメリット・トレードオフ）
  - Alternatives Considered（不採用案とその理由）
  - References（一次資料・関連 ADR・関連タスクへの相対リンク）
- ADR は workflow outputs に依存せず単独で読み完結すること。一次資料の重要部分は ADR 内に転記する。
- 一度 Accepted になった ADR は原則として書き換えない。後継判断が必要な場合は新規 ADR を作り、
  旧 ADR の Status を `Superseded by ADR-NNNN` に更新する。

## 一覧

| ID | タイトル | Status | 日付 |
| --- | --- | --- | --- |
| [ADR-0001](./0001-git-hook-tool-selection.md) | Git hook ツールに lefthook を採用、husky を不採用 | Accepted | 2026-04-28 |

## 関連

- 派生元 workflow outputs: `docs/30-workflows/completed-tasks/`
- 本 ADR ディレクトリを新設したタスク仕様: `docs/30-workflows/task-husky-rejection-adr/`
