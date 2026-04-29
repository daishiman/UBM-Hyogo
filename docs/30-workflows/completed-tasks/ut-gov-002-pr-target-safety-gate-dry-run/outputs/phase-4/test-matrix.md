# Phase 4 — dry-run テストマトリクス（test-matrix）

## Status

spec_created

> 本書は **dry-run の仕様**であり、実走は本タスク非対象（AC-8）。後続実装タスクが本マトリクスの「期待結果」「証跡パス」列を埋める前提でフォーマットを固定する。

## 1. 入力の継承

| 入力 | 役割 |
| --- | --- |
| `outputs/phase-1/main.md` | 真の論点 / リスク R-1〜R-3 |
| `outputs/phase-2/design.md` §2〜§4 | 責務分離設計 / `pwn request` 非該当 5 箇条 |
| `outputs/phase-3/review.md` §3 / §4 | 5 箇条検証手段 / security 観点 S-1〜S-5 |
| `index.md` AC-1〜AC-9 | 受入条件 |

## 2. dry-run シナリオマトリクス（T-1〜T-5）

| ID | シナリオ | event type | actor | checkout ref | workflow permissions | job permissions | secrets access | 期待結果 | 証跡パス | 関連 AC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-1 | same-repo PR build/test | `pull_request`（types: opened/synchronize/reopened） | maintainer / collaborator | `${{ github.event.pull_request.head.sha }}` | `{}` | `contents: read` | none（`${{ secrets.* }}` 不参照） | lint / typecheck / build / unit test が green、GITHUB_TOKEN は read-only、secrets 非露出 | `outputs/phase-9/quality-gate.md` の T-1 セクション | AC-2 / AC-5 |
| T-2 | fork PR build/test | `pull_request`（fork 由来） | fork contributor | `${{ github.event.pull_request.head.sha }}` | `{}` | `contents: read` | none（fork PR では GitHub が secrets を注入しない＋設計でも不参照） | build/test 実行・GITHUB_TOKEN は read-only・secrets 非到達。`gh run view --log` で `secret`・`token` 値が出力されないことを確認 | `outputs/phase-11/manual-smoke-log.md` の T-2 セクション | AC-2 / AC-3 / AC-5 |
| T-3 | fork PR triage（label / auto-merge / コメント） | `pull_request_target`（types: opened/synchronize/reopened/labeled） | maintainer 操作 / GitHub 自動 | `${{ github.event.repository.default_branch }}` または `${{ github.event.pull_request.base.sha }}` | `{}` | `pull-requests: write` のみ昇格 | none（`env:` でも secrets を渡さない） | label 操作・コメント投稿のみ。**PR head の checkout / install / build / script eval を一切行わない**。`head.*` を `run:` で展開しない | `outputs/phase-9/quality-gate.md` の T-3 セクション | AC-1 / AC-3 / AC-4 / AC-5 |
| T-4 | labeled trigger | `pull_request_target.types: [labeled]` | maintainer によるラベル付与 | base 側固定（T-3 と同条件） | `{}` | label が allowlist（`needs-review` / `auto-merge` 等）のみ昇格条件を満たす場合に限り `pull-requests: write` | none | allowlist 外の label では job が起動しても early-exit。allowlist 内の label でのみ triage 実行 | `outputs/phase-9/quality-gate.md` の T-4 セクション | AC-1 / AC-3 / AC-5 |
| T-5 | scheduled / workflow_dispatch / re-run | `schedule` / `workflow_dispatch` / `gh run rerun` | bot / maintainer | default branch（fork head は不可） | `{}` | 用途別最小（read-only audit を基本） | none unless explicitly justified | 静的監査・依存更新検査のみ。手動再実行で token / secret の露出が増えないこと | `outputs/phase-11/manual-smoke-log.md` の T-5 セクション | AC-3 / AC-9 |

## 3. 静的検査（後続実装タスクが Phase 5 Step 4 で実行）

> いずれも actionlint / yq / grep のみで完結し、外部サービスを呼ばない。

### 3.1 actionlint

```bash
actionlint .github/workflows/*.yml
```

期待: exit 0。違反は MAJOR とし F-1〜F-4 のいずれかに割り当てる。

### 3.2 yq による permissions / checkout 検査

```bash
# workflow デフォルト permissions が {} か（最低限 unset でも可、過剰昇格を弾く）
yq '.permissions' .github/workflows/pr-target-safety-gate.yml          # => "{}" or null
yq '.jobs[].permissions' .github/workflows/pr-target-safety-gate.yml   # => 最小（pull-requests: write 等）

# 全 actions/checkout の persist-credentials が false か
yq '.jobs[].steps[] | select(.uses | test("actions/checkout")) | .with."persist-credentials"' \
  .github/workflows/*.yml
# 期待: 全件 "false"（true / null は MAJOR）
```

### 3.3 grep による pwn request パターン検出

