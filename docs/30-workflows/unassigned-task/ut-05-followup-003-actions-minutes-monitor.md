# UT-05 Follow-up 003: GitHub Actions 使用分監視

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-05-followup-003 |
| タスク名 | GitHub Actions 月使用分監視 |
| 優先度 | MEDIUM |
| 推奨 Wave | UT-08（モニタリング・アラート）と同時 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 種別 | observability |
| 由来 | UT-05 Phase 1 R-8 / Phase 7 §5 |
| 依存 | UT-08 monitoring / alert design, secrets rotation runbook |

## 目的

GitHub Actions の月間使用分（private repo は無料枠 2,000 分/月）を可視化し、無料枠超過や CI/CD コスト増を早期検知する。UT-05 で構築する `ci.yml` / `web-cd.yml` / `api-cd.yml` の合計実行時間が想定範囲内に収まることを継続的に監視する。

## スコープ

### 含む

- GitHub Billing API（`/repos/{owner}/{repo}/actions/billing/usage` 等）からの使用分取得方法定義
- 取得頻度（日次 / 週次）と保存先（GitHub Variables / D1 / 外部ストレージ）の設計
- 閾値（警告 70% / 危険 90%）と通知先（UT-07 通知基盤、Discord/Slack）の設定
- workflow 別・job 別の使用分内訳取得スクリプトの仕様
- UT-08 監視タスクとの責務境界定義（Cloudflare 側コストは UT-08、GHA 側は本タスク）

### 含まない

- UT-08 で扱う Cloudflare Workers / D1 のコストモニタリング
- 通知基盤本体の構築（UT-07 のスコープ）
- 実 dashboard UI の構築
- UT-05 followup-002（matrix 拡張）のコスト評価そのもの（本タスクは取得手段の整備のみ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-05 CI/CD pipeline 実装完了 | 監視対象となる workflow が稼働している必要がある |
| 上流 | UT-07 通知基盤 | アラート配信経路が確立している必要がある |
| 並走 | UT-08 monitoring | dashboard / アラート設計の責務分離が前提 |
| 下流 | UT-05 followup-002 | matrix 拡張時のコスト判断材料を提供する |

## 苦戦箇所・知見

**GitHub Billing API の権限スコープ問題**: Billing API は `repo` スコープでは不十分で、Organization 配下の場合は `admin:org` または個人アカウントの場合は `user` スコープを持つ Personal Access Token (Classic) が必要。Fine-grained PAT では現状 Billing 取得が制限される場合があるため、token 種別の選定で詰まりやすい。サービスアカウント運用にする場合、bot user の billing 権限付与方針も合わせて決めること。

**API レートリミットと取得頻度のトレードオフ**: REST API は 5,000 req/h（認証済み）だが、Billing API は内部的にキャッシュ層がありリアルタイム性が低く、最大 24h 程度の遅延が発生する。日次取得で十分だが、月末ギリギリでの超過検知が遅れるリスクがある。月末 3 日前から取得頻度を上げる等の動的スケジューリングを検討する。

**コスト見積もりロジックの罠**: `total_minutes_used` は OS 別の倍率（Linux 1x / macOS 10x / Windows 2x）が適用済の数値だが、`included_minutes`（無料枠）と単位を揃えるには `total_paid_minutes_used` も合算する必要がある。`minutes_used_breakdown` の合計と `total_minutes_used` がプライベート/パブリックの境界で一致しないケースがあり、JSON 構造を pretty print して目視確認するのが安全。

**UT-08 との責務重複の解消**: UT-08 が「全インフラ監視」を掲げると、本タスクと完全に責務が被る。本タスクは「GHA 使用分の取得・閾値設定・通知連携」までに限定し、可視化 dashboard / SLO 定義は UT-08 に委譲する境界線を `index.md §責務境界` に明記すること。

**コスト試算の前提**: UT-05 の現行設計（ubuntu-latest 単一 / Node 24 単一 / shard=4）で 1 PR あたり想定 8〜12 分。月 100 PR + dev/main push 200 回想定で 1,400〜1,800 分。followup-002 で macOS matrix を加えると倍率 10x により無料枠を即座に超過する。閾値設計はこの試算を出発点にする。

## 受入条件

- [ ] GitHub Billing / Actions usage の取得方法（API endpoint / token スコープ / 取得頻度）が定義されている
- [ ] 警告閾値（70%）/ 危険閾値（90%）/ 超過時の挙動が記録されている
- [ ] 通知先（UT-07 経由 Discord/Slack）と通知メッセージフォーマットが定義されている
- [ ] UT-08 の監視設計と重複しない責務境界が `index.md` に明記されている
- [ ] workflow 別・job 別の内訳取得手段（CLI スクリプト or GHA workflow）が定義されている
- [ ] token rotation 90 日サイクルとの整合性が記録されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/phase-01.md | R-8（GHA 無料枠制約）の根拠 |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/phase-07.md | 仕様カバレッジの観点 |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/outputs/phase-12/unassigned-task-detection.md | 由来記録 |
| 参考 | https://docs.github.com/en/rest/billing | GitHub Billing API リファレンス |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | GHA 設計方針 |
