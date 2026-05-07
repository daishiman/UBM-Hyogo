# Implementation Guide

## Part 1: 中学生レベル

なぜ必要か。大事な鍵を同じ場所に長く置いたままにすると、なくしたときの困りごとが大きくなる。学校の部室の鍵を定期的に新しい鍵へ交換し、古い鍵をすぐ捨てずに一日だけ残しておく、という例えで考えると分かりやすい。

何をしたか。Cloudflare の操作用の鍵を 90 日ごとに交換するため、先に練習用の場所で試し、問題がないことを見てから本番の鍵を交換する手順を作った。作業した日や確認結果は記録するが、鍵そのものの中身は絶対に書かない。85 日たったら GitHub が作業忘れ防止のメモを自動で作る。

### 今回作ったもの

| 作ったもの | 役割 |
| --- | --- |
| runbook | 鍵を交換する手順書 |
| rotation log | 作業した日と結果を書く記録用紙 |
| reminder workflow | 85 日後に GitHub Issue を作る仕組み |
| checker script | 手順書や設定が壊れていないか確認する道具 |

| 専門用語 | 日常語での言い換え |
| --- | --- |
| API Token | 操作用の鍵 |
| rotation | 鍵の交換 |
| staging | 本番前の練習場所 |
| production | 実際に使う本番場所 |
| rollback | 元に戻す手順 |

## Part 2: 技術者レベル

Implemented files:

- `docs/30-workflows/operations/cf-token-rotation-runbook.md`
- `docs/30-workflows/operations/cf-token-rotation-log.md`
- `.github/workflows/cf-token-rotation-reminder.yml`
- `scripts/check-cf-rotation-reminder.sh`

Workflow contract:

- Inputs: `workflow_dispatch.inputs.dry_run`, `workflow_dispatch.inputs.simulated_issued_at`, `vars.CF_TOKEN_ISSUED_AT`.
- Outputs: GitHub Issue body preview or real Issue creation.
- Permission boundary: `contents: read`, `issues: write`.
- Runtime pending: actual production rotation is intentionally user-gated and logged later.

```ts
type CfTokenRotationReminderInput = {
  dry_run: "true" | "false";
  simulated_issued_at?: string;
};

type CfTokenRotationReminderResult = {
  issued_at: string;
  elapsed_days: number;
  due_at: string;
  should_remind: boolean;
};
```

### CLIシグネチャ

```bash
bash scripts/check-cf-rotation-reminder.sh --check-runbook-sections
bash scripts/check-cf-rotation-reminder.sh --check-log-fields
bash scripts/check-cf-rotation-reminder.sh --check-yaml-links
ISSUED_AT=2026-02-10 bash scripts/check-cf-rotation-reminder.sh --simulate-elapsed
bash scripts/check-cf-rotation-reminder.sh --check-no-secret
bash scripts/check-cf-rotation-reminder.sh --check-no-token-id
bash scripts/check-cf-rotation-reminder.sh --check-no-scope-values
```

### 使用例

```bash
ISSUED_AT=2026-02-10 bash scripts/check-cf-rotation-reminder.sh --simulate-elapsed
```

Expected output includes:

```bash
should_remind=true
```

### エラーハンドリング

- `CF_TOKEN_ISSUED_AT` / `ISSUED_AT` が空の場合は `::error::` を出して non-zero exit にする。
- runbook / log / workflow path が存在しない場合は `missing file` を出して fail-fast する。
- GitHub Actions dry-run、real Issue creation、production rotation は user approval gate がない限り実行しない。

### エッジケース

- `elapsed_days=84` は reminder 不要、`elapsed_days=85` は reminder 必要。
- 既存 open Issue がある場合は重複起票しない。
- workflow は `secrets.CLOUDFLARE_API_TOKEN` を参照しない。
- SHA-256 evidence hash は Token ID と誤検出しないよう、40 桁 hex 検出に境界を付ける。

### 設定項目と定数一覧

| name | value / source |
| --- | --- |
| `THRESHOLD_DAYS` | `85` |
| `CF_TOKEN_ISSUED_AT` | GitHub repository variable |
| `RUNBOOK_PATH` | `docs/30-workflows/operations/cf-token-rotation-runbook.md` |
| `LOG_PATH` | `docs/30-workflows/operations/cf-token-rotation-log.md` |
| `DEFAULT_ASSIGNEE` | `daishiman` |

### テスト構成

Phase 11 evidence:

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/evidence/lint/runbook-sections.log`
- `outputs/phase-11/evidence/lint/log-fields.log`
- `outputs/phase-11/evidence/lint/yaml-links.log`
- `outputs/phase-11/evidence/security/no-secret.log`
- `outputs/phase-11/evidence/security/no-token-id.log`
- `outputs/phase-11/evidence/security/no-scope-values.log`
- `outputs/phase-11/evidence/dryrun/elapsed-85.log`

Runtime boundary: GitHub Actions `workflow_dispatch`, real Issue creation, production token rotation, commit, push, and PR creation remain user-gated.
