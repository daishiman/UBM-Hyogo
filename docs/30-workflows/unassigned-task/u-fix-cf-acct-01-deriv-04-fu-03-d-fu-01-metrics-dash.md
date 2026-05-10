# U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-01-METRICS-DASH — 7day summary 可視化ダッシュボード

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手（条件付き起票） |
| 親 | `docs/30-workflows/issue-586-post-switch-7day-close-out/` |
| 祖父 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |
| 起票元 | `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-12/unassigned-task-detection.md` |
| 起票条件 | D+7 完走後、ML classifier の継続観測ニーズが顕在化した場合（fallback rate / Issue 起票傾向の週次レビュー要請） |
| 優先度 | LOW |
| Wave | follow-up（observability 拡張） |
| visualEvidence | VISUAL（ダッシュボード screenshot） |

## 1. なぜこのタスクが必要か（Why）

Issue #586 で生成される `hourly-run-7day-summary.json` は単発の 7 日サマリだが、ML classifier 切替後の中長期傾向（fallback rate の週次トレンド / Issue 起票数の baseline 推移 / p95 latency drift）を可視化する経路がない。本タスクではサマリ JSON を集計し、週次ダッシュボードに描画する。FU-03-D-FOLLOWUP-03（Slack 通知）と重複しない範囲（=「過去傾向の閲覧」面）に scope を限定する。

## 2. 何を達成するか（What）

- 過去 N 週分の `hourly-run-7day-summary.json` を集約し、週次トレンドを描画
- fallback rate / p95 latency / Issue 起票数 / leakage grep 件数の 4 指標を時系列でプロット
- threshold 期 baseline と ML 期の比較を恒久的に閲覧可能にする
- ダッシュボード閲覧者: 開発者本人（solo dev）。複雑な認証や access control は不要

## 3. どのように実行するか（How）

1. 既存の summary JSON を `outputs/phase-11/evidence/hourly-run-7day-summary.json` から週次集約する pipeline を新規追加
2. 静的 HTML / Markdown ダッシュボードとして `docs/30-workflows/dashboards/cf-audit-log-7day-trend/` に出力（外部 SaaS は使わない）
3. Cloudflare Pages の preview 環境にデプロイするか、`apps/web/src/app/(admin)/admin/audit/` に組み込むかを Phase 3 で決定
4. データソースは GitHub Actions artifact のみ。新規 D1 列追加は禁止

## 4. 実行手順

1. summary JSON 蓄積場所（GitHub Actions artifact / repo committed evidence）を Phase 3 で確定
2. 集計 script `scripts/cf-audit-log/dashboard/aggregate-weekly.ts` を新規追加
3. 描画レイヤを admin UI 組込 or 静的 HTML のどちらかに決定
4. Phase 11 evidence に screenshot 4 点（4 指標時系列）を追加
5. SSOT（observability-monitoring）にダッシュボード URL / path を追記

## 5. 完了条件チェックリスト

- [ ] 4 指標（fallback rate / p95 latency / Issue 起票数 / leakage 件数）の時系列プロットが存在する
- [ ] threshold 期 baseline と ML 期の比較線が同一プロット内に並ぶ
- [ ] 新規 D1 列追加なし
- [ ] FU-03-D-FOLLOWUP-03 Slack 通知 scope と重複しない（過去閲覧のみ・push 通知なし）
- [ ] Phase 11 evidence に screenshot 4 点

## 6. 検証方法

- 集計 script が直近 4 週分 summary を正しく aggregate することを focused test で確認
- threshold 期 / ML 期の baseline 線が visualization に描画されていることを screenshot で確認
- ダッシュボード URL もしくは static path が SSOT に追記されていることを確認

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| ダッシュボード認証要件の肥大化 | scope を solo dev 観閲のみとし、admin UI 経由 (Auth.js セッション) のみで access |
| Slack 通知 scope（FU-03-D-FOLLOWUP-03）との重複 | 本タスクは「過去の閲覧」、Slack は「リアルタイム push」と責務分離を明記 |
| summary JSON フォーマット変更で集計が壊れる | summary JSON を versioned schema にし、aggregator で version field を強制 |

## 8. 参照情報

- `docs/30-workflows/issue-586-post-switch-7day-close-out/index.md`
- `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md`（Slack 通知・scope 切り分け対象）
- `.github/workflows/cf-audit-log-7day-summary.yml`

## 9. 苦戦箇所（将来の課題解決のための記録）

- ダッシュボード系タスクは「solo dev で本当に必要か」を起票前に判定する gate が必要。reactive な observability（Slack 通知）と proactive な傾向把握（dashboard）の責務分離を最初に切らないと、両タスクが overlapping scope で再着手される。
- summary JSON は「単発サンプル」で設計したため、`week_starting`（ISO week）field を最初から入れておかないと aggregator が過去 JSON に対して date 推定を強いられる。本タスク着手前に、`cf-audit-log-7day-summary.yml` の出力 schema に `week_starting` を追加する mini-PR を別途起こすほうが安全。
- 静的 HTML 派生はデプロイ簿価が安いが、admin UI 組込はセッションで保護できる。solo dev の運用粒度に合わせ、Phase 3 で「公開しない / 公開する」を明示決定する設計工程を入れること。

## 10. 備考

Issue #586 は CLOSED のまま。本タスクは新規 Issue として起票し、PR 文脈は `Refs #549, Refs #586`。FU-03-D-FOLLOWUP-03 が起票済みの場合は cross-link する。
