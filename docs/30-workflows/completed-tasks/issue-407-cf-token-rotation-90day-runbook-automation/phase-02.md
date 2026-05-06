# Phase 2: 設計 — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: Phase 1 の DoD を達成するため、(a) runbook の章立てと内部リンク構造、(b) 実施記録テンプレのフィールド設計、(c) `.github/workflows/cf-token-rotation-reminder.yml` の yaml 構造、(d) 入出力 / エラーハンドリング / セキュリティ / rollback を確定する。yaml 設計は GitHub Actions 上で定期実行される副作用システムであり docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 2 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で固定した「runbook 章立て 9 項目 / 実施記録 10+ 項目 / workflow yaml 構造」を、Phase 5 ランブックがそのまま実装に落とせる粒度の設計として確定する。

## 実行アーキテクチャ

```
[Wave 1: runbook 運用フロー]

  operator
     │
     ▼ (G2: production 直前 user approval)
  docs/30-workflows/operations/cf-token-rotation-runbook.md
     │ (手順に従う)
     ▼
  bash scripts/cf.sh ...   ──→  Cloudflare Dashboard / API
     │                              │
     ▼                              ▼
  gh secret set --env <env>    Cloudflare API Token
  CLOUDFLARE_API_TOKEN          (新規発行 / 旧 Token 無効化)
     │
     ▼
  docs/30-workflows/operations/cf-token-rotation-log.md
  (実施記録 append-only / Token 値非含有)


[Wave 2: 自動 Issue 起票フロー]

  GitHub Actions schedule (cron 日次 UTC)
     │
     ▼
  .github/workflows/cf-token-rotation-reminder.yml
     │
     ├── inputs: vars.CF_TOKEN_ISSUED_AT (ISO 8601)
     │
     ├── compute: now - issued_at >= 85 days ?
     │            && existing open issue absent ?
     │
     ├── dry_run? ── true ──→ $GITHUB_STEP_SUMMARY にプレビュー出力（Issue 起票なし）
     │              false ─→ gh issue create
     │
     ▼
  GitHub Issue (assignee: @daishiman)
  本文: runbook link + last log link + 経過日数 + 推奨期日
```

## 変更対象ファイル一覧

### 新規作成

| パス | 種別 | 役割 |
| --- | --- | --- |
| `docs/30-workflows/operations/cf-token-rotation-runbook.md` | markdown | rotation 手順正本（章立て 9 節） |
| `docs/30-workflows/operations/cf-token-rotation-log.md` | markdown | 実施記録テンプレ + append-only 蓄積。Token 値非含有 |
| `.github/workflows/cf-token-rotation-reminder.yml` | yaml | schedule + workflow_dispatch トリガーの自動 Issue 起票 workflow |

### 更新（任意 / Phase 12 で確定）

| パス | 内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | rotation runbook への相対リンクを「Cloudflare API Token rotation」セクションに追記。本文は 1〜3 行 |
| `.github/CODEOWNERS` | 既存の `.github/workflows/**` ルールでカバーされる前提。drift 時のみ更新 |

## runbook 章立て設計（`cf-token-rotation-runbook.md`）

