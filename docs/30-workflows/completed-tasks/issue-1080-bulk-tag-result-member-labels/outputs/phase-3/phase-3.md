# Phase 3: 設計レビュー — issue-1080 BulkActionBar 部分失敗結果 summary の表示名化

## 一次結論（4 条件評価）

| 条件     | 判定 | 根拠                                                                                                                                                              |
| -------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 価値性   | ✅   | 管理者の「どの会員・どのタグでスキップが起きたか」の判読コストを、生 ID 突き合わせ作業から表示名直読へ下げる。誰の（admin）どのコスト（運用判読）をどれだけ（即時化）下げるかが明確 |
| 実現性   | ✅   | 編集 2 ファイル + テスト 1 ファイル。新規 primitive・新規 API・新規ファイルなし。親の派生は `republishCandidates` の前例に一致し、tag 解決は `groupedTags` の前例に一致。初回スコープに収まる |
| 整合性   | ✅   | 責務境界（Container 供給 / Presentational 解決）が閉じている。member 解決＝親所有、tag 解決＝component 所有で state ownership を混在させない。API contract（AC-3）不変 |
| 運用性   | ✅   | optional prop で後方互換。testid / key 不変で既存テスト・将来の visual baseline 取得が破綻しない。fallback で欠落データでも UI が壊れない（AC-4） |

→ **総合: GO（Phase 4 進行可）**。

## AC ↔ 設計 トレーサビリティ

| AC   | 設計上の担保箇所                                                                                                | 検証 Phase     |
| ---- | -------------------------------------------------------------------------------------------------------------- | -------------- |
| AC-1 | `membersById?.[r.memberId]?.fullName ?? r.memberId` で skipped 行に fullName を表示（Phase 2 疑似コード）        | Phase 4/6 test |
| AC-2 | `tagLabelById[r.tagId]` で label 解決。未解決時 `{tagId}（未登録）`（Phase 2 疑似コード）                        | Phase 4/6 test |
| AC-3 | API 経路（`bulkMut` / `fetchTagMaster`）・型（`BulkTagResultItem`）を変更しない。`apps/api` 非接触（inventory） | Phase 9/10     |
| AC-4 | nullish 連鎖 fallback。`membersById?` optional。prop 未注入 / キー欠落 / 値欠落のいずれも memberId に落ちる       | Phase 4/6 test |
| AC-5 | `BulkActionBar.spec.tsx` に label 表示ケースと fallback ケースを追加（Phase 4/6）                                | Phase 4/6      |

## Phase 4 進行可否判定

**GO**。

判定根拠:

- 設計の不確実性が低い（既存構造の表示値置換 + optional prop 注入）。
- 親子の前例（`republishCandidates` / `groupedTags`）に完全に整合し、新規パターンの検証が不要。
- AC が全て設計箇所へ 1:1 でトレースできる。

## リスクと対策（issue リスク表を継承）

| リスク                                                              | 度合 | 対策                                                                                                                        |
| ------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------- |
| 個人情報表示が増えすぎる                                            | 中   | 主表示を `fullName` のみに限定。`responseEmail` は供給しない（email 副表示は需要確認まで起票しない）             |
| 表示名が引けない member で UI が壊れる                              | 中   | `membersById?.[id]?.fullName ?? r.memberId` の nullish 連鎖 fallback（AC-4）。component test で prop 未注入ケースを検証      |
| 既存テスト / 既存呼び出しが prop 追加で壊れる                       | 中   | `membersById?` を optional 化。testid / key を不変に保つ。後方互換テストを Phase 6 で回帰 guard 化                          |
| API contract を不用意に変える                                       | 高   | `apps/api` 非接触を inventory・AC-3 で固定。表示値の式のみ変更し、`results` shape / mutation 経路には触れない                |
| tag_not_found の通常ケースで label が引けず無表示になる             | 低   | 未解決時は `{tagId}（未登録）` を明示表示（AC-2）。空文字や無表示にしない                                                   |
| デザイン token / HEX 直書きの混入                                   | 低   | 既存の OKLch token クラスをそのまま使い、新規 class・HEX を増やさない（`verify-design-tokens` gate 整合）                    |

## 補足: 戦略仮説 / KJ クラスタ

- **why now**: 親 issue-1036 で bulk tag 機能が landed し result summary が稼働した直後であり、運用判読性の改善は最小差分で価値が出る。
- **why this way**: contract（API）を膨らませず UI 側の表示解決に閉じるのは、`apps/web` adapter 層で UI 期待 shape を満たす本リポジトリの正本順位（API 不変・UI 側 adapter）に整合する。
- **KJ クラスタ**: 〔データ供給〕親の derived `membersById` / 〔表示解決〕component の `tagLabelById` + nullish fallback / 〔不変条件保護〕testid・key・API contract 維持 — の 3 クラスタで設計が閉じる。
