# Phase 2: 全体設計（HOLD 戦略選定）

`[実装区分: 実装仕様書]`

判定根拠: HOLD 戦略の採用案により後段 Phase の変更対象ファイルが変わるため、設計選択が実装仕様の前提となる。ドキュメントだけでは戦略実効化に至らない。

---

## 目的

HOLD 化のアプローチを 3 案で比較し、採用案を確定する。採用案は後続 Phase 3 詳細設計と Phase 5-8 実装の前提となる。

## 戦略選択肢

### 案 A: 全削除

- 内容: 2 つの workflow YAML と `scripts/cf-audit-log/*` を全削除
- メリット: 公開リポジトリから監視関連コードが消え、運用情報露出リスクが最小化
- デメリット: 再開時に Issue #408 の実装を再度行う必要がある。git history からの restore 手順が runbook に必要
- 採用判断: 不採用（再開の摩擦が大きく、Issue #518「再開条件」の実効性を損なう）

### 案 B: schedule 削除 + watchdog 削除 + scripts 保持 + runbook 新設 ★採用

- 内容:
  - `cf-audit-log-monitor.yml` から `on.schedule` を削除し `workflow_dispatch` のみ残す
  - `inputs.dry_run.default` を `true` 化（既定で Issue 起票しない安全側）
  - `cf-audit-log-monitor-watchdog.yml` を削除（schedule 停止により監視対象が消えるため）
  - `scripts/cf-audit-log/*` は無編集保持（手動・local 実行で再利用可能）
  - `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` を新規作成し、手動運用と再開手順を明記
- メリット:
  - 自動稼働は止まる（free minutes 消費なし / 公開 Issue 露出なし）
  - 必要時は `workflow_dispatch` または `pnpm exec tsx scripts/cf-audit-log/analyze.ts` で手動確認可能
  - 再開は schedule ブロック復元 + watchdog 復元のみで戻せる
- デメリット: workflow file が残るため、誤って手動 dispatch する余地はある（dry_run default true で緩和）
- 採用理由: Issue #518 の方針（保留 + 必要時手動確認）と再開条件 4 件のいずれにも素直に対応できる。再開摩擦が最小

### 案 C: ファイル全保持で `if: false` ガード

- 内容: schedule は残し、各 job に `if: ${{ false }}` を付ける
- メリット: 差分が最小
- デメリット: hourly cron 自体は発火し続け、free minutes を毎時消費（即 skip でも runs 履歴は残る）
- 採用判断: 不採用（Issue #518「常時監視は費用・運用負荷に対して過剰」と矛盾）

## 採用案: B

## 影響範囲

| 領域 | 影響 |
| --- | --- |
| GitHub Actions schedule | hourly + 15min cron 停止（free minutes 消費停止） |
| GitHub Variables | `CF_AUDIT_LAST_SUCCESS_AT` 更新停止（変数自体は残置） |
| D1 production DB | 影響なし（cf-audit-log 系テーブル / migration は保持） |
| Cloudflare Token | 影響なし（既存 Token 保持。手動使用時に活用） |
| 公開 Issue | 自動起票停止（既存 Issue は保持） |
| 既存 scripts / tests | 影響なし（無編集） |

## ロールバック手順（再開時）

1. `.github/workflows/cf-audit-log-monitor.yml` に `on.schedule: [{ cron: '0 * * * *' }]` を復元
2. `inputs.dry_run.default` を `false` に戻す
3. `.github/workflows/cf-audit-log-monitor-watchdog.yml` を git history から restore（`git checkout <pre-518-merge-sha> -- .github/workflows/cf-audit-log-monitor-watchdog.yml`）
4. main にマージ後、初回 hourly tick で復帰確認
5. runbook を archive に移動

## DoD

- 戦略 A/B/C の比較表が完成
- 採用案 B が決定
- 影響範囲 / ロールバック手順が明記
- Phase 3 への直列ゲート通過
