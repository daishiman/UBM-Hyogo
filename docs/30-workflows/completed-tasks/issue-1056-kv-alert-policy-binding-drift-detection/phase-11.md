# Phase 11: 手動 smoke test（CLI 回帰検証）

> **NON_VISUAL 宣言**
> - **タスク種別**: tooling / infrastructure_governance / observability（local-only CLI 検知 + 回帰 spec + CI gate）
> - **非視覚的理由**: `cf.sh alerts binding-drift`（= `infra/cloudflare-alerts/lib/cli.ts` の `cmdBindingDrift`）は CLI サブコマンドであり、画面・UI・UX を持たない。スクリーンショットで観測できる挙動が存在しない。
> - **代替証跡**: 回帰 spec test（`infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts` の (a)〜(f)）+ CLI 回帰（`bash scripts/cf.sh alerts binding-drift` の exit code・`no binding-policy drift detected` 文字列・`--json` の空配列出力）。
> - **実走状態**: Automation-30改善で CLI smoke / 回帰 spec を今回サイクル内に実走済み。evidence の status は **present**。screenshot は NON_VISUAL のため **n/a**。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（CLI 回帰検証） |
| 作成日 | 2026-06-02 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |

## 目的

NON_VISUAL タスクの代替 evidence として、CLI 回帰 smoke と回帰 spec を実走した。現状コードは drift 0 件（green baseline）であり、`pnpm cf:alerts:binding-drift --ci` は exit 0 / `no binding-policy drift detected` を返した。

## 実走結果

| # | 観点 | コマンド | 結果 | 対応 AC |
| --- | --- | --- | --- | --- |
| S-1 | baseline green（drift 0） | `pnpm cf:alerts:binding-drift --ci` | PASS: exit 0 / `no binding-policy drift detected` | AC-4（drift 0 / exit 0） |
| S-2 | 機械可読出力 | `bash scripts/cf.sh alerts binding-drift --json --ci`（shell spec 経由） | PASS: exit 0 / JSON `[]` | AC-5（`--json`） |
| S-3 | 人工 drift 再現（MONITORING_GAP） | 回帰 spec fixture で KV binding active + policy `enabled:false` を与えて `buildBindingPolicyDrift` を評価 / CLI 相当では fixture wrangler を差し替え | `MONITORING_GAP` 1 件以上 + CLI exit 2 | AC-2 / AC-5 |
| S-4 | 人工 drift 再現（STALE_MONITORING） | 回帰 spec fixture で KV binding inactive + policy `enabled:true` を与えて評価 | `STALE_MONITORING` 1 件以上 | AC-2 |
| S-5 | usage error 経路 | `bash scripts/cf.sh alerts binding-drift --unknown-flag; echo "exit=$?"`（または不正引数） | `exit=64`（usage error） | AC-5（exit 64） |
| S-6 | 回帰 spec test | `pnpm test:alerts`（`infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts` を含む） | PASS: 8 files / 66 tests | AC-6 |
| S-7 | read-only（Cloudflare API 非接触） | S-1〜S-2 実行時に token / secret / op 呼び出しが発生しないことを確認 | `setAlertTokenMode` / `loadActual` を呼ばず secret 要求なし | AC-5（local-only） |
| S-8 | typecheck / lint 緑 | `pnpm typecheck` / `pnpm lint` | PASS: workspace typecheck / lint ともエラー 0 | AC-3 / AC-6 |

## 実行タスク

1. CLI 回帰 smoke の実走手順（S-1〜S-8）を期待値付きで定義する（完了条件: 実走基準表が存在し各行に対応 AC が紐付く）。
2. baseline green（exit 0 + `no binding-policy drift detected`）と `--json` 空配列の記録欄を作成する（完了条件: outputs/phase-11/manual-smoke-log.md に記入欄。今回サイクルの実走値を反映）。
3. 人工 drift 再現（MONITORING_GAP / STALE_MONITORING）と回帰 spec (a)〜(f) の結果記録欄を作成する（完了条件: outputs/phase-11/manual-test-result.md に AC マトリクス）。
4. NON_VISUAL の代替証跡を明示し、screenshot 不要判定（screenshot-plan.json）とリンクチェック欄を作成する（完了条件: 全 outputs 配置・screenshot=n/a 明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | （本ワークフロー）phase-02.md | CLI サブコマンド設計 / exit code 規約 / read-only 経路 |
| 必須 | （本ワークフロー）phase-03.md | レビュー指摘 R1〜R7 のテストトレース |
| 必須 | infra/cloudflare-alerts/lib/cli.ts | `binding-drift` サブコマンドの exit code / 出力文字列 |
| 必須 | scripts/cf.sh | `alerts binding-drift` 実行経路 / usage error 64 |
| 必須 | package.json | `cf:alerts:binding-drift` / `test:alerts` script |

## スコープ

### 含む

- CLI 回帰 smoke 実走手順（S-1〜S-8）の期待値付きテンプレ定義
- exit code / 出力文字列 / `--json` 空配列 / 人工 drift 再現 / 回帰 spec の記録欄
- NON_VISUAL 代替証跡の明示（screenshot-plan.json で screenshot=n/a）

### 含まない

- 追加の実環境 smoke（Cloudflare API / staging / production）。本 Phase の local-only smoke は実走済み
- スクリーンショット採取（NON_VISUAL のため不要）
- Cloudflare 実環境への `alerts apply`（read-only 検知のため対象外）
- CI / hook の編集（Phase 12 / 実装サイクル）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | CLI smoke 証跡計画・回帰 spec 計画・リンクチェック結果を close-out 範囲へ渡す |
| Phase 13 | baseline green（exit 0）を PR 検証計画の根拠として渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡 / 実走状態）が冒頭に明記されている
- [x] CLI 回帰 smoke 実走基準（baseline exit 0 + `no binding-policy drift detected`、`--json` 空配列、人工 drift で exit 2 / MONITORING_GAP・STALE_MONITORING、usage error 64）が定義されている
- [x] 回帰 spec (a)〜(f) と typecheck / lint の記録欄がある
- [x] screenshot-plan.json（NON_VISUAL / screenshot=n/a）が計画として定義されている
- [x] evidence の status が present と明記されている

## タスク100%実行確認【必須】

- [x] 本ワークフロー範囲のテンプレ作成タスク（4 件）が完了
- [x] CLI 回帰 smoke 基準（S-1〜S-8）が対応 AC 付きで定義済み
- [x] NON_VISUAL 代替証跡（回帰 spec + CLI 回帰）がレビューで検証可能な粒度で記述済み

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項: CLI smoke 証跡計画（baseline green = exit 0）/ 人工 drift 再現計画 / 回帰 spec (a)〜(f) 計画 / screenshot=n/a 判定
- ブロック条件: なし（focused evidence captured。commit / push / PR は Phase 13 user-gated）
