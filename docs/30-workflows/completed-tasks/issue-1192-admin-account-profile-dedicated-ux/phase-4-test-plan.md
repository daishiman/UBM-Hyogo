---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 4
phase_name: テスト計画
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 4: テスト計画

## メタ情報

| キー | 値 |
|------|----|
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 対象 | `AdminAccessNotice` component spec（新規）+ `page.spec.tsx` への isAdmin 分岐 page-level spec 追加（編集） |
| 新規テスト件数 | **6 件**（T-C1〜T-C3 / T-P1〜T-P3）/ 対象 2 spec ファイル |
| テスト環境 | jsdom（`@testing-library/react` / data 属性・role・accessible name の構造検証） |
| spec ファイル規約 | `*.spec.tsx` のみ（`*.test.*` 禁止・lefthook `block-test-suffix` / CI `verify-test-suffix`） |
| wave 前提 | **implemented_local_evidence_captured（実装・local test 完了。staging/PR は user-gated）**。本書はテスト計画の確定であり、spec の物理作成・実行は実装サイクルで行う |

> `AdminAccessNotice` は **props なし・静的・stateless**（Phase 2 D-1）。テスト入力は render の有無のみで internal state は 0。page-level テストの入力は `/me` / `/me/profile` / `getStats` の mock fixture（external）。

---

## 目的

Phase 1 の AC-1〜AC-9 を機械検証可能なテストへ落とし、テスト 6 件の ID・入力・期待値、AC↔テスト対応表、fixture 設計を確定する。

## 実行タスク

1. テスト戦略（jsdom 一次証跡 / two-tier evidence）を確定する。
2. 新規テスト 6 件（T-C1〜T-C3 / T-P1〜T-P3）の入力・期待値を表で確定する。
3. AC↔テスト対応表を確定する（AC-1〜AC-9 全件にトレース先を引く）。
4. page-level fixture（`buildMeSession` / `buildMeProfileResponse` / stats fixture）と mock 構造を設計する。

---

## 1. テスト戦略（two-tier evidence）

| tier | 証跡 | 位置づけ |
|------|------|---------|
| 一次証跡 | jsdom focused Vitest（本 Phase で計画する 6 件 + 既存 `page.spec.tsx` 全件回帰） | AC-1〜AC-5 / AC-9 の自動検証。実装サイクルの GREEN をもって AC 充足の機械判定とする |
| 二次証跡 | 認証必須の staging/実機 screenshot（管理者アカウントでの `/profile` 表示） | **user-gated pending**（Phase 11 計画）。管理者ログインが必要なため自動取得しない（Phase 3 リスク表の two-tier 方針） |

- jsdom は CSS（`@media` / トークン解決）を適用しないため、検証は **DOM 構造**（`data-testid` / `data-tone` / role / accessible name / href / テキスト）に限定する。視覚トーンの正しさは `SectionCard` 既存 spec（landed 済み）と Phase 11 視覚証跡が担保する。
- AC-6〜AC-8（差分閉域・トークン・api/packages 非接触）はテストではなく Phase 9 検証コマンド（V-1〜V-5 / grep gate）で機械検証する（下記対応表）。

## 2. テストケース表（新規 6 件）

### 2-1. `AdminAccessNotice.component.spec.tsx`（新規・co-located: `apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx`）

| ID | 対象 | 入力（render） | 期待値（assert） |
|----|------|---------------|-----------------|
| T-C1 | component | `<AdminAccessNotice />`（props なし） | 見出し「管理者メニュー」（`SectionCard` title → `h2.ui-section-card__title`）と案内本文「管理者アカウントでログインしています。会員情報の管理・開催と出席の記録・公開状態の確認は管理画面から行えます。」が描画される（`screen.getByText` / 正規表現マッチ） |
| T-C2 | component | `<AdminAccessNotice />` | `screen.getByRole("link", { name: "管理画面を開く" })` が存在し、`getAttribute("href")` が `"/admin"`（`ButtonLink` variant="secondary" / size="md" → `data-variant="secondary"`） |
| T-C3 | component | `<AdminAccessNotice />` | root が `[data-testid="profile-admin-access-notice"]` のカード（`data-component="section-card"` / `data-tone="accent"` / `aria-label="管理者向けのご案内"`）として描画され、**member データ風文字列を含まない**: `container.textContent` が `m_1` 等の memberId 値パターン（`/m_\d/`）と `@`（email アットマーク）のいずれも含まない（不変条件 #11 guard・AC-5） |

