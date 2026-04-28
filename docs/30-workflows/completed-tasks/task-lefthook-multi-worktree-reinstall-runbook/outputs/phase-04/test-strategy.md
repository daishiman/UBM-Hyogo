# Phase 4 成果物: テスト戦略 — runbook 文書の検証戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-28 |
| 上流参照 | `outputs/phase-01/main.md` / `outputs/phase-02/runbook-design.md` / `outputs/phase-03/main.md` |
| 下流参照 | `phase-05.md` / `phase-06.md` / `phase-07.md` / `phase-11.md` |
| タスク分類 | docs-only / runbook-spec |
| visualEvidence | NON_VISUAL |

## 1. 戦略サマリー

本タスクは docs-only / runbook-spec のため、本 Phase の「テスト戦略」は
**runbook 文書そのものの検証戦略** と位置づける。
コードの単体テストや E2E テストは本タスクでは実施しない。
代わりに、4 階層のテストレイヤを定義し、各階層の合否基準・副作用・並列禁止条項・
AC トレーサビリティ・成果物を固定する。

| 階層 | 名称 | 副作用 | 主目的 |
| --- | --- | --- | --- |
| 1 | dry-run（静的検証） | なし（読むだけ） | 文書品質と擬似スクリプト仕様の妥当性検証 |
| 2 | 単 worktree smoke | 当該 1 件の `node_modules/` と `.git/hooks/` 再生成（冪等） | ログ書式と PASS 判定の成立確認 |
| 3 | 全件 smoke（逐次） | 30+ worktree の `node_modules/` 再 install I/O | 集計表の充足と continue ポリシーの実証 |
| 4 | NON_VISUAL 代替 evidence | なし（成果物書き出しのみ） | screenshot 不要での監査可能性確保 |

## 2. NON_VISUAL 方針の確定

| 項目 | 取り扱い |
| --- | --- |
| Phase 11 visualEvidence | `NON_VISUAL`（`artifacts.json` と一致） |
| screenshot | **作成しない**。runbook の実行は CLI のみで完結し、UI を持たない |
| 一次代替 evidence | `outputs/phase-11/manual-smoke-log.md`（実行ログ表） |
| 二次代替 evidence | `outputs/phase-11/link-checklist.md`（内部リンク dead link 検証結果） |
| AC との接続 | AC-5（ログ書式）/ AC-9（苦戦箇所棚卸し）/ AC-10（Phase 12 出力 5 種）から参照される |

> Phase 11 では上記 2 ファイルが「screenshot の代替」として完成している必要がある。
> manual-smoke-log.md の書式は §6 で詳細化する。

## 3. 階層 1: dry-run（静的検証）

| 項目 | 仕様 |
| --- | --- |
| 目的 | runbook を実機で実行せず、文書品質と擬似スクリプト仕様の妥当性を検証する |
| 入力 | `outputs/phase-02/runbook-design.md` §5 の擬似スクリプト / `outputs/phase-05/runbook.md` の最終 runbook（後続 Phase で確定） |
| 検証手段 (a) | 擬似スクリプトを `bash -n` 相当で人間が読み下し、構文・変数展開・パイプ・`set -uo pipefail` の有無・`pushd`/`popd` の対称性を目視確認 |
| 検証手段 (b) | `git worktree list --porcelain` を本番ホストで一度だけ実行し、awk parse 結果のサンプル（path 一覧）が期待通り（prunable 除外・detached HEAD 包含）になるかを点検 |
| 検証手段 (c) | Phase 2 §3 の Mermaid 図と §5 擬似スクリプトのフローが一致していること（分岐ノード ↔ if 句が 1:1）を目視確認 |
| 合否基準 | 擬似スクリプトの全分岐（`PASS` / `FAIL` / `SKIP_NOT_FOUND` / `SKIP_PRUNABLE` / `OK_AFTER_REBUILD` / hygiene `OK` / `STALE` / `ABSENT`）が文書中に明示されていること |
| 副作用 | なし（読むだけ） |
| 実施タイミング | Phase 5 の runbook 確定直後（コード化前） |
| 成果物 | レビューコメントを `outputs/phase-09/main.md`（QA）に集約 |

## 4. 階層 2: 単一 worktree smoke

