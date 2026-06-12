# admin-audit-log-japanese-clarity-and-filter-collapse — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| ディレクトリ | docs/30-workflows/completed-tasks/admin-audit-log-japanese-clarity-and-filter-collapse |
| 作成日 | 2026-06-11 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 担当 | web (apps/web 表現層) |
| 状態 | implemented_local_evidence_captured |
| タスク種別 | implementation |
| 実装区分 | 実装仕様書（VISUAL / コード変更を伴う） |
| 関連 issue | なし（staging UI/UX 観察起点・relatedIssue=null） |

## 目的

`/admin/audit`（監査ログ）画面を、**Apple UI/UX エンジニアの視点で非エンジニアの管理者でも直感的に操作できる**よう改善する。
現状は先行タスク #1202 でカード型タイムライン化済みだが、依然として **英語表記・技術キー名（`action` / `actorEmail` / `targetType` / `attendance.add` / `admin.member.status_updated` 等）が UI に露出**し、
フィルタフォームは 8 項目がフラットに並び、適用フィルタチップやカードのブロックが整列していない。
これを **(1) 用語集 SSOT による日本語ラベル化（生コード非表示）**、**(2) フィルタフォームの段階開示（よく使う項目 + 詳細な絞り込み）**、
**(3) カードブロックの整列**で解消する。**API / D1 / Google Form schema / 型は一切変更せず、`apps/web` 表現層（component + glossary + globals.css）のみで達成する。**

## スコープ

### 含む

- `apps/web/src/components/admin/auditGlossary.ts` — `AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS` / `AUDIT_FIELD_LABELS` + `describeAuditAction` / `describeAuditTargetType` / `describeAuditField` 追加（C1）
- `apps/web/src/components/admin/AuditLogPanel.tsx` — フォームラベル日本語化 + 2 層段階開示（`<details>`）+ datalist placeholder 日本語化（C1/C2）
- `apps/web/src/components/admin/AuditLogCard.tsx` — action / targetType 日本語表示 + `auditId` ラベル日本語化（C1/C3）
- `apps/web/src/components/admin/auditAppliedFilters.ts` — チップ label / value を describe helper 経由で日本語化（C1）
- `apps/web/src/components/admin/AuditPurposeGuide.tsx` — 用語集グリッド整列に伴う軽微調整（C3・必要時のみ）
- `apps/web/src/styles/globals.css` — `.chip-row` wrap / `.admin-audit-glossary` / `.admin-audit-card__meta` 整列 + `.admin-audit-filter-advanced`（details）追加（C3）
- 既存 `*.spec.{ts,tsx}` の追従 + 追加テスト（glossary helper / チップ日本語化 / details 段階開示 / カード日本語表示）

### 含まない

- API endpoint の追加・変更（`apps/api` 配下の diff ゼロ）
- D1 schema / migration の変更
- Google Form schema の変更
- `packages/shared` の型変更
- query param キー名の日本語化（API 契約のため不可・UI ラベルのみ日本語化）
- 新規 UI primitive の追加（既存 primitive のみ使用）
- CSV エクスポート / total 件数表示（先行タスクの Future scope 踏襲）

## 受入条件 (AC)

- AC-1: フィルタフォームの全ラベルが日本語化（操作の種類 / 実行者（メール）/ 対象の種類 / 対象ID / 期間（開始）/ 期間（終了）/ 一括処理ID / 表示件数）。`<input name>`（query param キー）は英語のまま不変
- AC-2: フィルタフォームが 2 層（常時 = 操作の種類 / 実行者 / 期間×2 / 表示件数、`<details>`「詳細な絞り込み」= 対象の種類 / 対象ID / 一括処理ID）。詳細フィルタに値があれば details はデフォルト `open`
- AC-3: 監査ログカードの操作（action）・対象種別（targetType）が日本語ラベルで表示される。未登録コードのみ生コード fallback
- AC-4: 適用フィルタチップのラベル・値が日本語化され、英語キー名露出がゼロ
- AC-5: datalist プレースホルダ / `auditId` ラベル等の英語キー名露出が解消（`auditId` → 「ログID」等、placeholder は日本語例示）
- AC-6: 用語集 SSOT `auditGlossary.ts` に action / targetType / field の日本語ラベルマップと describe helper が追加され、未登録 raw fallback を持つ
- AC-7: カードブロック整列：適用フィルタチップ行が `flex-wrap` で整列、用語集グリッド・カード meta グリッドが画面幅で破綻しない
- AC-8: 全色が OKLch トークン経由。HEX / `bg-[#xxx]` / `text-[#xxx]` がゼロ（CI gate `verify-design-tokens` pass）
- AC-9: API / D1 / Form / shared 型の変更ゼロ。`apps/api`・`packages/shared` の diff ゼロ。query param キー名不変
- AC-10: 新規 primitive 追加ゼロ（既存 `Card` / `FormField` / `Input` / `Select` / `Button` / `Chip` / ネイティブ `<details>` の再利用）
- AC-11: アクセシビリティ維持（`FormField` の label 関連付け・`<details>`/`<summary>` キーボード操作・適用フィルタ `aria-label` 維持・WCAG 2 AA コントラスト）
- AC-12: 既存挙動温存（検索 / リセット / ページネーション / PII マスク / JSON 開示 / エラー親切メッセージが不変）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | admin-audit-log-ux-clarity-and-reduce-error-fix（#1202） | カード型タイムライン + 用語ガイド + appliedFilters 可視化の実装基盤を再利用 |
| 上流 | ui-prototype-alignment-mvp-recovery（design tokens / primitives 正本） | 色トークン・primitive を再利用する前提 |
| 参照 | 既存 audit API（`GET /admin/audit`） | データ供給元（変更しない） |
| 下流 | なし（本タスクは表現層に閉じる） | — |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-audit-log-japanese-clarity-and-filter-collapse/_shared-context.md | 調査結果・方針・AC・ファイル一覧の集約正本 |
| 必須 | apps/web/src/styles/tokens.css | OKLch トークン正本 |
| 必須 | apps/web/src/components/admin/auditGlossary.ts | 用語集 SSOT（拡張対象） |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | トークン値 JSON 正本・HEX 禁止ルール |
| 参考 | docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/ | 先行タスクの実装基盤 |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/ | デザイン言語（primitives + rhythm）正本 |

## システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | UI/UX 設計指針・navigation 契約 |
| アーキテクチャ | `.claude/skills/aiworkflow-requirements/references/architecture-*.md` | apps/web / apps/api 境界 |
| API | `.claude/skills/aiworkflow-requirements/references/api-*.md` | endpoint surface（参照のみ） |

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/{main,spec-extraction-map}.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{main,layout-blueprint,component-map}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/{main,alternatives}.md |
| 4 | テスト作成 | phase-04.md | completed | outputs/phase-04/{main,test-plan}.md |
| 5 | 実装 | phase-05.md | completed | outputs/phase-05/{main,runbook}.md |
| 6 | テスト拡充 | phase-06.md | completed | outputs/phase-06/{main,failure-cases}.md |
| 7 | カバレッジ確認 | phase-07.md | completed | outputs/phase-07/{main,ac-matrix}.md |
| 8 | リファクタリング | phase-08.md | completed | outputs/phase-08/{main,before-after}.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/{main,token-audit}.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/{main,go-no-go}.md |
| 11 | 手動テスト | phase-11.md | runtime_pending（local focused test PASS / staging capture user-gated） | outputs/phase-11/{main,manual-test-result,screenshot-plan.json,...} |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/* 7 種 |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/* 4 種 |

## 主要成果物

| 成果物 | パス | 用途 |
| --- | --- | --- |
| 共有コンテキスト | _shared-context.md | 全 Phase の SSOT |
| メタ（root） | artifacts.json | 機械可読メタ・gates |
| メタ（mirror） | outputs/artifacts.json | root の mirror |
| Phase 仕様書 | phase-01..13.md | 各 Phase 実行仕様 |
| Phase 12 strict 7 | outputs/phase-12/* | 実装ガイド / spec sync / 未タスク / feedback / compliance |

## 触れる不変条件

| # | 不変条件 | このタスクでの扱い |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | `safeServerFetch` 経由のまま。D1 binding 不使用 |
| 8 | 新規 test は `*.spec.{ts,tsx}` のみ | 追加テストは `*.spec.{ts,tsx}` で作成 |
| 9 | admin form input は `FormField` 経由 | 既存 `FormField` を維持・直接 `<input>` を増やさない |
| ui-prototype #1 | 既存 API のみ接続・新 endpoint/D1/Form 変更禁止 | AC-9 で保証 |
| ui-prototype #2 | OKLch トークン正本化・HEX 禁止 | AC-8 で保証（`verify-design-tokens` gate） |
| ui-prototype #3 | プロトタイプ primitives 正本・新規 primitive 禁止 | AC-10 で保証 |

## 完了判定

- Phase 1〜13 の仕様書状態が artifacts.json と一致する（`implemented_local_evidence_captured` / Phase 11 `runtime_pending`）
- AC-1〜AC-12 が Phase 7（AC マトリクス）/ Phase 10（最終レビュー）で完全トレースされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- apps/web 表現層実装と focused Vitest 4 files / 57 tests PASS
- `verify:phase12-compliance` / `gate-metadata:validate` が pass（Gate-A/B passed / Gate-C pending）
- staging authenticated screenshot / commit / push / PR はユーザー明示承認後に実施

## 関連リンク

- 共有コンテキスト: ./_shared-context.md
- メタ: ./artifacts.json / ./outputs/artifacts.json
