# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-28 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| タスク分類 | docs-only / runbook-spec |
| visualEvidence | NON_VISUAL |

## 目的

本タスクは docs-only / runbook-spec であり、実コードを生成しない。よって本 Phase の「テスト戦略」は **runbook 文書そのものの検証戦略** と位置づける。具体的には、(a) runbook を実機で動かさずに静的検証する dry-run 階層、(b) 単一 worktree で擬似スクリプトを動作確認する smoke 階層、(c) 30+ worktree 全件に対して逐次実行する全件 smoke 階層、(d) NON_VISUAL タスクとして screenshot を作成しない代替 evidence 階層、の 4 階層を定義し、各階層の合否基準と Phase 11 への引き渡し成果物を固定する。

## NON_VISUAL 方針の明示

| 項目 | 取り扱い |
| --- | --- |
| Phase 11 visualEvidence | `NON_VISUAL`（artifacts.json と一致） |
| screenshot | **作成しない**。runbook の実行が CLI のみで完結するため、UI を持たない |
| 代替 evidence | `outputs/phase-11/manual-smoke-log.md` に Markdown 表形式で実行ログを記録する |
| 二次 evidence | `outputs/phase-11/link-checklist.md` に内部リンクの dead link 検証結果を記録する |

> Phase 11 の手動 smoke test では、上記 2 ファイルが「screenshot の代替」として完成している必要がある。

## 4 階層テスト戦略

### 階層 1: dry-run（静的検証）

| 項目 | 仕様 |
| --- | --- |
| 目的 | runbook を実機で実行せず、文書品質と擬似スクリプト仕様の妥当性を検証する |
| 入力 | `phase-02.md` の擬似スクリプト / `phase-05.md` の最終 runbook |
| 検証手段 | (a) 擬似スクリプトを `bash -n` 相当で人間が読み下し、構文・変数展開・パイプを目視確認 / (b) `git worktree list --porcelain` を本番ホストで一度だけ実行し、parse 結果のサンプルが期待通りになるかを点検 / (c) Mermaid 図と擬似スクリプトのフロー一致を確認 |
| 合否基準 | 擬似スクリプトの全分岐（PASS / FAIL / SKIP_NOT_FOUND / OK_AFTER_REBUILD / hygiene STALE / ABSENT）が文書中に記載されていること |
| 副作用 | なし（読むだけ） |

### 階層 2: 単一 worktree smoke

| 項目 | 仕様 |
| --- | --- |
| 目的 | 任意の 1 worktree（推奨: 現在の作業 worktree）で擬似スクリプト相当を手動実行し、ログ書式と PASS 判定が成立するかを確認する |
| 実行手順 | (1) `cd <wt>` → (2) `mise exec -- pnpm install --prefer-offline` → (3) `mise exec -- pnpm exec lefthook version` → (4) `.git/hooks/post-merge` の sentinel 判定 → (5) `outputs/phase-11/manual-smoke-log.md` に 1 行追記 |
| 合否基準 | install 成功 / lefthook version semver 出力 / hygiene 列が `OK` `STALE` `ABSENT` のいずれかに収束 / ログ 1 行が表形式で正しく書ける |
| 副作用 | 当該 worktree の `node_modules/` と `.git/hooks/` が冪等に再生成される（既存と同一最終状態） |

### 階層 3: 全件 smoke（逐次）

| 項目 | 仕様 |
| --- | --- |
| 目的 | `git worktree list --porcelain` から prunable 除外で抽出した全 worktree（30+ 件想定）を逐次処理し、集計表を埋める |
| 実行手順 | Phase 5 の擬似スクリプトを逐次実行（並列禁止）。各 worktree につき 1 行ずつ `manual-smoke-log.md` に追記。最後にサマリー行を追記 |
| 合否基準 | (a) 全有効 worktree が 1 行ずつ記録されている / (b) `install_status = FAIL` の件数が 0、または FAIL 件について Phase 6 異常系のいずれかに分類できる / (c) `hygiene = STALE` が検出された場合、対象 path が記録され手動対処指示が runbook 末尾で参照されている |
| 副作用 | 全 worktree の `node_modules/` 再 install による I/O 負荷。store キャッシュ温まり後は数十秒〜数分／件 |
| 並列禁止 | ADR-01 に準拠。`xargs -P` / GNU parallel / バックグラウンド `&` は使用禁止 |

### 階層 4: NON_VISUAL 代替 evidence

| 項目 | 仕様 |
| --- | --- |
| 目的 | screenshot を作らない代わりに、Phase 11 で監査可能なテキスト証跡を完成させる |
| 成果物 | `outputs/phase-11/manual-smoke-log.md`（実行ログ表）/ `outputs/phase-11/link-checklist.md`（内部リンク検証） |
| 検証手段 | ログ表のヘッダ行が Phase 2 の書式と一致 / 全 worktree で 1 行ずつ記録 / link-checklist で dead link が 0 |
| 合否基準 | 上記 2 ファイルが揃い、Phase 7 AC マトリクスから参照可能であること |

## テスト階層と AC のマッピング

| 階層 | カバー AC |
| --- | --- |
| dry-run | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7 |
| 単 worktree smoke | AC-3, AC-5 |
| 全件 smoke | AC-1, AC-2, AC-3, AC-4, AC-5 |
| NON_VISUAL evidence | AC-5, AC-9, AC-10 |

## 実行タスク

1. 4 階層の合否基準と副作用を `outputs/phase-04/test-strategy.md` に最終化する。
2. 階層と AC のマッピング表を確定する。
3. NON_VISUAL 方針を artifacts.json / Phase 11 仕様書と矛盾なく明記する。
4. 並列禁止条項を Phase 5 / Phase 6 への引き渡し事項として共有する。

## 成果物

- `outputs/phase-04/test-strategy.md`（本 Phase で詳細化）
- 4 階層の合否基準
- AC との対応表

## 完了条件

- 4 階層全てに合否基準・副作用・並列禁止が明記されている
- NON_VISUAL であることと screenshot を作らないことが明示されている
- Phase 11 で生成する代替 evidence 2 ファイルが定義されている

## Phase 5 への引き渡し

- 単 worktree smoke の手順を Phase 5 runbook の「実行例」セクションで採用する
- 全件 smoke の合否基準は Phase 5 runbook 末尾の集計章と整合させる
- 並列禁止と continue ポリシーは Phase 5 runbook の冒頭注意喚起に再掲する
