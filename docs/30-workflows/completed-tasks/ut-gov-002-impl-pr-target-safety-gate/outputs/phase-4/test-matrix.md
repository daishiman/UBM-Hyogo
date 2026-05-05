# Phase 4 — dry-run 実走テストマトリクス（test-matrix）

## Status

spec_created

> 本書は **dry-run の実走テンプレ** である。Phase 5 runbook Step 4〜6 が本書の表に従って静的検査・動的検査・VISUAL 取得を実走し、結果列を埋める。仕様としての完成は Phase 4 で固定し、結果埋め込みは Phase 11 manual smoke で行う。

## 1. 入力の継承

| 入力 | 役割 |
| --- | --- |
| `outputs/phase-1/main.md` | 真の論点 / リスク R-1〜R-4 |
| `outputs/phase-2/design.md` §2〜§6 | 責務分離 / 実 YAML / required status checks 同期 |
| `outputs/phase-3/review.md` §3 / §4 | 5 箇条検証手段 / S-1〜S-6 |
| `outputs/phase-4/main.md` | 4 観点 / T-1〜T-5 配列 / F-1〜F-5 |
| `index.md` AC-1〜AC-9 | 受入条件 |

## 2. dry-run シナリオマトリクス（T-1〜T-5）

各シナリオは Phase 5 Step 5 で実走する。観点列 (a)/(b)/(c)/(d) は Phase 4 main §1 と対応。

| ID | シナリオ | trigger | actor | (a) permissions | (b) checkout ref + persist-credentials | (c) secrets / GITHUB_TOKEN | (d) head.* eval | 期待結果 | 証跡 | 関連 AC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-1 | same-repo PR build/test | `pull_request` (opened/synchronize/reopened) | maintainer / collaborator | workflow `permissions: {}` ＋ job `contents: read` | `ref: github.event.pull_request.head.sha` ＋ `persist-credentials: false` | `${{ secrets.* }}` 不参照、`GITHUB_TOKEN` は read-only | trusted job 内で eval なし | lint / typecheck / build が green、secrets 露出ゼロ | `outputs/phase-11/manual-smoke-log.md#T-1` ＋ `screenshots/same-repo-pr-actions-ui-YYYY-MM-DD.png` | AC-2 / AC-3 / AC-4 |
| T-2 | fork PR build/test | `pull_request` (fork 由来) | fork contributor | 同 T-1 | 同 T-1 | fork PR では GitHub が secrets 非注入。設計でも参照禁止。`GITHUB_TOKEN` は read-only | trusted job 内で eval なし | build / test 完走、`gh run view --log` で `secret` / `token` 値が出力されない | `outputs/phase-11/manual-smoke-log.md#T-2` ＋ `screenshots/fork-pr-actions-ui-YYYY-MM-DD.png` | AC-2 / AC-3 / AC-4 |
| T-3 | fork PR triage（label / コメント） | `pull_request_target` (opened/synchronize/labeled/reopened) | maintainer 操作 / GitHub 自動 | workflow `permissions: {}` ＋ job `pull-requests: write` のみ昇格 | `ref: github.event.pull_request.base.sha` ＋ `persist-credentials: false`（または checkout step を置かない） | `${{ secrets.* }}` 不参照、`github.token` のみ使用 | `head.* / title / body` を `run:` で eval しない（必要なら `env:` 経由） | label 操作 / コメントのみ。PR head の checkout / install / build なし | `outputs/phase-11/manual-smoke-log.md#T-3` ＋ `screenshots/t-3-actions.png` | AC-1 / AC-3 / AC-4 / AC-5 |
| T-4 | workflow_dispatch audit | `workflow_dispatch` | maintainer | workflow `permissions: {}` ＋ job `pull-requests: write` のみ（MVP echo。label/comment 実装時は再評価） | checkout step を置かない | `${{ secrets.* }}` 不参照、`github.token` のみ使用 | trusted context だが user-controlled PR head を読まない | 手動 audit で PR head checkout / install / build なし、permissions が固定 | `outputs/phase-11/manual-smoke-log.md#T-4` ＋ `screenshots/workflow-dispatch-audit-actions-ui-YYYY-MM-DD.png` | AC-1 / AC-3 / AC-9 |
| T-5 | re-run（手動 UI / `gh run rerun`） | UI rerun / `gh run rerun <run-id>` | maintainer | T-1〜T-3 のいずれかと同一固定 | 元 run の SHA を再評価（drift しないこと） | 再実行でも secrets / token 露出が増えないこと | 同上 | job 名・permissions が不変、required status checks 名と一致 | `outputs/phase-11/manual-smoke-log.md#T-5` ＋ `screenshots/manual-rerun-actions-ui-YYYY-MM-DD.png` | AC-5 / AC-6 |

