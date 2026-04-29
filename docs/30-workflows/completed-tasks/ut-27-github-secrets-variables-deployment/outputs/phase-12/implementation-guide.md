# Phase 12 outputs / implementation-guide — 実装ガイド（Part 1 + Part 2）

> **本ガイドは「中学生でも読める例え話」と「開発者向け技術詳細」の 2 パート構成。** secret 値（API Token / Webhook URL / Account ID 等の実値）は本ガイドに**一切記載しない**。`op://` 参照と `"$VAR"` のみ記述する。

## Part 1: 中学生でもわかる「GitHub Secrets / Variables / Environments」入門

### 例え 1: GitHub Secrets は「家の鍵をしまう金庫」

家の鍵（Cloudflare API Token）を玄関マットの下に置いておくと、泥棒に取られて家中が荒らされる。代わりに金庫（GitHub Secrets）にしまうと、必要なときだけ取り出されて、終わったらまた金庫に戻る。GitHub のログには「鍵を使ったよ」とは出るが、「鍵の番号は何番だったか」は**伏せられる（マスクされる）**。

### 例え 2: Variables は「玄関に貼る家族の名前」

家族の名前（プロジェクト名 = `CLOUDFLARE_PAGES_PROJECT`）は秘密じゃないから、玄関に貼っておいてもいい。誰が見ても困らないし、宅配便の人が見やすい。だから「金庫」じゃなく「貼り紙」（Variable）に書く。GitHub のログにもそのまま表示される。

### 例え 3: Environments は「部屋ごとに別の鍵を用意する」

リビング（staging = テスト環境）と書斎（production = 本番環境）に同じ鍵を使うと、リビングの鍵を友達に貸して落としたら、書斎まで開けられてしまう。それぞれに**別の鍵**を用意する（environment-scoped Secret）と、片方が落ちても片方は守られる。

逆に「玄関全体の鍵」（repository-scoped）と「部屋ごとの鍵」（environment-scoped）に**同じ名前で 2 種類**置くと、「どっちの鍵が今使われてるんだっけ？」と分からなくなる。本タスクでは「同じ名前で 2 種類置かない」ルールにする。

### 例え 4: 1Password は「鍵の本物」、GitHub Secrets は「鍵の写し」

本物の鍵は 1Password という鍵屋さんに保管してもらう。GitHub にはコピー（写し）を置く。**本物を新しいものに変えたら、必ずコピーも更新する**（同期手順）。GitHub の方を直接書き換えると、「あれ、本物はどっちだっけ？」と混乱する事故（drift）が起きる。

更新したら 1Password の Item Notes に「いつ更新したか」をメモする。これが「Last-Updated メモ」。

### 例え 5: `if: secrets.X != ''` は「誰もいない玄関で『ただいま』と言う」

GitHub の仕様で `if: secrets.DISCORD_WEBHOOK_URL != ''` と書くと、「鍵が設定されてないときは挨拶（Discord 通知）をスキップする」つもりが、**実は誰にも届かず**に通知ステップごと無音失敗することがある。

代わりに「いつでも玄関に入って、家族（DISCORD_WEBHOOK_URL）がいるか目視で確認してから挨拶する」方式にする。これを技術的に書くと:

```yaml
- name: Discord 通知
  if: ${{ always() }}    # 常に通知ステップに入る
  env:
    DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}  # env で受ける
  run: |
    if [ -z "$DISCORD_WEBHOOK_URL" ]; then
      echo "DISCORD_WEBHOOK_URL 未設定のため通知 skip"
      exit 0   # CI を fail させずに早期終了
    fi
    # 実際の通知処理...
```

### Part 1 専門用語セルフチェック表

| 用語 | 日常語への言い換え |
| --- | --- |
| GitHub Secrets | 家の鍵をしまう金庫 |
| GitHub Variables | 玄関に貼る家族の名前（秘密じゃない情報） |
| Environments（staging/production） | 部屋ごとに別の鍵を用意する |
| repository-scoped vs environment-scoped | 玄関全体の鍵 vs 部屋ごとの鍵 |
| 1Password 正本 / GitHub 派生コピー | 鍵の本物 / 鍵の写し |
| `op read` + `unset` | 必要なときだけ鍵を出して、使い終わったら金庫に戻す |
| `if: secrets.X != ''` 無音失敗 | 誰もいない玄関で「ただいま」と言って気づかないこと |
| API Token 最小スコープ | 鍵に「リビングだけ開く」と書いておく（書斎は開けられない） |
| dev push smoke | 鍵をかけ替えた直後に、玄関を開け閉めして動くか確かめる |
| rollback | 元の鍵に戻す（金庫から古い鍵を出す） |

