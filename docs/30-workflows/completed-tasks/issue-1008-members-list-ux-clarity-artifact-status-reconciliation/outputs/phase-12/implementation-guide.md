# Phase 12: 実装ガイド

## Part 1: これは何をするタスクか（やさしい説明）

### たとえ話

家のリフォーム工事が、もう全部終わっているとします。壁も塗り終わって、床も張り終わって、
写真も撮って「完成しました」という報告書まで作りました。ところが、工事の進み具合を書き込む
「記録ノート」のいちばん最初のページに、**「これから工事します（着工前）」というスタンプが
押されたまま**になっていました。実際はとっくに完成しているのに、ノートだけが「まだ始めてない」
状態のままなのです。

このタスクは、**その押し忘れていた「完了スタンプ」を、記録ノートに正しく押し直す作業**です。
工事そのもの（実際の家）には一切手を触れません。ノートの書き込みだけを、実際の状況に
合わせて直します。

### 何が起きていたのか

- `members-list-ux-clarity`（メンバー一覧の表示をわかりやすくする工事）は、コードも、
  画面の写真（24 枚）も、完了報告書（Phase 12 の 7 点セット）も、すべて揃って提出済みです。
- ところが、進捗を記録する `artifacts.json` というファイルだけが「`spec_created`（仕様書を
  作っただけ＝着工前）」のまま止まっていました。
- このズレを放っておくと、完了タスクの一覧表に「まだ終わってない工事」として表示され続け、
  後で誰かが確認するときに「あれ？終わってるのに終わってないことになってる」と混乱します。

### このタスクで触るもの・触らないもの

| 触るもの | 触らないもの |
|----------|--------------|
| 記録ノート（`artifacts.json` の status の文字）| 実際の家（`apps/` のアプリのコード）|
| チェックリストのチェック印（`☐` → `☑`）| 工事の写真（Phase 11 のスクリーンショット）|
| — | 完了報告書の中身（Phase 12 の文章）|

### いつ直すのか？

本サイクルで直します。コミット・push・PR はユーザー承認待ちですが、記録ノートそのもの
（`members-list-ux-clarity` の artifacts status 補正）は同じ実行サイクルで完了させます。

---

## Part 2: 技術者向け詳細

### 区分

| 項目 | 値 |
|------|-----|
| 実装区分 | ドキュメントのみ（CONST_004 例外）|
| 本 workflow の workflow_state | `implemented_local_evidence_captured`（補正実行と NON_VISUAL 検証まで完了）|
| 対象 workflow | `docs/30-workflows/completed-tasks/members-list-ux-clarity/` |
| `apps/` / `packages/` 変更 | **なし** |

### 補正対象 6 ファイル

| # | パス | 変更種別 |
|---|------|----------|
| 1 | `.../members-list-ux-clarity/artifacts.json` | status / phases / gates 補正 |
| 2 | `.../members-list-ux-clarity/outputs/artifacts.json` | root と byte parity 維持 |
| 3 | `.../tasks/task-a-density-toggle-ux-clarity/artifacts.json` | status / phases 正規化 |
| 4 | `.../tasks/task-b-member-filters-live-affordance/artifacts.json` | status / phases 補正 |
| 5 | `.../tasks/task-c-page-integration-and-visual-baseline/artifacts.json` | status / phases 補正 |
| 6 | `.../tasks/task-b-member-filters-live-affordance/phase-10-final-review.md` | AC checkbox 10 件 `☐`→`☑` |

### status フィールド一覧（補正対象キー）

