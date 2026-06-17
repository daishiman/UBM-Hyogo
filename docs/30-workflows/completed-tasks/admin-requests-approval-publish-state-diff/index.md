# admin-requests-approval-publish-state-diff — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| ディレクトリ | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff |
| 作成日 | 2026-06-11 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 担当 | web (apps/web 表現層) |
| 状態 | implemented_local_runtime_pending |
| タスク種別 | implementation |
| 実装区分 | 実装仕様書（VISUAL / コード変更を伴う） |
| 関連 issue | [#1188](https://github.com/daishiman/UBM-Hyogo/issues/1188)（CLOSED 2026-06-11・クローズドのまま据え置き。再 open しない） |

## 目的

`/admin/requests`（会員からの申請キュー）の承認操作 UI に、対象会員の公開状態（または退会時のレコード状態）が「**変更前 → 変更後**」へどう遷移するかを **1 つの diff として強調表示**し、管理者が承認結果を直感的に把握できるようにする。現状は現在値（`公開状態`）と申請内容（`desiredState`）が別々の `dd` に分離表示され、承認確認ダイアログも「公開状態を申請内容に応じて変更します。」という汎用文言のみで、**何から何へ変わるか**を提示しない。これを表現層（`apps/web/src/components/admin/`）のみで diff 化する。**API / D1 / Google Form schema / projection は一切変更せず、既存 GET `/admin/requests` レスポンスに含まれる 3 値（`publishState` / `isDeleted` / `desiredState`）だけで完結させる。**

## スコープ

### 含む

- `apps/web/src/components/admin/RequestQueueDetail.tsx` — `変更前 → 変更後` diff 行の新設（主役）。`visibility_request`（公開状態遷移）/ `delete_request`（在籍→退会）の意味軸分岐。publishState → 日本語ラベル変換 helper（`formatPublishStateLabel`）+ diff 構築 helper（`buildPublishStateDiff`）の追加。
- `apps/web/src/components/admin/RequestQueuePanel.tsx` — `destructiveMessage`（143-148 行）生成箇所で具体遷移文言（`公開 → 非公開 に変更します`）を組み立てる。
- `apps/web/src/components/admin/RequestConfirmDialog.tsx` — 承認確認時に上記具体文言を表示（既存 `destructiveMessage` props 経由・新規 props 追加なし）。
- `apps/web/src/styles/globals.css` — `[data-diff-side="before|after"]` の diff 強調クラス（既存 OKLch トークンのみ）。
- 既存 `*.spec.tsx`（`__tests__/` 配下 3 本）の追従 + note_type 別 diff assertion 追加。

### 含まない

- 承認時 publish_state 遷移ロジック（`apps/api` `inferDesiredPublishState` / `resolveRequestAtomic`）の変更。
- 新 endpoint 追加・D1 schema / migration の変更・GET `/admin/requests` projection 拡張。
- `packages/shared` の型変更。
- `apps/web` からの D1 直接アクセス。
- `/admin/requests` 以外の画面への波及・新規 UI primitive 追加。
- commit / push / PR / staging deploy / Issue 操作（全て user-gated）。

## 受入条件 (AC)

- AC-1: `visibility_request` 承認導線で `publishState`（変更前）→ `desiredState`（変更後）が `公開 → 非公開` のような遷移として 1 箇所に強調表示される。
- AC-2: `delete_request` は公開状態 diff でなく「在籍 → 退会（論理削除）」のレコード状態遷移として表現され混同されない。
- AC-3: publishState 生値が日本語ラベル（公開/会員限定/非公開/不明）へ変換され英語値が露出しない。
- AC-4: diff 強調色はすべて `tokens.css` の OKLch トークン経由で `design-tokens.md` と整合（新規追加時は両正本反映）。
- AC-5: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件で `verify-design-tokens` PASS。
- AC-6: 新規 primitive 追加 0 件（`data-diff-side` 属性 + 既存 primitive）。
- AC-7: 新 endpoint/D1 schema/projection 拡張なし。`git diff --name-only -- apps/api packages/shared` が空。
- AC-8: 承認確認ダイアログが `visibility_request` で具体遷移文言、`delete_request` で既存退会文言を提示する。
- AC-9: a11y — diff 矢印は `aria-hidden="true"`、before/after の意味はテキストで担保。既存 aria 不変。
- AC-10: 既存 3 spec が green を維持し、note_type 別 diff assertion が PASS。ルート/API パス/既存セレクタ不変。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | admin-requests-queue-rename-and-publish-dependency（親 workflow・B-2 baseline 発見元） | 本タスクの起点。親は AC-13 まで充足済 |
| 上流 | ui-prototype-alignment-mvp-recovery（design tokens / primitives 正本） | 色トークン・primitive を再利用 |
| 参照 | 既存 admin requests API（`requests.ts` projection / resolve） | データ供給元（変更しない） |
| 下流 | なし（本タスクは表現層に閉じる） | — |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/_shared-context.md | 調査結果・方針・AC の集約正本 |
| 必須 | apps/web/src/styles/tokens.css | OKLch トークン正本 |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | トークン値 JSON 正本・HEX 禁止ルール |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | primitive catalog |
| 必須 | docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md | admin 画面 contract |
| 参照 | apps/api/src/routes/admin/requests.ts | projection / desiredState 遷移（変更しない） |
| 参照 | apps/api/src/testing/test-accounts/catalog.ts | 申請 fixture（V01/V02/D01） |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/ | デザイン言語（primitives + rhythm）正本 |

## システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API endpoint surface | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | admin requests endpoint（参照のみ・変更なし） |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（D1 直接禁止） |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | UI/UX 設計指針・primitive 再利用方針 |

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/{main,spec-extraction-map}.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{main,diff-design}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/{main,alternatives}.md |
| 4 | テスト作成 | phase-04.md | completed | outputs/phase-04/{main,test-plan}.md |
| 5 | 実装 | phase-05.md | completed | outputs/phase-05/{main,runbook}.md |
| 6 | テスト拡充 | phase-06.md | completed | outputs/phase-06/{main,edge-cases}.md |
| 7 | カバレッジ確認 | phase-07.md | completed | outputs/phase-07/{main,ac-matrix}.md |
| 8 | リファクタリング | phase-08.md | completed | outputs/phase-08/{main,before-after}.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/{main,token-audit}.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/{main,go-no-go}.md |
| 11 | 手動テスト | phase-11.md | completed | outputs/phase-11/{main,manual-test-result,screenshot-plan.json,phase11-capture-metadata.json,...} |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/* strict 7 |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/* 4 種 |

## 触れる不変条件

| # | 不変条件 | このタスクでの扱い |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | admin gate proxy 経由のまま。D1 binding 不使用 |
| ui-prototype #1 | 既存 API のみ接続・新 endpoint/D1/Form 変更禁止 | AC-7 で保証 |
| ui-prototype #2 | OKLch トークン正本化・HEX 禁止 | AC-4/AC-5 で保証（`verify-design-tokens` gate） |
| ui-prototype #3 | プロトタイプ primitives 正本・新規 primitive 禁止 | AC-6 で保証 |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する。
- AC-1〜AC-10 が Phase 7（AC マトリクス）/ Phase 10（最終レビュー）で完全トレースされる。
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS。
- 本サイクルは **implemented_local_runtime_pending**。`apps/web` 表現層実装、focused Vitest、typecheck、lint、design token gate、Phase 12 compliance は完了済み。
- commit / push / PR / staging deploy / admin bearer mint / 3 canonical screenshot capture は user-gated として Gate-C に残す。
- 実装差分は `apps/web` のみ。`apps/api` / `packages/shared` 差分は空で AC-7 を維持する。

## 関連リンク

- 共有コンテキスト: ./_shared-context.md
- メタ: ./artifacts.json / ./outputs/artifacts.json
- 起点 Issue: https://github.com/daishiman/UBM-Hyogo/issues/1188
- 親 workflow: docs/30-workflows/completed-tasks/admin-requests-queue-rename-and-publish-dependency/
- 発見元未タスク仕様書: docs/30-workflows/completed-tasks/admin-requests-queue-rename-and-publish-dependency-followup-001-approval-publish-state-diff.md
