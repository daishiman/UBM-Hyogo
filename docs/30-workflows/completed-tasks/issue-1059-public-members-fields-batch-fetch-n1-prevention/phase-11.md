# Phase 11: 手動テスト（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| タスク種別 | implementation / **visualEvidence: NON_VISUAL** |

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | バックエンド read 経路の最適化（apps/api の repository + use-case） |
| 非視覚的理由 | UI/UX・画面・DOM・スタイルの変更を一切伴わない。view 出力 `PublicMemberListResponse` の形状・値は不変であり、画面上の見た目は変化しない |
| 代替証跡 | 自動テスト（repository spec + use-case spec）の PASS 件数と、fields クエリ回数 ≦ 1 の回帰 guard |
| スクリーンショット | **不要**（UI/UX 変更なし）。`screenshots/` ディレクトリは作成しない |

## 目的

NON_VISUAL タスクのため実地 UI 操作は行わず、自動テスト結果と既知制限を代替証跡として
`outputs/phase-11/manual-test-result.md` に記録する。

## 検証手順（自動テスト）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/repository/__tests__/responseFields.repository.spec.ts \
  apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
```

## 証跡として記録する内容（manual-test-result.md メタ / Feedback 4）

| メタ項目 | 記録内容 |
| --- | --- |
| 証跡の主ソース | 自動テスト名（responseFields.repository.spec.ts / list-public-members.spec.ts）と PASS 件数 |
| スクリーンショットを作らない理由 | UI/UX 変更なし（NON_VISUAL）。出力契約が不変のため画面差分が発生しない |
| 確認した不変性 | `PublicMemberListResponse` の形状・値が batch 化前後で同一（既存 happy path 回帰が GREEN） |
| 確認した N+1 解消 | fields クエリ呼び出し回数が member 件数に依存せず ≦ 1（回帰 guard PASS） |

## 既知制限

- 本 Phase は実 D1（Cloudflare staging/production）への接続検証は含まない。実 DB での
  パフォーマンス計測は範囲外（運用観測で別途確認可能）。
- public/members エンドポイントの認証は不要（公開ルート）だが、本 Phase は use-case/repository
  レイヤの自動テストで担保し、E2E は範囲外。

## 実行タスク

1. NON_VISUAL 宣言を `manual-test-result.md` 冒頭に記載する（完了条件: 種別/理由/代替証跡が明記）。
2. 自動テスト（typecheck/lint/対象 vitest）を実行し結果を記録する（完了条件: 全 PASS の件数記録）。
3. 出力不変性と N+1 解消の証跡を記録する（完了条件: 回帰 guard PASS を明記）。
4. 既知制限を記録する（完了条件: 実 DB 計測が範囲外と明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md / phase-06.md | テスト設計（証跡対象） |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | NON_VISUAL テンプレ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/manual-test-result.md | NON_VISUAL 宣言 + 自動テスト証跡 + 既知制限 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | NON_VISUAL 判定と証跡を implementation-guide の視覚証跡セクションへ渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] NON_VISUAL 宣言が manual-test-result.md 冒頭に記載されている
- [ ] 自動テスト（typecheck/lint/対象 vitest）が全 PASS で件数記録済み
- [ ] 出力不変性と N+1 解消（回帰 guard）の証跡が記録されている
- [ ] `screenshots/` を作成していない
- [ ] 既知制限が記録されている

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が完了
- 成果物 `outputs/phase-11/manual-test-result.md` が配置済み
- artifacts.json の `phases[10].status` が完了時に更新される

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項: NON_VISUAL 証跡 / 自動テスト件数
- ブロック条件: 自動テストが GREEN にならない
