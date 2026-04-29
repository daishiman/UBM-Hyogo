# Phase 4 — テスト設計（main）

## Status

spec_created

## 0. 上位原則（Phase 1 §0 の継承）

trusted context（base リポの secrets / write 権限を持つ実行コンテキスト）では untrusted PR code を checkout / install / build / eval しない。

本 Phase は、この原則を **dry-run シナリオマトリクス** と **静的検査チェックリスト** に落とし込み、後続実装タスクが証跡を埋められる仕様レベルの土台を確立する。

## 1. 入力の継承

本 Phase は以下を入力として継承する（verification-report の consistency warning 解消のため明示）。

| 入力パス | 用途 |
| --- | --- |
| `outputs/phase-1/main.md` | 真の論点 (a)〜(d)、リスク R-1〜R-3、命名 canonical |
| `outputs/phase-2/design.md` | 責務分離設計（triage / untrusted build）、`pwn request` 非該当 5 箇条、AC マッピング |
| `outputs/phase-3/review.md` | NO-GO 条件 N-1〜N-3、security 観点 S-1〜S-5、用語整合チェック |
| `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md` §6 | 親タスク safety gate 草案（YAML 母本） |
| `index.md` | 受入条件 AC-1〜AC-9 |

## 2. 成果物

- `outputs/phase-4/main.md`（本書）
- `outputs/phase-4/test-matrix.md`（dry-run シナリオ T-1〜T-5、静的検査、動的検査、失敗判定基準 F-1〜F-4、証跡命名規約）

## 3. テスト設計の方針

| 観点 | 方針 |
| --- | --- |
| **シナリオ網羅** | same-repo PR / fork PR / fork PR triage（pull_request_target）/ labeled trigger / scheduled・re-run の 5 系統を T-1〜T-5 として固定 |
| **検査次元** | (a) trigger event type、(b) actor（maintainer / fork contributor / bot）、(c) checkout ref、(d) `permissions:` の workflow / job 値、(e) secrets 参照の有無、(f) 期待結果、(g) 証跡パス |
| **静的検査** | actionlint / yq / grep の 3 系統を仕様化。`pull_request_target` 内の checkout、`persist-credentials`、`permissions:`、`head.*` の script eval を機械検査 |
| **動的検査** | fork PR を起こして `gh run view --log` で secrets / token 露出をコマンド grep で確認する手順を仕様レベルで記述（実走は別 PR） |
| **失敗判定** | F-1〜F-4 を MAJOR とし、Phase 9 quality-gate の MAJOR 0 件条件に直結 |

## 4. AC トレーサビリティ

| AC | T シナリオ | 静的 / 動的検査 | 担保箇所 |
| --- | --- | --- | --- |
| AC-1: `pull_request_target` 内に PR head の checkout / code execution が **置かれていない** | T-3 / T-4 | grep `head\.\(ref\|sha\)` / actionlint / yq | test-matrix.md §2 / §3.2 |
| AC-2: untrusted build は `pull_request` に分離、`contents: read` のみ | T-1 / T-2 | yq `.jobs.*.permissions` | test-matrix.md §2 |
| AC-3: fork PR シナリオで token / secret 露出ゼロの設計証跡 | T-2 / T-3 / T-4 / T-5 | dynamic 手順仕様（実走は後続 UT-GOV-002-IMPL で `gh run view --log` grep） | test-matrix.md §4 |
| AC-4: "pwn request" 非該当 | 全 T | 静的＋動的の合成 | test-matrix.md §6（review.md §3 と相互参照） |
| AC-5: `permissions: {}` ＋ `persist-credentials: false` | 全 T | yq / grep | test-matrix.md §3 |
| AC-6: 親タスク Phase 2 §6 草案を input 継承 | — | 入力欄に明示 | 本書 §1 |
| AC-7: docs-only / NON_VISUAL 固定 | — | metadata 整合 | 本書冒頭 Status |
| AC-8: dry-run 実走は本タスク非対象 | 全 T（仕様化のみ） | — | test-matrix.md §4 注記 |
| AC-9: ロールバック設計（単一 revert コミット） | T-5（再実行で副作用ゼロ） | — | runbook.md（Phase 5）と相互参照 |

## 5. 完了条件チェック（Phase 4）

- [x] dry-run マトリクス T-1〜T-5 が test-matrix.md に表形式で記述されている。
- [x] 静的検査コマンド（actionlint / yq / grep）が test-matrix.md に列挙されている。
- [x] 動的検査の手順が仕様レベルで定義されている（実走は別 PR）。
- [x] 失敗判定基準 F-1〜F-4 が MAJOR として固定されている。
- [x] 証跡命名規約（`outputs/phase-N/...`）が記述されている。
- [x] 本書が Phase 1/2/3 出力への参照を含む。

## 6. 次 Phase への引き継ぎ

Phase 5（実装ランブック）は本書および test-matrix.md を入力として、`outputs/phase-5/runbook.md` に Step 1〜6 と red lines / ロールバック手順を確定する。