```
# Cloudflare API Token 90 日 rotation runbook

## 1. 概要
- 対象: long-lived Cloudflare API Token（apps/api / apps/web の deploy / D1 操作で使用）
- 周期: 90 日（経験則。根拠は §1.1）
- 関連自動化: .github/workflows/cf-token-rotation-reminder.yml（85 日経過で Issue 起票）
### 1.1 90 日選定根拠
### 1.2 24h 並行運用の根拠

## 2. 用語と前提
- 最小 scope Token / staging-first / 24h 並行 / 旧 Token 無効化 → 削除の 2 段階
- 1Password vault Item 名（参照のみ。値は op:// 経由で動的注入）
- GitHub Environments（staging / production）と required reviewers の関係

## 3. 事前確認チェックリスト
- bash scripts/cf.sh whoami 出力に必要 scope（Workers Scripts:Edit / D1:Edit / Pages:Edit）が含まれること
- 1Password expiry reminder が 90 日後に有効化されていること
- 現行 Token の発行日（GitHub Variables CF_TOKEN_ISSUED_AT）と残期間
- staging / production の直近 deploy が PASS していること

## 4. staging rotation 手順
4.1 旧 staging Token の保全（Dashboard で disable せず残す）
4.2 新 staging Token 発行（Cloudflare Dashboard。scope は U-FIX-CF-ACCT-01 で確立した最小 scope を踏襲）
4.3 1Password Item を新 Token 値で更新（実値は op:// 参照のみ、ファイルに書かない）
4.4 gh secret set CLOUDFLARE_API_TOKEN --env staging（op run 経由）
4.5 staging smoke 実行
   - bash scripts/cf.sh whoami（新 Token で）
   - bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
   - bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
   - bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
4.6 24h 観察（Workers エラー率 / D1 read エラー）
4.7 旧 staging Token を Dashboard で無効化（削除はせず disabled 状態）
4.8 24h 後に旧 staging Token を削除

## 5. production rotation 手順
※ §4 全 PASS を G2 ゲートで user 承認してから本節へ進む
5.1 旧 production Token の保全
5.2 新 production Token 発行
5.3 1Password Item を新 Token 値で更新
5.4 gh secret set CLOUDFLARE_API_TOKEN --env production
5.5 production smoke
   - bash scripts/cf.sh whoami
   - bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production（必要時のみ。secret 反映の確認）
5.6 24h 並行運用（旧 Token を disable せず残す）
5.7 旧 production Token を Dashboard で無効化（disabled）
5.8 24h 後に旧 production Token を削除
5.9 GitHub Variables CF_TOKEN_ISSUED_AT を ISO 8601 で更新

## 6. rollback 手順
6.1 旧 Token Dashboard 再有効化（disabled → enabled）
6.2 gh secret set CLOUDFLARE_API_TOKEN で旧 Token 値を再注入
6.3 新 Token を Dashboard で失効
6.4 GitHub Variables CF_TOKEN_ISSUED_AT を rollback 後の発行日に更新
6.5 cf-token-rotation-log.md に rollback 経緯を追記（Token 値非含有）

## 7. 1Password expiry reminder 設定手順
- Item の expiry 日付フィールドに「発行日 + 90 日」を入力
- 通知設定（vault 共通設定）が有効化されていること
- 値は op:// 参照のみ。Token 文字列をクリップボードに残さない運用

## 8. 実施記録手順
- cf-token-rotation-log.md の末尾に新規エントリを追記（テンプレは §8.1）
- Token 値・Token ID・scope 値は記録しない。発行時刻・失効時刻・検証結果のみ
- 関連 PR / Issue / 自動起票 reminder Issue へのリンクを残す

## 9. 既知の落とし穴
- 24h 並行中の deploy 衝突
- wrangler のローカル credential キャッシュ
- GitHub Environments required reviewers と secret update タイミング
- OIDC 化（DERIV-01）後は本 runbook が改訂対象になる旨
```

## 実施記録テンプレ設計（`cf-token-rotation-log.md`）

```markdown
# Cloudflare API Token rotation 実施記録

> Token 値・Token ID・scope 値は記録しない。発行時刻 / 失効時刻 / 検証結果のみ append-only で蓄積する。

## entry テンプレ

### YYYY-MM-DD rotation #N

| 項目 | 値 |
| --- | --- |
| 実施日 | YYYY-MM-DD |
| operator | <github handle> |
| 関連 reminder Issue | #<issue-number>（自動起票 / 手動起票 / なし） |
| 関連 PR | #<pr-number>（runbook 改訂や workflow 修正があれば） |
| staging 新 Token 発行時刻 | YYYY-MM-DDTHH:MMZ |
| staging smoke PASS 時刻 | YYYY-MM-DDTHH:MMZ |
| staging 旧 Token 無効化時刻 | YYYY-MM-DDTHH:MMZ |
| staging 旧 Token 削除時刻 | YYYY-MM-DDTHH:MMZ |
| production 新 Token 発行時刻 | YYYY-MM-DDTHH:MMZ |
| production 24h 並行終了時刻 | YYYY-MM-DDTHH:MMZ |
| production 旧 Token 無効化時刻 | YYYY-MM-DDTHH:MMZ |
| production 旧 Token 削除時刻 | YYYY-MM-DDTHH:MMZ |
| 検証結果サマリ | PASS / FAIL（FAIL 時は事象と対応） |
| GitHub Variables CF_TOKEN_ISSUED_AT 更新値 | YYYY-MM-DD |
| rollback 有無 | なし / あり（経緯を 1〜3 行） |
```

