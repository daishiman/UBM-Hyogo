# Phase 8: テスト実行 — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: Phase 7 で確定した単体テスト・型チェック・lint・dry-run smoke を実行する手順を確定する。dry-run smoke は実際に Slack `chat.postMessage` を `#ubm-hyogo-incident-runbook-dryrun` へ送出する副作用があるため、CONST_004 に従い実装仕様書扱いとする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 8 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 7 で実装した単体テスト群と Phase 6 のコード骨格を、ローカル / CI で機械実行し、(a) typecheck / lint pass (b) Vitest 単体テスト 100% pass + カバレッジ 80%+ (c) dry-run channel への実 `chat.postMessage` smoke (d) token leak ゼロ を確認する手順を確定する。production channel への配信は本 Phase では実行しない（Phase 11 の user approval 後）。

## 実行フロー（依存順）

```
Step 1: 依存インストール          → mise exec -- pnpm install --frozen-lockfile
Step 2: 静的検査                  → pnpm typecheck / pnpm lint
Step 3: 単体テスト                → pnpm --filter scripts-notify test:run
Step 4: 1Password セットアップ    → op signin / .env (op://参照のみ) 確認
Step 5: dry-run smoke 実行        → bash scripts/notify/slack-incident-runbook.sh --mode=dryrun ...
Step 6: evidence 検証             → docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json の schema/値検証
Step 7: token leak gate           → real token pattern を evidence 配下で検査
Step 8: indexes drift 確認        → pnpm indexes:rebuild && git status -s
```

## Step 別コマンド

### Step 1: 依存インストール

```bash
mise exec -- pnpm install --frozen-lockfile
```

期待: `Done in <Xs>` で exit 0、`@slack/web-api` が `node_modules/` に展開される。

### Step 2: 静的検査

```bash
mise exec -- pnpm typecheck    # 0 error
mise exec -- pnpm lint         # 0 error / warning は AC により 0
```

失敗時: 該当ファイルを Phase 6 / Phase 7 骨格と照合して修正、再実行。

### Step 3: 単体テスト

```bash
# scripts-notify project のみ
mise exec -- pnpm vitest run --project scripts-notify --coverage

# または monorepo 全体
mise exec -- pnpm test:run
```

期待:

- T1〜T15 すべて pass（15/15）
- coverage: lines/branches/functions/statements いずれも >= 80%
- `__tests__/__fixtures__/` の 5 ファイルが正しく読まれる

### Step 4: 1Password セットアップ（ローカル smoke 前提）

```bash
# op signin（未ログインの場合）
op signin

# .env ファイルが op://参照のみであることを確認（実値が無いこと）
grep -E '^(SLACK_BOT_TOKEN_INCIDENT_RUNBOOK|SLACK_INCIDENT_RUNBOOK_(DRYRUN_)?CHANNEL_ID)=' .env
# 期待出力例:
#   SLACK_BOT_TOKEN_INCIDENT_RUNBOOK=op://UBM-Hyogo/Slack Bot - Incident Runbook/credential
#   SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID=op://UBM-Hyogo/Slack Channels/dryrun_id
#   SLACK_INCIDENT_RUNBOOK_CHANNEL_ID=op://UBM-Hyogo/Slack Channels/prod_id
```

絶対に行わないこと: `.env` への実値書き込み、`cat .env` での値出力（CONST-RUN-04）。

### Step 5: dry-run smoke 実行

```bash
bash scripts/notify/slack-incident-runbook.sh \
  --mode=dryrun \
  --release-version=v0.0.0-test \
  --deployed-at="$(date -u +%FT%TZ)" \
  --runbook-path=<resolved-09b-incident-runbook-path-from-aiworkflow-quick-reference> \
  --oncall-handle=@manju \
  --evidence-dir=docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence
```

期待出力（stdout / stderr）:

```
[slack-incident-runbook] mode=dryrun channel=C******** ts=1714989600.000100 permalink=https://ubm-hyogo.slack.com/archives/...
```

期待副作用:

- Slack `#ubm-hyogo-incident-runbook-dryrun` に Block Kit メッセージ 1 件投稿
- `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json` 生成（10 KB 以下）

### Step 6: evidence 検証

```bash
# schema 必須キー存在
jq -e '.ok and .ts and .channel and .message.permalink and .mode == "dryrun" and .commitSha' \
  docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json

# permalink が commit SHA を含む
COMMIT=$(git rev-parse HEAD)
jq -e --arg c "$COMMIT" '.runbookPermalink | contains($c)' \
  docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json

# サイズ確認（10 KB 以下）
test "$(stat -f%z docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json 2>/dev/null || stat -c%s docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json)" -lt 10240
```

すべて exit 0 であること。

### Step 7: token leak gate

