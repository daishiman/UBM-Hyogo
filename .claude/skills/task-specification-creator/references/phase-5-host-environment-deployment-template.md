# Phase 5 Host Environment Deployment Template

> 元出典: `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`（U1/T2/W1 反映波）
> 読み込み条件: Phase 5 の実装対象が **ホスト環境ファイル**（`~/.claude/settings*.json` / dotfiles / shell rc / `~/.config/**` / `~/.zshrc` 等）を書き換える場合に必ず参照する。

---

## 1. 適用条件

以下のいずれかに該当する Phase 5 では本テンプレを必須適用する。

- `~/.claude/settings.json` / `~/.claude/settings.local.json` の更新
- `<project>/.claude/settings.json` / `settings.local.json` の更新
- `~/.zshrc` / `~/.bashrc` / `~/.config/zsh/**` / shell alias の追加・改訂
- `~/.gitconfig` / `~/.ssh/config` 等のユーザー dotfiles
- macOS `defaults write` / `launchctl` / `~/Library/Preferences/**` の改変
- 1Password CLI / `op` 設定、`mise` 設定、`direnv` 等のツール側 host config

> Cloudflare Workers などのリモート環境変更は対象外（CI/CD or `scripts/cf.sh` 経由）。
> ただし host 上に OAuth トークン等を残す行為は本テンプレの対象（禁則として記録する）。

---

## 2. 4 段テンプレ構造

Phase 5 は次の 4 段で必ず構成する。各段の正本ファイル名は固定。

| 段 | フェーズ | 正本ファイル | 役割 |
|----|----------|--------------|------|
| 1  | backup   | `outputs/phase-5/backup-manifest.md` | 編集前の対象ファイルを `*.bak.<TS>` に退避し sha256/size/TS を記録 |
| 2  | 反映     | `outputs/phase-5/runbook-execution-log.md` | Step 1〜N の実行記録（コマンド・stdout 抜粋・JSON validity 等） |
| 3  | smoke    | `outputs/phase-5/manual-smoke-log.md` | TC ID 別の判定（PASS/FAIL/BLOCKED）と再現コマンド |
| 4  | rollback | `outputs/phase-5/runbook-execution-log.md` 内の `## Rollback` セクション、または `outputs/phase-5/rollback-runbook.md` | 各 backup から逆順で復元する手順とトリガー条件 |

### 2.1 backup-manifest.md（必須セクション）

```markdown
# backup-manifest

- TS: `YYYYMMDD-HHMMSS`
- 実行者: <handle>
- claude --version: <記録>

| 対象パス | 退避先 | size | sha256 | 実行 TS |
|----------|--------|------|--------|---------|
| `~/.claude/settings.json` | `~/.claude/settings.json.bak.<TS>` | 1234 | `<sha256>` | `<TS>` |
| `~/.claude/settings.local.json` | `~/.claude/settings.local.json.bak.<TS>` | ... | ... | ... |
| `<project>/.claude/settings.json` | `<project>/.claude/settings.json.bak.<TS>` | ... | ... | ... |
| `~/.zshrc` | `~/.zshrc.bak.<TS>` | ... | ... | ... |
```

最低要件:
- すべての対象ファイルが行として存在する（漏れゼロ）
- TS は本ドキュメント冒頭の固定値と一致（後述 §4）
- sha256 は `shasum -a 256` 等で実測（推測禁止）

### 2.2 runbook-execution-log.md（必須セクション）

```markdown
# runbook-execution-log

- TS: `YYYYMMDD-HHMMSS`
- runbook 出典: `outputs/phase-5/runbook.md`（または該当 spec）

## Step 1: ...
- コマンド: `...`
- stdout 要約: ...
- JSON validity: OK / FAIL
- 結果: PASS / FAIL

## Step 2: ...
...

## Rollback
- トリガー条件: <例: TC-01 が FAIL のとき / JSON validity が NG のとき>
- 手順:
  1. `cp ~/.claude/settings.json.bak.<TS> ~/.claude/settings.json`
  2. ...
- 確認: `node -e "JSON.parse(...)"`
```

### 2.3 manual-smoke-log.md（必須セクション）

```markdown
# manual-smoke-log

- TS: `YYYYMMDD-HHMMSS`
- 検証環境: macOS <version> / Claude Code <version> / zsh <version>

| TC ID | 内容 | 期待 | 実測 | 判定 |
|-------|------|------|------|------|
| TC-01 | 新規タブで `cc` 起動後の effective mode | `bypassPermissions` | `bypassPermissions` | PASS |
| TC-05 | bypass 下の deny 対象 | 前提タスク結論 | 未取得 | BLOCKED |
| ...   | ... | ... | ... | ... |
```

