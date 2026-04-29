# Phase 6 — 失敗ケース（failure-cases）

## Status

spec_created

> 本書は `pull_request_target` safety gate が想定通り防御することを検証するための **失敗ケース観点表**。実走は本タスク非対象（AC-8）。後続実装タスクが Phase 5 runbook の Step 4・5 でこれら FC を検出する。

## 1. 入力の継承

| 入力 | 役割 |
| --- | --- |
| `outputs/phase-4/test-matrix.md` | F-1〜F-4 失敗判定基準（FC-1〜FC-6 が射影） |
| `outputs/phase-5/runbook.md` | Step 4 静的検査・Step 5 動的検査コマンド |
| `outputs/phase-3/review.md` §3 / §4 | 5 箇条 / S-1〜S-5 |
| GitHub Security Lab "Preventing pwn requests" | エッジケース母集合 |

## 2. 失敗ケース一覧（FC-1〜FC-11）

各 FC について、(a) 静的検査、(b) 動的検査、(c) レビューチェックリストの 3 系統で検出手段を記述する。

| ID | ケース | 重大度 | 射影 F | 静的検出 (a) | 動的検出 (b) | レビュー検出 (c) | 期待挙動 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **FC-1** | `pull_request_target` 配下で `actions/checkout` を `ref: ${{ github.event.pull_request.head.sha }}` で実行（pwn request 典型） | **MAJOR** | F-1 / AC-1 / AC-4 | `grep -nE 'github\.event\.pull_request\.head\.(ref\|sha)' $(grep -lE '^\s*pull_request_target:' .github/workflows/*.yml)` で検出 | dry-run T-3 ログで `Fetching head` / `Checking out PR #N head` メッセージが出る | PR diff で `pull_request_target` workflow の `actions/checkout.with.ref` をレビュアーが目視確認 | safety gate により即 NO-GO・revert |
| **FC-2** | `actions/checkout` で `persist-credentials: false` が欠落 | **MAJOR** | F-2 / AC-5 | `yq '.jobs[].steps[] \| select(.uses\|test("actions/checkout")) \| .with."persist-credentials"'` が `null` または `true` | dry-run 後 job 内の `git config --get http.https://github.com/.extraheader` に GITHUB_TOKEN が残存 | PR diff チェックリスト #4（5 箇条）で必須確認 | 検出 → revert・修正 PR |
| **FC-3** | トップレベル `permissions: write-all`（または `contents: write` / `actions: write` の過剰付与） | **MAJOR** | F-4 / AC-5 | `yq '.permissions' .github/workflows/*.yml` が `write-all` / 過剰スコープ | dry-run logs の `Permissions:` セクションが広範な scope を表示 | PR diff チェックリスト #5 で確認 | 検出 → revert・最小化 |
| **FC-4** | `pull_request_target` workflow から `${{ secrets.* }}` を参照 | **MAJOR** | F-3 / AC-3 / S-1 | `pull_request_target` workflow を抽出し `grep -nE '\$\{\{\s*secrets\.' $(cat /tmp/prt.list)` | dry-run logs で secrets 値が masked `***` として参照される（masked でも到達可能性が問題） | レビュー：triage workflow の `env:` / `with:` を全行確認 | 検出 → revert |
| **FC-5** | `workflow_run` 経由で fork PR build の artifact / output に secrets を橋渡し（代替案 D） | **MAJOR** | F-3 拡張 / AC-3 / AC-4 | `grep -nE '^\s*workflow_run\s*:' .github/workflows/*.yml` が 1 件以上 | dry-run で `actions/download-artifact` が untrusted artifact を download し secrets 参照 job が後段で起動 | PR diff レビュー：新規 `workflow_run` 導入は MAJOR ブロック | 検出 → revert |
| **FC-6** | `uses:` が SHA ではなく tag / branch ref（UT-GOV-007 連携） | **MAJOR** | UT-GOV-007 連携 / AC-4 | `grep -nE 'uses: [^@]+@(v[0-9]\|main\|master\|HEAD)' .github/workflows/*.yml` | dry-run logs で action のバージョンが不定 | PR diff レビュー：`uses:` 行を全検査 | 検出 → SHA pin に修正 |
| **FC-7** | fork PR で labeled trigger（`needs-review` / `auto-merge` 等）が誰でも付けられる状態 | **MINOR**（運用補強） | AC-1 拡張 | `gh api repos/:owner/:repo/collaborators` で write 権限保持者の棚卸し | dry-run T-4 で fork contributor が label 付与を試行し拒否されること | レビュー：CODEOWNERS / branch protection の label permission 確認 | label 操作権限を maintainer に限定 |
| **FC-8** | `pull_request_target.types` 未指定（全 type で起動 = `assigned` / `review_requested` 等でも triage 起動） | **MINOR**（設計補強） | AC-1 拡張 | `yq '.on.pull_request_target.types' .github/workflows/*.yml` が `null` | dry-run で意図しない type で job 起動 | PR diff レビュー：`types:` の allowlist を確認 | `types: [opened, synchronize, reopened, labeled]` に限定 |
| **FC-9** | Dependabot / first-time contributor / maintainer re-run の境界差で secrets 可視性が変わる | **MINOR**（記録必須） | AC-3 / S-1 | actor を yq で抽出する static rule なし → 動的に確認 | dry-run logs の `actor` / `event.sender.type` / `pull_request.author_association` を記録 | レビュー：Dependabot PR で別ルートが必要なら `dependabot.yml` で許可リスト管理 | actor と approval state を `outputs/phase-9/quality-gate.md` に記録 |
| **FC-10** | cache / artifact poisoning で untrusted output が trusted workflow に流入 | **条件付 MAJOR** | F-3 拡張 / AC-3 | `grep -nE 'actions/(cache\|download-artifact)' .github/workflows/*.yml` で trigger 文脈を確認 | dry-run logs で fork PR の cache key を triage workflow が hit していないこと | レビュー：cache key / artifact consumer を trigger 別に分離 | trusted / untrusted の cache key prefix を分離（例：`v1-untrusted-` / `v1-trusted-`） |
| **FC-11** | `workflow_dispatch` 誤用で高権限 job が手動実行される | **MINOR** | AC-5 | `yq '.on.workflow_dispatch' .github/workflows/*.yml` の有無＋ job permissions 検査 | dry-run logs で manual run 時の token scope を確認 | レビュー：`workflow_dispatch` を持つ workflow の permissions が読み取りまたは最小昇格に限定 | trigger と permissions の組み合わせを審査 |

