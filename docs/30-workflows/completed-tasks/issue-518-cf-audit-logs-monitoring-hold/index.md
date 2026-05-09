# issue-518-cf-audit-logs-monitoring-hold - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | Cloudflare Audit Logs 自動監視の HOLD 化と週次手動確認運用への縮退 |
| GitHub Issue | #518（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #518, Refs #408`） |
| 親 Issue | #408（Cloudflare Audit Logs 監視 implementation） |
| 関連 Issue | #514, #515, #516 |
| 起票元 | docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md |
| 作成日 | 2026-05-07 |
| ステータス | implemented-local（Phase 10 / 11 / 13 は user / post-merge gate） |
| 総 Phase 数 | 13 |
| taskType | implementation（CI workflow 編集 + 削除 + 新規 runbook + 既存 docs 追記を伴う） |
| visualEvidence | NON_VISUAL（CI/CD + docs 編集タスクで UI 影響なし） |
| Wave | 1（独立。先行タスクなし。実装は単一サイクルで完了可能） |
| 優先度 | priority:low（Issue label に準拠） |
| 見積もり規模 | 小規模（YAML 1 編集 + YAML 1 削除 + 新規 runbook 1 + 既存 markdown 追記 1 + scripts は無編集保持） |

---

## 実装区分

`[実装区分: 実装仕様書]`

判定根拠（CONST_004 適用）:

- ユーザー指示は「Cloudflare Audit Logs 監視を保留し週次手動確認に縮退」という運用方針決定だが、目的達成には**既存 CI workflow の自動稼働を確実に停止する必要がある**。具体的には `.github/workflows/cf-audit-log-monitor.yml`（hourly cron `0 * * * *`）と `.github/workflows/cf-audit-log-monitor-watchdog.yml`（every 15min cron `15 * * * *`）が既に main にマージ済みで稼働中であり、ドキュメントを追加するだけでは GitHub Actions の自動実行は止まらない。
- したがって本タスクは「ドキュメント決定 + コード変更（YAML 編集 / 削除 / 新規 runbook 作成 / 親 spec 追記）」を伴う**実装仕様書**として作成する。
- CONST_005 必須項目（変更対象ファイル / シグネチャ相当 / 入出力 / テスト / ローカル実行 / DoD）はすべて埋める。`scripts/cf-audit-log/*.ts` 自体は**保持**するため関数シグネチャは「現状維持」を明記する形で扱う。

---

## 目的

Cloudflare Audit Logs を GitHub Actions で常時取得・分析・GH Issue 化する自動監視を**現時点では停止**し、運用負荷とパブリックリポジトリへの運用情報露出を回避する。代替として、必要時に `workflow_dispatch` または local 実行で手動確認できる経路は残し、再開条件が満たされた段階で速やかに自動監視へ復帰できる状態にする。

---

## スコープ

### 含む

- `.github/workflows/cf-audit-log-monitor.yml` の編集
  - `on.schedule` ブロック削除（hourly cron 停止）
  - `inputs.dry_run.default` を `false` → `true` に変更（手動起動時に既定で Issue 起票しない）
  - ヘッダコメントで HOLD 経緯と再開手順を明記
- `.github/workflows/cf-audit-log-monitor-watchdog.yml` 削除（schedule 停止により監視対象が消えるため不要）
- `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` 新規作成
  - 週次手動確認手順、`workflow_dispatch` 起動例、local 実行例、再開条件チェックリスト
- `docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` の Canonical Status 行に「HOLD（issue-518 / 週次手動運用へ縮退）」を 1 行追加
- 関連 GitHub Variables `CF_AUDIT_LAST_SUCCESS_AT` の取り扱い方針記述（runbook 内）
- aiworkflow-requirements skill への反映必要性は Phase 12 で判定（必要時のみ）

### 含まない

- `scripts/cf-audit-log/*.ts` 本体および `__tests__/*` の編集（保持して再利用可能にする）
- D1 schema migration の rollback（cf-audit-log 系テーブルは保持）
- Cloudflare 側 Token revoke / rotation（HOLD 中も既存 Token は保持。token misuse 兆候時に別タスクで対応）
- Slack 通知 / ML 異常検知 / cold storage / GitHub audit log 相関の新規導入
- Issue #518 の再 OPEN（CLOSED 維持）
- 親 Issue #408 関連実装の rollback（HOLD 期間中も local 資産として保持）

---

## 受入条件（AC）