| ファイル層 | フィールド | Before | After |
|------------|------------|--------|-------|
| root | `status` | `spec_created` | `implemented_local_runtime_pending` |
| root | `metadata.workflow_state` | `spec_created` | `implemented_local_runtime_pending` |
| root | `metadata.implementation_status` | `spec_created` | `implemented_local_runtime_pending` |
| root | `phases[1..12].status` | 一部 pending / 値混在 | `completed` |
| root | `phases[13].status` | pending | `pending`（user-gated 維持）|
| root | `metadata.gates[Gate-A].status` | (未整備) | `passed` |
| root | `metadata.gates[Gate-B].status` | (未整備) | `passed` |
| root | `metadata.gates[Gate-C].status` | pending | `pending`（staging visual baseline）|
| outputs | 全フィールド | root と同一 | root と byte 同期 |
| task-a/b/c | `metadata.workflow_state` | `spec_created` | `implemented_local_runtime_pending` |
| task-a/b/c | `phases[1..12].status` | 混在 | `completed` |
| task-a/b/c | `phases[13].status` | — | `pending` |
| task-b md | AC-B-1..AC-B-10 checkbox | `☐` | `☑` |

### `implemented_local_runtime_pending` 境界の定義

この状態は「ローカルでの実装・テスト・evidence・Phase 12 strict 7 がすべて完了しており、
残る作業は user-gated な runtime ops（staging deploy / staging visual baseline / commit /
push / PR）のみ」を意味する。`issue-976-admin-fetch-service-binding` 等の既存完了タスクと
同一規約である。

- Phase 1-12 = `completed`（成果物が物理的に実在）。
- Phase 13 = `pending`（commit / push / PR / staging visual baseline は user-gated）。
- Gate-A / Gate-B = `passed`（evidence path 実在）。
- Gate-C = `pending`（staging visual baseline が user-gated のため）。

### gate-metadata 規約（ISO8601 / evidence_path）

`metadata.gates[]` を `passed` に補正する際は以下を満たす（`gate-metadata:validate` が検査）。

- `status`: enum（`passed` / `pending` / `failed`）のいずれか。
- `passed_at`: `passed` の場合のみ ISO8601 offset 付きタイムスタンプ（例 `2026-05-30T00:00:00+09:00`）。`pending` の場合は `null`。
- `evidence_path`: 当該 gate の証跡を指す実在パス（Phase 12 strict 7 / Phase 11 ファイル）。`passed` 化は path 実在確認後にのみ行う。
- `approver`: `daishiman`。

### 検証コマンド（補正後に実行）

```bash
ROOT=docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json
OUT=docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json

# 1. root status
jq '.status, .metadata.workflow_state, .metadata.implementation_status' "$ROOT"
# 期待: 3 値とも "implemented_local_runtime_pending"

# 2. phase 1-12 status 正規化
jq '[.phases[] | select(.phase<=12) | .status] | unique' "$ROOT"
# 期待: ["completed"]

# 3. Phase 13 user-gated 維持
jq '.phases[] | select(.phase==13) | .status' "$ROOT"
# 期待: "pending"

# 4. parity
diff -u "$ROOT" "$OUT"
# 期待: 差分なし

# 5. gate-metadata
mise exec -- pnpm gate-metadata:validate
# 期待: members-list-ux-clarity artifacts ERROR 0

# 6. register 整合
rg 'members-list-ux-clarity' .claude/skills/aiworkflow-requirements
# 期待: implemented_local_runtime_pending と一致（drift 0）
```

### 不変条件（補正実行時に厳守）

1. `apps/` 配下のアプリケーションコードを一切変更しない。
2. `members-list-ux-clarity` の実装内容・evidence ファイルの中身は変更しない（status / checkbox のみ補正）。
3. `artifacts.json` の top-level / metadata の構造（キー）は維持し、値のみ補正する。新規キー追加・キー削除は行わない。
4. Phase 13 / Gate-C は `pending` を維持し user-gated 境界を侵さない。
5. issue #1008 は CLOSED のまま維持する。

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は
`outputs/phase-11/manual-test-result.md` に記載の 8 種の read-only 自動検証
（jq status 検証 / `diff -u` parity / `gate-metadata:validate` / `rg` register 整合）である。
