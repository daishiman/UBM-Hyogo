# Cloudflare Analytics API automatic threshold check - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-imp-05a-cf-analytics-auto-check-001                                      |
| タスク名     | Cloudflare Analytics API automatic threshold check                            |
| 分類         | 改善                                                                          |
| 対象機能     | Cloudflare 無料枠の自動閾値監視                                               |
| 優先度       | 低                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | 05a Phase 12                                                                  |
| 発見日       | 2026-04-26                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

05a は手動確認を優先しており、通知基盤や Cloudflare Analytics API 自動化を導入していない。MVP 段階ではこれで十分だが、運用頻度が上がると手動確認の運用負荷とヒューマンエラーが増える。

### 1.2 問題点・課題

- 手動確認のみだと、quota 接近を発見するタイミングが運用者の作業頻度に依存する
- Cloudflare Analytics API で取得できる metric と取得できない metric が整理されていない
- 自動化を導入する場合の secret 追加要否と保管場所が決まっていない

### 1.3 放置した場合の影響

- 利用者数の増加に伴い手動確認漏れが発生し、quota 超過に気づくのが遅れる
- 急な spike に対応できず、Cloudflare 課金が発生するリスクがある
- 手動運用負荷が増え、他タスクの進捗を圧迫する

---

## 2. 何を達成するか（What）

### 2.1 目的

Cloudflare Analytics API による read-only 自動閾値監視の最小設計を確立し、05a の手動運用との併用ルールを定義する。

### 2.2 最終ゴール

- API で取得できる指標 / できない指標が分かれている
- read-only check script の入出力契約が決まっている
- secret 追加要否と保管場所（Cloudflare Secrets / GitHub Secrets / 1Password）が記録されている
- 手動確認との置き換え or 補助の役割分担が明確

### 2.3 スコープ

#### 含むもの

- Cloudflare Analytics API の対象 metric と認証要件の調査
- Pages / Workers / D1 / R2 / KV の取得可否分類
- read-only check script の入出力契約定義
- secret 追加要否の判断と正本同期方針
- 手動運用との併用ルールの runbook 化

#### 含まないもの

- 実 script の実装（別タスク化判断あり）
- 通知基盤（Slack / メール）の導入
- 有料監視 SaaS の導入

### 2.4 成果物

- Analytics API 取得可否一覧
- read-only script 入出力契約メモ
- secret 取り扱い更新差分（必要時）
- 05a runbook の併用ルール追記差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Cloudflare アカウントの API token を発行できる権限がある
- 05a Phase 5 の cost guardrail runbook を読んでいる

### 3.2 依存タスク

なし

### 3.3 必要な知識

- Cloudflare Analytics API（GraphQL）
- GitHub Actions scheduled workflow と無料枠
- 1Password Environments / Cloudflare Secrets / GitHub Secrets の使い分け

### 3.4 推奨アプローチ

最初は read-only script として設計し、GitHub Actions scheduled workflow へ載せるかは別判断にする。secret 追加が必要な場合は environment-variables 正本へ同期する。

---

## 4. 実行手順

### Phase構成

1. API metric 調査
2. 取得可否分類
3. script 入出力契約定義
4. secret 判断と runbook 追記

### Phase 1: API metric 調査

#### 目的

Cloudflare Analytics API で取得できる metric と認証要件を確認する。

#### 手順

1. Cloudflare Analytics API のドキュメントを確認
2. 必要な API token scope を整理

#### 成果物

API metric 一覧と認証要件メモ

#### 完了条件

対象 metric と最小 token scope が記録されている

### Phase 2: 取得可否分類

#### 目的

Pages / Workers / D1 / R2 / KV について API 取得可否を分類する。

#### 手順

1. 各サービスの metric 取得可否を表化
2. 取得不能な metric は手動確認継続とラベル付け

#### 成果物

取得可否一覧表

#### 完了条件

全サービスについて可否が決まっている

### Phase 3: script 入出力契約定義

#### 目的

read-only check script の I/O 契約を決める。

#### 手順

1. 入力（API token, threshold 設定）
2. 出力（quota 利用率、超過判定、ログ）
3. 失敗時の挙動（exit code、再実行可否）

#### 成果物

入出力契約メモ

#### 完了条件

I/O が一意に決まっている

### Phase 4: secret 判断と runbook 追記

#### 目的

secret 追加要否を判断し、05a runbook へ併用ルールを追記する。

#### 手順

1. secret 追加要否を決定
2. 必要な場合は environment-variables 正本へ同期方針を記載
3. 手動確認との置き換え / 補助の方針を runbook に追記

#### 成果物

更新済み runbook + secret 取り扱いメモ

#### 完了条件

手動確認との役割分担が明確

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] API で取得できる指標と取得できない指標が分かれている
- [ ] secret 追加の有無が記録されている
- [ ] 手動確認を置き換えるのか補助するのかが明確
- [ ] 実装する場合は CI 実行コストが 05a の閾値に入っている

### 品質要件

- [ ] read-only token scope を採用している
- [ ] `audit-unassigned-tasks.js` の currentViolations = 0

### ドキュメント要件

- [ ] 05a runbook に併用ルール追記
- [ ] environment-variables 正本に secret 方針反映（必要時）

---

## 6. 検証方法

### テストケース

- 取得可否一覧と実 API レスポンスの整合
- script の I/O が定義通りに動くこと（実装する場合）

### 検証手順

```bash
rg -n "Cloudflare Analytics|quota|threshold|CLOUDFLARE_API_TOKEN" .github apps docs .claude/skills/aiworkflow-requirements/references
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/task-imp-05a-cf-analytics-auto-check-001.md
```

---

## 7. リスクと対策

| リスク                                                  | 影響度 | 発生確率 | 対策                                              |
| ------------------------------------------------------- | ------ | -------- | ------------------------------------------------- |
| 自動確認自体が GitHub Actions minutes を消費する        | 中     | 中       | scheduled run の頻度を月次または週次に制限する    |
| API token の権限が広すぎる                              | 高     | 中       | read-only scope を優先し、secret 正本へ反映する   |
| API rate limit が観測されておらず実装後に超過           | 中     | 低       | 実装前に rate limit 値を調査し、頻度設計に反映    |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md`
- `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

### 参考資料

- Cloudflare Analytics API（GraphQL）公式ドキュメント
- GitHub Actions scheduled workflow 無料枠

---

## 9. 備考

### 苦戦箇所【記入必須】

> 05a 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| 症状     | 05a で自動化検討時、Cloudflare Analytics API の rate limit 値が runbook で観測対象として整理されていなかった         |
| 原因     | MVP 範囲を「手動運用」で閉じる方針だったため、API 自動化に伴う追加 quota（API 自体の rate limit）が検討対象外だった   |
| 対応     | 05a 内では手動運用方針を維持し、自動化検討は本未タスクへ切り出した                                                     |
| 再発防止 | 自動化を検討する未タスクには「自動化自体が消費する quota」を明示的に scope へ含める                                   |

### レビュー指摘の原文（該当する場合）

```
05a Phase 12 unassigned-task-detection.md U-02 として formalize
```

### 補足事項

05a の初回スコープは手動運用で閉じる。本タスクは運用負荷が増えた時の拡張である。