## 3. 静的検査（5 コマンド・実走必須）

Phase 5 runbook Step 4 で実走。結果は `outputs/phase-5/static-check-log.md` に保存。

### 3.1 actionlint

```bash
actionlint .github/workflows/*.yml
```

期待: exit 0。違反は MAJOR で F-1〜F-5 に分類。

### 3.2 yq による permissions 検査（triage）

```bash
yq '.permissions' .github/workflows/pr-target-safety-gate.yml
```

期待: `{}`（または null = 未設定で workflow デフォルトとして minimal）。`write-all` / `contents: write` / `actions: write` 等の検出は F-4 MAJOR。

### 3.3 yq による permissions 検査（build-test）

```bash
yq '.permissions' .github/workflows/pr-build-test.yml
```

期待: `{}` または `{contents: read}`。job 単位で `contents: read` のみ昇格していること。

### 3.4 grep による persist-credentials の存在確認

```bash
grep -RnE 'persist-credentials:\s*false' .github/workflows/
```

期待: 全 `actions/checkout` 使用箇所で hit すること（補助として `grep -L 'persist-credentials:' .github/workflows/*.yml` が actions/checkout を含む workflow で 0 件）。欠落は F-2 MAJOR。

### 3.5 grep による head.* eval パターン検出

```bash
grep -RnE 'github\.event\.pull_request\.head\.(ref|sha)' .github/workflows/
```

期待: trusted（`pull_request_target`）workflow で 0 件。`pull_request` workflow の `actions/checkout` の `with.ref` への代入のみ許容。`run:` 内の直接展開は F-1 MAJOR。

> 補助 grep（推奨実走）:
> - `grep -RnE '^\s*workflow_run\s*:' .github/workflows/` → 0 件（代替案 D 却下根拠）
> - `grep -RnE '\$\{\{\s*github\.event\.pull_request\.(head\.|title|body)' .github/workflows/` → trusted job の `run:` で 0 件

## 4. 動的検査（実走仕様）

Phase 5 runbook Step 5 で実走。`gh run view --log` 結果は `outputs/phase-11/manual-smoke-log.md` に転記。

| Step | 操作 | 期待 |
| --- | --- | --- |
| D-1 | テスト用 fork repo を一時作成し、軽微な変更で fork PR を起票 | `pr-build-test.yml` (T-2) と `pr-target-safety-gate.yml` (T-3) が両方起動 |
| D-2 | `gh run list --workflow=pr-target-safety-gate.yml --limit 5` / `--workflow=pr-build-test.yml --limit 5` | 直近 run の actor / event / status を確認 |
| D-3 | `gh run view <run-id> --log \| grep -iE 'secret\|GITHUB_TOKEN\|aws_\|cloudflare_api_token\|op://'` | 0 件（`OK: no leakage` を期待） |
| D-4 | maintainer が `needs-review` ラベルを付与 | `pull_request_target.types: [labeled]` の triage が `pull-requests: write` のみで完走 |
| D-5 | `gh run rerun <run-id>`（T-5） | 再実行で token / secret 露出が変化しないこと、job 名・permissions 不変 |
| D-6 | 一時 fork repo を archive または削除 | 痕跡を残さない |

> grep 例: `gh run view <id> --log | grep -iE 'secret|GITHUB_TOKEN|aws_|cloudflare_api_token|op://' || echo "OK: no leakage"`

## 5. 失敗判定 F-1〜F-5（MAJOR）

