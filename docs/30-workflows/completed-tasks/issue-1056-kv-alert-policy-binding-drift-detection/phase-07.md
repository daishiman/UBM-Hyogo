# Phase 7: AC / カバレッジマトリクス（受入条件 × テスト × 検証コマンド）

> **Automation-30 改善追記（2026-06-02）**
> 本 Phase 作成当初の「spec_created」「実走証跡は後続」表現は historical context。AC の主要検証は `pnpm test:alerts` と `pnpm cf:alerts:binding-drift --ci` で今回サイクルに取得済み。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC / カバレッジマトリクス（AC-1〜AC-9 のカバレッジ確認） |
| 作成日 | 2026-06-02 |
| 前 Phase | 6 (異常系・回帰テスト拡充) |
| 次 Phase | 8 (DRY 化・リファクタリング) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1056（**現状 OPEN** のまま参照のみ・mutation user-gated） |

## 目的

本ワークフローの AC-1〜AC-9 が、回帰 spec のテストケース (a)〜(f)（AC-6 / Phase 4・Phase 6）+ CLI smoke（Phase 11）+ CI gate（AC-7）+ ドキュメント / レビュー gate でどのように被覆されるかを **AC × テスト × 検証コマンド × 担当成果物** のマトリクスとして固定する。あわせて純関数 `parseActiveBindings` / `buildBindingPolicyDrift` の **変更箇所限定 line / branch coverage 目標** を明記する。「全テスト一律 PASS」のような薄いゴールは禁止し、AC 単位での被覆を要求する。Phase 9（品質保証）/ Phase 10（最終レビュー）で本マトリクスを GO/NO-GO の根拠として再利用する。

## 実行タスク

1. AC-1〜AC-9 を spec テストケース (a)〜(f) / CLI smoke / CI gate / 検証コマンド / 担当成果物にマッピングする（完了条件: 全 AC に対応行が存在）。
2. 「全 AC が最低 1 つの被覆（テスト or 文書 / gate）を持つ」「全テストケースが最低 1 つの AC に紐付く」双方向整合を確認する（完了条件: 双方向対応表に空セルがなく、テスト被覆対象 AC が全件被覆）。
3. 純関数 `parseActiveBindings` / `buildBindingPolicyDrift` に絞った line / branch coverage 目標を明記し、CLI は smoke で exit code を担保する旨を記述する（完了条件: coverage 目標表が存在）。
4. 未カバー領域（実 Cloudflare API・実 policy 有効化）を scope 外として明記し UT-17-followup-006 へ委譲する（完了条件: 未カバー領域表が存在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | AC-1〜AC-9 原典 |
| 必須 | phase-02.md | 関数シグネチャ / 判定ロジック / 変更ファイル 7 件 |
| 必須 | phase-04.md | テスト戦略・テストケース (a)〜(f) |
| 必須 | phase-06.md | 異常系・回帰テスト拡充（parser 分岐 / env 横断） |
| 参考 | docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/phase-07.md | カバレッジ表フォーマット参照 |

## テストケース凡例（AC-6 (a)〜(f)）

| ケース | 内容 | 期待結果 |
| --- | --- | --- |
| (a) | active + enabled（R2 active + `r2-class-a` enabled） | drift なし（空配列） |
| (b) | inactive + disabled（KV inactive + KV policy 2 件 disabled） | drift なし（空配列） |
| (c) | active + disabled | `MONITORING_GAP` |
| (d) | inactive + enabled | `STALE_MONITORING` |
| (e) | wrangler parser コメント行=inactive / 非コメント行=active 分岐 | `# binding = "..."` が inactive、非コメントが active |
| (f) | production / staging 横断集約（いずれかで active なら active） | env 非対称でも集約判定 active |

## AC × テスト × 検証コマンド マトリクス

### AC-1: binding kind ↔ alert policy 対応表が `BINDING_POLICY_MAP` と `deployment-cloudflare.md` の両方に明文化

