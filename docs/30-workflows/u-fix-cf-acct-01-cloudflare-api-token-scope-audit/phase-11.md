# Phase 11: 手動 smoke test（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 11 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（Cloudflare API Token のスコープ最小化監査） |
| 非視覚的理由 | UI / UX 変更を含まない security audit / CI infra |
| 代替証跡 | grep / `gh api` / `gh secret list` / `bash scripts/cf.sh` 出力ログ + Cloudflare Dashboard Token 詳細ページの権限名一覧（値は転記しない） |
| Screenshot | UI/UX変更なしのため Phase 11 スクリーンショット不要 |

## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 必要最小権限テンプレと実 Token に付与された権限の突合を行い、`outputs/phase-11/permission-matrix-validation.md` に記録する。
3. staging 環境で smoke コマンドを実行し、`outputs/phase-11/manual-smoke-log.md` に記録する。
4. `outputs/phase-11/main.md` でサマリと完了条件の充足を宣言する。
5. Token 値・Account ID 値を成果物に残していないことを確認する。

## 目的

Phase 2 で定義した必要最小権限マトリクス（Workers Scripts:Edit / D1:Edit / Cloudflare Pages:Edit / Account Settings:Read）が staging 環境で過不足なく動作することを実機で検証する。Workers KV Storage:Edit / User Details:Read は、4 権限では実行できないことがログで確認された場合のみ追加候補として扱う。

## 参照資料

- `index.md`
- `artifacts.json`
- Phase 2 成果物（`outputs/phase-02/main.md`）
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `scripts/cf.sh`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`

## 入力

- Phase 5（実装ランブック）完了後の staging Token（最小権限を適用済み）
- 旧 Token（rollback 用に 24h 保持中）
- staging environment の `CLOUDFLARE_API_TOKEN` Secret 更新済み

## 実施手順

### Static 検証（Token 値を露出させない）

```bash
# TC-S01: staging environment Secret に CLOUDFLARE_API_TOKEN が登録されているか（値は出さない）
gh secret list --env staging | grep CLOUDFLARE_API_TOKEN

# TC-S02: production environment Secret に CLOUDFLARE_API_TOKEN が登録されているか（値は出さない）
gh secret list --env production | grep CLOUDFLARE_API_TOKEN

# TC-S03: workflow yaml 側で Token 参照が secrets namespace に閉じているか
grep -rn 'secrets\.CLOUDFLARE_API_TOKEN' .github/workflows/ | wc -l

# TC-S04: vars namespace に Token が誤登録されていないか（0 件であること）
grep -rn 'vars\.CLOUDFLARE_API_TOKEN' .github/workflows/ || echo "PASS: no vars reference"

# TC-S05: 仕様書・ログに Token 値が混入していないか（共通プレフィクス検索）
grep -rnE '[A-Za-z0-9_-]{40,}' outputs/phase-1[12]/ docs/30-workflows/u-fix-cf-acct-01-*/ \
  | grep -vE '(commit|sha|hash|run-id)' || echo "PASS: no suspicious long token-like strings"
```

### Runtime 検証（staging 環境のみで実行）

```bash
# TC-R01: 認証確認（whoami は Token 値を出力しない）
bash scripts/cf.sh whoami

# TC-R02: D1 リスト取得（Account Settings:Read + D1:Read 権限の確認）
bash scripts/cf.sh d1 list

# TC-R03: D1 migration 確認（D1:Edit 権限の確認）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# TC-R04: Workers deploy dry-run（Workers Scripts:Edit 権限の確認）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run