> T-C3 の否定 assertion は「props なし静的コンポーネントが member データを描画しようがない」ことの回帰 guard。将来 props を生やす変更が入った際に RED で検出する（Phase 9 gate-(d) と二重防衛）。

### 2-2. `page.spec.tsx`（編集: `apps/web/app/(member)/profile/page.spec.tsx`）

新 describe **`ProfilePage admin access notice (issue-1192)`** を末尾に追加する。**既存 describe（`ProfilePage safe fetch degrade` / shell 統合回帰 guard）には触れない**（AC-4 の回帰スイートとしてそのまま維持）。

| ID | 対象 | 入力（mock fixture） | 期待値（assert） |
|----|------|---------------------|-----------------|
| T-P1 | page 成功パス × isAdmin=true | `fetchAuthed`: 1 回目 `buildMeSession(true)` resolved / 2 回目 `buildMeProfileResponse()` resolved。`getStats`: stats fixture resolved | `render(await ProfilePage())` で `screen.getByTestId("profile-admin-access-notice")` が present。カード内 `getByRole("link", { name: "管理画面を開く" })` の `href` が `"/admin"`。`redirect` / `notFound` 不呼出 |
| T-P2 | page 成功パス × isAdmin=false | T-P1 と同一 fixture で `buildMeSession(false)` のみ差し替え | `screen.queryByTestId("profile-admin-access-notice")` が **null**。`[data-testid="profile-authenticated-root"]` は present（member 成功描画は不変・AC-3/R-2） |
| T-P3 | degrade 分岐 × isAdmin=true | `fetchAuthed`: 1 回目 `buildMeSession(true)` resolved / 2 回目 `new FetchAuthedError(503, "down")` rejected | profile fetch 失敗 degrade 描画（`getByRole("alert")` に「プロフィールを読み込めませんでした」）で `queryByTestId("profile-admin-access-notice")` が **null**（エラー状態では notice を描画しない・AC-4 の degrade 側新規 guard） |

> 呼び出し順の根拠（`page.tsx` 実装・Read 済み）: `fetchAuthed` は `/me`（1 回目）→ `/me/profile`（2 回目）の順で呼ばれ、`getStats` は別 module（`@/lib/api/public`）のため `fetchAuthed` の mock 回数に影響しない（`page.tsx:43-92`）。

## 3. AC↔テスト対応表（必須トレース）

| AC | 内容（要約） | トレース先 |
|----|-------------|-----------|
| AC-1 | isAdmin=true で notice カード表示 | **T-P1** |
| AC-2 | `/admin` 導線リンク（accessible name「管理画面を開く」・href） | **T-C2** |
| AC-3 | isAdmin=false で notice 非描画 | **T-P2** |
| AC-4 | degrade 分岐の表示不変 | **T-P3 + 既存 `page.spec.tsx` 全件回帰**（404/410/5xx/transport/401 redirect の既存テストを 1 件も修正せず GREEN 維持） |
| AC-5 | props なし・member データ非描画（不変条件 #11） | **T-C3**（+ Phase 9 gate-(d)） |
| AC-6 | web 側新規認証ロジックなし | **Phase 9 検証コマンド**（gate-(a) grep + diff レビュー） |
| AC-7 | トークン正本・HEX 直書きなし | **Phase 9 検証コマンド**（V-4 `verify:tokens` + gate-(b)） |
| AC-8 | apps/api / packages 差分ゼロ | **Phase 9 検証コマンド**（V-5 `git diff --name-only -- apps/api packages`） |
| AC-9 | typecheck / lint / focused Vitest 全 PASS | **Phase 9 検証コマンド**（V-1〜V-3） |

## 4. fixture 設計（page.spec.tsx 内ヘルパー）

`page.spec.tsx` にヘルパー 3 つを定義する（新 describe の直前・module scope）。**typecheck が通る最小 fixture** とし、構造は実型（Read 済み）に従う。