---

## Part 2: 開発者向け技術詳細

### 2-1. GitHub Secrets / Variables / Environments の関係

| 種別 | scope 階層 | マスク | 用途 |
| --- | --- | --- | --- |
| Secret | organization / repository / environment | あり | 機密値（token / webhook URL / account ID 等） |
| Variable | organization / repository / environment | なし | 非機密値（プロジェクト名 / suffix 等） |
| Environment | repository 配下 | N/A | environment-scoped Secret/Variable のグループ化 + deployment ログ分離 |

**解決順序**: `environment: name:` 宣言があるジョブは environment-scoped が repository-scoped を上書き解決する。

### 2-2. Secret / Variable 判定基準

- マスクが必要 = Secret
- マスク不要かつログ可視性が欲しい = Variable
- `CLOUDFLARE_PAGES_PROJECT` を Variable にする理由: `web-cd.yml` の `--project-name=${{ vars.X }}-staging` の suffix 連結結果が CI ログから追える（Secret にすると `***-staging` のようにマスクされ、デバッグ困難）

### 2-3. 配置決定マトリクス（Phase 2 §配置決定マトリクス 再掲）

| 名前 | 種別 | base scope | 推奨追加配置 | 理由 |
| --- | --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret | environment-scoped（staging / production） | repository-scoped に置かない（同名併存禁止） | environment ごとに別 token、漏洩時影響限定 |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | repository-scoped | 不要（同一アカウント想定） | アカウントが分かれる場合のみ environment-scoped に切替 |
| `DISCORD_WEBHOOK_URL` | Secret | repository-scoped | 必要ならチャンネル分離で environment-scoped | MVP は単一チャンネル |
| `CLOUDFLARE_PAGES_PROJECT` | **Variable** | repository-scoped | プロジェクト命名が environment 別なら environment-scoped | `${{ vars.X }}-staging` suffix 連結のログ可視性 |

### 2-4. `gh` CLI コマンド系列（仕様レベル / 実 PUT は Phase 13）

```bash
# ===== 0. 上流確認（lane 1） =====
grep -nE "secrets\.|vars\." .github/workflows/{backend-ci,web-cd}.yml
op item get "Cloudflare" --vault UBM-Hyogo > /dev/null

# ===== 1. environment 作成（lane 2） =====
gh api repos/daishiman/UBM-Hyogo/environments/staging    -X PUT --silent
gh api repos/daishiman/UBM-Hyogo/environments/production -X PUT --silent

# ===== 2. secret 配置（lane 3） =====
# 1Password 一時環境変数 + unset パターン（後述 §2-5）

# ===== 3. variable 配置（lane 4） =====
export TMP_CF_PAGES_PROJECT="$(op read 'op://UBM-Hyogo/Cloudflare/pages_project_name')"
gh variable set CLOUDFLARE_PAGES_PROJECT --body "$TMP_CF_PAGES_PROJECT"
unset TMP_CF_PAGES_PROJECT

# ===== 4. 動作確認（lane 5 / Phase 11 manual-smoke-log.md と同一） =====
git commit --allow-empty -m "chore(cd): trigger deploy-staging smoke [UT-27]"
git push origin dev
gh run watch  # backend-ci.yml / web-cd.yml deploy-staging が green であることを確認

# ===== 5. 同期検証（lane 5） =====
gh secret list                  # 配置済件数とスコープ確認（値はマスク）
gh secret list --env staging
gh secret list --env production
gh variable list                # CLOUDFLARE_PAGES_PROJECT が表示
# 1Password Item Notes の Last-Updated メモを更新
```

### 2-5. 1Password 一時環境変数 + unset パターン

