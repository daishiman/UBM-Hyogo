# U-FIX-CF-ACCT-01-DERIV-04: Cloudflare Audit Logs による Token 利用監視

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04 |
| タスク名 | Cloudflare Audit Logs を取得して API Token 利用パターンを監視・alerting する |
| 優先度 | MEDIUM |
| 推奨Wave | U-FIX-CF-ACCT-01 完了後（最小 scope Token 投入後）、DERIV-03 と前後可 |
| 状態 | unassigned |
| 作成日 | 2026-05-02 |
| 既存タスク組み込み | なし（UT-25-DERIV-03 は secret 配置の audit log 範囲。本タスクは Token 利用全般） |
| 組み込み先 | - |
| 検出元 | docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/outputs/phase-12/unassigned-task-detection.md（MEDIUM 行） |

## 目的

Cloudflare Audit Logs API から API Token の利用イベントを取得し、想定外の Account / Resource アクセス、想定外の時刻・送信元からの呼び出し、scope 拒否（403）の急増などを検知する仕組みを構築する。漏洩や誤用の早期検知を可能にする。

> **着手判断基準**: U-FIX-CF-ACCT-01 の最小 scope Token を本番投入後、Token 利用パターンのベースラインを取得できる時期。DERIV-03（rotation）と並行可。

## スコープ

### 含む

- Cloudflare Audit Logs API のアクセス経路確立（読み取り専用 Token を別途発行）
- 取得対象イベント: API Token 認証成功 / 失敗、scope 不足による 403、想定外 Account への access
- 取得頻度: 1 時間毎（cron workflow）
- 保管場所: GitHub Actions artifact または D1（30 日保管想定）
- alerting 条件: 想定外 IP からの認証成功、403 急増（1 時間で N 件以上）、想定外時刻（業務時間外）の Token 利用
- alerting 経路: GitHub Issue 自動起票（高重要度）+ optional: 通知 webhook
- ベースライン定義: 通常時の API call 数 / 時刻分布 / scope 利用比率を 7 日間学習して閾値を決定

### 含まない

- log 保管期間 90 日以上の長期保管（必要時に別タスクで cold storage 化）
- リアルタイム streaming（バッチ取得で十分）
- Cloudflare 以外の audit log 統合（GitHub Actions log 等は別タスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | U-FIX-CF-ACCT-01 | 監視対象 Token の scope が確定していること |
| 関連 | UT-25-DERIV-03（secret 配置 audit log） | secret 配置イベントの audit log 範囲との重複排除 |
| 関連 | UT-17-cloudflare-analytics-alerts | alerting 経路の共有 |
| 関連 | DERIV-03（rotation） | rotation 直後の認証 pattern 変化を学習対象から除外 |

## 着手タイミング

| 条件 | 理由 |
| --- | --- |
| 最小 scope Token が本番で稼働 | 監視対象が存在し、ベースラインが取得可能 |
| Audit Logs アクセス用の読み取り専用 Token 発行可 | 監視 Token を deploy Token と分離して権限分離 |
| alerting 経路（Issue 自動起票 or webhook）が確立 | 検知後の通知先が必要 |

## 苦戦箇所・知見

**1. Audit Logs 読み取り Token の権限分離**
監視用 Token は `Account > Audit Logs:Read`（読み取り専用）のみとし、deploy Token とは別 secret に保管する。監視 Token が漏洩しても deploy 経路に影響しない設計。

**2. 想定外 IP の定義**
GitHub Actions runner の IP range は広く、固定が難しい。「IP 単独」ではなく「IP + User-Agent + scope 利用パターン」の複合条件で異常を判定する。MVP は GitHub Actions の official IP range list に含まれない呼び出しをアラート対象とする。

**3. ベースライン学習期間とノイズ**
最初の 7 日は学習期間として alerting を無効化し、閾値計算のみ実施。学習中の異常は手動レビューで判断。学習後は閾値超過で起票するが、業務時間外の rotation 実施などで誤検知が発生するため、rotation 期間を学習対象外にする meta-data 連携が必要。

**4. log 保管コスト**
D1 への 30 日保管は無料枠で十分（1 時間毎 × 30 日 × 数 KB）。GitHub Actions artifact は 90 日まで無料。コスト面で D1 と artifact のどちらを正本にするかは access pattern で決定する（クエリしたいなら D1、参照だけなら artifact）。

**5. alerting の重要度分類**
- HIGH: 想定外 IP からの認証成功（漏洩疑い）
- MEDIUM: 403 急増（scope 設計のミス疑い）
- LOW: 業務時間外の Token 利用（人手 rotation の可能性）

各重要度で起票 Issue の label を変える。

**6. 監視自体の障害検知**
監視 workflow が失敗した場合の検知が抜け漏れる。`schedule` workflow の失敗を別 workflow で監視するか、GitHub の workflow failure notification を有効化する。

## 実行概要

1. Cloudflare Dashboard で Audit Logs:Read のみの監視 Token を発行し、`CF_AUDIT_TOKEN_PROD` Secret に保管
2. `.github/workflows/cf-audit-log-monitor.yml` を `schedule: '0 * * * *'` で作成
3. `bash scripts/cf.sh audit-log fetch` ラッパー（新規）で 1 時間分の log を取得
4. 取得 log を D1 `cf_audit_log` table に追記（保管 30 日、TTL で自動削除）
5. ベースライン学習（7 日間）→ 閾値設定
6. alerting workflow を有効化（GitHub Issue 自動起票）
7. 監視 workflow 自体の失敗検知を別経路で確保

## 完了条件

- [ ] 監視用 Token が `Audit Logs:Read` のみで発行済み（deploy Token と分離）
- [ ] schedule workflow が 1 時間毎に成功実行（連続 7 日 green）
- [ ] D1 `cf_audit_log` table に log が蓄積され、TTL で自動削除される
- [ ] HIGH / MEDIUM / LOW の重要度別 alerting が機能し、Issue 自動起票が動作する
- [ ] 学習期間 7 日後、閾値ベースで誤検知率 5% 以内
- [ ] 監視 workflow 自体の失敗が別経路で検知される
- [ ] 監視 Token が deploy Token と独立に rotation 可能

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-12.md | 監視要件の発生元 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Secrets 正本仕様（監視 Token 分離） |
| 関連 | docs/30-workflows/unassigned-task/UT-25-DERIV-03-cf-secrets-audit-log.md | secret 配置 audit log との重複排除 |
| 関連 | docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md | alerting 経路の設計共有 |
| 関連 | docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md | rotation 期間を学習対象外にする meta-data 連携 |
| 参考 | https://developers.cloudflare.com/fundamentals/setup/account/account-security/review-audit-logs/ | Cloudflare Audit Logs API |
| 参考 | https://api.github.com/meta | GitHub Actions runner IP range |
