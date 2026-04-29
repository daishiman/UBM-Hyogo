# Phase 8 Main — DRY 化 / 重複解消（仕様書・正本ベース）

正本: `../../phase-08.md`

本書は Phase 1〜7 outputs（`outputs/phase-01/main.md` 〜 `outputs/phase-07/ac-matrix.md`）および参照 5 文書（legacy umbrella / 03a / 03b / 04c / 09b）/ 旧 UT-09 root / Sheets 系 spec（ut-21）を横断し、**仕様書 / 正本（spec）の重複記述** を棚卸しして DRY 化方針を確定する。コード DRY / migration 撤回は **本タスクのスコープ外**（docs-only 境界）。

採用結論表記は「**案 a (採用 A / Forms 分割方針へ寄せる)**」で全 Phase 統一。

## 1. DRY 化の基本原則

| 原則 | 内容 |
| --- | --- |
| 単一正本原則 | 同一概念の説明は **1 ファイルに集約**し、他 Phase は相対リンク参照のみ |
| 派生表現禁止 | 正本記述を他 Phase に **コピー＆要約しない**（drift 源を排除） |
| 参照リンク必須 | 参照側は `../phase-XX.md#section-anchor` 形式で正本へ誘導 |
| docs-only 境界 | 削除対象 = 「reconciliation 結論として撤回する正本記述」であり、**実 PR は別タスク** |
| 同期チェック前置 | Phase 9 の 5 点同期チェックは本 Phase の正本固定後に実行（drift 0 が前提） |

## 2. 重複箇所一覧（Phase 1〜7 横断）

| # | 重複記述（概念） | 出現 Phase / 文書 | 採用方針 | DRY 化処理 |
| --- | --- | --- | --- | --- |
| 1 | 撤回対象リスト（旧 UT-09 root / ut-21 / Sheets 系 secret） | phase-01 / phase-02 / phase-03 / phase-08 重複候補表 / phase-10 GO/NO-GO | 案 a で Sheets 系撤回 | **正本 = phase-02**。他 Phase は phase-02 へリンク |
| 2 | Secret 差分表（Forms 系正本 vs Sheets 系廃止候補） | phase-01 / phase-02 / phase-08 / aiworkflow-requirements references | 案 a で Forms 系正本 | **正本 = phase-02**（reconciliation-design.md）。phase-08 は概要表のみで詳細は phase-02 参照 |
| 3 | 5 文書同期チェック（legacy umbrella / 03a / 03b / 04c / 09b） | phase-02 / phase-04 / phase-09 / phase-10 / phase-12 | 全 Phase 共通 | **正本 = phase-02**（順序固定）。phase-09 は実行チェックリストのみ保持 |
| 4 | 採用方針 4 条件（価値性 / 実現性 / 整合性 / 運用性） | phase-01 / phase-02 / phase-03 / phase-07 | 順序固定 | **正本 = phase-02**（option-comparison.md）。他 Phase は結論のみ参照 |
| 5 | AC-1〜AC-14 文言 | phase-01 / phase-07 / index.md | 完全一致 | **正本 = index.md**。phase-07 は AC マトリクスとして展開のみ |
| 6 | sync ledger 表記（`sync_jobs` 単一） | phase-02 / phase-04 / phase-08 / database-schema.md | 案 a で `sync_jobs` 単一 | **正本 = `.claude/skills/aiworkflow-requirements/references/database-schema.md`**。Phase 出力は参照のみ |
| 7 | admin endpoint 表記（`/admin/sync/schema` + `/admin/sync/responses`） | phase-02 / phase-04 / phase-08 / api-endpoints.md / 04c | 案 a で 2 endpoint | **正本 = `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`**。Phase 出力は参照のみ |
| 8 | Cron schedule 前提（Forms 2 経路） | phase-02 / phase-05 / phase-08 / 09b runbook | 案 a で Forms 2 経路 | **正本 = 09b runbook (`docs/30-workflows/09b-.../index.md`)**。Phase 出力は引用しない |
| 9 | D1 contention mitigation 5 知見（WAL 非前提 / retry / short tx / batch-size / lock） | phase-02 / phase-04 / phase-06 / phase-08 共通項表 | 全方針共通 | **正本 = phase-02**（共通項節）。phase-06 / phase-08 は移植先指定のみ |
| 10 | trigger 種別語彙（`'cron' / 'manual' / 'backfill'`） | phase-02 / phase-04 / phase-07 / phase-08 | 採用方針共通 | **正本 = phase-02**。他 Phase は語彙参照のみ |
| 11 | staging smoke 表記（pending / PASS / FAIL） | phase-03 / phase-04 / phase-08 / phase-12 | 3 値固定 | **正本 = phase-03**（運用ルール節）。他 Phase は参照のみ |
| 12 | 1Password 参照表記（`op://Employee/ubm-hyogo-env/<FIELD>`） | phase-02 / phase-08 / aiworkflow-requirements references | 形式統一 | **正本 = `.claude/skills/aiworkflow-requirements/references/environment-variables.md`** |
| 13 | unrelated 削除を本 PR に混ぜない運用ルール | phase-03 / phase-08 / phase-10 | 全 reconciliation 共通 | **正本 = phase-03**。他 Phase は参照のみ |

