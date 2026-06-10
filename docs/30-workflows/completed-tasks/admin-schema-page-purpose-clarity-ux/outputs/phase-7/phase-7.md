# Phase 7 — カバレッジ確認

> SSOT: [`../../_shared-context.md`](../../_shared-context.md)。本 Phase はカバレッジを **変更ファイルに限定**して測る方針を固定する（BEFORE-QUIT-002 / Feedback 5: 全体カバレッジを動かさない・スコープ外ファイルを巻き込まない）。
> implementation_mode=`new`（implemented_local_evidence_captured）。実測値は Phase 11 evidence に記録済み。本 Phase は「何を・どのコマンドで・どの基準で測るか」を固定した。

## 7.1 測定対象（変更ファイルに限定）

| 対象ファイル | レーン | カバレッジ目標 | 根拠 |
| --- | --- | --- | --- |
| `apps/web/src/components/admin/schemaGlossary.ts` | A | **line 100% / branch 100%** | 純関数・純データ・分岐は switch default のみ。Phase 6 防御テストが未知キー default 分岐を踏むため 100% 到達可能 |
| `apps/web/src/components/admin/SchemaPurposeExplainer.tsx` | A | line 100% / branch 100%（条件分岐があれば） | 状態なし静的描画。分岐は技術名併記の有無（`technicalName &&`）程度。Phase 4 描画テストで全枝到達 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` の**追加分岐のみ** | B | 追加した表示分岐（カテゴリ説明・アウトカム・empty コピー・平易ステータス）を line/branch でカバー | 既存ロジック（bulk/rollback/recompute）は既存 spec が担保済。**新規追加した表示分岐**だけを測る |
| `apps/web/app/(admin)/admin/schema/page.tsx` の**変更分**（統計ラベル/hint・履歴見出し・explainer 配置・fail path 枝） | A,C | 変更した行/分岐をカバー | ok=true / ok=false 双方を page.spec が踏む（Phase 6 fail path） |

> **測らないもの**: `globals.css`（CSS は vitest coverage 対象外。`verify-design-tokens` で別途検査）。`apps/api` / `packages/shared`（不変条件で非接触・git diff 空で確認）。`SchemaDiffPanel` の既存ロジック全体（本タスクで触らないため数値の上下を本タスクの責とせず、追加分岐のみ責任範囲）。

## 7.2 カバレッジ確認コマンド（変更ファイル指定）

```bash
# 変更ファイルに include を絞った coverage 実測（repo root から）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.reportsDirectory=apps/web/coverage-schema \
  --coverage.include="apps/web/src/components/admin/schemaGlossary.ts" \
  --coverage.include="apps/web/src/components/admin/SchemaPurposeExplainer.tsx" \
  --coverage.include="apps/web/src/components/admin/SchemaDiffPanel.tsx" \
  --coverage.include="apps/web/app/(admin)/admin/schema/page.tsx" \
  apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/schema/page.spec.tsx"
```

> `--coverage.include` を変更ファイルだけに列挙することで、リポジトリ全体の include（`apps/web/src/**`）に引きずられず、対象 4 ファイルの line/branch/function/statement のみがレポートされる（BEFORE-QUIT-002 準拠）。`@vitest/coverage-v8`（`package.json` devDeps）を利用。

## 7.3 実測記録テンプレ（実装時に埋める）

| ファイル | Statements | Branch | Functions | Lines | 判定 |
| --- | --- | --- | --- | --- | --- |
| `schemaGlossary.ts` | _%_ | _%_ | _%_ | _%_ | 目標 line/branch 100% |
| `SchemaPurposeExplainer.tsx` | _%_ | _%_ | _%_ | _%_ | 目標 100% |
| `SchemaDiffPanel.tsx`（追加分岐） | n/a（全体値） | 追加分岐 hit を個別確認 | n/a | n/a | 追加分岐の uncovered 0 |
| `page.tsx`（変更分） | n/a | ok 真/偽 両枝 hit | n/a | n/a | 変更行 uncovered 0 |

> `SchemaDiffPanel.tsx` / `page.tsx` は既存コードを含むため**全体の line% を目標化しない**。coverage レポートの uncovered 行リストを見て、**本タスクで追加・変更した行/分岐に uncovered が無いこと**を確認する（差分カバレッジ的運用）。`schemaGlossary.ts` / `SchemaPurposeExplainer.tsx` は新規ファイルゆえ全体 100% を目標にできる。

## 7.4 未到達が出た場合の対処方針

- `schemaGlossary` の branch が 100% に届かない → 未知キー default 分岐を踏むテスト（Phase 6 §6.2 の `not.toThrow` ケース）が両関数に存在するか確認。`describeDiffType`/`describeStat` 双方に未知キーケースを置く。
- `SchemaDiffPanel` の empty コピー枝が未到達 → `initial={total:0,items:[]}` ケース（Phase 6 §6.3 補助）が実行されているか確認。
- `page.tsx` の fail 枝が未到達 → `safeServerFetch` を ok=false で返す page.spec ケース（Phase 6 §6.4）が存在するか確認。

## 完了条件

- [x] 測定対象を変更 4 ファイルに限定（BEFORE-QUIT-002 / Feedback 5）
- [x] 新規純関数 `schemaGlossary.ts` は line/branch 100% 目標を明記
- [x] 既存含むファイル（SchemaDiffPanel/page）は「追加・変更分岐の uncovered 0」を基準化
- [x] `--coverage.include` を変更ファイル指定にした実測コマンドを明記
- [x] 実測記録テンプレと未到達時の対処方針を用意（実測は実装時）
