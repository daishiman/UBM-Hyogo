# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー（GO/NO-GO ゲート） |
| 作成日 | 2026-04-30 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（final review gate） |

## 目的

Phase 1〜9 で蓄積した要件・移植マトリクス設計・設計レビュー・テスト戦略・実装ランブック（受入条件 patch 案）・異常系・AC マトリクス・DRY 化・QA 監査の各成果物を横断レビューし、AC-1〜AC-11 完全充足 / 4条件 PASS / 不変条件 #1・#4・#5・#7 違反なし / 後続 U02・U04・U05 起票確認 / Phase 13 PR 作成への承認ゲートを明示した状態で **GO / NO-GO 判定** を確定する。spec_created 段階のため「未実装だが仕様確定」状態を許容するが、close-out として impl 派生差分が U02 / U04 / U05 へ正しく委譲されているかを評価軸に含める。MINOR は必ず未タスク化（`unassigned-task/` への formalize）。**Phase 13 PR 作成は user 承認必須**を明示する。

## 実行タスク

1. AC-1〜AC-11 の達成状態を spec_created 視点で評価する（完了条件: 11 件すべてに「PASS」「条件付き PASS」「仕様未確定」のいずれかが付与）。
2. 4条件（価値性 / 実現性 / 整合性 / 運用性）最終判定を確定する（完了条件: PASS/MINOR/MAJOR が一意に決定、根拠が Phase 9 引き渡し材料に紐付け）。
3. 不変条件 #1 / #4 / #5 / #7 違反監査の最終確認（完了条件: 4 件すべて違反 0、根拠が Phase 9 監査表に紐付け）。
4. 後続タスク U02 / U04 / U05 の起票状態を確認する（完了条件: 3 ファイルが `unassigned-task/` 配下に実在し、本仕様書からリンク済み）。
5. blocker 一覧と risk サマリーを表化する（完了条件: blocker 4 件以上、risk が低/中/高で評価）。
6. MINOR 判定が出た場合の未タスク化方針を明文化する（完了条件: `unassigned-task/` への formalize ルートが記述）。
7. GO / NO-GO 判定を確定し、Phase 13 PR 作成への承認ゲートを明示する（完了条件: `outputs/phase-10/go-no-go.md` に GO 判定 + 「Phase 13 PR 作成は user 承認必須」明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-07.md | AC × 検証 × 成果物トレース |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-08.md | DRY 化 / SSOT 集約結果 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-09.md | rg 検証 / skill 整合 / 不変条件監査 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-03.md | base case 最終判定 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md | AC-1〜AC-11 / 不変条件 / 完了判定 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md | U02 起票確認 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md | U04 起票確認 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md | U05 起票確認 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | unassigned task formalize ルート |
| 参考 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-10.md | 最終レビュー参照事例 |

## GO / NO-GO 判定マトリクス（AC × 達成状態）

> **評価基準**: spec_created 段階のため、「仕様が Phase 1〜9 で具体的に確定し、Phase 5 ランブックで 03a / 03b / 04c / 09b への受入条件 patch 案が実行可能粒度に分解されているか」で判定する。impl 必要差分が U02 / U04 / U05 へ正しく委譲されているかも評価軸に含む。

| AC | 内容 | 達成状態（spec_created 時点） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | UT-21 stale 前提 5 項目の差分表固定 | 確定 | Phase 8 SSOT 5 軸表 / index.md「苦戦想定」 | PASS |
| AC-2 | 有効品質要件 4 種の移植先一意割当 | 確定 | Phase 2 migration-matrix-design.md / Phase 5 ランブック | PASS |
| AC-3 | `POST /admin/sync` / `GET /admin/sync/audit` 新設禁止方針の双方明記 | 確定 | Phase 2 no-new-endpoint-policy.md / 原典 spec / 本 phase / Phase 8 SSOT | PASS |
| AC-4 | `sync_audit_logs/outbox` 新設は U02 判定後保留 | 確定 | Phase 8 SSOT 表 / U02 ファイル | PASS |
| AC-5 | 後続 U02 / U04 / U05 が別ファイルで存在しリンク済み | 確定 | Phase 9 cross-link 死活確認 / index.md 関連リンク | PASS |
| AC-6 | 03a / 03b / 04c / 09b 受入条件 patch 案が Phase 5 で提示 | 確定 | Phase 5 implementation-runbook.md | PASS |
| AC-7 | aiworkflow-requirements current facts と矛盾なし | 確定 | Phase 9 skill-integrity-audit.md（6 軸 PASS） | PASS |
| AC-8 | 4条件最終判定 PASS | 本 Phase で確定 | 下記 4条件最終評価 | PASS |
| AC-9 | 不変条件 #5 違反なし | 確定 | Phase 9 不変条件監査（#1/#4/#5/#7 全て違反 0） | PASS |
| AC-10 | 検証コマンドの出力根拠記録 | 確定（spec 段階で実出力は Phase 11 smoke で再取得） | Phase 9 rg-verification-log.md | PASS（条件付き：Phase 11 で再実行） |
| AC-11 | GitHub Issue #234 が CLOSED のまま、本仕様書が成果物として参照可能 | 確定 | index.md / artifacts.json | PASS |

