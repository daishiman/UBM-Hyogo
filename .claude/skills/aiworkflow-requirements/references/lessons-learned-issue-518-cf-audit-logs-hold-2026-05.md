# Lessons Learned — Issue #518 Cloudflare Audit Logs Monitoring HOLD (2026-05)

Issue #408 で構築した Cloudflare Audit Logs hourly 自動監視を、運用上の制約（公開 Issue alerting / 無料枠 / private evidence store 不在）から `HOLD / manual-check-only` へ縮退した際に得た知見。根拠は `.github/workflows/cf-audit-log-monitor.yml` / `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` / `docs/30-workflows/completed-tasks/issue-518-cf-audit-logs-monitoring-hold/outputs/phase-12/implementation-guide.md`。

---

## L-ISSUE518-001: HOLD 政策で workflow を残すなら schedule 削除 + workflow_dispatch + dry_run 強制 の三段階で実行を物理的に塞ぐ

### 現象
Cloudflare Audit Logs 監視は API Token 利用イベントを公開 GitHub Issue として起票する設計のため、private evidence store 不在のまま hourly schedule を回すと「監視ジョブそのものが情報漏洩経路」になる。完全削除すると再開時の cost が高い一方、コードと workflow を残したままだと何かのトリガで実行されうる。

### 原因分析
GitHub Actions の `on.schedule` を残しつつ「実行を抑止する flag」だけで止めると、設定ミス・取り違え 1 つで本番 alerting が走る。`workflow_dispatch` の `dry_run` input も既定が `false` だと誤投入で公開 Issue が起票される余地が残る。

### 採用解決策
`.github/workflows/cf-audit-log-monitor.yml` を以下 3 段で塞ぐ:
1. `on.schedule` を完全削除し `workflow_dispatch` のみ残す（自動起動を物理的に不可能にする）
2. `inputs.dry_run` の `default: 'true'` を強制し、UI 既定値を fail-safe にする
3. job 冒頭の step で `if: inputs.dry_run == 'false'` の場合 `exit 1` する input validation を入れ、`dry_run=false` を workflow 側で拒否する

これにより「コードと secret は保つが、自動 alerting は物理的に発火しない」状態を実現できる。

### 再利用ガイド
公開チャネル（公開 Issue / 公開 Slack channel）に通知する自動化を一時停止する際は、コード削除でも flag 1 枚でもなく、上記 3 段の防壁を default とする。「コードを残す＝再開しやすい」「実行を物理的に塞ぐ＝事故が起こらない」を両立させる最小実装。

---

## L-ISSUE518-002: schedule を停止した時点で死活監視 watchdog は冗長になるため同一 wave で削除する

### 現象
Issue #408 では hourly schedule の停止/失敗を検知する `cf-audit-log-monitor-watchdog.yml` を別 workflow として運用していた。HOLD 化で hourly schedule 自体を停止すると watchdog は常時「stale」を返し続け、watchdog 由来の偽陽性 Issue が量産される。

### 原因分析
watchdog は「自動 schedule 実行が継続していること」を不変条件として監視する。schedule 自体が停止すると不変条件が崩壊し、watchdog のアラート意味が反転する（停止していて当然なのに stale 警告が鳴り続ける）。watchdog だけ flag で抑止すると、再開時に watchdog 復元忘れで silent failure を招く。

### 採用解決策
schedule 停止と同一 wave で `cf-audit-log-monitor-watchdog.yml` を削除し、再開条件チェックリストに「watchdog workflow を復元する」を明文で残す。weekly manual runbook の §3 に手動確認手順を移し、自動 watchdog の代替を人間プロセスに置く。

### 再利用ガイド
死活監視 workflow は対象 schedule とライフサイクルを同期させる。schedule の停止/再開時に watchdog 単体を放置・抑止する運用は採らない（同時に消し、同時に戻す）。

---

## L-ISSUE518-003: 自動監視の再開条件は alerting 経路の private 化を前提条件として spec に固定する

### 現象
Issue #408 の初期実装は alerting に公開 GitHub Issue を採用していたため、HOLD 解除時に「監視結果（actor email、IP prefix、token fingerprint 等の semi-sensitive な値）が誰の目にも触れる」課題が残った。再開条件を曖昧にしたまま放置すると、運用判断の差し戻しが発生する。

### 原因分析
監視は read-only でも、検知結果には「どの token が、どの IP から、どの時刻に使われたか」という情報が含まれる。これは攻撃者にも価値がある情報であり、公開 Issue / 公開チャネルに出すと監視ジョブが攻撃の偵察源になる。

### 採用解決策
HOLD 解除条件を以下 4 点で spec / runbook に固定（`docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` §5、`references/observability-monitoring.md` §9）:
1. Cloudflare token misuse の具体的な兆候の発生
2. private な監視証跡置き場（非公開 repo / 暗号化 storage 等）の用意
3. 無料枠を超えない実行頻度と保存先の設計確定
4. 監視結果を公開 Issue に出さない alerting 経路（例: private Slack / encrypted email）の用意

4 点全てが満たされない限り schedule を復元しない。一つでも欠けるなら weekly manual check のみで凌ぐ。

### 再利用ガイド
監視を一時停止する際は、停止理由とは別に「再開のための前提条件」を独立したチェックリストとして spec に書く。「停止」と「再開条件」を別箇所に置くと再開判断が属人化する。

---

## 参照元

- `.github/workflows/cf-audit-log-monitor.yml`（schedule 削除 / dry_run 強制 / dry_run=false 拒否）
- `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`（週次手動確認 runbook 正本）
- `docs/30-workflows/completed-tasks/issue-518-cf-audit-logs-monitoring-hold/outputs/phase-12/implementation-guide.md`
- `references/observability-monitoring.md` §9（HOLD contract）
- `lessons-learned-issue-408-cf-audit-logs-monitoring-2026-05.md`（前段の build-out 知見と併読）
