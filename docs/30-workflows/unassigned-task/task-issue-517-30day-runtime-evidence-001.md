# post-release 30day auto-summary 本番 cron / workflow_dispatch dry-run 起動評価 - タスク指示書

## メタ情報

```yaml
issue_number: 517
```


## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | task-issue-517-30day-runtime-evidence-001                                             |
| タスク名     | post-release 30day auto-summary 本番 cron / workflow_dispatch dry-run 起動評価        |
| 分類         | 運用評価（runtime evidence 取得）                                                     |
| 対象機能     | post-release 30day auto-summary workflow                                              |
| 優先度       | 中（30日経過後）                                                                      |
| 見積もり規模 | 小規模                                                                                |
| ステータス   | 未実施                                                                                |
| 発見元       | issue-517-followup-auto-summary-foundation Phase 12                                   |
| 発見日       | 2026-05-07                                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-517 の auto-summary foundation で、post-release から 30 日経過した PR/Issue を対象に GitHub Actions cron が auto-summary を生成し、Slack へ通知する経路を整備した。実装と契約は Phase 11/12 で完了しているが、cron が実際に発火するのは最初の本番リリースから 30 日後であり、その時点での runtime evidence（投稿到達 / idempotency / silent skip 動作）はまだ取得できていない。

### 1.2 問題点・課題

- 本番 cron 発火前に dry-run での挙動確認が行われていないと、初回発火で失敗しても気付きが遅れる
- idempotency（同一対象に対する重複起動で既 open PR を silent skip する動作）が runtime で確認されていない
- workflow ログ・Slack 投稿・PR 状態の三点突合をしないと、cron 「成功」だけを見て品質を担保できない

### 1.3 放置した場合の影響

- 30日経過後の初回 cron で silent failure / 重複 PR 量産 / 通知欠落が起きた場合、原因特定に時間がかかる
- auto-summary の運用ループが立ち上がらず、follow-up Issue の起点が機能しない
- 後続の reminder 自動起票機能が同 workflow パターンを流用する際、参考できる runtime evidence が残らない

---

## 2. 何を達成するか（What）

### 2.1 目的

`workflow_dispatch` での dry-run 起動と、本番 cron 起動後の挙動の双方について runtime evidence を取得し、idempotency と silent skip 動作を確認する。

### 2.2 最終ゴール

- `workflow_dispatch` dry-run で workflow がエラーなく完了し、Slack に test 投稿が届く（または dry-run フラグで skip されることを確認）
- 本番 cron 起動後、対象 PR/Issue に対するサマリ PR が想定通り作成されている
- Slack channel に通知が届いている
- 同じ対象に対して再度 workflow を発火させても、既 open PR を silent skip して新 PR が乱立しないことを確認できている
- runtime evidence（workflow run URL / PR URL / Slack 投稿リンク）が記録されている

### 2.3 スコープ

#### 含むもの

- GHA UI または `gh workflow run` での `workflow_dispatch` dry-run 起動
- 本番 cron の最初の自動発火タイミングでの観測
- Slack 投稿の確認
- idempotency 確認のための再起動テスト
- runtime evidence の記録（unassigned-task 本ファイル / 別途 evidence ログ）

#### 含まないもの

- workflow 側コードの新規修正（Phase 11/12 で実装済）
- Slack channel / Webhook の bootstrap（前提タスク `task-issue-517-slack-bootstrap-001`）
- 30 日窓 / 対象抽出ロジックの仕様変更
- reminder Issue 自動起票機能の評価

### 2.4 成果物

