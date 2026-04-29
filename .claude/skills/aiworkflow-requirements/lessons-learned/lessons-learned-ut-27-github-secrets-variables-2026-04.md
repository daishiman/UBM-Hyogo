# Lessons Learned — UT-27 GitHub Secrets / Variables 配置（2026-04-29）

> task: `ut-27-github-secrets-variables-deployment`
> 関連 spec: `references/deployment-gha.md`（UT-27 章）/ `references/deployment-secrets-management.md`（UT-27 同期運用章）/ `references/environment-variables.md`（CI/CD 環境章）
> 関連 LOGS: 2026-04-29 entry
> 親仕様: `docs/30-workflows/completed-tasks/ut-27-github-secrets-variables-deployment/index.md` §「苦戦箇所・知見」

## 教訓一覧

### L-UT27-001: Environments スコープと repository スコープの解決順序を最初に決め切る
- **背景**: `backend-ci.yml` の `deploy-staging` ジョブが `environment: name: staging` を宣言していると、environment-scoped secret/variable が同名 repository-scoped を **常に上書き**する。staging だけ別 Cloudflare Account にしたい場合に repository-scoped にだけ値を入れていると、意図せず production 値が staging にも参照される/されない drift が起きる。
- **教訓**: **「Environments 側に明示配置を既定」**にし、repository-scoped と同名 secret を併存させない。`gh secret list` / `gh secret list --env <name>` で 2 系統を必ず照合する。
- **適用**: 新しい CD secret 追加時は配置層（repo / env）を Phase 2 配置決定マトリクスで先に決める。同名併存は drift とみなしてロールアウト前に解消する。

### L-UT27-002: `CLOUDFLARE_PAGES_PROJECT` を Secret ではなく Variable にする
- **背景**: `web-cd.yml` で `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` のように suffix 連結に使われる非機密値。Secret 化すると CI ログがマスクされ、運用ログから値の解決過程を追えない。
- **教訓**: **マスク不要 + ログ可視性が欲しい値は Variable**。Secret/Variable 判定基準を「マスクが必要か」だけで決め、デバッグ性を維持する。
- **適用**: 配置決定マトリクスは Secret/Variable/環境スコープの 3 軸で記録する。Variable 化した値はログ転記禁止対象から外す。

### L-UT27-003: `if: secrets.X != ''` は無音失敗する（env 受け shell 判定で回避）
- **背景**: 既存 workflow に `if: ${{ always() && secrets.DISCORD_WEBHOOK_URL != '' }}` のような書き方があるが、GitHub Actions は job-level `secrets` context を `if` で評価できない場面があり、**通知ステップが無音で skip** される事故が起きる。
- **教訓**: 通知系は **「常にステップに入る → env で受ける → shell で空文字判定して early-return」**に置き換える。Phase 11 の dev push smoke で「未設定でも CI 全体は green、通知だけ skip」を必ず動作確認項目に含める。
- **適用**: 新規 CD ステップで `if: secrets.X != ''` の書き方を新規導入しない。既存ワークフロー touch 時は env 受けパターンに置き換える PR を切る。

### L-UT27-004: 1Password 正本 / GitHub 派生コピー — drift 防止に Last-Updated メモを付ける
- **背景**: 1Password が正本で GitHub Secrets はコピーである旨を運用ドキュメントに明記しないと、**GitHub UI 側の値が事実上の正本化**して 1Password が古くなる drift が起きる。MVP では `op` サービスアカウントを runner に導入していないため手動同期になる。
- **教訓**: 同期は **`op read` → 一時環境変数 → `gh secret set --body "$VAR"` → `unset`** の 3 段で行い、shell history と中間ファイルに実値を残さない。同期後は 1Password Item Notes に **Last-Updated 日時のみ**（値ハッシュは記録しない）を記録し、ローテーション時の起点を 1Password に固定する。
- **適用**: GitHub UI 上での直編集を禁止する。値ローテーション時は「1Password 更新 → GitHub 上書き → Last-Updated 更新」の順序を守る。

### L-UT27-005: `CLOUDFLARE_API_TOKEN` のスコープ最小化と命名規則
- **背景**: Global API Key の流用は厳禁。Token を発行する際に必要以上のスコープを付けると、漏洩時の影響範囲が拡大する。Token 命名が `cloudflare-token-1` のような曖昧名だとローテーション履歴が追えない。
- **教訓**: 最小スコープは **Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read** のみ。命名規則は **`ubm-hyogo-cd-{env}-{yyyymmdd}`**（例: `ubm-hyogo-cd-staging-20260429`）として、用途・環境・発行日を必ず Token 名に含める。
- **適用**: Token 追加・ローテーション時はチェックリストでスコープと命名を確認する。`Account Settings Read` 以外の Read 権限は不要。

### L-UT27-006: rollback 経路 3 系統を事前に明記する
- **背景**: 配置失敗 / token 漏洩 / environment 構成ミスのいずれかが起きた時に、復旧経路を即時に判断できないと「運用が止まる」事故になる。
- **教訓**: 以下 3 経路を runbook に明示する。
  1. **GitHub 側で削除 → 再注入**: `gh secret delete <NAME> --env <name>` → 1Password から再 `gh secret set`
  2. **Cloudflare 側で token 失効・再発行**: Cloudflare ダッシュボードで該当 API Token を Revoke → 新規発行 → 1Password 更新 → GitHub 同期
  3. **Environment 自体を削除**: `gh api repos/{owner}/{repo}/environments/{name} -X DELETE` で environment ごと初期化（最終手段）
- **適用**: Phase 13 の実配置時 runbook に上記 3 経路と判断基準を記載する。秘密漏洩時は (2) → (1) の順序で必ず token 失効を先行させる。

## 申し送り先

- Phase 13（実 secret 配置 / 実 dev push trigger）: ユーザー明示承認後に実行
- 上流ブロッカー: UT-05（CI/CD pipeline 実装の現状）
- 下流: UT-25（Cloudflare Secrets `scripts/cf.sh` 経由配置）/ UT-28（Pages projects 作成）/ UT-29（post-CD smoke）/ UT-06（production deployment）
- 将来移行候補: `op` サービスアカウントによる runner 直接参照（`1password/load-secrets-action` または `1Password secret URI`）— 手動同期の自動化