```bash
# (a) pull_request_target を持つ workflow を抽出
grep -lE '^\s*pull_request_target\s*:' .github/workflows/*.yml > /tmp/prt.list

# (b) その中で PR head の checkout / head.* eval が混入していないこと
grep -nE 'github\.event\.pull_request\.head\.(ref|sha)' $(cat /tmp/prt.list)
# 期待: 0 件（1 件以上 → F-1 MAJOR）

# (c) workflow_run トリガが存在しないこと（D 案 MAJOR 却下に対応）
grep -nE '^\s*workflow_run\s*:' .github/workflows/*.yml
# 期待: 0 件

# (d) run: の中で head.* / title / body を直接展開していないこと
grep -nE '\$\{\{\s*github\.event\.pull_request\.(head\.|title|body)' .github/workflows/*.yml
# 期待: env: 経由のみ。run: シェル展開直接は MAJOR（F-1 拡張）

# (e) persist-credentials の欠落検出
grep -L 'persist-credentials:' .github/workflows/*.yml
# 期待: actions/checkout を含む workflow はすべて persist-credentials を明示
```

## 4. 動的検査（実走仕様、別 PR で実施）

> 本書では手順を仕様レベルで定義する。`gh` / fork PR 起票は本タスクで実行しない（AC-8）。

| Step | 操作 | 期待 |
| --- | --- | --- |
| D-1 | テスト用 fork repo を一時作成し、軽微な変更で fork PR を起票 | `pull_request` workflow が起動し `pull_request_target` workflow も triage モードで起動 |
| D-2 | `gh run list --workflow=pr-target-safety-gate.yml --limit 5` | 直近 run の actor / event / status を確認 |
| D-3 | `gh run view <run-id> --log` を取得し、以下を grep で確認 | （a）`secret` / `token` 値が出力されない （b）`actions/checkout` が `head.sha` を解決していない（triage 側） （c）`Permission`/`GITHUB_TOKEN` が write を要求していない |
| D-4 | maintainer が `needs-review` ラベルを付与 | `pull_request_target.types: [labeled]` の triage が起動、`pull-requests: write` のみで完了 |
| D-5 | 同 PR で `gh run rerun <run-id>` を実行 | 再実行でも token / secret 露出は変化なし（T-5） |
| D-6 | 一時 fork repo を archive または削除 | 痕跡を残さない（運用ガイドラインを runbook に明記） |

> grep 例：`gh run view <id> --log | grep -iE 'secret|GITHUB_TOKEN|aws_|cloudflare_api_token'` が **0 件**であること。

## 5. 失敗判定基準（F-1〜F-4：すべて MAJOR）

| ID | 失敗条件 | 検出手段 | 対応 AC |
| --- | --- | --- | --- |
| F-1 | `pull_request_target` workflow が PR head を checkout している、または `head.*` / `title` / `body` を `run:` で直接展開している | grep §3.3 (b)(d) / actionlint | AC-1 / AC-4 |
| F-2 | `actions/checkout` で `persist-credentials: false` が欠落 | yq §3.2 / grep §3.3 (e) | AC-5 |
| F-3 | fork PR build に secrets が渡る（`env: SECRET: ${{ secrets.* }}` 等） | grep `\$\{\{\s*secrets\.` を `pull_request` workflow で検出 / 動的 D-3 | AC-3 / AC-5 |
| F-4 | workflow デフォルト `permissions:` が広範に付与（`write-all` / `contents: write` 等） | yq §3.2 | AC-5 |

> F-1〜F-4 のいずれかが 1 件以上検出された場合、Phase 9 quality-gate の **MAJOR 0 件**条件を満たさず NO-GO。

## 6. "pwn request" 非該当 5 箇条との対応（review.md §3 連携）

| review.md 箇条 | 本マトリクスでの担保 |
| --- | --- |
| #1 PR head を checkout しない | T-3 / T-4 + 静的 §3.3 (b) |
| #2 `workflow_run` 橋渡し禁止 | 静的 §3.3 (c) |
| #3 `head.*` / `title` / `body` を eval しない | 静的 §3.3 (d) |
| #4 `persist-credentials: false` 強制 | T-1〜T-5 + yq §3.2 + grep §3.3 (e) |
| #5 workflow `permissions: {}` ＋ job 単位最小昇格 | T-1〜T-5 + yq §3.2 |

## 7. 証跡命名規約

| 用途 | パス |
| --- | --- |
| 本マトリクス（仕様） | `outputs/phase-4/test-matrix.md` |
| 静的検査ログ（実走時） | `outputs/phase-9/quality-gate.md` の "Static check" 節 |
| 動的検査ログ（実走時、T-2 / T-5） | `outputs/phase-11/manual-smoke-log.md` |
| dry-run 実走全体まとめ | 後続実装タスクの `outputs/phase-9/dry-run-log.md`（仕様参照のみ、本タスクでは作成しない） |

> いずれも本タスクではファイルを生成しない（docs-only）。後続実装タスクが上記命名で作成する。

## 8. 完了条件

- [x] T-1〜T-5 が表形式で記述されている。
- [x] 静的検査コマンド（actionlint / yq / grep）が記述されている。
- [x] 動的検査の手順 D-1〜D-6 が仕様レベルで定義されている。
- [x] F-1〜F-4 が MAJOR として固定されている。
- [x] "pwn request" 非該当 5 箇条との対応表が含まれる。
- [x] 証跡命名規約が §7 に記述されている。
