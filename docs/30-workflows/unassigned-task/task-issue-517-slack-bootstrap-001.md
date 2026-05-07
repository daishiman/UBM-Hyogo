# Slack channel bootstrap & Webhook 登録（post-release-30day-auto-summary 用） - タスク指示書

## メタ情報

```yaml
issue_number: 517
```


## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-issue-517-slack-bootstrap-001                                            |
| タスク名     | Slack channel bootstrap & Webhook 登録（post-release-30day-auto-summary 用）  |
| 分類         | ユーザー手動操作（外部リソース bootstrap）                                    |
| 対象機能     | post-release 30day auto-summary 通知経路                                      |
| 優先度       | 高（cron 起動前に必須）                                                       |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | issue-517-followup-auto-summary-foundation Phase 11 / 12                      |
| 発見日       | 2026-05-07                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-517 の auto-summary foundation では、リリースから 30 日経過した PR/Issue の自動サマリ生成と Slack 通知を GitHub Actions cron で実行する仕組みを整えた。Workflow 側のシークレット参照 (`SLACK_POST_RELEASE_WEBHOOK`) と投稿処理の契約は実装済みだが、Slack 側の channel 作成 / Incoming Webhook 発行 / GitHub Secrets への登録は外部リソースに対する手動操作であり、コード側で完結できない。

### 1.2 問題点・課題

- Workflow 上は `CONTRACT_READY_SECRET_PENDING` 状態で固定されており、cron が発火しても Slack 投稿ステップで silent skip になる
- Webhook URL は機密情報のためリポジトリ・1Password・コードコメントいずれにも実値を残せず、bootstrap の実行責任が宙に浮きやすい
- 実値登録が完了しないまま 30 日経過すると、最初の post-release タイミングで通知欠落が発生する

### 1.3 放置した場合の影響

- post-release 30day auto-summary の Slack 通知が届かず、運用ループが閉じない
- cron 成功ログだけ残って通知ゼロ件、という silent failure を運用側が検知できない
- 将来 reminder Issue を自動起票する仕組みに同じ Webhook を使い回す予定が崩れる

---

## 2. 何を達成するか（What）

### 2.1 目的

Slack 側の channel と Incoming Webhook を実体化し、GitHub Secrets `SLACK_POST_RELEASE_WEBHOOK` に登録、test post まで完了させて `CONTRACT_READY_SECRET_PENDING` 状態を `READY` に正規化する。

### 2.2 最終ゴール

- 専用 Slack channel が存在し、運用担当が join 済み
- Incoming Webhook URL が発行され、1Password に保管されている
- GitHub Secrets `SLACK_POST_RELEASE_WEBHOOK` に Webhook URL が登録されている
- test post（手動 curl もしくは workflow_dispatch dry-run）で投稿が確認できている
- 運用ドキュメントに channel 名 / Webhook 識別子（実値ではなく op:// 参照）が記録されている

### 2.3 スコープ

#### 含むもの

- Slack channel 作成（命名規約: `#ubm-post-release-summary` を推奨）
- Slack App / Incoming Webhook integration 設定
- GitHub Secrets への登録（リポジトリ scope）
- 1Password Environments への Webhook URL 保管
- test post の実施と投稿確認
- bootstrap 完了の記録（運用 README / 1Password 参照）

#### 含まないもの

- workflow 側コードの修正（contract は既に実装済）
- cron スケジュールの調整
- Slack channel への運用メンバー追加運用ルールの策定（別タスク）
- reminder Issue 自動起票機能（別 follow-up）

### 2.4 成果物

- Slack channel（実体）
- Incoming Webhook URL（1Password 保管）
- GitHub Secrets エントリ `SLACK_POST_RELEASE_WEBHOOK`
- test post スクリーンショットまたは投稿リンク
- 運用ドキュメントへの bootstrap 完了記録

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Slack workspace 管理権限（App 追加 / Webhook 発行が可能）
- リポジトリ owner / admin 権限（Secrets 登録が可能）
- 1Password Environments への書き込み権限

### 3.2 依存タスク

- issue-517-followup-auto-summary-foundation Phase 11 / 12 の実装が main にマージ済であること

### 3.3 必要な知識

- Slack Incoming Webhook の仕組み
- GitHub Secrets の登録手順（`gh secret set` または Web UI）
- 1Password CLI / Environments 運用
- CLAUDE.md「シークレット管理」章のローカル `.env` 運用ルール

### 3.4 推奨アプローチ

外部リソース bootstrap は副作用が大きいため、Slack 側 → 1Password 保管 → GitHub Secrets 登録 → test post の順に **直列に** 実行する。途中で実値が画面・ログ・コミットに残らないよう、Webhook URL は 1Password 経由でのみ取り扱う。

---

## 4. 実行手順

### Phase構成

1. Slack channel 作成と運用メンバー招待
2. Incoming Webhook 発行と 1Password 保管
3. GitHub Secrets 登録
4. test post と完了記録

### Phase 1: Slack channel 作成と運用メンバー招待

#### 目的

通知の宛先となる channel を実体化する。

#### 手順

1. Slack workspace で `#ubm-post-release-summary` を新規作成（public 推奨）
2. 運用担当を招待
3. channel topic に「post-release 30day auto-summary 通知専用」を記載

