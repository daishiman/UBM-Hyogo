# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新（実装ガイド / システム仕様更新判定 / changelog / 未タスク検出 / skill-feedback / compliance） |
| 作成日 | 2026-06-02 |
| 前 Phase | 11 (手動 smoke test / CLI 回帰検証) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ） |

## 目的

本ワークフローは Phase 1〜13 の仕様整備に加え、実コード（gate スクリプト / 回帰 spec / CI workflow / `package.json` / Current Cloudflare binding inventory 更新）を今回サイクルでローカル実装する。commit・push・PR・Issue mutation のみユーザー承認後に行う。

この前提のもと、Phase 12 が本来求める 6 タスク（Task 12-1 実装ガイド / 12-2 システム仕様更新判定 / 12-3 changelog / 12-4 未タスク検出 / 12-5 skill-feedback / 12-6 compliance）を「本ワークフローでの扱い」に写像し、今回実施する範囲と user-gated 境界を判定の正本として固定する。重点は次の 2 点である。

1. **Task 12-2（システム仕様更新判定）**: 正本仕様 `deployment-cloudflare.md` の「Current Cloudflare binding inventory」表は本 gate の **機械検出対象 SSOT** であるため、(i) 同表が機械検出対象である旨の注記追加、(ii) 現存ドリフトである `MEMBER_PHOTOS` 行の追加（AC-10）、(iii) R-1 解消のための `DB` / `SYNC_ALERTS` 行追加を **要更新** と判定し、実装サイクルで実施する。
2. **Task 12-4（未タスク検出）**: Phase 3 の MINOR R-1（全 binding inventory 化 = D1 / analytics も棚卸し対象へ拡張）は同一サイクルで解決済み。R-2 は issue-57-followup-003 の既存別射程、R-3 は Phase 6 で解決済みとして記録する。新規未タスクは 0 件。

## Phase 12 の本ワークフローでの扱い

| Task | 標準内容 | 本 WF での扱い | 判定 |
| --- | --- | --- | --- |
| 12-1 実装ガイド（implementation-guide.md） | 中学生レベルの概念説明 + 実装手順を canonical 成果物として生成 | `outputs/phase-12/implementation-guide.md` を作成し、Part 1（初学者向け）+ Part 2（技術者向け）を記録 | 完了 |
| 12-2 システム仕様更新判定 | 正本仕様（specs / skill references）の更新要否を判定 | `deployment-cloudflare.md` 棚卸し表に (i) 機械検出対象 SSOT 注記 + (ii) `MEMBER_PHOTOS` 行（AC-10）を追加 | **更新済み** |
| 12-3 changelog | SKILL-changelog / LOGS 等への変更記録 | `documentation-changelog.md`、aiworkflow changelog、LOGS headline を同一 wave で追加 | 完了 |
| 12-4 未タスク検出 | 残課題を未タスク候補 / 別 Issue 射程へ振り分け | `unassigned-task-detection.md` に R-1/R-3 解決済み、R-2 既存別射程、新規未タスク 0 件を記録 | **未タスク 0 件** |
| 12-5 skill-feedback | skill 運用上の知見を feedback として記録 | `skill-feedback-report.md` に routing を記録。owning skill 定義変更は no-op、deployment reference と aiworkflow ledgers へ昇格 | 完了 |
| 12-6 compliance | verify:phase12-compliance（canonical 9 見出し）で適合検証 | `phase12-task-spec-compliance-check.md` を作成し、strict 7 / Phase 11 evidence / same-wave sync / 4条件を確認 | 完了 |

### Task 12-2 Step 2: deployment-cloudflare.md 更新判定（要更新）

| 観点 | 判定 | 内容 |
| --- | --- | --- |
| 機械検出対象 SSOT 注記 | **更新済み** | 「Current Cloudflare binding inventory」表が本 gate（`verify-wrangler-binding-drift`）の機械検出対象 SSOT である旨を注記。以降の binding 増減はこの表を必ず更新する運用を明文化した |
| DB / SYNC_ALERTS 行追加（R-1 解消） | **更新済み** | D1 / Analytics も棚卸し表と gate の対象に含め、全 applied binding inventory 化を同一サイクルで完了 |
| MEMBER_PHOTOS 行追加（AC-10） | **更新済み** | `MEMBER_PHOTOS`（R2 bucket・production/staging active・issue-983 起源）の行を表へ追加。これにより現行 repo で `pnpm verify:wrangler-binding-drift` が exit 0 になる（現存ドリフト是正 = 根本解決） |
| その他 specs（00-overview / 08-free-database 等） | 更新不要 | 本タスクは read-only gate と Current Cloudflare binding inventory 更新に閉じる。D1 schema / Google Form / 認証仕様には触れない |

