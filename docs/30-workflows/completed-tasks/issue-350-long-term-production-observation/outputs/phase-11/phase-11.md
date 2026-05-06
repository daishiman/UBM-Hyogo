# Phase 11 — 検証 / Evidence 収集

**[実装区分: 実装仕様書]** / **NON_VISUAL**

## 1. Phase 11 状態語彙

本タスクは reminder workflow 実装を含むが、**実 production runtime（GitHub Actions schedule の自然発火）の確認は user 認証下で別途必要**。よって:

- spec contract / local test PASS = `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
- runtime evidence（schedule trigger 成功 / 実 Issue 起票）= `PENDING_RUNTIME_EVIDENCE`

`PASS` 単独表記は禁止（skill ルール v2026.05.05-09a-A 準拠）。

## 2. Evidence manifest

| evidence | path | 取得方法 | 状態 |
| --- | --- | --- | --- |
| tool availability | `outputs/phase-11/tool-availability.log` | `command -v actionlint; command -v shellcheck` | `actionlint` / `shellcheck` は local 未導入 |
| YAML parse / format OK | `outputs/phase-11/yaml-format.log` | YAML parse + `pnpm -s exec prettier --check` | PASS |
| bash syntax OK | `outputs/phase-11/bash-syntax.log` | `bash -n scripts/observation/create-reminder-issue.sh` | PASS |
| unit test PASS | `outputs/phase-11/test-result.log` | `bash scripts/observation/test/test-create-reminder-issue.sh` | PASS |
| dispatch target date | `outputs/phase-11/dispatch-target-date.log` | `INPUT_OFFSET_DAYS=7 ... --resolve-only` | `target_date = release_date + offset` |
| no-release fallback | `outputs/phase-11/no-release-fallback.log` | `--resolve-only` without release input | `should_remind=false` / exit 0 |
| dry-run render | `outputs/phase-11/dry-run-d7.md` | `RELEASE_DATE=... bash ... --dry-run > ...` | 同上 |
| label policy | `outputs/phase-11/label-policy.log` | `gh label list --search priority:medium` | `priority:medium` のみ使用 |
| indexes rebuild OK | `outputs/phase-11/indexes-rebuild.log` | `pnpm indexes:rebuild` | PASS |
| runtime workflow run | — | `gh workflow run` 後 `gh run view` | **PENDING_RUNTIME_EVIDENCE**（user 操作・PR merge 後） |
| runtime issue create | — | reminder Issue URL | 同上 |

## 3. NON_VISUAL alternative evidence

screenshot 不要。代替として:

- workflow YAML 構文 OK（YAML parse / Prettier。`actionlint` は UT-350-FU-01 で CI gate 化）
- shell 構文 OK（bash syntax / unit test。`shellcheck` は UT-350-FU-01 で CI gate 化）
- 分岐網羅 OK（test runner）
- placeholder 全置換 OK（dry-run）
- ドキュメント検索性 OK（rg）

を `phase-11.md` に列挙し、各 log path を `outputs/phase-11/` に固定する。

## 4. 完了条件 / close-out

- [x] `outputs/phase-11/` に local evidence log / md が揃う（runtime 2 件は除く）
- [x] `phase-11.md` に「runtime evidence は PENDING — PR merge 後 user が `gh workflow run` で取得」と明記
- [x] workflow root state は `spec_created` のまま（本 cycle で runtime 確認しない場合）

## 5. close-out の語彙

`phase-11.md` 末尾に固定で次を記す:

```
status: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING
runtime: PENDING_RUNTIME_EVIDENCE
follow-up: post-merge user-gated `gh workflow run post-release-observation-reminder.yml` で
           実 schedule path の動作確認 → 結果を本 Phase 11 に追記
```