| 項目 | 仕様 |
| --- | --- |
| 目的 | 任意の 1 worktree（推奨: 現在の作業 worktree = `task-20260428-170623-wt-6`）で擬似スクリプト相当を手動実行し、ログ書式と PASS 判定が成立するかを確認する |
| 実行手順 (1) | `cd <wt>` |
| 実行手順 (2) | `mise exec -- pnpm install --prefer-offline` |
| 実行手順 (3) | `mise exec -- pnpm exec lefthook version`（exit code 0 と semver 出力を確認） |
| 実行手順 (4) | `head -n1 .git/hooks/post-merge` で sentinel `LEFTHOOK` の有無を判定し、hygiene 列を `OK` / `STALE` / `ABSENT` に正規化 |
| 実行手順 (5) | `outputs/phase-11/manual-smoke-log.md` に表 1 行を追記 |
| 合否基準 (a) | install が成功する（exit code 0） |
| 合否基準 (b) | `lefthook version` が semver を stdout に出力する |
| 合否基準 (c) | hygiene 列が `OK` / `STALE` / `ABSENT` のいずれかに収束する |
| 合否基準 (d) | ログ 1 行が §6 の表書式と完全一致する |
| 副作用 | 当該 worktree の `node_modules/` と `.git/hooks/*` が冪等に再生成される（既存と同一最終状態） |
| 並列実行 | 単一 worktree のため並列禁止条項は無関係 |
| 実施タイミング | Phase 11 の手動 smoke test 冒頭 |

## 5. 階層 3: 全件 smoke（逐次）

| 項目 | 仕様 |
| --- | --- |
| 目的 | `git worktree list --porcelain` から prunable 除外で抽出した全 worktree（30+ 件想定）を逐次処理し、集計表を埋める |
| 実行手順 | Phase 5 の擬似スクリプトを **逐次** 実行（並列禁止）。各 worktree につき 1 行ずつ `manual-smoke-log.md` に追記し、最後にサマリー行（PASS 件数 / FAIL 件数 / STALE 件数）を追記 |
| 合否基準 (a) | 全有効 worktree が 1 行ずつ記録されている（抽出件数 == ログ行数） |
| 合否基準 (b) | `install_status = FAIL` の件数が 0、または FAIL 件について Phase 6 異常系（pnpm store 競合 / detached HEAD / prunable / Apple Silicon bin rebuild 失敗）のいずれかに分類できる |
| 合否基準 (c) | `hygiene = STALE` が検出された場合、対象 path がログに記録され、手動対処指示が runbook 末尾（Phase 5 §「STALE 対処」）から参照されている |
| 合否基準 (d) | サマリー行に PASS / FAIL / SKIP / STALE の件数集計が出ている |
| 副作用 | 全 worktree の `node_modules/` 再 install による I/O 負荷。pnpm store キャッシュ温まり後は数十秒〜数分／件 |
| 並列禁止 | ADR-01（Phase 2 §7）に準拠。`xargs -P` / GNU parallel / バックグラウンド `&` は使用禁止。pnpm content-addressable store の同時書き込み破壊リスクのため |
| continue ポリシー | ADR-02 に準拠。1 件失敗で全体停止せず、次に進み、最後に集計（`set -uo pipefail` を採用、`set -e` は採用しない） |
| 実施タイミング | Phase 11 の手動 smoke test 本体 |
| 中断条件 | `git worktree list --porcelain` 自体が失敗した場合のみ fatal で中断（リポジトリ破損相当） |

## 6. 階層 4: NON_VISUAL 代替 evidence

### 6.1 成果物 2 種

| ファイル | 役割 | 必須 |
| --- | --- | --- |
| `outputs/phase-11/manual-smoke-log.md` | 実行ログ表（screenshot 代替の一次 evidence） | 必須 |
| `outputs/phase-11/link-checklist.md` | runbook 内部リンクの dead link 検証結果 | 必須 |

### 6.2 manual-smoke-log.md 書式定義

ヘッダ行は以下に **完全一致** させる（Phase 2 §4.5 と同一・ISO8601 UTC・M-01 対応）。

