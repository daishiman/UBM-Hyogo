# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

scope / 受入条件 / inventory / 命名規則 / P50 を固定し、Phase 2 設計の前提を確定する。Issue #1068（admin member drawer の tag inline-create UI）を最新コードへ最適化した状態で実装の gate を定める。

## 実装区分判定（[実装区分: 実装仕様書] の根拠）

- ユーザー指定ラベルに関わらず、目的（drawer から tag を新規作成して member に付与する導線）の達成には **コード変更が必須** である：
  - 新規 React component `MemberTagInlineCreate.tsx`（create フォーム + 状態機械）
  - 既存 `MemberTagsEditor`（`MemberDrawer.tsx`）への配線
  - web API client（`members.ts`）への `createTag` helper / error code 型 / parser 追加
  - focused component test + Playwright visual evidence の追加
- ドキュメント追記のみでは要件を満たせないため **docs-only ではなく実装仕様書** とする。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No（`MemberTagsEditor` に inline-create フォーム / ボタン無し） | 通常の新規実装。`implementation_mode: "new"` |
| upstream（dev）にマージ済み | No | 未マージとして扱う |
| 前提タスク完了済み | Yes 2 件 landed。(1) issue-1035（#1073）= `POST /admin/tags`。(2) issue-982（#982）= `MemberTagsEditor` + `POST /admin/members/:memberId/tags` | いずれも blocker ではなく **利用するだけ**。本タスクは apps/web の UI 配線で完結 |

## タスク分類

- **UI task（VISUAL_ON_EXECUTION）**: `MemberDrawer` の編集 UI に inline-create 導線を追加するため Phase 11 で desktop/mobile screenshot 必須（staging は user-gated）。
- **apps/web 専用**: `apps/api` は既存 endpoint surface のみ利用し変更しない。task-A（web client）/ task-B（drawer 配線）/ task-C（visual + invariant doc）で分離。

## 命名規則（既存コードベース分析）