### 4-1. `buildMeSession(isAdmin: boolean): MeSessionResponse`

`MeSessionResponse`（`apps/web/src/lib/api/me-types.ts:22-25`）。`MeSessionUser` の `memberId` / `responseId` は **plain string**（branded 不要・`me-types.ts:14-20`）。既存テストの inline fixture（`memberId: "m_1"` / `responseId: "r_1"` / `email: "member@example.com"` / `authGateState: "active"`）と同形で `isAdmin` のみ引数化する。

### 4-2. `buildMeProfileResponse(): MeProfileResponse`

`MeProfileResponse`（`me-types.ts:54-62`）。`profile` は shared の `MemberProfile`（`packages/shared/src/types/viewmodel/index.ts:55-76`）で **branded 型**（`MemberId` / `ResponseId`）を要求するため、`@ubm-hyogo/shared` の `asMemberId` / `asResponseId` で cast する（root re-export 済み・既存 admin spec 群に使用実績あり）。最小値:

| キー | 最小 fixture 値 |
|------|----------------|
| `profile.memberId` / `profile.responseId` | `asMemberId("m_1")` / `asResponseId("r_1")` |
| `profile.responseEmail` | `null` |
| `profile.publicConsent` / `rulesConsent` | `"consented"`（`ConsentStatus`） |
| `profile.publishState` | `"public"`（`PublishState`） |
| `profile.isDeleted` | `false` |
| `profile.summary` | `fullName: "テスト 太郎"` 他は `""` / `null`（`MemberProfileSummary` 全キー必須） |
| `profile.sections` / `attendance` / `tags` | **すべて `[]`**（`attendanceMeta` は optional のため省略可） |
| `profile.lastSubmittedAt` | ISO 文字列固定値 |
| `profile.editResponseUrl` | `null` |
| `statusSummary` | `{ publicConsent: "consented", rulesConsent: "consented", publishState: "public", isDeleted: false }`（`isDeleted` は literal `false` 型） |
| `editResponseUrl` | `null` |
| `fallbackResponderUrl` | 任意の URL 文字列 |
| `pendingRequests` | `{}`（visibility / delete とも optional） |

### 4-3. stats fixture（`getStats` の resolved 値）

`getStats` は `vi.mock("@/lib/api/public", () => ({ getStats: vi.fn() }))` で mock する（既存 `vi.mock("@/lib/fetch/authed")` の factory パターン・`page.spec.tsx:48-52` に整合）。resolved 値は `PublicStatsView`（`apps/web/src/lib/api/public.ts:20` の z.infer 型）を満たす最小 fixture: `memberCount` / `publicMemberCount` / `meetingCountThisYear` 数値、`zoneBreakdown` / `membershipBreakdown` / `recentMeetings` は `[]`、`lastSync` は 4 キー（`schemaSync: "ok"` / `responseSync: "ok"` / `schemaSyncFinishedAt: null` / `responseSyncFinishedAt` ISO 文字列）、`generatedAt` ISO 文字列。

### 4-4. mock 拡張（成功パス描画の前提・実装時確認事項）

| 項目 | 内容 |
|------|------|
| `next/navigation` mock への `useRouter` 追加 | 成功パス描画では `PhotoUpload.client.tsx`（`useRouter` を render 時に呼ぶ・`PhotoUpload.client.tsx:11,67`）等の client 子コンポーネントが mount される。既存 mock factory（`page.spec.tsx:37-46`）は `notFound` / `redirect` のみのため、**`useRouter: () => ({ refresh: vi.fn() })` を factory に追加**する。既存 degrade テストは成功パスに到達せず `useRouter` を呼ばないため、export 追加は既存テストへ非干渉（additive） |
| `@/lib/api/public` mock の既存テスト影響 | 既存 degrade テストでは `getStats` の結果（`statsResult`）は成功パス以外で未使用（`page.tsx:154-161` のみ）。mock 化により実 fetch が走らなくなるだけで判定に影響しない |
| 空 fixture での子コンポーネント例外なし | `sections: []` / `attendance: []` / `pendingRequests: {}` で `ProfileFields` / `VisibilitySummary` / `AttendanceList` / `RequestActionPanel` / `PhotoUpload` が throw しないことを**実装時に T-P1 の GREEN で確認**する（`pickProfileSummary` は空 sections で `""` を返す防御実装・Read 済み）。throw する場合は fixture を最小限だけ拡充する（テスト期待値は変えない） |

