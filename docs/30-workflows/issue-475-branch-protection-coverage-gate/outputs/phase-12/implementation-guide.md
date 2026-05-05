# 実装ガイド — Issue #475 branch protection coverage-gate 追加

## Part 1: 中学生レベル

### なぜ必要か

たとえば学校の遠足で、出発前に「名札」「水筒」「しおり」を先生が確認するとします。水筒を持っているかを確認する係はもういますが、先生の確認表に「水筒」の欄がなければ、見落としても出発できてしまいます。

このタスクも同じです。GitHub には「変更を入れる前にここを確認する」というルール表があります。すでに「テストが80%以上できているか」という確認係（coverage-gate）は作りましたが、まだルール表にその名前が入っていません。だから、テストが足りない変更でも止めきれない可能性があります。

### このタスクで何をするか

今回は GitHub のルール表に `coverage-gate` を追加します。これで、80% に届かない変更は先に進めなくなります。

### 今回作ったもの

- Issue #475 の Phase 1-13 仕様書
- Phase 11 の証拠置き場（承認待ちの空欄つき）
- Phase 12 の7つの必須書類
- GitHub のルール表を安全に更新する手順

### どうやってやるか

GitHub の API という「機械が機械にお願いする窓口」を `gh` というコマンドで叩きます。`PUT` という命令で、今のルール表をそっくりそのまま再送信しつつ、最後に `coverage-gate` を1つだけ追加します。

### 失敗するとどうなるか・対策

ルール表全部を上書きしてしまうので、もし手で書いたら他のチェックを消してしまうリスクがあります。だから今のルール表をまず `GET` で取って、`jq` というツールで「`coverage-gate` を1つだけ足した形」を機械的に作り、それをそのまま投げます。

### 終わったら何が起きるか

これ以降、テストが80%に達していない PR は「マージ」ボタンがグレーアウトして押せなくなります。

### 専門用語セルフチェック

| 専門用語 | 日常語での言い換え |
| --- | --- |
| GitHub | みんなで使うコード置き場 |
| ブランチ | 変更を試すための作業場所 |
| coverage-gate | テストが足りているかを見る確認係 |
| API | 機械同士のお願い窓口 |
| PUT | ルール表を上書きして保存するお願い |
| PR | 変更を入れてよいか見てもらう申請 |
| マージ | 変更を本番の作業場所に入れること |

---

## Part 2: 技術者レベル

### 変更対象（CONST_005）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `repos/daishiman/UBM-Hyogo/branches/main/protection` | 外部 PUT | contexts append `coverage-gate` |
| `repos/daishiman/UBM-Hyogo/branches/dev/protection` | 外部 PUT | 同上 |
| `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | edit | current applied 表に反映 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | regenerate | `pnpm indexes:rebuild` |
| `docs/30-workflows/issue-475-branch-protection-coverage-gate/**` | new | 仕様書 + Phase evidence |

### 主要シグネチャ / データ構造

```ts
type BranchName = "main" | "dev";

interface BranchProtectionApplyPlan {
  owner: "daishiman";
  repo: "UBM-Hyogo";
  branches: BranchName[];
  requiredContext: "coverage-gate";
  gateA: "external_github_put_approval";
  gateB: "git_publish_approval";
}
```

### CLIシグネチャ

PUT body の jq テンプレ:
```jq
{
  required_status_checks: {
    strict: .required_status_checks.strict,
    contexts: ((.required_status_checks.contexts // []) as $c
      | if ($c | index("coverage-gate")) then $c else $c + ["coverage-gate"] end)
  },
  enforce_admins: .enforce_admins.enabled,
  required_pull_request_reviews: .required_pull_request_reviews,
  restrictions: .restrictions,
  required_linear_history: .required_linear_history.enabled,
  allow_force_pushes: .allow_force_pushes.enabled,
  allow_deletions: .allow_deletions.enabled,
  required_conversation_resolution: .required_conversation_resolution.enabled,
  lock_branch: .lock_branch.enabled,
  allow_fork_syncing: (.allow_fork_syncing.enabled // false)
}
```

### 設定項目と定数一覧

| 定数 / パラメータ | 値 | 変更条件 |
| --- | --- | --- |
| `REQUIRED_CONTEXT` | `coverage-gate` | CI job 名を変えた場合のみ |
| `TARGET_BRANCHES` | `main`, `dev` | branch protection 対象を増やす場合のみ |
| `OWNER` / `REPO` | `daishiman` / `UBM-Hyogo` | repository 移管時のみ |
| `APPLY_ORDER` | `main` → `dev` | main 安定確認後に dev を適用する段階実行を維持 |

### 入力 / 出力 / 副作用

| 観点 | 内容 |
| --- | --- |
| 入力 | baseline GET JSON (main / dev) |
| 出力 | 適用後 GET JSON, drift diff, invariant 確認 log, SSOT diff |
| 副作用 | repo settings の永続変更（rollback は baseline JSON で再 PUT） |

### エラーハンドリング

| ケース | 扱い |
| --- | --- |
| `coverage-gate` が GitHub Actions の context として未登録 | PUT 前に Phase 1 を NO-GO にし、Task E の main run success を待つ |
| PUT 422 | context 未登録または body 不整合として扱い、baseline JSON から body を再生成する |
| 既存 context が消える diff | 即 rollback し、Phase 11 を FAIL にする |

### エッジケース

| ケース | 扱い |
| --- | --- |
| baseline 取得後に branch protection が変わった | Phase 5 直前 fresh GET を正とし、古い baseline では PUT しない |
| `coverage-gate` が既に存在 | 順序を変えずに PUT を skip し、after GET を already-applied evidence として扱う |
| Phase 11 merge gate PR を作れない | Gate A fresh GET evidence は PASS とし、empirical PR observation は `blocked_pending_gate_b_git_publish_and_empirical_pr` の境界を残す |

### テスト構成

| 種別 | 方法 |
| --- | --- |
| drift 検証 | `diff` で contexts に `coverage-gate` 1 件のみ追加を確認 |
| invariant 検証 | `diff -u <(jq -S 'del(.required_status_checks.contexts)' baseline) <(jq -S 'del(.required_status_checks.contexts)' after)` |
| 既存 contexts 維持 | baseline contexts が after の subset であることを `jq` で確認 |
| 挙動検証 | throwaway PR で `gh pr view --json mergeable,mergeStateStatus` |

### 使用例

```bash
build_put_body main outputs/phase-2/main-put-body.json
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input outputs/phase-2/main-put-body.json
```

### ローカル実行・検証コマンド

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm indexes:rebuild
yamllint .github/workflows/ci.yml
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq '.required_status_checks.contexts'
```

### DoD

- main / dev の `contexts` に `coverage-gate` 含有
- invariant 3 点 drift なし
- 既存 contexts 全件保持
- SSOT 表更新 + skill indexes 再生成済
- coverage 未達 throwaway PR で merge gate が disabled になる挙動を1件確認

### Rollback

baseline GET JSON から PUT body を再生成して `gh api -X PUT` で書き戻す（Phase 5 / Phase 10 参照）。