#### 完了条件

channel が存在し運用担当が参加している

### Phase 2: Incoming Webhook 発行と 1Password 保管

#### 目的

Webhook URL を発行し、実値を 1Password に閉じ込める。

#### 手順

1. Slack App（既存または新規）に Incoming Webhook integration を追加
2. 投稿先 channel を Phase 1 の channel に設定して Webhook URL を発行
3. 1Password Environments に `op://UBM-Hyogo/SLACK_POST_RELEASE_WEBHOOK/url` として保管
4. ローカル `.env` には実値を書かず op:// 参照のみ記述

#### 完了条件

Webhook URL が 1Password に保管され、平文ファイルに残っていない

### Phase 3: GitHub Secrets 登録

#### 目的

Workflow が参照する `SLACK_POST_RELEASE_WEBHOOK` に実値を流し込む。

#### 手順

1. `op read 'op://UBM-Hyogo/SLACK_POST_RELEASE_WEBHOOK/url' | gh secret set SLACK_POST_RELEASE_WEBHOOK -R daishiman/UBM-Hyogo` を実行
2. `gh secret list -R daishiman/UBM-Hyogo` で登録を確認
3. 値そのものは出力・ログに残さない

#### 完了条件

GitHub Secrets に Secret が存在し、Workflow が参照可能

### Phase 4: test post と完了記録

#### 目的

contract 状態を `READY` に正規化し、運用に引き継ぐ。

#### 手順

1. workflow_dispatch dry-run で auto-summary workflow を起動、または curl で Webhook に test message を送る
2. Slack channel への投稿を確認
3. 運用ドキュメント（または unassigned-task の本ファイル）の「ステータス」を完了に更新
4. follow-up タスク `task-issue-517-30day-runtime-evidence-001` の前提条件を満たしたことを共有

#### 完了条件

test post が channel に届き、runtime evidence 取得タスクへ引き継げる

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] Slack channel が作成され運用担当が join している
- [ ] Incoming Webhook が発行され 1Password に保管されている
- [ ] GitHub Secrets `SLACK_POST_RELEASE_WEBHOOK` が登録されている
- [ ] test post が channel に到達している

### 品質要件

- [ ] Webhook URL の実値が平文で repo / ログ / ドキュメントに残っていない
- [ ] `gh secret list` で Secret 名が確認できる

### ドキュメント要件

- [ ] 1Password エントリの op:// 参照が記録されている
- [ ] 本ファイルのステータスが「完了」に更新されている

---

## 6. 検証方法

### 検証手順

```bash
# Secrets 登録確認（値は表示されない）
gh secret list -R daishiman/UBM-Hyogo | grep SLACK_POST_RELEASE_WEBHOOK

# workflow_dispatch dry-run 起動（runtime evidence タスク側でも実施）
gh workflow run post-release-auto-summary.yml -R daishiman/UBM-Hyogo -f dry_run=true
```

---

## 7. リスクと対策

| リスク                                                     | 影響度 | 発生確率 | 対策                                                                                |
| ---------------------------------------------------------- | ------ | -------- | ----------------------------------------------------------------------------------- |
| Webhook URL がコミット / ログに残る                        | 高     | 低       | 1Password 経由のみ取り扱い、`gh secret set` は op read からのパイプで実行           |
| channel 名が運用ドキュメントと不整合                       | 中     | 中       | 命名規約 `#ubm-post-release-summary` を本タスクで固定化                             |
| Secret 登録漏れで silent skip が継続                       | 高     | 中       | Phase 4 で test post を必須化し、`READY` 確認まで完了条件に含める                   |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/`
- `docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-12/`
- `CLAUDE.md`（シークレット管理章）
- `scripts/with-env.sh` / `scripts/cf.sh`（op run ラッパー実装）

### 参考資料

- Slack Incoming Webhooks: https://api.slack.com/messaging/webhooks
- GitHub CLI `gh secret set`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | Workflow / contract は実装済みだが、Slack 側 bootstrap が完了するまで `CONTRACT_READY_SECRET_PENDING` が解消されず、cron が無音で skip する状態が長引きやすい                                                          |
| 原因     | Slack channel 作成 / Webhook 発行 / Secrets 登録は外部リソースへの手動操作であり、コード側 PR では完結しない。Phase 11/12 の実装スコープと bootstrap スコープの境界が曖昧だと「contract 完了 = 運用 ready」と誤認される |
| 対応     | unassigned-task として独立化し、`CONTRACT_READY_SECRET_PENDING` → `READY` への正規化判断と手動境界を本ファイルで明示。bootstrap の責任者と完了条件を切り出し、cron 起動前の必須前提として運用に引き継ぐ                |
| 再発防止 | 「contract 実装完了」と「外部リソース bootstrap 完了」を別タスクで管理する原則を、issue-517 シリーズの follow-up テンプレートに明記する                                                                                |

### 補足事項

本タスクは外部 SaaS への副作用を伴うため、AI エージェントが直接実行するのではなく、運用担当が手動で完了させる前提とする。完了後は `task-issue-517-30day-runtime-evidence-001` を起動可能になる。