最低要件:
- BLOCKED は理由と前提タスクへの参照を必ず記載
- FAIL の場合は §rollback トリガーへリンク

### 2.4 rollback セクション

`runbook-execution-log.md` 内に `## Rollback` を含めるのを既定とし、行数が 200 を超える / rollback が独立 runbook として価値がある場合のみ `outputs/phase-5/rollback-runbook.md` を分離する。

---

## 3. TS sticky 規約

Phase 5 冒頭で 1 度だけ `TS=YYYYMMDD-HHMMSS`（ローカル時刻）を発行し、以下すべてで同一値を使う。

- `*.bak.<TS>` 命名
- `backup-manifest.md` 冒頭の `- TS:` フィールド
- `runbook-execution-log.md` 冒頭の `- TS:`
- `manual-smoke-log.md` 冒頭の `- TS:`
- `runbook-execution-log.md` の Rollback セクション（rollback 時にも同 TS を参照）
- Phase 11 の evidence メタ（`phase11-capture-metadata.json` の `relatedTs` 等）
- Phase 12 の `documentation-changelog.md` 該当ブロックの実行時刻

> 同 wave で TS が複数走るのは禁止。再実行が必要な場合は `TS2` として明示し、当初 TS との差分理由を runbook に追記する。

### 命名規則

```
<original-path>.bak.YYYYMMDD-HHMMSS

例:
~/.claude/settings.json.bak.20260428-192736
~/.zshrc.bak.20260428-192736
<project>/.claude/settings.json.bak.20260428-192736
```

---

## 4. セキュリティ注意

ホスト環境書き換え系 Phase 5 では次を厳守する。

| 項目 | ルール |
|------|--------|
| secret 値 | runbook / smoke log / backup-manifest に **生値転記禁止**。`op://Vault/Item/Field` 参照のみ |
| OAuth トークン | `~/Library/Preferences/.wrangler/config/default.toml` 等のローカル OAuth 保持禁止 |
| API Token | `.env` の `op://` 参照経由で `op run --env-file=.env ...` で注入。出力ログには値が残らないことを確認 |
| 環境変数 dump | `env` / `printenv` の生出力をログに貼らない（必要時はキー名のみ列挙） |
| backup 内容 | secret を含む可能性があるため backup ファイルは `.gitignore` 対象であることを再確認 |

---

## 5. UBM-012 整合（Cloudflare 系コマンド）

Phase 5 で Cloudflare 系操作（D1 / Workers / Pages）が混在する場合は、CLAUDE.md「Cloudflare 系 CLI 実行ルール」と SKILL.md `Phase 12 実行時によくある漏れ` UBM-012 に従い、**`bash scripts/cf.sh` 経由のみ**で実行する。

```bash
# OK
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# NG（runbook に書かない / 実行しない）
wrangler whoami
wrangler login
npx wrangler deploy ...
```

`runbook-execution-log.md` に `wrangler` 直接呼び出しが見つかったら Phase 5 を blocker 扱いとし、`scripts/cf.sh` へ書き換える。

---

## 6. artifacts.json への登録

Phase 5 完了時、`outputs/artifacts.json` の `phase-5` 配下に最低 3 件登録する。

```json
{
  "phase-5": {
    "outputs": [
      "outputs/phase-5/backup-manifest.md",
      "outputs/phase-5/runbook-execution-log.md",
      "outputs/phase-5/manual-smoke-log.md"
    ],
    "metadata": {
      "ts": "20260428-192736",
      "hostEnvironmentChange": true,
      "rollbackLocation": "runbook-execution-log.md#rollback"
    }
  }
}
```

`rollback-runbook.md` を分離した場合は `outputs` に追加し、`metadata.rollbackLocation` を該当ファイルへ更新する。

---

## 7. Phase 12 / Phase 11 との連携

- **Phase 11**: `manual-smoke-log.md` を Phase 11 の主証跡として扱う（NON_VISUAL タスクでは特に）。`manual-test-result.md` から `manual-smoke-log.md` へリンクする。
- **Phase 12**: `documentation-changelog.md` のホスト環境変更ブロックに `TS` / `backup-manifest.md` / `rollback location` の 3 点を必ず引用する。`spec_created` ではなく `applied`/`completed` ステータスを記録する。
- **再判定**: TC が BLOCKED で残った場合は `unassigned-task/` に派生タスクを切り、本タスクは completed-with-blocker として明記する。

---

## 8. 参照

- 完了タスク: `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`
- 関連: `references/phase-5-deployment-checkpoint-standard.md`（検証観点）
- 関連: `references/patterns-troubleshooting-worktree-cloudflare.md`（UBM-012 出典）
- 関連: `references/evidence-sync-rules.md`（同期規約）
