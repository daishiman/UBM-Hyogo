# Implementation Guide: 09c-A-production-deploy-execution

判定行: `SPEC_COMPLETE_RUNTIME_PENDING`

## Part 1: 中学生レベルの説明

なぜ必要か: たとえば、お祭りの本番で店を開く前には、料理が届いたか、電気がつくか、お客さんの通り道がふさがっていないかを順番に確認する。09c-A も同じで、本番公開の前後に「開けてよいか」「開けた後に困っていないか」を確認するための手順を固定する。

何をするか: まず持ち主の許可を記録し、次にデータの入れ物を更新し、アプリを本番の場所へ置き、公開後に画面と数字を確認する。問題が出た場合は、決めた戻し方に沿って止める。

### 今回作ったもの

- 本番公開前に見る手順表
- 許可を記録する場所
- 実行後に結果を残す場所
- 問題が出た時に戻るための道しるべ

### 専門用語セルフチェック

| 専門用語 | 日常語への言い換え |
| --- | --- |
| production | 本番の公開場所 |
| deploy | 作ったものを公開場所へ置く作業 |
| Cloudflare D1 | クラウド上のデータの入れ物 |
| migration | データの入れ物の形を更新する作業 |
| smoke test | 開店直後の簡単な動作確認 |
| release tag | その時点につける目印シール |
| free-tier | 無料で使える上限 |

## Part 2: 技術者レベルの説明

09c-A は production mutation を実行するための workflow spec であり、本仕様書作成時点では mutation を実行しない。runtime evidence は Phase 11 の同一パスへ execution operation 時に上書きする。

### Canonical Runtime Contract

```ts
type ProductionApprovalGate = "G-1" | "G-2" | "G-3" | "G-4" | "G-5" | "G-R";

interface ProductionDeployEvidence {
  approvalGate: ProductionApprovalGate;
  command: string;
  evidencePath: string;
  runtimeState: "PENDING_RUNTIME_EVIDENCE" | "PASS" | "FAIL" | "ROLLBACK_REQUIRED";
}
```

### Approval Gate Mapping

| Gate | Subject |
| --- | --- |
| `G-1` | release/main promotion |
| `G-2` | D1 migration apply |
| `G-3` | API production deploy |
| `G-4` | Web production deploy |
| `G-5` | release tag push |
| `G-R` | rollback operation |

### Canonical Commands

| 対象 | コマンド |
| --- | --- |
| API deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` |
| Web build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` |
| Web deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` |
| D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` |

`wrangler` 直接実行と `pnpm --filter @ubm/api deploy:production` / `pnpm --filter @ubm/web deploy:production` は不採用。package scripts と正本 deploy route の drift を避けるため、Cloudflare 操作は `scripts/cf.sh` に統一する。

### CLIシグネチャ

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml
```

### 使用例

```bash
# user approval 記録後に production D1 migration を実行する例
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml \
  > docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-11/d1-migrations-apply.txt 2>&1
```

### エラーハンドリング

| 失敗 | 分岐 |
| --- | --- |
| approval log 欠落 | mutation を実行せず `blocked_until_user_approval` を記録 |
| D1 migration apply 失敗 | API/Web deploy へ進まず D1 rollback/runbook 判定へ移行 |
| API/Web deploy 失敗 | release tag と smoke を停止し、直前 version rollback を検討 |
| smoke 5xx / authz violation | Phase 10 GO/NO-GO を FAIL にし incident runbook へ handoff |
| 24h metrics 閾値超過 | post-release observation follow-up と rollback 判定を分岐 |

### エッジケース

| ケース | 扱い |
| --- | --- |
| 09a staging smoke 未完了 | production execution を開始せず upstream blocker として記録 |
| Issue #353 が CLOSED | reopen せず `Refs #353` のみを使う |
| screenshot placeholder が必要 | dummy PNG を置かず README のみで予約 |
| Phase 13 PR approval 未取得 | `pr-creation-result.md` を skeleton のまま維持 |

### 設定項目と定数一覧

| パラメータ | 正本値 |
| --- | --- |
| D1 database | `ubm-hyogo-db-prod` |
| API wrangler config | `apps/api/wrangler.toml` |
| Web wrangler config | `apps/web/wrangler.toml` |
| visual evidence mode | `VISUAL_ON_EXECUTION` |
| issue reference | `Refs #353` |

### テスト構成

| 検証 | コマンド / 証跡 |
| --- | --- |
| Phase 1-13 構造 | `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/issue-353-09c-production-deploy-execution --strict --json` |
| Phase 12 guide | `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/issue-353-09c-production-deploy-execution` |
| aiworkflow index | `pnpm indexes:rebuild` |
| worktree sync | `pnpm sync:check` |
