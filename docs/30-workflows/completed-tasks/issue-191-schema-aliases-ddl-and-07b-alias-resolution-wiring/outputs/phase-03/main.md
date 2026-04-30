# Phase 3 出力: 設計レビュー（issue-191）

Phase 2 で確定した「`schema_aliases` 専用テーブル新設」案を絶対視せず、3 つ以上の代替案と PASS / MINOR / MAJOR 評価で比較し推奨を確定する。

## 評価軸

| 軸 | 説明 |
| --- | --- |
| 不変条件適合 | #1 / #5 / #14 |
| 03a 冪等性 | sync 再実行で alias が破壊されないこと |
| 出自追跡 | 誰がいつ alias を確定したか記録できること |
| 移行容易性 | `schema_questions.stable_key` からの移行コスト |
| 運用容易性 | admin UI / lint / 監査の実装容易性 |
| D1 無料枠影響 | row 数 / index コスト |

## 代替案サマリ

詳細は `outputs/phase-03/alternatives.md` を参照。

| 案 | 不変条件 | 03a 冪等性 | 出自追跡 | 移行 | 運用 | 総合 |
| --- | --- | --- | --- | --- | --- | --- |
| **A: schema_aliases 新設** | PASS | PASS | PASS | MINOR | PASS | **PASS-MINOR** |
| B: schema_questions に alias_of | MINOR | MAJOR | MAJOR | PASS | MINOR | MAJOR |
| C: JSON カラム集約 | MINOR | MINOR | MAJOR | PASS | MAJOR | MAJOR |
| D: schema_diff_queue 内完結 | - | MINOR | PASS | PASS | MAJOR | MAJOR |

## 推奨案: Alternative A（schema_aliases 専用テーブル新設）

### 理由

1. **03a 冪等性を保てる唯一の案**: 03a は alias テーブルを read-only でしか触らないため、sync 再実行による破壊が構造的に発生しない
2. **出自追跡（resolved_by / resolved_at / source）を SQL で正規にクエリ可能**: 監査要件への将来拡張余地が高い
3. **不変条件 #14（/admin/schema 集約）と整合**: 07b workflow が書き込み起点を独占でき alias 編集経路が一本化
4. MINOR の「移行期間二重 source」は Phase 2 の lookup 順序固定（aliases 優先）で吸収可能

### 受け入れる MINOR の対処計画

| MINOR 項目 | 対処 |
| --- | --- |
| 移行期間中の二重 source | Phase 2 lookup 順序ルール、Phase 4 でテストケース化 |
| 移行終端条件未確定 | Phase 12 ドキュメント更新で「fallback 廃止予告」明記、後続 issue で別途扱う |

## id 採番方式（open question への解答）

既存 `apps/api/src/repositories/` の慣習を踏襲。ULID 採用慣習があれば踏襲、なければ Phase 5 で ULID を採用（ソート可能 / 短い）。確定は Phase 5 ランブック実施直前に既存 grep で確認。

## 次 Phase（4: テスト戦略）への引き渡し

- 推奨案: A（schema_aliases 専用テーブル新設）を確定
- Phase 4 で AC-1〜AC-6 ごとの verify suite を設計
