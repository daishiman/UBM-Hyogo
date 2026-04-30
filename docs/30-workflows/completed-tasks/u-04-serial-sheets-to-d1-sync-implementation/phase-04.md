# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-30 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

Phase 1 の AC-1〜AC-12、Phase 2 の 9 ファイル module tree、Phase 3 の採用案 A（DB 排他 mutex / `submittedAt` delta / D1 batch backfill / audit ローカル / Service Account JWT）を前提に、unit / contract / integration / static の 4 layer test を test ID 体系に展開し、TECH-M-01〜04（mutex race / 同秒取りこぼし / running 漏れ / shared 化検討）の検証手段を確定する。**TDD 戦略は audit writer 先行**（全 sync 経路の依存基盤のため）とし、`apps/api/src/sync/audit.ts` のテストを最初に green にしてから上位 handler を実装する。

## 実行タスク

1. test layer × tool × scope × 期待件数の verify suite 表
2. unit test 行列（audit / mapping / mutex / sheets-client）
3. contract test 行列（data-contract.md / sync-flow.md ゴールデン）
4. integration test 行列（manual / scheduled / backfill × `sync_audit` 検証）
5. static check（不変条件 #5 / #6 / `googleapis` 禁止 / stableKey 直書き禁止）
6. TDD 順序の確定（audit → mapping → upsert → mutex → sheets-client → manual → scheduled → backfill）
7. Q1〜Q6 / TECH-M-01〜04 の検証手段への割当

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-02/sync-module-design.md | 9 ファイル module tree |
| 必須 | outputs/phase-02/audit-writer-design.md | startRun / finishRun / failRun 契約 |
| 必須 | outputs/phase-02/d1-contract-trace.md | mapping golden 入力 |
| 必須 | outputs/phase-03/main.md | 採用案 A / TECH-M-01〜04 |
| 必須 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md` | contract test golden |
| 必須 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md` | flow contract |
| 参考 | `.claude/skills/int-test-skill/SKILL.md` | 統合テスト方針 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Workers 制約 |

## 実行手順

### ステップ 1: verify suite

| layer | tool | scope | 期待件数 |
| --- | --- | --- | --- |
| unit | vitest | audit.ts (startRun/finishRun/failRun) | 8 件 |
| unit | vitest | mapping.ts (mapBasicProfile/mapUbmProfile/mapPersonalProfile/mapSocialLinks/mapMessage/mapConsent/collectExtras/parseTimestamp/normalizeEmail) | 12 件 |
| unit | vitest | mutex.ts (acquire/release/race) | 4 件 |
| unit | vitest | upsert.ts (member_responses / member_identities / member_status) | 6 件 |
| unit | vitest | sheets-client.ts (JWT 署名 / fetch / backoff) | 5 件 |
| contract | vitest + D1 fixture | data-contract.md mapping table 1:1 | 31 件（質問数） |
| contract | vitest + D1 fixture | sync-flow.md §1〜§5 sequence | 5 件 |
| integration | vitest + miniflare D1 | manual / scheduled / backfill × `sync_audit` finalize | 9 件 |
| integration | vitest + miniflare D1 | retry/backoff (rate limit 429 → 3 回 → failed) | 3 件 |
| integration | vitest + miniflare scheduled | Cron Trigger E2E (`scheduled()` 起動 → audit row 作成) | 2 件 |
| static | grep + ESLint | `googleapis` import 禁止 / `node:` import 禁止 / stableKey 直書き禁止 / apps/web からの sync import 禁止 | 4 件 |

### ステップ 2: unit test 行列（audit.ts 先行）

| ID | 対象 | 入力 | 期待 |
| --- | --- | --- | --- |
| U-A-01 | startRun | trigger=manual, running 行なし | INSERT 1 件、`acquired=true`、status='running' |
| U-A-02 | startRun | trigger=scheduled, running 行 1 件存在 | INSERT なし、`acquired=false` |
| U-A-03 | startRun | trigger=backfill, running 行なし | INSERT 1 件、`audit_id` is UUID |
| U-A-04 | finishRun | summary={inserted:5, updated:2, skipped:0} | UPDATE 1 件、status='success'、finished_at セット |
| U-A-05 | failRun | reason='sheets_rate_limit' | UPDATE 1 件、status='failed'、failed_reason 記録 |
| U-A-06 | finishRun | 既に failed 状態の row | conflict（再 finalize 拒否） |
| U-A-07 | startRun | DB error | throw、上位で failRun 不要（row 未作成） |
| U-A-08 | startRun → failRun の `try/finally` | mapping で例外 | running → failed が必ず実施（TECH-M-03 検証） |

### ステップ 3: unit test 行列（mapping.ts）

