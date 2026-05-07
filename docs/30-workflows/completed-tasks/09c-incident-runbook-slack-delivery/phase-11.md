# Phase 11: 運用検証 / runtime evidence — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: Phase 11 は Slack `chat.postMessage` への実 API 呼び出し（dry-run / production 双方）、外部副作用としての Slack 配信、`outputs/phase-11/evidence/` への JSON 永続化、09c Phase 11 share-evidence 参照差し替え diff 生成を扱う。実環境への副作用 + repo へコミットされる evidence artifact 生成を伴うため、CONST_004 により docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 11 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| user_approval_required | true（production 配信前ゲート） |
| 想定実行者 | Claude Code（dry-run smoke 実行）+ 人間オペレーター（production 配信 user approval） |

## 目的

Phase 10 の readiness checklist を通過した実装に対し、以下を達成する:

1. **dry-run channel** への `chat.postMessage` を実行し、200 / `ok=true` を取得して evidence ファイルに永続化
2. evidence ファイル（JSON）と redacted message body / secret resolution log / smoke log を `outputs/phase-11/evidence/` に揃える
3. token leak が evidence のいずれにも含まれていないことを `rg` で検証
4. **production channel** 配信は user approval gate 通過後にのみ実行
5. 09c Phase 11 share-evidence placeholder を本タスク evidence への参照に置換する diff（patch）を生成（**適用は Phase 12 で実施**）

NON_VISUAL のため screenshot は対象外。message timestamp / channel id / permalink を含む JSON evidence が PASS 判定の主証跡。

## 状態語彙の使い方

| 状態語 | 適用タイミング | 記録先 |
| --- | --- | --- |
| `pending_runtime_evidence` | dry-run smoke 未実行 / production 配信未承認 | `outputs/phase-11/main.md` 冒頭判定行 |
| `blocked_until_user_approval` | dry-run PASS 済、production 配信を user approval 待ちで停止中 | 同上（production 配信行のみ） |
| `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | dry-run のみ完了、production は user 明示指示なし | `outputs/phase-11/main.md` 総合判定 |
| `runtime_evidence_completed` | dry-run + production 双方の evidence 取得済 | 同上、Phase 12 close-out 時に昇格 |

> 本仕様書の close-out 時点では **`pending_runtime_evidence`** を初期値とする。Phase 11 を実行するセッションが上記語彙に沿って遷移させる。

## 事前準備チェックリスト

- [ ] `git branch --show-current` が実行用ブランチ（仕様書 PR とは別ブランチ）であること
- [ ] `mise exec -- node -v` が `v24.15.0` であること
- [ ] `gh auth status` が valid（`gh workflow run` / `gh secret list` が成功）
- [ ] Phase 10 の S1〜S5 / W1〜W6 / approver 設定が全て OK 記録
- [ ] `outputs/phase-11/evidence/` ディレクトリ存在確認: `mkdir -p docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence`
- [ ] `op signin` 済（ローカル smoke の場合のみ。GitHub Actions 経由なら不要）

> 以下では evidence ルートを `EVID=docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence` と表記する。

## Approval Gate プロンプト

### G-DRY: dry-run smoke 実行（自動承認可 / Claude Code 単独で実行可能）

dry-run channel への配信は誤配信リスクが分離されているため、Phase 10 で final smoke が PASS している前提で**ゲート不要**。Claude Code 単独で実行する。

### G-PROD: production channel 配信（必須 user approval）

```
[G-PROD: PRODUCTION SLACK DELIVERY APPROVAL]
予定操作:
  gh workflow run incident-runbook-slack-delivery.yml \
    -f mode=production \
    -f release_version=<vX.Y.Z> \
    -f deployed_at=<ISO8601> \
    -f runbook_commit_sha=<git rev-parse HEAD>
影響範囲: Slack channel #ubm-hyogo-incident-runbook に bot から 1 件 message 配信
失敗時 rollback:
  gh workflow disable incident-runbook-slack-delivery.yml
  Slack admin UI から該当 message を削除
"approve G-PROD" と返信してください。
```

user の `approve G-PROD` 文字列を受領するまで production 配信を**実行しない**。

## runtime evidence 取得手順（順序固定）

### Step 1. dry-run smoke 実行

```bash
# ローカル経路（op run + script）
bash scripts/notify/slack-incident-runbook.sh --mode dryrun \
  --release-version v0.0.0-prelaunch \
  --deployed-at "$(date -u +%FT%TZ)" \
  --commit-sha "$(git rev-parse HEAD)" \
  --evidence-dir "$EVID" \
  | tee $EVID/dryrun-smoke.log
```

または GitHub Actions 経由:

```bash
gh workflow run incident-runbook-slack-delivery.yml \
  -f mode=dryrun \
  -f release_version=v0.0.0-prelaunch \
  -f deployed_at="$(date -u +%FT%TZ)" \
  -f runbook_commit_sha="$(git rev-parse HEAD)"
