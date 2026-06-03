# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動テスト) |
| タスク種別 | implementation / visualEvidence: NON_VISUAL / implementation_mode: new |

## 目的

Phase 1〜9 の成果物（repository helper 追加 + use-case ループ置換 + テスト拡充 + 品質保証）を
AC-1〜AC-6 を判定基準として最終 GO/NO-GO する。blocker（実装が AC を満たさず PR に進めない状態）の
有無を確定し、MINOR 指摘があれば「機能に影響なし」を不要判定理由にせず未タスク化候補として記録する。
特に consumer wiring（use-case が新規 helper `listFieldsByResponseIds` を正しく呼んでいるか）の
repository → use-case → view の 3 層に断絶がないことを確認する。

## 最終レビュー判定（AC ベース GO/NO-GO）

| AC | 判定基準 | 判定 | 根拠 |
| --- | --- | --- | --- |
| AC-1 | `responseFields.ts` に `listFieldsByResponseIds(c, rids: ResponseId[]): Promise<ResponseFieldRow[]>` が追加され、`response_id IN (...)` の 1 query で実装されている | GO | helper が `if (rids.length === 0) return []` → `placeholders(rids.length)` → `IN (${ph})` → `.bind(...rids).all<ResponseFieldRow>()` で実装される |
| AC-2 | `list-public-members.ts` の per-member fields ループが廃され、`response_id`(=`current_response_id`) でキー化した `Map<string, ResponseFieldRow[]>` に groupBy される | GO | ループ外 1 query + groupBy + per-member `fieldsByResponseId.get(m.current_response_id) ?? []` lookup に置換。`byKey` 構築以降は不変 |
| AC-3 | fields クエリ数が member 件数 N に依存しない（≦ 1 回）回帰テストが追加されている | GO | use-case spec で `listFieldsByResponseId`（単数）呼び出し 0 回 / `listFieldsByResponseIds`（複数）呼び出し ≦ 1 回をアサートする |
| AC-4 | view 出力 `PublicMemberListResponse` の形状・値が不変（既存 use-case テストが緑のまま） | GO | `byKey` 構築以降と `toPublicMemberListView` は不変。既存出力アサーションが緑維持 |
| AC-5 | tags 側ロジック・D1 schema・endpoint・Google Form 仕様・`apps/web` を一切変更しない | GO | 変更は apps/api 内 repository + use-case + テスト 2 ファイルのみ。スコープ外非接触 |
| AC-6 | `mise exec -- pnpm typecheck` / `lint` / 対象 vitest が全て緑 | GO | Phase 9 品質保証で全コマンド緑を確認する |

## consumer wiring 3 層断絶チェック（[FB-CANCEL-004-1] 観点）

| 層 | 確認内容 | 判定 |
| --- | --- | --- |
| repository | `listFieldsByResponseIds` が export され、`response_id` 列を含む `ResponseFieldRow[]` を返す | GO |
| use-case | `list-public-members.ts` がループ外で `listFieldsByResponseIds(ctx, responseIds)` を 1 回呼び、結果を `response_id` キーで groupBy する | GO |
| view | `byKey` 構築以降の引き当てと `toPublicMemberListView` が不変で、`fieldsByResponseId.get(m.current_response_id)` から正しく値が流れる | GO |

> 3 層いずれかが「helper を追加したが use-case が旧 `listFieldsByResponseId` をループで呼んだまま」
> のような partial fix（断絶）状態であれば NO-GO とし、Phase 5 へ差し戻す。本タスクは置換完了が
> 前提のため GO だが、レビュー実行時に grep（`listFieldsByResponseId(` 単数のループ残存 0 件）で
> 機械的に確認する。

## blocker / MINOR 指摘

| 種別 | 内容 | 扱い |
| --- | --- | --- |
| blocker | （想定 0 件）AC のいずれかが NO-GO | 検出時は Phase 5/6 へ差し戻し。PR へ進めない |
| MINOR | （想定 0 件）スコープ外の改善余地 | 検出時は「機能に影響なし」を不要判定理由にせず、Phase 12 で `unassigned-task-detection.md` へ未タスク化候補として記録する |

> **MINOR 未タスク化方針（必須）**: Phase 10 で MINOR 判定が出た場合、「機能に影響がない」ことは
> 未タスク化を見送る理由にならない。MINOR は必ず Phase 12 の未タスク検出対象とし、`current` として
> 記録する。本タスクは単一責務・小規模のため MINOR は想定 0 件だが、レビュー実行時に判定 0 件を
> 明示記録する。

## 実行タスク

1. AC-1〜AC-6 を GO/NO-GO で判定する（完了条件: 全 AC が GO、または NO-GO 項目と差し戻し先 Phase を記録）。
2. consumer wiring 3 層断絶チェックを実施し、旧 `listFieldsByResponseId`（単数）のループ残存 0 件を grep で確認する（完了条件: §consumer wiring 表が全 GO）。
3. blocker の有無を確定する（完了条件: blocker 0 件、または blocker 内容と差し戻し先を記録）。
4. MINOR 指摘を未タスク化候補として整理する（完了条件: MINOR 件数を明記し、0 件でも「0 件」と記録。「機能に影響なし」を不要判定理由にしない方針を明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-09.md | 品質保証結果（typecheck/lint/vitest 緑） |
| 必須 | apps/api/src/use-cases/public/list-public-members.ts | consumer wiring 確認対象 |
| 必須 | apps/api/src/repository/responseFields.ts | helper 追加確認対象 |
| 必須 | .claude/skills/task-specification-creator/references/unassigned-task-guidelines.md | MINOR → 未タスク化ルール |
| 参考 | index.md | AC-1〜AC-6 の正本 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | 最終レビュー主成果物（AC GO/NO-GO 判定 + consumer wiring 3 層チェック + blocker/MINOR 記録） |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定済み実装を NON_VISUAL 手動テストの代替証跡（自動テスト）対象として渡す |
| Phase 12 | MINOR 指摘件数（想定 0 件）を未タスク検出レポートへ渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] AC-1〜AC-6 が GO/NO-GO で判定されている
- [ ] consumer wiring 3 層断絶チェックが実施され、旧単数 helper ループ残存 0 件が確認されている
- [ ] blocker の有無が確定している
- [ ] MINOR 指摘が件数明記で整理され、「機能に影響なし」を不要判定理由にしない方針が記録されている
- [ ] Phase 11 へ進む GO 判定が記録されている

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が completed
- 成果物が `outputs/phase-10/` 配下に配置済み
- blocker 0 件 / MINOR 件数が明記されている
- artifacts.json の `phases[9].status` が更新されている

## 次 Phase への引き渡し

- 次 Phase: 11 (手動テスト / NON_VISUAL)
- 引き継ぎ事項:
  - AC-1〜AC-6 全 GO（想定）
  - consumer wiring 3 層断絶なし
  - MINOR 件数（想定 0 件）→ Phase 12 未タスク検出へ
- ブロック条件:
  - いずれかの AC が NO-GO（→ Phase 5/6 へ差し戻し）
  - consumer wiring に partial fix（断絶）が残存
