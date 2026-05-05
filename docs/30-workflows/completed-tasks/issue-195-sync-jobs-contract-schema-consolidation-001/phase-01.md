# Phase 1: 要件定義（Why/What/不変条件/4条件評価/AC 再マッピング/苦戦箇所引き継ぎ）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義（Why/What/不変条件/4条件評価/AC 再マッピング/苦戦箇所引き継ぎ） |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | なし |
| 次 Phase | 2 (設計 — runtime SSOT 配置 ADR 構成 + owner 表行スキーマ + 参照リンク経路) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |
| Issue | #435（CLOSED — クローズドのまま実装仕様化） |

## 第 0 セクション: 実装区分の宣言

本タスクは **実装仕様書** である。markdown 単独では完結しない理由は以下:

- runtime SSOT 配置の ADR（`apps/api` 維持 / `packages/shared` 不採用）は markdown 上で記述するが、その**根拠は実コードの参照分布**（`apps/web` ゼロ / `packages/shared` ゼロ / `apps/api` 内のみ参照）に依拠するため、grep evidence による裏付けが必須。
- contract test の canonical 値網羅補強は `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` への TS コード追加を含む可能性がある（Phase 5 棚卸しで判定）。
- owner 表行追加は markdown だが、`_design/sync-shared-modules-owner.md` の governance 文書として L-003 の 5 列 schema 検証 / 1-hop 到達 grep AC を再実行する必要がある。

CONST_004 の例外条件（実態優先）に基づき、本タスクは実装仕様書として作成する。

owner = 主担当 / co-owner = サブ担当（用語 alias、L-005 引き継ぎ）。

## 目的

Issue #435 の AC 3 件（owner 表参照 / runtime と docs 契約の合致 / contract test カバレッジ）を本タスクの AC-1〜AC-8 に細分化して 1:1 マッピングし、4 条件評価と open question を確定する。本 Phase は実体ファイル（ADR / owner 表行 / contract test）を作成しない。要件と境界の固定のみが目的。

## 実行タスク

1. Why の整理（先行タスク #198 で SSOT 実体は出来たが、配置決定 ADR・owner 表登録・契約テスト網羅性が未確定）
2. What の整理（ADR / owner 表行 / 参照リンク / contract test 補強 / unassigned ステータス更新）
3. 不変条件の列挙（runtime SSOT 物理移動禁止 / DDL 非変更 / 03b-followup-005 既実装値の維持 / 既存テスト破壊禁止 / `apps/api` 閉域不変条件 5）
4. AC-1〜AC-8 の根拠記述（index.md と 1:1 対応 + 担当 Phase 割当）
5. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）
6. open question 列挙（最大 3 件）
7. 苦戦箇所 L-001〜L-005 の本タスクへの適用方針確定
8. CONST_004 例外条件の根拠と CONST_007（1 PR 完結）の遵守宣言

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/index.md | 本タスク AC 8 件 / Phase 一覧 |
| 必須 | docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md | 起票元 unassigned spec / L-001〜L-005 |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | markdown 論理正本（既存・ADR 追加対象） |
| 必須 | docs/30-workflows/_design/sync-shared-modules-owner.md | owner 表（行追加対象） |
| 必須 | apps/api/src/jobs/_shared/sync-jobs-schema.ts | runtime SSOT 実体（既存） |
| 必須 | apps/api/src/jobs/_shared/sync-jobs-schema.test.ts | contract test（補強候補） |
| 必須 | docs/30-workflows/completed-tasks/03b-followup-005-sync-jobs-design-spec/index.md | 先行完了タスク AC 11 件 |

## 実行手順（ステップ別）

### ステップ 1: Why の整理

