# Phase 9: 品質保証（品質ゲート判定方針・read-only 検証）

> **Automation-30 改善追記（2026-06-02）**
> 本 Phase 作成当初の「実走は後続」表現は historical context。今回サイクルで `pnpm test:alerts`、`pnpm cf:alerts:binding-drift --ci`、`pnpm typecheck`、`pnpm lint` の PASS を取得済み。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-06-02 |
| 前 Phase | 8 (DRY 化・リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1056（**現状 OPEN** のまま参照のみ・mutation user-gated） |

## 目的

`binding-policy-drift.ts`（新規）/ `cli.ts`（編集）/ 回帰 spec / `cf.sh` / `package.json` / workflow / 棚卸し表の変更が、AC-1〜AC-9 / Phase 2 設計 / 既存 CI / 不変条件と整合していることを検証する品質保証の判定方針を確定する。typecheck / lint / `test:alerts` / CLI smoke / read-only 検証 / CI gate / 不変条件の各ゲートの PASS 判定基準を明記し、focused 実走証跡は今回サイクルで取得済みとして扱う。HEX 直書きは tooling のため該当なしであることを明示する。

## 品質ゲート判定方針

| ゲート | コマンド（実装サイクルで実走） | PASS 判定 | 対応 AC |
| --- | --- | --- | --- |
| QG-1 typecheck | `mise exec -- pnpm typecheck` | エラー 0。`BindingKind` / `ActiveBindingSet` / `BindingPolicyDrift` 型整合、`CanonicalPolicy` import 整合 | AC-2 |
| QG-2 lint | `mise exec -- pnpm lint` | 違反 0。新規モジュール + spec + cli.ts 追記が lint 規約に抵触しない | AC-2 / AC-6 |
| QG-3 回帰 spec | `mise exec -- pnpm test:alerts` | テストケース (a)〜(f) 全 PASS。spec が `__tests__` glob で自動発見 | AC-6 |
| QG-4 CLI smoke（baseline green） | `bash scripts/cf.sh alerts binding-drift; echo "exit=$?"` | exit 0 / `no binding-policy drift detected`（現状 drift 0） | AC-4 / AC-5 |
| QG-5 CLI `--json` smoke | `bash scripts/cf.sh alerts binding-drift --json` | 機械可読 JSON 出力（drift 0 で `[]`）。usage error は exit 64 | AC-5 |
| QG-6 read-only 検証 | `rg -n 'setAlertTokenMode\|loadActual\|alerts apply\|op run\|fetch\(' infra/cloudflare-alerts/lib/binding-policy-drift.ts` | 0 件（mutation / Cloudflare API / op 非呼び出し） | AC-2 / AC-5 |
| QG-7 CI gate 整合 | `rg -n 'binding-drift\|apps/api/wrangler.toml' .github/workflows/cloudflare-alerts-drift.yml` | `validate` job（secret 不要）に `pnpm cf:alerts:binding-drift --ci` step + paths に wrangler.toml | AC-7 |
| QG-8 不変条件 #8 | `git status --porcelain \| rg '\.test\.(ts\|tsx)$'` | 新規 test が `.test.*` でない（`binding-policy-drift.spec.ts` のみ） | 不変条件 #8 |
| QG-9 不変条件 #5 / D1 境界 | `rg -n 'D1\|d1_database\|getDb\|drizzle' infra/cloudflare-alerts/lib/binding-policy-drift.ts` | D1 非接触（0 件） | 不変条件 #5 |
| QG-10 HEX 直書き | （該当なし）tooling / CLI のため UI 色トークン非対象 | N/A（CI gate `verify-design-tokens` の対象外パス） | — |
| QG-11 変更ファイル範囲 | `git status --porcelain` | 変更ファイル 7 件のみ（binding-policy-drift.ts / cli.ts / spec / cf.sh / package.json / workflow / deployment-cloudflare.md）。scope 逸脱なし | Phase 2 変更ファイル一覧 |

> **QG-10 HEX 直書きの注記**: 本タスクは tooling / CLI（`infra/cloudflare-alerts/` + `scripts/`）であり、`apps/web/src/` の UI 色トークンを一切触らない。CI gate `verify-design-tokens` の grep 対象パス外のため「HEX 直書きなし＝構造的に該当なし」。OKLch トークン正本（`tokens.css`）にも非接触。

## read-only 検証の品質確認観点

| 観点 | 確認方法（実装サイクル） | 対応 AC |
| --- | --- | --- |
| Cloudflare API 非呼び出し | `binding-policy-drift.ts` / `cmdBindingDrift` が `setAlertTokenMode` / `loadActual` / `fetch` を呼ばない（grep 0 件） | AC-2 / AC-5 |
| write API / `alerts apply` 非呼び出し | `cmdBindingDrift` が apply 系関数を呼ばない。`cf.sh` の `binding-drift` が `--ci` apply 禁止分岐に抵触しない | AC-2 / AC-5 |
| op / secret 非要求 | `cf.sh alerts binding-drift` が `op run` / token を要求せず実行完了（secret なし CI で green） | AC-5 / AC-7 |
| 純関数の副作用なし | `parseActiveBindings` / `buildBindingPolicyDrift` がファイル read / mutation を持たない（IO は `loadActiveBindings` の wrangler read のみ） | AC-2 / AC-3 |

## fail / drift 検出の品質確認観点

| 観点 | 確認方法（実装サイクル） | 対応 AC |
| --- | --- | --- |
| MONITORING_GAP 検出 | active + disabled fixture で `buildBindingPolicyDrift` が `MONITORING_GAP` を返し CLI exit 2 | AC-2 / AC-5 |
| STALE_MONITORING 検出 | inactive + enabled fixture で `STALE_MONITORING` を返し CLI exit 2 | AC-2 / AC-5 |
| baseline green | 現状 wrangler.toml + policy JSON で drift 0 / exit 0 | AC-4 |
| parser コメント尊重 | `# binding = "ALERT_DEDUP_KV"` を inactive、非コメントを active と判定 | AC-3 |
| env 横断集約 | production active / staging commented で active 集約 | AC-3 |

## CI 緑判定

| CI job | 期待 | 根拠 |
| --- | --- | --- |
| `cloudflare-alerts-drift / validate`（PR・secret 不要） | binding-drift step を含めて緑（現状 drift 0 で exit 0） | AC-7 / AC-4。local-only のため PR で完結 |
| `cloudflare-alerts-drift / diff`（schedule / dispatch・secret 使用） | 変更しない（既存 `diffPolicy` のまま） | 本タスクは diff job に非接触 |

## 実行タスク

1. typecheck / lint / `test:alerts` / CLI smoke（2 種）/ read-only / CI gate / 不変条件 #8・#5 / HEX / 変更範囲の 11 品質ゲート判定基準を確定する（完了条件: QG-1〜QG-11 が本 Phase に存在）。
2. read-only 検証観点（Cloudflare API / write / op / 純関数副作用）を AC-2 / AC-5 にトレースする（完了条件: read-only 観点表が AC と一致）。
3. fail / drift 検出観点（MONITORING_GAP / STALE_MONITORING / baseline / parser / env 集約）を AC-2〜AC-5 にトレースする（完了条件: drift 観点表が AC と一致）。
4. HEX 直書きが tooling のため該当なしであることと、CI `validate` job 緑判定を明記する（完了条件: QG-10 注記と CI 緑判定表が存在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | 関数シグネチャ / CLI 配線 / 変更ファイル 7 件 |
| 必須 | phase-07.md | AC × テスト マトリクス / coverage 目標 |
| 必須 | scripts/cf.sh | `alerts` allowlist + `--ci` apply 禁止分岐（read-only 確認対象） |
| 必須 | .github/workflows/cloudflare-alerts-drift.yml | `validate` / `diff` job 構成（CI 緑判定対象） |
| 必須 | package.json | `test:alerts` glob / `cf:alerts:*` script |
| 参考 | docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/phase-09.md | 品質ゲート表フォーマット参照 |

## スコープ

### 含む

- 11 品質ゲート（typecheck / lint / test:alerts / CLI smoke ×2 / read-only / CI gate / 不変条件 #8・#5 / HEX / 変更範囲）の判定方針
- read-only 検証観点と AC トレース
- fail / drift 検出観点と AC トレース
- HEX 該当なし注記・CI `validate` job 緑判定

### 含まない

- 追加の実装作業（品質保証は検証と記録に限定）
- CI ワークフロー / lefthook.yml の編集（本 Phase は仕様）
- 既存 `diff` job / `diffPolicy` の品質変更

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 11 ゲートの PASS/未達を GO / NO-GO 判定へ渡す |
| Phase 11 | CLI smoke（QG-4 exit 0 baseline / QG-5 `--json`）を手動 smoke の基準として渡す |

## 多角的チェック観点

- 品質確認が手動目視だけに依存せず回帰 spec + CLI smoke で自動化されているか。
- read-only 検証が grep で機械的に確認できるか（`setAlertTokenMode` / `loadActual` / `op run` 0 件）。
- baseline green（exit 0）と drift 検出（exit 2）の双方を確認できるか。
- 変更ファイルが 7 件に収まり scope 逸脱がないか。
- HEX 該当なしが「触っていないから構造的に N/A」であることが明示されているか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 11 品質ゲート判定方針確定 | completed | QG-1〜QG-11 |
| 2 | read-only 検証観点 AC トレース | completed | AC-2 / AC-5 |
| 3 | fail / drift 検出観点 AC トレース | completed | AC-2〜AC-5 |
| 4 | HEX 該当なし注記 + CI 緑判定 | completed | QG-10 / validate job |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| QA 記録 | （本 phase-09.md に内包。artifacts.json では別 main.md を持たない） | 11 品質ゲート判定方針 / read-only 検証観点 / drift 検出観点 / CI 緑判定 |
| メタ | artifacts.json `phases[8].outputs` | 空配列（本 phase-09.md が正本） |

> **Automation-30 改善後の現行状態**: `pnpm test:alerts`、CLI smoke、全体 `pnpm typecheck`、全体 `pnpm lint` は今回サイクルで採取済み。

## 完了条件 (Acceptance Criteria for this Phase)

- [x] typecheck / lint / `test:alerts` / CLI smoke（2 種）/ read-only / CI gate / 不変条件 #8・#5 / HEX / 変更範囲の 11 ゲート判定方針が明記されている
- [x] read-only 検証観点（Cloudflare API / write API / op / 純関数副作用）が AC-2 / AC-5 にトレースされている
- [x] fail / drift 検出観点（MONITORING_GAP / STALE_MONITORING / baseline / parser / env 集約）が AC-2〜AC-5 にトレースされている
- [x] HEX 直書きが tooling のため該当なし（`verify-design-tokens` 対象外パス）と明記されている
- [x] 不変条件 #8（`.spec.ts`）/ #5（D1 境界）の検証ゲートが存在する
- [x] CI `cloudflare-alerts-drift / validate` が binding-drift step を含めて緑になる判定が明記されている
- [x] focused 実走証跡（`pnpm test:alerts` / CLI smoke）は今回サイクルで採取済みとして明示されている

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が `completed`
- artifacts.json で Phase 9 は別 output を持たないため、本 phase-09.md が正本
- 11 品質ゲートが AC / 不変条件にトレースされている
- artifacts.json の `phases[8].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - 11 品質ゲート判定基準を GO / NO-GO 判定へ渡す
  - read-only 検証（grep 0 件）を read-only 不変条件最終確認へ渡す
  - CLI smoke（QG-4/QG-5）を Phase 11 手動 smoke の基準として渡す
- ブロック条件:
  - 品質ゲートのいずれかで未達が残る
  - read-only 検証で Cloudflare API / mutation 呼び出しが検出される
