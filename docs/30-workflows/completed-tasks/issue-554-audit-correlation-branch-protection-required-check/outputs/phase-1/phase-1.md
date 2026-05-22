# Phase 1 — 要件定義 / GO 判定

実行日時: 2026-05-08
判定: **GO**（main empirical green 確認済）
ただし**重要 drift 発見**あり（後述 §2）→ Phase 13 PUT 実行前にユーザーへエスカレーション。

## 1. 親 Issue / workflow 状態

```
gh issue view 516 --json state,closedAt
{"closedAt":"2026-05-07T03:01:52Z","state":"CLOSED"}
```

`.github/workflows/audit-correlation-verify.yml` は Issue #516 で merged。

## 2. main 上の empirical green

```
gh run list --workflow=audit-correlation-verify.yml --branch=main --limit=10 \
  --json databaseId,headSha,createdAt,conclusion,status
```

| run id | head SHA | createdAt | conclusion |
| --- | --- | --- | --- |
| 25495157257 | 61bd5b5a... | 2026-05-07T12:15:32Z | success |
| 25493653093 | 83309e84... | 2026-05-07T11:42:27Z | success |
| 25488640278 | 0bd5eff9... | 2026-05-07T09:50:45Z | success |
| 25487804042 | 73e60993... | 2026-05-07T09:32:36Z | success |

直近 4 連続 success / failure 0 件 / 7 日以内 → **GO 判定**。

## 3. 不変条件 drift（重要・要エスカレーション）

GET スナップショット（`outputs/phase-11/before-{dev,main}-protection.json`）から、CLAUDE.md「Governance」「ブランチ戦略」章で宣言された不変条件と現実の乖離を発見:

| 項目 | CLAUDE.md 宣言 | dev 現実 | main 現実 |
| --- | --- | --- | --- |
| `required_pull_request_reviews` | `null` | `null` ✅ | **非 null（object）** ❌ |
| `enforce_admins` | `true` | `false` ❌ | `false` ❌ |
| `required_linear_history` | `true` | `false` ❌ | `false` ❌ |
| `lock_branch` | `false` | `false` ✅ | `false` ✅ |
| `required_conversation_resolution` | `true` | `true` ✅ | `true` ✅ |

### 影響と方針

- 本タスク（Issue #554）の核責務は `audit-correlation-verify / verify` の required contexts 追加。
- 上記 drift の修正は**本タスクのスコープ外**（タスク仕様書「含まない」項目に `required_pull_request_reviews` の有効化が明示。`enforce_admins` / `required_linear_history` も同様に CLAUDE.md governance 全体の見直しに該当）。
- Phase 2 以降の PUT body 構築では `unique` で contexts を merge しつつ、その他のフィールドは `(.X.enabled // <CLAUDE.md 宣言値>)` ではなく `(.X.enabled // false/true)` の **現実値継承** を維持すべきだが、Phase 2 仕様書 jq では default を `true` にしているため `enforce_admins` / `required_linear_history` を勝手に `true` に昇格させる副作用がある（実 PUT 時の事故源）。
- 本 Phase 1 で drift を記録し、Phase 13 ユーザー gate で「(a) drift を残したまま contexts 追加のみ実施 / (b) drift 修正を別タスク化 / (c) 本 PR で drift も修正」のいずれかをユーザーに確認する。

### 推奨

- 別タスク化推奨（CLAUDE.md governance 不変条件と GitHub 実態の同期は単独 issue として扱う）。本タスクは contexts 追加のみに絞り、Phase 2 jq の default 値を「現実値継承」に補正したうえで PUT する。
- `(.enforce_admins.enabled // true)` や `// false` のような `false` を失う可能性がある default 式ではなく、Phase 2 / 5 / 6 の `enabled_bool()` adapter で現実値をそのまま渡す形へ修正済み。Phase 13 直前に再確認する。

## 4. DoD

- [x] GO 判定根拠（run id / SHA / createdAt / conclusion）記録済
- [x] drift findings 記録済（エスカレーション対象）
- [x] `workflow_state` は `spec_created` のまま継続（contract-ready 維持）