## workflow yaml 構造設計（`.github/workflows/cf-token-rotation-reminder.yml`）

```yaml
name: cf-token-rotation-reminder

on:
  schedule:
    # 毎日 00:00 UTC に経過日数を判定
    - cron: '0 0 * * *'
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'true なら Issue 起票せず step summary にプレビューのみ出す'
        required: false
        default: 'true'
        type: choice
        options: ['true', 'false']

permissions:
  issues: write
  contents: read

jobs:
  remind:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    env:
      ISSUED_AT: ${{ vars.CF_TOKEN_ISSUED_AT }}        # ISO 8601 (e.g. 2026-02-01)
      THRESHOLD_DAYS: '85'
      RUNBOOK_PATH: 'docs/30-workflows/operations/cf-token-rotation-runbook.md'
      LOG_PATH: 'docs/30-workflows/operations/cf-token-rotation-log.md'
      DEFAULT_ASSIGNEE: 'daishiman'
      ISSUE_TITLE_PREFIX: '[cf-token-rotation] 90日rotation期日が接近'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Compute elapsed days and decide
        id: decide
        shell: bash
        run: |
          set -euo pipefail
          if [[ -z "${ISSUED_AT:-}" ]]; then
            echo "::error::vars.CF_TOKEN_ISSUED_AT が未設定です"
            exit 1
          fi
          ISSUED_EPOCH=$(date -u -d "${ISSUED_AT}" +%s)
          NOW_EPOCH=$(date -u +%s)
          ELAPSED_DAYS=$(( (NOW_EPOCH - ISSUED_EPOCH) / 86400 ))
          DUE_AT=$(date -u -d "${ISSUED_AT} + 90 days" +%Y-%m-%d)
          echo "elapsed_days=${ELAPSED_DAYS}" >> "$GITHUB_OUTPUT"
          echo "due_at=${DUE_AT}" >> "$GITHUB_OUTPUT"
          if (( ELAPSED_DAYS >= THRESHOLD_DAYS )); then
            echo "should_remind=true" >> "$GITHUB_OUTPUT"
          else
            echo "should_remind=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Detect existing open reminder issue
        if: steps.decide.outputs.should_remind == 'true'
        id: existing
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          set -euo pipefail
          COUNT=$(gh issue list \
            --state open \
            --search "in:title \"${ISSUE_TITLE_PREFIX}\"" \
            --json number --jq 'length')
          echo "count=${COUNT}" >> "$GITHUB_OUTPUT"

      - name: Build issue body
        if: steps.decide.outputs.should_remind == 'true'
        id: body
        run: |
          {
            echo "## Cloudflare API Token 90 日 rotation 期日が接近"
            echo
            echo "- 経過日数: ${{ steps.decide.outputs.elapsed_days }} 日"
            echo "- 推奨実施期日: ${{ steps.decide.outputs.due_at }}"
            echo "- runbook: [\`${RUNBOOK_PATH}\`](../blob/main/${RUNBOOK_PATH})"
            echo "- 実施記録: [\`${LOG_PATH}\`](../blob/main/${LOG_PATH})"
            echo
            echo "### 着手手順"
            echo "1. runbook §3 事前確認チェックリストを実施"
            echo "2. staging rotation（runbook §4）"
            echo "3. user approval (G2) → production rotation（runbook §5）"
            echo "4. 実施記録を ${LOG_PATH} に append"
          } > /tmp/body.md
          echo "path=/tmp/body.md" >> "$GITHUB_OUTPUT"

      - name: Dry-run preview
        if: steps.decide.outputs.should_remind == 'true' && (github.event.inputs.dry_run == 'true' || github.event_name == 'schedule' && false)
        run: |
          {
            echo "### dry-run preview"
            echo "- elapsed_days: ${{ steps.decide.outputs.elapsed_days }}"
            echo "- existing open issues: ${{ steps.existing.outputs.count }}"
            echo
            cat /tmp/body.md
          } >> "$GITHUB_STEP_SUMMARY"

      - name: Create issue
        if: >-
          steps.decide.outputs.should_remind == 'true'
          && steps.existing.outputs.count == '0'
          && (github.event_name == 'schedule' || github.event.inputs.dry_run == 'false')
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh issue create \
            --title "${ISSUE_TITLE_PREFIX} (${{ steps.decide.outputs.elapsed_days }}日経過 / 期日 ${{ steps.decide.outputs.due_at }})" \
            --body-file /tmp/body.md \
            --assignee "${DEFAULT_ASSIGNEE}" \
            --label "ops,cloudflare,token-rotation"
```

