# Phase 5: runbook 本体作成（中核成果物）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 5 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| subtype | production-migration-runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. Phase 2 で確定した runbook 構造（Overview / 承認ゲート / Preflight / Apply / Post-check / Evidence / Failure handling / Smoke 制限）に従い、`outputs/phase-05/main.md` に **production migration apply runbook 本体** を配置する。
2. runbook 本体は実運用で迷わず使える粒度（コマンド・期待結果・停止条件）まで書き下す。
3. 本タスク内では production への apply を**実行しない**境界を、runbook 冒頭と Phase 5 仕様書の双方で明記する。
4. evidence 保存項目（コマンド・出力・時刻・承認者・対象 DB・SHA）と保存先（`outputs/phase-11/...`）を一意に決める。
5. `bash scripts/cf.sh` 経由のみを許可し、`wrangler` 直接呼びをコードブロックから排除する。

## 目的

UT-07B の `apps/api/migrations/0008_schema_alias_hardening.sql` を本番 D1 (`ubm-hyogo-db-prod`) に適用する際の「承認ゲート → preflight → apply → post-check → evidence → failure handling → smoke 制限」の 7 段ワークフローを、Token 値・Account ID を残さず再現可能な runbook として正式化する。本仕様書では runbook 本体の章立て・各章の必須記載項目・期待結果を全て書き下す。

## 参照資料

