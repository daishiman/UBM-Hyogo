# 06a-followup-001-public-web-real-workers-d1-smoke Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | 06a-followup-001-public-web-real-workers-d1-smoke |
| タスク種別 | implementation / NON_VISUAL（curl evidence 主体・staging screenshot は補助） |
| ワークフロー | spec_created / Phase 1-13 仕様書揃 / Phase 11 実 smoke + Phase 13 PR は user approval 後 |
| canonical task root | `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/` |
| 元 unassigned task（昇格 trace） | `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md` |
| 親タスク | `docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/` |
| GitHub Issue | #273（CLOSED 維持・`Refs #273` のみ・再オープン禁止） |
| Wave | 6 (followup) |
| 作成日 | 2026-04-30 |
| 同期日 | 2026-04-30 |
| owner | qa-tests / infra-runbook |
| domain | public_web_real_workers_d1_smoke |
| depends_on | 06a-parallel-public-landing-directory-and-registration-pages / 04a-parallel-public-api-endpoints / 02b-parallel-d1-schema-and-migrations |

## Acceptance Criteria

詳細は `outputs/phase-07/ac-matrix.md`（AC-1 〜 AC-7）を正本とする。要点:
- AC-1: `bash scripts/cf.sh` 経由で `apps/api` を local dev 起動でき、esbuild Host/Binary version mismatch（`0.27.3` vs `0.21.5`）が再現しない
- AC-2: local 環境で `PUBLIC_API_BASE_URL=http://localhost:8787` 配下、4 route family / 5 smoke cases に対し `200 / 200 / 200 / 404 / 200` を観測
- AC-3: local smoke が mock ではなく実 D1 binding 経由であることを `GET /public/members` `items.length >= 1` と `/members/{seeded-id}` の `200` で示す
- AC-4: staging で同 5 smoke cases を観測（deployed worker vars が正本）
- AC-5: staging 側 `PUBLIC_API_BASE_URL` が `apps/api` staging URL を指し、localhost fallback していないことを deployed vars で確認
- AC-6: 06a 親タスクには本 followup evidence index への相対リンクのみ追記（実体ファイルは followup 側保持）
- AC-7: 不変条件 #5（apps/web → D1 直接アクセス禁止）を smoke 経路と `rg "D1Database|env\.DB"` 0 件で再確認

## Phase Outputs

| Phase | 場所 | 主要成果物 |
|---|---|---|
| 1 | `outputs/phase-01/` | 要件定義 / AC-1〜7 確定 / 不変条件 trace |
| 2 | `outputs/phase-02/` | 設計 / `d1-binding-flow.mmd` |
| 3 | `outputs/phase-03/` | 設計レビュー |
| 4 | `outputs/phase-04/` | テスト戦略 / `curl-matrix.md` |
| 5 | `outputs/phase-05/` | 実装ランブック / `runbook.md`（local + staging） |
| 6 | `outputs/phase-06/` | 異常系検証（`/members/UNKNOWN` 404 等） |
| 7 | `outputs/phase-07/` | ac-matrix.md |
| 8 | `outputs/phase-08/` | DRY 化評価 |
| 9 | `outputs/phase-09/` | 品質保証 |
| 10 | `outputs/phase-10/` | 最終レビュー |
| 11 | `outputs/phase-11/` | 手動 smoke / planned evidence: `local-curl.log` / `staging-curl.log` / `staging-screenshot.png`（実体は smoke 実行後） |
| 12 | `outputs/phase-12/` | main / implementation-guide / documentation-changelog / system-spec-update-summary / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check（7 件揃） |
| 13 | `outputs/phase-13/` | local-check-result / change-summary / pr-template / pr-info / pr-creation-result（PR 作成は user approval 後） |

## 主要実装物（spec_created 段階の planned outputs）