> 上記更新は今回サイクルで `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に反映済み。commit / push / PR のみ user-gated とする。

### Task 12-4 未タスク検出（候補 0 件）

| # | 指摘（Phase 3 由来） | 重大度 | 本 Phase での扱い |
| --- | --- | --- | --- |
| R-1 | 全 binding inventory 化（D1 / analytics も棚卸し表突合対象へ拡張） | MINOR | **解決済み**。Current Cloudflare binding inventory へ拡張し、DB / SYNC_ALERTS 行と全 applied binding inventory 突合を追加 |
| R-2 | KV alert policy ↔ binding 活性連動の drift 検出 | MINOR | **別 Issue 射程**（issue-57-followup-003）。責務分離のため本タスクで扱わない |
| R-3 | 棚卸し表 state 表記揺れの未知語処理 | MINOR | **Phase 6 で解決済み**（unknown は warn にとどめ誤 fail 回避）。未タスク化しない |

> 新規未タスク候補は **0 件**。R-1 は同一サイクルで解決し、R-2 は既存別 Issue 射程、R-3 は Phase 6 解決済み。

## 実行タスク

1. Phase 12 の 6 タスク（12-1〜12-6）を「本 WF での扱い」テーブルに写像する（完了条件: 6 行すべてに判定が付与され、strict 7 成果物 / 要更新 / user-gated 境界が明示されている）。
2. Task 12-2 Step 2 で `deployment-cloudflare.md` の「機械検出対象 SSOT 注記」+「MEMBER_PHOTOS 行追加（AC-10）」+「DB / SYNC_ALERTS 行追加（R-1）」を反映する（完了条件: 更新判定テーブルに 3 件の更新済みが存在）。
3. Task 12-4 で MINOR R-1 を同一サイクル解決済み、R-2=別 Issue 射程 / R-3=Phase 6 解決済みへ振り分ける（完了条件: 新規未タスク 0 件と明記）。
4. 実装手順は Phase 5 / Phase 12 main に統合し、重複する別名 guide を作らないと固定する（完了条件: 成果物テーブルに main.md が記載）。
5. focused regression spec と gate 実行を Phase 11 evidence として記録する（完了条件: Phase 11 / final summary に実行コマンドが存在）。
6. commit / push / PR / Issue mutation は実装サイクル + ユーザー承認まで行わないことを再確認する（完了条件: CONST_002 / user-gated の記述が存在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-03.md | MINOR R-1〜R-3（R-1 same-cycle 解決、R-2 既存別射程、R-3 解決済みの起点） |
| 必須 | phase-02.md | 変更 5 ファイル一覧（deployment-cloudflare.md 編集の射程） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 棚卸し表正本（要更新対象・SSOT） |
| 必須 | .claude/skills/task-specification-creator/references/phase12-compliance-check-template.md | compliance canonical 9 見出しテンプレ（strict 7 / same-wave sync / 4条件の根拠） |
| 必須 | CLAUDE.md | CONST_002（user-gated）/ 不変条件 #5・#8 |
| 任意 | docs/30-workflows/unassigned-task/issue-57-followup-003-kv-alert-policy-drift-detection.md | R-2 の責務分離先 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Task 12-1〜12-6 の本 WF での判定サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | Task 12-1 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Task 12-2 システム仕様更新サマリ |
| ドキュメント | outputs/phase-12/documentation-changelog.md | Task 12-3 変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | Task 12-4 未タスク検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | Task 12-5 skill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Task 12-6 compliance |
| メタ | artifacts.json / outputs/artifacts.json | Phase 12 状態（completed）と strict 7 outputs |

> Phase 12 strict 7 は本 workflow root の `outputs/phase-12/` に物理配置済み。別名・短縮名は使わない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | CLI smoke の exit 0 実績（AC-10 green）を Task 12-2 棚卸し表更新の前提として受領 |
| Phase 13 | 変更ファイル + 検証コマンドを PR 本文ドラフトへ渡す。新規未タスク 0 件を渡す |

## 完了条件

- [x] Phase 12 の 6 タスク（12-1〜12-6）が「本 WF での扱い」テーブルに写像され、各行に判定が付与されている
- [x] Task 12-2 Step 2 で `deployment-cloudflare.md` の SSOT 注記 + MEMBER_PHOTOS 行（AC-10）が更新済みである
- [x] Task 12-4 で新規未タスクが **0 件** と明記され、R-1 は同一サイクル解決済みである
- [x] R-2=別 Issue 射程 / R-3=Phase 6 解決済みへ振り分けられている
- [x] Phase 12 strict 7 成果物が `outputs/phase-12/` に物理配置されている
- [x] `phase12-task-spec-compliance-check.md` が canonical 9 見出しで作成されている
- [x] commit / push / PR / Issue mutation がユーザー承認まで行われないと再確認されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 成果物 `outputs/phase-12/main.md` が配置済み
- 新規未タスク 0 件、R-1 同一サイクル解決済みが記録されている
- artifacts.json の `phases[12].status` が `completed` で、Phase 12 strict 7 outputs を列挙している

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - 変更 5 ファイル一覧（gate / spec / workflow / package.json / deployment-cloudflare.md）
  - 検証コマンド（typecheck / lint / vitest / `verify:wrangler-binding-drift` exit 0）
  - 新規未タスク 0 件
  - commit / push / PR / Issue mutation は user-gated（CONST_002）
- ブロック条件:
  - Task 12-2 の棚卸し表更新判定が AC-10 と乖離する
  - 未タスク検出が R-1 解決済みを反映していない