- `index.md`（AC-1〜AC-12）
- `artifacts.json`
- `phase-02.md`（runbook 章立て・承認ゲート設計）
- `phase-04.md`（テスト戦略 / TC-D / TC-R / TC-N / TC-E）
- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `apps/api/wrangler.toml`（`[env.production]` binding）
- `scripts/cf.sh`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`

## 入力

- Phase 2 成果物（runbook 構造・承認ゲート設計）
- Phase 4 成果物（TC-D / TC-X / TC-R / TC-N / TC-E）
- 上流 UT-07B 完了済み migration SQL
- 上流 U-FIX-CF-ACCT-01（production Token scope 最小化済み）

## 新規作成 / 修正ファイル一覧

| 種別 | パス | 変更概要 |
| --- | --- | --- |
| 新規 | outputs/phase-05/main.md | production migration apply runbook 本体（下記章立てを内包） |
| 参照のみ | apps/api/migrations/0008_schema_alias_hardening.sql | 適用対象 SQL（変更しない） |
| 参照のみ | apps/api/wrangler.toml | DB binding 確認のみ（変更しない） |
| 参照のみ | scripts/cf.sh | 実行ラッパ（変更しない） |

## 運用境界（最重要）

- 本タスク内では production migration を **実行しない**。
- 実行は次の 4 条件すべて満たした後に、別運用として行う。
  1. 対象 commit が `main` に merge 済み
  2. PR が CLOSED（merged）状態
  3. ユーザーから明示の apply 承認を取得
  4. runbook（本仕様の `outputs/phase-05/main.md`）が確定済み
- Cloudflare / Wrangler 操作は `bash scripts/cf.sh` 経由のみ許可（`wrangler` 直接呼び禁止）。
- Token 値 / OAuth トークン値 / Account ID 値は runbook・evidence のいずれにも記録しない。

## runbook 本体の章立て（`outputs/phase-05/main.md` に書き下す内容）

以下の 8 セクションを必須とする。各セクションの中身は本仕様書で詳細に書き下し、`outputs/phase-05/main.md` ではそのまま運用ドキュメントとして使える粒度で展開する。

---

### Section 1: Overview / 適用対象

**必須記載項目**

- 適用対象 SQL: `apps/api/migrations/0008_schema_alias_hardening.sql`
- 対象 D1 DB: `ubm-hyogo-db-prod`
- 対象環境フラグ: `--env production`（apps/api/wrangler.toml `[env.production]` の binding）
- 適用対象オブジェクト一覧:
  - `schema_aliases` table 作成
  - `idx_schema_aliases_revision_stablekey_unique`（UNIQUE index, partial）
  - `idx_schema_aliases_revision_question_unique`（UNIQUE index, partial）
  - `schema_diff_queue.backfill_cursor` カラム追加（ALTER TABLE）
  - `schema_diff_queue.backfill_status` カラム追加（ALTER TABLE）
- 上流タスク: UT-07B-schema-alias-hardening-001（migration 実装元）
- 関連 runbook: UT-07B Phase 5 `migration-runbook.md` / `rollback-runbook.md`
- 本タスク内では apply を実行しないこと、Phase 13 ユーザー承認後の別運用として行うことを明記。

---

### Section 2: 承認ゲート

**必須記載項目（チェックリスト形式）**

- [ ] 対象 commit SHA が確定し、本 runbook 内に記録されている
- [ ] PR が `main` へ merge 済み（PR 番号と merge commit SHA を記録）
- [ ] PR が CLOSED（merged）状態であること
- [ ] ユーザーから「production apply 承認」の明示文言を取得済み（取得日時・依頼経路を記録）
- [ ] 承認者の同一性確認（GitHub user / 1Password operator が一致）
- [ ] 直前 24h で `gh run list --branch main --workflow=backend-ci --limit 5` が全 success
- [ ] runbook（`outputs/phase-05/main.md`）が最新 commit を参照していることを確認

> いずれか 1 項目でも未充足なら apply に進まない。承認ゲート未充足のまま `cf.sh d1 migrations apply` を実行することは禁止。

---

### Section 3: Preflight

**必須記載項目**

- 認証疎通確認:

  ```bash
  bash scripts/cf.sh whoami
  ```

  期待: exit=0、Token 値は出力されない、想定 account に紐付くこと。

- 対象 DB 一覧確認:

  ```bash
  bash scripts/cf.sh d1 list
  ```

  期待: exit=0、`ubm-hyogo-db-prod` が一覧に存在。

- production 未適用 migration の抽出:

  ```bash
  bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
  ```

  期待: exit=0、`0008_schema_alias_hardening.sql` が **未適用** 一覧に含まれる。既に適用済みの場合は Section 7（Failure handling）の「二重適用検知」へ分岐し apply に進まない。

- schema 状態確認（apply 前 baseline）:

  ```bash
  bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('schema_aliases','schema_diff_queue');"
  bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
    "PRAGMA table_info(schema_diff_queue);"
  ```

  期待:
  - `schema_aliases` が baseline に存在しない（または UT-07B 前段の `0008_create_schema_aliases.sql` で既に作成済みなら根拠を Section 7「二重適用検知」で扱う）
  - `schema_diff_queue` の `table_info` に `backfill_cursor` / `backfill_status` が存在しない（既存なら同上）

- 対象 commit と migration ファイルの hash 確認:

  ```bash
  git rev-parse HEAD
  git log -1 --format='%H %s' -- apps/api/migrations/0008_schema_alias_hardening.sql
  ```

  期待: 承認済み commit SHA と一致。

> Preflight のいずれかが想定外の場合、apply に進まず Section 7 へ。

---

### Section 4: Apply 手順

**必須記載項目**

- 起動コマンド（コードブロック内は `cf.sh` のみ）:

  ```bash
  bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
  ```

- 期待結果:
  - exit code = 0
  - 出力に `0008_schema_alias_hardening.sql` の適用ログが含まれる（"Migration applied" 相当）
  - 適用件数 = 1（既適用なら Preflight 段階で検知され、ここに到達しない）

- 禁止事項:
  - `wrangler d1 migrations apply` 直接呼び出し
  - `set -x` の有効化
  - apply コマンド出力を `tee` で raw 保存する場合は redaction gate（TC-E01〜E04）を後段に必須配置
  - 失敗時に「とりあえず再実行」する自己判断（Section 7 へ即分岐）

- 実施時刻記録:

  ```bash
  date -u +%Y-%m-%dT%H:%M:%SZ
  ```

  apply 直前 / 直後の UTC 時刻を evidence に記録。

---

### Section 5: Post-check

**必須記載項目（SQL とコマンド）**

- `schema_aliases` table 存在確認:

  ```bash
  bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
    "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_aliases';"
  ```

  期待: 1 行（`schema_aliases`）。

- UNIQUE index 2 件存在確認:

  ```bash
  bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
    "SELECT name FROM sqlite_master WHERE type='index' AND name IN ('idx_schema_aliases_revision_stablekey_unique','idx_schema_aliases_revision_question_unique');"
  ```

  期待: 2 行。

- `schema_diff_queue` 追加カラム存在確認:

  ```bash
  bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
    "PRAGMA table_info(schema_diff_queue);"
  ```

  期待: `backfill_cursor` / `backfill_status` の 2 行を含む。

- 適用後の migration list 確認:

  ```bash
  bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
  ```

  期待: `0008_schema_alias_hardening.sql` が **適用済み** 側に移動。

- read-only smoke の制限:
  - 上記 SELECT / PRAGMA / migrations list のみ許可。
  - INSERT / UPDATE / DELETE / DROP は post-check では一切実行しない（Section 8 参照）。

---

### Section 6: Evidence 保存

**必須保存項目**

| 項目 | 保存形式 | 備考 |
| --- | --- | --- |
| 実行コマンド | テキスト（cf.sh 経由のみ） | `wrangler` 直叩きは禁止 |
| 実行 exit code | テキスト | 全 step で記録 |
| 実行件数 / 出力サマリ | テキスト（行数・件数のみ） | raw 全文は禁止、redaction 後のみ |
| 実行 UTC 時刻 | `date -u +%Y-%m-%dT%H:%M:%SZ` 形式 | apply 直前 / 直後 |
| 承認者 | GitHub user / 1Password operator | Token 値は記録しない |
| 対象 DB 名 | `ubm-hyogo-db-prod` | 取り違え防止 |
| 対象環境 | `--env production` | 同上 |
| 対象 SQL ファイル名 | `apps/api/migrations/0008_schema_alias_hardening.sql` | フルパス |
| commit SHA | `git rev-parse HEAD` | apply 時点の HEAD |
| migration hash | `git log -1 --format='%H'` | 対象 SQL を最後に変更した commit |

**保存先**

- `outputs/phase-11/main.md`（NON_VISUAL evidence）
- 補助保存先: `outputs/phase-11/post-check-results.md`（SQL 結果サマリ）

**禁止事項**

- Token 値・OAuth トークン値・Account ID 値の記録
- raw 出力の貼付（必ず行数・件数・redaction 後の要約のみ）
- スクリーンショット（NON_VISUAL タスクのため画像を作らない）

---

### Section 7: Failure handling

**必須記載項目**（詳細は Phase 6 を参照、本セクションでは停止条件のみ列挙）

| 異常 | 検出経路 | 停止条件 | 復旧方針 |
| --- | --- | --- | --- |
| 二重適用検知 | Preflight `migrations list` で既適用 | apply に進まない | Section 7-A: 適用済み事実を evidence に記録し終了 |
| UNIQUE index 衝突 | apply 中に UNIQUE 制約 fail | 即停止 | Section 7-B: rollback 不可。手動で重複行特定 → ユーザー判断待ち |
| ALTER TABLE duplicate column | apply 中に "duplicate column" | 即停止 | Section 7-C: Preflight 漏れを記録、判断待ち |
| 対象 DB 取り違え | Preflight `--env` 確認漏れ | apply に進まない | Section 7-D: `--env production` と DB 名を再確認 |
| ネットワーク中断 / API 一時失敗 | exit≠0、再現性確認 | 1 回のみ再試行可、それ以上は停止 | Section 7-E: 再試行ログを evidence に記録 |
| evidence へ Token 混入 | TC-E01〜E04 の grep gate | Phase 11 確定前に再 redact | Section 7-F: 該当行を削除し Token Roll を検討 |

> rollback 可否は UT-07B `rollback-runbook.md` の方針に従う。index 由来の失敗は drop で復旧、collision は手動 quarantine、back-fill cursor 失敗は route rollout 前に停止。**自己判断で追加 SQL を即興発行することは禁止**、ユーザー承認を待つ。

---

### Section 8: Smoke 制限

**必須記載項目**

- post-check では read-only smoke のみ許可: SELECT / PRAGMA / `migrations list`。
- destructive な apply smoke（INSERT / UPDATE / DELETE / DROP / 別 migration の dry-run apply）は **別承認** に分離する。
- 別承認の対象は本 runbook の責務外。必要なら別タスク（例: UT-07B-FU-04）として起票する。
- back-fill cursor / status を使う実 back-fill 処理は queue / cron split 別タスクで扱い、本 runbook には含めない。

---

## Token 値非記録ガード

- 本仕様書および `outputs/phase-05/main.md` には Token 値・Account ID 値・OAuth トークン値の例示すら記載しない。
- runbook 実行時、`cf.sh` 出力を `tee` / file リダイレクトする場合は redaction gate（TC-E01〜E04）を後段必須。
- `set -x` の有効化禁止。`history -c`（zsh）でターミナル履歴をクリアしてから evidence 化。
- Phase 11 evidence 確定直前に TC-E01〜E04 を再実行する gate を設ける。

## 統合テスト連携

- 本タスクは migration runbook の文書化であり、アプリケーション統合テストは追加しない。
- runbook 検証は Phase 4 の TC-D / TC-X / TC-R / TC-N / TC-E のみで完結する。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 「本タスク内では apply 実行しない」境界を Overview / 承認ゲート / Section 7 で一貫して明記。`bash scripts/cf.sh` 経由のみで `wrangler` 直叩きを排除 |
| 漏れなし | PASS | 8 セクション（Overview / 承認ゲート / Preflight / Apply / Post-check / Evidence / Failure handling / Smoke 制限）と対象 5 オブジェクト（table / 2 UNIQUE index / 2 カラム）を全て記載 |
| 整合性あり | PASS | UT-07B の `migration-runbook.md` / `rollback-runbook.md` を継承し、production 文脈に拡張。AC-1〜AC-10 の各 AC が runbook セクションに 1 対多でマップ |
| 依存関係整合 | PASS | 上流 UT-07B（migration 実装）／ U-FIX-CF-ACCT-01（Token scope）／ Phase 2 設計を前提とし、下流 Phase 6 異常系 / Phase 7 AC マトリクス / Phase 11 evidence へ正しく接続 |

## 完了条件

- [ ] `outputs/phase-05/main.md` に 8 セクション全てが書き下されている
- [ ] 対象 5 オブジェクト（schema_aliases / 2 UNIQUE index / 2 カラム）が runbook 内で特定されている
- [ ] 承認ゲートのチェックリスト 7 項目が記載されている
- [ ] Preflight / Apply / Post-check の各コマンドが `bash scripts/cf.sh` 経由で記述されている
- [ ] Evidence 保存項目（10 項目）と保存先が定義されている
- [ ] Failure handling 6 異常と停止条件が記載されている
- [ ] Smoke 制限（read-only のみ、destructive は別承認）が明記されている
- [ ] 「本タスクでは apply を実行しない」境界が Overview と Section 2 / Section 7 の双方で記述されている
- [ ] Token 値・Account ID 値が runbook・仕様書のどこにも記載されていない（TC-E01 / TC-E02 で grep 0 件）

## 成果物

- `outputs/phase-05/main.md`（runbook 本体を内包）
