# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 の AC と Phase 2 の operation flow を多角的にレビューし、production apply の安全性 / 不可逆性 / SSOT 整合を検証する。

## 実行タスク

- Phase 1 の AC-1〜AC-8 と Phase 2 の operation flow を照合する。
- production D1 への書き込み操作が Phase 13 承認後にだけ現れることを確認する。
- scope 外の code deploy / fallback retirement / direct update guard が混入していないことを確認する。

## レビュー観点

### 1. システム整合性

- migration apply 対象 (`0008_create_schema_aliases.sql`) の DDL は `IF NOT EXISTS` 主体で冪等性を担保しているか。
- 既存 production table（`schema_questions`, `schema_diff_queue` 等）への破壊的影響が無いか（CREATE のみで ALTER / DROP は無い）。
- production environment 識別子（`--env production` / `ubm-hyogo-db-prod`）が `apps/api/wrangler.toml` の SSOT と一致しているか。

### 2. 不可逆性 / 承認境界

- Phase 13 のユーザー承認前に production CLI を実行する step が混入していないか。
- inventory 取得 (`migrations list` / `SELECT name FROM sqlite_master`) は read-only であり、Phase 12 までに実施しても問題ないが、本タスクでは「Phase 13 開始時にまとめて実行」する設計であることを再確認する。
- rollback 経路（drop table）が Phase 6 で定義予定であることを確認する。

### 3. CLI / secrets policy

- `bash scripts/cf.sh` ラッパー以外の経路（`pnpm wrangler`, 直接 `wrangler` 等）が手順に紛れていないか。
- `.env` の op 参照 / 1Password Vault に CLOUDFLARE_API_TOKEN が登録されている前提を Phase 5 で確認する。

### 4. SSOT 同期

- `.claude/skills/aiworkflow-requirements/references/database-schema.md` の production apply 状態 marker の更新方針が Phase 12 に含まれているか。
- `task-workflow-active.md` の active workflow 一覧に本タスクが反映されるか。

### 5. スコープ守備

- code deploy / fallback retirement / direct update guard / 07b endpoint rename / apps/web 変更が混入していないか。
- `0008_schema_alias_hardening.sql` 等 0008 系以降の追加 migration が apply 経路から除外されているか確認する。

## レビュー結果テンプレ

| 観点 | 判定 | 補足 |
| --- | --- | --- |
| 1. システム整合性 | OK / NG | |
| 2. 不可逆性 / 承認境界 | OK / NG | |
| 3. CLI / secrets policy | OK / NG | |
| 4. SSOT 同期 | OK / NG | |
| 5. スコープ守備 | OK / NG | |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| requirements | `phase-01.md` | AC / scope / approval gate |
| design | `phase-02.md` | operation flow |
| migration SSOT | `apps/api/migrations/0008_create_schema_aliases.sql` | destructive statement 不在確認 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| review result | `phase-03.md` | 5 観点レビューと NG 時の差戻し方針 |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 4 | review 観点を static / local / production verification に変換 | `phase-04.md` |
| Phase 10 | design GO / runtime GO の判定材料にする | `phase-10.md` |

## 完了条件

- [ ] 5 観点が全て OK で記録されている
- [ ] NG が出た場合は Phase 1/2 を修正してから次 Phase に進む
- [ ] 本Phase内の全タスクを100%実行完了

## 次Phase

Phase 4: テスト戦略