| 種別 | 対象 | 役割 |
|---|---|---|
| runbook | `bash scripts/cf.sh dev --config apps/api/wrangler.toml` | wrangler 起動の唯一経路。`ESBUILD_BINARY_PATH` で Host/Binary mismatch 回避 |
| smoke | `apps/web -> apps/api -> D1` 経路 4 route family | `/`, `/members`, `/members/[id]`, `/register` の curl 観測 |
| evidence | `outputs/phase-11/evidence/` | `local-curl.log`, `staging-curl.log`, `staging-screenshot.png`（planned） |
| trace | 親 06a `outputs/phase-11/` または `phase-13` への相対リンク | follow-up evidence への参照のみ。本体は followup 側保持 |
| 不変条件 | #1, #5, #6 | privacy boundary / API-only D1 / non-promote GAS prototype |

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/SKILL.md` | Version Log: `v2026.04.30-06a-followup-real-workers-d1-smoke` エントリ |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 「06a Public Web Real Workers/D1 Smoke（2026-04-30）」セクション |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set 行（`completed-tasks/` 配下パスで） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | workflow inventory 行 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-06a-public-web-2026-04.md` | L-06A-005（esbuild `0.27.3` vs `0.21.5` mismatch / `scripts/cf.sh` `ESBUILD_BINARY_PATH` 解決経路）に既記載 |

> 実 smoke 後の後続 PR で反映予定: `references/deployment-cloudflare.md` / `references/deployment-runbook.md` / `08-free-database.md` 系の D1 binding smoke runbook 章。

## 苦戦箇所（lessons reference）

`scripts/cf.sh` 経由を恒久ルールとして CLAUDE.md / `.claude/skills/aiworkflow-requirements/SKILL.md` Version Log に固定済み。直近の苦戦詳細は `references/lessons-learned-06a-public-web-2026-04.md` の L-06A-005 を参照。

| 苦戦 | 原因 | 解決策（恒久） |
|---|---|---|
| `pnpm --filter @ubm-hyogo/api dev` が `Cannot start service: Host version "0.27.3" does not match binary version "0.21.5"` で失敗 | グローバル esbuild と pnpm 配置 esbuild の version 不一致 | `bash scripts/cf.sh` 経由で `ESBUILD_BINARY_PATH` 自動設定 |
| mock API smoke では Workers runtime / D1 binding / `PUBLIC_API_BASE_URL` の経路問題を検出できない | 06a Phase 11 が mock smoke で PASS した盲点 | 本 followup を立て、real Workers + real D1 binding の二段 smoke を分離 |
| staging で `PUBLIC_API_BASE_URL` 未設定だと web が localhost:8787 へ向く | `apps/web/wrangler.toml` 未定義 + Cloudflare deployed vars 未設定 | deployed vars を正本とし AC-5 で確認、未設定なら Phase 11 NO-GO |

## Follow-up 未タスク

`outputs/phase-12/unassigned-task-detection.md` 0 件。実 smoke 実行後の Phase 11 close-out wave で `lessons-learned-06a-followup-001-real-workers-d1-smoke-2026-XX.md` 等の新規 lessons / runbook 反映タスクが立つ可能性あり（spec_created 段階では未起票）。

## Validation Chain

| 検証項目 | 結果 |
|---|---|
| Phase 1-13 ファイル揃え | PASS（`phase-01.md`〜`phase-13.md` + `outputs/phase-01`〜`phase-13/` ディレクトリ） |
| `outputs/phase-12/` 必須 7 ファイル | PASS（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check） |
| root `artifacts.json` と `outputs/artifacts.json` parity | PASS（diff 0 / `task_path` は `completed-tasks/` 配下） |
| 元 unassigned task の昇格 trace | PASS（`completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md` に rename + 「昇格済み」記載） |
| 各 phase ファイル 500 行以内 | PASS |
| Phase 11 実 evidence | PENDING（planned outputs として metadata 明記、実 smoke は user approval 後） |
| Phase 13（PR 作成） | PENDING（user approval 待ち） |
