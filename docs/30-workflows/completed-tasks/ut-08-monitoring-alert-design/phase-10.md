# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 名称 | 最終レビュー |
| タスク | UT-08 モニタリング/アラート設計 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 状態 | completed |
| GitHub Issue | #10（CLOSED） |
| タスク種別 | design / non_visual / spec_created |

---

## 目的

AC-1〜AC-11 の充足を最終確認し、Phase 11（手動 smoke テスト）以降に進めるかを GO / NO-GO で判定する。
本タスクは設計タスクのため、判定対象は**設計成果物の網羅性・整合性・運用性**であり、実装結果は対象外。

> Phase 10 を通過しなければ Phase 11 以降には進まない。NO-GO 時は差し戻し先 Phase を明示する。

---

## 実行タスク

- [ ] AC-1〜AC-11 の充足判定を行い、各 AC に証跡パスを紐付ける
- [ ] Phase 1〜9 の成果物が全て `outputs/` に配置されていることを確認する
- [ ] 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終評価を行う
- [ ] GO / NO-GO 判定基準に照らして最終判定する
- [ ] MINOR 指摘事項を未タスク化方針として記録する（Phase 12 Task 4 で formalize）
- [ ] `outputs/phase-10/go-nogo-decision.md` を作成する

---

## AC 充足チェックリスト

| AC | 内容 | 証跡パス | 担当 Phase | 状態 |
| --- | --- | --- | --- | --- |
| AC-1 | メトリクス一覧 | outputs/phase-02/metric-catalog.md | 2 | PASS / FAIL |
| AC-2 | WARNING / CRITICAL 閾値・根拠 | outputs/phase-02/alert-threshold-matrix.md | 2 | PASS / FAIL |
| AC-3 | 通知チャネル設計・Secret 取り扱い方針 | outputs/phase-02/notification-design.md | 2 | PASS / FAIL |
| AC-4 | 外部監視ツール選定評価 | outputs/phase-02/external-monitor-evaluation.md | 2 | PASS / FAIL |
| AC-5 | WAE 計装ポイント | outputs/phase-02/wae-instrumentation-plan.md | 2 | PASS / FAIL |
| AC-6 | 05a runbook 差分計画 | outputs/phase-02/runbook-diff-plan.md | 2 | PASS / FAIL |
| AC-7 | 失敗検知ルール（D1 / Sheets→D1） | outputs/phase-02/failure-detection-rules.md | 2 | PASS / FAIL |
| AC-8 | 監視設計総合まとめ | outputs/phase-02/monitoring-design.md | 2 | PASS / FAIL |
| AC-9 | 設計レビュー結果 | outputs/phase-03/design-review.md | 3 | PASS / FAIL |
| AC-10 | 05a 整合性 smoke チェック | outputs/phase-11/manual-smoke-log.md | 11 | 後続 Phase で確定 |
| AC-11 | 追加 Secret 一覧 | outputs/phase-02/secret-additions.md | 2 | PASS / FAIL |

> AC-10 は Phase 11 で確定するため、Phase 10 時点では「Phase 11 実施準備完了」を判定基準とする。

---

## Phase 1〜9 完了確認

| Phase | 名称 | 主成果物 | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | outputs/phase-01/requirements.md | completed |
| 2 | 設計 | outputs/phase-02/（9 種） | completed |
| 3 | 設計レビュー | outputs/phase-03/design-review.md | completed |
| 4 | テスト計画・事前検証 | outputs/phase-04/test-plan.md / pre-verify-checklist.md | completed |
| 5 | 実装計画書化 | outputs/phase-05/implementation-plan.md | completed |
| 6 | 異常系検証計画 | outputs/phase-06/failure-case-matrix.md | completed |
| 7 | 検証項目網羅性 | outputs/phase-07/ac-traceability-matrix.md | completed |
| 8 | 設定 DRY 化 | outputs/phase-08/refactoring-log.md | completed |
| 9 | 品質保証 | outputs/phase-09/quality-checklist.md | completed |

---

## 4 条件の最終評価

| 条件 | 評価観点 | 判定基準 | 判定 |
| --- | --- | --- | --- |
| 価値性 | 監視設計が Wave 2 実装タスクの開始要件を満たし、05a 既存設計と矛盾せず自動監視を追加できる | AC-1〜AC-8 が PASS | PASS / CONDITIONAL / FAIL |
| 実現性 | 無料枠範囲（Cloudflare 無料 / UptimeRobot 無料）で全設計が実現可能 | AC-2 / AC-4 / AC-11 が PASS | PASS / CONDITIONAL / FAIL |
| 整合性 | 05a runbook を上書きせず差分追記方針が確立、不変条件 1〜5 を逸脱しない | AC-6 / 不変条件チェック | PASS / CONDITIONAL / FAIL |
| 運用性 | アラート疲れ抑止（WARNING 中心初期運用）・Secret 1Password 管理・runbook 差分が運用継承可能 | AC-2 / AC-3 / AC-11 / 不変条件 3, 4 | PASS / CONDITIONAL / FAIL |

