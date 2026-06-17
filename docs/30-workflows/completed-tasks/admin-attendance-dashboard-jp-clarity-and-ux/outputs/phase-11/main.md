# Phase 11 VISUAL 総括 — 文言日本語化の視覚証跡

> visualScope=`VISUAL` / status=`captured_local_fixture`（`phase11-capture-metadata.json`）。apps/web 実装・ローカル検証は完了済み。6 canonical screenshot capture は admin 認証 gate 配下・Playwright staging 専用のためlocal fixture で取得済みで、staging 認証済み admin baseline は user-gated。

---

## 1. VISUAL 宣言

- 対象 route: `/admin/dashboard/attendance`（admin gate 通過必須）。
- 改修内容: 英語表記（PRIMARY/TREND/DETAIL/TOP10/ADMIN/CSV 等）とエンジニア専門語（セッション/トレンド/ユニーク/区画/帯/pt）を平易な日本語へ統一 + 要フォロー行・長い文言の軽微な見やすさ調整。
- UI 表示文言・aria-label 値・軽微レイアウトが変わるため **VISUAL**。screenshot は必須。
- local Playwright admin fixture で 6 canonical PNG を取得済み。staging deploy + admin 認証後の baseline capture は **user-gated**。

## 2. 3 層評価観点

| 層 | 観点 | 判定根拠（実 capture / 機械検証） |
| --- | --- | --- |
| Semantic | h1>h2>h3 階層が日本語見出しで維持・Segmented タブの role/aria キー不変・SafeResult degrade 維持 | focused vitest（構造アサーション）/ typecheck / lint |
| Visual | 日本語見出し・補助文が読みやすく配置・長い文言がはみ出さない・要フォロー行のリズム・OKLch トークンのみ（HEX 0） | 6 canonical PNG（local fixture）+ `verify-design-tokens` |
| AI UX | 非エンジニアが一目で「全体状況」「対応要否」「詳細導線」を日本語で把握・英語/専門語に詰まらない | 認証済み runtime screenshot での最終目視（user-gated） |

## 3. capture 対象 6 canonical 名（screenshot-plan.json / phase11-capture-metadata.json と一致）

| # | canonical 名 | tc | viewport | 検証 AC |
| --- | --- | --- | --- | --- |
| ① | `attendance-dashboard-full-jp.png` | TC-V-01 | desktop | AC-1 / AC-2 / AC-3 / AC-4 |
| ② | `attendance-overview-zone-jp.png` | TC-V-02 | desktop | AC-1 / AC-2 / AC-3 |
| ③ | `attendance-trend-zone-jp.png` | TC-V-03 | desktop | AC-1 / AC-3 |
| ④ | `attendance-detail-tabs-jp.png` | TC-V-04 | desktop | AC-1 / AC-2 |
| ⑤ | `attendance-filter-bar-jp.png` | TC-V-05 | desktop | AC-1 / AC-3 |
| ⑥ | `attendance-dashboard-mobile-jp.png` | TC-V-06 | mobile | AC-4 |

> 6 canonical 名は作成済み 2 json と `screenshot-coverage.md` で完全一致済み。

## 4. user-gated capture 境界

| 操作 | 区分 |
| --- | --- |
| local admin fixture screenshot capture（6 枚） | completed |
| staging deploy | user-gated |
| admin role bearer mint | user-gated |
| staging admin 画面の baseline screenshot capture（6 枚） | user-gated |

## 5. 現在の確定事項

- VISUAL タスクであり、6 canonical 名が `screenshot-plan.json` / `phase11-capture-metadata.json` で一致固定済み。
- 実装・focused vitest・typecheck・lint・token gate は **本サイクルで実行済み**。
- 6 canonical PNG capture は local Playwright admin fixture で **取得済み（present）**。
- staging deploy / admin bearer mint / staging baseline capture は **user-gated**。