```markdown
# 一括再 install 実行ログ

| 実行日時 | worktree path | install result | lefthook version | hook hygiene | 備考 |
| --- | --- | --- | --- | --- | --- |
| 2026-04-28T10:00Z | /Users/dm/.../UBM-Hyogo | PASS | OK:1.6.10 | OK | - |
| 2026-04-28T10:01Z | /Users/dm/.../wt-1 | PASS | OK:1.6.10 | STALE | 旧 post-merge 残存・要削除 |
| 2026-04-28T10:02Z | /Users/dm/.../wt-2 | FAIL | - | - | pnpm install 失敗（Phase 6 §pnpm-store-conflict 参照） |
| 2026-04-28T10:03Z | /Users/dm/.../wt-3 | PASS | OK_AFTER_REBUILD:1.6.10 | OK | Apple Silicon rebuild 適用 |

## サマリー

- 抽出 worktree 件数: N
- install PASS: a / FAIL: b / SKIP_NOT_FOUND: c / SKIP_PRUNABLE: d
- lefthook version OK: e / OK_AFTER_REBUILD: f / FAIL: g
- hook hygiene OK: h / STALE: i / ABSENT: j
- STALE worktree 一覧（手動削除判断対象）:
  - <path>
```

### 6.3 カラム値の取りうる範囲

| カラム | 値 |
| --- | --- |
| 実行日時 | ISO8601 UTC（`YYYY-MM-DDThh:mmZ`） |
| worktree path | 絶対パス |
| install result | `PASS` / `FAIL` / `SKIP_NOT_FOUND` / `SKIP_PRUNABLE` |
| lefthook version | `OK:<semver>` / `OK_AFTER_REBUILD:<semver>` / `FAIL` / `-`（install FAIL 時） |
| hook hygiene | `OK` / `STALE` / `ABSENT` / `-`（install FAIL 時） |
| 備考 | 自由記述。FAIL 時は Phase 6 異常系 ID を引用する |

### 6.4 検証手段

| 手段 | 内容 |
| --- | --- |
| ヘッダ照合 | manual-smoke-log.md の表ヘッダ行が Phase 2 §4.5 / 本 Phase §6.2 と完全一致する |
| 行数照合 | データ行数 == 階層 3 で抽出した有効 worktree 件数 |
| サマリー整合 | サマリー集計値の合計が抽出件数と一致する |
| dead link 検証 | `link-checklist.md` で runbook 内部リンクが全て解決可能（dead link 0） |

### 6.5 合否基準

- 上記 2 ファイルが揃う
- ヘッダ・行数・サマリーが §6.4 を満たす
- Phase 7 AC マトリクスから AC-5 / AC-9 / AC-10 経由で参照可能

## 7. AC トレーサビリティ（AC-1〜AC-10）

| AC | 要旨 | カバー階層 | 検証ポイント |
| --- | --- | --- | --- |
| AC-1 | prunable 除外による有効 worktree 抽出手順 | 階層 1 / 階層 3 | dry-run で awk parse 仕様を読み下し / 全件 smoke 実行で抽出結果を確認 |
| AC-2 | 逐次 `pnpm install --prefer-offline` 手順と並列禁止理由 | 階層 1 / 階層 3 | dry-run で並列禁止条項の文書化を確認 / 全件 smoke を逐次で完走 |
| AC-3 | `lefthook version` の検証手順 | 階層 1 / 階層 2 / 階層 3 | dry-run / 単 smoke / 全件 smoke で `version` 列が記録される |
| AC-4 | 旧 hook 残存（`.git/hooks/post-merge` 等）の点検手順 | 階層 1 / 階層 3 | dry-run で sentinel 判定の文書化 / 全件 smoke で hygiene 列の充足 |
| AC-5 | 実行ログ書式の定義 | 階層 1 / 階層 2 / 階層 3 / 階層 4 | 全階層で manual-smoke-log.md の §6.2 書式に従う |
| AC-6 | `lefthook-operations.md` 差分追記の specify | 階層 1 | dry-run で Phase 2 §10 の差分仕様を文書として確認 |
| AC-7 | new-worktree.sh と本 runbook の責務境界明記 | 階層 1 | dry-run で Phase 2 §6 責務境界表を確認 |
| AC-8 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）PASS | 階層 1 | Phase 1 §4 条件評価表を Phase 10 GO/NO-GO で再確認 |
| AC-9 | 苦戦箇所 4 件以上（pnpm store 並列 / detached HEAD / prunable 除外 / Apple Silicon rebuild） | 階層 4 | NON_VISUAL evidence と Phase 6 / index.md §苦戦箇所棚卸しが整合 |
| AC-10 | Phase 12 で 5 種ファイル（`documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` 等）を全て出力 | 階層 4 | NON_VISUAL evidence の補強物として Phase 12 出力を Phase 7 マトリクスから参照 |

