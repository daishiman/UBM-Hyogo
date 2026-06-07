# Phase 10: 最終レビュー

> **実装区分: 実装仕様書** — acceptance criteria の充足見込み判定・blocker 判定・未タスク化候補を確定する。

## 10.0 レビュー対象

- workflow: `issue-1125-bulk-tag-result-staging-mutation-visual-baseline`
- 本 wave の実装物（spec / fixture / runner の新規追加）:
  - `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts`（mutation interaction-gated・result 2 状態 baseline）
  - `apps/api/migrations/seed/bulk-tag-result-staging-seed.sql`（退会済み member を含む synthetic fixture 投入）
  - `apps/api/migrations/seed/bulk-tag-result-staging-cleanup.sql`（6 table prefix DELETE）
  - `scripts/smoke/capture-bulk-tag-result.sh`（guard / seed / capture / `trap cleanup EXIT` / 残存 0 検証 / redact）
  - `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh`（Phase 6 で追加・shell 単体検証）
- 本タスクのこのサイクルの成果: **implemented_local_evidence_captured / `VISUAL_ON_EXECUTION`**（Phase 1〜12 仕様完成 + 実コード追加 + local runner evidence）。staging mutation・baseline 生成・cleanup・commit は **user-gated**（index §3）。

## 10.1 受け入れ基準の充足見込み判定

index.md §1 の AC-1〜AC-8 を正本とする。implemented_local_evidence_captured 段階のため「**実コード + local evidence で担保**」と「**runtime user-gated**（実機実行時に確定）」を区別する。

| ID | 受け入れ基準（要約） | 充足手段（Phase 参照） | 判定 |
| --- | --- | --- | --- |
| AC-1 | 専用 staging fixture（`e2e_test_issue1125_` prefix）を seed すると all-success 用 active 2 + partial-failure 用 active 1 / 退会済み 1 + 登録済み tag が投入される | seed SQL 骨子（P2 §2.2 / P5 §5.3）。冒頭 DELETE + `INSERT OR REPLACE` で冪等。`pf_mem_deleted` は `is_deleted=1` | **仕様で担保**（runtime で seed 実投入を確定） |
| AC-2 | 認証 `/admin/members` で all-success member 選択 → tag 適用で `bulk-tag-result`（付与>0 / skipped=0 / notFound=0）表示 + `bulk-tag-result-all-success.png` 取得 | TC-R-AS-01（P4 §4.2）+ spec test 1（P5 §5.2）。`付与 2` / skipped count 0 / notFound count 0 を assert | **仕様で担保** / baseline 生成は **runtime user-gated** |
| AC-3 | partial-failure member（active + 退会済み混在）選択 → tag 適用で `bulk-tag-result-skipped`（退会済みスキップ≥1）表示 + `bulk-tag-result-partial-failure.png` 取得 | TC-R-PF-01（P4 §4.2）+ spec test 2（P5 §5.2）。`bulk-tag-result-skipped` visible / `付与 1` / `退会済みスキップ 1` を assert | **仕様で担保** / baseline 生成は **runtime user-gated** |
| AC-4 | canonical 名が phase-11 / implementation-guide / artifacts ledger と一致し staging 名前空間で local fixture と衝突しない | `SNAP` const 集約（P5 §5.2）+ project 名前空間 `{arg}-authenticated-staging-visual-{platform}`（P5 §5.7）+ doc QA grep 照合（P9 §9.1） | **仕様で担保**（doc 整合は本サイクルで確定済み） |
| AC-5 | mutation 対象は synthetic prefix のみ。capture 完了後（成功/失敗/中断いずれも `trap ... EXIT`）に cleanup を実行し 6 table の残存 0 を検証・記録 | runner `trap 'cleanup \|\| true; ...' EXIT` + `count_by_table` 0 検証（P5 §5.5）+ shell test TC-S-08（P4 §4.3） | **仕様で担保**（shell test で構造検証）/ 残存 0 実測は **runtime user-gated** |
| AC-6 | 実行ログに認証経路・URL・command・保存先・mutation 対象 ID・seed/cleanup 結果を `redact.sh` で秘匿化して残す | runner の `OUT_LOG` への redact 出力（P5 §5.5）+ shell test TC-S-09（redact）（P4 §4.3） | **仕様で担保** / 実ログ生成は **runtime user-gated** |
| AC-7 | staging guard（`CF_D1_DATABASE=ubm-hyogo-db-staging` 固定 / production target 拒否 / staging allowlist 一致）。production では一切実行しない | runner `assert_staging_guard`（P5 §5.5）+ shell test TC-S-01..06（P4 §4.3） | **仕様で担保**（shell test で拒否経路を構造検証） |
| AC-8 | apps/api・apps/web 本体ソース・D1 schema（table 定義）・Google Form を変更しない（新規 spec + seed/cleanup SQL + runner の追加のみ） | 変更ファイル一覧（P5 §5.1）= 新規 5 ファイルのみ。`migrations/seed/` は synthetic データ投入で schema 変更ではない（P9 §9.1） | **仕様で担保**（構造的に充足） |

## 10.2 blocker 判定

