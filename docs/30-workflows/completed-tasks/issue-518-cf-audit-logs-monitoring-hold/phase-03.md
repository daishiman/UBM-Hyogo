# Phase 3: 詳細設計（変更ファイル / 差分方針 / runbook 章立て）

`[実装区分: 実装仕様書]`

判定根拠: 後続実装 Phase の差分方針・新規ファイル構造を確定する。本 Phase が実装仕様の最終ベースラインとなる。

---

## 目的

採用案 B（Phase 2）に基づき、変更対象ファイル一覧、差分方針、新規 runbook の章立て、テスト・検証戦略を確定する。後続 Phase 4-13 はこの設計を機械的に実装すればよい状態にする。

## 変更対象ファイル一覧

| # | パス | 種別 | 規模 |
| --- | --- | --- | --- |
| 1 | `.github/workflows/cf-audit-log-monitor.yml` | 編集 | 約 -8 行 / +6 行（schedule 削除 / dry_run default 変更 / コメント追加） |
| 2 | `.github/workflows/cf-audit-log-monitor-watchdog.yml` | 削除 | -41 行 |
| 3 | `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` | 新規 | 約 +120 行 |
| 4 | `docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` | 編集 | +1 行（Canonical Status 追記） |
| 5 | `docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/outputs/phase-12/*` | 新規（Phase 12 で生成） | strict 7 ファイル |

## 差分方針: ファイル 1（cf-audit-log-monitor.yml）

### 削除する箇所

```yaml
on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:
```

→ `on.schedule:` および `- cron: '0 * * * *'` の 2 行を削除（`workflow_dispatch:` のみ残す）。

### 変更する箇所

```yaml
      dry_run:
        description: Skip GitHub Issue creation in analyze step.
        required: false
        type: boolean
        default: false   # ← true に変更
```

### 追加する箇所（ファイル冒頭）

```yaml
# HOLD: Issue #518 により hourly schedule を停止し、週次手動確認へ縮退中。
# 再開条件は docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md の
# 「再開条件チェックリスト」を参照。
# 手動起動: gh workflow run cf-audit-log-monitor.yml -f dry_run=true
name: cf-audit-log-monitor
```

### 残す箇所

`workflow_dispatch:` 以下の `inputs.since / inputs.until / inputs.dry_run`、`permissions`、`concurrency`、`jobs.fetch-and-analyze` 全体は無編集で保持。手動起動時に scripts/cf-audit-log を呼び出す経路を確保。

## 差分方針: ファイル 2（cf-audit-log-monitor-watchdog.yml）

`git rm .github/workflows/cf-audit-log-monitor-watchdog.yml` で削除。理由: heartbeat 監視は schedule 停止により対象が消失するため。

## 新規ファイル: ファイル 3（cf-audit-logs-weekly-manual-check.md）の章立て

```
# Cloudflare Audit Logs 週次手動確認 Runbook

## 1. 背景と目的（Issue #518 / 親 #408）
## 2. 運用ステータス: HOLD（自動監視停止中）
## 3. 週次手動確認手順
   3.1 前提（必要な権限・Token・local 環境）
   3.2 経路 A: workflow_dispatch（dry_run=true 必須）
   3.3 経路 B: local 実行（pnpm exec tsx scripts/cf-audit-log/analyze.ts）
   3.4 確認すべき検知パターン（403 急増 / 想定外 IP / 想定外時刻）
## 4. 関連 GitHub Variables / Secrets
   4.1 CF_AUDIT_LAST_SUCCESS_AT（HOLD 中は更新停止）
   4.2 CF_AUDIT_TOKEN_PROD / CF_AUDIT_D1_TOKEN_PROD（保持）
## 5. 再開条件チェックリスト
   - [ ] Cloudflare token misuse の具体的な兆候が出た
   - [ ] private な監視証跡置き場を用意できた
   - [ ] 無料枠を超えない実行頻度と保存先を明確に設計できた
   - [ ] 監視結果を公開 Issue に出さない alerting 経路を用意できた
## 6. 再開手順（HOLD 解除）
   6.1 schedule ブロック復元
   6.2 dry_run default を false に戻す
   6.3 watchdog YAML restore（git history から）
   6.4 検証: 初回 hourly tick で run 発火確認
## 7. 関連リンク
```

## 差分方針: ファイル 4（completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md）

`Canonical Status` 節に以下 1 行追加:

```markdown
> **HOLD 反映 (2026-05-07 / Issue #518)**: 自動監視は保留。週次手動確認運用へ縮退。詳細は `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` および `docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/index.md`。
```

## 関数 / 型シグネチャの取り扱い

`scripts/cf-audit-log/*.ts` は**全て無編集保持**するため、関数シグネチャは現状維持。本タスクでは新規関数追加・既存シグネチャ変更を一切行わない（CONST_005 に対する明示的記録）。

| ファイル | エクスポート（参考・無編集） |
| --- | --- |
| `scripts/cf-audit-log/fetch.ts` | CLI entry（`--since`, `--until`） |
| `scripts/cf-audit-log/analyze.ts` | CLI entry（`--window`, `--dry-run`） |
| `scripts/cf-audit-log/baseline.ts` / `baseline-cli.ts` | baseline 学習 |
| `scripts/cf-audit-log/issue-reporter.ts` | GH Issue 起票（dry_run で skip） |
| `scripts/cf-audit-log/d1-client.ts` / `cloudflare-client.ts` / `severity-classifier.ts` / `cli-args.ts` / `types.ts` | 内部依存 |

## 入出力 / 副作用

| 観点 | HOLD 前 | HOLD 後 |
| --- | --- | --- |
| schedule run 入力 | hourly tick | なし |
| 副作用: D1 書込 | 毎時 | なし（手動起動時のみ） |
| 副作用: GH Issue 起票 | 検知時 | なし（手動起動も dry_run default true） |
| 副作用: GitHub Variables 更新 | 毎成功時 | なし |

## テスト方針

- 既存テスト保持: `scripts/cf-audit-log/__tests__/*.test.ts` は無編集。Phase 9 で regression 確認。
- 新規ユニットテストは追加しない（YAML 編集 / 削除 / runbook 新規が主体で、ロジック変更がないため）。
- 検証手段:
  - 静的: `actionlint .github/workflows/cf-audit-log-monitor.yml`
  - 静的: `pnpm typecheck` / `pnpm lint`
  - 統合: `gh workflow run cf-audit-log-monitor.yml -f dry_run=true` を Phase 10 で発火し、analyze ステップが Issue 起票しないこと確認
  - runtime: Phase 11 で merge 後 1 時間 `gh run list --workflow=cf-audit-log-monitor.yml --limit=5` を観測し schedule 起源の run が無いこと確認

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/cf-audit-log
actionlint .github/workflows/cf-audit-log-monitor.yml
```

## DoD

- 変更対象ファイル 4 件と各差分方針が確定
- runbook 章立て 7 章が確定
- scripts 保持・無編集を明示
- テスト戦略確定
- Phase 4 着手承認（設計直列ゲート完了）
