# issue-196-03b-followup-003-response-email-unique-ddl - タスク仕様書 index

[実装区分: 実装仕様書]

> 判定根拠: 本タスクは spec docs (`database-schema.md`) と DDL コメント (`apps/api/migrations/0001_init.sql` / `0005_response_sync.sql`) の正本化を伴う。DDL コメント編集はソースコード変更であり、CONST_005 必須項目（変更対象ファイル・差分方針・テスト・ローカル実行コマンド・DoD）が必要なため実装仕様書として作成する。スキーマ自体（CREATE TABLE / UNIQUE 制約）は変更しない（既に `member_identities.response_email TEXT NOT NULL UNIQUE` が `0001_init.sql:90` に存在）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | ISSUE-196 / 03b-followup-003 |
| タスク名 | response_email UNIQUE 制約の DDL / spec 明文化 |
| ディレクトリ | docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl |
| Wave | 2026-05-02 起票 |
| 実行種別 | sequential（小粒・単独着手） |
| 作成日 | 2026-05-02 |
| 担当 | unassigned |
| 状態 | implemented-local-static-evidence-pass / pr-pending-user-approval |
| タスク種別 | implementation |
| サブタイプ | spec-drift-correction（DDL コメント + spec doc の正本化） |
| visualEvidence | NON_VISUAL |
| implementation_mode | edit |
| priority | MEDIUM |
| GitHub Issue | #196（CLOSED のまま運用。本仕様書は seed spec から再構築） |
| 補足 | Issue #196 は 2026-05-02 に CLOSED。再オープンせず、本 workflow では `Refs #196` のみを使う。spec / DDL コメント編集 + 静的検証 evidence は今サイクルで完了済み。残るは Phase 13 (PR 作成) のみで、CONST_002 によりユーザー承認後に実施 |

## 目的

`response_email` の UNIQUE 制約は実体として `member_identities.response_email` にあるが、03b Phase 12 検出表 #4 では `member_responses.response_email UNIQUE 制約の DDL 上の明文化` と誤記されており spec ドリフトの兆候となっている。

このドリフトを次の 2 経路で正本化する:

1. `aiworkflow-requirements` skill の `references/database-schema.md` に「`response_email` UNIQUE は `member_identities` 側に存在し、`member_responses` 側には存在しない」旨を明示する。
2. `apps/api/migrations/0001_init.sql` の `member_identities.response_email` 行と `member_responses.response_email` 行の DDL コメントに UNIQUE 所在の差分を明記する（`0005_response_sync.sql` の既存コメントとの整合も取る）。

CREATE TABLE / 制約自体は変更しない。コメントと spec の文言のみを更新する。

## スコープ

### 含む

- `.claude/skills/aiworkflow-requirements/references/database-schema.md` への UNIQUE 所在明文化（行 50-51 周辺、および対応する table 定義節）
- `apps/api/migrations/0001_init.sql` の DDL コメント追加（実 SQL は変更しない、コメント行のみ）
  - `member_responses.response_email` 行に「※ UNIQUE は `member_identities.response_email` 側で宣言されている」コメント
  - `member_identities.response_email TEXT NOT NULL UNIQUE` 行への補足コメント
- `apps/api/migrations/0005_response_sync.sql` 既存コメント（行 7）と表現を統一
- 03b 検出表 #4 の表記訂正（`member_responses` → `member_identities`）を Phase 12 不変条件として記録
- `lessons-learned-03b-response-sync-2026-04.md` の本ドリフトに関する既存記載との整合確認

### 含まない

- スキーマ変更（CREATE TABLE / ALTER TABLE / index 追加）
- production / staging D1 への migration 適用
- response_sync 実装ロジック変更
- 03b workflow 配下 `unassigned-task-detection.md` の上書き（completed task 配下のため履歴改ざん禁止）
- `member_responses` 側に新たに UNIQUE を追加する判断（不変条件: 履歴行は同一 email で複数許容する）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | Phase 12 検出表 #4 の発見元 |
| 上流 | 0001_init.sql / 0005_response_sync.sql | UNIQUE 制約の実体 |
| 並列 | なし | |
| 下流 | 01a-parallel-d1-database-schema-migrations-and-tag-seed | spec 同期後に追加 follow-up があれば連携 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| seed | （Issue #196 body） | 起票元の要件 |
| 必須 | `apps/api/migrations/0001_init.sql` | UNIQUE 制約の実体（行 90） |
| 必須 | `apps/api/migrations/0005_response_sync.sql` | 既存正本化コメント（行 7） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | spec doc 編集対象 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/lessons-learned-03b-response-sync-2026-04.md` | 過去 lesson との整合 |
| 参考 | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/unassigned-task-detection.md` | 検出元（読み取り専用） |

