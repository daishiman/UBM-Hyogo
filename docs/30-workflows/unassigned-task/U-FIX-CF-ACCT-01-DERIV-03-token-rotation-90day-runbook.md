# U-FIX-CF-ACCT-01-DERIV-03: Cloudflare API Token 90 日 rotation runbook / 自動化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-03 |
| タスク名 | Cloudflare API Token の 90 日サイクル rotation を runbook 化し、後段で自動化する |
| 優先度 | HIGH |
| 推奨Wave | U-FIX-CF-ACCT-01 完了後（最小 scope Token 運用確立後、即着手推奨） |
| 状態 | unassigned |
| 作成日 | 2026-05-02 |
| 既存タスク組み込み | なし（既存 task-ut-06-fu-h-health-db-token-rotation* は D1 health DB token を対象にしており、Cloudflare API Token とは別領域） |
| 組み込み先 | - |
| 検出元 | docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/outputs/phase-12/unassigned-task-detection.md（HIGH 行） |

## 目的

長命 Cloudflare API Token を 90 日サイクルで rotation する手順を runbook 化し、staging-first / 24h 並行運用 / rollback 経路を含む決定論的なオペレーション手順を確立する。後続 wave で自動化（GitHub Actions schedule + 1Password Connect 経由）まで進める。

> **着手判断基準**: U-FIX-CF-ACCT-01 の最小 scope Token を本番投入したタイミングで即着手。最初の rotation 期日（発行から 90 日）を逃さず実施することが運用上重要。

## スコープ

### 含む

- 手動 rotation runbook（staging → production の順、24h 並行運用、旧 Token 失効）
- rotation トリガーの整備（カレンダー reminder、GitHub Issue 自動起票、1Password の expiry 通知）
- rotation 実施記録のフォーマット定義（実施日、新 Token ID、旧 Token 失効日、検証結果）
- 後段（Wave 2）の自動化: GitHub Actions schedule で「90 日経過 7 日前に Issue 起票」する workflow
- 失敗時 rollback（旧 Token を Dashboard で再有効化 → `gh secret set` で再注入 → 新 Token 失効）

### 含まない

- Token 値そのものの自動発行（Cloudflare API は Token 作成 API を提供するが、scope 設計の人手レビューを残す）
- short-lived credential 化（DERIV-01 で扱う）
- D1 health DB token rotation（task-ut-06-fu-h-health-db-token-rotation* で別途対応）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | U-FIX-CF-ACCT-01 | 最小 scope Token が本番投入されていること |
| 関連 | task-ut-06-fu-h-health-db-token-rotation-001 / -sop-001 | D1 health DB token の rotation 知見を共有 |
| 関連 | UT-25-DERIV-04 | secret 自動配置 workflow と rotation 自動化を統合可能 |
| 下流 | DERIV-01（OIDC 化） | OIDC 化後は rotation 概念が変化するため runbook 改訂が必要 |

## 着手タイミング

| 条件 | 理由 |
| --- | --- |
| U-FIX-CF-ACCT-01 の Token を本番投入直後 | 90 日 rotation 期日を発行日基準で管理するため、初回 rotation までに runbook が必要 |
| 1Password の expiry 通知設定 | rotation トリガーの正本 |
| GitHub Environments の required reviewers 整備 | production rotation 実施時の保護 |

## 苦戦箇所・知見

**1. 90 日サイクルの選定理由**
Cloudflare 公式の推奨ではなく、業界一般的な「四半期 rotation」の運用簡便さと、漏洩発覚から新 Token への切替猶予を両立する経験則。MVP では 90 日で開始し、実運用で長すぎ / 短すぎを判断する。

**2. staging-first を runbook で強制**
staging Token を先に rotation し、Phase 11 相当の smoke が全 PASS してから production rotation に進む。staging 失敗時は production rotation を実施しない。

**3. 24h 並行運用の根拠**
新 Token 投入直後に問題が顕在化した場合、旧 Token を `gh secret set` で再注入できる猶予として 24h 確保する。これより短いと検知前に失効してしまうリスク、長いと旧 Token のブラスト半径が伸びるトレードオフ。

**4. rotation 実施記録の保管場所**
runbook には実施記録テンプレートを含めるが、記録自体は Token 値を含まないため `docs/30-workflows/operations/cf-token-rotation-log.md` 等に追記する形を想定。Token 値は記録しない。

**5. 自動化のスコープ限界**
rotation 自動化で「Token 作成 → secret 投入」まで完全自動化したくなるが、新 Token の scope 設計レビューを人手で残すことで scope creep を防ぐ。Wave 2 の自動化は「期日通知 + Issue 起票」までに留める。

**6. rollback の旧 Token 失効タイミング**
旧 Token は Dashboard で「無効化」状態にしておき、24h 経過後に「削除」する 2 段階運用。無効化状態であれば緊急時に再有効化可能。

## 実行概要

### Wave 1（runbook 整備）

1. `docs/30-workflows/operations/cf-token-rotation-runbook.md` を新規作成
2. 手順記載: staging Token 再発行 → `gh secret set --env staging` → smoke → production Token 再発行 → `gh secret set --env production` → 24h 並行 → 旧 Token 無効化
3. rollback 手順: 旧 Token 再有効化 → `gh secret set` 再注入 → 新 Token 失効
4. 1Password に Token expiry を 90 日後に設定し、reminder を有効化
5. 初回 rotation を本 runbook で実施

### Wave 2（自動化）

1. `.github/workflows/cf-token-rotation-reminder.yml` を `schedule` trigger で作成
2. 発行日メタデータを GitHub Variables（または 1Password）から取得し、85 日経過時点で Issue 自動起票
3. 起票 Issue に runbook へのリンクと前回実施記録を添付
4. assignee 自動設定（CODEOWNERS から）

## 完了条件

### Wave 1

- [ ] runbook（`docs/30-workflows/operations/cf-token-rotation-runbook.md`）が staging-first / 24h 並行 / rollback を含めて完備
- [ ] 1Password に Token expiry 90 日 reminder 設定済み
- [ ] 初回 rotation を runbook 通りに実施し、実施記録が保管されている
- [ ] runbook に Token 値が含まれない

### Wave 2

- [ ] schedule workflow が 85 日経過時点で Issue を起票する
- [ ] 起票 Issue に runbook リンクと前回実施記録が付随する
- [ ] schedule workflow が dry-run できる

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-12.md | rotation runbook 参照元 |
| 必須 | docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/outputs/phase-12/implementation-guide.md | staging→production 適用順序の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Secrets 正本仕様 |
| 関連 | docs/30-workflows/unassigned-task/task-ut-06-fu-h-health-db-token-rotation-sop-001.md | rotation SOP 知見の共有 |
| 関連 | docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md | OIDC 化後の runbook 改訂 |
| 参考 | https://developers.cloudflare.com/fundamentals/api/get-started/create-token/ | Cloudflare API Token 発行手順 |