- 先行タスク #198 で `apps/api/src/jobs/_shared/sync-jobs-schema.ts` が新設され、consumer 差し替えと `_design/sync-jobs-spec.md` への TS 正本リンク追記までは完了している
- しかし以下が未確定:
  - **runtime SSOT 配置の意思決定 ADR が無い**: `apps/api` 配下のままで良いか、`packages/shared` に移管すべきかの根拠記録が無い
  - **owner 表に runtime SSOT 行が無い**: `_design/sync-shared-modules-owner.md` には `ledger.ts` / `sync-error.ts` / `index.ts` のみ。`sync-jobs-schema.ts` 行が未登録
  - **canonical 値の contract test 網羅性**: `SYNC_JOB_TYPES` リテラル値断言・`SYNC_LOCK_TTL_MS === 600000` 値断言・PII 拒否ケースが既存テストで網羅されているか未検証
  - **unassigned-task の status が `unassigned` のまま**: 完了マーキングが未済

### ステップ 2: What の整理

- `_design/sync-jobs-spec.md` に「runtime SSOT 配置 ADR」セクションを追加（`apps/api` 維持・`packages/shared` 不採用・根拠 3 点）
- `_design/sync-shared-modules-owner.md` の owner 表に行追加（owner: 03a / co-owner: 03b）
- `_design/sync-jobs-spec.md` §2 / §3 / §5 に owner 表へのリンクと runtime SSOT への 1-hop 参照を追記
- `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` の網羅性を Phase 5 で棚卸し、不足があれば Phase 7 で補強
- email 形式値の PII leak を test で要求する場合は、`apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `metricsJsonBaseSchema` / `assertNoPii` を同一 wave で最小拡張する
- `unassigned-task/task-issue195-...` の status を `resolved` に更新
- `database-schema.md` の `sync_jobs` 節再確認（既に整っていれば no-op evidence）

### ステップ 3: 不変条件

- INV-1: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `job_type` / TTL semantics と物理配置は変更しない。PII guard の email 形式値拒否は AC-4 の runtime contract 補強として許容する
- INV-2: DDL は変更しない / D1 マイグレーション新規追加なし
- INV-3: CLAUDE.md 不変条件 5「D1 アクセスは `apps/api` に閉じる」を ADR の根拠として採用
- INV-4: 既存テスト（`sync-forms-responses.test.ts` / `sync-sheets-to-d1.test.ts` / `sync-jobs-schema.test.ts`）を破壊しない
- INV-5: `SyncJobKind` の文字列値は後方互換維持（`schema_sync` / `response_sync`）
- INV-6: owner / co-owner と 主担当 / サブ担当の用語混在禁止（L-005、冒頭 alias 表で吸収）
- INV-7: 削除（D 差分）が発生する場合は legacy alias 行追加（L-002）

### ステップ 4: AC-1〜AC-8 根拠記述

| AC | 達成根拠 | 検証コマンド | 担当 Phase | 失敗時の分岐 |
| --- | --- | --- | --- | --- |
| AC-1 | ADR セクション追加 + 根拠 3 点（不変条件 5 / `apps/web` ゼロ / `packages/shared` ゼロ） | `rg -n "runtime SSOT 配置 ADR" docs/30-workflows/_design/sync-jobs-spec.md` | 6 | Phase 6 で再追記 |
| AC-2 | owner 表行追加 | `rg -n "sync-jobs-schema\\.ts" docs/30-workflows/_design/sync-shared-modules-owner.md` | 6 | Phase 6 で再追記 |
| AC-3 | §2 / §3 / §5 に owner 表 + SSOT リンク | `rg -n "sync-shared-modules-owner" docs/30-workflows/_design/sync-jobs-spec.md` | 6 | Phase 6 で再追記 |
| AC-4 | contract test の canonical 網羅 | `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test` | 5 / 7 | Phase 7 で test 追加 |
| AC-5 | `database-schema.md` `sync_jobs` 節が `_design/` 参照で統一 | `rg -n "_design/sync-jobs-spec" .claude/skills/aiworkflow-requirements/references/database-schema.md` | 7 | 不一致なら更新 |
| AC-6 | `unassigned-task/task-issue195-...` の status `resolved` | `rg -n "^- status:" docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md` | 8 | Phase 8 で再更新 |
| AC-7 | indexes rebuild idempotent | `mise exec -- pnpm indexes:rebuild && git status --porcelain .claude/skills/aiworkflow-requirements/indexes` | 9 | 生成差分が出れば同 PR に含め、再実行で追加 drift が出ないことを確認 |
| AC-8 | typecheck / lint / vitest 全 PASS | `mise exec -- pnpm typecheck && mise exec -- pnpm lint && mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test` | 9 | 自動修復ループ（CLAUDE.md PR フロー準拠） |

### ステップ 5: 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | runtime SSOT 配置 ADR + owner 表登録 + 契約テスト網羅で sync 系 governance が完結するか | PASS |
| 実現性 | 13 Phase / 1 PR で完遂可能か（runtime コード変更は最小、test 追加は不足時のみ） | PASS |
| 整合性 | AC 8 件 / 不変条件 7 件 / 03b-followup-005 既実装 / `verify-indexes-up-to-date` CI gate と矛盾なし | PASS |
| 運用性 | 後続 sync wave 追加時に owner 表 1 行 + ADR 1 段落で済むか | PASS |

### ステップ 6: open question 列挙

- Q1: ADR の配置先は `_design/sync-jobs-spec.md` の §1 メタ表直下か、新規 §0 セクションか → Phase 2 で確定（推奨: §1 直下に「## ADR-001 runtime SSOT 配置」見出し）
- Q2: owner 表行追加時の owner / co-owner の最終アサイン → 推奨: owner = 03a, co-owner = 03b（先行表と一致）。本タスク（issue-195）は consumer 兼起票者として備考列に記載
- Q3: contract test 網羅性が既に十分だった場合の AC-4 evidence → no-op 判定の grep 結果を `outputs/phase-11/` に保存して PASS 扱い

### ステップ 7: 苦戦箇所 L-001〜L-005 の適用方針

- L-001: 本タスクの runtime SSOT 集約は **runtime spec** 軸のため `apps/api` 配下に置く（`_design/` には置かない）。ADR と owner 表登録は governance design 軸として `_design/` に置く
- L-002: 本タスクで削除（D 差分）は発生しない見込み（追加のみ）。万一発生時は legacy-ordinal-family-register.md に行追加
- L-003: owner 表行追加に伴い governance Phase 6-11 AC（5 列 schema / 1-hop 到達 / secret-hygiene / NON_VISUAL evidence 3 ファイル）を本タスクの Phase 11 で再実行
- L-004: Phase 12 出力は strict 7 ファイル（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
- L-005: 冒頭 alias 表「owner = 主担当 / co-owner = サブ担当」を ADR と owner 表更新時の本文先頭に必ず 1 行入れる

### ステップ 8: CONST 遵守宣言

- CONST_004 例外条件の根拠を本ファイル冒頭で明示
- CONST_007（1 PR / 1 実装サイクル完結）に従い、`unassigned-task` ステータス更新も今回サイクル内で完了させる

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Why / What / 不変条件 / AC 8 件根拠 / 4 条件 / open question / L-001〜L-005 適用方針 |
| メタ | artifacts.json | Phase 1 を completed に更新（実行時） |

## 統合テスト連携

- 本 Phase は要件定義のみで実装コードは触らない
- 実装の整合検証は Phase 9 で `mise exec -- pnpm typecheck` / `vitest` / `lint` を実行し、Phase 11 で evidence 化

## 完了条件

- [ ] Why / What が unassigned spec と起票元 Issue #435 と整合
- [ ] 不変条件 INV-1〜INV-7 が列挙されている
- [ ] AC-1〜AC-8 すべてに evidence パス / 検証コマンド / 担当 Phase / 失敗時分岐が紐づく
- [ ] 4 条件評価で MAJOR がない
- [ ] open question が 3 件以内
- [ ] 苦戦箇所 L-001〜L-005 の適用方針が記述されている
- [ ] CONST_004 例外根拠と CONST_007 遵守が文中で明示されている

## 次 Phase

- 次: 2（設計 — runtime SSOT 配置 ADR 構成 + owner 表行スキーマ + 参照リンク経路）
- 引き継ぎ事項: AC 8 件根拠 / 不変条件 7 件 / open question 3 件 / 実装区分宣言 / L-001〜L-005 適用方針
- ブロック条件: open question 4 件以上 / AC 根拠不足 / unassigned spec との整合不一致
