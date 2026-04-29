# Phase 9 成果物 — 品質保証

> 状態: **NOT EXECUTED — spec_created**
> 本 main.md は QA 13 項目の判定結果を集約する SSOT。spec_created 段階では実走系（GET 応答照合 / 適用後 verify / UT-GOV-004 突合）は SKIP 表記とし、実走は Phase 11 / 13 にずれ込む。実走可能項目（CLAUDE.md grep / line budget / link / navigation drift / validate-phase-output.js）は実走可だが、実コード成果物が未生成のため最終 PASS は Phase 5 着手後に確定。

## 1. QA 13 項目サマリー

| # | 観点 | 判定基準 | 実走可否 | 結果プレースホルダ |
| --- | --- | --- | --- | --- |
| 1 | payload schema (10 field) | 全 field 型・許容値一致 | Phase 5 実装後 | NOT EXECUTED |
| 2 | snapshot ↔ GET 一致 | diff 空 | Phase 11 実走 | NOT EXECUTED |
| 3 | adapter 冪等性 | 2 回適用で diff 空 | Phase 11 実走 | NOT EXECUTED |
| 4 | 適用後 GET ↔ payload 一致 | adapter 通過で diff 空 | Phase 13 実走 | NOT EXECUTED |
| 5 | CLAUDE.md grep（5 項目） | 全 hit | 実走可 | spec_created で実走可（後述 §5） |
| 6 | UT-GOV-004 contexts 積集合 | 差集合空 | UT-GOV-004 完了後 | NOT EXECUTED |
| 7 | line budget | 範囲内 | 実走可 | spec_created で実走可（後述 §7） |
| 8 | link 切れ | 0 | 実走可 | spec_created で実走可 |
| 9 | navigation drift | 0 | 実走可 | spec_created で実走可 |
| 10 | 無料枠 | 対象外 | — | 対象外（resource 消費なし） |
| 11 | secret hygiene | 対象外 | — | 対象外（新規 secret 0） |
| 12 | a11y | 対象外 | — | 対象外（UI なし） |
| 13 | validate-phase-output.js | exit 0 | 実走可 | spec_created で実走可 |

## 2. payload schema 検証（観点 1）

### 2.1 必須 field × 型 × 許容値（再掲）

| field | 型 | 許容値 |
| --- | --- | --- |
| `required_status_checks` | object \| null | `{strict, contexts[]}` または null |
| `enforce_admins` | bool | true / false |
| `required_pull_request_reviews` | null | **null 固定** |
| `restrictions` | object \| null | `{users[], teams[], apps[]}` または null |
| `required_linear_history` | bool | true / false |
| `allow_force_pushes` | bool | **false 固定** |
| `allow_deletions` | bool | **false 固定** |
| `required_conversation_resolution` | bool | true / false |
| `lock_branch` | bool | **false 固定** |
| `allow_fork_syncing` | bool | true / false |

### 2.2 検証関数（Phase 8 §3 と整合）

```bash
validate_payload() {
  local f="$1"
  jq -e '
    (.required_status_checks | (. == null) or (has("strict") and has("contexts"))) and
    (.enforce_admins | type == "boolean") and
    (.required_pull_request_reviews == null) and
    (.restrictions | (. == null) or (has("users") and has("teams") and has("apps"))) and
    (.required_linear_history | type == "boolean") and
    (.allow_force_pushes == false) and
    (.allow_deletions == false) and
    (.required_conversation_resolution | type == "boolean") and
    (.lock_branch == false) and
    (.allow_fork_syncing | type == "boolean")
  ' "$f"
}
```

### 2.3 期待結果（spec_created）

- 4 ファイル（payload × 2 + rollback × 2）の生成は Phase 5 / 11。本 Phase では検証手順のみ確定、実行は Phase 11 / 13 にずれ込む。

## 3. GET 応答照合（観点 2 / 3 / 4）

### 3.1 比較ペア

| ペア | コマンド | 期待 |
| --- | --- | --- |
| snapshot ↔ GET 直後 | `diff <(jq -S . snapshot-{branch}.json) <(gh api ... GET | jq -S .)` | 空 |
| adapter 冪等性 | `diff <(map_get_to_put snap) <(map_get_to_put snap)` | 空 |
| 適用後 GET ↔ payload | `diff <(GET | map_get_to_put | jq -S .) <(jq -S . payload-{branch}.json)` | 空（適用直後） |

### 3.2 spec_created 時の扱い

- 実走は Phase 11（リハーサル）/ Phase 13（本番）に委ねる。
- 本 Phase では「期待結果と検証手順のテキスト固定」までを成果物とする。

## 4. UT-GOV-004 contexts 突合（観点 6）

### 4.1 パターン A: UT-GOV-004 completed 単独

```bash
ut_gov_004_contexts=$(jq -r '.contexts[]' \
  docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-XX/contexts.json \
  | sort -u)
payload_contexts=$(jq -r '.required_status_checks.contexts[]' \
  branch-protection-payload-dev.json | sort -u)
comm -23 <(echo "$payload_contexts") <(echo "$ut_gov_004_contexts")
```