## 3. 正本指定（最終マッチ）

| 概念領域 | 正本 path | 派生（参照のみ許可） |
| --- | --- | --- |
| 撤回対象リスト / Secret 差分 / 5 文書同期 / 4 条件 / D1 5 知見 / trigger 語彙 | `outputs/phase-02/reconciliation-design.md` | phase-01 / phase-03 / phase-04 / phase-08 / phase-09 / phase-10 / phase-12 |
| AC-1〜AC-14 文言 | `index.md` | phase-01 / phase-07 |
| sync ledger（`sync_jobs` 単一） | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | phase-02 / phase-04 / phase-08 |
| admin endpoint（2 endpoint） | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | phase-02 / phase-04 / phase-08 / 04c index |
| Secret 名規約（Forms 系正本） | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` / `deployment-cloudflare.md` | phase-02 / phase-08 |
| Cron schedule（Forms 2 経路） | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | phase-02 / phase-05 / phase-08 |
| staging smoke 3 値 / unrelated 削除運用ルール | `outputs/phase-03/main.md` | phase-04 / phase-08 / phase-10 / phase-12 |

## 4. 参照ルール

| 状況 | 記述方法 | 例 |
| --- | --- | --- |
| 同 reconciliation 内の Phase 出力参照 | 相対パス + アンカー | `../phase-02/reconciliation-design.md#secret-差分表` |
| 同 reconciliation 内の Phase 仕様参照 | 相対パス | `../../phase-02.md` |
| skill reference 参照 | リポジトリ root からの相対 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` |
| 他 workflow（03a / 03b / 04c / 09b / legacy umbrella）参照 | `docs/30-workflows/...` 起点の絶対 | `docs/30-workflows/02-application-implementation/03a-.../index.md` |
| 不変条件（CLAUDE.md #1〜#7） | CLAUDE.md 番号で引用 | 「不変条件 #5（D1 access は apps/api 内）」 |
| 採用結論の初出 | 「案 a (採用 A / Forms 分割方針へ寄せる)」フル表記 | 各 Phase 冒頭で 1 回 |
| 採用結論の再出 | 「案 a」短縮表記 | 同 Phase 内 2 回目以降 |
| 撤回対象 / Secret 差分の **詳細記述** | **禁止**（リンクのみ） | phase-08 は概要表のみで詳細は phase-02 参照 |

## 5. 同期ポリシー（drift 防止）

| 軸 | 同期トリガ | 同期先 | 検証方法 |
| --- | --- | --- | --- |
| 採用結論変更 | phase-02 reconciliation-design.md 更新 | 全 Phase 出力 + index.md + artifacts.json | Phase 9 の 5 点同期チェック |
| AC 文言変更 | index.md 更新 | phase-01 / phase-07 | `diff` による文言完全一致確認 |
| ledger / endpoint / Secret 変更 | aiworkflow-requirements references 更新 | phase-02 / phase-04 / phase-08 の参照リンク | `rg` で path drift 0 を確認 |
| Cron schedule 変更 | 09b runbook 更新 | phase-02 / phase-05 言及箇所 | リンク先実在 + 引用なし確認 |
| 5 文書同期対象順序 | phase-02 で順序固定 | phase-04 / phase-09 / phase-10 / phase-12 | 列挙順 grep で完全一致 |
| navigation drift（リンク切れ / path mismatch） | 任意の path 変更時 | artifacts.json `phases[*].outputs` × 実 path | `ls` 照合 + 相対リンク辿り |
| docs-only 境界（実コード撤回混入） | 全 Phase 出力レビュー時 | phase-01〜13 全文 | `rg 'migration|drop table|route.*delete'` で誤混入検出 |

## 6. docs-only 境界の再確認

- 本 Phase で「削除対象」と記載した正本記述は、**reconciliation 結論として撤回する論理的対象**であり、本タスクで実ファイルから削除する範囲ではない。
- 実 migration 撤回 PR / route 撤回 PR / Secret 廃止 PR は、Phase 3 open question #1 / #4 の引き継ぎとして **別タスク** で実施する。
- 共通項 8 件（D1 contention mitigation 5 知見 + trigger 語彙 + staging smoke 3 値 + unrelated 削除運用ルール）の **実コード移植** も別タスク。
- 本 Phase の成果物は本ファイル 1 点のみ（仕様書 DRY 方針の文書化）。

## 7. Phase 9 への引き渡し前提

- 正本指定（節 3）が確定し、Phase 9 の 5 点同期チェックは本指定を基準に実行する。
- 参照ルール（節 4）違反（コピー記述 / 詳細の二重化）が検出された場合、Phase 9 で drift として fail させる。
- 同期ポリシー（節 5）の 7 軸を Phase 9 / Phase 10 / Phase 12 で繰り返し検証する。
- docs-only 境界（節 6）が破られた場合（実コード撤回が混入）は Phase 10 で NO-GO とする。

状態: spec_created
