# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 13 |
| status | blocked |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 13 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-13/main.md

## 完了条件

- [x] Phase 13 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

---

# Phase 13 — PR 作成

[実装区分: 実装仕様書]

## 状態

`pending_user_approval` — user の明示承認後にのみ commit / push / PR 作成を実行する。

## PR target

- base: `dev`（CLAUDE.md 既定）
- head: `feat/issue-295-tag-queue-race-smoke`（提案）

## title 案

```
feat(issue-295): add staging smoke for tag queue resolve race
```

## body 構成

```md
## 概要

Issue #295 / UT-07A-03。07a tag queue resolve workflow の `race_lost` 分岐を
staging 実 D1 で検証する smoke を追加する。

## 変更ファイル

- scripts/smoke/tag-queue-race.mjs（新規）
- scripts/smoke/__tests__/tag-queue-race.test.sh（新規）
- scripts/smoke/README.md（追記 / 新規）
- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/*（仕様書 14 ファイル）

## smoke 結果（evidence path）

- Local: `bash scripts/smoke/__tests__/tag-queue-race.test.sh` — pass
- Staging runtime: pending user/operator execution
- Pending evidence: `outputs/phase-11/<ISO-ts>/result.json`, `outputs/phase-11/<ISO-ts>/side-effects.json`, `outputs/phase-11/sql/before.txt`, `outputs/phase-11/sql/after.txt`

## AC マトリクス

| AC | 結果 | evidence |
| --- | --- | --- |
| AC-1 並行 POST 5 件 | runtime pending | result.json |
| AC-2 成功 1 件 | runtime pending | analysis.successes==1 |
| AC-3 敗者 409 race_lost | runtime pending | analysis.raceLosts>=1 / others==0 |
| AC-4 副作用なし | runtime pending | before/after.txt + side-effects.json |
| AC-5 evidence 保存 | runtime pending | outputs/phase-11/ |

## 不変条件

- #5（D1 直接アクセス禁止）: smoke は HTTP `/admin/tags/queue/:queueId/resolve` 経由のみ
- `*.test.{ts,tsx}` 禁止規約: 新規 test は `.test.sh`（shell）のみ

## 関連

- Refs #295
- 上流: 07a-parallel-tag-assignment-queue-resolve-workflow
```

## 実行手順（user 承認後のみ）

1. `git add scripts/smoke/tag-queue-race.mjs scripts/smoke/__tests__/tag-queue-race.test.sh scripts/smoke/README.md docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/`
2. `git commit -m "feat(issue-295): add staging smoke for tag queue resolve race"`
3. `git push -u origin feat/issue-295-tag-queue-race-smoke`
4. `gh pr create --base dev --title ... --body "$(cat ...)"`

## DoD

- PR が作成され URL が user に提示される
- CI required status check が pass する
- runtime pending のまま PR を出す場合は、PR body に pending evidence path と operator gate を記載する。runtime evidence 取得後は上記 AC 表を pass に差し替える。

## 成果物

- `outputs/phase-13/main.md`（実行は user 承認後）

## 次 Phase

- なし（最終 Phase）
