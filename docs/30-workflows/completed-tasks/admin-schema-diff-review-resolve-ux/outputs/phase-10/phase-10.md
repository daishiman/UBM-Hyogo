# Phase 10: 最終レビュー（受入判定） — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書 / implemented_local_evidence_captured]`

本 Phase は **仕様レベル**で AC を判定する。実コードはまだ存在しないため、各 AC は「仕様設計が当該条件を満たす見込み」を判定し、状態 suffix を付す。

---

## 1. 受入条件（AC-1〜AC-9）充足見込み

| AC | 内容 | 仕様設計上の充足根拠 | 判定 |
|----|------|----------------------|------|
| AC-1 | ラベルクリックで割当フォームが**当該カード直下にインライン展開** | shared-context §2-C-1 で `.schema-grid` 後の旧 form を削除し、カード `map` 内 `{active?.diffId === it.diffId && active.questionId && (<form ...>)}` として当該カード直下に描画する設計 | implemented_local_evidence_captured |
| AC-2 | 割当フォームに「過去回答が新設問に対応づく」文脈ヘルプ | §2-C-2 で `<p data-role="assign-help">` を冒頭追加（「永続的な名前をつけると過去回答が新設問に自動で対応づく」） | implemented_local_evidence_captured |
| AC-3 | 専門用語が「やさしい日本語（技術名: xxx）」形式 | §2-A `schemaReviewTerms.ts` の `plainLabel`（`${plain}（技術名: ${technical}）`）+ label 文言更新（「新しい永続的な名前（技術名: stableKey）」） | implemented_local_evidence_captured |
| AC-4 | ページ冒頭に目的説明（3 ステップ + 用語ミニ集） | §2-B `SchemaReviewGuide.tsx`（3 ステップ flow + `SCHEMA_REVIEW_TERMS` 主要 4-6 語）を §2-D で `page.tsx` の `result.ok` 先頭に挿入 | implemented_local_evidence_captured |
| AC-5 | 各差分ペインに平易な一文説明 | §2-C-3 でペイン見出し直下に `termDescription(t)` を `<p className="muted">`、`unresolved` は専用文言 | implemented_local_evidence_captured |
| AC-6 | bulk/rollback/undo/recompute/HTTP 202・機械可読 id 不変 | §2-C-4 で `data-testid` / `aria-label` / id・role・API contract を不変と明記（表示テキスト・配置・補助 `<p>` のみ変更） | implemented_local_evidence_captured |
| AC-7 | 色は `var(--ubm-color-*)` のみ（HEX 0） | §2-E 追記 CSS は `var(--ubm-color-*)` のみ。`verify:tokens` gate（Phase 9 Q1） | implemented_local_evidence_captured |
| AC-8 | `apps/api` 非接触 | 対象は `apps/web` 表現層のみ。`git diff --quiet -- apps/api`（Phase 9 Q6） | implemented_local_evidence_captured |
| AC-9 | `SchemaDiffPanel`/`SchemaReviewGuide` の runtime import 境界維持（不変条件 #14） | `SchemaReviewGuide` は `page.tsx` のみが import。`SchemaDiffPanel` の既存 type-only import は許容し、runtime import は `page.tsx` に限定する | implemented_local_evidence_captured |

---

## 2. blocker 判定

**blocker なし。**

- 全 AC は apps/web 表現層内の文言・配置・新規純データ/表示コンポーネントで充足可能。
- 新 API / D1 schema / Google Form 変更を要する AC は存在しない（不変条件 #1・AC-8）。
- 既存 `SchemaDiffPanel.component.spec.tsx` の DOM 位置依存は Phase 4 のテスト更新（カード直下基準）で吸収済みの設計であり、未解決の構造的障害はない。

---

## 3. MINOR 指摘 / Phase 12 未タスク化候補

**0 件。**

- 今回サイクル内で AC-1〜AC-9 を完結できる設計（CONST_007: 今回サイクル内完了・先送りしない方針）。
- 用語集の全 31 設問展開・差分カードの並べ替え等の拡張は初回スコープに混ぜない（Phase 3 価値とコストの不均衡で除外済み）。これらは「将来拡張アイデア」であり MINOR 指摘ではないため、未タスク化候補としては列挙しない。
- 別ブランチ `admin-schema-page-purpose-clarity-ux` との重複は命名差別化（`SchemaReviewGuide` vs `SchemaPurposeExplainer`）+ 焦点限定（差分レビュー操作の流れ）で解消済み（Phase 3 リスク表）。

---

## 4. 完了条件

- [x] AC-1〜AC-9 を 1 行ずつ仕様レベルで判定し状態 suffix を付した。
- [x] blocker 判定（blocker なし）を明記した。
- [x] MINOR 指摘 0 件を明記し、CONST_007（今回サイクル内完了・先送りなし）方針を確認した。