> AC-10 の「条件付き PASS」: spec 段階の rg 出力期待値は Phase 9 で定義済み、Phase 11 手動 smoke で実出力を取得し最終確定する。本 Phase では blocker ではなく Phase 11 への送り事項として扱う。

## 4条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-21 を direct implementation せず legacy umbrella として閉じることで、Sheets sync と Forms sync の二重正本リスクを除去。有効品質要件 4 種（Bearer guard / 409 排他 / D1 retry / manual smoke）が 03a / 03b / 04c / 09b へ漏れなく移植され、Phase 1 真の論点と整合。 |
| 実現性 | PASS | docs-only スコープに閉じ、impl 必要差分は U02（audit table 必要性判定）/ U04（実環境 smoke 再実行）/ U05（実装パス境界整理）へ委譲。Phase 9 で新規 Secret 導入 0、無料枠影響 0、cross-link 死活 0、line budget PASS を確認。 |
| 整合性 | PASS | 不変条件 #1（schema をコードに固定しない）/ #4（admin-managed 分離）/ #5（D1 直接アクセスは apps/api 内）/ #7（Forms 再回答が本人更新の正式経路）の 4 件すべて違反 0。Phase 8 で SSOT 5 軸用語表に集約済み、Phase 9 で skill `task-workflow.md` current facts と 6 軸完全整合。 |
| 運用性 | PASS | SSOT 5 軸用語表により次回同種 close-out（旧仕様 vs 現行正本）の判定コストが低下、共通化テンプレ候補 4 件を Phase 12 skill-feedback で正本化提案予定。後続 U02 / U04 / U05 が独立に進行可能、CLOSED Issue #234 追跡も index.md に固定。 |

**最終判定: GO（PASS）**

## 不変条件最終確認

| # | 不変条件 | 監査結果 | 根拠 Phase |
| --- | --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | 違反 0 | Phase 9 |
| #4 | Form schema 外データは admin-managed として分離 | 違反 0 | Phase 9 |
| #5 | D1 直接アクセスは `apps/api` に閉じる | 違反 0 | Phase 9 |
| #7 | MVP では Google Form 再回答を本人更新の正式経路 | 違反 0 | Phase 9 |

## 後続タスク起票確認（U02 / U04 / U05）

| ID | ファイル | 起票状態 | 本 index.md からのリンク | 内容サマリー |
| --- | --- | --- | --- | --- |
| UT21-U02 | `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md` | 実在 | あり（関連リンク・主要参照資料） | `sync_audit_logs/outbox` の必要性を `sync_jobs` 不足分析として再判定 |
| UT21-U04 | `docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md` | 実在 | あり | Phase 11 smoke を実 secrets / 実 D1 環境で再実行（NON_VISUAL） |
| UT21-U05 | `docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md` | 実在 | あり | `apps/api/src/sync/*` 想定と実構成（`apps/api/src/jobs/*` / `apps/api/src/sync/schema/*`）の境界整理 |

> UT21-U03（Phase 12 成果物欠落）は phase-12 配下で既に成果物追加済みのため新規タスク化不要（原典 spec section 5 注記と整合）。