| ID | 対象 | 入力 | 期待 |
| --- | --- | --- | --- |
| U-M-01 | parseTimestamp | "2026/04/30 12:34:56" | ISO8601 |
| U-M-02 | normalizeEmail | "  Foo@Example.COM " | "foo@example.com" |
| U-M-03 | mapBasicProfile | 6 列 | answers_json に 6 stableKey |
| U-M-04 | mapUbmProfile | ubmZone enum 値 | enum 検証 pass |
| U-M-05 | mapPersonalProfile | 4 列 | 4 stableKey |
| U-M-06 | mapSocialLinks | 11 列の URL | 11 stableKey、空文字は省略 |
| U-M-07 | mapMessage | selfIntroduction | 1 stableKey |
| U-M-08 | mapConsent | publicConsent="同意する" | "consented" |
| U-M-09 | mapConsent | publicConsent="同意しない" | "declined" |
| U-M-10 | mapConsent | publicConsent="" | "unknown" |
| U-M-11 | collectExtras | 未知 questionId 含む row | extra_fields_json + unmapped_question_ids_json |
| U-M-12 | mapConsent | "rulesConsent" 表記揺れ（"Rules Consent"） | 正規化または unmapped（不変条件 #2） |

### ステップ 4: contract test 行列

| ID | golden 入力 | 期待 |
| --- | --- | --- |
| C-D-01〜C-D-31 | data-contract.md §3.1 / §3.2 の 31 質問 1 件ずつ | mapping.ts 出力が data-contract.md と差分ゼロ（AC-8） |
| C-F-01 | sync-flow.md §1 manual flow | 起動 → audit running → upsert → audit success の sequence 一致 |
| C-F-02 | sync-flow.md §2 scheduled flow | delta フィルタ（`submittedAt > last_success`） |
| C-F-03 | sync-flow.md §3 backfill flow | D1 batch、admin 列に touch なし |
| C-F-04 | sync-flow.md §4 recovery | 失敗後の再起動で `last_success` 復元 |
| C-F-05 | sync-flow.md §5 audit | sync_audit row が trigger / counts / diff / status を保持 |
| C-F-06 | UT-01 sync-log-schema.md §9 | `sync_audit` 論理名と `sync_log` / `sync_job_logs` / `sync_locks` の採用差分が Phase 2 decision と一致 |

### ステップ 5: integration test 行列

| ID | シナリオ | 検証 | AC |
| --- | --- | --- | --- |
| I-01 | manual `POST /admin/sync/run` `SYNC_ADMIN_TOKEN` Bearer あり | 200 + `audit_id`、audit ledger success | AC-2, AC-5 |
| I-02 | manual `SYNC_ADMIN_TOKEN` なし / 不正 | 401/403、audit ledger row 未作成 | AC-2 |
| I-03 | scheduled `scheduled()` を miniflare で発火 | sync_audit success | AC-3, AC-5 |
| I-04 | backfill 全件 | member_responses 全件再書込、`member_status.publish_state` / `is_deleted` / `meeting_sessions` 不変 | AC-4 |
| I-05 | 同一 responseId 二重実行 | upsert 冪等、副作用なし | AC-6 |
| I-06 | running 中に manual 再実行 | 409、sync_audit 二重作成なし | AC-7（TECH-M-01） |
| I-07 | scheduled 同秒取りこぼし試験（同 `submittedAt` 2 件） | 両件 upsert（`>=` + responseId 排除） | TECH-M-02 |
| I-08 | sheets-client 429 → 3 回 backoff → 成功 | finishRun success | AC-12 |
| I-09 | sheets-client 429 → 3 回 backoff 超過 | failRun "sheets_rate_limit"、status='failed' | AC-12, TECH-M-03 |

### ステップ 6: static check

| ID | check | 期待 | 不変条件 |
| --- | --- | --- | --- |
| S-01 | `grep -r "from \"googleapis\"" apps/api/src/sync` | 0 件 | #6 / AC-10 |
| S-02 | `grep -rE "from \"node:" apps/api/src/sync` | 0 件（Workers 互換） | #6 |
| S-03 | `grep -r "apps/api/src/sync" apps/web/src` | 0 件 | #5 / AC-9 |
| S-04 | ESLint custom rule で `questionId` 文字列直書き禁止 | error 0 | #1 / AC-8 |
| S-05 | `grep -rE "publish_state\|is_deleted\|meeting_sessions" apps/api/src/sync/backfill.ts apps/api/src/sync/scheduled.ts apps/api/src/sync/manual.ts` | 0 件 | #4 / AC-4 |

### ステップ 7: TDD 順序

audit writer は全 sync 経路の依存基盤のため**先行実装**する。