---

## GO / NO-GO 判定基準

**GO 条件（全て満たす）**

- [ ] AC-1〜AC-9 / AC-11 が全て PASS（AC-10 は Phase 11 で確定）
- [ ] Phase 1〜9 の全成果物が outputs に配置済み
- [ ] 4 条件全てが PASS または CONDITIONAL（CONDITIONAL は条件文書化済み）
- [ ] Phase 8 で確定した SSOT が Phase 9 で逸脱なしと確認済み
- [ ] Phase 9 の品質チェック 5 観点が全て PASS
- [ ] 不変条件 1〜5 を逸脱する設計判断が存在しない

**NO-GO 条件（いずれかに該当）**

- 必須 AC のいずれかが FAIL
- Phase 9 の品質チェックで FAIL がある
- 05a 既存ファイルを上書きする設計が混入（不変条件 1 違反）
- 有料 SaaS 前提の設計（不変条件 2 違反）

---

## blocker 一覧テンプレート

```markdown
## blocker（NO-GO の場合に記載）

| # | blocker 内容 | 影響 AC | 差し戻し先 Phase | 修正方針 |
| --- | --- | --- | --- | --- |
| 1 | （例）alert-threshold-matrix.md に WARNING 閾値の根拠記載なし | AC-2 | Phase 2 | 「無料枠の何 % で WARNING 発報するか」の根拠を追記 |
```

---

## MINOR 指摘の未タスク化方針

| 種別 | 取り扱い |
| --- | --- |
| MAJOR / blocker | 即 NO-GO とし差し戻す |
| MINOR（機能影響なし） | **Phase 12 Task 4 で `unassigned-task-detection.md` に formalize する** |
| 改善余地（任意） | Phase 12 Task 5 の `skill-feedback-report.md` に記録 |

> 「機能に影響なし」は MINOR を未タスク化しない理由にならない（SKILL.md「よくある漏れ」遵守）。

---

## 統合テスト連携

本タスクは spec_created / non_visual の設計タスクであり、この Phase では実装コード・外部監視設定・Secret 投入を実行しない。統合テスト連携は、後段 Wave 2 実装タスクが本 Phase の成果物を入力として実行する。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| 後段 Wave 2 実装タスク | WAE 計装、外形監視設定、通知疎通、D1 / Sheets 失敗検知テスト | 設計・検証観点を定義し、実行は委譲 |
| UT-09 | Sheets→D1 同期失敗検知ルール | UT-09 完了後に閾値とイベント名を再確認 |
| UT-07 | 通知基盤との接続 | 通知チャネル候補として参照し、実装は UT-07 / 後段タスクで確認 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | AC 定義の正本 |
| 必須 | outputs/phase-07/ac-traceability-matrix.md | AC 充足の証跡 |
| 必須 | outputs/phase-09/quality-checklist.md | 品質チェック結果 |
| 必須 | .claude/skills/task-specification-creator/references/review-gate-criteria.md | レビューゲート基準 |
| 必須 | .claude/skills/task-specification-creator/references/unassigned-task-guidelines.md | MINOR 未タスク化ルール |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-nogo-decision.md | GO / NO-GO 判定書（AC 充足表 + 4 条件評価 + blocker 一覧 + MINOR 未タスク化方針） |

### `outputs/phase-10/go-nogo-decision.md` の必須記載項目

```markdown
# GO / NO-GO 判定

## 判定結果
- 判定: GO / NO-GO
- 判定日: 2026-XX-XX
- 判定者: <担当者名>

## AC 充足表
（AC-1〜AC-11 の各項目について PASS / FAIL と証跡パス）

## Phase 1〜9 完了確認
（各 Phase の状態）

## 4 条件評価
（価値性 / 実現性 / 整合性 / 運用性）

## blocker 一覧
（NO-GO の場合のみ）

## MINOR 指摘の未タスク化方針
（Phase 12 Task 4 への引き継ぎ項目）

## Phase 11 実施準備
- AC-10 確定のための smoke テスト準備状況
```

---

## 完了条件

- [ ] AC-1〜AC-11 の充足判定が記録されている（AC-10 は Phase 11 引き継ぎ）
- [ ] 4 条件評価が記録されている
- [ ] GO / NO-GO 判定が明示されている
- [ ] NO-GO の場合、blocker と差し戻し先 Phase が記載されている
- [ ] MINOR 指摘の未タスク化方針が Phase 12 へ引き継がれている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-10 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次 Phase: 11（手動 smoke テスト・NON_VISUAL）
- 引き継ぎ: `outputs/phase-10/go-nogo-decision.md` の GO 判定を Phase 11 開始の前提条件とする
- ブロック条件: NO-GO の場合は Phase 11 に進まず差し戻し先 Phase で修正後に再レビュー
