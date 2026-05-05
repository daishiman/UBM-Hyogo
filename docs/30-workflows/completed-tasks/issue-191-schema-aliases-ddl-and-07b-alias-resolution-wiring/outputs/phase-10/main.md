# Phase 10 出力: 最終レビュー（issue-191）

Phase 1〜9 を集約し、4 条件と blocker を全件評価し、Phase 11 以降（手動 smoke / docs / PR）に進めるかの GO/NO-GO を確定する。

## 4 条件評価（最終）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 03a 冪等性維持・出自追跡・07b 単独テスト性を構造的に獲得（Phase 1/3） |
| 実現性 | PASS | DDL 1 本 + repository 1 個 + 既存配線変更（Phase 2/5 ランブック確定） |
| 整合性 | PASS | 不変条件 #1/#5/#14 すべて PASS（Phase 9 再点検済） |
| 運用性 | PASS-MINOR | 移行期間二重 source あるが lookup 順序固定 + Phase 12 fallback 廃止予告で吸収 |

総合: **PASS-MINOR**（GO への影響なし）

## blocker 候補チェック

| # | 候補 | 状態 | 根拠 |
| --- | --- | --- | --- |
| 1 | schema_aliases DDL レビュー | CLEAR | Phase 2 で 8 カラム/UNIQUE/INDEX 確定、Phase 3 alternative 比較済 |
| 2 | 03a 互換 path（fallback）テスト | CLEAR | Phase 4 verify suite に fallback ケース設計（AC-6） |
| 3 | 07b INSERT 配線（直接 UPDATE 根絶） | CLEAR | Phase 8 削除候補一覧、Phase 9 lint rule 恒常化 |
| 4 | fallback 動作（aliases miss → questions hit） | CLEAR | Phase 2 lookup 順序、Phase 4/6 でテスト設計 |
| 5 | migration 番号衝突 | CLEAR-PENDING | Phase 5 ランブックで `ls apps/api/migrations` +1 ルール明記、実 PR 時再確認 |
| 6 | 既存 07b endpoint URL 差分 | CLEAR-PENDING | Phase 8「実 endpoint 正本」ルール、Phase 13 で最終確認 |
| 7 | 03a sync 本体ロジック改修要否 | CLEAR | scope out（Phase 1）。lookup 経路追加 patch のみ |
| 8 | apps/web からの D1 直接アクセス侵入 | CLEAR | Phase 8 で `packages/shared` 配置を却下、apps/api 内 export に閉じる |

## GO 条件

- [x] AC-1〜AC-6 が Phase 7 AC マトリクスで全 PASS
- [x] Phase 4 verify suite（unit/contract/E2E/auth）が green を期待できる設計
- [x] Phase 6 異常系 8 ケース設計済
- [x] Phase 9 不変条件 #1/#5/#14 PASS 根拠付き
- [x] Phase 9 secret hygiene 7 項目すべて PASS
- [x] blocker 候補 #1〜#8 が CLEAR / CLEAR-PENDING

**現状: 全 GO 条件を満たす設計が完了済**

## NO-GO 条件（非該当）

- schema_aliases DDL に対する依存タスク（03a/07b）の破壊的変更
- `schema_questions` テーブル DDL 変更が新たに必須化
- `apps/web` から schema_aliases への直接アクセスが要件として浮上
- 移行期間 lookup 順序ルールで吸収不能なデータ整合性問題

**現状: いずれにも該当しない**

## リスクと対策

| リスク | 対策 |
| --- | --- |
| migration 番号衝突 | Phase 5 で PR 時点に `ls apps/api/migrations/` 再実行ステップ必須化 |
| 既存 07b endpoint URL 差分 | Phase 8「実 endpoint 正本」ルール、Phase 13 で grep 確認 |
| 03a sync lookup 性能劣化 | `idx_schema_aliases_stable_key` INDEX を Phase 2 DDL に含める。alias 行数 ~50 で full scan も問題なし（Phase 9 試算） |
| 移行期間長期化（fallback 廃止遅延） | Phase 12 で「fallback 廃止予告 + 後続 issue 起票」明記、半年以内ターゲット記録 |
| UNIQUE(alias_question_id) 衝突 | Phase 6 異常系で 422/409 ハンドリング、UI で「上書き or 拒否」は将来 issue |
| `resolved_by` 空 INSERT 事故 | repository で `resolvedBy` 必須化、auth ミドルから取得して service で詰める |
| lint rule 未組込のまま PR が通る | Phase 9 で `verify-invariants.yml` step 追加明記、Phase 13 PR テンプレで必須チェック化 |

## 判定

**判定: GO**

- 4 条件総合: PASS-MINOR
- blocker: 全 CLEAR / CLEAR-PENDING
- NO-GO 条件: 非該当
- 残作業: Phase 11 手動 smoke（NON_VISUAL evidence plan） / Phase 12 ドキュメント更新 / Phase 13 PR 作成

## 次 Phase（11: 手動 smoke）への引き渡し

- GO 判定、CLEAR-PENDING 2 件（migration 連番 / endpoint 差分）の最終確認手順、リスク登録簿
- 手動 smoke 対象: 「local D1 への migration apply」「07b POST 1 件 INSERT 動作」「03a fallback ヒット」の 3 シナリオ（実装着手後に収集する evidence plan として記録）