gh run watch <RUN_ID>
gh run download <RUN_ID> --dir $EVID/  # artifact として slack-delivery-dryrun.json を取得
```

### Step 2. evidence file 存在確認

```bash
ls -la $EVID/
# 期待: slack-delivery-dryrun.json / slack-message-rendered.md / secret-resolution.log / dryrun-smoke.log
```

### Step 3. JSON 内容確認

```bash
jq '{ok, ts, channel, permalink: .message.permalink}' $EVID/slack-delivery-dryrun.json
```

期待出力（id 値はマスク表記、実値は表示される）:

```json
{
  "ok": true,
  "ts": "<unix timestamp>.<microsec>",
  "channel": "<C0XXXXXXX>",
  "permalink": "https://<workspace>.slack.com/archives/<channel_id>/p<ts>"
}
```

### Step 4. token leak 検証

```bash
rg -n -e 'xox[abp]-[A-Za-z0-9-]{20,}|Bearer [A-Za-z0-9._-]{20,}' $EVID/  # 期待: 0 hit
```

1 件でも hit した場合: 即座に該当ファイルを削除し、`scripts/notify/save-slack-evidence.ts` の redact ロジックを Phase 6 に差し戻して修正する（Phase 11 を継続しない）。

### Step 5. production 配信実行（G-PROD approval 後のみ）

user から `approve G-PROD` を受領した後、Step 1 のコマンドを `--mode production` で再実行。evidence は `slack-delivery-production.json` として保存される。

```bash
bash scripts/notify/slack-incident-runbook.sh --mode production \
  --release-version <vX.Y.Z> \
  --deployed-at "$(date -u +%FT%TZ)" \
  --commit-sha "$(git rev-parse HEAD)" \
  --evidence-dir "$EVID" \
  | tee $EVID/production-smoke.log

jq '{ok, ts, channel, permalink: .message.permalink}' $EVID/slack-delivery-production.json
```

### Step 6. 09c Phase 11 share-evidence 置換 diff の生成

```bash
# 09c production deploy execution の Phase 11 share-evidence placeholder を本タスク evidence への参照に置換する diff を生成
# 適用は Phase 12 で実施（本 Phase ではパッチを保存するのみ）

PARENT=docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md
git diff --no-color -- $PARENT > $EVID/09c-share-evidence-replacement.patch || true
# (置換は Phase 12 で実行する。Phase 11 では現状の baseline を patch にキャプチャするのみ)
```

差分本体は Phase 12 でテキスト編集により生成する（本仕様書では置換テンプレを Phase 12 側に記載）。Phase 11 では現状 baseline patch のみ保存。

## evidence 一覧表

| # | type | path | 期待内容 | 取得コマンド | 期待 size |
| --- | --- | --- | --- | --- | --- |
| 1 | dry-run response JSON | `$EVID/slack-delivery-dryrun.json` | `ok=true` / `ts` / `channel` / `message.permalink` | Step 1 → Step 3 で確認 | 1-10 KB |
| 2 | production response JSON | `$EVID/slack-delivery-production.json` | 同上 | Step 5 | 1-10 KB |
| 3 | redacted message body | `$EVID/slack-message-rendered.md` | Block Kit を markdown プレビュー化したもの。token・私メールなし | スクリプトが render 時に自動保存 | <5 KB |
| 4 | secret resolution log | `$EVID/secret-resolution.log` | `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK = MASKED` 等。実値なし | スクリプトが起動時に自動保存 | <2 KB |
| 5 | dry-run smoke log | `$EVID/dryrun-smoke.log` | スクリプト stdout（API レスポンス + redact 済 stderr） | `tee` 経由で保存 | 1-20 KB |
| 6 | production smoke log | `$EVID/production-smoke.log` | 同上 | 同上 | 1-20 KB |
| 7 | 09c 置換 patch baseline | `$EVID/09c-share-evidence-replacement.patch` | 09c Phase 11 の現 baseline diff | Step 6 | 0-5 KB |
| 8 | token leak grep 結果 | `$EVID/token-leak-check.log` | real token pattern の `rg` 実行結果（0 hit のログ） | `rg -n -e 'xox[abp]-[A-Za-z0-9-]{20,}|Bearer [A-Za-z0-9._-]{20,}' $EVID/ > $EVID/token-leak-check.log 2>&1 || true` | <1 KB |

## evidence サマリ表（`outputs/phase-11/main.md` の最終構成）

`outputs/phase-11/main.md` には次の 4 セクションを必ず置く:

1. status: `pending_runtime_evidence` → `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（dry-run のみ完了時） → `runtime_evidence_completed`（production 完了時）
2. evidence 一覧表（8 行 × `path` / `hash` (`shasum -a 256`) / `size_bytes` / `acquired_at_utc` / `result(PASS|FAIL|N/A)` / `notes`）
3. approval gate 取得記録（G-PROD × `approved_at` / `approved_by` / `command_executed`）
4. 親タスクへの引き渡し（09c Phase 11 share-evidence 置換 diff の予定 / Phase 12 で適用予定の patch reference）

