# Phase 5 Deployment Checkpoint Standard

> 元出典: `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`（U1/T2/W1 反映波）
> 読み込み条件: Phase 5 が host 環境書き換え or 不可逆操作を伴うとき。
> セットで参照: [`phase-5-host-environment-deployment-template.md`](phase-5-host-environment-deployment-template.md)（テンプレ正本）

本ドキュメントはテンプレ詳細ではなく **検証観点** に振る。テンプレ重複は最小化する。

---

## 1. 3 点セット必須化条件

次のいずれかに該当する Phase 5 では、`backup-manifest.md` / `runbook-execution-log.md` / `manual-smoke-log.md` の **3 点セット**を必須化する。

- host 環境ファイルの書き換えを含む（→ template §1 適用条件）
- 本番 D1 / Workers / DNS など不可逆操作を含む
- 復元に外部手順（1Password 復号 / wrangler rollback 等）が必要

3 点欠落のいずれかが Phase 11 着手前に検出されたら blocker。

---

## 2. 各成果物の必須セクション（boilerplate チェック）

### 2.1 backup-manifest.md

| セクション | 必須 | 検証観点 |
|------------|------|----------|
| TS 冒頭定義 | ✅ | Phase 5 全体で同値か |
| 対象ファイル表 | ✅ | 行数 = 編集対象数。漏れゼロ |
| sha256 列 | ✅ | 実測値（`shasum -a 256`）か |
| size 列 | ✅ | bytes 単位 |
| 実行 TS 列 | ✅ | backup-manifest 冒頭 TS と一致 |

検証コマンド例:
```bash
# 退避ファイルが実在するか
for f in $(awk '/\.bak\./{print $4}' outputs/phase-5/backup-manifest.md); do
  test -e "${f//\`/}" && echo OK || echo MISSING
done
```

### 2.2 runbook-execution-log.md

| セクション | 必須 | 検証観点 |
|------------|------|----------|
| TS 冒頭定義 | ✅ | backup-manifest の TS と一致 |
| Step N ブロック | ✅ | runbook の手順番号と 1:1 対応 |
| JSON validity 行 | ✅（JSON 編集時） | 各 settings に対し OK 記録 |
| Rollback セクション | ✅ | トリガー条件 / 復元手順 / 確認 |

### 2.3 manual-smoke-log.md

| セクション | 必須 | 検証観点 |
|------------|------|----------|
| 検証環境メタ | ✅ | OS / Tool バージョン |
| TC 結果表 | ✅ | TC ID / 期待 / 実測 / 判定 |
| BLOCKED 行の理由 | ✅ | 前提タスクへのリンク必須 |
| FAIL 行のリカバリ | ✅ | rollback リンク必須 |

---

## 3. artifacts.json への登録パターン

`outputs/artifacts.json` に対し、以下のキーを必ず置く。

```json
{
  "phase-5": {
    "outputs": [
      "outputs/phase-5/backup-manifest.md",
      "outputs/phase-5/runbook-execution-log.md",
      "outputs/phase-5/manual-smoke-log.md"
    ],
    "metadata": {
      "ts": "<YYYYMMDD-HHMMSS>",
      "hostEnvironmentChange": true,
      "rollbackLocation": "outputs/phase-5/runbook-execution-log.md#rollback",
      "smokeStatus": "PASS|PASS_WITH_BLOCKED|FAIL"
    }
  }
}
```

検証ポイント:
- `outputs` 配列のすべての path が実ファイルとして存在
- `metadata.ts` が 3 ファイルすべての冒頭 TS と一致
- `smokeStatus` は `manual-smoke-log.md` の TC 全体結果に整合
- `BLOCKED` を含む場合は `unassigned-task/` への派生タスクが必ず存在

root `artifacts.json` と `outputs/artifacts.json` の二重 ledger は同期必須（UBM-005 と整合）。

---

## 4. Phase 12 documentation-changelog への影響

ホスト環境書き換えタスクの Phase 12 では、`documentation-changelog.md` を以下のブロック構成にする。

```markdown
## Phase 5 host environment changes (TS=YYYYMMDD-HHMMSS)

### 変更対象
- ~/.claude/settings.json
- ~/.claude/settings.local.json
- <project>/.claude/settings.json
- ~/.zshrc

### 反映ステータス
- backup: outputs/phase-5/backup-manifest.md
- runbook: outputs/phase-5/runbook-execution-log.md
- smoke: outputs/phase-5/manual-smoke-log.md (PASS_WITH_BLOCKED)
- rollback: runbook-execution-log.md#rollback

### BLOCKED / 派生タスク
- TC-05: <task-...-001> へ前提条件として外出し
```

ブロック構成の検証観点:
- `TS` が backup-manifest と一致
- BLOCKED が unassigned-task と相互リンク
- workflow-local sync と global skill sync を**別ブロック**で記録（FB-BEFORE-QUIT-003 と整合）

---

## 5. 検証チェックリスト（Phase 5 完了前）

```
[ ] TS が Phase 5 全体で 1 値に固定されている
[ ] backup-manifest.md に対象ファイルが漏れなく列挙されている
[ ] 各 *.bak.<TS> が実在し、sha256/size が記録されている
[ ] runbook-execution-log.md の Step が runbook 手順と 1:1 対応
[ ] JSON 編集対象すべてで JSON validity OK が記録されている
[ ] Rollback セクションにトリガー条件と復元手順がある
[ ] manual-smoke-log.md の全 TC に判定が入っている
[ ] BLOCKED 行に前提タスクリンクがある
[ ] artifacts.json に 3 点セットが登録されている
[ ] secret / OAuth トークンの生値が一切記録されていない
[ ] Cloudflare 系コマンドは `scripts/cf.sh` 経由のみ
```

すべて ✅ で初めて Phase 5 を `completed` にできる。

---

## 6. 参照

- テンプレ正本: [`phase-5-host-environment-deployment-template.md`](phase-5-host-environment-deployment-template.md)
- 完了タスク: `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`
- evidence 同期: [`evidence-sync-rules.md`](evidence-sync-rules.md)
- artifacts 命名: [`artifact-naming-conventions.md`](artifact-naming-conventions.md)
