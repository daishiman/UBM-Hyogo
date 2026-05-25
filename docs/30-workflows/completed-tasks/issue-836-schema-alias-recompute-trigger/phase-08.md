# Phase 8: リファクタリング

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 名称 | リファクタリング（重複削減 / navigation drift 削減 / インターフェース不変保証） |
| 依存 | phase-05.md（実装）/ phase-06.md（テスト拡充）/ phase-07.md（カバレッジ確認） |
| 成果物 | 本ファイル（phase-08.md） |
| 状態 | spec_created |

## 目的

Phase 5 で実装した recompute 経路（workflow / repository / endpoint / web helper / UI）を、テストが green（Phase 6）かつ coverage 確認済み（Phase 7）の状態を保ったまま、重複・inline 化・navigation drift を削減する。リファクタは AC-1〜AC-13 のインターフェース（endpoint path / response shape / `data-role` / helper signature）を一切変えないことを絶対条件とする。

## リファクタ候補（FB-RT-03: 対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| reverse-backfill ⇔ backfill の chunk/CPU budget 定数 | `schemaAliasRecompute.ts` 内で `BACKFILL_BATCH_SIZE` / `BACKFILL_CPU_BUDGET_MS` を再宣言（drift 源） | `schemaAliasAssign.ts` の既存 export 定数（`export const BACKFILL_BATCH_SIZE = 100` / `BACKFILL_CPU_BUDGET_MS = 25_000`、L83-84 で確認済み）を import 再利用 | backfill と reverse-backfill の budget が分裂すると AC-8 の継続挙動が非対称になる。単一 SSOT 化で drift を防ぐ |
| reverse-backfill の member 除外 subquery | `reverseBackfillResponseFields` の SELECT / DELETE / UPDATE 3 箇所で「削除済 member 除外」subquery を inline 重複 | 除外条件を内部 helper（例 `excludeDeletedMembersSubquery()` 文字列定数 or 関数）として 1 箇所に抽出 | `backfillResponseFields`（対称元）と同じ除外条件であるべき。3 箇所コピペは条件変更時の取りこぼしリスク |
| audit insert の inline vs `auditLog.append()` | recompute の audit が rollback と異なる流儀（一方が inline INSERT、他方が `append()`）で混在 | recompute は rollback と対称に **同一流儀へ統一**（rollback が inline batch INSERT なら recompute も db.batch で job update + audit insert を 1 transaction に揃える。共通化可能なら `auditLog.append()` 経由に寄せる） | 同一ドメイン（`schema_alias.*` action）の audit 記録経路が 2 流儀に分裂すると保守時に片方だけ修正される事故を招く。Phase 3 決定事項 2 に整合 |
| UI status バッジの token utility | `SchemaDiffPanel.tsx` の completed / running / failed バッジで token クラスを各分岐に直書き | status → token クラスの mapping を 1 つの `Record<RecomputeUiStatus, string>` 定数へ集約（既存 `STATUS_LABELS` パターンに倣う） | バッジ色の token を 1 箇所に集約することで OKLch token 以外（HEX / `bg-[#xxx]`）混入を verify-design-tokens 前に発見しやすくする。AC-10 維持 |
| recompute UI のラベル分岐 | ボタンラベル（再集計を実行 / 続行 / 再試行 / 済み）が JSX 内三項演算で展開 | label mapping を `Record<RecomputeUiStatus, string>` へ集約（token mapping と同列に置く） | navigation drift（文言と status の対応ずれ）を削減し、test の文言アサーションを安定させる |

## duplicate / navigation drift の削減方針

1. **対称コードの SSOT 化**: reverse-backfill は backfill の「逆操作」であり、共有可能な部品（budget 定数・member 除外条件）は backfill 側を SSOT として import する。逆操作固有のロジック（from/to の入れ替え）だけを recompute 側に残す。CONST_006（backfill 対称性）を保つ。
2. **audit 経路の単一化**: `schema_alias.recompute` の audit 記録を rollback / resolve と同じ経路に寄せ、`after_json` の構築だけ recompute 固有にする。
3. **UI mapping の集約**: `RecomputeUiStatus` に紐づく「ラベル」「token クラス」「`aria` 属性」を mapping 定数へ集約し、JSX 側は lookup のみにする。これにより status 追加時の修正箇所を 1 箇所に局所化する。
4. **navigation drift 削減**: `data-role`（`recompute-action` / `recompute-status` / `recompute-trigger` / `recompute-error`）は Phase 1 命名規則表で固定済みのため変更しない。リファクタで attribute を消さない（test の selector 安定性を守る）。

## インターフェース不変（リファクタで AC を壊さない）の保証

リファクタ後も以下の外部契約は **bit 単位で不変** とする。変更した場合は AC 違反として扱う。

| 契約 | 不変であるべき内容 | 守る AC |
| --- | --- | --- |
| API path | `POST` / `GET /admin/schema/aliases/:aliasId/recompute` | AC-1, AC-4 |
| POST response shape | `{ jobId, aliasId, status, affectedCount, processedCount, recomputeAuditId }` | AC-1, AC-3 |
| GET response shape | `{ jobId, status, affectedCount, processedCount, lastError, updatedAt } | null` | AC-4 |
| audit action / after_json | `schema_alias.recompute` / `{ jobId, affectedCount, processedCount, updatedCount, deletedCollisionCount, relatedRollbackAuditId, triggerKey, reason }` | AC-3 |
| web helper signature | `recomputeSchemaAlias(input)` / `getSchemaAliasRecomputeStatus(aliasId)` / `RecomputeApiError` | AC-9, AC-12 |
| DOM `data-role` | `recompute-action` / `recompute-status` / `recompute-trigger` / `recompute-error` | AC-6 |
| idempotency キー | `(alias_id, stable_key, trigger_key)` UNIQUE | AC-2 |

検証手順:
- リファクタ前後で targeted test（Phase 1 の 4 ファイル）が **全 green** を維持すること（緑→緑の不変式）。
- リファクタは「テストを変更せずに実装だけを変える」ことを原則とし、test の期待値変更を伴う場合はリファクタではなく仕様変更として扱い差し戻す。
- `verify-design-tokens`（`pnpm verify:tokens`）が UI token 集約後も pass すること（AC-10）。

## リファクタ実施順序

1. budget 定数 import 統一（最小差分・即 test 再実行）。
2. member 除外 subquery 抽出（SQL 文字列の同値性をテストで担保してから抽出）。
3. audit 経路統一（db.batch / `append()` のどちらかに寄せ、audit 行アサーションで回帰確認）。
4. UI mapping 集約（label / token / aria を順に集約、component test で文言・disable・バッジを回帰確認）。
5. 各ステップ後に targeted test を再実行し、緑を確認してから次へ進む。

## 完了条件 (DoD)

- [ ] FB-RT-03 形式（対象 / Before / After / 理由）でリファクタ候補が列挙されている
- [ ] reverseBackfill と backfill の重複（budget 定数・member 除外条件）の SSOT 化方針が固定されている
- [ ] audit insert の inline vs `append()` 統一方針が rollback 対称で固定されている
- [ ] UI status バッジ / ラベルの token utility 共通化方針が固定されている
- [ ] インターフェース不変表（path / response / audit / helper / data-role / idempotency キー）が AC 紐付けで固定されている
- [ ] 「リファクタ前後で targeted test 全 green 維持」「`verify:tokens` pass」が検証手順に明記されている
