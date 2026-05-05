# U-FIX-CF-ACCT-02: CI/CD Runtime Warning Cleanup

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-02 |
| タスク名 | CI/CD runtime warning cleanup（token 分離 / wrangler warning 集約） |
| 優先度 | MEDIUM |
| 状態 | unassigned |
| 作成日 | 2026-04-30 |
| 由来 | FIX-CF-ACCT-ID-VARS-001 Phase 12（U-FIX-CF-ACCT-02〜04 集約） |

## 苦戦箇所【記入必須】

- 対象:
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/apps/api/wrangler.toml`（vars 継承 warning）
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/apps/web/wrangler.toml`（pages output warning）
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.github/workflows/backend-ci.yml` / `web-cd.yml`（staging / production token 分離）
- 症状: FIX-CF-ACCT-ID-VARS-001 の主修正は `CLOUDFLARE_ACCOUNT_ID` の namespace drift だが、Phase 12 棚卸しで以下 3 件の同根 warning が同一文脈で検出された。本修正に混ぜると blast radius が CI/CD 全体に拡大するため別タスクへ集約。
  1. staging / production で同一 `CLOUDFLARE_API_TOKEN` を使い回している
  2. `apps/api/wrangler.toml` で top-level vars が env に継承される warning
  3. `apps/web/wrangler.toml` で `[env.production]` に pages 関連 output 設定が残っている warning
- 参照: `docs/30-workflows/fix-cf-account-id-vars-reference/outputs/phase-12/unassigned-task-detection.md`、`docs/30-workflows/fix-cf-account-id-vars-reference/outputs/phase-12/main.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| warning を放置して本番 deploy の失敗原因を見落とす | 中 | warning 種別ごとに owner と再現コマンドを固定し、CI log に regex assertion を追加 |
| token 分離を Account ID 問題と混同し誤修正する | 中 | API Token は Secret、Account ID は Variable として表を分離（CLAUDE.md「シークレット管理」セクション準拠） |
| `apps/web` の Pages / Workers 方針と衝突する | 中 | UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION / OpenNext 移行系タスクと統合可否を Phase 1 で判断 |
| 既存 unassigned task と重複する | 低 | `task-imp-05a-cf-analytics-auto-check-001.md` 等と supersede / merge を明記 |

## 検証方法

### 単体検証

```bash
# warning 再現
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run 2>&1 | grep -i "warning"
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production --dry-run 2>&1 | grep -i "warning"

# token 分離前提の Secret 命名規則確認
gh api repos/daishiman/UBM-Hyogo/actions/secrets | jq '.secrets[].name' | rg "CLOUDFLARE_API_TOKEN"
```

期待: 修正後は `--dry-run` の warning 出力が空になり、Secret は staging / production の少なくとも 2 entry を確認できる（または ADR で同一 token 継続の根拠を明記）。

### 統合検証

```bash
# staging で再 deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
# CI 実行
gh workflow run backend-ci.yml --ref dev
gh workflow run web-cd.yml --ref dev
```

期待: staging deploy が成功し、CI ログに wrangler warning が出ないこと。失敗時は wrangler.toml の env 構造を確認。

## スコープ

### 含む

- staging / production `CLOUDFLARE_API_TOKEN` 分離方針の決定と Secret 設定手順
- `apps/api/wrangler.toml` vars 継承 warning の再現と恒久対応
- `apps/web/wrangler.toml` pages output warning の再現と恒久対応（または Pages/Workers 方針確定との合流）
- 既存 unassigned task との supersede / merge 判断

### 含まない

- `CLOUDFLARE_ACCOUNT_ID` の Variable 化（→ FIX-CF-ACCT-ID-VARS-001 で完了済み）
- Cloudflare API Token の最小権限監査本体（→ `U-FIX-CF-ACCT-01-cloudflare-api-token-scope-audit.md`）
- OpenNext / Pages vs Workers の方針決定本体（→ `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION.md` 等の既存タスクに委譲）
