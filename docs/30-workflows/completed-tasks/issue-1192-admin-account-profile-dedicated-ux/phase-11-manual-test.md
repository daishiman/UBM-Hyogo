---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 11
phase_name: 手動テスト
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 11: 手動テスト / 視覚証跡（VISUAL）

## メタ情報

| キー | 値 |
|------|----|
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| タスク種別 | **VISUAL**（`/profile` 認証成功描画に管理者案内カードが新規表示される） |
| workflow_state | `implemented_local_evidence_captured`（自動テスト・typecheck・lint は実行済み。screenshot は user-gated / 未取得） |
| 視覚証跡格納先 | `outputs/phase-11/screenshots/`（PNG 実体は staging 認証確認の user-gated 項目として未取得） |
| staging 取得 | **user-gated**（`/profile` は認証必須ルート。Claude Code は staging 認証ログインして screenshot を取得しない） |

> **VISUAL 宣言**: 本タスクは `me.user.isAdmin === true` のとき `/profile` に `AdminAccessNotice`（SectionCard tone=accent + ButtonLink）が新規描画される視覚差分を伴う。視覚証跡の取得計画を必須とする VISUAL カテゴリとして扱う。

---

## 目的

two-tier evidence（一次 = jsdom focused Vitest + typecheck/lint、二次 = 認証必須 staging runtime screenshot = user-gated）の境界を設計し、ローカル静的 UI contract screenshot の取得計画と手動確認手順を「コマンド/前提/期待結果/実結果(pending)」形式で定義する。

## two-tier evidence 設計

### tier1（一次証跡）— 実装サイクルで取得