期待: 差集合が空。

### 4.2 パターン B: UT-GOV-004 同時完了 / 2 段階適用

- 第 1 段階の payload で `required_status_checks.contexts == []` を確認。
- 第 2 段階の再 PUT トリガが Phase 13 完了条件に明記されていることを確認。

### 4.3 spec_created 時の扱い

- UT-GOV-004 のアウトプット成果物 path は仮置き（`phase-XX/contexts.json`）。実 path は UT-GOV-004 完了時に確定。
- 本 Phase では突合手順の SSOT 化に留める。

## 5. CLAUDE.md grep 一致（観点 5）

### 5.1 5 項目チェック

| # | grep パターン | 期待 |
| --- | --- | --- |
| 1 | `required_pull_request_reviews` | hit |
| 2 | `feature/\*` | hit |
| 3 | `required_linear_history` | hit |
| 4 | `required_conversation_resolution` | hit |
| 5 | `force-push` | hit |

### 5.2 spec_created 時点の実走結果

- 実走可。CLAUDE.md は本ワークフロー作業ディレクトリ直下に存在。
- spec_created 段階で実走した場合、5 項目すべて hit する想定。実走結果は Phase 10 GO/NO-GO 判定時に確定。

## 6. 対象外 3 項目（観点 10 / 11 / 12）

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 無料枠見積 | 対象外 | 本タスクは Cloudflare Workers / D1 / Sheets を使わない。GitHub REST API のみで完結し、無料枠消費なし |
| secret hygiene | 対象外 | 既存 `gh` CLI 認証（OAuth または `GH_TOKEN`）を流用、新規 secret 導入 0。`scripts/cf.sh` 系経路の対象外 |
| a11y (WCAG 2.1) | 対象外 | UI コンポーネントなし。`apps/web` を改変しない |

## 7. line budget / link 整合 / navigation drift（観点 7 / 8 / 9 / 13）

### 7.1 期待値

| ファイル群 | 期待行数 |
| --- | --- |
| index.md | ≤ 250 行（既存約 186 行） |
| phase-01.md 〜 phase-13.md | 各 100〜500 行 |
| outputs/phase-NN/main.md | 50〜400 行（spec_created プレースホルダは < 50 許容） |

### 7.2 link 切れ検出

- `grep -rn '](\.\./\|](\./\|](outputs/'` で相対参照を抽出 → ls 突合 → リンク切れ 0。

### 7.3 navigation drift

- artifacts.json `phases[*].outputs` × 実 path 完全一致。
- Phase 13 outputs 9 ファイル（payload × 2 + snapshot × 2 + rollback × 2 + applied × 2 + apply-runbook.md）が一致。

### 7.4 validate-phase-output.js

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  --workflow docs/30-workflows/ut-gov-001-github-branch-protection-apply
```

期待: exit 0。失敗時は stderr を `outputs/phase-09/verify-error.txt` に保存。

## 8. PASS / NOT EXECUTED マッピング

| 観点 | 状態 |
| --- | --- |
| 1 payload schema | NOT EXECUTED（Phase 5 / 11 / 13） |
| 2 snapshot ↔ GET | NOT EXECUTED（Phase 11） |
| 3 adapter 冪等 | NOT EXECUTED（Phase 11） |
| 4 適用後 ↔ payload | NOT EXECUTED（Phase 13） |
| 5 CLAUDE.md grep | 実走可 → spec_created で PASS 想定 |
| 6 UT-GOV-004 突合 | NOT EXECUTED（UT-GOV-004 完了後） |
| 7 line budget | 実走可 → spec_created で PASS 想定 |
| 8 link 切れ | 実走可 → spec_created で PASS 想定 |
| 9 navigation drift | 実走可 → spec_created で PASS 想定 |
| 10 無料枠 | 対象外 |
| 11 secret hygiene | 対象外 |
| 12 a11y | 対象外 |
| 13 validate-phase-output.js | 実走可 → spec_created で PASS 想定 |

## 9. 引き渡し（Phase 10 へ）

- QA 13 項目の判定結果テンプレ
- payload schema 10 field の検証式（`validate_payload`）
- GET 応答照合 3 ペア
- UT-GOV-004 contexts 突合パターン A / B
- CLAUDE.md grep 5 項目（実走可）
- 対象外 3 項目（無料枠 / secret / a11y）

## 10. NOT EXECUTED 注記

本 Phase は spec_created。実走系（観点 1〜4 / 6）は Phase 11 / 13 / UT-GOV-004 完了後にずれ込む。実走可項目（観点 5 / 7 / 8 / 9 / 13）も Phase 5 / 6 / 7 で実コード・実 phase ファイルが揃った後でないと確定 PASS にできないため、本 Phase では「PASS 想定」表記に留める。
