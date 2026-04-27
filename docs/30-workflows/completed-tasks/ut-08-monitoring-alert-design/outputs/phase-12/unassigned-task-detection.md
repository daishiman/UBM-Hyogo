# 未タスク検出レポート — UT-08

## 検出日: 2026-04-27
## 検出者: delivery（自走）
## 元データ: Phase 10 §7 MINOR 6 件 + Phase 11 結果 + Phase 1〜9 のスコープ外項目

> SKILL.md「`unassigned-task-detection.md` は 0 件でも必ず出力」遵守。本タスクは **0 件ではない**ため、current ブロックと baseline ブロックを分離して記録する。

---

## current（本タスク Phase 内で発生したもの）

| # | 内容 | 優先度 | 推奨アサイン先 | 発見 Phase | formalize 状態 |
| --- | --- | --- | --- | --- | --- |
| 1 | **Wave 2 実装タスク群（UT-08 implementation）** — WAE 計装コード（`apps/api/src/observability/wae.ts`）・Hono middleware 連携・D1 wrapper 連携・Cron handler 連携・アラートワーカー実装・Slack/Email 配信・UptimeRobot Monitor 設定・Secret 投入を別 UT として起票 | HIGH | `docs/30-workflows/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md` | Phase 5 implementation-plan.md / Phase 12 implementation-guide.md | **起票済** |
| 2 | **05a outputs 個別ファイル生成タスク** — 05a 自身のワークフローで `outputs/phase-02/observability-matrix.md` / `outputs/phase-05/cost-guardrail-runbook.md` を生成（M-01 と統合） | MEDIUM | 05a 担当タスク or 新規 UT | Phase 11 link-checklist.md §4 / 05a 自身 | **未起票**（baseline #1 と統合管理） |
| 3 | **WAE 無料枠の最終確認**（保存期間・data points 上限）— Wave 2 実装着手直前に Cloudflare 公式で再確認（M-02） | MEDIUM | Wave 2 実装担当（着手前タスク） | Phase 1 §未決事項 / Phase 10 §7 M-02 | **本書で formalize 済**（current #3） |
| 4 | **アラート閾値の月次レビュー運用化**（MINOR-02）— 毎月 1 営業日に閾値見直しサイクルを実行 | LOW | 運用担当 | refactoring-log.md §3 #14 | **本書 + implementation-guide.md §2.9 で formalize 済** |
| 5 | **Email 月次到達確認の運用化**（MINOR-03）— 毎月 1 営業日に CRITICAL 経路テストメール送信 | LOW | 運用担当 | refactoring-log.md §3 #15 | **本書 + implementation-guide.md §2.9 で formalize 済** |

---

## baseline（既存課題から再確認したもの）

| # | 内容 | 元タスク | 現状 |
| --- | --- | --- | --- |
| 1 | UT-07（通知基盤）との接続設計 — Slack 一次 / Email サブの MVP 構成は確定したが、UT-07 の通知基盤完成後に経路統合を再評価 | UT-08 スコープ外 | UT-07 着手時に再評価（system-spec-update-summary.md Step 1-C） |
| 2 | 05a outputs 個別ファイル（observability-matrix.md / cost-guardrail-runbook.md）の実体生成 — UT-08 から参照されているが 05a 自身のワークフローで生成される責務 | 05a parallel observability | M-01（Phase 10 §7）として認識済。05a ワークフロー側で対応 |
| 3 | UT-13（認証実装）との `auth.fail` イベント整合 — wae-instrumentation-plan.md §2 で任意イベントとして定義 | UT-13 仕様確認後に決定 | MINOR、Wave 2 実装で UT-13 と整合確認 |
| 4 | UT-09（Sheets→D1 同期ジョブ実装）の Cron 間隔確定 — `failure-detection-rules.md §3.2` 連続失敗判定窓 | UT-09 完了後 | UT-09 完了後に Phase 4 / failure-detection-rules.md 再確認 |

---

## Phase 10 MINOR 指摘の取扱い

| MINOR ID | 指摘内容 | 未タスク化判定 | formalize 先 |
| --- | --- | --- | --- |
| M-01 | 05a 個別ファイル（observability-matrix.md / cost-guardrail-runbook.md）の実体存在確認 | **未タスク化必要**（baseline #2） | 本書 baseline #2 / documentation-changelog.md（Phase 11 PASS 記録） |
| M-02 | WAE 無料枠（保存期間 / 月次書込上限）の最終確認 | **未タスク化必要**（current #3） | 本書 current #3 / implementation-guide.md §2.9 Wave 2 着手チェックリスト / UT-08-IMPL 実装前ゲート |
| M-03 | `.gitignore` 実機確認 | **不要**（既存除外パターンに `.dev.vars` 系含まれることを Phase 10 で RESOLVED 確認済） | RESOLVED（対応不要、本書記載のみ） |
| MINOR-01 | phase-12.md 380 行（300 行上限超過、意味的分割不可） | **未タスク化必要**（skill-feedback-report.md へ） | skill-feedback-report.md（task-specification-creator スキル提案） |
| MINOR-02 | アラート閾値の月次見直しサイクル正式化 | **未タスク化必要**（current #4） | 本書 current #4 / implementation-guide.md §2.9 |
| MINOR-03 | メール月次到達確認の運用化 | **未タスク化必要**（current #5） | 本書 current #5 / implementation-guide.md §2.9 |

> 「機能影響なし」を未タスク化しない理由にしない（SKILL.md「よくある漏れ」遵守）。M-03 のみ Phase 10 で実機確認済の RESOLVED 扱い、それ以外 5 件は全て本書 / implementation-guide.md / skill-feedback-report.md のいずれかに formalize 済。

---

## Wave 2 引き渡し事項（implementation-guide.md §2.9 と整合）

- Wave 2 実装着手前に M-02（WAE 無料枠再確認）を完了
- UT-08-IMPL の実装前ゲートとして、05a outputs 生成・UT-09 Cron 契約・UT-07 通知経路・UT-13 `auth.fail` 採否を確認
- Wave 2 実装着手前に Secret 投入（`secret-additions.md §3`）
- Wave 2 実装末尾で 05a runbook への追記 PR を別タスクで作成（または 05a 側で吸収）
- Wave 2 完了後、安定運用判断に従い CRITICAL 通知有効化（`alert-threshold-matrix.md §1`）

---

## 集計

| 区分 | 件数 |
| --- | --- |
| current（本タスク発生） | 5 |
| baseline（既存課題再確認） | 4 |
| Phase 10 MINOR formalize 済 | 5（M-03 は RESOLVED） |
| 0 件記載 | 該当なし（**未タスクは 9 件あり**） |

> 0 件の場合の記載例は本書では適用されない。9 件全件を current / baseline で分離して記録した。
