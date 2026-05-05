# Phase 2 成果物: ADR ドラフト本体（MADR 簡略形式）

> 本ファイルは Phase 5 で `docs/00-getting-started-manual/specs/adr/NNNN-pages-vs-workers-deploy-target.md` として正式起票するためのドラフト。Phase 3 ゲート完了後に Decision を実値化し、配置先を確定する。

---

# ADR-NNNN: apps/web deploy target (Cloudflare Pages vs Workers)

## Status

Historical draft superseded by ADR-0001 Accepted (2026-05-01)

> Phase 3 ゲート通過後 → `Accepted` に昇格。Phase 5 runbook 適用時に書き換え。

## Context

`apps/web` の Cloudflare deploy topology は 4 つの参照点に記述が分散しており、drift（互いに整合しない記述）が発生していた。

| 参照点 | 2026-05-01 時点の状態 | 形式 |
| --- | --- | --- |
| `CLAUDE.md` スタック表 | `Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare (apps/web)` | Workers |
| `apps/web/wrangler.toml` | `main = ".open-next/worker.js"` + `[assets] directory = ".open-next/assets" binding = "ASSETS"` | Workers（2026-04-29 → 05-01 で移行済） |
| `.github/workflows/web-cd.yml` | `command: pages deploy .next --project-name=...` （`wrangler-action@v3` 経由） | **Pages** |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` 判定表 | `current facts (UT-CICD-DRIFT / 2026-04-29)`: 「wrangler.toml は Pages 形式」 | **陳腐化** |

四者ねじれの状態は decision 不在に起因しており、本 ADR で deploy target を一意に固定する。

GitHub Issue #287 にて起票（CLOSED 維持）。Refs #287。

## Decision

**TBD（Phase 3 ゲートで確定）**

> 候補:
> - **案 X (cutover)**: Workers + `@opennextjs/cloudflare` を canonical deploy target として採用。`web-cd.yml` の `pages deploy` を `wrangler deploy --env <env>` に置換、判定表 current facts を Workers 形式へ更新、Cloudflare side Pages project → Workers script 切替を手動 runbook で実施
> - **案 Y (保留)**: Pages 形式維持。wrangler.toml を Pages 形式へロールバック、CLAUDE.md スタック表現を「Cloudflare Pages + Next.js」に修正、`@opennextjs/cloudflare` 採用方針を将来仕様に格下げ
> - **案 Z (段階移行)**: dev は Workers / production は Pages の環境別運用

Phase 2 比較マトリクス（`cutover-vs-hold-comparison.md`）の 18 セル評価で **案 X (cutover) が優位** と推定。Phase 3 ゲートで最終確定する。

## Consequences

### 即時影響（cutover 採択時）

- `apps/web/wrangler.toml`: 既に Workers 形式へ移行済み（追加変更なし）
- `.github/workflows/web-cd.yml`: `command: pages deploy .next --project-name=...` を `command: deploy --env staging` / `command: deploy --env production` 相当に置換（別タスク `task-impl-opennext-workers-migration-001` で実施）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`: 判定表「現状」列を Workers 形式へ更新、「将来」列の cutover 完了表記、「根拠リンク」列に本 ADR への参照を追加（本タスク Phase 12 で指示）
- `CLAUDE.md`: 既に Workers 表記のため変更なし

### 別タスク委譲事項（cutover 採択時）

| タスク | 委譲内容 |
| --- | --- |
| `task-impl-opennext-workers-migration-001` | `web-cd.yml` の `pages deploy` → `wrangler deploy` 切替、staging / production の deploy 検証 |
| 別タスク（手動 runbook） | Cloudflare ダッシュボード上の Pages project → Workers script 切替手順 |
| `UT-GOV-006-web-deploy-target-canonical-sync` | 本 ADR を canonical sync 対象 list に追加 |

### 不変条件 #5 維持（**必須**）

cutover 採択 / 保留 / 段階移行 のいずれを採っても、`apps/web/wrangler.toml` に `[[d1_databases]]` セクションを追加しないこと。`apps/web` から D1 へのアクセスは `apps/api` 経由のみ。Workers 形式に移行しても apps/web に D1 binding を直接書ける誘惑が発生する可能性があるが、**本 ADR が永続的な禁止根拠**となる。検証は Phase 4 検証コマンド #3 / Phase 9 / Phase 11 で実施。