- workflow run URL（dry-run / 本番 cron 双方）
- 生成された summary PR の URL
- Slack 投稿リンクまたはスクリーンショット
- idempotency 検証ログ（再起動後の skip 確認）
- 本タスクのステータス完了更新

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-issue-517-slack-bootstrap-001` が完了済（Slack channel / Webhook / Secrets が `READY`）
- post-release から 30 日経過した PR/Issue が少なくとも 1 件存在する
- リポジトリへの `workflow_dispatch` 権限を持つこと

### 3.2 依存タスク

- `task-issue-517-slack-bootstrap-001`（Slack bootstrap 完了が必須前提）

### 3.3 必要な知識

- GitHub Actions の `workflow_dispatch` 入力値
- auto-summary workflow の dry-run フラグ仕様（Phase 11/12 implementation-guide 参照）
- idempotency キー（既 open PR の検出ロジック）

### 3.4 推奨アプローチ

`workflow_dispatch` dry-run → 本番 cron 観測 → 再起動 idempotency 確認、の順で 3 段階に runtime evidence を蓄積する。各段階で workflow run URL / PR URL / Slack 投稿リンクの 3 点を必ず記録する。

---

## 4. 実行手順

### Phase構成

1. workflow_dispatch dry-run 起動評価
2. 本番 cron 起動後の観測
3. idempotency / silent skip 確認
4. evidence の記録と完了報告

### Phase 1: workflow_dispatch dry-run 起動評価

#### 目的

cron を待たずに workflow の挙動を確認する。

#### 手順

1. GHA UI または `gh workflow run post-release-auto-summary.yml -f dry_run=true` で起動
2. workflow run のログを確認し、対象抽出 / dry-run skip 判定 / Slack 投稿経路を観測
3. dry-run で Slack 投稿が抑止される設計の場合は test post 経路で代替確認

#### 完了条件

dry-run 起動が成功し、想定通りの分岐が runtime ログで確認できる

### Phase 2: 本番 cron 起動後の観測

#### 目的

スケジュール経由の本番発火が想定通り動くことを確認する。

#### 手順

1. cron スケジュールに合わせて workflow run を待つ（または該当時刻に GHA UI を確認）
2. 生成された summary PR を確認
3. Slack channel への投稿到達を確認
4. workflow run URL / PR URL / Slack 投稿リンクを記録

#### 完了条件

本番 cron で PR 生成 + Slack 通知 + workflow success が三点揃う

### Phase 3: idempotency / silent skip 確認

#### 目的

同一対象に対する重複起動で PR が乱立しないことを確認する。

#### 手順

1. Phase 2 の対象 PR/Issue が残っている状態で workflow を再起動（`workflow_dispatch`）
2. 既 open の summary PR が再利用または silent skip されることを workflow ログで確認
3. 新 PR が追加で作成されていないことを `gh pr list` で確認

#### 完了条件

再起動で新規 PR が作られず、既 open PR の silent skip がログから読み取れる

### Phase 4: evidence の記録と完了報告

#### 目的

runtime evidence を後続タスクから参照可能な形で残す。

#### 手順

1. workflow run URL / PR URL / Slack 投稿リンク / idempotency ログを本ファイルまたは別途 evidence ログに記録
2. ステータスを「完了」に更新
3. issue-517 シリーズの follow-up クローズ判断に引き継ぐ

#### 完了条件

evidence が参照可能な形で残り、ステータスが完了になっている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `workflow_dispatch` dry-run が成功している
- [ ] 本番 cron 発火で summary PR が生成されている
- [ ] Slack 通知が届いている
- [ ] 再起動で既 open PR が silent skip されることが確認できている

### 品質要件

- [ ] workflow run URL が記録されている
- [ ] PR URL / Slack 投稿リンクが記録されている

### ドキュメント要件

- [ ] 本ファイルのステータスが「完了」に更新されている
- [ ] issue-517 シリーズの clean-up 判断材料として共有されている

---

## 6. 検証方法

### 検証手順

```bash
# dry-run 起動
gh workflow run post-release-auto-summary.yml -R daishiman/UBM-Hyogo -f dry_run=true

# run 状況確認
gh run list -R daishiman/UBM-Hyogo --workflow post-release-auto-summary.yml -L 5

# idempotency 確認
gh pr list -R daishiman/UBM-Hyogo --search "auto-summary in:title state:open"
```

---

## 7. リスクと対策

| リスク                                                  | 影響度 | 発生確率 | 対策                                                                          |
| ------------------------------------------------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| dry-run が本番 Slack channel に投稿してしまう           | 中     | 中       | dry-run 専用 channel または抑止フラグの仕様を Phase 11/12 ガイドで再確認      |
| idempotency が機能せず重複 PR が量産される              | 高     | 低       | Phase 3 で再起動テストを必ず実施し、open PR 件数の差分を確認                  |
| 30日経過対象が存在せず evidence が取れない              | 中     | 中       | dry-run で固定対象を指定可能なら活用、無理な場合は 30 日経過まで本タスクを保留 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/`
- `docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-12/`
- `task-issue-517-slack-bootstrap-001`（前提タスク）

### 参考資料

- GitHub Actions `workflow_dispatch` 仕様
- `gh workflow run` / `gh run list`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | cron 発火が 30 日先となるため、実装直後に runtime evidence を取得できず、follow-up クローズ判断が「コード上は ready」止まりになる                                   |
| 原因     | post-release 30day auto-summary は時間軸に依存する仕組みであり、unit test と dry-run だけでは idempotency / Slack 到達などの runtime な側面を検証しきれない         |
| 対応     | unassigned-task として独立化し、`workflow_dispatch` dry-run と本番 cron の双方で runtime evidence を取得するフェーズを定義。idempotency 再起動テストも完了条件に含める |
| 再発防止 | 時間軸 / 外部 SaaS / 副作用を伴う workflow は「実装完了タスク」と「runtime evidence タスク」を分離する原則を、issue-517 系 follow-up テンプレートに残す             |

### 補足事項

本タスクは `task-issue-517-slack-bootstrap-001` の完了が前提。Slack bootstrap 未了の段階で起動すると `CONTRACT_READY_SECRET_PENDING` のまま silent skip となり、evidence 取得が成立しない点に注意する。