| 項目 | 内容 |
| --- | --- |
| 対応テスト | (a) / (c) / (d)（mapping を介した突合で間接被覆） |
| 検証手段 | コード grep + 文書 grep |
| 検証コマンド | `rg -n 'BINDING_POLICY_MAP' infra/cloudflare-alerts/lib/binding-policy-drift.ts` / `rg -n 'workers-kv-writes-per-day\|r2-class-a' .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |
| 期待値 | mapping const の policy 名と棚卸し表の policy 名が一致（KV→2件 / R2→1件） |
| 担当成果物 | binding-policy-drift.ts（const）/ deployment-cloudflare.md（表） |

### AC-2: drift 2 種を read-only 純関数で列挙（mutation 一切なし）

| 項目 | 内容 |
| --- | --- |
| 対応テスト | (c) `MONITORING_GAP` / (d) `STALE_MONITORING` |
| 検証手段 | spec + read-only grep |
| 検証コマンド | `mise exec -- pnpm test:alerts` / `rg -n 'setAlertTokenMode\|loadActual\|alerts apply\|op run' infra/cloudflare-alerts/lib/binding-policy-drift.ts`（0 件） |
| 期待値 | (c) で `MONITORING_GAP`、(d) で `STALE_MONITORING` を返し、mutation API への参照が 0 件 |
| 担当成果物 | `buildBindingPolicyDrift`（純関数）/ spec |

### AC-3: wrangler.toml の binding 活性判定が `#` コメント行を inactive とみなす line parser

| 項目 | 内容 |
| --- | --- |
| 対応テスト | (e) コメント/非コメント分岐 / (f) production/staging 横断集約 |
| 検証手段 | spec |
| 検証コマンド | `mise exec -- pnpm test:alerts` |
| 期待値 | `# binding = "ALERT_DEDUP_KV"` が inactive / 非コメント `binding = "MEMBER_PHOTOS"` が active / 両 env 横断で集約 |
| 担当成果物 | `parseActiveBindings`（純関数）/ spec |

### AC-4: 現状コードに対し drift 0 件（green baseline）

| 項目 | 内容 |
| --- | --- |
| 対応テスト | (a) active+enabled / (b) inactive+disabled（baseline 構成と同型） |
| 検証手段 | CLI smoke（Phase 11） |
| 検証コマンド | `bash scripts/cf.sh alerts binding-drift; echo "exit=$?"` |
| 期待値 | exit 0 / `no binding-policy drift detected`（KV inactive+disabled + R2 active+enabled で整合） |
| 担当成果物 | outputs/phase-11/manual-smoke-log.md / outputs/phase-11/manual-test-result.md / binding-policy-drift.ts |

### AC-5: CLI サブコマンド `binding-drift [--json] [--ci]`（Cloudflare API 非呼び出し・exit 0/2/64）

| 項目 | 内容 |
| --- | --- |
| 対応テスト | CLI smoke（exit code）/ (c)(d) の drift→exit 2 経路を純関数で間接被覆 |
| 検証手段 | CLI smoke + allowlist grep |
| 検証コマンド | `bash scripts/cf.sh alerts binding-drift --json` / `rg -n 'binding-drift' scripts/cf.sh infra/cloudflare-alerts/lib/cli.ts` |
| 期待値 | drift なし exit 0 / drift あり exit 2 / usage error 64 / `--json` で機械可読出力。`cf.sh` allowlist と `cli.ts` switch・usage の双方に登録 |
| 担当成果物 | cli.ts（`cmdBindingDrift`）/ cf.sh（allowlist + usage） |

### AC-6: 回帰 spec `binding-policy-drift.spec.ts` が (a)〜(f) を guard し `pnpm test:alerts` に含まれる

| 項目 | 内容 |
| --- | --- |
| 対応テスト | (a) / (b) / (c) / (d) / (e) / (f) 全件 |
| 検証手段 | spec |
| 検証コマンド | `mise exec -- pnpm test:alerts` |
| 期待値 | (a)〜(f) 全 PASS。spec が `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts` に配置され `test:alerts` glob に含まれる |
| 担当成果物 | binding-policy-drift.spec.ts |

### AC-7: CI gate（`cloudflare-alerts-drift.yml` の PR `validate` job に binding-drift step + `apps/api/wrangler.toml` paths）

| 項目 | 内容 |
| --- | --- |
| 対応テスト | CI 実走（PR） |
| 検証手段 | workflow grep + CI 実行 |
| 検証コマンド | `rg -n 'binding-drift\|apps/api/wrangler.toml' .github/workflows/cloudflare-alerts-drift.yml` |
| 期待値 | `validate` job に `pnpm cf:alerts:binding-drift --ci` step が存在し secret 不要で実行。将来 KV binding 活性化 PR で policy 未有効化なら job が fail |
| 担当成果物 | cloudflare-alerts-drift.yml |