# TC-R05: Pages deploy dry-run（Cloudflare Pages:Edit 権限の確認）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
```

### 権限マトリクス突合

Cloudflare Dashboard の Token 詳細ページから「権限名のみ」を `outputs/phase-11/permission-matrix-validation.md` に転記し、Phase 2 の必要最小権限テーブルと 1 対 1 突合する。Token の Secret 値は転記しない。

| Token resource | 必要 | 実付与 | 判定 |
| --- | --- | --- | --- |
| Account / Workers Scripts:Edit | ✅ | （Phase 11 で記録） | （PASS/FAIL） |
| Account / D1:Edit | ✅ | （記録） | （判定） |
| Account / Cloudflare Pages:Edit | ✅ | （記録） | （判定） |
| Account / Account Settings:Read | ✅ | （記録） | （判定） |
| Account / Workers KV Storage:Edit | 条件付き | 4 権限で dry-run が失敗した場合のみ記録 | 追加要否 |
| User / User Details:Read | 条件付き | 4 権限で token verify が失敗した場合のみ記録 | 追加要否 |
| その他（過剰権限） | ❌ | （記録） | 0 件であること |

## 証跡フォーマット

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言・実施情報（日時/実施者/Token ラベル名のみ）・Static 5項目 + Runtime 5項目 + Permission Matrix の判定サマリ・既知制限・関連リンク |
| `outputs/phase-11/manual-smoke-log.md` | TC-S01〜S05 / TC-R01〜R05 の実コマンドと出力（Token 値は `***REDACTED***` マスク）、exit code を必ず記録。production smoke は Phase 13 後に追記 |
| `outputs/phase-11/permission-matrix-validation.md` | Phase 2 の必要最小権限テーブル vs Cloudflare Dashboard 実権限の 1 対 1 突合、過剰 0 件宣言、不足時は Phase 5 ランブックへ差し戻し |
| `outputs/phase-11/link-checklist.md` | 仕様書内リンク、seed spec、正本仕様参照、`artifacts.json` 正本状態の確認。NON_VISUAL 縮約テンプレの必須3点に合わせる |
| その他 | 作成しない（NON_VISUAL のため screenshot 系ファイルは生成禁止） |

## Token / Account 情報を残さないルール

- Token 値（40 文字級の英数字）を成果物・コミットメッセージ・PR 本文に転記しない
- Account ID は Variable 化済みのため `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` 表記のみで参照し、実値を記録しない
- Cloudflare Dashboard URL（`/profile/api-tokens/...` の Token ID 部分）も記録しない
- ログを貼る際は `***REDACTED***` でマスクする
- Secret 一覧は `gh secret list --env <env>` の「名前と更新日時のみ」を使い、`gh secret get` は使用しない

## 完了条件

- [ ] Static 検証 5 項目が全 PASS で記録されている
- [ ] Runtime 検証 5 項目が staging で exit=0 で記録されている
- [ ] Permission Matrix 突合で過剰権限 0 件・不足権限 0 件が宣言されている
- [ ] NON_VISUAL 宣言が `manual-smoke-log.md` 冒頭に明記されている
- [ ] Token 値・Account ID 値が成果物に含まれない
- [ ] rollback 手順（旧 Token 復元 → 新 Token 失効）が staging で 1 度通っていることが記録されている

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/permission-matrix-validation.md`

## 関連リンク

- `index.md`
- Phase 2 成果物（権限マトリクス・適用順序・rollback）
- `scripts/cf.sh`
- 並列タスク `U-FIX-CF-ACCT-02`

## 苦戦想定

- Cloudflare Dashboard 上で Token 値は再表示できない。発行直後の 1 度しか平文表示されないため、staging Token 発行 → smoke 実施 → production 切替の動線で 24h 以内に完了させる。
- `set -x` 付き実行・`wrangler` の `--debug` フラグはスタックトレースに Token を露出させるリスクがあるため Phase 11 では使用禁止とする。
- `gh secret get` は実値を取得できてしまうため使用禁止。Phase 11 では `gh secret list` で名前と更新日時のみを確認する。
- staging Token と production Token の値が同一だと scope 監査の意味が半減するため、Phase 2 で分離方針を確定済みであることを再確認する。