| 対象 | 規則 | 根拠 |
| --- | --- | --- |
| web API client 関数 | camelCase 動詞始まり（`fetchMemberTags`, `assignMemberTag`, `fetchTagMaster`） | `apps/web/src/features/admin/api/members.ts` |
| web mutation hook | `@/features/admin/hooks/useAdminMutation`（positional: `(endpoint, method, options)`） | CLAUDE.md invariant #10 |
| admin form input | `FormField`（`apps/web/src/components/ui/FormField.tsx`）経由 | CLAUDE.md invariant #9 |
| pill primitive | `TagPill`（`apps/web/src/features/admin/components/_shared/TagPill.tsx`） | issue-982 |
| route パスパラメータ | `:memberId`（`:id` ではない） | `members.ts` で `c.req.param('memberId')` |
| test ファイル | `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止） | CLAUDE.md invariant #8 |
| 子 component | `Member<対象><動詞>` PascalCase（`MemberTagsEditor` → `MemberTagInlineCreate`） | `_members/` 配下慣習 |

## 受入条件（AC）— 最新コードへ最適化済み

- **AC-1**: member drawer の tag 編集 UI（`MemberTagsEditor`）から新規 tag を作成できる。`POST /api/admin/tags { code, label, category }` を `MemberTagInlineCreate` の form から発火する。
- **AC-2**: 作成成功（201）後、作成した tag がその member に付与され（`POST /api/admin/members/:memberId/tags { tagId }`）、drawer の tag pill 表示（`assigned` / `available`）へ反映される。create→attach の連結を実装する。
- **AC-3**: `tag_code_conflict`（409）は既存 tag の選択導線へ回収される。member tags を再取得し、同 code の既存 tag を選択可能にして、重複作成の失敗だけで操作が詰まらないようにする。
- **AC-4**: code/label/category の validation error が drawer 内で読める形で表示される。client 事前 validation（code 空 / regex 不一致 / 長さ超過、label 空 / 長さ超過、category 空 / 長さ超過）+ server 400（`invalid_body` / `invalid_json`）フォールバックの 2 段で field error / 包括 error を表示する。
- **AC-5**: 既存 drawer の tag 付与/解除（issue-982 B-T1〜B-T8）と `/admin/tags` 管理画面に regression を出さない。
- **AC-6**: desktop/mobile drawer で inline-create の操作部品（ボタン / 入力 / 送信 / キャンセル）と tag pill が重ならない。

## inventory（現状コード anchor）

| 系統 | anchor |
| --- | --- |
| 編集対象 view | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（`MemberTagsEditor`、L285-407 付近） |
| 新規 component | `apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx`（本タスクで新設） |
| web API client | `apps/web/src/features/admin/api/members.ts`（`AdminTagRef` / `MemberTagsResult` / `fetchMemberTags` / `assignMemberTag` / `fetchTagMaster`。`createTag` は **未実装** → task-A で追加） |
| mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts`（`(endpoint, method, options)`、`trigger(payload)` を返す。失敗時 `FetchAuthedError`（`.status` / `.bodyText`）） |
| form primitive | `apps/web/src/components/ui/FormField.tsx`（`{ name, label, error?, helper?, required?, className?, children }`） |
| pill primitive | `apps/web/src/features/admin/components/_shared/TagPill.tsx`（`{ children, selected?, onClick?, disabled?, title? }`） |
| tag master write API（利用のみ） | `apps/api/src/routes/admin/tags.ts:21-27,131-155`（`POST /tags`、201 `{ tagId, code, label, category, active }`、400 `invalid_json`/`invalid_body`、409 `tag_code_conflict`） |
| member tag 付与 API（利用のみ） | `apps/api/src/routes/admin/members.ts:731-783`（`POST /members/:memberId/tags { tagId }` → 200 `{ assigned, available }`、404 `tag_not_found`） |
| 新規 component test | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx` |
| 新規 visual spec | `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-inline-create.spec.ts` |

## 検証済み API 契約（Phase 2/4 で参照）

| endpoint | request | success | error | 出典 |
| --- | --- | --- | --- | --- |
| `POST /api/admin/tags` | `{ code, label, category }` | 201 `{ tagId, code, label, category, active }` | 400 `invalid_json` / 400 `invalid_body` / 409 `tag_code_conflict` | `apps/api/src/routes/admin/tags.ts:21-27,131-155` |
| `POST /api/admin/members/:memberId/tags` | `{ tagId }` | 200 `{ assigned, available }`（冪等） | 404 `tag_not_found` | `apps/api/src/routes/admin/members.ts:731-783` |
| `GET /api/admin/members/:memberId/tags` | — | `{ assigned, available }` | — | 同上 |

- エラーレスポンス body は `{ ok:false, error:"<code>" }`（`tags.ts` の `fail(c, code)`）。`FetchAuthedError.bodyText` にこの JSON 文字列が載る。
- バリデーション規則（client 事前 validation の正本）: `code` regex `/^[a-z0-9][a-z0-9_]*$/` かつ 1〜64 文字、`label` 1〜120、`category` 1〜64。

## スコープ確定

含む / 含まないは [index.md](index.md#スコープ) に従う。要点:

- 含む: `MemberTagsEditor` への inline-create 導線、新規 `MemberTagInlineCreate.tsx`（状態機械）、`createTag` helper + error code 型 / parser、create→attach 連結、409 回収 / client validation / 部分成功リトライ、focused test + Playwright visual。
- 含まない: `apps/api` の変更、tag rename / 物理削除、bulk 作成、`/admin/tags` 管理画面 UI 変更、deploy / commit / push / PR（user-gated）。
- **1 PR サイクル完結（CONST_007）**。先送りなし。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず確認し既存設計との整合性を確保する。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | tag / member tag 項目定義 |
| UI/UX 規約 | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | admin drawer 規約 |
| API 契約規約 | `.claude/skills/aiworkflow-requirements/references/api-*.md` | endpoint 契約規約 |
| プロトタイプ | `docs/00-getting-started-manual/claude-design-prototype/` | primitives 正本 |

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 本ファイル（AC / inventory / 命名規則 / P50 / API 契約確定）

## 統合テスト連携

- 実装時は Phase 4 の focused tests（C-T1〜C-T8 / C-A-T1〜C-A-T3）と Phase 11 evidence ledger（desktop/mobile screenshot）に接続する。

## 完了条件

- AC-1〜AC-6 が明示列挙されている
- 命名規則・inventory が最新コードと一致している
- 検証済み API 契約（`POST /admin/tags` / member tag 付与）が Phase 2/4 から参照できる形で確定している
- task-A（web client）への分解が index.md と整合している
- 実装区分判定（[実装区分: 実装仕様書]）の根拠が記載されている