| ID | 証跡 | 内容 | 取得方法 | 状態 |
|----|------|------|---------|------|
| E1-1 | focused Vitest 6 件 | T-C1（見出し+本文描画）/ T-C2（リンク href=/admin・name「管理画面を開く」）/ T-C3（testid + member データ非含有 = 不変条件 #11）/ T-P1（isAdmin=true 成功パスで notice present）/ T-P2（isAdmin=false で query null）/ T-P3（`/me/profile` 失敗 degrade では isAdmin=true でも notice なし） | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/(member)/profile/page.spec.tsx apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` | PASS（local evidence） |
| E1-2 | typecheck / lint | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` 全 exit 0 | Phase 9 V-1 / V-2 | PASS（local evidence） |
| E1-3 | ローカル静的 UI contract screenshot | `AdminAccessNotice` 単体 + `/profile` 内配置の視覚契約（認証 mock / fixture 描画）。Playwright Chromium で取得可能（staging 認証不要） | `outputs/phase-11/screenshot-plan.json` の 3 枚計画 | optional / not captured（必須 gate は component/page tests で代替） |

### tier2（二次証跡・user-gated）— ユーザー明示承認後のみ

| ID | 証跡 | 内容 | user-gated 理由 | 状態 |
|----|------|------|----------------|------|
| E2-1 | staging `/profile` 管理者アカウント runtime screenshot | staging 実機で管理者アカウントログイン後の `/profile` に管理者メニューカードが表示される実描画 | `/profile` は認証必須ルート（PR #1209 全ルート認証必須化）であり、Claude Code は staging 認証ログインを行わない | **user-gated pending** |
| E2-2 | staging `/admin` 遷移確認 | 「管理画面を開く」クリックで `/admin` に遷移する実機確認 | 同上（認証必須） | **user-gated pending** |

> **境界の根拠**: jsdom（tier1）は DOM 構造・accessible name・条件描画の有無を検証できるが、`var(--ubm-*)` 解決後の実描画色・SectionCard accent tone の見え方・実フォントは検証できない。視覚的な「効き」はローカル静的 screenshot（E1-3）で近似し、認証込みの実環境最終確認は staging runtime（E2-1/E2-2）で行う二段構えとする（Phase 3 リスク表の対策を踏襲）。

## screenshot 計画

### ビューポート

| 名称 | サイズ | 用途 |
|------|--------|------|
| desktop | 1280x800 | 主レイアウト（カード幅・ProfileHeader 直後の配置確認） |
| mobile | 375x812 | カード縦積み・ButtonLink の折返し確認 |

### canonical screenshot 名（計 3 枚・全て pending）

| # | variant | viewport | ファイル名 | 確認内容 |
|---|---------|----------|-----------|---------|
| 1 | 管理者（isAdmin=true） | desktop (1280x800) | `profile-admin-desktop.png` | ProfileHeader 直後に管理者メニューカード（accent tone）+「管理画面を開く」ボタンが表示される |
| 2 | 管理者（isAdmin=true） | mobile (375x812) | `profile-admin-mobile.png` | カードがはみ出しなく縦積みされ、ボタンがタップ可能なサイズで表示される |
| 3 | 非管理者（isAdmin=false） | desktop (1280x800) | `profile-member-desktop.png` | 管理者メニューカードが存在せず、従来の `/profile` と同一描画（AC-3 の視覚裏付け） |

- 取得前提: 認証必須ルートのため、ローカル取得は Playwright の storageState（管理者/非管理者 session fixture）または fixture 描画を用いる。詳細は `outputs/phase-11/screenshot-plan.json` の `memo` field 参照。
- implemented_local_evidence_captured 段階: `outputs/phase-11/screenshots/` は `.gitkeep` のみ。**PNG は 1 枚も作成しない**（staging 認証 screenshot は user-gated）。

## 手動確認手順（コマンド / 前提 / 期待結果 / 実結果）

### MT-1: 管理者アカウントで `/profile` を開く → 管理者メニューカード表示

| 項目 | 内容 |
|------|------|
| コマンド | ブラウザで `/profile` を開く（ローカル: dev サーバ起動後 `http://localhost:3000/profile` / staging: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile`） |
| 前提 | `admin_users` 登録済みの管理者アカウント（member identity 保有・分岐 (b) の構造的前提）でログイン済み |
| 期待結果 | ProfileHeader 直後に「管理者メニュー」カード（accent tone・`data-testid="profile-admin-access-notice"`）が表示され、本文「管理者アカウントでログインしています。…」と「管理画面を開く」ボタンが見える。member プロフィール本体（写真以下）は従来通り表示される |
| 実結果 | **PASS（local Vitest T-P1 + component tests） / staging は user-gated** |

### MT-2: 「管理画面を開く」で `/admin` へ遷移

| 項目 | 内容 |
|------|------|
| コマンド | MT-1 の画面で「管理画面を開く」ボタンをクリック |
| 前提 | MT-1 完了（管理者ログイン済み・カード表示済み） |
| 期待結果 | `/admin`（管理ダッシュボード）へ遷移する（`href="/admin"` のリンク遷移。新規タブではなく同一タブ） |
| 実結果 | **PASS（component test で href=/admin を検証） / staging は user-gated** |

### MT-3: 非管理者アカウントで `/profile` を開く → カード非表示

| 項目 | 内容 |
|------|------|
| コマンド | ブラウザで `/profile` を開く |
| 前提 | `admin_users` 非登録の通常会員アカウントでログイン済み |
| 期待結果 | 管理者メニューカードが**表示されない**。`/profile` の描画は本変更前と同一（R-2 / AC-3） |
| 実結果 | **PASS（local Vitest T-P2） / staging は user-gated** |

### MT-4: degrade 分岐で notice が出ないこと（補助確認）

| 項目 | 内容 |
|------|------|
| コマンド | `/me/profile` が失敗する状態（fixture / mock）で `/profile` を描画 |
| 前提 | T-P3 の jsdom テストが一次証跡。手動確認は fixture 環境での補助確認 |
| 期待結果 | エラー degrade 表示となり、isAdmin=true でも管理者メニューカードは描画されない（エラー状態では isAdmin の信頼できる値が無い・AC-4 不変） |
| 実結果 | **PASS（local Vitest T-P3）** |

