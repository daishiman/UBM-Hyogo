# Phase 11: 手動テスト

## 目的

3層評価（Semantic / Visual / AI UX）と runtime 確証手順を記録する。本タスクは NON_VISUAL（CI/runtime gate）のため Visual 層は N/A。

## visualEvidence: NON_VISUAL

UI/UX 表示物の変更なし（CI gate の production 展開 / smoke runner / mint helper の env-aware 一般化）。Phase 11 スクリーンショットは不要。
代替証跡として本 Phase の runtime 確証手順と `manual-test-result.md` を参照する。

## 3層評価

| 層 | 適用 | 内容 |
| -- | ---- | ---- |
| Semantic | ✅ | runner / mint の env 引数 routing が strict（cross-env leak 防止）。reason 分類は staging と同一意味論で production にも適用 |
| Visual | N/A | UI 変更なし |
| AI UX | ✅ | gate 失敗時の Slack summary / artifact が運用者に十分な復旧情報を与えるか（production incident response 観点）|

## runtime 確証手順（Gate-B / user-gated）

> 以下は user 明示承認後に実行する。本プロンプトでは実行しない。

### Step 1: `production-runtime-smoke` GitHub Environment を作成 + secret 投入

```bash
# user-gated。GitHub UI または gh api 経由で実施。
# 投入する secret:
#   - PRODUCTION_AUTH_SECRET
#   - PRODUCTION_ADMIN_MEMBER_ID
#   - PRODUCTION_ADMIN_EMAIL
#   - PRODUCTION_WEB_BASE  (例: https://ubm-hyogo-web-production.daishimanju.workers.dev)
#   - CLOUDFLARE_API_TOKEN
#   - SLACK_WEBHOOK_INCIDENT
# branch policy: main のみ deploy 許可
```

### Step 2: main へ通常 deploy → admin-runtime-smoke-production job 実走 PASS 確認

1. 本仕様書 + 実装 wave を含む PR を `dev` → `main` へ promote → web-cd `deploy-production` 実行。
2. `admin-runtime-smoke-production` job（`needs: deploy-production`、`if: github.ref_name == 'main'`）が発火。
3. mint step が短命 production session cookie を発行（600s TTL）。
4. `runtime-admin-web.sh production` が `cf.sh tail` を開始してから production `/admin` を GET し HTTP 200 を確認。
5. probe 中の Workers log を capture し、`error.boundary.caught` / digest=167275886 が無いことを確認。
6. `ci-evidence/summary.json` / `runtime-smoke.log` が artifact upload され、redaction grep gate を通過。

### Step 3: 意図的 throw regression evidence 取得（AC-5、1 回限り）

1. 一時 branch で `apps/web/src/app/(admin)/admin/page.tsx` 等に意図的 throw を仕込む（例: `throw new Error("intentional regression test for #922");`）。
2. user 明示承認後、深夜帯に `main` へ promote → production deploy。
3. `admin-runtime-smoke-production` job が **FAIL** することを確認（exit code non-zero、Slack 通知発火、artifact に reason=`server-components-render-error`）。
4. 直ちに revert commit を `main` に push して production を回復。
5. evidence（job log + artifact summary.json）を `outputs/phase-11/evidence/intentional-regression-fail.log` として配置。

### Step 4: main required status check 追加（AC-9）

```bash
# read-only before JSON 取得（user 承認前でも可）
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > /tmp/main-protection-before.json

# user 明示承認後のみ実行:
# - required_status_checks.contexts に "admin runtime smoke production / smoke" を追加
# - PUT payload は CLAUDE.md Governance セクションの方針に従う
# - 既存 PR drain を確認してから実行
```

## Phase 11 で発見した HIGH 問題のフィードバックループ

現時点で HIGH 問題なし（local implementation 段階）。Gate-B 実走で発見された scope 外問題は `unassigned-task/` へ自動生成する。

## 完了判定

- [x] runtime 確証手順を記録（実行は user-gated = Gate-B）
- [x] NON_VISUAL を明記、screenshot 不要を宣言
- [x] manual-test-result.md を evidence として配置
- [x] AC-5 / AC-9 の user-gated 手順を明示