## 3. 検出手段の 3 系統まとめ

### (a) 静的検査（Phase 5 runbook Step 4 で実行）

```bash
# FC-1
grep -nE 'github\.event\.pull_request\.head\.(ref|sha)' \
  $(grep -lE '^\s*pull_request_target\s*:' .github/workflows/*.yml)

# FC-2
yq '.jobs[].steps[] | select(.uses | test("actions/checkout")) | .with."persist-credentials"' \
  .github/workflows/*.yml

# FC-3
yq '.permissions' .github/workflows/*.yml

# FC-4
grep -nE '\$\{\{\s*secrets\.' \
  $(grep -lE '^\s*pull_request_target\s*:' .github/workflows/*.yml)

# FC-5
grep -nE '^\s*workflow_run\s*:' .github/workflows/*.yml

# FC-6
grep -nE 'uses: [^@]+@(v[0-9]|main|master|HEAD)' .github/workflows/*.yml

# FC-8
yq '.on.pull_request_target.types' .github/workflows/*.yml

# FC-10 / FC-11 は yq + 目視
```

### (b) 動的検査（Phase 5 runbook Step 5 で実行）

`gh run view <id> --log` の出力を以下で grep：

```bash
gh run view <id> --log | grep -iE 'secret|GITHUB_TOKEN|aws_|cloudflare_api_token|op://'
gh run view <id> --log | grep -iE 'Fetching head|Checking out PR #'
gh run view <id> --log | jq -r '.actor, .event.action, .event.sender.type'  # FC-9 で actor を記録
```

### (c) レビュー（PR diff チェックリスト）

将来 PR で `.github/workflows/` を変更する場合のレビュアー必須確認項目：

1. `pull_request_target` を持つ workflow の `actions/checkout.with.ref` が `head.*` を参照していないこと（FC-1）
2. 全 `actions/checkout` が `persist-credentials: false` を明示していること（FC-2）
3. workflow デフォルト `permissions: {}`、job 単位最小昇格であること（FC-3）
4. `pull_request_target` 配下で `${{ secrets.* }}` 参照がゼロであること（FC-4）
5. `workflow_run` トリガが新規導入されていないこと（FC-5）

## 4. 回帰防止チェックリスト（PR レビュー時 5 項目）

| # | 項目 | 確認手段 |
| --- | --- | --- |
| 1 | `pull_request_target` 配下で PR head checkout / `head.*` eval が無い | grep（FC-1） |
| 2 | 全 `actions/checkout` で `persist-credentials: false` | yq（FC-2） |
| 3 | workflow / job の `permissions:` が最小（`write-all` 不在） | yq（FC-3） |
| 4 | triage workflow が `${{ secrets.* }}` を参照していない | grep（FC-4） |
| 5 | `workflow_run` トリガが追加されていない | grep（FC-5） |

> CODEOWNERS で `.github/workflows/*` の review を governance 担当に固定し、本 5 項目を PR テンプレートに明記する（後続実装タスクで導入）。

## 5. レポート規約（失敗ケース検出時の通知フロー）

1. 検出者が `gh issue create --label security --label governance --title "[FC-X] <ケース名>"` で Issue を起票
2. 本文に以下を記載：
   - 検出された FC ID（FC-1〜FC-11）
   - 静的 / 動的 / レビューのいずれで検出したか
   - 該当 workflow ファイルと行番号、該当 PR / run-id
   - 重大度（MAJOR / MINOR）
3. `security` ラベル付与で governance 担当を自動アサイン（後続実装タスクで `.github/CODEOWNERS` および label automation を整備）
4. MAJOR の場合：該当 PR を即 revert または block。MINOR の場合：次 sprint で改善 PR を起票
5. 是正 PR を本 Issue にリンクし、merge 後に `gh issue close --reason completed`

## 6. 完了条件

- [x] FC-1〜FC-11 が列挙されている（最低 8 件）。
- [x] 各 FC に静的 / 動的 / レビューの 3 検出手段が記述されている。
- [x] FC-1〜FC-6 は MAJOR、FC-7〜FC-11 は MINOR（または条件付 MAJOR）として分類されている。
- [x] 回帰防止チェックリスト 5 項目が記述されている。
- [x] レポート規約（Issue 起票 → security ラベル → 担当割当 → close）が記述されている。
