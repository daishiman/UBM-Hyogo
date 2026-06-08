# Phase 10: 最終レビュー

`[実装区分: 実装仕様書]` / `implementation_mode: edit` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

Issue #1126「bulk tag picker visual baseline の viewport 拡張（mobile/tablet/wide）」の最終レビューフェーズ。
本フェーズは AC 充足・4 条件評価・残課題判定・implemented_local_runtime_pending close-out 判定を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1126-bulk-tag-picker-viewport-baseline-expansion` |
| issue | #1126（CLOSED 維持 / `Refs #1126`） |
| phase | 10（最終レビュー） |
| workflow_state | `implemented_local_runtime_pending`（実装は本実行サイクル） |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts` |

## 1. AC 充足確認

| # | Acceptance Criteria | 設計での充足 | 判定 |
| --- | --- | --- | --- |
| AC-1 | mobile / tablet / wide で assign / unassign の baseline を取得する | B案で `VIEWPORTS` 由来の mobile(390×844)/tablet(768×1024)/wide(1920×1080) を responsive 3 test に展開し、各 viewport で assign/unassign を `toHaveScreenshot`（新規6枚） | LOCAL PASS / RUNTIME_PENDING |
| AC-2 | baseline 名を viewport suffix で分離する | `bulk-tag-picker-{assign,unassign}-mode-{mobile,tablet,wide}.png` の suffix 規約で衝突なく分離（Phase 7 §2 after 表） | PASS |
| AC-3 | 既存 desktop baseline を破壊しない | desktop は viewport 切替前に先行 capture（suffix なし `-mode.png`）。名前・出力先・diff 閾値・撮影順序を不変（Phase 8 §2） | PASS |
| AC-4 | CI による回帰検出に組み込む | 既存 `staging-visual-authenticated` project に新規 6 baseline が追加され、同 project の比較に自動で含まれる。config 無改修（Phase 8 §3）。baseline 生成・比較は user-gated | LOCAL PASS / RUNTIME_PENDING |

> 4 AC はローカル実装境界では充足する。新 endpoint / D1 schema 変更 / Google Form 仕様変更は発生せず、不変条件を満たす。staging baseline 生成・比較の実 evidence は Phase 11 の user-gated runtime に残す。

## 2. 4 条件最終評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 必要性 | PASS | desktop のみの baseline では responsive 表示幅固有のレイアウト退行（mobile での折り返し崩れ等）を検出できない。mobile/tablet/wide 追加で回帰検出網を拡張する明確な必要がある |
| 妥当性 | PASS | 同一 spec 内 `setViewportSize()` + suffix 分離は、CI 無改修・2 ファイル編集・read-only という不変条件に最も整合する最小手段（viewport 別 project 複製を不採用＝Phase 8 §3） |
| 網羅性 | PASS | 4 viewport × 2 状態 = 8 セルを全埋め（既存 2 + 新規 6）。result mutation 状態は issue-1125 へ責務分担し、本タスク責務（read-only picker 表示の viewport 拡張）を完全網羅（Phase 7 §2/§3） |
| 一貫性 | PASS | 新規 6 baseline の閾値（`maxDiffPixelRatio` / `animations`）を desktop 既存と同値に統一。helper `prepareBulkRegion/switchToUnassignMode` で desktop/responsive の撮影手続きを一貫化（Phase 8 §1, Phase 9 §3） |

## 3. 残課題・未タスク

| 項目 | 区分 | 扱い |
| --- | --- | --- |
| result mutation baseline（apply 後の partial-failure / skipped / notFound 等） | スコープ外 | issue-1125（bulk tag result 2状態 staging mutation visual baseline）が担当。本タスクは read-only に限定し撮らない |
| picker 空状態（tag master 0件） | スコープ外 | テストデータ前提（tag master ≥1）で排除済み（Phase 4）。要件外 |
| 中間 viewport（1024px 等） | スコープ外 | mobile/tablet/wide の 3 代表幅で responsive を代表（Phase 7 §3）。YAGNI |

- 本タスクで先送りする実装項目は**なし**。本実行サイクルが本仕様書どおりに spec / fixture を編集すれば AC を充足し、未着手の繰越タスクは発生しない（CONST_007 充足）。
- スコープ外項目はいずれも本タスクの責務外（issue-1125 への分担 / テストデータ前提 / YAGNI）であり、未タスクの先送りには該当しない。

## 4. implemented_local_runtime_pending close-out 判定

| 判定項目 | 内容 |
| --- | --- |
| workflow_state | `implemented_local_runtime_pending`（実装は本実行サイクルが担当） |
| 本仕様書の完成基準 | Phase 1〜13 の仕様書本文が揃い、4 AC を設計で充足し、変更ファイル（spec / fixture 2 件）と user-gated 境界が確定していること |
| コード実装 | 本実行サイクルで実施済み（本実行サイクルが spec / fixture を編集し、staging capture は user-gated） |
| close 条件 | 実コード・実仕様・skill 反映・ローカル検証が揃った時点で `implemented_local_runtime_pending` として close。staging baseline 取得、commit、push、PR、issue mutation は user-gated boundary に残す |
| issue 状態 | #1126 は CLOSED を維持（`Refs #1126`）。本仕様書で issue mutation は行わない |

> 本タスクは実コード変更を伴う implemented_local_runtime_pending タスクである。
> staging visual capture・commit・push・PR・issue mutation は user-gated であり、runtime PASS は Phase 11 evidence 取得後にのみ主張する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 7 カバレッジ | `../phase-7/phase-7.md` | viewport × state matrix（8 セル）/ スコープ分担 |
| Phase 8 リファクタ方針 | `../phase-8/phase-8.md` | 既存保持 / YAGNI |
| Phase 9 品質保証 | `../phase-9/phase-9.md` | ゲート / 一貫性閾値 |
| 関連（スコープ分担） | issue-1125 | result mutation 状態の担当 |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-10/phase-10.md` | AC 充足表（local pass / runtime pending 境界）、4 条件最終評価（必要性/妥当性/網羅性/一貫性 全 PASS）、残課題（result mutation は issue-1125 担当・先送り項目なし＝CONST_007 充足）、implemented_local_runtime_pending close-out 判定 |

## 完了条件（Phase 10）

| 項目 | 基準 |
| --- | --- |
| AC 充足 | issue 4 AC が設計で全 PASS であることを表で確定した |
| 4 条件 | 必要性 / 妥当性 / 網羅性 / 一貫性 を全 PASS と評価した |
| 残課題 | result mutation は issue-1125 担当でスコープ外、先送り項目なし（CONST_007 充足）を明記した |
| close-out | implemented_local_runtime_pending タスクとして実コード・実仕様・skill 反映・ローカル検証で close し、staging runtime visual は user-gated pending に残す判定を確定した |