## blocker 一覧（着手前提として確認必須）

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | 並列 03a / 03b / 04c / 09b の受入条件 patch 案が Phase 5 ランブック通りに各タスク Phase で適用されること | 並列タスク | 各タスクの Phase 7 AC マトリクスに UT-21 由来の品質要件 4 種が反映 | 各タスクの phase-07.md 確認 |
| B-02 | aiworkflow-requirements skill `task-workflow.md` current facts に drift がないこと | 内部前提 | Phase 9 skill-integrity-audit.md で 6 軸 PASS | Phase 9 成果物確認 |
| B-03 | 後続 U02 / U04 / U05 の Wave 配置が決定済みであること | スコープ前提 | U02: Wave 1〜2 / U04: Wave 2 / U05: Wave 2〜3 の方針が原典 spec と整合 | Phase 12 unassigned-task-detection.md で確定 |
| B-04 | `task-sync-forms-d1-legacy-umbrella-001` 姉妹 close-out との用語整合 | 上流タスク | Phase 8 共通化テンプレ候補 4 件と整合、両者の SSOT 表に矛盾なし | 姉妹 close-out 仕様書を Phase 12 で再確認 |
| B-05 | GitHub Issue #234 が CLOSED 状態のまま、本仕様書が成果物として認識可能 | 内部前提 | `gh issue view 234` で `state=CLOSED`、本仕様書 URL が Issue body or comment に追記されない（user 判断） | Phase 11 smoke で確認 |
| B-06 | Phase 13 PR 作成は user 承認なしでは実行しない | プロセス前提 | Phase 13 spec に「user 承認必須」明記 | phase-13.md 確認 |

## risk サマリー

| # | risk | 影響度 | 発生確率 | 対応 |
| --- | --- | --- | --- | --- |
| R-01 | 03a / 03b / 04c / 09b への patch 案が各タスク Phase で適用漏れ | 中 | 低 | Phase 5 ランブックを各タスクの index.md からリンク、各タスク Phase 7 で patch 反映を AC 化 |
| R-02 | U02 判定が遅延し `sync_audit_logs/outbox` 新設可否が不確定のまま長期化 | 中 | 中 | U02 を Wave 1〜2 に配置、`sync_jobs` ledger で当面運用 |
| R-03 | UT-21 legacy 仕様書を将来の実装者が誤って参照し Sheets 経路を実装 | 高 | 低 | UT-21 legacy 状態欄に本タスク ID をクロスリンク、Phase 12 で legacy umbrella マーキング |
| R-04 | skill `task-workflow.md` が将来更新され current facts が drift | 中 | 中 | aiworkflow-requirements の indexes 再生成 CI gate（verify-indexes.yml）で検出 |
| R-05 | 共通化テンプレが skill-feedback に提案されたが採用されない | 低 | 中 | 採用判断は skill-creator 側、本タスクではメモのみ残す |

## MINOR 判定の未タスク化方針

- 本タスク Phase 10 では **MINOR 判定なし**（4条件すべて PASS）。
- 仮に Phase 11 / 12 / 13 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化** する（本タスク内で抱え込まない）。
  2. `docs/30-workflows/unassigned-task/` 配下に新規 .md を作成し、原典として登録。
  3. Phase 12 の `unassigned-task-detection.md` に該当 ID を記載（0 件でも出力必須）。
  4. 該当 task は次 Wave 以降の優先度評価に回す。
- 例: 「`sync_jobs` の metrics_json schema を厳密化する」が Phase 11 smoke で発覚した場合は MINOR として U02 に統合または独立タスク化。

## Phase 11 / 13 進行 GO / NO-GO 基準

### GO 条件（すべて満たすこと）

- [ ] AC-1〜AC-11 すべて PASS（AC-10 の条件付き PASS は OK）
- [ ] 4条件最終判定が PASS
- [ ] 不変条件 #1 / #4 / #5 / #7 違反 0
- [ ] 後続 U02 / U04 / U05 が `unassigned-task/` 配下に実在しリンク済み
- [ ] blocker B-01〜B-06 が記述され、解消条件が明記
- [ ] MAJOR が一つもない
- [ ] **Phase 13 PR 作成は user 承認必須** が明示されている

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある（条件付き PASS は除く）
- 不変条件違反検出
- 後続 U02 / U04 / U05 が未起票
- blocker の解消条件が未記述
- MINOR を未タスク化せず本タスク内に抱え込む
- Phase 13 PR 作成の user 承認ゲートが明記されていない

## Phase 13 への承認ゲート（必須明示）

> **重要**: Phase 13（PR 作成）は **user 承認なしでは実行しない**。
>
> - Phase 10 GO 判定 → Phase 11 smoke → Phase 12 documentation 更新 までは spec_created → in_progress 進行可だが、
> - Phase 13 の commit / push / PR 作成は user の明示的指示（「PR を作成して」「Phase 13 を実行して」等）を受けてから着手する。
> - GO 判定 = Phase 13 への自動進行ではなく、Phase 13 着手の **前提条件が整った状態** を意味する。
> - 原典 spec section 2「含まないもの」および本 index.md 完了判定「Phase 13 はユーザー承認なしでは実行しない」と整合。

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 の AC マトリクスを基に spec_created 視点で 11 件評価。

