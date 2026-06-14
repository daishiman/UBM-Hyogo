# 共有コンテキスト — admin-requests-approval-publish-state-diff

> このファイルは SubAgent 全員が最初に読む共有正本。調査結果・方針・受入条件・実装区分を集約する。
> 仕様書本文（phase-NN.md / outputs/phase-N/*.md）はここを根拠に書く。

---

## 0. 実装区分

`[実装区分: 実装仕様書]` — コード変更を伴う（VISUAL タスク・デフォルト）。

判定根拠: 本タスクの目的は `/admin/requests`（会員からの申請キュー）の承認操作 UI に「変更前 → 変更後」の公開状態 diff を**新規に視覚表示する**こと。目的達成には `apps/web` 表現層（`RequestQueueDetail.tsx` ほか）のコード変更と CSS（globals.css）、純粋関数 helper の追加が必須であり、ドキュメントだけでは UI 上の diff 表示は実現できない。よって CONST_004 に従い実装仕様書とする。GitHub Issue #1188 のラベルは `type:improvement`（docs 指定ではない）であり実態と一致する。

---

## 0.1 Issue #1188 現行コード再検証（このタスクの起点）

> Issue #1188 は「別タスクで既に解決済みかもしれない」というユーザー疑義を受け、本サイクル冒頭で現行コード（branch `feat/admin-requests-approval-publish-state-diff` = `origin/dev` HEAD と同一）を実 Read で再検証した。結論: **未解決・有効**。Issue 記載の行番号も現行とほぼ一致し陳腐化していない。

| 検証項目 | 結果（現行コード） | 結論 |
| --- | --- | --- |
| `RequestQueueDetail.tsx:57-58` | `公開状態: {publishState}, 削除済: {isDeleted ? "はい" : "いいえ"}` を**現在値のみ**列挙 | before→after diff **未実装** |
| `RequestQueueDetail.tsx:70-73` | `申請内容` として `summarizePayload`（`desiredState: hidden` 等）を**別の dd** にテキスト表示 | 現在値と目標値が分離・diff 強調なし |
| `RequestConfirmDialog.tsx:92-94` | `isDestructive && destructiveMessage` の汎用 `<p role="alert">` のみ | 具体遷移（`public → hidden`）の提示なし |
| `RequestQueuePanel.tsx:143-148` | `destructiveMessage` は「退会…論理削除…」or「公開状態を申請内容に応じて変更します。会員へ即時反映されます。」の**汎用文言** | 何から何へ変わるかを提示しない |
| 他コンポーネントでの解決 | `grep -rn "変更前\|変更後\|→.*変更" apps/web/src/components/admin/` = **0 件** | 別タスクでも未解決 |
| diff 入力 3 値の availability | `memberSummary.publishState` / `memberSummary.isDeleted`（`RequestQueuePanel.tsx:28-33`）+ `requestedPayload.desiredState`（`unknown`）が**既にクライアント側 type に存在** | **API 変更不要** |

判定: **Issue #1188 は実行が必要**。本タスク仕様書を作成する。

> Issue 状態の注記: 本サイクル冒頭の確認時点では OPEN だったが、作業中に CLOSED 化された（`closedAt=2026-06-11T07:50:39Z`）。ユーザー指示「クローズドのままタスク仕様書を作成」に従い、Issue は**触らず CLOSED のまま据え置く**（再 open しない）。コードは未解決という事実は上表の通り変わらないため、本仕様書は有効。commit / PR / Issue 操作は全て user-gated。

---

## 1. 真の論点（要件レビュー思考法の一次結論）

| 観点 | 結論 |
| --- | --- |
| **真の主問題** | 機能・データ正確性の問題ではない。承認確認時に「**何から何へ変わるか（before→after）が 1 つの遷移として視覚的に結びついていない**」ため、管理者は詳細パネルの現在値（`公開状態`）と申請内容（`desiredState`）を目で照合する必要があり、確認コスト増・誤承認リスクがある。 |
| **依存関係・責務境界** | diff の入力（現在値 `publishState`/`isDeleted`・目標値 `desiredState`）は GET `/admin/requests` の projection で**既に返っており不足なし**。問題は **UI 表現層（`apps/web/src/components/admin/`）のみ**。`apps/api`（projection / `inferDesiredPublishState` / `resolveRequestAtomic`）は無罪。 |
| **価値とコストの不均衡** | 現状は現在値と目標値が別々の dd に並ぶだけで、認知負荷が高い。改善価値は「承認すると公開状態が `公開 → 非公開` のように変わると一目で分かる」こと。優先度は低（post-MVP の磨き込み）だが小規模で完結する。 |
| **改善優先順位** | ① `RequestQueueDetail` に `変更前 → 変更後` diff 行を新設（主役）→ ② `visibility_request` と `delete_request` の意味軸分岐 → ③ 承認確認ダイアログへの diff サマリ反映（`destructiveMessage` 生成箇所で文言を具体化）。 |
| **4 条件** | 価値性◯（承認時の視認性・誤承認リスク低減が定義済み）/ 実現性◯（既存 token + primitive + 既存 API response で 1 サイクル完了可能）/ 整合性◯（責務は web 表現層に閉じ invariant 違反なし・`apps/api` diff 0）/ 運用性◯（focused vitest + verify-design-tokens で回帰保護可能）。 |

---

## 2. 確定方針

- **アプローチ**: 表現層 diff 強調リファイン。`RequestQueueDetail.tsx` の dl に `変更前 → 変更後` の遷移を 1 箇所へ再構成し、矢印 + トーン差で強調する。既存の現在値・目標値 dd は diff 行へ統合（または diff 行を追加し冗長表示を解消）。
- **note_type 別の意味軸分岐**（最重要設計判断）:
  - `visibility_request`: **公開状態の遷移**。`publishState`（変更前）→ `desiredState`（変更後）を日本語ラベル（`公開` / `会員限定` / `非公開`）に変換して `公開 → 非公開` のように表示。
  - `delete_request`: **レコード状態の遷移**（`desiredState` を持たない・`payload: {}`）。公開状態 diff ではなく「在籍 → 退会（論理削除）」として別表現にし、`公開状態が変わる` という誤解を防ぐ。
- **承認確認ダイアログ**: `RequestConfirmDialog` には最小 props しか渡っていない。diff サマリは①詳細パネル（`RequestQueueDetail`）を主役とし必須実装、②ダイアログ側は `RequestQueuePanel.tsx:143-148` の `destructiveMessage` 生成箇所で具体遷移文言（`公開 → 非公開 に変更します`）を組み立てる方式を採る（props 追加せず文言生成で完結 = 既存テスト破壊リスク最小）。
- **色トークン**: 既存トークンで賄う方針を**第一候補**とする。before=中立（`--ubm-color-text-secondary`）/ after=accent（`--ubm-color-accent` / `--ubm-color-accent-ink`）/ 退会=danger or warn。新規トークン追加は原則回避（追加が不可避な場合のみ `tokens.css` + `design-tokens.md` 両正本同時更新）。

### diff 表現の DOM 設計（確定）

```
詳細パネル dl 内:
  <dt>公開状態の変更</dt>           ← visibility_request
  <dd>
    <span data-diff-side="before">公開</span>
    <span aria-hidden="true"> → </span>
    <span data-diff-side="after">非公開</span>
  </dd>

  <dt>レコード状態の変更</dt>        ← delete_request
  <dd>
    <span data-diff-side="before">在籍</span>
    <span aria-hidden="true"> → </span>
    <span data-diff-side="after">退会（論理削除）</span>
  </dd>
```

- screen reader 向けに `変更前 公開、変更後 非公開` が連続読み上げされるよう、矢印は `aria-hidden="true"`、各 span はテキストで意味を担保（視覚の `→` は装飾）。
- 強調は `[data-diff-side="before|after"]` の attribute セレクタに閉じ込め、共有 primitive（`ui-badge` / `card`）本体の既定スタイルは変更しない。

---

## 3. 対象コードベース（現状実装の事実）

リポジトリルート: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260611-161523-wt-15/`
branch: `feat/admin-requests-approval-publish-state-diff`（`origin/dev` HEAD = `596ee399c` と同一基点）

### 3.1 表現層コンポーネント（全て `apps/web/src/components/admin/`）

| コンポーネント | ファイル | 役割 | 改修方針 |
| --- | --- | --- | --- |
| `RequestQueueDetail` | `RequestQueueDetail.tsx`（96 行） | 申請詳細パネル（dl で会員/種別/申請内容を列挙） | **主役**: `変更前 → 変更後` diff 行を新設。`NOTE_TYPE_LABEL`（7-10 行）/ `summarizePayload`（12-20 行）を diff 構築用に拡張 |
| `RequestConfirmDialog` | `RequestConfirmDialog.tsx`（125 行） | 二段階確認ダイアログ（HTML5 `<dialog>`） | `destructiveMessage`（92-94 行表示）を具体遷移文言に。props は追加しない方針 |
| `RequestQueuePanel` | `RequestQueuePanel.tsx`（240 行） | 申請一覧 + 詳細 + ダイアログ統括 | `destructiveMessage`（143-148 行）生成箇所で diff 文言を組み立て。`RequestQueueItem` type（20-34 行）は既存 props 範囲で完結 |

### 3.2 データ契約（変更しない・`apps/api`）

- `apps/api/src/routes/admin/requests.ts`:
  - `projectListItem`（162-183 行）が `memberSummary.publishState`（178 行・fallback `"unknown"`）/ `isDeleted`（179 行）を返す。
  - `AdminRequestListItemZ.memberSummary`（55-60 行）は `.strict()`（拡張すると schema 違反）。`publishState: z.string().min(1)` / `isDeleted: z.boolean()`。
  - `member_status` を bulk SELECT（275-295 行）して before 値を供給。
  - `PUBLISH_STATES = ["public", "hidden", "member_only"]`（191 行）。`inferDesiredPublishState`（194-205 行）が `desiredState` をこの enum で検証。
- **使ってよい 3 値に限定**: `memberSummary.publishState` / `memberSummary.isDeleted` / `requestedPayload.desiredState`。これ以上のフィールドを欲しがらない（projection 拡張 = invariant 違反）。

### 3.3 publishState / desiredState の値域（実コード裏取り）

| 値 | 日本語ラベル（本タスクで導入） |
| --- | --- |
| `public` | 公開 |
| `member_only` | 会員限定 |
| `hidden` | 非公開 |
| `unknown`（fallback） | 不明 |

> 現状、Request 系コンポーネントに publishState → 日本語ラベルの変換は**存在しない**（`RequestQueueDetail.tsx:57` は生値 `publishState` をそのまま表示）。本タスクで表示層に純粋関数 helper を追加する（下記 §4）。

### 3.4 テストアカウント catalog（申請 fixture・VISUAL 検証用）

`apps/api/src/testing/test-accounts/catalog.ts`:
- `TEST-NOTE-V01`（134-137 行）: `visibility_request` / `payload: { desiredState: "hidden" }`
- `TEST-NOTE-V02`（141-144 行）: `visibility_request` / `payload: { desiredState: "public" }`
- `TEST-NOTE-D01`（148-150 行）: `delete_request`

### 3.5 既存テスト（追従・追加対象）

| ファイル | 行数 | 役割 |
| --- | --- | --- |
| `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | 137 | 詳細パネルの描画。diff 行 assertion を追加 |
| `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` | 194 | ダイアログ。diff サマリ文言 assertion を追加（ダイアログに出す場合） |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | 141 | パネル統合。`destructiveMessage` 具体化 assertion を追加 |

---

## 4. 新規追加する表現層 surface（feature ローカル・公開 surface 非昇格）

| surface | 配置 | 役割 |
| --- | --- | --- |
| `formatPublishStateLabel(state: string): string` 純粋関数 | `RequestQueueDetail.tsx` 内 or 同階層 helper | `public/member_only/hidden/unknown` → 日本語ラベル。未知値は「不明」へ fail-soft（throw しない） |
| `buildPublishStateDiff(item): { kind, before, after } \| null` 純粋関数 | `RequestQueueDetail.tsx` 内 | note_type で意味軸分岐。`visibility_request` は公開状態遷移、`delete_request` は在籍→退会、対象外は `null` |
| `[data-diff-side="before"]` / `[data-diff-side="after"]` CSS | `apps/web/src/styles/globals.css` | before=中立トーン / after=accent トーン。既存トークンのみ |

> これらは `apps/web` の admin 機能ローカルであり、`apps/api` / `packages/shared` / design token 正本 / primitive catalog のいずれにも公開 surface を昇格させない（Phase 12 Step 2 = N/A の根拠）。

---

## 5. デザイントークン要点（`tokens.css` 正本・新規追加回避方針）

- before（中立）: `var(--ubm-color-text-secondary)`
- after（強調）: `var(--ubm-color-accent)` / 文字は `var(--ubm-color-accent-ink)`
- 退会（destructive 文脈）: `var(--ubm-color-warn)` / `var(--ubm-color-warn-soft)`（または danger 系）
- 矢印・区切り: `var(--ubm-color-text-muted)`
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate）。色は全て `var(--ubm-color-*)` 経由。
- 既存トークンで diff の before/after を区別できるため、**新規トークン追加は原則不要**。

---

## 6. 受入条件（AC）— 仕様の核

- **AC-1**: `visibility_request` の承認導線で、現在の公開状態（`memberSummary.publishState`）と申請された目標状態（`requestedPayload.desiredState`）が `変更前 → 変更後`（例 `公開 → 非公開`）の遷移として 1 箇所に強調表示される。
- **AC-2**: `delete_request` の承認導線では、公開状態 diff ではなく「在籍 → 退会（論理削除）」というレコード状態の遷移として表現され、`visibility_request` の公開状態 diff と意味が混同されない。
- **AC-3**: publishState の生値（`public`/`member_only`/`hidden`/`unknown`）が日本語ラベル（公開/会員限定/非公開/不明）に変換され、生の英語値が画面に露出しない（`formatPublishStateLabel` 経由）。
- **AC-4**: diff の強調色はすべて `tokens.css` の OKLch トークン経由（`var(--ubm-color-*)`）であり、`docs/00-getting-started-manual/specs/design-tokens.md` と整合する。新規トークンを追加する場合は両正本に反映する。
- **AC-5**: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が対象ファイルに 0 件で、CI gate `verify-design-tokens` が PASS。
- **AC-6**: 新規 primitive を増やさず、既存 primitive の variant（modifier class / `data-diff-side` 属性）で構成する（invariant ui-prototype #3）。
- **AC-7**: 新 endpoint 追加・D1 schema 変更・既存 GET `/admin/requests` projection 拡張を行わず、表示層のみで完結する。`git diff --name-only -- apps/api packages/shared` が空（不変条件 #5・ui-prototype #1）。
- **AC-8**: 承認確認ダイアログ（`RequestConfirmDialog` via `RequestQueuePanel` の `destructiveMessage`）が、`visibility_request` 承認時に具体遷移（`公開 → 非公開 に変更します`）を提示し、`delete_request` 承認時は既存の退会・論理削除文言を維持する。
- **AC-9**: アクセシビリティ — diff の矢印は `aria-hidden="true"`、before/after の意味はテキストで担保され、screen reader が「変更前 公開、変更後 非公開」相当を連続読み上げできる。既存 `aria-label="申請詳細"` 等は不変。
- **AC-10**: 既存 `RequestQueueDetail.spec.tsx` / `RequestConfirmDialog.spec.tsx` / `RequestQueuePanel.component.spec.tsx` が green を維持し、diff 表示の新規 assertion（note_type 別）が PASS。表示テキスト・ルート `/admin/requests`・API パス・既存 data-* / テストセレクタの不変方針を踏襲（新規 data 属性は既存命名規則に沿う）。

### スコープ外（今サイクルでは扱わない・CONST_007 例外ではない）

- 承認時の publish_state 遷移ロジック（`apps/api/src/routes/admin/requests.ts` の `inferDesiredPublishState` / `resolveRequestAtomic`）の変更。
- 新 endpoint 追加・D1 schema 変更・GET `/admin/requests` projection 拡張（`memberSummary` 以外のフィールド追加）。
- `apps/web` からの D1 直接アクセス（不変条件 #5 を継続）。
- `/admin/requests` 以外の画面・他 diff 表現への波及。
- API / Google Form 仕様の変更。

> 上記はいずれも本タスクの目的（承認時 before→after 可視化）に不要であり、CONST_007 の「先送り」ではなく「本質的に別責務」。今サイクルの全 AC（AC-1〜AC-10）は単一 PR の 1 実装サイクルで完了できるスコープに収まっている（分割なし）。

---

## 7. 制約・不変条件

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | admin gate proxy 経由のまま。D1 binding 不使用。AC-7 で保証 |
| ui-prototype #1 | 既存 API のみ接続・新 endpoint/D1/Form 変更禁止 | AC-7 で保証（projection 不拡張・3 値限定） |
| ui-prototype #2 | OKLch トークン正本化・HEX 禁止 | AC-4 / AC-5 で保証（`verify-design-tokens` gate） |
| ui-prototype #3 | プロトタイプ primitives 正本・新規 primitive 禁止 | AC-6 で保証（`data-diff-side` 属性 + 既存 primitive） |
| #9 | admin form input は FormField 経由 | 本タスクはフォーム input を増やさない（ダイアログの textarea は既存のまま） |

---

## 8. テスト方針（Phase 4/6/7 で詳細化）

- vitest 実行は repo ルートが root のため `apps/web/src/...` フルパス指定 + `--root=. --config=vitest.config.ts` で行う（メモリ既知の罠: focused vitest は `--root=.. --config=vitest.config.ts apps/web/...` 形式必須・package.json test script 準拠）。
- 追加テスト観点:
  - `visibility_request` で `公開 → 非公開`（V01: public→hidden）/ `→ 公開`（V02: hidden→public）の before/after span が描画される。
  - `delete_request`（D01）で「在籍 → 退会（論理削除）」が描画され、公開状態 diff 文言が出ない。
  - `formatPublishStateLabel` が `public/member_only/hidden/unknown` を正しい日本語ラベルへ写像し、未知値で「不明」へ fail-soft する。
  - `destructiveMessage` が `visibility_request` で具体遷移文言、`delete_request` で既存退会文言を返す。
  - 矢印 span に `aria-hidden="true"` が付く（a11y）。
- 回帰保護: `verify-design-tokens`（HEX 0 件）。
- VISUAL evidence（staging 承認済み admin capture）は user-gated（Gate-C）。

## 9. ローカル検証コマンド（Phase 5/9/11 で使用）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# focused vitest（repo ルート基準・3 spec 限定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx
# design token gate（HEX 直書き検出）
grep -rnE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" \
  apps/web/src/components/admin/RequestQueueDetail.tsx \
  apps/web/src/components/admin/RequestConfirmDialog.tsx \
  apps/web/src/components/admin/RequestQueuePanel.tsx && echo "FAIL" || echo "PASS"
# apps/api 非変更確認
git diff --name-only -- apps/api packages/shared   # 空であること
```

> パッケージ名は `@ubm-hyogo/web`（`apps/web/package.json` で実確認済み）。

---

## 10. メタ情報（artifacts.json 用）

- task_name: `admin-requests-approval-publish-state-diff`
- task_path: `docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff`
- taskType: `implementation` / docs_only: `false` / VISUAL: `true`
- workflow_state: `implemented_local_runtime_pending`（ローカル実装・focused test・typecheck・lint・token gate は完了。commit・PR・staging capture は user-gated）
- implementation_mode: `new`
- scope: `web_presentation_layer`
- owner: `web`
- domain: `admin-requests`
- related_issue: `1188`（OPEN のまま据え置き）
- ui_routes: `/admin/requests`
- endpoints（参照のみ・変更なし）: `GET /admin/requests` / `POST /admin/requests/:noteId/resolve`
- endpoints_changed: なし
- d1_tables: なし（変更なし）
- secrets_introduced: なし
- invariants_touched: 5（ui-prototype #1/#2/#3 含む）

### Phase 1-3 設計時の実コード裏取り確定（後続 Phase は必ずこちらを正とする）

| 項目 | 確定事実 | 備考 |
| --- | --- | --- |
| diff 入力 3 値 | `memberSummary.publishState` / `memberSummary.isDeleted` / `requestedPayload.desiredState` のみ | projection 拡張禁止。3 値で完結（API 変更不要） |
| publishState 値域 | `public` / `hidden` / `member_only` / `unknown`(fallback) | `requests.ts:191` PUBLISH_STATES + projectListItem fallback |
| 既存日本語ラベル | publishState → 日本語変換は**未存在** | 本タスクで `formatPublishStateLabel` を新設 |
| ダイアログ props | `RequestConfirmDialog` は `kind/isDestructive/destructiveMessage` の最小 props | diff は `destructiveMessage` 文言生成で対応・props 追加しない（既存テスト破壊回避） |
| 既存テスト 3 本 | `RequestQueueDetail`(137) / `RequestConfirmDialog`(194) / `RequestQueuePanel.component`(141) | 追従 + note_type 別 diff assertion 追加 |
| 新規 primitive | 0 件（`data-diff-side` 属性 + globals.css のみ） | AC-6 充足 |
| 新規トークン | 原則 0 件（既存 accent/text-secondary/warn で賄う） | 追加時のみ tokens.css + design-tokens.md 両正本同期 |
