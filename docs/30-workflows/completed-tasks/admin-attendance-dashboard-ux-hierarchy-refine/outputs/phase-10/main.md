# Phase 10 — 最終レビュー（AC 最終確認 + MINOR 解決確認）

> ステータス: `completed`。AC-1〜AC-10 の source-level 確認、MINOR M-1/M-2/M-3 の解決、focused vitest / typecheck / lint / token gate は完了。実 capture 8 PNG は `pending_visual_capture`。

---

## 1. AC 最終確認表（AC-1〜AC-10）

各 AC に「確認手段」「blocker 判定基準（これを満たさなければ Phase 13 blocked）」「VISUAL screenshot マッピング（該当時）」を割り当てる。

| AC | 受入条件（要旨） | 確認手段 | blocker 判定基準 | screenshot canonical 名 |
| --- | --- | --- | --- | --- |
| AC-1 | PRIMARY ヒーローが最上部に配置・①出席率特大（`--ubm-text-3xl`）+delta+ユニーク率、②要フォロー数を主役 2 枚で構成 | component spec（hero 描画）+ 視覚証跡 | ヒーロー 2 枚が最上部に描画されない / 特大タイポが `--ubm-text-3xl` でない | `attendance-primary-hero-followup-ok.png` / `attendance-primary-hero-followup-warn.png` |
| AC-2 | 3 層（PRIMARY/TREND/DETAIL）が見出しレベル・余白・サーフェスで視覚区別。h1>h2>h3 | DOM 構造アサーション（heading 階層）+ 視覚証跡 | ゾーン区別が視覚的に成立しない / 見出し階層が論理破綻 | `attendance-dashboard-full.png` |
| AC-3 | DETAIL 3 テーブルが `Segmented` でタブ統合・初期スクロール量削減 | component spec（Segmented 排他表示）+ 視覚証跡 | 3 テーブルが同時縦積みのまま / タブ切替で排他にならない | `attendance-detail-tabs-session.png` / `attendance-detail-tabs-member.png` / `attendance-detail-tabs-top10.png` |
| AC-4 | 要フォローが PRIMARY で強調・件数でトーン切替（0=neutral/success、1+=warning）。`data-attendance-follow` 属性・新規 token なし | component spec（`attendanceFollowLevel` 純関数 + 属性切替）+ 視覚証跡 | 0/1+ でトーンが切り替わらない / `data-attendance-level` と混同 | `attendance-primary-hero-followup-ok.png`（0 件）/ `attendance-primary-hero-followup-warn.png`（1+ 件） |
| AC-5 | 全色 OKLch トークン経由・HEX/`bg-[#xxx]`/`text-[#xxx]` 0 件 | `verify-design-tokens` gate + grep | HEX 直書きが 1 件でも検出 | （token gate・screenshot 非対象） |
| AC-6 | 新規 primitive 追加 0 件 | `components/ui/` diff 確認 | `components/ui/` に新規ファイル追加 | （構造確認・screenshot 非対象） |
| AC-7 | API endpoint / D1 / Form / shared 型の変更 0 件 | `git diff` の `apps/api` / `packages/shared` 件数 | `apps/api` / `packages/shared` の diff が 1 件でも発生 | （構造確認・screenshot 非対象） |
| AC-8 | レスポンシブ維持（mobile 1 カラム → desktop 2 カラム grid） | grid クラス DOM アサーション + 視覚証跡 | mobile で横溢れ / desktop grid が成立しない | `attendance-dashboard-mobile.png` |
| AC-9 | a11y 維持・向上（h1>h2>h3 / aria / focus ring / WCAG AA） | component spec（role/aria）+ コントラスト確認 | 見出し階層破綻 / aria 欠落 / フォーカスリング消失 | （a11y 確認・screenshot 補助） |
| AC-10 | 既存全機能が挙動不変（フィルタ/CSV/drilldown modal/各表/フッター/SafeResult degrade） | 既存 component spec 温存 + 回帰確認 | いずれかの既存機能が回帰 | `attendance-detail-tabs-session.png`（drilldown 起点）等 |

---

## 2. MINOR 解決確認表（M-1 / M-2 / M-3）

Phase 3 で登録された MINOR 3 件の解決状態を確認する。すべて非 blocker だが、未解決のまま Phase 13 へ進ませない。

| MINOR | 内容 | 登録元 | 解決担当 Phase | 解決確認手段 | blocker か | 未解決時の戻り先 |
| --- | --- | --- | --- | --- | --- | --- |
| M-1 | `page.tsx` と `AttendanceAnalyticsPage` の `attendance-analytics-page` className / testid 二重を整理 | Phase 3（D-1） | Phase 5（実装） | testid 一意性の DOM アサーション・className 重複 grep | 非 blocker（機能影響なし・testid 衝突注意） | Phase 5 |
| M-2 | 要フォロー属性名を `data-attendance-follow`（none/warn）に命名分離（issue-1112 の `data-attendance-level` none/normal/high と別意味） | Phase 3 / §10 裏取り | Phase 5（実装） | 属性名 grep（`data-attendance-follow` 存在・`data-attendance-level` 流用なし） | 非 blocker（命名混同回避は設計済） | Phase 5 |
| M-3 | 既存 spec（`KpiPanel.spec.tsx` 等）のレイアウト変更追従・testid 維持 | Phase 3 | Phase 4（テスト追従）/ Phase 6（拡充） | 既存 3 component spec + lib spec 2 本が PASS・testid 維持確認 | 非 blocker（挙動不変） | Phase 4 / Phase 6 |

> M-1/M-2/M-3 はいずれも本ブランチで解消済み。`AttendanceDetailTabs` には SafeResult 部分失敗時のタブ単位 degrade テストも追加済み。

---

## 3. blocker サマリ（Phase 10 時点の判定）

| 区分 | 件数 | 内訳 |
| --- | --- | --- |
| MAJOR blocker | 0 | Phase 3 で MAJOR 0 件確定。本 Phase でも新規 MAJOR なし |
| MINOR（非 blocker） | 0 | M-1 / M-2 / M-3 は解消済み |
| AC 未充足 | 1 | VISUAL screenshot 8 PNG 未取得（source-level AC は PASS） |

総合: **MAJOR 0 件 / source-level Go / visual capture pending**。Phase 13 は commit / PR 承認待ち、かつ screenshot 参照は PNG 取得後に反映する。

---

## 4. Phase 11 への引き継ぎ（AC↔screenshot マッピング）

VISUAL タスクであるため、視覚で確認すべき AC を Phase 11 の screenshot canonical 名へマップ済み（上表「screenshot canonical 名」列）。Phase 11 の `screenshot-plan.json` / `phase11-capture-metadata.json` はこのマッピングと canonical 名を一致させる。
