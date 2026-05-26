# issue-885-adapter-schema-extension-pipeline

> Source issue: [#885](https://github.com/daishiman/UBM-Hyogo/issues/885)（CLOSED のまま仕様書化）
> Predecessor one-pager: `docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md`
> Parent workflow: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/`
> 実装区分: **実装仕様書**（README 新規 + spec ファイルに extension template コメント追加 = ソースコード変更を伴う）
> 状態: `implemented_local_evidence_captured`
> 作成日: 2026-05-25

## 調査サマリ（CLOSED 状態の妥当性検証）

`apps/web/src/lib/adapters/` 現状を `git ls-files` / 内容 grep で確認した結果:

| 検証項目 | 期待 | 実測 | 判定 |
|---|---|---|---|
| `apps/web/src/lib/adapters/README.md` 存在 | あり | あり | ✓ 実装済み |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` に `EXTENSION TEMPLATE` コメント | あり | あり | ✓ 実装済み |
| 責務 mapping 表（fixture / zod / adapter / primitive / spec の 5 列） | あり | あり | ✓ 実装済み |
| `member-detail.ts` の実装 | sanitize literal 復元・visibility/source 除外 | 実装済（`toMemberDetailProps`） | — 参照対象 |
| 元 one-pager `serial-06-followup-004-...` | unassigned-task から削除 | 削除済み | ✓ 昇格済み |

**結論**: Issue #885 は CLOSED のまま維持し、成果物 4 点（README / 5-step checklist / spec template / 責務 mapping 表）を本 workflow で実装済み。

ユーザー指示により Issue は CLOSED のまま維持し、PR 文言では `Refs #885` のみ用いる（`Fixes` / `Closes` は使わない）。

## 概要

`PublicMemberProfileZ` schema 拡張時の adapter 拡張パイプライン（zod → fixture → spec → adapter → primitive の 5 ステップ）を、`apps/web/src/lib/adapters/README.md` に明文化する。同時に spec ファイル末尾に「new kind 追加 template」コメントブロックを埋め込み、コピペで test ケースを増やせる状態にする。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント反映（中学生レベル概念説明含む） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成 |

## 変更対象ファイル

- `apps/web/src/lib/adapters/README.md`（**新規**）
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`（**修正**: 末尾に `// === EXTENSION TEMPLATE ===` コメントブロック追加。実テストケースは増やさない）
- `docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md`（**削除**: 本仕様書ディレクトリに昇格したため）

> 本タスクで `apps/web/src/lib/adapters/member-detail.ts` 本体・`packages/shared/src/zod/viewmodel.ts`・`MemberDetail` primitive 等のコード本体は変更しない。あくまで「拡張時に何をどの順序で触るか」を README と spec コメントに記録するメタタスク。

## スコープ外（本仕様内では新規バックログ化しない）

- 仮の `socialLinks` / 新 `FieldKind` を実際に schema に追加する（別タスク）
- primitive 拡張
- API 側 use case 変更
- adapter 数を増やす（現状 `member-detail.ts` のみ対象。将来 adapter が増えた段階で README 構造を見直す）

## 不変条件

1. **visibility filter 二重防御を維持**: adapter は `visibility !== "public"` を `normalizeField` で除外（正本は API 側）。README ステップ 4 でこの不変条件を必ず触れる。
2. **sanitize literal 復元の橋渡し**: `MemberDetail` primitive の `toLegacySections` で `visibility: "public" / source: "forms"` を literal 復元している前提を README に明記する（Phase 8 DoD-13 と整合）。
3. **fixture self-validation の維持**: spec ケース 1 で `PublicMemberProfileZ.parse(samplePublicMemberProfile)` を行い、fixture が schema drift していないことを保証している。新 field 追加時の落とし穴として README に書く。
4. **コード本体は本タスクで変更しない**: 本タスクはドキュメント・spec コメント整備に閉じ、`member-detail.ts` の挙動を変えない。
