# Phase 8 成果物: 重複削減マップ + 同 wave 更新ファイル一覧

## 重複記述削減マップ（5 項目）

| 重複対象 | 旧状態（drift 前） | DRY 化後 |
| --- | --- | --- |
| 「Pages から Workers 移行の検討経緯」 | judgment table と CLAUDE.md notes に分散の可能性 | ADR Context のみ。他は「→ ADR 参照」リンク |
| 「`@opennextjs/cloudflare` 採用理由」 | CLAUDE.md スタック表注記 + judgment table 双方 | ADR Decision のみ。CLAUDE.md は 1 行表記維持 |
| 「不変条件 #5 維持の理由」 | 本 index.md / phase-01.md / phase-03.md / ADR Consequences の 4 箇所 | ADR Consequences が正本。他はリンクのみ |
| 「関連タスク 2 件との責務分離」 | 本 index.md / phase-03.md / ADR Related の 3 箇所 | ADR Related が正本。本タスク仕様書は「→ ADR Related 参照」 |
| 「base case 採択根拠」 | phase-02.md / phase-03.md / ADR Decision の 3 箇所 | ADR Decision が正本。Phase 仕様書は「Phase 3 で確定 → ADR 参照」 |

## 関連タスク責務分離記述の整合確認

| 記述場所 | 内容 | DRY 化後の状態 |
| --- | --- | --- |
| 本タスク index.md | 関連タスクテーブル（migration-001 / UT-GOV-006）| 「責務 / 依存関係（blocks / related）」のみ。詳細は ADR Related |
| phase-03.md 軸 C | C-1 採択結果（分離） | 「Phase 3 で C-1 採択 → ADR Related 反映」と末尾 1 行で要約 |
| ADR Related | 責務分離表（本 ADR / migration-001 / UT-GOV-006 の 3 行） | **完全記述（source of truth）** |
| migration-001 起票文書 | 本 ADR への参照 + 実 cutover スコープ | 「Refs ADR-0001」のみ |
| UT-GOV-006 起票文書 | 本 ADR を canonical sync 対象に追加 | 「ADR-0001 を sync 対象 list に追加」のみ |

## 同 wave 更新ファイル一覧（Phase 12 Step 1-A 必須前提 [FB-04]）

| # | ファイル | 更新内容 | 必須 |
| --- | --- | --- | --- |
| 1 | `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`（新規） | ADR 本文（Phase 5 runbook 適用） | ✅ |
| 2 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 判定表「現状 / 将来 / 根拠リンク / 更新日」 | ✅ |
| 3 | `CLAUDE.md` | cutover 採択のため変更不要（任意脚注追加可） | optional |
| 4 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/index.md` | Phase 一覧 status 更新 | ✅ |
| 5 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/artifacts.json` | `phases[*].status` 同期 + workflow_state | ✅ |
| 6 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/outputs/artifacts.json`（生成時） | task root artifacts.json と parity | ✅ |
| 7 | `.claude/skills/aiworkflow-requirements/LOGS.md` | Phase 12 close-out 記録 | ✅ |
| 8 | `.claude/skills/task-specification-creator/LOGS.md` | Phase 12 close-out 記録 | ✅ |

> **[FB-04] 5 点同期チェック**: Step 1-A 開始時に backlog ledger / completed ledger / lane index / workflow artifacts / skill artifacts の 5 点突合を実施。

## DRY 化観点

- **DRY ≠ 削除**: 各ファイルの **役割**は残しつつ「決定根拠」のみ ADR に集約。判定表自体は削らない
- **責務侵食ゼロ**: 関連タスク 2 件の起票文書を本 Phase で書き換える指示を含めない（別タスクの責務）
- **同 wave 強制**: Phase 12 Step 1-A で 8 ファイル同期を **個別 wave 不可**として固定
- **`wrangler.toml` 冒頭コメント**: コード変更ではないがコメント 1 行追加（「→ ADR-0001 参照」）を Phase 12 cutover stub に含める（任意）

## 完了確認

- [x] 重複削減マップ 5 項目
- [x] 関連タスク責務分離整合表 5 ファイル分
- [x] 同 wave 更新ファイル 8 件
- [x] [FB-04] 5 点同期チェック紐付け
- [x] DRY 化観点 4 点
