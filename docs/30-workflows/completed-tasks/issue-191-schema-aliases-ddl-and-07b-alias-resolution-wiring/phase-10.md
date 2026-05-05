# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー（GO/NO-GO 判定 / blocker 一覧） |
| Wave | 3 |
| Mode | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 9（品質保証） |
| 次 Phase | 11（手動 smoke） |
| 状態 | spec_created |
| GitHub Issue | #191（CLOSED） |

## 目的

Phase 1〜9 の成果物を集約し、4 条件（価値性 / 実現性 / 整合性 / 運用性）と blocker 候補を全件評価し、Phase 11 以降（手動 smoke / docs / PR）に進めるかどうかの GO/NO-GO 判定を確定する。

## 4 条件評価（最終）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 03a 冪等性維持・出自追跡・07b 単独テスト性を構造的に獲得（Phase 1 / Phase 3） |
| 実現性 | PASS | DDL 1 本 + repository 1 個 + 既存 07b/03a への配線変更で完了（Phase 2 / Phase 5 ランブック実行手順が確定） |
| 整合性 | PASS | 不変条件 #1 / #5 / #14 すべて PASS（Phase 9 再点検済） |
| 運用性 | PASS-MINOR | 移行期間中の二重 source（aliases + schema_questions fallback）が存在するが、lookup 順序固定 + Phase 12 fallback 廃止予告で吸収 |

総合: **PASS-MINOR**（GO 条件への影響なし）

## blocker 候補チェック

| # | 候補 | 状態 | 根拠 |
| --- | --- | --- | --- |
| 1 | schema_aliases DDL レビュー | CLEAR | Phase 2 で 8 カラム / UNIQUE / INDEX 確定、Phase 3 で alternative 比較済 |
| 2 | 03a 互換 path（fallback 動作）テスト | CLEAR | Phase 4 verify suite に fallback テストケース設計済（AC-6） |
| 3 | 07b INSERT 配線（schema_questions 直接更新の根絶） | CLEAR | Phase 8 で削除候補一覧、Phase 9 lint rule で恒常化 |
| 4 | fallback 動作（aliases miss → schema_questions hit） | CLEAR | Phase 2 lookup 順序 pseudo code、Phase 4 / 6 でテスト設計 |
| 5 | migration 番号衝突 | CLEAR-PENDING | Phase 5 ランブックで `apps/api/migrations/` の最大連番を確認し +1 を採用するルール明記、実 PR 時に再確認 |
| 6 | 既存 07b endpoint URL の差分 | CLEAR-PENDING | Phase 8 で「実 endpoint を正本として After を合わせる」運用ルール確定。Phase 13 PR 時に最終確認 |
| 7 | 03a の sync 本体ロジック改修要否 | CLEAR | scope out（Phase 1 で確定）。本タスクは lookup 経路追加 patch のみ |
| 8 | apps/web からの D1 直接アクセス侵入 | CLEAR | Phase 8 で `packages/shared` 配置を明示却下、`apps/api` 内 export に閉じる |

## GO 条件

以下すべてを満たした時点で GO とする:

- [ ] AC-1〜AC-6 が Phase 7 AC マトリクスで全 PASS（自動 / 手動の検証手段が確定）
- [ ] Phase 4 verify suite（unit / contract / E2E / authorization）が green を期待できる設計
- [ ] Phase 6 異常系（401/403/404/422/5xx/UNIQUE 衝突 / fallback miss）の case 設計済
- [ ] Phase 9 不変条件 #1 / #5 / #14 が PASS 根拠付きで記録
- [ ] Phase 9 secret hygiene チェックリスト 7 項目すべて PASS
- [ ] blocker 候補 #1〜#8 がすべて CLEAR または CLEAR-PENDING（PENDING は実 PR 時に確認手順が runbook 化されていれば許容）

**現状: 全 GO 条件を満たす設計が完了済**

## NO-GO 条件