### `@opennextjs/cloudflare` バージョン互換前提

- 現行版: `1.19.4`（`apps/web/package.json` L20）で実証済
- メジャーアップデート（2.x+）時の破壊的変更は ADR Consequences の継続前提として再評価対象（baseline 候補タスクで起票）

### 三者同期の必要性（cutover 採択時の重要注意）

ADR 採択 ≠ 実 cutover 完了。`wrangler.toml` / `web-cd.yml` / Cloudflare side（ダッシュボード上の Pages project / Workers script）の三者同期は別タスクで実施する。本 ADR は「決定」の正本のみを持つ。

### 保留採択時の追加コスト（参考）

保留を採る場合、wrangler.toml が既に Workers 形式に移行済のため、Pages 形式へのロールバック（`pages_build_output_dir = ".next"` の再追加 + `[assets]` セクション削除）+ CLAUDE.md スタック表現の修正 + `@opennextjs/cloudflare` 採用方針の将来仕様化が必要となる。「保留 = 何もしない」ではない。

## Alternatives Considered

| 案 | 概要 | 採否 | 理由 |
| --- | --- | --- | --- |
| 案 X (cutover) | Workers + `@opennextjs/cloudflare` を採用 | （Phase 3 で確定） | 既成事実 / CLAUDE.md と整合 / `@opennextjs/cloudflare` 採用方針整合 |
| 案 Y (保留) | Pages 形式維持 | （Phase 3 で確定） | wrangler.toml ロールバック追加コスト / CLAUDE.md 書き換え必要 / Workers 機能の将来採用余地制限 |
| 案 Z (段階移行) | dev = Workers / prod = Pages | （Phase 3 で確定） | 二重管理コスト / wrangler.toml 既移行のため意味薄 |

詳細比較は `cutover-vs-hold-comparison.md` 参照。

## 関連タスク責務分離

| タスク | 責務 | 本 ADR との関係 |
| --- | --- | --- |
| 本 ADR（UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION） | 決定根拠の正本 | source of truth |
| task-impl-opennext-workers-migration-001 | 実 cutover（コード差分） | 本 ADR を入力として後続実施。本 ADR が blocks |
| UT-GOV-006-web-deploy-target-canonical-sync | canonical document 1 本化 | 本 ADR を canonical sync 対象に追加。related |

3 タスクは責務分離（C-1 採択）。重複起票は禁止。

## Links

- GitHub Issue: #287（CLOSED 維持・参照のみ）— **Refs #287**（`Closes` 不可）
- 親タスク: UT-CICD-DRIFT（docs-only drift 解消完了）
- 関連タスク: `task-impl-opennext-workers-migration-001` / `UT-GOV-006-web-deploy-target-canonical-sync`
- Phase 1 既存差分前提表: `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/outputs/phase-01/main.md`
- 6 判断軸定義: `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/outputs/phase-02/decision-criteria.md`
- 比較マトリクス: `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/outputs/phase-02/cutover-vs-hold-comparison.md`

---

## ADR 配置先候補（Phase 3 軸 B で確定）

- 第一候補（B-1）: `docs/00-getting-started-manual/specs/adr/NNNN-pages-vs-workers-deploy-target.md`
  - 理由: specs 配下統一、新規 `adr/` ディレクトリ作成
- 第二候補（B-2）: 既存 ADR ディレクトリがあれば優先
  - `find docs -type d -iname '*adr*'` 実行結果: `docs/30-workflows/completed-tasks/task-husky-rejection-adr` のみ（タスク完了記録であり ADR 集約場所ではない）
  - → **B-1 採択推奨**

## 完了確認

- [x] MADR 簡略テンプレ全セクション存在（Status / Context / Decision / Consequences / Alternatives / Links）
- [x] Decision は Phase 3 確定の TBD プレースホルダ
- [x] 不変条件 #5 維持を Consequences に **必須**として明記
- [x] 関連タスク責務分離 3 列対比表
- [x] `@opennextjs/cloudflare` バージョン互換結果記載
- [x] `Refs #287` のみ（`Closes` 禁止）
- [x] ADR 配置先候補 2 件リスト化