```bash
# evidence と scripts ディレクトリに token marker が無いこと
rg -F "xox[b]-" outputs/ scripts/notify/ && echo "LEAK DETECTED" || echo "leak gate: PASS"
rg -F "xox[p]-" outputs/ scripts/notify/ && echo "LEAK DETECTED" || echo "leak gate: PASS"
rg -n -e 'Bearer [A-Za-z0-9._-]+' docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/ && echo "LEAK DETECTED" || echo "leak gate: PASS"
```

期待: `leak gate: PASS` のみ。`LEAK DETECTED` が出た場合は該当 evidence を即削除し、Phase 6 の redact ロジックを修正してから再実行。

### Step 8: aiworkflow indexes drift

```bash
mise exec -- pnpm indexes:rebuild
git status -s .claude/skills/aiworkflow-requirements/indexes/
# 期待: 出力 0 行（drift なし）
```

drift がある場合、Phase 6 の C6 で commit に含めた indexes 変更が不足。再 commit して PR に含める。

## 期待出力サンプル（合算）

```text
[Step 2] typecheck/lint: PASS
[Step 3] tests: 15 passed (15) | coverage lines=92.1% branches=85.7% funcs=100% stmts=92.1%
[Step 5] slack post ok: ts=1714989600.000100 channel=C0DRYRUNXX
[Step 6] evidence schema valid + permalink contains commit sha
[Step 7] leak gate: PASS (3x)
[Step 8] indexes drift: none
```

## 失敗時トラブルシューティング表

| 症状 | 想定原因 | 対処 |
| --- | --- | --- |
| `pnpm install` で `@slack/web-api` 解決失敗 | lockfile 未更新 | `mise exec -- pnpm install` で lockfile 更新（CI と差分が出る場合は PR に含める） |
| `pnpm typecheck` で `Cannot find module "@slack/web-api"` | 依存追加忘れ | `apps/<package>/package.json` または scripts ワークスペースに依存追加 |
| Vitest T6 で `git rev-parse HEAD` エラー | shallow clone / not a git repo | テスト時は `process.env.GIT_SHA` を mock する fallback を Phase 6 実装に追加 |
| Step 5 で `invalid_auth` | bot token 失効 / scope 不足 | Slack admin で token 再発行 → 1Password 更新 |
| Step 5 で `not_in_channel` | bot が channel 未招待 | Slack で `/invite @<bot-name>` を実行 |
| Step 5 で `channel_not_found` | channel id 値 mistake | `op` で `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID` の値を再確認 |
| Step 6 で `commitSha` 不一致 | smoke 実行後に commit 追加 | smoke 直前で commit を確定させ再実行 |
| Step 7 で `LEAK DETECTED` | redact 漏れ | 該当 evidence 削除 → Phase 6 の Error redact 経路を修正 → 再実行 |
| Step 8 で indexes drift | C6 commit 漏れ | `pnpm indexes:rebuild` 後の差分を `git add` し commit |

## CI での実行マッピング

| Step | CI ジョブ | 必須/任意 |
| --- | --- | --- |
| 1 | `setup` | 必須 |
| 2 | `lint` / `typecheck` | 必須（既存 gate） |
| 3 | `unit` | 必須 |
| 4 | n/a（CI は GitHub Secrets 経由で token 注入、`op` 不要） | n/a |
| 5 | `incident-runbook-slack-delivery.yml` workflow_dispatch（mode=dryrun） | 任意（手動 trigger） |
| 6 | upload-artifact 後、follow-up step で `jq` 検証 | 必須 |
| 7 | `secret-leak-scan` | 必須 |
| 8 | `verify-indexes-up-to-date` | 必須（既存） |

## 多角的チェック観点

- ローカル smoke と CI smoke の経路差（`op run` vs `secrets.*`）が明示されている
- token leak gate が 3 種類のパターンで二重以上に走る
- evidence schema 検証が必須キー全件をカバー
- 失敗時のトラブルシューティングが Slack API 主要エラー（401 / not_in_channel / channel_not_found）を網羅

## Definition of Done（Phase 8）

- [ ] Step 1〜8 のコマンドと期待出力が記載されている
- [ ] dry-run smoke が単一コマンドで再実行可能
- [ ] トラブルシューティング表が 8 件以上
- [ ] CONST-RUN-01 / CONST-RUN-04 を破る操作が含まれていない
- [ ] `outputs/phase-08/main.md` に要点サマリ保存

## 参照

- phase-06.md / phase-07.md
- `scripts/with-env.sh`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## 次 Phase への引き渡し

Phase 9 へ:

- Step 2 / 3 / 7 / 8 の結果を品質ゲートとして整理
- dry-run smoke の evidence path を Q ゲートの blocking source に組み込む
