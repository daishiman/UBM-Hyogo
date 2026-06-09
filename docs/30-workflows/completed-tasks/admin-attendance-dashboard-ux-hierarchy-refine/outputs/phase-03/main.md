# Phase 3 設計レビュー — main

> 上流: `../phase-02/{main,layout-blueprint,component-map}.md`。レビュー対象 = 3 層 topology / `AttendanceDetailTabs` / 状態所有権 / token 割当。

## 1. PASS / MINOR / MAJOR 判定

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 3 層 topology（PRIMARY/TREND/DETAIL） | PASS | 既存 8 セクションを情報優先順位で 3 層に再配置。表現層に閉じる |
| 新規 primitive ゼロ | PASS | `AttendanceDetailTabs` は feature 層。`Segmented` を内部利用。`components/ui/` 追加なし（AC-6） |
| API/D1/shared 型不変 | PASS | bundle 取得・型を変更しない。タブホスト props は既存 shared 型のみ（AC-7） |
| Segmented internal state | PASS | タブ選択を `useState` に固定（[VSCPKR-03]） |
| ゾーン単位 degrade | PASS | `AdminSectionErrorClient` でゾーン/タブ隔離（AC-10） |
| token 正本 | PASS | layout-blueprint の色/余白が `tokens.css` 実在値のみ（AC-5） |
| route 二重 className 整理（D-1） | MINOR | `page.tsx` と `AttendanceAnalyticsPage` の同名 className / testid 二重を実装時に整理 |
| 要フォロー属性名 `data-attendance-follow` | MINOR | issue-1112 `data-attendance-level`（none/normal/high）と別意味のため命名分離を実装に固定 |
| 既存 spec 追従範囲 | MINOR | `KpiPanel.spec.tsx` 等のレイアウト変更追従（挙動不変・testid 維持確認） |
| 重大 blocker | なし | MAJOR 該当なし |

**総合判定: PASS（MINOR 3 件は許容、Phase 4 へ進む）**

## 2. 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 管理者の「何を判断すべきか分からない」認知コストを 3 層階層 + 焦点で低減。最重要 2 判断（出席率 / 要フォロー）が最上部に到達 |
| 実現性 | PASS | 既存 primitive + token + 6 endpoint で 1 サイクル完了。新規 `AttendanceDetailTabs` 1 件 + globals.css クラスのみ |
| 整合性 | PASS | 表現層に閉じ、filter/タブ/データの状態所有権が分離。AC-7 で API/D1/shared 不変 |
| 運用性 | PASS | `verify-design-tokens` + vitest + playwright visual smoke で回帰保護。degrade で部分障害に強い |

### 因果ループ（補足）

- 強化ループ（価値）: 「3 層階層 → 焦点の明確化 → 判断到達コスト低下 → 管理者の運用効率向上」。
- バランスループ（リスク）: 「DETAIL タブ統合 → 一度に見える情報量低下 → 横断比較しづらい懸念」。→ 緩和: PRIMARY/TREND は常時表示で全体像を保ち、DETAIL のみ段階開示。タブ切替は 1 クリックで横断可能（AC-3）。

## 3. 採用理由

採用案 = **「階層リファイン + Segmented タブ + 2 枚ヒーロー」**。

| 採用要素 | 理由 |
| --- | --- |
| 階層リファイン（全面再構成・最小限調整ではない） | ユーザー確定方針（_shared-context §2）。既存 8 セクションの情報を欠落させず、優先順位で 3 層に再配置することで「情報過多」を解消しつつ機能温存（AC-10） |
| Segmented タブ（アコーディオンではない） | 既存 `Segmented` primitive 再利用（AC-6）。排他 1 表示で初期スクロール削減（AC-3）。`role="radiogroup"` の a11y を既存実装で担保（AC-9） |
| 2 枚ヒーロー（単一 KPI ではない） | ユーザーが最重要として「出席率推移 / 要フォロー / 直近セッション / 参加偏り」の 4 項目を選択。うち出席率と要フォローを hero に昇格し、残り 2 は TREND/補助に配置（AC-1） |

## 4. Phase 4 開始条件 / Phase 13 blocked 条件

| 区分 | 条件 |
| --- | --- |
| Phase 4 開始条件 | (1) 総合判定 PASS（MAJOR 0）。(2) `AttendanceDetailTabs` の internal `useState` 設計確定。(3) AC-1〜AC-10 が test 手段にマップ済み |
| Phase 13 blocked 条件 | commit / PR はユーザー明示承認後のみ。承認なしでは Phase 13 blocked 維持 |

## 5. MINOR 追跡テーブル（Phase 5 / Phase 12 申し送り）

| # | MINOR | 申し送り先 | 対処 |
| --- | --- | --- | --- |
| M-1 | route `page.tsx` と `AttendanceAnalyticsPage` の `attendance-analytics-page` className / `data-testid` 二重 | Phase 5 | 内部 div を 3 層ラッパー名（`attendance-zones` 等）へ変更し、testid 衝突を解消。既存 spec が `attendance-analytics-page` testid に依存していないか grep 確認 |
| M-2 | 要フォロー属性名 `data-attendance-follow`（none/warn）の命名固定 | Phase 5 | `attendanceFollowLevel()` 純粋関数を新設し、issue-1112 `attendanceLevel`（別意味）と混同しないよう命名を実装に固定。CSS セレクタも `data-attendance-follow` に統一 |
| M-3 | 既存 component spec（`KpiPanel` 等）のレイアウト変更追従 | Phase 5 / Phase 6 | hero 化で DOM 構造が変わるため、testid を維持しつつ spec を追従。挙動不変アサーションは保持 |

> M-1〜M-3 はいずれも「機能影響なし」だが、Phase 12 の未タスク検出では「機能に影響なし」を不要判定の理由にしない（MINOR は未タスク化対象として再評価）。本タスク内で Phase 5 にて解消する見込みのため、未解消で残った場合のみ Phase 12 で未タスク化する。

## 6. レビューチェックリスト

- [x] 採用案がデータ層・型に触れず表現層に閉じるか（AC-7）
- [x] `AttendanceDetailTabs` が primitive ではなく feature コンポーネントか（AC-6）
- [x] タブ選択が internal `useState` か（[VSCPKR-03]）
- [x] degrade がゾーン/タブ単位で隔離されているか（AC-10）
- [x] token 割当が `tokens.css` 実在値のみで HEX ゼロか（AC-5）
- [x] レスポンシブが既存 grid utility で成立するか（AC-8）
- [x] 見出し階層が h1>h2>h3 で論理的か（AC-2 / AC-9）
- [x] MAJOR blocker がゼロか
