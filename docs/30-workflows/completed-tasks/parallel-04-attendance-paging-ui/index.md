# parallel-04-attendance-paging-ui - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/web/app/profile/_components/AttendanceList.tsx` と focused test に対する実コード変更を伴う。`apps/web/app/profile/page.tsx` と `apps/web/src/lib/api/me-types.ts` は既存依存・検証対象として扱う。UI 実装単体タスクであり、設計のみでは完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | parallel-04-attendance-paging |
| タスク名 | AttendanceList の cursor paging UI 実装 (G4-1) |
| ディレクトリ | docs/30-workflows/completed-tasks/parallel-04-attendance-paging-ui |
| 親タスク | docs/30-workflows/ui-prototype-alignment-mvp-recovery |
| 原典 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-04-attendance-paging/spec.md |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | implemented_local_evidence_captured |
| タスク種別 | implementation / VISUAL |
| 優先度 | MEDIUM |
| GitHub Issue | #372（参照） |

## 目的

`GET /api/me/attendance?cursor=xxx` の cursor paging API に対応する UI を実装し、profile ページの参加履歴一覧で `/me/profile` の default 50 件表示後に「もっと見る」ボタンで追加読込を可能にする。

## スコープ

### 含む

- AttendanceList（参加履歴一覧）の paging UI 実装
- 初回 default 50 件表示（profile page の Server Component で `/me/profile` を fetch、props 経由で渡す）
- 「もっと見る」ボタンでの追加読込（Client Component 化）
- hasMore フラグによるボタン表示制御
- loading / error 状態の UI 表現
- 既存 API endpoint surface (`/api/me/attendance`) のみ使用

### 含まない

- 新規 API endpoint 追加
- D1 schema 変更
- profile page 以外の paging 化
- 仮想スクロール / 無限スクロール（明示的 button click による追加読込のみ）
- Google Form schema 変更

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-04-attendance-paging/spec.md | 原典仕様 |
| 必須 | apps/api/src/routes/me/schemas.ts | API response 型定義（`nextCursor: z.string().nullable()`） |
| 必須 | apps/api/src/routes/me/index.contract.spec.ts | cursor encode/decode 利用例 |
| 必須 | apps/web/src/lib/api/me-types.ts | フロント側型定義 |
| 必須 | apps/web/app/profile/page.tsx | Server Component（呼び出し元） |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | API 契約 |
| 必須 | docs/00-getting-started-manual/specs/design-tokens.md | OKLch tokens 正本 |
| 参考 | CLAUDE.md | UI prototype alignment / MVP recovery 不変条件 |

## 受入条件 (AC)

- **AC-1**: 初回表示で `/me/profile` default 50 件までの attendance items が DOM に render される
- **AC-2**: `attendanceMeta.hasMore === true` のとき「もっと見る」ボタンが表示される
- **AC-3**: ボタン click で `/api/me/attendance?cursor=<opaque>` を fetch し、`records` を既存 `items` に append する
- **AC-4**: `nextCursor === null` または `hasMore === false` でボタンが DOM から消える
- **AC-5**: fetch 失敗時に `role="alert"` で error message を表示し、button は再操作可能
- **AC-6**: loading 中は button disabled、テキスト「読み込み中…」
- **AC-7**: `items.length === 0` 時に「まだ参加履歴がありません」を表示
- **AC-8**: cursor を opaque string として扱い、フロント側で encode/decode しない
- **AC-9**: OKLch design tokens のみ使用し HEX 直書き禁止（CI gate `verify-design-tokens` PASS）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/component-design.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | completed | outputs/phase-04/task-breakdown.md |
| 5 | 実装計画 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | 実装手順 | phase-06.md | completed | outputs/phase-06/implementation-steps.md |
| 7 | テスト計画 | phase-07.md | completed | outputs/phase-07/test-plan.md |
| 8 | ドキュメント更新 | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | 受入確認 | phase-09.md | completed | outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | outputs/phase-10/refactor-summary.md |
| 11 | 視覚検証 | phase-11.md | completed | outputs/phase-11/visual-verification.md |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/implementation-guide.md |
| 13 | PR・振り返り | phase-13.md | blocked_pending_user_approval | outputs/phase-13/pr-summary.md |

## 不変条件

1. **既存 API のみ**: `/api/me/attendance` の現行 surface を変更しない。新 endpoint 追加禁止。
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding を直接参照しない（既存条件）。
3. **OKLch tokens 正本**: `apps/web/src/styles/tokens.css` 経由のみ。HEX / `bg-[#xxx]` 禁止。
4. **opaque cursor**: `nextCursor` の base64url 中身をフロント側で解釈しない。
5. **`*.spec.{ts,tsx}` 命名**: 新規テストファイルは `*.spec.tsx` のみ（`*.test.tsx` 禁止）。
6. **Server/Client 境界**: 初回 fetch は Server Component、追加 fetch は Client Component。
7. **CONST_007 遵守**: 本サイクル内で Phase 1〜12 と local implementation を完了済。

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| Client Component 化による hydration mismatch | `"use client"` を先頭配置、`useState` 初期化を props 経由で行う |
| profile page cache 戦略との競合 | `export const dynamic = "force-dynamic"` を維持 |
| cursor の URL エンコード不足 | `encodeURIComponent(cursor)` を必須化 |
| items append 時の key 重複 | `sessionId` を React key に採用 |
| API 側 cursor 仕様変更 | フロント側 opaque 扱いで影響を局所化 |

## 注意点

- 本タスクは既に local 実装完了（issue-372 対応）。本仕様書は Phase 1〜13 形式での遡及ドキュメント化。
- Phase 13 の commit / push / PR は user-gated。
