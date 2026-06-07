# Phase 10: 最終レビュー — issue-1103 globals.css 重複 shell ブロック 1 本化

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 受入条件（AC）判定

本タスクは `implementation_mode: new` の local implementation 完了段階である。各 AC は **`implemented_local_evidence_captured`** として判定する。commit / push / PR / staging screenshot のみ user-gated として残す。

| AC | 内容 | 判定 | 根拠 |
| --- | --- | --- | --- |
| AC-1 | `grep -n 'data-shell="sidebar"'` が 2 件（削除前 3 件） | PASS | 削除後は 1708（parallel-01）+ 2174（admin 派生）= 2 件。 |
| AC-2 | `parallel-01 P1-1〜P1-5` 全体の 1 本化 | PASS | `parallel-01 P1-1 page surface` は 1642 行の 1 出現のみ。 |
| AC-3 | 削除前 byte 一致 + cascade 文脈同一の証明 | PASS | 両ブロックとも同一 `@layer components` 直下・@media 非内包で cascade 文脈完全同一。 |
| AC-4 | 削除のみ（残存ブロック値は無変更） | PASS | diff は `apps/web/src/styles/globals.css | 132 deletions(-)` に閉じる。 |
| AC-5 | shell 描画値（100dvh / border / 背景 / typography スケール）不変 | PASS | byte 一致削除のため cascade 上書きゼロ。 |
| AC-6 | HEX 直書き増なし・token 経由維持・token gate 緑 | PASS | `verify:tokens` exit 0（91 tracked in sync）+ `tokens.runtime.spec.ts` 9 tests PASS。 |
| AC-7 | `pnpm --filter @ubm-hyogo/web build` 成功・視覚不変 | PASS | web build exit 0。Sentry/Prisma instrumentation warning は既存 upstream warning。 |

## 2. blocker 判定

**なし（no blocker）。** MAJOR 指摘ゼロ。重複ブロックは byte 完全一致で cascade 文脈も同一のため削除安全、残存ブロック・admin 派生・token・cookie 契約はいずれも無変更。単一ファイル・単一サイクル（CONST_007）で完結する。

## 3. NON_VISUAL 妥当性の最終確認

UI/UX の視覚的変更はゼロ。byte 完全一致ブロックの削除は cascade 上書きを生まないため、sidebar / shell surface / typography の見た目・挙動は不変。よって本タスクは NON_VISUAL であり、スクリーンショット証跡は不要（代替証跡は Phase 11 manual-test-result.md の grep + diff + build + token gate を参照）。

## 4. MINOR 指摘候補（§10.5 相当・Phase 12 未タスク検出の入力）

以下は MINOR 候補として列挙する。**未タスク化すべきかの最終結論は Phase 12（unassigned-task-detection）に委譲**し整合させる。

| ID | 候補 | 既定方針 | Phase 12 への申し送り |
| --- | --- | --- | --- |
| MINOR-1 | parallel-01 ブロックの重複再発を防ぐ専用 CI guard（globals.css 内の同一 CSS ブロック byte 重複検出）の導入 | **本 PR scope 外・未タスク化候補**。CSS ブロック重複の機械検出は実装コストに対し機械的価値が低く、現状は `grep -c 'parallel-01 P1-1'` の手動確認（Phase 9 Q-3）で足りる。 | Phase 12 で「未タスク化候補」として扱うか判断。未タスク化する場合も priority:low / scale:small。 |
| MINOR-2 | 他の `@layer` 内に類似の byte 重複ブロックが無いか | **無し（既定）**。本タスクの対象は `parallel-01 P1-1〜P1-5` の重複に限定。 | Phase 12 で globals.css 全体に他の同種重複が無いことを grep で確認し、追加スコープ不要を確定。 |

> MINOR-1 は「重複再発防止 CI guard は本 PR scope 外・未タスク化候補 / 機械的価値は低く現状 grep 手動確認で足りる」と結論する。MINOR-2 は対象外で確定。

## 5. ゲート判定

**APPROVED（commit・push・PR は user-gated）。** AC-1〜AC-7 は local evidence で PASS。NON_VISUAL の代替証跡方針（削除前 byte 一致 diff + grep カウント + build + token gate）を Phase 11 で記録し、Phase 13（PR 計画・user-gated）へ進む。