> 注: 実装段階で `if:` 式の正確性は GitHub Actions の expression 仕様で再検証する。`schedule` 実行時の dry-run 既定値は「Issue 起票する（dry-run しない）」と設計し、`workflow_dispatch` 経由の手動実行のみが dry-run プレビューを既定とする。

## 入出力データ構造

### GitHub Variables 入力

| 変数 | 型 | 例 | 用途 |
| --- | --- | --- | --- |
| `vars.CF_TOKEN_ISSUED_AT` | string (ISO 8601 date) | `2026-02-01` | 経過日数算出の基準日 |

### Issue 出力

| 項目 | 値の出所 |
| --- | --- |
| title | `${ISSUE_TITLE_PREFIX}` + 経過日数 + 期日 |
| body | runbook link + log link + 経過日数 + 期日 + 着手手順 |
| assignee | `@daishiman`（CODEOWNERS と整合） |
| labels | `ops`, `cloudflare`, `token-rotation` |

### 実施記録（log）出力

§「実施記録テンプレ設計」参照。append-only。

## エラーハンドリング

| 事象 | 検知 | 対応 |
| --- | --- | --- |
| `vars.CF_TOKEN_ISSUED_AT` 未設定 | step `Compute elapsed days` の guard で `::error::` | workflow を fail させ、初回設定を runbook §3 事前確認に追加で促す |
| `gh issue list` 取得失敗 | exit != 0 | step を fail させる。重複起票より「fail で気付かせる」方が安全 |
| 既存 open Issue が 1 件以上 | `count >= 1` | 起票 step を skip。step summary にスキップ理由を出力 |
| `gh issue create` 失敗（rate limit / permission） | exit != 0 | workflow fail。手動 fallback を runbook に明記（手動 Issue 作成 → log 記録） |
| dry-run 経由でロジック誤検出 | step summary プレビューで気付く | `workflow_dispatch` を運用標準として「dry-run 先行」を CONTRIBUTING に追記（任意） |
| runbook §4 staging smoke 失敗 | `bash scripts/cf.sh deploy` が exit != 0 | rollback §6 へ。production rotation は実施しない |
| runbook §5 production smoke 失敗 | 同上 | rollback §6.2 で旧 Token 再注入 |

## セキュリティ

- runbook / 実施記録 / yaml / step ログに Cloudflare API Token 値・Token ID・scope 値が現れない（grep で 0 件確認を Phase 7 ゲートに設置）
- `GH_TOKEN` は `github.token`（GITHUB_TOKEN）のみ使用。長命 PAT を Secrets に追加しない
- workflow `permissions:` を `issues: write` / `contents: read` に限定（`secrets:` / `actions:` / `packages:` 不要）
- 自動起票の Issue 本文に Token メタを含めない（経過日数 / 期日 / 手順リンクのみ）
- 1Password Item は op:// 参照のみ。Token 文字列をクリップボードや shell history に残さない運用を runbook §7 に明記

## ローカル実行コマンド

