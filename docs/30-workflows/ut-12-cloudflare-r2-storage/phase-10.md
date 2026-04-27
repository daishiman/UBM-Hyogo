# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-27 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test / NON_VISUAL) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |

## 目的

Phase 1〜9 の成果物を総合評価し、AC-1〜AC-8 の完全充足判定と、BLOCKER / MAJOR / MINOR 区分での指摘記録を行う。MINOR 指摘は未タスク化（Phase 12 Task 4 の unassigned-task-detection へ橋渡し）とし、Phase 11 進行可否（PASS / RETURN）を決定する。

## 参照資料（前提成果物）

- Phase 3: design-review.md / review-decision.md
- Phase 7: ac-matrix.md
- Phase 8: refactor-decisions.md / dry-applied-diff.md
- Phase 9: qa-checklist.md / qa-result.md

## 成果物（出力一覧）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/final-review.md | AC 充足判定・指摘区分・代替案再検討記録 |
| ドキュメント | outputs/phase-10/review-decision.md | PASS / RETURN 判定と Phase 11 進行可否 |
| メタ | artifacts.json | Phase 状態の更新 |

> 上記成果物の実体ファイルは Phase 10 実行時に作成する。本 phase 仕様書では作成しない。

## 実行タスク（チェックボックス）

- [ ] AC-1〜AC-8 を Phase 7 / Phase 9 の成果物と突合し充足判定を行う
- [ ] BLOCKER / MAJOR / MINOR の区分で指摘を記録する
- [ ] MINOR 指摘の未タスク化判定を行う（Phase 12 Task 4 への橋渡し）
- [ ] 4条件評価（価値性 / 実現性 / 整合性 / 運用性）を再評価する
- [ ] PASS / RETURN 判定を文書化する
- [ ] BLOCKER / MAJOR がある場合は対応 Phase を特定して差し戻し決定を下す

## 実行手順

### ステップ 1: AC 完全充足の最終判定

- Phase 7 の AC matrix を読み、AC-1〜AC-8 ごとに証跡パスと判定状況を確認する
- Phase 9 の qa-result.md を参照し、構文検証 / secret hygiene / 線数判定が全 PASS であることを確認する
- 不足 AC があれば対応 Phase（差し戻し先）を特定する

### ステップ 2: 指摘区分（BLOCKER / MAJOR / MINOR）

- BLOCKER: 上流タスク未完了 / 機密情報直書き / 本タスク継続不能 → NO-GO
- MAJOR: 設計の根本見直し（Phase 2 差し戻し）→ RETURN
- MINOR: 軽微な指摘 / Phase 12 で implementation-guide に反映可能 → PASS（条件付き）
- 各指摘に「指摘 ID / 内容 / 対応 Phase / 判定区分」を付与する

### ステップ 3: MINOR の未タスク化判定

- MINOR 指摘について、本タスク内で解消するか / 未タスク化するかを判定
- 未タスク化対象は Phase 12 Task 4（unassigned-task-detection.md）に橋渡しする
- 0 件でも「MINOR 指摘 0 件」と明記する

### ステップ 4: 4条件再評価と進行可否決定

- 価値性 / 実現性 / 整合性 / 運用性を Phase 1 / Phase 3 の評価から最新化
- PASS / RETURN を最終決定し review-decision.md に記録

## 4条件最終評価【必須】

| 条件 | 評価観点 | 根拠 Phase | 判定 |
| --- | --- | --- | --- |
| 価値性 | 将来のファイルアップロード実装が「設計待ち」で止まらないか | Phase 1, 2, 3 | TBD |
| 実現性 | 無料枠（10GB / Class A 1,000万 / Class B 1億）内で運用可能か | Phase 2, 3, 9 | TBD |
| 整合性 | 01b 命名・04 secret 経路・UT-16 / UT-16 と矛盾しないか | Phase 7, 8, 9 | TBD |
| 運用性 | Token rotation / CORS 再設定 / バケット rollback が runbook に存在するか | Phase 5, 6, 9 | TBD |

## AC 完全充足判定【必須】