- AC-1: `.github/workflows/cf-audit-log-monitor.yml` の `on.schedule` ブロックが削除されており、`workflow_dispatch` のみ残っている
- AC-2: `.github/workflows/cf-audit-log-monitor.yml` の `inputs.dry_run.default` が `true` に変更されている
- AC-3: `.github/workflows/cf-audit-log-monitor.yml` の冒頭コメントに HOLD 経緯（Issue #518 参照）と再開手順が記述されている
- AC-4: `.github/workflows/cf-audit-log-monitor-watchdog.yml` が削除されている（`git status` で `deleted` 表示）
- AC-5: `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` が新規作成され、週次手動確認手順 / `workflow_dispatch` 経由の起動例 / local 実行例 / 再開条件チェックリストが含まれる
- AC-6: `docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` の Canonical Status 節に HOLD 反映行が追記されている
- AC-7: `pnpm typecheck` / `pnpm lint` が PASS
- AC-8: `pnpm --filter @repo/scripts test:run -- scripts/cf-audit-log` 等の既存 cf-audit-log テストが PASS（scripts 本体は無編集のため regression なし）
- AC-9: `actionlint .github/workflows/cf-audit-log-monitor.yml` が PASS（schedule 削除後の YAML 妥当性）
- AC-10: GitHub Actions の `cf-audit-log-monitor` schedule run が次の hourly tick 以降に新規発火しない（merge 後 1 時間以内に観測。Phase 11 runtime evidence で確認）

---

## Phase 一覧

| Phase | タイトル | 概要 | 種別 |
| --- | --- | --- | --- |
| 1 | 要件定義 | Issue #518 要件の分解、taskType / visualEvidence 確定、既存実装サーベイ | 設計 |
| 2 | 全体設計（HOLD 戦略選定） | A: 全削除 / B: schedule 削除＋scripts 保持 / C: if:false の比較と採用案決定 | 設計 |
| 3 | 詳細設計（変更ファイル / 差分方針 / runbook 章立て） | 変更対象ファイル一覧、差分仕様、runbook 章立てを確定 | 設計 |
| 4 | 環境準備 | ブランチ整合 / lefthook / actionlint / pnpm install 確認 | 実装 |
| 5 | 実装: cf-audit-log-monitor.yml 編集 | schedule 削除 / dry_run default 変更 / コメント追記 | 実装 |
| 6 | 実装: cf-audit-log-monitor-watchdog.yml 削除 | watchdog YAML 削除と git rm | 実装 |
| 7 | 実装: 週次手動確認 runbook 新規作成 | runbooks/ 配下に新規 markdown 作成 | 実装 |
| 8 | 実装: 親 spec 追記 | completed-tasks 配下の親 spec に HOLD 反映行追記 | 実装 |
| 9 | テスト / 静的検証 | actionlint / typecheck / lint / 既存テスト regression | 検証 |
| 10 | 統合検証（dry-run 起動） | `workflow_dispatch` を `dry_run=true` で発火し Issue 起票されないこと確認 | 検証 |
| 11 | runtime evidence（schedule 停止確認） | merge 後 1 時間で hourly tick が発火しないことを `gh run list` で確認 | 検証 |
| 12 | ドキュメント / aiworkflow-requirements 反映 | 実装ガイド / 未タスク検出 / skill feedback / compliance | docs |
| 13 | PR 作成（commit / push / PR） | `Refs #518, Refs #408` の PR 作成 | 完了 |

---

## 依存・関連

| 種別 | 対象 | 関係 |
| --- | --- | --- |
| 親 | Issue #408 / `docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` | 監視実装本体（HOLD 対象） |
| 関連 | #514, #515, #516 | Cloudflare token 関連 follow-up（本タスクとは独立） |
| 上流 | なし | 単独で実装可能 |
| 下流 | 再開時に新規 Issue を起票（再開条件成立時） | 本タスクは HOLD 状態の確立まで |

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| schedule 削除を忘れ、hourly cron が継続稼働 | GitHub Actions free minutes 消費継続 | AC-1 / AC-10 で二重チェック（YAML 静的確認 + runtime gh run list） |
| watchdog YAML 削除漏れで stale Issue が発火 | 公開リポジトリに監視 Issue が残るリスクの再現 | AC-4 / Phase 6 で `git rm` を必須手順化 |
| dry_run default 変更漏れで手動起動時に Issue 起票 | 公開 Issue 露出 | AC-2 / Phase 5 で workflow file diff で確認 |
| `scripts/cf-audit-log/*` 関連テストが workflow 削除に依存して FAIL | regression | scripts 本体は無編集。テストも YAML を直接参照しないことを Phase 9 で確認 |
| 再開時の手順が runbook に欠落 | 再開オペレーションで迷走 | AC-5 / Phase 7 で再開条件チェックリストと restore 手順を runbook に明記 |

---

## 参考

- task-specification-creator skill: `.claude/skills/task-specification-creator/`
- aiworkflow-requirements skill: `.claude/skills/aiworkflow-requirements/`
- 親 spec: `docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md`
- 同形式リファレンス: `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`