以下のいずれかに該当した場合 NO-GO とし、Phase 1 に差し戻す:

- schema_aliases DDL に対する依存タスク（03a / 07b）の破壊的変更が必要になった場合
- `schema_questions` テーブルの DDL 変更が新たに必須になった場合（scope out 違反）
- `apps/web` から `schema_aliases` への直接アクセスが要件として浮上した場合（不変条件 #5 違反）
- 移行期間中の lookup 順序ルールでは吸収不能なデータ整合性問題が発覚した場合

**現状: NO-GO 条件のいずれにも該当しない**

## リスクと対策

| リスク | 対策 |
| --- | --- |
| migration 番号衝突（同時 PR で別 issue が同連番を採用） | Phase 5 ランブックで PR 時点に `ls apps/api/migrations/` を再実行して連番再確認するステップを必須化 |
| 既存 07b endpoint と After 設計の URL 差分 | Phase 8 で「実 endpoint 正本」ルール明記、Phase 13 で grep 確認 |
| 03a sync の lookup 性能劣化 | `idx_schema_aliases_stable_key` INDEX を Phase 2 DDL に含める。alias 行数 ~50 上限想定で full table scan でも問題なし（Phase 9 試算） |
| 移行期間長期化（fallback 廃止が遅れる） | Phase 12 で「fallback 廃止予告 + 後続 issue 起票」を明記、半年以内をターゲットに記録 |
| UNIQUE(alias_question_id) 制約衝突（同一 question_id への 2 重 alias） | Phase 6 異常系で 422 ハンドリング設計、UI で「上書き or 拒否」の選択肢を将来 issue で扱う |
| `resolved_by` の admin user id が空のまま INSERT される事故 | repository 層で `resolvedBy` 必須引数化、auth ミドルウェアから取得して service 層で詰める |
| lint rule 未組込のまま PR が通る可能性 | Phase 9 で `verify-invariants.yml` に step 追加を明記、Phase 13 PR テンプレで必須チェック化 |

## 判定

**判定: GO**

- 4 条件総合: PASS-MINOR
- blocker 候補: 全 CLEAR / CLEAR-PENDING
- NO-GO 条件: 非該当
- 残作業: Phase 11 手動 smoke（D1 migration apply 確認） / Phase 12 ドキュメント更新 / Phase 13 PR 作成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | GO/NO-GO 判定本体 |
| 補助 | outputs/phase-10/blocker-checklist.md | blocker 候補 #1〜#8 の詳細 |
| 補助 | outputs/phase-10/risk-register.md | リスクと対策の登録簿 |

## 実行タスク

- [ ] 本 Phase の目的に対応する仕様判断を本文に固定する
- [ ] docs-only / spec_created 境界を崩す実行済み表現がないことを確認する
- [ ] 次 Phase が参照する入力と出力を明記する

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] 4 条件評価が再記載され PASS-MINOR 以上
- [ ] blocker 候補 8 件すべての状態が CLEAR / CLEAR-PENDING
- [ ] GO 条件 6 項目を充足する設計が確認済
- [ ] NO-GO 条件に該当しないことを明記
- [ ] リスクと対策が 2 列形式で 5 件以上
- [ ] 判定が GO / NO-GO のいずれかで明示
- [ ] artifacts.json の phase 10 が `spec_created`

## 参照資料

- 必須: `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- 上流: phase-01.md（4 条件原案）/ phase-03.md（alternative 比較）/ phase-07.md（AC マトリクス）/ phase-09.md（不変条件再点検）

## 次 Phase への引き渡し

- 引き継ぎ事項: GO 判定、CLEAR-PENDING 2 件（migration 連番 / endpoint 差分）の最終確認手順、リスク登録簿
- blocker: なし
- Phase 11 入力: 手動 smoke 対象は「local D1 への migration apply」「07b POST 1 件 INSERT 動作」「03a fallback ヒット」の 3 シナリオ
