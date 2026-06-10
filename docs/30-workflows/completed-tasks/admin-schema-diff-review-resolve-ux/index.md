# admin-schema-diff-review-resolve-ux — タスク仕様書（Phase 1-13）

| 項目 | 値 |
|------|-----|
| workflow_id | `admin-schema-diff-review-resolve-ux` |
| taskId | `TASK-ADMIN-SCHEMA-DIFF-REVIEW-RESOLVE-UX-001` |
| status | `implemented_local_evidence_captured`（実装区分: **実装仕様書** / staging visual pending） |
| visualEvidence | `VISUAL_ON_EXECUTION`（local focused evidence captured・staging PNG は user-gated） |
| implementation_mode | `new`（apps/web 表現層の UI 再構成） |
| branch | `feat/admin-schema-diff-review-resolve-ux` |
| canonical_root | `docs/30-workflows/admin-schema-diff-review-resolve-ux` |

---

## 実装区分

**`[実装区分: 実装仕様書]`** — コード変更を伴う（デフォルト）。

ユーザー依頼は「`/admin/schema` のサブのレビュー UI/UX を直感的にしてほしい／IDをクリックして下に出るものが何の役に立つのか分かるようにしてほしい」という UI/UX 改善であり、目的達成には apps/web の表現層コード変更（コンポーネント再構成・新規コンポーネント・スタイル追加）が必須。よって CONST_004/005 に従い、同一サイクルで apps/web 実装・focused tests・Phase 12 strict outputs・aiworkflow 正本同期まで完了した。

---

## 1 行サマリー（真の論点）

`/admin/schema`（スキーマ差分のレビュー）の **機能・API は完成済み**。ユーザーが「何ができるか分からない／IDをクリックして下に出るフォームの意味が分からない」と感じる**真因は apps/web 表現層の情報設計欠如**であり、(1) 差分カードのラベルをクリックすると割当フォームがパネル**最下部の離れた位置**に出て因果が見えない (2) `stableKey` / `questionId` / `alias` / `resolve` 等の専門用語が無説明 (3)「割り当てると何が達成できるか」の文脈ヘルプがゼロ、の3点を表現層のみで解消する。

> API / D1 schema / Google Form / endpoint surface は一切変更しない（UI prototype alignment 不変条件 #1 を継続）。

---

## ユーザー確定事項（AskUserQuestion・2026-06-09）

| 論点 | 確定 |
|------|------|
| 割当フォームの表示位置 | **クリックしたカード直下にインライン展開**（パネル最下部から移動） |
| 専門用語の扱い | **やさしい日本語を主・技術名を併記**（例: 「設問に永続的な名前をつける（技術名: stableKey）」） |
| 目的説明 | **含める**（ページ冒頭の目的説明 + 各操作の文脈ヘルプ） |

---

## 成果物（13 タスク仕様書）

| Phase | 名称 | 出力 |
|------|------|------|
| 1 | 要件定義 | `outputs/phase-1/phase-1.md` |
| 2 | 設計 | `outputs/phase-2/phase-2.md` |
| 3 | 設計レビュー | `outputs/phase-3/phase-3.md` |
| 4 | テスト作成 | `outputs/phase-4/phase-4.md` |
| 5 | 実装 | `outputs/phase-5/phase-5.md` |
| 6 | テスト拡充 | `outputs/phase-6/phase-6.md` |
| 7 | カバレッジ確認 | `outputs/phase-7/phase-7.md` |
| 8 | リファクタリング | `outputs/phase-8/phase-8.md` |
| 9 | 品質保証 | `outputs/phase-9/phase-9.md` |
| 10 | 最終レビュー | `outputs/phase-10/phase-10.md` |
| 11 | 手動テスト | `outputs/phase-11/phase-11.md` ・ `outputs/phase-11/manual-test-result.md` |
| 12 | ドキュメント更新 | `outputs/phase-12/main.md` 他 strict 7 |
| 13 | PR作成 | `outputs/phase-13/phase-13.md`（user-gated） |

補助: `shared-context.md`（3 Lane SSOT）。

---

## 3 Lane 構成（関心ごとの分離・apps/web 表現層のみ）

| Lane | 関心 | 主な対象 |
|------|------|---------|
| Lane A | 差分レビュー操作の再構成 + 文脈ヘルプ + やさしい用語 | `SchemaDiffPanel.tsx`（割当フォームのインライン展開化・各操作の文脈ヘルプ・ラベル平易化）、`schemaReviewTerms.ts`（技術名→やさしい日本語 SSOT 純データ・新規） |
| Lane B | 目的説明コンポーネント | `SchemaReviewGuide.tsx`（ページ冒頭「何ができるか」3 ステップの流れ + 用語ミニ集・新規）、`page.tsx`（統合・description 平易化） |
| Lane C | スタイル + テスト + Phase 11 計画 | `globals.css`（インラインフォーム・guide・term chip のスタイル・OKLch token のみ）、3 spec ファイル、Phase 11 screenshot 計画 |

> CONST_007: 上記 3 Lane はすべて**今回の実装サイクル（03.実装.md の 1 サイクル）内で完了できるスコープ**に収めている。先送り・別 PR 切り出しは行わない。

---

## 不変条件

1. **既存 API のみ接続**: `POST /admin/schema/aliases`（200/202 分岐）, bulk resolve, rollback, undo, recompute の現行 endpoint surface のみ利用。新 endpoint・D1 schema 変更・Google Form 変更禁止。
2. **OKLch トークン正本化**: 色は `apps/web/src/styles/tokens.css` の `var(--ubm-color-*)` のみ参照。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify:tokens` gate）。
3. **プロトタイプ primitives 準拠**: `ui-card` / `eyebrow` / `h-section` / `chip-row` / `stack-sm` 等の既存 primitive で構成。新規 primitive を生やさない。
4. **D1 直接アクセス禁止継続**: `apps/web` から D1 binding 禁止。
5. **不変条件 #14 継続**: `SchemaDiffPanel` / `SchemaReviewGuide` の runtime import は `/admin/schema/page.tsx` に限定する。`SchemaDiffPanel` の exported type を使う既存 type-only import は runtime 依存を増やさない例外として許容する。
6. **挙動不変**: bulk resolve / rollback / undo / recompute / HTTP 202 retryable continuation の動作ロジック・API contract・`data-*` 属性・`aria-label` の機械可読 id は変更しない（表示テキスト・配置・補助説明のみ追加）。

---

## CI gate（local evidence captured の正式ゲート）

`bash scripts/verify-pr-ready.sh` の 3 点:

1. `verify:phase12-compliance`（canonical 9 見出し + Phase 11 evidence 表 + workflow root scan）
2. `gate-metadata:validate`（`artifacts.json` の gates zod schema・`passed_at` 制約・evidence_path 実在）
3. `indexes:rebuild` drift（本 workflow は `.claude/skills/**/indexes` を触らないため drift 0 を期待）

local focused evidence は取得済み。authenticated staging screenshot、commit、PR は user-gated。