## 8. 階層と AC のマッピング（再掲・要約）

| 階層 | カバー AC |
| --- | --- |
| 1: dry-run | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8 |
| 2: 単 worktree smoke | AC-3, AC-5 |
| 3: 全件 smoke | AC-1, AC-2, AC-3, AC-4, AC-5 |
| 4: NON_VISUAL evidence | AC-5, AC-9, AC-10 |

> AC-1〜AC-7 は少なくとも 1 階層、AC-8 は dry-run と Phase 10、
> AC-9 / AC-10 は NON_VISUAL evidence で必ずカバーされる。

## 9. 並列禁止条項（Phase 5 / Phase 6 への引き渡し事項）

| 項目 | 内容 |
| --- | --- |
| 禁止対象 | `xargs -P` / GNU parallel / bash バックグラウンド `&` / `make -j` |
| 根拠 | pnpm content-addressable store の複数プロセス同時書き込みでハッシュ整合性が破壊される（ADR-01） |
| 唯一の許容形 | `while read -r wt; do ...; done` による逐次ループ |
| エラーハンドリング | `set -uo pipefail` を採用、`set -e` は採用しない（continue ポリシーのため） |
| 引き渡し先 | Phase 5 runbook 冒頭の注意喚起 / Phase 6 異常系 §pnpm-store-conflict |

## 10. 実行タスク（本 Phase の責務）

1. 4 階層の合否基準・副作用・並列禁止条項を本ファイル §3〜§6 に最終化する。【done】
2. AC-1〜AC-10 と階層のマッピング表を §7 / §8 に確定する。【done】
3. NON_VISUAL 方針を `artifacts.json` / Phase 11 仕様書と矛盾なく §2 / §6 に明記する。【done】
4. 並列禁止条項を Phase 5 / Phase 6 への引き渡し事項として §9 にまとめる。【done】
5. manual-smoke-log.md 書式を §6.2 に固定する。【done】

## 11. 完了条件

- 4 階層全てに合否基準・副作用・並列禁止（または無関係である旨）が明記されている
- NON_VISUAL であることと screenshot を作らないことが §2 / §6 に明示されている
- Phase 11 で生成する代替 evidence 2 ファイルが §6.1 / §6.2 で定義されている
- AC-1〜AC-10 全てが §7 / §8 で少なくとも 1 階層にマッピングされている
- 並列禁止条項が §9 で Phase 5 / Phase 6 へ明示的に引き渡されている

## 12. Phase 5 への引き渡し

- 単 worktree smoke の手順（§4）を Phase 5 runbook の「実行例」セクションで採用する
- 全件 smoke の合否基準（§5）を Phase 5 runbook 末尾の集計章と整合させる
- 並列禁止と continue ポリシー（§9）を Phase 5 runbook 冒頭の注意喚起に再掲する
- manual-smoke-log.md の書式（§6.2）を Phase 5 runbook の「ログ書式」章で完全一致させる

## 13. Phase 6 への引き渡し

- 階層 3 全件 smoke で `install_status = FAIL` が出た場合の分類先として、Phase 6 異常系に
  最低 4 種（pnpm store 競合 / detached HEAD / prunable 紛れ込み / Apple Silicon bin rebuild 失敗）
  を定義する必要がある
- 並列禁止条項（§9）の根拠を Phase 6 §pnpm-store-conflict で再記述する

## 14. Phase 7 / Phase 11 への引き渡し

- Phase 7 AC マトリクスは §7 のトレーサビリティ表を起点に作成する
- Phase 11 manual-smoke-log.md は §6.2 のヘッダ行と完全一致させる
- Phase 11 link-checklist.md は本 Phase で要件のみ提示し、検証実施は Phase 11 で行う