```bash
# 前提: gh auth login 済み / op signin 済み

# 1. 1Password から値を一時 export（環境変数のみ・ファイル化禁止）
export TMP_CF_TOKEN_STG=$(op read "op://UBM-Hyogo/Cloudflare/api_token_staging")
export TMP_CF_TOKEN_PRD=$(op read "op://UBM-Hyogo/Cloudflare/api_token_production")
export TMP_CF_ACCT=$(op read "op://UBM-Hyogo/Cloudflare/account_id")
export TMP_DISCORD=$(op read "op://UBM-Hyogo/Discord/webhook_url")

# 2. GitHub に PUT（--body は環境変数経由で値が history に残らない）
gh secret set CLOUDFLARE_API_TOKEN  --env staging    --body "$TMP_CF_TOKEN_STG"
gh secret set CLOUDFLARE_API_TOKEN  --env production --body "$TMP_CF_TOKEN_PRD"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$TMP_CF_ACCT"
gh secret set DISCORD_WEBHOOK_URL   --body "$TMP_DISCORD"

# 3. 一時変数のクリア
unset TMP_CF_TOKEN_STG TMP_CF_TOKEN_PRD TMP_CF_ACCT TMP_DISCORD

# 4. 1Password 側 Item Notes に Last-Updated 日時を追記（ハッシュは記載しない）
```

### 2-6. dev push smoke 4 ステップ（Phase 11 manual-smoke-log.md と同一）

| STEP | 内容 | 期待結果 |
| --- | --- | --- |
| 0 | 上流 3 件 completed 確認 + `gh secret list` / `gh variable list` で配置済確認 | 4 件すべて配置済 |
| 1 | `git commit --allow-empty && git push origin dev` | dev branch に commit、CD trigger |
| 2 | `gh run watch` × 2（backend-ci / web-cd） | deploy-staging green |
| 3 | Discord 通知到達 + 未設定耐性確認 | 通知到達 / 未設定時 CI success |

### 2-7. 同名併存禁止

- repository-scoped と environment-scoped に同名 secret を併存させると、どちらが効いているか曖昧化する。
- 監査時に `gh secret list` と `gh secret list --env X` の両方を照合し、同名が両方に出ないこと（または明示的な意図がある場合のみ許可）を確認する。

### 2-8. API Token 最小スコープ

- 必要スコープ: `Account.Cloudflare Pages.Edit` / `Account.Workers Scripts.Edit` / `Account.D1.Edit` / `Account.Account Settings.Read`
- 禁止: Global API Key 流用 / `Account.Account Settings.Edit` / `Zone.*` の全領域付与
- Token 命名規則: `ubm-hyogo-cd-{env}-{yyyymmdd}`（用途・環境・発行日を含む）

### 2-9. `if: secrets.X != ''` 代替設計

Part 1 §例え 5 のコード例参照。`if: ${{ always() }}` で常にステップに入り、env で受けてシェルで空文字判定する。`web-cd.yml` / `backend-ci.yml` 側に未導入なら UT-05 へのフィードバックとして Phase 12 unassigned-task-detection に登録。

### 2-10. rollback 経路

| # | 経路 | コマンド | 用途 |
| --- | --- | --- | --- |
| 1 | 通常 rollback | `gh secret delete NAME [--env X]` + 1Password から再注入 | 値の誤配置 / 古い値復元 |
| 2 | Cloudflare 側 rollback | Cloudflare Dashboard で API Token 失効・再発行 → Phase 13 op-sync で同期 | token 漏洩疑い時 |
| 3 | environment 削除 | `gh api repos/.../environments/{env} -X DELETE` | environment 自体の作り直し |

### 2-11. 二重正本 drift 防止

- **正本は 1Password Environments**。GitHub Secrets / Variables は派生コピー。
- **GitHub UI 直編集を禁止**（drift 源）。必ず 1Password を先に更新 → `op read` + `gh secret set` で同期。
- 1Password Item Notes の Last-Updated 日時を毎回更新（値ハッシュは記載しない）。

### 2-12. 本タスクで扱わない事項

- Cloudflare 側のシークレット注入（`scripts/cf.sh` 経由の Cloudflare Secrets 配置）= UT-25 のスコープ
- `1password/load-secrets-action`（案 D）の即時導入 = 将来移行候補（unassigned-task-detection に登録）
- Terraform GitHub Provider（案 C） = IaC 化フェーズに先送り
