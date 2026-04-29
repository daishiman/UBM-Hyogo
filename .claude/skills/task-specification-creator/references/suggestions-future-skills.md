# Suggestions: Future Skills（提案メモ）

`task-specification-creator` から派生して将来検討すべき新規スキルの提案メモ。
**承認前に新規スキルを作らない方針**（CONST_003: 仕様に基づくこと、推測追加しない）に基づき、
本ファイルは「ユーザー承認待ちのアイデア記録」のみを担う。

## 1. unassigned-task-validator（提案）

### 動機（出典）

- 04c admin backoffice / 05a Auth.js Phase 12 feedback で「未タスク仕様書（`task-*.md`）に
  4 必須セクションが揃っているかを目視確認している」運用の脆弱さが顕在化
- `references/unassigned-task-required-sections.md` に検証スクリプト
  （`scripts/audit-unassigned-tasks.js` / `scripts/verify-unassigned-links.js`）の設置が予告されているが、
  2026-04-29 時点で未実装（drift）

### 想定スコープ

| 項目 | 内容 |
| --- | --- |
| 入力 | `docs/30-workflows/unassigned-task/task-*.md` |
| 検証 | 4 必須セクション（苦戦箇所 / リスクと対策 / 検証方法 / スコープ）の存在 |
| リスク表許容 | 2 列形式（リスク / 対策）を最低要件、3 列（影響列追加）も PASS |
| 出力 | violation 一覧 + exit code |

### なぜ今は作らないか

- 仕様（4 セクション要件）は固まっているが、運用上は手動レビューで足りている
- スキル化より先に `scripts/` 配下の決定論的監査スクリプトとして実装するのが Script First 原則に合致
- ユーザー承認後に「skill 化 vs script 化」を AskUserQuestion で確認すること

## 2. phase-12-output-auditor（提案）

### 動機（出典）

- 04c / 05a で `outputs/phase-12/artifacts.json` の root parity / NON_VISUAL alt-evidence /
  必須見出しの抜けが繰り返し指摘されている
- 既存 `assets/evidence-bundle-template.md` のチェックリストは存在するが、人間が手で照合している

### 想定スコープ

| 項目 | 内容 |
| --- | --- |
| 入力 | `docs/30-workflows/<task>/outputs/phase-12/` 一式 |
| 検証 | artifacts.json の root / outputs parity、NON_VISUAL evidence ファイル名、必須見出し |
| 連携 | `assets/evidence-bundle-template.md` を仕様正本として読む |

### なぜ今は作らないか

- `evidence-bundle-template.md` の Task 2 チェックリストが先行して導入された段階
- スキル化より先に script 化（`scripts/audit-phase12-outputs.js` 等）が Script First 原則に合致
- ユーザー承認後にスキル / script どちらにするか確定する

## 3. 共通方針

- 本書のアイデアを実装する場合は **必ず AskUserQuestion** で承認を取る
- 実装は原則 `scripts/` の決定論スクリプト → 必要なら skill として wrap、の順で進める
- スキル化する場合は `skill-creator` を起点に collaborative モードで設計する

## 関連リンク

- `references/unassigned-task-required-sections.md`
- `assets/evidence-bundle-template.md`
- `references/phase-template-core.md`（Phase 2 OAuth/session 共有契約 ADR）