| 候補 | 判定 |
| --- | --- |
| 認証基盤の不在 | **blocker でない**。`setup.staging-auth.ts` が admin storageState を mint し `staging-visual-authenticated` project が `testDir` 自動登録（issue-901 / issue-1077 で実証済み・config 編集不要） |
| セレクタ不在 | **blocker でない**。全 locator を apps/web 実コードで確認済み（`region "一括操作"` / `region "タグ一括付与・解除"` / `group "付与モード"` / `data-testid="admin-members-row-{id}"` / `bulk-tag-result` / `-counts` / `-skipped` / `-not-found` / apply ボタン `…を付与`）（P1 §1.4 / P3 §3.4） |
| seed/cleanup 基盤の不在 | **blocker でない**。issue-1081 `runtime-tag-bulk.sh` + `bulk-tag-staging-{seed,cleanup}.sql` が landed 済みで、本タスクは構造踏襲（mutation を curl → Playwright に差し替え）（P2 §2.5） |
| D1 remote が `BEGIN TRANSACTION` を拒否 | **blocker でない**（既知制約として対策済み）。seed/cleanup SQL から明示トランザクションを除去する設計（P5 §5.3/5.4・reference: `reference_d1_remote_no_sql_transaction`）。issue-1081 SQL をコピーしない |
| 退会済み member が admin list 既定 search で非表示 | **潜在リスク（blocker でない）**。`members.ts` の GET は is_deleted 無フィルタを確認済み。Phase 5 実装時に既定 list 表示を再確認し、必要なら氏名検索 / filter param で明示表示する（P3 §3.3） |
| staging seed 不足 / mutation 失敗 | **潜在リスク（blocker でない）**。`bulk-tag-result` の `toBeVisible` 待機で mutation 完了を同期し、未達なら baseline 生成段階で安全に止まる。`trap ... EXIT` で残存を放置しない |

→ **blocker なし**。spec / fixture / runner は実装可能な状態で設計が完成している。**Phase 11（手動テスト）へ進行可**。

## 10.3 MINOR 指摘 → 未タスク化候補

`outputs/phase-12/unassigned-task-detection.md` に記録する候補（Phase 12 の unassigned-task-detection が拾う）:

| ID | 指摘 | 区分 | 推奨対応 |
| --- | --- | --- | --- |
| MINOR-01 | `notFound`（未登録 tag）の `bulk-tag-result-not-found` の staging runtime visual は本タスク**非取得 = scope-out**。UI の tag picker は `tag_definitions.active=1` の登録済み tag しか描画しないため、UI 操作だけでは `notFound` を自然発生させられず staging 実機 mutation で再現不可 | **スコープ外（先送りではない・代替担保あり）**。index.md §0.3 / §4 / Phase 1 §1.2 で承認済み | **別タスク化しない**。`notFound` 視覚要素は (a) 親 local fixture `bulk-tag-result-partial-failure.png`（`issue1036-bulk-member-tags.spec.ts` の `page.setContent()` で `notFound` を含む状態を描画済み）+ (b) component spec `BulkActionBar.spec.tsx` TC-BAB-TAG-03（counts / skipped / notFound 描画を unit 担保）で**継続担保済み**。current gap ではなく代替担保のある scope-out のため、unassigned-task としては baseline 記録（起票不要）にとどめる |
| MINOR-02 | viewport を既存 authenticated project の既定（desktop）1 種に限定（mobile / tablet の result baseline 未取得） | improvement / low | レスポンシブ result summary の visual 退行が問題化した時点で別タスク化。本タスクは local fixture と意味的に揃えるため既定 viewport に限定する |

いずれも **本タスクの GO を妨げない**（スコープ外として明示済み）。MINOR-01 は「先送り（未完了の宿題）」ではなく「代替担保のある scope-out」である点を unassigned-task-detection に明記する。

## 10.4 最終判定

| 項目 | 判定 |
| --- | --- |
| spec 完成度 | Phase 1〜12 仕様完成・実装可能・blocker なし |
| AC 充足見込み | AC-1, 4, 7, 8 = 仕様で担保（本サイクルで確定）/ AC-2, 3, 5, 6 = 仕様で担保 + baseline 生成 / 残存 0 実測 / 実ログ生成は runtime user-gated |
| **最終判定** | **GO（implemented_local_evidence_captured / `VISUAL_ON_EXECUTION` で staging runtime user-gated）** |
| runtime（staging seed → mutation → baseline 生成 / cleanup / commit / PR） | **user-gated**（承認後実施） |
| GitHub issue #1125 | **CLOSED 維持**（reopen しない・recovered_from_unassigned / refs_only） |

> 本タスクのこのサイクルの成果は「Phase 1-13 実装仕様書の完成、spec / seed / cleanup / runner / runner test の実コード追加、local runner evidence、doc QA PASS」。認証付き staging での seed・実 mutation・baseline snapshot 生成 / cleanup・commit・PR 作成は user 承認後に委ねる。baseline 2 枚は `VISUAL_ON_EXECUTION` のため staging runtime 実行まで pending（Phase 11 参照）。

## 10.5 完了条件（Phase 10）

- AC-1..8 の充足見込みが「仕様で担保 / runtime user-gated」を区別して個別判定されている
- blocker なしが根拠付きで判定されている（Phase 11 へ進行可）
- MINOR-01（`notFound` staging runtime visual の scope-out = 代替担保あり）/ MINOR-02 が未タスク化候補として記録方針付きで明記されている
- 最終判定 = GO（実装済み local evidence / staging runtime user-gated）が確定している
