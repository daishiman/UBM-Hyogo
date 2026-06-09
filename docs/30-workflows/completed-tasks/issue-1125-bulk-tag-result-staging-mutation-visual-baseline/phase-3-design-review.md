# Phase 3 — 設計レビュー（Phase 4 ゲート）

> **実装区分: 実装仕様書** — 設計（Phase 2）を 4 条件で評価し Phase 4 進行可否を判定する。

## 3.1 4 条件評価（一次結論）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| **価値性** | ✅ | result 2 状態の唯一残っていた runtime visual hole（local fixture でしか証明できていない）を、実 mutation を経た staging baseline で埋める。reviewer が「実 D1 mutation 後の result summary が本当に意図通り描画される」ことを画像で確認できるコストを 0 にする。 |
| **実現性** | ✅ | 既存 3 基盤（認証 staging Playwright / issue-1081 seed-cleanup runner / `BulkActionBar` result DOM）に乗るだけ。新規は spec 1 + SQL 2 + runner 1 + runner test 1 の小規模。1 実装サイクルに収まる（CONST_007）。 |
| **整合性** | ✅ | 副作用所有権を runner に集約（spec は UI/screenshot のみ）。synthetic prefix `e2e_test_issue1125_` 限定 + `trap` cleanup + 残存 0 検証で staging 共有 D1 への恒久副作用ゼロ。apps 本体ソース・D1 schema・Google Form 不変（AC-8）。 |
| **運用性** | ✅ | runner は CI 化可能（issue-1081 と同じ構造）。production guard・redact ログ・冪等 seed（再実行で再現）で監査運用が破綻しない。baseline 名前空間が local fixture と分離（AC-4）。 |

→ **一次結論: Phase 4 へ進行可（GO）。**

## 3.2 因果ループ（副作用境界）

- **バランスループ（安全性）**: 実 mutation（member_tags 書き込み）→ cleanup（`trap EXIT`）→ 残存 0 検証 → 副作用が回収され staging が初期状態へ収束。検証が fail すれば runner が非 0 exit し、残存を放置しない。
- **強化ループ（再現性）**: seed が冪等（冒頭 DELETE + INSERT OR REPLACE）→ 何度実行しても同じ fixture → baseline が安定 → snapshot diff が意味を持つ。

## 3.3 主要リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| **D1 remote が `BEGIN TRANSACTION` を拒否** | seed/cleanup が staging で失敗 | SQL から明示トランザクションを除去（Phase 2 §2.2・reference: `reference_d1_remote_no_sql_transaction`）。issue-1081 SQL をコピーしない |
| 退会済み member が admin list 既定 search で非表示 | partial-failure を UI 再現不可 | `members.ts` は is_deleted 無フィルタを確認済み。Phase 5 で既定 search 表示を再確認し、必要なら filter param / 氏名検索で明示表示 |
| Playwright 失敗時に mutation 残存 | staging 汚染 | `trap cleanup EXIT` で成功/失敗/中断すべてで cleanup + 残存 0 検証（AC-5） |
| baseline が local fixture 同名で衝突 | snapshot 取り違え | project 名前空間 `{arg}-authenticated-staging-visual-{platform}` で物理分離（AC-4） |
| `notFound`（未登録 tag）を UI で作れず scope 不足と誤認 | 受け入れ不一致 | 親 local fixture + component spec TC-BAB-TAG-03 が継続担保。先送りではない scope-out として明記（Phase 1 §1.2 / unassigned baseline 記録） |
| 実 mutation のため runtime は user-gated | 自動完結不可 | 実コードとlocal evidenceは本 wave で完了。staging runtime 実行・baseline commit・cleanup は user 承認後（index §3） |

## 3.4 命名・整合チェック（FB-01 / FB-SDK-07-4）

- 仕様書記載の識別子と実コードの一致を確認済み: `bulk-tag-result` / `bulk-tag-result-counts` / `bulk-tag-result-skipped` / `bulk-tag-result-not-found`（`BulkActionBar.tsx:389-408`）、`一括操作` / `タグ一括付与・解除` / `付与モード`（read-only spec）、status `assigned`/`noop`/`skipped_deleted`/`tag_not_found`（`memberTags.ts:267-272`）。
- 新規ファイル名は既存 authenticated spec / issue-1081 seed・runner の命名規則に整合（Phase 1 §1.5）。

## 3.5 Phase 4 への申し送り

- テスト計画は (a) Playwright spec の 2 test（all-success / partial-failure）、(b) runner shell test（guard/引数/cleanup）、(c) 回帰 unit（`BulkActionBar.spec.tsx`）の 3 系統。
- result 表示待機（mutation 完了同期）の assert を必ず入れる（`toBeVisible` で result 描画を待つ）。
- runner shell test は実 D1 / 実 staging を叩かない（guard 分岐・引数 parse・cleanup 呼び出しの shell レベル検証に限定）。