| order | 対象 | green 条件 |
| --- | --- | --- |
| 1 | `audit.ts` | U-A-01〜U-A-08 pass |
| 2 | `mapping.ts` | U-M-01〜U-M-12 + C-D-01〜C-D-31 pass |
| 3 | `upsert.ts` | unit 6 件 pass |
| 4 | `mutex.ts` | unit 4 件 + I-06 pass |
| 5 | `sheets-client.ts` | unit 5 件 + I-08 / I-09 pass |
| 6 | `manual.ts` | I-01 / I-02 + C-F-01 pass |
| 7 | `scheduled.ts` | I-03 / I-07 + C-F-02 pass |
| 8 | `backfill.ts` | I-04 + C-F-03 + S-05 pass |
| 9 | `index.ts` (router mount + scheduled export) | E2E 全件 pass |

### ステップ 8: TECH-M / Q マトリクス

| ID | 検証 ID | 解決 Phase |
| --- | --- | --- |
| TECH-M-01 | I-06 | Phase 5 / 6 |
| TECH-M-02 | I-07 | Phase 5 / 6 |
| TECH-M-03 | U-A-08 / I-09 | Phase 5 / 6 |
| TECH-M-04 | （Phase 12 で再評価） | Phase 12 |
| Q1 | I-06 | Phase 5 |
| Q2 | I-04 (D1 batch サイズ実測) | Phase 5 |
| Q3 | sheets-client unit (JWT exp 検証) | Phase 5 |
| Q4 | I-07 | Phase 5 |
| Q5 | U-A-08 / I-09 | Phase 5 / 6 |
| Q6 | （Phase 12 unassigned-task 起票） | Phase 12 |

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の各実装 step に test ID を完了条件として埋め込む |
| Phase 6 | 異常系（rate limit / mutex 衝突 / consent 異常 / D1 transaction 失敗 / Sheets schema diff）を I-XX 拡張で再現 |
| Phase 7 | AC × test ID トレース |
| 下流 09b | Cron Trigger E2E (I-03) の監視ベースライン |
| 下流 05b | smoke 起点として manual endpoint (I-01) の挙動 |

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテストLine | 80%+ | TBD（Phase 9 で測定） |
| 結合テストAPI | 100%（manual / scheduled / backfill / audit GET） | TBD |
| 結合テストシナリオ正常系 | 100% | TBD |
| 結合テストシナリオ異常系 | 80%+ | TBD |

## 多角的チェック観点

- 不変条件 #1: U-M-11 / S-04 で stableKey 駆動を強制
- 不変条件 #2: U-M-08〜U-M-10 / U-M-12 で consent 正規化
- 不変条件 #3: U-M-02 で `responseEmail` を system field として小文字化
- 不変条件 #4: I-04 / S-05 で admin 列保護
- 不変条件 #5: S-03 で apps/web 経由禁止
- 不変条件 #6: S-01 / S-02 で Workers 非互換依存禁止
- 不変条件 #7: C-F-04 / I-04 で Sheets を真とした backfill
- DI 境界: audit / sheets-client / upsert を `Deps` 引数注入で unit test 容易化

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | verify suite 表 | 4 | pending | 11 行 |
| 2 | unit test 行列（audit / mapping / mutex / upsert / sheets-client） | 4 | pending | 35 件 |
| 3 | contract test 行列 | 4 | pending | 36 件 |
| 4 | integration test 行列 | 4 | pending | 9 件 |
| 5 | static check | 4 | pending | 5 件 |
| 6 | TDD 順序 | 4 | pending | 9 段階 |
| 7 | TECH-M / Q マトリクス | 4 | pending | 10 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | サマリ |
| ドキュメント | outputs/phase-04/test-matrix.md | AC × test ID + TECH-M / Q × 検証 |
| メタ | artifacts.json | phase 4 status |

## 完了条件

- [ ] AC-1〜AC-12 が test ID と対応
- [ ] unit / contract / integration / static の 4 layer が定義
- [ ] AC-7（mutex）/ AC-8（contract）/ AC-9（apps/web 禁止）/ AC-10（googleapis 禁止）/ AC-12（backoff）の static + integration が含まれる
- [ ] TDD 順序が「audit 先行」で確定
- [ ] TECH-M-01〜04 / Q1〜Q6 に検証 ID が割り当てられている
- [ ] **本Phase内の全タスクを100%実行完了**

## タスク100%実行確認【必須】

- 全 7 サブタスクが completed
- 2 種ドキュメント配置
- 不変条件 #1〜#7 への対応 test を含む
- 次 Phase へ test ID と TDD 順序を引継ぎ
- artifacts.json の phase 4 を completed に更新

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項:
  - TDD 順序（audit → mapping → upsert → mutex → sheets-client → manual → scheduled → backfill → index）
  - 各 step を完了条件として test ID を runbook に埋め込む
- ブロック条件: AC × test ID 対応未完 / TDD 順序未確定なら進まない