### AC-8: `deployment-cloudflare.md` に binding↔policy 対応表 + 責務境界追記

| 項目 | 内容 |
| --- | --- |
| 対応テスト | 文書（テスト被覆対象外） |
| 検証手段 | 文書 grep |
| 検証コマンド | `rg -n 'UT-17-followup-006\|binding.*policy\|#85\|#75\|#77' .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |
| 期待値 | "Cloudflare Alert Policy IaC" 節 / 棚卸し表（:308）に対応表 + UT-17-followup-006 / #85 / #75 / #77 責務境界が記述 |
| 担当成果物 | deployment-cloudflare.md |

### AC-9: 4 条件（価値性 / 実現性 / 整合性 / 運用性）全 PASS

| 項目 | 内容 |
| --- | --- |
| 対応テスト | review gate（テスト被覆対象外） |
| 検証手段 | 文書 grep |
| 検証コマンド | `rg -n '価値性 \| PASS\|実現性 \| PASS\|整合性 \| PASS\|運用性 \| PASS' phase-01.md phase-03.md` |
| 期待値 | Phase 1 / Phase 3 で 4 条件すべて PASS |
| 担当成果物 | phase-01.md / phase-03.md / phase-10.md |

## AC × テストケース 双方向対応表

| AC \ ケース | (a) | (b) | (c) | (d) | (e) | (f) | CLI smoke | CI gate | 文書/gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | ◎ | - | ◎ | ◎ | - | - | - | - | ◎ |
| AC-2 | - | - | ◎ | ◎ | - | - | - | - | - |
| AC-3 | - | - | - | - | ◎ | ◎ | - | - | - |
| AC-4 | ◎ | ◎ | - | - | - | - | ◎ | - | - |
| AC-5 | - | - | ◎ | ◎ | - | - | ◎ | - | - |
| AC-6 | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | - | - | - |
| AC-7 | - | - | - | - | - | - | - | ◎ | - |
| AC-8 | - | - | - | - | - | - | - | - | ◎ |
| AC-9 | - | - | - | - | - | - | - | - | ◎ |

> 凡例: ◎ = 主たる被覆、- = 該当なし。
> **テスト被覆対象の AC（AC-1〜AC-6）はすべて最低 1 つの ◎（テストケース or CLI smoke）を持つこと** がカバレッジ要件 PASS の必要条件。AC-7（CI gate）/ AC-8（文書）/ AC-9（4 条件 gate）はテストではなく gate / 文書で被覆（上記 AC 別表の検証コマンド参照）。
> **全テストケース (a)〜(f) が最低 1 つの AC に紐付く** ことを確認済み（(a)→AC-1/4/6 / (b)→AC-4/6 / (c)→AC-1/2/5/6 / (d)→AC-1/2/5/6 / (e)→AC-3/6 / (f)→AC-3/6）。

## 変更箇所限定 coverage 目標

> coverage 目標は **本タスクで新規追加する純関数・分岐に限定**する。既存の `load.ts` / `cli.ts` 既存サブコマンドは対象外。

| 変更箇所 | line coverage 目標 | branch coverage 目標 | 被覆ケース |
| --- | --- | --- | --- |
| `parseActiveBindings`（新規・純関数） | 100% | 100%（コメント skip / kv ヘッダ / r2 ヘッダ / 非対象テーブル null / binding 行収集 / dedupe の各分岐） | (e) / (f) |
| `buildBindingPolicyDrift`（新規・純関数） | 100% | 100%（active&&!enabled→MONITORING_GAP / !active&&enabled→STALE_MONITORING / active&&enabled→無 / !active&&!enabled→無 / policy 不在 `?? false`） | (a) / (b) / (c) / (d) / missing-policy guard |
| `loadActiveBindings`（新規・薄い IO helper） | 変更行 100% | wrangler.toml read 後 `parseActiveBindings` 委譲のみ（分岐なし） | (a)〜(f) の入力供給（spec は fixture で純関数を直接被覆） |
| `cmdBindingDrift` / `printBindingDrifts`（CLI 配線） | smoke で担保 | exit 0（drift なし）/ exit 2（drift あり）/ `--json` 分岐は CLI smoke（Phase 11）で担保 | CLI smoke |

> CLI 層（`cmdBindingDrift` / `printBindingDrifts`）は純関数 spec では直接被覆しにくいため、exit code 検証は Phase 11 の `bash scripts/cf.sh alerts binding-drift`（exit 0 baseline）と `--json` 出力 smoke で担保する。純関数（`parseActiveBindings` / `buildBindingPolicyDrift`）は branch 100% を spec で達成する。

## 未カバー領域（scope 外・責務委譲）

| 未カバー領域 | 理由 | 委譲先 |
| --- | --- | --- |
| 実 Cloudflare API 上の Notification Policy の実 enabled 状態 | 本検知は IaC policy JSON（`load.ts` canonical）を正本とする read-only / local-only 設計。実デプロイ状態の突合は既存 `alerts diff`（宣言 vs デプロイ）の射程 | 既存 `cloudflare-alerts diff`（変更しない） |
| alert policy の実 `enabled:true` 化判断・KV alert 運用開始 | 本タスクは drift 検知のみ（mutation なし）。policy 有効化の判断は運用開始タスクの射程 | UT-17-followup-006 |
| KV 使用量監視の運用サイクル・閾値設計 | 本タスクは整合 drift 検知に限定 | #85 / #75 / #77 |

## 「変更ブロック AC 被覆」運用ルール

1. PR の diff（変更ファイル 7 件）に対し `git diff --stat dev..HEAD` を取得。
2. AC-1〜AC-9 すべてが本マトリクスで最低 1 つの被覆（テストケース or CLI smoke or CI gate or 文書 / gate）を持つことを確認。
3. 「全テスト一律 PASS」のような薄い表記は **禁止**（AC 単位での被覆を要求）。
4. coverage 目標は新規純関数（`parseActiveBindings` / `buildBindingPolicyDrift`）に限定し、既存 `load.ts` 再利用部分を薄める言い訳にしない。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | （本 phase-07.md に内包。artifacts.json では別 main.md を持たない） | AC × テストケース マトリクス / CLI smoke / CI gate / coverage 目標 / 未カバー領域 |
| メタ | artifacts.json `phases[6].outputs` | 空配列（本 phase-07.md が正本） |

> **Automation-30 改善後の現行状態**: AC カバレッジの focused evidence は今回サイクルで採取済み。coverage レポートは本小規模 tooling 変更では取得していない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化対象（`load.ts` 再利用・既存 `Drift` と別型）の被覆境界を渡す |
| Phase 9 | AC × テスト マトリクスを 7 品質ゲートの判定根拠に渡す |
| Phase 10 | AC-1〜AC-9 被覆状況を GO/NO-GO 判定へ渡す |
| Phase 11 | CLI smoke 基準（AC-4 exit 0 baseline / AC-5 `--json` exit code）を渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] AC-1〜AC-9 が本 Phase にマトリクス化されている
- [x] AC × テストケース 双方向対応表があり、テスト被覆対象 AC（AC-1〜AC-6）が空セルなく被覆されている
- [x] AC-7（CI gate）/ AC-8（文書）/ AC-9（4 条件 gate）が gate / 文書で被覆される旨が明記されている
- [x] 純関数 `parseActiveBindings` / `buildBindingPolicyDrift` の branch 100% 目標が明記され、CLI は smoke で exit code を担保する旨が記述されている
- [x] 未カバー領域（実 Cloudflare API・実 policy 有効化）が scope 外として明記され UT-17-followup-006 / #85 / #75 / #77 へ委譲されている
- [x] 「全テスト一律 PASS」表記が無い
- [x] 実走証跡（`pnpm test:alerts` / `pnpm cf:alerts:binding-drift --ci`）は今回サイクルで採取済み

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が `completed`
- artifacts.json で Phase 7 は別 output を持たないため、本 phase-07.md が正本
- AC-1〜AC-9 すべてに被覆（テストケース or CLI smoke or CI gate or 文書 / gate）が紐づく
- 全テストケース (a)〜(f) が最低 1 つの AC に紐付く
- artifacts.json の `phases[6].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化・リファクタリング)
- 引き継ぎ事項:
  - AC マトリクスを Phase 9 品質保証 / Phase 10 GO/NO-GO の根拠に再利用
  - 純関数 branch 100% / CLI smoke 担保の境界を Phase 9 数値確認の基準に再利用
  - 未カバー領域（実 API・実有効化）の責務委譲を Phase 10 責務境界最終確認へ申し送り
- ブロック条件:
  - テスト被覆対象 AC（AC-1〜AC-6）のいずれかが空セル（被覆ケース不在）
  - 「全テスト一律 PASS」表記が混入