| ID | 失敗条件 | 検出手段 | 対応 AC |
| --- | --- | --- | --- |
| F-1 | `pull_request_target` workflow が PR head を checkout、または `head.* / title / body` を `run:` で直接展開 | §3.5 grep / actionlint / D-3 log | AC-1 / AC-7 |
| F-2 | `actions/checkout` で `persist-credentials: false` が欠落 | §3.4 grep | AC-3 / AC-7 |
| F-3 | fork PR build に secrets が渡る、または triage workflow が secrets を参照 | `grep -RnE '\$\{\{\s*secrets\.' .github/workflows/pr-target-safety-gate.yml .github/workflows/pr-build-test.yml` ＋ D-3 log | AC-3 / AC-4 |
| F-4 | workflow デフォルト `permissions:` が広範に付与（`write-all` / `contents: write` 等） | §3.2 / §3.3 yq | AC-3 |
| F-5 | required status checks 名 drift（branch protection の `contexts` と新 job 名 `triage` / `build-test` が不一致） | `gh api repos/daishiman/UBM-Hyogo/branches/{main,dev}/protection --jq '.required_status_checks.contexts'` | AC-5 / AC-6 |

> F-1〜F-5 のいずれかが 1 件以上検出された場合、Phase 9 quality-gate の MAJOR 0 件条件を満たさず NO-GO。

## 6. VISUAL evidence 取得タイミング・命名規約

| 取得対象 | タイミング | 保存先 | 命名 |
| --- | --- | --- | --- |
| GitHub Actions UI（run summary / job permissions 表示） | T-1〜T-5 各 run 完了直後 | `outputs/phase-11/screenshots/` | `<scenario>-actions-ui-<YYYY-MM-DD>.png`（例: `same-repo-pr-actions-ui-2026-04-30.png`） |
| branch protection 画面（required status checks 一覧） | T-5 完了時、または job 名同期確認時 | `outputs/phase-11/screenshots/` | `branch-protection-{main,dev}-required-checks-<YYYY-MM-DD>.png` |
| `gh api .../branches/main/protection` 出力 | Phase 5 Step 7 実行時 | `outputs/phase-5/static-check-log.md` のテキスト形式併記 | テキスト埋め込み |

> screenshot は PNG 推奨。secrets 値・PR contributor の private 情報が画面に映らないことを目視確認した上で保存する。

## 7. "pwn request" 非該当 5 箇条との対応

| review.md 箇条 | 担保 |
| --- | --- |
| #1 PR head を checkout しない | T-3 / T-4 ＋ §3.5 grep |
| #2 `workflow_run` 橋渡し禁止 | §3 補助 grep |
| #3 `head.* / title / body` を eval しない | §3 補助 grep ＋ D-3 log |
| #4 `persist-credentials: false` 強制 | T-1〜T-5 ＋ §3.4 grep |
| #5 workflow `permissions: {}` ＋ job 単位最小昇格 | T-1〜T-5 ＋ §3.2 / §3.3 yq |

## 8. 証跡命名規約

| 用途 | パス |
| --- | --- |
| 本マトリクス（仕様） | `outputs/phase-4/test-matrix.md` |
| 静的検査ログ（実走時） | `outputs/phase-5/static-check-log.md` |
| 動的検査ログ（実走時、T-1〜T-5） | `outputs/phase-11/manual-smoke-log.md` |
| VISUAL evidence | `outputs/phase-11/screenshots/<scenario>-<view>-<YYYY-MM-DD>.png` |

## 9. 完了条件

- [x] T-1〜T-5 が 4 観点 (a)〜(d) 列を持つ表形式で記述されている
- [x] 静的検査コマンド 5 種（actionlint / yq×2 / grep×2）が記述されている
- [x] 動的検査の D-1〜D-6 と `gh run view --log` 手順が記述されている
- [x] F-1〜F-5 が MAJOR として固定されている
- [x] VISUAL evidence 取得タイミング・保存先・命名規約が §6 に明記されている
- [x] "pwn request" 非該当 5 箇条との対応表が §7 に含まれる
- [x] 証跡命名規約が §8 に記述されている
