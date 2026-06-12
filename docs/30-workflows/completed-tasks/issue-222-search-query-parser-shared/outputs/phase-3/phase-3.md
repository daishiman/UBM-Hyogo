# Phase 3: 設計レビュー（Phase 4 進行可否判定）

> SSOT: [`../../shared-context.md`](../../shared-context.md)

## 3.1 レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | drift 起因 silent bug を根絶。誰の（保守者の）どのコスト（web/api 二重保守）を下げるか明確 |
| 実現性 | PASS | 新規 3 ファイル + 編集 3 ファイル。1 PR / 1 サイクルで完了（CONST_007 充足） |
| 整合性 | PASS | 責務境界（規約=shared / 適用=app）が閉じている。D1 境界・boundary lint 不変 |
| 運用性 | PASS | 既存 2 spec 無変更 pass で回帰保証。shared 新規 spec で境界値保証 |

## 3.2 既存コンポーネント再利用可否（FB-SDK-07-1）

| 確認 | 結果 |
| --- | --- |
| 新規ライブラリ | 不要（zod のみ） |
| 既存 shared 配置パターン再利用 | `src/zod/` / subpath export（`./browser-storage`）パターンを踏襲 |
| 新規 primitive を生やさないか | shared に新モジュールは追加するが、UI primitive は不要（NON_VISUAL） |

## 3.3 リスクと緩和

| リスク | 緩和策 |
| --- | --- |
| root barrel 衝突（`SortZ` 等） | subpath export `./public-search` に閉じる（FB-W0-01）。root index.ts 非接触 |
| 既存 import 破壊（`SortZ`/`DensityZ`） | api 側で re-export 維持（Phase 2 §2.5） |
| 挙動 drift（切替で動作変化） | 既存 2 spec を**無変更**で実行し緑を要求（contract 不変の証明） |
| `MEMBERS_SEARCH_LIMITS` 形状変化 | shared から `{ TAG_LIMIT, Q_LIMIT }` 再構築で既存テスト互換 |
| shared→app の循環依存 | shared は app を import しない（一方向）。`pnpm depcruise` で確認（AC-5） |

## 3.4 命名衝突検査（FB-04 / FB-02）

- `packages/shared/src/admin/search.ts` に既存の検索型があるが、本タスクは `public-search/` 別ディレクトリ + `PublicMember*` prefix のため衝突なし。
- `SortZ` / `DensityZ` は api ローカルに既存。shared 側は `PublicMemberSortZ` と別名にし、api では re-export alias で吸収。

## 3.5 判定

**Phase 4 へ進行可（GO）。** ブロッカーなし。MINOR 指摘なし。3 レーン構成・後方互換戦略・subpath export 方針が確定済み。

## 完了条件

- [x] 4 条件すべて PASS
- [x] 再利用可否・リスク緩和・命名衝突を確認
- [x] GO 判定