## jsdom で確認できない観点と screenshot の境界

| 観点 | jsdom（tier1 Vitest）で確認可能か | screenshot で確認 |
|------|----------------------------------|------------------|
| DOM 構造・`data-testid` / accessible name / `href` | ✅（T-C1〜T-P3 で検証） | 補助 |
| 条件描画の有無（isAdmin true/false/degrade） | ✅ | 補助（variant 1 vs 3 の比較） |
| SectionCard accent tone の実描画色（`var(--ubm-*)` 解決後） | ✕ | ✅ E1-3 静的 screenshot |
| mobile での折返し・ボタンサイズ | ✕（jsdom は @media 非適用） | ✅ `profile-admin-mobile.png` |
| 認証込みの実環境動作（session → isAdmin 解決 → 描画） | ✕（mock 前提） | ✅ E2-1 staging runtime（user-gated） |

---

## 実行タスク（実装サイクルで実施済み / user-gated 項目のみ残存）

1. tier1: focused/local Vitest + typecheck/lint を実行し GREEN を確認済み（Phase 9 V-1〜V-3 と共通）。
2. tier1: UI contract は component/page tests を必須 gate とし、Playwright Chromium screenshot 3 枚は任意補助証跡として未取得。
3. MT-1〜MT-4 は local Vitest の DOM / href / 条件描画検証で代替済み。
4. tier2: staging 管理者アカウント runtime screenshot（E2-1/E2-2）は**ユーザー明示承認後のみ**取得する（user-gated）。

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| 要件 | `phase-1-requirements.md` | AC-1..AC-9・R-1..R-3（MT の期待結果正本） |
| 設計 | `phase-2-design.md` | DOM 契約（testid / accessible name / 文言）・配置 |
| two-tier 先例 | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md` | user-gated pending / 二段証跡の書式正本 |
| screenshot 計画 | `outputs/phase-11/screenshot-plan.json` | 3 枚計画・storageState 前提 |
| capture 台帳 | `outputs/phase-11/phase11-capture-metadata.json` | captured/planned/status の正本 |

## 成果物

- `phase-11-manual-test.md`（本ファイル: two-tier evidence 設計 / screenshot 計画 / MT-1..MT-4）
- `outputs/phase-11/manual-test-result.md`（計画 inventory・implemented_local_evidence_captured 段階）
- `outputs/phase-11/screenshot-plan.json`
- `outputs/phase-11/phase11-capture-metadata.json`
- `outputs/phase-11/screenshots/`（implemented_local_evidence_captured 段階は `.gitkeep` のみ）

## 統合テスト連携

本タスクは apps/web 表現層への極小追加であり、統合観点の検証は tier1（focused Vitest 6 件 + 既存回帰）と本 Phase の視覚証跡計画で行う。apps/api との統合 contract は変更しない（AC-8）。tier1 の結果は Phase 12 の実装ガイド・compliance へ、tier2 の user-gated 項目は Phase 13 PR 本文の pending 明記へ連結する。

## 完了条件

- [ ] two-tier evidence 設計（tier1 = jsdom focused Vitest 6 件 + typecheck/lint / tier2 = staging 認証 runtime screenshot = user-gated pending）が宣言されている（本書・済）。
- [ ] screenshot 計画（3 枚・canonical 名・ビューポート・認証前提）が定義されている（本書 + screenshot-plan.json・済）。
- [ ] MT-1〜MT-4 が「コマンド/前提/期待結果/実結果(pending)」形式で定義されている（本書・済）。
- [ ] implemented_local_evidence_captured 段階では screenshot は全て **pending**（`screenshots/.gitkeep` のみ・PNG 実体 0）であることが明記されている（本書・済）。
- [ ] （実装サイクル）tier1 証跡が取得され、manual-test-result.md / capture-metadata の実結果・status が更新されている。tier2 は user-gated のまま pending 可。
