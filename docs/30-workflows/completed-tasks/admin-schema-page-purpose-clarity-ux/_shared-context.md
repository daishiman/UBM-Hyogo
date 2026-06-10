# _shared-context.md — admin-schema-page-purpose-clarity-ux SSOT

> 全 Phase 仕様書 / 全 SubAgent はこのファイルを単一の正本(SSOT)として参照する。
> 事実・決定・ファイル参照・UX 設計はここを唯一の根拠とし、各 Phase はここから逸脱しない。

## 0. メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-schema-page-purpose-clarity-ux` |
| taskId | `TASK-ADMIN-SCHEMA-PAGE-PURPOSE-CLARITY-UX-001` |
| branch | `feat/admin-schema-page-purpose-clarity-ux`（dev tip 基準） |
| relatedIssue | null（staging 観察起点） |
| 実装区分 | **実装完了**（docs-only ではない。apps/web 表現層を同サイクル実装済み） |
| visualEvidence | VISUAL |
| implementation_mode | `new`（`implemented_local_evidence_captured`。staging visual / commit / PR は user-gated） |
| 起点 | staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/schema` のユーザー観察 |

## 1. ユーザーの主訴（原文要約）

`/admin/schema`（「スキーマ差分のレビュー」）ページについて:
- 「いまいち何をするページなのかよくわかっていない」
- 「スキーマ、割り当てて履歴を確認して **何をするのか**」
- 「これの **この先に何ができるのか**、どういうためにやるのか」
- 「これをすることによって **どういう結果が得られるのか**」
- 上記が **直感的にわかる UI/UX** にしてほしい

→ 機能不全の訴えではなく、**目的・流れ・成果が伝わらない情報設計の問題**。

## 2. 真因（裏取り済み・apps/web 表現層のみ）

このページは機能的には完成している（diff 取得・stableKey 割り当て・bulk resolve・rollback・recompute・履歴すべて実装済み）。問題は **表現層（コピー・情報設計・用語）** に閉じる。

| # | 真因 | 根拠（ファイル:行） |
| --- | --- | --- |
| RC-1 | ページの目的・流れ・成果を説明する導線が無い | `apps/web/app/(admin)/admin/schema/page.tsx:139-153`（AdminPageHeader の description が「Googleフォームの設問変更を照合し、stableKey の割り当てと履歴確認を行います。」の1文のみ。流れ・成果の説明なし） |
| RC-2 | 専門用語（stableKey / resolve / revision / diff / alias）が説明なしで露出 | `page.tsx:66`（hint "stableKey 未割当"）、`page.tsx:111-113`（"ALIAS HISTORY" / "紐付け履歴"）、`page.tsx:35`（"CURRENT REVISION"）、`SchemaDiffPanel.tsx`（stableKey/suggestedStableKey ラベル） |
| RC-3 | 各統計・ステータスが「何を意味し、次に何をすべきか」を示さない | `page.tsx:58-79`（SchemaDiffStatsGrid。数値と短い hint のみ） |
| RC-4 | 割り当て操作の「結果（下流で何が起きるか）」が示されない | `SchemaDiffPanel.tsx` の割り当てフォーム（割り当てた後に会員データへ反映される／5分以内取消可 等の説明が無い） |
| RC-5 | 差分0件時に「これが良い状態」と分かる説明が無い | empty/zero 状態のコピー不足 |

**不変条件**: 既存 API endpoint surface のみ利用。新規 endpoint 追加・D1 schema 変更・Google Form 仕様変更・`useAdminMutation` 本体改変は禁止。色は OKLch トークン正本（HEX 直書き / `bg-[#xxx]` 禁止）。`process.env.*` 直接参照禁止（env は `getEnv()` 系経由）。test ファイルは `*.spec.{ts,tsx}` のみ。新規プリミティブを生やさず既存 `apps/web/src/components/ui/` を構成して使う。

## 3. このページの正しいドメイン理解（説明 UI のコピー根拠）

Google Form の設問変更（追加・文言変更・削除）を検知 → DB の安定列名（stableKey）へ人手で対応づけ → 会員回答データを正規化して反映、という運用。

```
Google Form 設問変更
  ↓ sync-schema（Google Forms API）
schema_diff_queue に差分を enqueue（added / changed / removed / unresolved）
  ↓ 管理画面 /admin/schema で人がレビュー
「割り当て」= POST /admin/schema/aliases（questionId ↔ stableKey を対応づけ）
  ↓ schema_aliases に記録 + response_fields を backfill（会員回答を stableKey で再インデックス）
会員の回答が一覧 /members・詳細 /members/[id]・マイページ /profile に正しく表示される
  ↓（任意）rollback = 対応づけ取消（5分以内 undo 可）/ recompute = 再集計
```

- **stableKey（やさしい言い換え: 「項目キー＝会員データの保存先カラム名」）**: フォーム設問が変わっても DB 側で不変の列名。
- **resolve / 割り当て（言い換え:「対応づけ」）**: 設問(questionId)を項目キー(stableKey)へ結びつけ、`schema_diff_queue.status` を queued→resolved に遷移させる操作。
- **revision（言い換え:「フォーム版数」）**: 取り込んだフォームスキーマのバージョン。
- **diff types**: added=新規設問 / changed=文言や型の変更 / removed=削除された設問 / unresolved=未対応（対応づけ待ち）。
- **alias history（言い換え:「対応づけ履歴」）**: 誰がいつどの設問をどの項目キーへ対応づけたかの記録。

## 4. ユーザー確定の UX 方針（AskUserQuestion 2026-06-09）

| 設問 | 確定 |
| --- | --- |
| 説明 UI の厚み | **流れ図＋用語の言い換え＋結果プレビュー**（常時表示の目的説明バナー＋3ステップ流れ図＋やさしい言い換え＋割り当て時のアウトカム表示。1サイクルで完結する厚み） |
| 用語の扱い | **やさしい日本語を主・技術名を併記**（見出し/ラベルは平易な日本語を主表記、stableKey 等の技術名は mono 表記やツールチップで補助併記） |
| バナー挙動 | **常時表示**（差分0件でも「なぜ0が良い状態か」を含め常に表示。装飾を抑えたコンパクトカードで圧迫感を回避） |

## 5. 実装設計（3レーン・関心の分離・全レーン 1 サイクル完結）

### Lane A — 目的説明・オンボーディング層（新規説明コンポーネント＋用語言い換え）

- **新規** `apps/web/src/components/admin/SchemaPurposeExplainer.tsx`: 常時表示の目的説明カード。サーバーコンポーネントで可（状態・API 不要の純表示）。構成:
  1. 見出し「このページでできること」
  2. リード文（フォーム設問が変わったとき会員データの保存先へ正しく結びつける）
  3. 3ステップ流れ図（①変更を検知 → ②項目を対応づけ → ③会員データへ反映）
  4. 結果プレビュー（会員の回答が一覧/詳細/マイページに正しく表示される）
  5. やさしい用語集（項目キー＝保存先カラム / 対応づけ＝resolve / フォーム版数＝revision）
  - 既存 `.ui-card` プリミティブ＋新規 CSS クラス（Lane C で定義）で構成。新規プリミティブは作らない。
- **新規** `apps/web/src/components/admin/schemaGlossary.ts`: 用語の言い換え・説明・diff type メタを保持する純データ/純関数モジュール（テスト容易な単一責務層）。
  - 例: `SCHEMA_GLOSSARY`（term, plainLabel, technicalName, description）、`describeDiffType(type)`、`describeStat(key)`。
- **編集** `page.tsx`: `<SchemaPurposeExplainer />` を AdminPageHeader 直下に常時描画。header description を流れ・成果が伝わる文へ更新。

### Lane B — 操作の意味・結果プレビュー層（SchemaDiffPanel）

- **編集** `apps/web/src/components/admin/SchemaDiffPanel.tsx`:
  - 各 diff type グループ見出しに「このカテゴリは何か・どう対処するか」の1行説明（`schemaGlossary.describeDiffType` を利用）。
  - 割り当てフォーム展開時に「この設問を対応づけると何が起きるか」のアウトカム説明（会員回答が項目キーに紐づき一覧/詳細/マイページへ反映される／対応づけ後にバックフィルが走る／5分以内なら取消可）。
  - ステータス（queued/resolved/backfill 状態）の平易ラベル併記。
  - 差分0件 empty state コピー「差分はありません。フォームとデータベースが一致した良い状態です」。
  - **既存 onClick/handler/フォーム送信ロジック・API 呼び出しは一切変更しない**（表示文言と補助説明の追加のみ）。

### Lane C — 統計・履歴の文脈化層（page.tsx の Grid/History ＋ CSS）

- **編集** `page.tsx`:
  - `SchemaDiffStatsGrid` の各 `AdminStat` の label/hint を平易化＋次アクション示唆（`schemaGlossary.describeStat`）。例 Unresolved hint「stableKey 未割当」→「未対応（対応づけ待ち。クリックで対応づけ）」。
  - `CurrentRevisionCard` に「フォームの現在の版数」の補足。
  - `RevisionAndAliasHistory` の見出し平易化（"ALIAS HISTORY / 紐付け履歴" → "対応づけ履歴" 主表記＋技術名併記）＋「誰がいつ何を対応づけたかの記録」説明。
- **編集** `apps/web/src/styles/globals.css`: 新規クラス `.schema-purpose-card` / `.schema-flow-steps` / `.schema-flow-step` / `.schema-flow-arrow` / `.schema-glossary` を **OKLch トークンのみ**で追加（`--ubm-space-*` / `--ubm-color-*` / `--ubm-radius-*` を使用、HEX 禁止）。

### レーン間の境界

- `schemaGlossary.ts` は Lane A が新規作成し SSOT 化、Lane B/C は import して使う（重複定義しない）。
- `page.tsx` は Lane A（上部 explainer + header）と Lane C（Grid/History）が触る → セクション単位で非競合。実装時は同一 wave で統合。
- `globals.css` は Lane C が一括管理。

## 6. 変更対象ファイル一覧（CONST_005）

| パス | 種別 | レーン |
| --- | --- | --- |
| `apps/web/src/components/admin/SchemaPurposeExplainer.tsx` | 新規 | A |
| `apps/web/src/components/admin/schemaGlossary.ts` | 新規 | A |
| `apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx` | 新規(test) | A |
| `apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts` | 新規(test) | A |
| `apps/web/app/(admin)/admin/schema/page.tsx` | 編集 | A,C |
| `apps/web/app/(admin)/admin/schema/page.spec.tsx` | 編集(test) | A,C |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | B |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 編集(test) | B |
| `apps/web/src/styles/globals.css` | 編集 | C |

> `apps/api/**` / `apps/api/migrations/**` / `packages/shared/**`（schema 系）/ Google Form 定義は **変更しない**（AC で git diff 空を検証）。

## 7. 検証コマンド（ローカル）

```bash
# focused vitest（repo root から --root=. 指定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx \
  apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/schema/page.spec.tsx"
# 型・lint・デザイントークン
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
# API 非接触の確認
git diff --stat -- apps/api packages/shared | tee /dev/stderr | wc -l  # 0 を期待
# Playwright 視覚（staging・bearer・user-gated）
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-page-purpose-clarity-ux/outputs/phase-11 \
  mise exec -- pnpm --dir apps/web exec playwright test <admin-schema visual spec> --project=desktop-chromium --reporter=line
```

## 8. DoD（Definition of Done）

1. `pnpm --filter @ubm-hyogo/web typecheck` 成功
2. `pnpm lint` clean
3. `pnpm --filter @ubm-hyogo/web verify-design-tokens` 成功（新規 HEX 0）
4. focused vitest 全 GREEN（新規/更新テスト含む）
5. `SchemaPurposeExplainer` がページ上部に常時描画され、3ステップ流れ図・結果プレビュー・用語集を表示
6. `page.tsx` の header description・統計ラベル/hint・履歴見出しが「やさしい日本語主・技術名併記」へ更新
7. `SchemaDiffPanel` が各カテゴリ説明・割り当てアウトカム・平易ステータス・0件 empty state コピーを表示し、**既存の操作ロジック/API は不変**
8. `git diff --stat -- apps/api packages/shared` が空（API/D1/Form 非接触）
9. （user-gated）staging Playwright 視覚ベースライン取得

### 2026-06-09 実装結果

- apps/web 表現層を実装済み: `SchemaPurposeExplainer.tsx` / `schemaGlossary.ts` / `page.tsx` / `SchemaDiffPanel.tsx` / `globals.css`。
- tests 実装済み: `schemaGlossary.spec.ts` / `SchemaPurposeExplainer.component.spec.tsx` / `SchemaDiffPanel.component.spec.tsx` / `page.spec.tsx`。
- PASS: focused Vitest 4 files / 34 tests、`@ubm-hyogo/web typecheck`、repo `pnpm lint`、`@ubm-hyogo/web verify-design-tokens`、`git diff --stat -- apps/api packages/shared` diff 0。
- local runtime screenshot captured: desktop `admin-schema-purpose-clarity-runtime.png` and mobile `admin-schema-purpose-clarity-mobile-runtime.png` under `outputs/phase-11/screenshots/`.

## 9. CI ゲート（正本 = `bash scripts/verify-pr-ready.sh` 3点）

1. `verify:phase12-compliance` → `ok`（9見出し逐語 + Phase 11 evidence 表）
2. `gate-metadata:validate` → ERROR 0（artifacts.json `metadata.gates` zod 準拠）
3. `indexes:rebuild` drift 0

> `validate-phase-output.js` / `verify-all-specs.js` は非 CI 助言（land 済テンプレでも fail する）。CI 判定は上記3点のみ。

## 10. スコープ外（未タスク候補・今サイクルでは作らない）

- ガイド付きフルウィザード再設計（AskUser で「流れ図＋結果プレビュー」を選択。OOS。今サイクル不要・破綻リスクのため別検討）。
- API/D1 側のメタ情報追加（不変条件で禁止）。

> CONST_007: 上記3レーンはすべて今サイクルで完了するスコープ。先送り前提の分割はしない。