## 受入条件 (AC)

- AC-1: `database-schema.md` に「`response_email` UNIQUE は `member_identities` 側のみ」と明示されている
- AC-2: `0001_init.sql` の `member_responses.response_email` 行に「UNIQUE 制約はここではなく `member_identities` 側」コメントが追加されている
- AC-3: `0001_init.sql` の `member_identities.response_email` 行に「これが正本 UNIQUE」コメントが追加されている
- AC-4: `0005_response_sync.sql` の既存コメント（行 7）と新コメント文言が齟齬しない
- AC-5: スキーマ自体（CREATE TABLE / 制約）に差分がない（`git diff` で SQL 実行に影響する行が変更されていない）
- AC-6: `pnpm typecheck` / `pnpm lint` が PASS
- AC-7: D1 migration の hash 不整合や migration 再適用要件が発生しない（コメント変更のみのため未適用 D1 でも影響なし、ただし既適用 D1 で migration hash drift が発生しないことを Phase 6 で確認）
- AC-8: 03b 検出表 #4 の誤記が Phase 12 で「正本: `member_identities`」として記録されている
- AC-9: skill 検証 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）PASS

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | done | outputs/phase-01/main.md |
| 2 | 設計（コメント文言・spec 表記） | phase-02.md | done | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | done | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | done | outputs/phase-04/main.md |
| 5 | 実装手順 | phase-05.md | done（コード反映済み） | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | done | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | done | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | done | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | done | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | done | outputs/phase-10/main.md |
| 11 | 手動 smoke test | phase-11.md | done（typecheck / lint / SQL semantic diff PASS。D1 migration list は production 接続のため Phase 13 と同時実施） | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | done | outputs/phase-12/main.md |
| 13 | PR 作成 | phase-13.md | blocked_until_user_approval | outputs/phase-13/main.md |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #3 | `responseEmail` はフォーム項目ではなく system field | DDL コメントで UNIQUE 所在を明文化することで強化 |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | spec / コメント編集のみで境界に変更なし |

## 完了判定

- Phase 1〜12 の状態が `artifacts.json` と一致する → **達成済み（全 phase done）**
- AC-1〜AC-9 が Phase 7 / 10 / 12 でトレースされる → **静的証跡は達成済み（AC-1〜AC-6 / AC-8 / AC-9 PASS、AC-7 は production D1 接続を伴うため Phase 13 承認時に取得）**
- DDL コメントと spec doc が「UNIQUE on `member_identities.response_email`」で一意に記述されている → **達成済み（`git diff` で 3 ファイル反映確認）**
- `git diff` で SQL semantics に影響する行が 0 件 → **達成済み（Phase 11 evidence 参照）**
- Phase 13 はユーザー明示承認後にのみ実行する → **保留中（CONST_002）**

## 苦戦想定

1. **コメント変更が migration hash drift を引き起こすか**: SQL semantics diff は 0 行で静的確認済み。外部 D1 の applied 状態確認は production 接続を伴うため、Phase 13 承認時に `wrangler d1 migrations list` 相当の evidence として取得する。
2. **0005 既存コメントとの文言齟齬**: 「再宣言なし」と「正本」の語彙を統一する必要あり（Phase 2 で文言テンプレートを決定）。
3. **completed-tasks 配下の検出表を書き換えてしまう**: `docs/30-workflows/completed-tasks/03b-.../phase-12/unassigned-task-detection.md` は履歴であり編集禁止。本仕様書 Phase 12 にのみ正本訂正を記録する。
4. **CLOSED Issue #196 との関係**: Issue は CLOSED だが seed が未消化だったため本 workflow を作成した。Phase 12 で再オープン不要と判定し、PR では `Refs #196` のみを使う。

## 関連リンク

- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/196 （CLOSED）
- 上流 workflow: ../completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/
- DB spec: ../../../.claude/skills/aiworkflow-requirements/references/database-schema.md