| 用途 | コマンド |
| --- | --- |
| workflow 構文 lint | `pnpm dlx @action-validator/cli .github/workflows/cf-token-rotation-reminder.yml` または GitHub Actions side で `actionlint`（Phase 4 で確定） |
| 経過日数算出のローカル検証 | `ISSUED_AT=2026-02-01 bash -c 'date -u -d "$ISSUED_AT + 90 days" +%Y-%m-%d'` |
| dry-run 実行 | `gh workflow run cf-token-rotation-reminder.yml -f dry_run=true` → `gh run view --log` |
| runbook 机上トレース | `bash scripts/cf.sh whoami`（事前確認のみ。Token 発行は実施しない） |

## Rollback 手順

| 対象 | 手順 |
| --- | --- |
| workflow yaml が誤起票を連発する | `gh workflow disable cf-token-rotation-reminder.yml` で停止 → 修正 PR で再有効化 |
| Issue を誤起票（重複 / 早すぎ） | 手動で close + 理由コメント。`existing.count` ロジックを Phase 11 で再検証 |
| Token rotation 自体の rollback | runbook §6 の手順に従う（本仕様書外、runbook 内で完結） |

## DoD 候補（Phase 7 AC マトリクスへ引き渡し）

- runbook 章立て 9 節がすべて記述されている
- 実施記録テンプレに 13 フィールドが揃い、Token 値項目が存在しない
- yaml に `on.schedule` / `on.workflow_dispatch` / `permissions` / 経過日数算出 / 重複検知 / dry-run / Issue 起票の 7 ブロックが揃っている
- yaml に `secrets:` 参照が存在しない（最小権限）
- ローカル実行コマンド 4 種が動作可能（Phase 11 で実測）
- runbook / log / yaml に Token 値・ID・scope 値の混入が grep で 0 件

## 参照資料

- `phase-01.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `scripts/cf.sh`
- `CLAUDE.md`

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01（最小 scope Token） / 1Password Item 設計
- 下流: U-FIX-CF-ACCT-01-DERIV-01（OIDC 化）— OIDC 化が完了したら本 runbook を改訂対象として移譲

## 多角的チェック観点

- runbook の章順序（事前確認 → staging → production → rollback）に staging-first ゲートが構造的に組み込まれている
- workflow の `permissions:` が必要最小に絞られている
- 重複起票防止が title 検索で機能する設計になっている
- 機密値非掲載が grep で機械検証可能な構造になっている
- OIDC 化との連続性（runbook §9.4 で「OIDC 化後は改訂対象」と明記する設計）が確保されている

## サブタスク管理

- [ ] runbook 章立て 9 節を確定
- [ ] 実施記録テンプレ 13 フィールドを確定
- [ ] yaml 7 ブロック構造を確定
- [ ] エラーハンドリング表 7 行を確定
- [ ] ローカル実行コマンド 4 種を確定
- [ ] `outputs/phase-02/main.md` を作成

## 成果物

- `outputs/phase-02/main.md`

## 完了条件

- [ ] runbook / 実施記録 / yaml の構造設計がそのまま Phase 5 ランブックに渡せる粒度
- [ ] 機密値非掲載 invariant が grep ベースで Phase 7 で検証可能になっている
- [ ] dry-run / 重複起票防止 / 最小権限が yaml 設計に組み込まれている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で yaml / runbook 本文の実装、commit、push、PR を実行していない
- [ ] CONST_007 に従い未確定事項は Phase 3 / Phase 5 への引き渡し条件として明示

## 次 Phase への引き渡し

Phase 3（設計レビュー）へ:

- 設計案（runbook 章立て / 実施記録テンプレ / yaml 構造 / エラーハンドリング / セキュリティ）
- リスク候補: 90 日選定の妥当性 / 24h 並行根拠 / scope creep / Token 値漏洩 / rollback 失敗 / 重複起票 / `vars.CF_TOKEN_ISSUED_AT` 未設定
- 代替案候補: schedule cron 粒度（日次 vs 週次） / Issue 起票 vs Slack / Email 通知 / dry-run 既定値の選び方 / 自動 PR で `CF_TOKEN_ISSUED_AT` を更新するか手動更新か

## 実行タスク

- [ ] phase-02 の既存セクションに記載した手順・検証・成果物作成を実行する。