## 失敗時の handling table

| 事象 | 対応 | 記録先 |
| --- | --- | --- |
| dry-run 配信が `ok=false` | Slack API error code を `secret-resolution.log` に記録（token は MASKED）。Phase 6 へ差し戻し | `outputs/phase-11/main.md` notes |
| token leak 検出 (`rg` hit) | 該当ファイル即削除、Phase 6 redact 修正、token rotation 検討 | 同上 + `outputs/phase-11/main.md` security-incident セクション |
| production 配信が approver 不在で進行不能 | G-PROD 待機。代替 approver は Phase 10 で定義した release oncall に escalate | 同上 |
| GitHub Actions environment が approval なしで通過してしまった | environment 設定 drift。Phase 10 へ差し戻し、設定修復後に再 smoke | 同上 |
| Slack rate limit (429) | 1 分待機後リトライ。連続 3 回失敗で fail | 同上 |
| `permalink` フィールドが response に含まれない | `chat.getPermalink` API を別途呼び、結果を `slack-delivery-*.json` の `message.permalink` に merge | スクリプト側 fallback 実装 (Phase 6) |

## pending_user_approval ゲートの位置づけ

production 配信の G-PROD は CONST-RUN-02 を runtime で担保する**最終ゲート**である。GitHub Actions environment protection（Phase 10 で設定）と user approval prompt（本 Phase 11）の **二重ガード** で誤配信を防ぐ。どちらか一方だけでは PASS としない:

- environment protection 単独: human-in-the-loop が approver UI 上のクリックで承認するため bot が自動進行できない（first line）
- user approval prompt 単独: Claude Code が `approve G-PROD` 文字列を待つ（second line）

両者をバイパスして production 配信を行ってはならない。

## 多角的チェック観点

- evidence 8 件すべて hash / size / 取得時刻が埋まっている
- token leak grep が 0 hit（`$EVID` 内の real token pattern。仕様・テスト内の fake marker は対象外）
- dry-run と production の channel id が異なる（unit test で担保 + runtime evidence で目視確認）
- `permalink` が再取得可能な URL 形式（curl/click で 200 OK）
- G-PROD の approved_at / approved_by が記録されている
- 09c 置換 patch が Phase 11 baseline として保存され、Phase 12 で適用予定が明記されている
- `outputs/phase-11/screenshots/` 配下に画像を生成しないこと（NON_VISUAL のため）

## サブタスク管理

- [ ] 事前準備チェックリスト 6 項目を完了
- [ ] dry-run smoke を実行し evidence #1, #3, #4, #5, #8 を保存
- [ ] G-PROD approval を取得
- [ ] production smoke を実行し evidence #2, #6 を保存
- [ ] 09c 置換 patch baseline #7 を保存
- [ ] `outputs/phase-11/main.md` 4 セクションを更新
- [ ] token leak grep 0 hit を最終確認

## 統合テスト連携

- 上流: Phase 9 品質ゲート / Phase 10 readiness checklist
- 下流: Phase 12（evidence を正本ドキュメントに反映 + 09c share-evidence 置換適用）

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence/` 配下 8 ファイル

## 完了条件 (DoD)

- [ ] dry-run evidence #1 が `ok=true` で保存されている
- [ ] production evidence #2 が `ok=true` で保存されているか、`blocked_until_user_approval` で停止中の旨が記録されている
- [ ] token leak 0 hit を `$EVID/token-leak-check.log` に記録
- [ ] G-PROD approval 取得記録があるか、未承認状態が `outputs/phase-11/main.md` に明記されている
- [ ] 09c 置換 patch baseline がキャプチャされている
- [ ] 本 Phase で commit / push / PR を実行していない（CONST_002）
- [ ] CONST_007 違反（Phase 12 へ先送り）が無い

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 中学生レベル概念説明は本 Phase ではなく Phase 12 implementation-guide.md Part 1 で扱う
- [ ] NON_VISUAL のため screenshot ディレクトリを作っていない
- [ ] `outputs/phase-11/screenshots/` を作らない（NON_VISUAL）

## 次 Phase への引き渡し

Phase 12 へ:

- 8 evidence の hash / size / 結果サマリ
- 09c Phase 11 share-evidence 置換 patch（Phase 12 で適用）
- `runtime_evidence_completed` への遷移条件（dry-run + production 双方 PASS）
- token leak 0 hit の最終ログ

## 参照資料

- `docs/30-workflows/09c-incident-runbook-slack-delivery/index.md`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/artifacts.json`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/phase-01.md`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/phase-10.md`
- `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」「ローカル `.env` の運用ルール」（token 取扱い方針）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