## 5. リスク

| リスク | 影響 | 対策 |
|--------|------|------|
| fixture 型不整合（`MemberProfile` branded / `isDeleted: false` literal） | typecheck fail | **V-1 `pnpm typecheck` で検出**される設計（fixture はヘルパー関数に戻り型注釈を付け、`as any` を使わない）。branded は `asMemberId` / `asResponseId` で解決 |
| `SectionCard` の `data-testid` 透過不成立 | T-C3 / T-P1 selector 不成立 | **解消済み**: `SectionCard.tsx:23,31,53-57`（Read 済み）が `"data-testid"` / `"aria-label"` を props 型に持ち `...rest` で透過する。Phase 2 D-1 の fallback（accessible name query へ寄せる）は不要 |
| 成功パス mount で client 子コンポーネントが jsdom 例外 | T-P1/T-P2 が AC と無関係に RED | §4-4 の `useRouter` mock 追加 + 空 fixture 確認を実装手順（Phase 6）に組み込み済み |
| 既存テストの誤改変 | AC-4 回帰崩れ | 新 describe 追加 + module-top mock の additive 拡張のみ。既存 describe / 既存 assertion は diff 対象外（Phase 6 非干渉方針） |

---

## 6. 実行コマンド（focused Vitest・検証コマンド正本）

```
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/(member)/profile/page.spec.tsx apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api packages
```

> focused Vitest は `/profile` 配下の全 spec（新規 `AdminAccessNotice.component.spec.tsx` + 編集後 `page.spec.tsx` + 既存 `_components` spec 群）を拾う。local local 実装サイクルで実行済み済み。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| 要件 | `phase-1-requirements.md` | AC-1〜AC-9 の定義・検証方法正本 |
| 設計 | `phase-2-design.md` §D-1〜D-3 | DOM 契約（testid / accessible name / 文言）の selector 正本 |
| 既存 spec | `apps/web/app/(member)/profile/page.spec.tsx` | mock 構造（`vi.hoisted` / `vi.mock("@/lib/fetch/authed")` factory / `FetchAuthedError`）の正本 |
| 型契約 | `apps/web/src/lib/api/me-types.ts` / `packages/shared/src/types/viewmodel/index.ts` | fixture の型整合元 |
| stats 型 | `apps/web/src/lib/api/public.ts`（`PublicStatsView` / `getStats`） | stats fixture の型整合元 |
| branded helper | `packages/shared/src/branded/index.ts`（`asMemberId` / `asResponseId`） | branded cast の正本 |
| QA 連携 | `phase-9-qa.md` | AC-6〜AC-9 の検証コマンド / grep gate（本表のトレース先） |

## 成果物

- `phase-4-test-plan.md`（テスト戦略 / テスト 6 件の表 / AC↔テスト対応表 / fixture 設計 / リスク）

## 統合テスト連携

本タスクは apps/web 表現層への極小追加であり、統合観点の検証は focused Vitest（`/profile` 配下・新規 6 件 + 既存回帰）と Phase 11 の視覚証跡計画（two-tier）で行う。apps/api との統合 contract は変更しない（AC-8・Phase 9 V-5 で機械保証）。本 Phase のテスト計画は Phase 6 のテスト実装例コードへ連結する（AC trace: Phase 1 → 4 → 6 → 9/10 → 11）。

## 完了条件

- [x] テスト 6 件（T-C1〜T-C3 / T-P1〜T-P3）の ID・対象・入力・期待値が表で確定している。
- [x] AC↔テスト対応表が AC-1〜AC-9 全件にトレース先を持つ（AC-6〜AC-9 は Phase 9 検証コマンドへ委譲）。
- [x] fixture 設計（`buildMeSession` / `buildMeProfileResponse` / stats fixture / mock 拡張）が実型 Read に基づき確定している。
- [x] リスク（fixture 型不整合は typecheck で検出・useRouter mock 等）が対策付きで列挙されている。
