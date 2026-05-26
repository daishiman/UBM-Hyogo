# Phase 9: リスクと緩和策

| ID | リスク | 影響度 | 確率 | 緩和策 |
|----|--------|-------|-----|--------|
| R-01 | `url`/`consent`/`system`/`unknown` を含む fixture により既存 happy-path テストが赤くなる | 中 | 中 | Phase 5 Step 6 で fixture を確認し、必要なら最小限のリファクタで `shortText` 等に振り替える。テスト意図は維持する |
| R-02 | visual snapshot baseline に意図しない diff が混入 | 中 | 中 | Playwright を Phase 5 Step 8 で実行。diff 内容を確認し、`url` の links 移動または `consent`/`system`/`unknown` 除外由来に限定されることを `outputs/phase-11/visual-diff-rationale.md` に明記 |
| R-03 | `__testInternals` export が production code から参照される | 低 | 低 | grep gate を Phase 7 Gate-B に組み込み、ci で検出可能にする（手動でも検証） |
| R-04 | `as const satisfies` が tsconfig target で未サポート | 低 | 低 | TS 5 系で広範サポート。本リポジトリ既に使用箇所あり。typecheck で即時検出 |
| R-05 | `MemberLinks` 未配線のまま `url` を `"links"` 分類することで「公開 detail から url が消える」結果になる | 中 | 高 | `linkSections` を `MemberDetailProps` に追加し、既存 `MemberLinks` へ同 cycle で接続する。単純除外で完了扱いにしない |
| R-06 | `FieldKindZ` 拡張が将来発生した際の対応漏れ | 低 | 中 | 本仕様の `satisfies` + spec 網羅性 assert がまさにこの fail-fast 装置。仕組み自体が緩和策 |
| R-07 | adapter test の structuredClone による `kind` 上書きが zod 検証を後段で踏まないため、想定外の値の検証になる | 低 | 低 | `normalizeField` 内で `FieldKindZ.safeParse` するため、想定外文字列は `safeParse` 不合格として除外される。意図通り |

## 撤回経路

問題発覚時の rollback:
- `member-detail.ts` の `KIND_ROUTE` / `DETAIL_KINDS` / `LINK_KINDS` / route set ガード行を削除し、`__testInternals` export を削除する。
- `MemberDetail.tsx` の `MemberLinks` import と `linkSections` 配線を削除する。
- spec から新規ケースを削除する。
- baseline 更新コミットがあれば revert する。

撤回後は出力 shape が完全に元に戻るため API / consumer への影響なし。
