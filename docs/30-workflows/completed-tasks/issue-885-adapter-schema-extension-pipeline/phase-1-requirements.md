# Phase 1: 要件定義

## 1. 背景

- serial-06 で実装した `apps/web/src/lib/adapters/member-detail.ts` は、`PublicMemberProfileZ`（`packages/shared/src/zod/viewmodel.ts`）の現在 shape を前提に `toMemberDetailProps()` を構築している。
- adapter は次の責務を持つ:
  - `normalizeField`: `visibility === "public"` の field のみ通す（二重防御）
  - `FieldKindZ.safeParse` で unknown kind を silent skip
  - 出力 field から `visibility` / `source` キーを除外
  - 入力を mutate しない（pure function）
- 一方、`MemberDetail` primitive 側は strict zod `Section`（`visibility` / `source` 必須）を要求するため、`toLegacySections` で literal 復元（`visibility: "public" / source: "forms"`）して橋渡ししている。
- schema 拡張（例: `socialLinks` 追加 / 新 `FieldKind` 追加）が発生した際、「どのファイルをどの順序で触るか」が文書化されていない。Phase 9 §2 は「方針」を述べるのみで「手順」がない。
- 結果として schema 拡張対応は serial-06 実装者の暗黙知になっており、引き継ぎコストが高い。

## 2. 機能要件

| ID | 要件 |
|---|---|
| FR-1 | `apps/web/src/lib/adapters/README.md` を新規作成し、schema 拡張時の 5 ステップ checklist を記述する |
| FR-2 | README に「fixture / zod / adapter / primitive / spec」5 列の責務 mapping 表を含め、現状 8 テストケース横断的に「どこを触ると何が落ちるか」を可視化する |
| FR-3 | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` の末尾に `// === EXTENSION TEMPLATE ===` コメントブロックを追加し、新規 kind / field 追加時にコピペで増やせる test 雛形を提供する |
| FR-4 | README に serial-06 親 spec / Phase 12 implementation-guide への back link を記載する |
| FR-5 | README に「sanitize literal 復元の落とし穴」「fixture self-validation の罠」の 2 つの苦戦箇所メモを記載する |

## 3. 非機能要件

| ID | 要件 |
|---|---|
| NFR-1 | README は markdown only / 200 行程度に抑える（読みやすさ優先） |
| NFR-2 | spec の EXTENSION TEMPLATE コメントは実テストとして実行されない（コメントブロックのみ）。`pnpm --filter @ubm-hyogo/web test` の既存 8 ケースは影響を受けない |
| NFR-3 | README / spec 変更後も `pnpm typecheck` / `pnpm lint` / 既存 spec 8 ケースが全て PASS する |

## 4. 受け入れ基準（AC）

- AC-1: `apps/web/src/lib/adapters/README.md` が存在する
- AC-2: README に「5 ステップ checklist」見出しがあり、`zod` → `fixture` → `spec` → `adapter` → `primitive`（または README で確定する順序）が箇条書きされている
- AC-3: README に責務 mapping 表（5 列 × 既存 8 ケース）が含まれる
- AC-4: README に「sanitize literal 復元」「fixture self-validation」の 2 トピックが明記されている
- AC-5: spec ファイル末尾に `// === EXTENSION TEMPLATE ===` で始まり `// === END EXTENSION TEMPLATE ===` で終わるコメントブロックが存在する
- AC-6: `pnpm --filter @ubm-hyogo/web test -- member-detail.spec.ts` の既存 8 ケースが全て PASS
- AC-7: `pnpm typecheck` / `pnpm lint` PASS
- AC-8: `docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md` が削除されている（昇格済み）

## 5. スコープ確定

- 含む: README 新規作成 / spec 末尾の template コメント追加 / unassigned-task 配下の元 one-pager 削除
- 含まない: 実 schema 拡張、primitive 拡張、API 変更、adapter ロジック本体の変更
