# Phase 3: 設計レビュー

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 3 / 13                      |
| 名称      | 設計レビュー                |
| 状態      | completed                   |
| 作成日    | 2026-05-28                  |

## 1. レビュー観点と判定

| 観点                              | 判定 | 根拠                                                                         |
| --------------------------------- | ---- | ---------------------------------------------------------------------------- |
| Phase 2 設計が AC を満たす         | PASS | 全 AC-01〜05 に対応する差分が設計済                                          |
| 既存 invariant に矛盾しない        | PASS | `apps/web` env 不変・revalidate / connection / generateMetadata 不変・OpenNext build 互換 |
| 命名規則一貫性                     | PASS | `getAuthView` / `authView` / `AuthView` / `data-auth-state` で Task A と統一 |
| クラス・関数名衝突なし             | PASS | 同パッケージ内に `HomePage` 以外の同名関数なし                               |
| props vs state の責務分離          | PASS | server component で props のみ                                               |
| エッジケース網羅                   | PASS | guest / member 2 軸でテスト設計、admin は Task E 範囲                        |
| TDD RED 前提のテスト範囲明確       | PASS | Phase 4 で `vi.mock` + `getStats` / `listMembersRaw` 併せ mock を明示済      |

## 2. MINOR 指摘

なし。

## 3. 進行可否

**Phase 4 へ進める**。設計レビュー合格。