| AC | 内容 | 証跡パス | 判定 |
| --- | --- | --- | --- |
| AC-1 | バケット命名 (`ubm-hyogo-r2-{prod,staging}`) | outputs/phase-05/r2-setup-runbook.md / outputs/phase-08/refactor-decisions.md | TBD |
| AC-2 | wrangler.toml `[[r2_buckets]]` | outputs/phase-02/wrangler-toml-diff.md / outputs/phase-08/dry-applied-diff.md | TBD |
| AC-3 | API Token スコープ（最小権限） | outputs/phase-02/token-scope-decision.md | TBD |
| AC-4 | smoke test（手動） | outputs/phase-11/manual-smoke-log.md（次 Phase で確定） | TBD |
| AC-5 | CORS 設定 JSON | outputs/phase-02/cors-policy-design.md / outputs/phase-08/dry-applied-diff.md | TBD |
| AC-6 | 無料枠モニタリング方針 + UT-17 連携 | outputs/phase-02/r2-architecture-design.md（モニタリング章） | TBD |
| AC-7 | バケット名・バインディング名の下流向け公開 | outputs/phase-05/binding-name-registry.md | TBD |
| AC-8 | パブリック / プライベート選択基準 + UT-17 連携 | outputs/phase-02/r2-architecture-design.md（アクセス方針章） | TBD |

## 指摘区分テーブル【必須】

| 指摘 ID | 内容 | 区分 | 対応 Phase | 未タスク化 |
| --- | --- | --- | --- | --- |
| TBD-01 | 例: AllowedOrigins 暫定値（UT-16 完了後に再設定要） | MINOR | Phase 12 implementation-guide | する/しない |
| TBD-02 | 例: UT-17 未着手で通知経路が未確定 | MINOR | Phase 12 unassigned-task-detection | する |

> MINOR 0 件の場合も「MINOR 指摘 0 件」と明記する。

## PASS / RETURN 判定【必須】

| 判定項目 | 基準 | 判定 |
| --- | --- | --- |
| AC-1〜AC-8 全件 | 充足判定 PASS | TBD |
| 4条件 | 全 PASS | TBD |
| BLOCKER 有無 | なし | TBD |
| MAJOR 有無 | なし | TBD |
| MINOR の未タスク化整合 | Phase 12 Task 4 で記録される予定 | TBD |

**最終判定: TBD（PASS / RETURN）**

> PASS 条件: 上記全項目が PASS であること。  
> RETURN の場合: 対応 Phase を特定し差し戻す（Phase 2 / Phase 5 / Phase 8 等）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 1〜9 | 全成果物を最終評価の根拠とする |
| Phase 11 | PASS 判定後に手動 smoke test 手順設計を実施 |
| Phase 12 | MINOR 指摘の未タスク化結果を unassigned-task-detection.md に反映 |

## 多角的チェック観点

- 価値性: docs-only として後続タスク（ファイルアップロード実装）の起動コストを下げる構造になっているか
- 実現性: 無料枠制約が成果物全体で一貫して扱われているか
- 整合性: 上流（01b / 04）と下流（UT-16 / UT-16 / 将来実装）の引き継ぎが矛盾なく揃っているか
- 運用性: 新メンバーが Phase 5 runbook + Phase 11 smoke test のみで R2 を再現できるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | AC 完全充足判定 | 10 | pending |
| 2 | BLOCKER / MAJOR / MINOR 区分付与 | 10 | pending |
| 3 | MINOR 未タスク化判定 | 10 | pending |
| 4 | 4条件再評価 | 10 | pending |
| 5 | PASS / RETURN 判定 | 10 | pending |
| 6 | review-decision.md 作成 | 10 | pending |

## 完了条件（受入条件 + AC 紐付け）

- [ ] AC-1〜AC-8 の判定が全て TBD でない（AC 共通）
- [ ] BLOCKER / MAJOR がない（または差し戻し決定が記録されている）
- [ ] MINOR 指摘の未タスク化方針が明記されている
- [ ] 4条件が全 PASS（または差し戻し記録）
- [ ] PASS / RETURN 判定が文書化されている

## レビューポイント / リスク / 落とし穴

- AC-4（smoke test）は Phase 11 で確定するため、本 Phase では「Phase 11 で確定予定」を明記
- MINOR 指摘の未タスク化を判断する際、対応コストと放置コストの双方を比較する
- AllowedOrigins の暫定値は MINOR 候補として常に挙がるため、対応窓口を Phase 12 implementation-guide に固定
- BLOCKER 検出時は本タスク全体を保留し、上流タスクの完了を待つ判断を行う

## 次フェーズへの引き渡し

- 次: 11 (手動 smoke test / NON_VISUAL)
- 引き継ぎ事項: PASS / RETURN 判定 / AC 充足判定 / MINOR 未タスク化リスト / 4条件評価結果
- ブロック条件: PASS 判定が得られていない場合は Phase 11 に進まない（RETURN は対応 Phase に差し戻し）