### ステップ 2: 4条件最終判定
- Phase 3 base case 判定を Phase 9 QA 結果で再確認。

### ステップ 3: 不変条件最終確認
- #1 / #4 / #5 / #7 違反 0 を Phase 9 監査表から転記。

### ステップ 4: 後続 U02 / U04 / U05 起票確認
- 3 ファイルの実在確認、本 index.md からのリンク確認。

### ステップ 5: blocker 一覧と risk サマリー作成
- blocker 6 件、risk 5 件を表化。

### ステップ 6: MINOR 未タスク化方針明文化
- 本 Phase で MINOR 0 を確認、ルールのみ記述。

### ステップ 7: GO/NO-GO 確定 + Phase 13 承認ゲート明示
- `outputs/phase-10/go-no-go.md` に GO 判定 + 「Phase 13 は user 承認必須」を記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に手動 smoke test（rg 再実行 / cross-link 再確認）実施 |
| Phase 12 | 後続 U02 / U04 / U05 を `unassigned-task-detection.md` に列挙、共通化テンプレ候補を skill-feedback-report.md に転記 |
| Phase 13 | GO/NO-GO 結果を PR description に転記、user 承認後にのみ commit / push / PR 作成 |
| 03a / 03b / 04c / 09b | 受入条件 patch 案を各タスク Phase 7 で AC 反映 |
| 後続 U02 / U04 / U05 | 起票済み状態を維持、Wave 配置確定 |

## 多角的チェック観点

- 価値性: UT-21 二重正本リスク除去 + 03a/03b/04c/09b への移植 patch 案完成。
- 実現性: docs-only スコープで GO 判定可能、Phase 9 で全観点 PASS。
- 整合性: 不変条件 #1/#4/#5/#7 全て satisfied、Phase 8 で SSOT 統一、Phase 9 で skill 整合 PASS。
- 運用性: 後続 3 タスクが独立進行可能、CLOSED Issue #234 追跡固定。
- 認可境界: 新規 Secret 導入 0、既存 `SYNC_ADMIN_TOKEN` / `GOOGLE_FORMS_API_KEY` 参照のみ。
- 無料枠: docs-only のため CI 実行コストへの影響なし。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-11 達成状態評価 | 10 | spec_created | 11 件 |
| 2 | 4条件最終判定 | 10 | spec_created | PASS |
| 3 | 不変条件最終確認 | 10 | spec_created | #1/#4/#5/#7 違反 0 |
| 4 | 後続 U02/U04/U05 起票確認 | 10 | spec_created | 3 件実在 |
| 5 | blocker 一覧 + risk サマリー | 10 | spec_created | blocker 6 件 / risk 5 件 |
| 6 | MINOR 未タスク化方針 | 10 | spec_created | ルール明文化 |
| 7 | GO/NO-GO + Phase 13 承認ゲート明示 | 10 | spec_created | GO + 承認必須 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・4条件・不変条件・後続起票確認・blocker / risk・Phase 13 承認ゲート |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC-1〜AC-11 全件に達成状態が付与されている
- [ ] 4条件最終判定が PASS
- [ ] 不変条件 #1 / #4 / #5 / #7 違反 0 が記述されている
- [ ] 後続 U02 / U04 / U05 の 3 ファイル実在 + 本 index.md からのリンク確認済み
- [ ] blocker 一覧に 6 件、risk サマリーに 5 件が記述されている
- [ ] MINOR 未タスク化方針が明文化されている
- [ ] GO/NO-GO 判定が GO で確定
- [ ] Phase 13 PR 作成は user 承認必須が明示されている
- [ ] outputs/phase-10/go-no-go.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 4条件 × 不変条件 × 後続起票 × blocker × risk × MINOR × GO/NO-GO × Phase 13 承認ゲートの 9 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test)
- 引き継ぎ事項:
  - GO 判定（spec_created 段階）
  - blocker 6 件 / risk 5 件（Phase 11 / 12 着手前に再確認必須）
  - 後続 U02 / U04 / U05 起票確認済み（Phase 12 unassigned-task-detection.md で再列挙）
  - AC-10 を Phase 11 手動 smoke で rg 実出力で最終確認
  - Phase 13 PR 作成は user 承認必須（Phase 11 / 12 完了後も自動進行禁止）
- ブロック条件:
  - 4条件のいずれかが MAJOR
  - AC で PASS でないもの（条件付き PASS は除く）が残る
  - 不変条件違反検出
  - 後続 U02 / U04 / U05 のいずれかが未起票
  - blocker の解消条件が未記述
  - Phase 13 承認ゲートが明記されていない
