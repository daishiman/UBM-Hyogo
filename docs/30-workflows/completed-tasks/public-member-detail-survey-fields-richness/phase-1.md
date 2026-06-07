# Phase 1: 要件定義

## 実装区分の判定（CONST_004）

| 項目 | 判定 |
| ---- | ---- |
| 実装区分 | **[実装区分: 実装仕様書]** |
| 根拠 | 「改善する」「全て表示する」という目的の達成には `apps/web` の adapter / React components のコード変更と `apps/api` の seed コード変更が必須。純粋なドキュメント・調査・合意形成では達成不可能。ユーザー依頼文も「改善を行ってください」「表示するという仕様になっていたはずが、それができていない」と動作変更を要求している。 |
| タスク分類 | UI task（VISUAL）。公開画面の見た目・情報構造を変更するため、Phase 11 で視覚証跡を扱う。 |
| implementation_mode | `new`（proto 準拠の新レイアウト実装。現状実装は流用するが表示構造は作り直し） |

---

## 1. 背景・問題

staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members/TEST-MEM-01` で、公開メンバー詳細ページの情報が非常に薄く、プロトタイプ仕様と乖離している。ユーザー報告:

- 各メンバーの詳細ページの情報が非常に薄い
- プロトタイプの仕様と全く異なる
- 「アンケートで答えてもらった情報を全て表示する」仕様が満たされていない

（補足: ページ初期化時の `[Sentry] You cannot use Sentry.init() in a browser extension` ログはブラウザ拡張由来のノイズで、別ワークフロー `sentry-extension-noise-filter-spec` のスコープ。本タスクの対象外。）

### 根本原因（調査結果）

| 層 | 原因 |
| -- | ---- |
| UI（主因） | `apps/web` の adapter (`toMemberDetailProps`) と components が、API の `publicSections` を **section title そのまま + 一律 KV リスト**で描画している。proto が規定する「Hero に hometown / BUSINESS OVERVIEW の skills・canProvide サブ見出し / PERSONAL の KVList / MESSAGE の引用カード」という構造化レイアウトが未実装。 |
| データ（副因） | staging 確認用 `TEST-MEM-01` の seed が `fullName / occupation / ubmZone` の 3 項目のみ。UI を直しても確認データが薄いままだと「全項目表示」を検証できない。 |
| API | **原因ではない**。`GET /public/members/:memberId` は visibility=public の全項目を `publicSections` で返却済み（`apps/api/src/view-models/public/public-member-profile-view.ts` L111-142）。変更不要。 |

---

## 2. スコープ

### In Scope

- **Lane A（apps/web）**: 公開メンバー詳細の adapter とコンポーネント群を proto 準拠の構造化レイアウトに作り直す。
- **Lane B（apps/api）**: `test-accounts` seed を visibility=public 全項目へ拡充し、`TEST-MEM-01` 等が全セクションを埋められるようにする。
- 上記に対応する unit / component / contract テストの追加・更新。

### Out of Scope

| 除外項目 | 理由 |
| -------- | ---- |
| API endpoint の新規追加・レスポンス契約変更 | 既存 `GET /public/members/:memberId` が全項目を返すため不要。不変条件 #1。 |
| D1 schema 変更（migration 追加） | response_fields に全項目が正規化保持されるため不要。不変条件。 |
| Google Form schema 変更 | フォーム項目は固定。不変条件。 |
| member/admin visibility 項目の公開表示 | birthDate / ubmJoinDate / challenges / publicConsent / rulesConsent / responseEmail はプライバシー上 public ページに出さない（proto・schema 準拠）。 |
| Google Form 実回答の本番同期 | 別運用。本タスクは UI 構造と確認用 seed のみ。 |
| Sentry 拡張ノイズ抑止 | 別ワークフロー `sentry-extension-noise-filter-spec`。 |

> **CONST_007 確認**: 先送り（別 PR / バックログ / Phase 2 で対応）は無し。Lane A・Lane B は今回サイクルで完了させる。上記 Out of Scope は「今回作らない理由」が技術的・整合性的に明確（API/DB/Form は変更不要、member/admin 項目は仕様上非公開）であり、先送りではない。

---

## 3. 受入条件（AC）

| AC | 受入条件 | 検証手段 |
| -- | -------- | -------- |
| AC-1 | Hero が 写真(xl)・氏名・nickname・occupation・location に加え、ubmZone / ubmMembershipType / location / **hometown** の chip を表示。空項目は chip 非表示 | ProfileHero component spec / Phase 11 視覚 |
| AC-2 | BUSINESS OVERVIEW が businessOverview 本文（空時 "—"）+ skills + canProvide をサブ見出し付きで表示。skills/canProvide 空時は当該ブロック非表示 | BusinessOverviewSection spec / 視覚 |
| AC-3 | TAGS + SNS/WEB が tags chip 群（空時「タグ未設定」）と url リンク pill 群を表示 | MemberTags/MemberLinks spec / 視覚 |
| AC-4 | PERSONAL が hobbies / recentInterest / motto / otherActivities の KVList を表示 | PersonalSection spec / 視覚 |
| AC-5 | MESSAGE が selfIntroduction を accent-soft 引用カード（serif）で表示。空時セクション非表示 | MessageCard spec / 視覚 |
| AC-6 | 表示順が proto 準拠: 戻る → Hero → [BUSINESS OVERVIEW │ TAGS+SNS] → PERSONAL → MESSAGE → 参加履歴 | MemberDetail spec / 視覚 |
| AC-7 | visibility=public の全項目が漏れず表示。固定セクション未割当の public field（urlOthers / 将来追加項目）は「その他」フォールバックセクションに表示 | adapter spec（other-fallback ケース） |
| AC-8 | member/admin visibility 項目（birthDate / ubmJoinDate / challenges / publicConsent / rulesConsent / responseEmail）が公開ページに出ない | adapter spec（visibility filter ケース） |
| AC-9 | `TEST-MEM-01` seed が visibility=public 全項目の値を持つ。`buildSeedSql` 出力に全 stableKey の response_fields 行が含まれる | build-seed-sql spec |
| AC-10 | API endpoint surface 不変・D1 schema 不変・Form schema 不変。`verify-design-tokens` green（HEX 直書き 0） | grep gate / CI |

---

## 4. 既存コード命名規則の分析（FB-01 / FB-SDK-07-4）

| 対象 | 規則 | 根拠 |
| ---- | ---- | ---- |
| React component ファイル | PascalCase `.tsx`（例 `ProfileHero.tsx` / `MemberDetailSections.tsx`） | `apps/web/src/components/public/` 既存 |
| component data 属性 | `data-component="kebab-case"`（例 `data-component="profile-hero"` / `data-component="member-tags"`） | 既存 components |
| section data 属性 | `data-section="<key>"`、KV row は `data-stable-key` 必須 | `MemberDetailSections.tsx` 不変条件 #1 |
| adapter 関数 | camelCase `toMemberDetailProps` / `normalizeField` / `normalizeSection` | `member-detail.ts` 既存 |
| test ファイル | `*.spec.ts(x)` のみ（`*.test.*` 禁止 / CLAUDE.md 不変条件 #8）。配置は `__tests__/` 配下 | リポジトリ規約 |
| stableKey 参照 | `STABLE_KEY.<name>`（リテラル直書き禁止） | `field.ts` / `lint-stablekey-literal.mjs` |
| CSS クラス | proto 由来 kebab（`card-pad-lg` / `eyebrow` / `h-section` / `chip-row` / `grid-2` / `hero-split` / `accent-soft` / `serif`）。**既に globals.css に存在** | `apps/web/src/styles/globals.css` |

> 新規 component 名は既存パターンに合わせる: `BusinessOverviewSection.tsx` / `PersonalSection.tsx` / `MessageCard.tsx`。data 属性は `data-component="business-overview" / "personal-section" / "member-message"`。

---

## 5. 変更対象 inventory

### Lane A: apps/web

| ファイル | 種別 | 概要 |
| -------- | ---- | ---- |
| `src/lib/adapters/member-detail.ts` | 編集 | `MemberDetailProps` を proto セクション構造へ再設計。stableKey 駆動で hero(hometown) / business / personal / message / links / other に振り分け。visibility=public 二重防御維持 |
| `src/components/public/ProfileHero.tsx` | 編集 | `hometown` prop 追加、eyebrow "MEMBER PROFILE"、Avatar `size="xl"`、chip-row 構成 |
| `src/components/public/MemberDetail.tsx` | 編集 | proto 順の組み立て（grid-2 で business と tags+links を横並び、personal / message / activity を縦） |
| `src/components/public/BusinessOverviewSection.tsx` | 新規 | businessOverview / skills / canProvide |
| `src/components/public/PersonalSection.tsx` | 新規 | hobbies / recentInterest / motto / otherActivities の KVList |
| `src/components/public/MessageCard.tsx` | 新規 | selfIntroduction の accent-soft 引用カード |
| `src/components/public/MemberDetailSections.tsx` | 編集 | 「その他（other）」フォールバックセクション専用 renderer に転用（AC-7） |
| `src/components/public/MemberTags.tsx` / `MemberLinks.tsx` / `MemberActivity.tsx` | 流用（変更最小） | TAGS / SNS / 参加履歴 |
| `src/styles/globals.css` | 条件付き編集 | 不足クラスがある場合のみ OKLch トークンで追加。既存クラス優先 |
| `src/lib/adapters/__tests__/member-detail.spec.ts` | 編集/新規 | セクション再構成・other-fallback・visibility filter |
| `src/components/public/__tests__/*.spec.tsx` | 新規 | 各新規 component の表示・空項目分岐 |

### Lane B: apps/api

| ファイル | 種別 | 概要 |
| -------- | ---- | ---- |
| `src/testing/test-accounts/catalog.ts` | 編集 | `TestMemberAccount` に optional `profile?`（公開 stableKey → 値）を追加。TEST-MEM-01 に全項目、他メンバーに代表値 |
| `src/testing/test-accounts/build-seed-sql.ts` | 編集 | `STABLE_KEYS` 固定配列を撤廃し、member.profile から動的に response_fields 行を生成。`answersFor` を profile ベースへ。後方互換（profile 未指定は従来 3 項目） |
| `src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | 編集/新規 | TEST-MEM-01 の全 stableKey 行生成、後方互換、search_text 確認 |

---

## 6. P50 前提確認チェック

| 確認項目 | 結果 |
| -------- | ---- |
| current branch に実装が存在するか | No（proto 準拠レイアウトは未実装。現状は flat KV 実装） → 通常の実装 Phase |
| upstream にマージ済みか | No（新規タスク） |
| 前提タスク完了済みか | Yes。`serial-06-form-response-binding`（現状の member-detail 配線）/ issue-1029（photoUrl）/ issue-224（tags）/ test-accounts-seed は完了済み。本タスクはその上に proto 準拠化を重ねる |

> upstream 未マージのため通常の RED/GREEN サイクルで実装する（Phase 4 でテスト先行）。

---

## 7. carry-over 確認

直近コミット（`git log --oneline -5`）は admin 出席分析・transport util・globals.css shell 統合等で、本タスクの公開メンバー詳細とは独立。carry-over 競合なし。`globals.css` は他タスクでも編集される頻出ファイルのため、Phase 5 では追加のみ・既存ブロック非破壊で編集する。

---

## 8. メモリ制約 / targeted test（FB-UI-02-2）

全件 `pnpm test` ではなく、変更スコープに対する targeted run を Phase 4/5 で使う:

```bash
# Lane A (web)
pnpm --filter @ubm-hyogo/web exec vitest run src/lib/adapters/__tests__/member-detail.spec.ts \
  src/components/public/__tests__
# Lane B (api) — D1 を使う contract test は --root 指定が要る場合あり
pnpm --filter @ubm-hyogo/api exec vitest run src/testing/test-accounts/__tests__/build-seed-sql.spec.ts
```

> 実際のパッケージ名・vitest 起動コマンドは Phase 4 で `package.json` を確認して確定する。
