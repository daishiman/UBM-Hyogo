# Phase 10 — 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase | 10 / 13 |
| 状態 | completed |
| 上流 | Phase 9（品質保証 5 領域全 PASS） |
| 下流 | Phase 11（手動 smoke） |
| 判定 | **GO** |

## 結論サマリ

Phase 1〜9 の成果物を統合レビューした結果、AC-1〜AC-7 全項目に検証手段と実装根拠が
紐付き、4 条件（価値性 / 実現性 / 整合性 / 運用性）も全 PASS。blocker は 0 件、未解決リスク
R-1〜R-6 は全件 escape hatch を明示済。**GO 判定** で Phase 11（手動 smoke）に進む。

## GO/NO-GO 判定基準（11 軸）

| 軸 | 基準 | 判定 |
| --- | --- | --- |
| AC-1〜AC-7 | Phase 7 マトリクスで全項目に test 設計 + Phase 5 ランブックに対応 step | PASS |
| 不変条件 | CLAUDE.md #1〜#7 に触れない | PASS |
| 上流 | task-git-hooks-lefthook-and-post-merge 完了済（post-merge 廃止が前提） | PASS |
| Phase 8 DRY | 命名規則 4 階層確定 + 共通 setup 抽出見送り判断 | PASS |
| Phase 9 line budget | YAML ≤ 60 行 / step ≤ 7 | PASS |
| Phase 9 link | L-1〜L-5 alive（L-1/L-2/L-5 は Phase 12 で確定） | 条件付 PASS |
| Phase 9 mirror parity | `.claude` ↔ `.agents` 影響なし | PASS |
| Phase 9 secret hygiene | `permissions: contents: read` のみ / 新規 secret なし | PASS |
| Phase 9 free-tier | 月間消費 ≤ 12%（≤ 240 min / 2,000 min） | PASS |
| 既存 4 workflow 非衝突 | concurrency / job id / trigger 重複なし | PASS |
| solo 運用ポリシー | required reviewers 0 / Required Status Checks に追加可能 | PASS |

→ **11 軸全 PASS（条件付 1 件は Phase 12 完了で恒久 PASS）**

## AC 達成チェック（AC-1〜AC-7）

| AC | 内容 | 達成根拠（Phase ref） | 判定 |
| --- | --- | --- | --- |
| AC-1 | PR / push 時に gate が自動起動 | Phase 2 trigger 設計 + Phase 5 `on:` ブロック + TC-05 / TC-06 | PASS |
| AC-2 | drift 時 fail + 差分ファイル名出力 | Phase 5 `Detect drift` step + Phase 6 F-01 / F-04 | PASS |
| AC-3 | drift なしで false positive にならず PASS | Phase 4 TC-01 / TC-02（連続 2 回） + Phase 6 F-05 / F-06（決定論性） | PASS |
| AC-4 | post-merge hook に index 再生成を戻していない | Phase 3 案 D 却下 + lefthook.yml 非変更（静的 grep 検証） | PASS |
| AC-5 | 既存 4 workflow と job 名 / trigger / concurrency 非衝突 | Phase 8 命名規則 + Phase 9 link チェック + 独立 file | PASS |
| AC-6 | Node 24.15.0 / pnpm 10.33.2 環境で実行 | Phase 5 setup-node@v4 (24.15.0) + pnpm/action-setup@v4 (10.33.2) | PASS |
| AC-7 | `git add -N` 後の `git diff --exit-code -- <indexes>` で範囲限定 + 未追跡 index 検出 | Phase 5 path 引数 + TC-07 / F-11 | PASS |

## blocker 一覧

| ID | blocker | 影響 | 対処 | 現状 |
| --- | --- | --- | --- | --- |
| — | （0 件） | — | — | — |

> Phase 1〜9 outputs 間の矛盾は検出されず、blocker は 0 件。

## 未解決リスク（escape hatch 付き）

| ID | リスク | 影響 | 検知 | escape hatch |
| --- | --- | --- | --- | --- |
| R-1 | `generate-index.js` の出力が non-deterministic（mtime / Map iteration / 改行） | AC-3 失敗、PR 全件 fail | Phase 4 TC-02 / Phase 11 手動 smoke で初回検出 | (1) generate-index.js を deterministic 化する本タスクを発行、(2) 暫定で workflow に `LC_ALL=C` 投入、(3) 解消困難なら Required Status Checks から一時除外 |
| R-2 | OS 差（macOS local vs Ubuntu CI）で改行 / glob 順序差 | AC-3 false positive | Phase 11 で local 実行と CI bytewise 比較 | core.autocrlf / `.gitattributes` で改行統一、glob は明示 sort |
| R-3 | pnpm cache miss が連続し free-tier 比率超過 | 運用コスト増 | GitHub Actions usage page で月次監視 | cache key 見直し / lockfile 安定化 |
| R-4 | aiworkflow-requirements 以外の skill index 増設時に検知漏れ | drift 漏れ | Phase 8 navigation drift 棚卸しで識別済 | 同 workflow 内に並列 job 追加（拡張容易） |
| R-5 | drift 検出後の修正手順が CLAUDE.md に未記載 | 開発者が `pnpm indexes:rebuild` を発見できない | Phase 12 で CLAUDE.md 追記 | Phase 12 N-1 として必ず消化 |
| R-6 | `git diff --exit-code` が untracked file を見逃す | drift 検出漏れ | Phase 6 異常系で `git status --short` 併用を仕様化 | ランブックで `git add -N <indexes>` を必須化（Phase 5 で確定済） |

## 4 条件最終

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | post-merge 廃止後の drift 流入を構造的に閉じる。Solo 開発でも `--no-verify` 迂回不能 |
| 実現性 | PASS | 既存 ci.yml の setup を流用、新規依存なし。月間 free-tier ≤ 12% |
| 整合性 | PASS | AC-4 / AC-5 / 不変条件 #1〜#7 と非衝突。mirror parity 影響なし |
| 運用性 | PASS | 撤去は `git revert` 1 コミットで可能。Required Status Checks 設定で gate 化 / 解除も独立可能 |

## レビューチェックリスト

- [x] AC-1〜AC-7 全項目に Phase ref あり
- [x] 不変条件 #1〜#7 への抵触なし
- [x] Phase 8 命名規則 4 階層確定
- [x] Phase 9 Q-1〜Q-4（line budget）クリア見込み
- [x] Phase 9 L-1〜L-5（link）alive（条件付）
- [x] Phase 9 M-1〜M-4（mirror parity 影響なし）確定
- [x] Phase 9 S-1〜S-7（secret hygiene）全 PASS
- [x] free-tier 月間消費 ≤ 12%
- [x] blocker 0 件
- [x] 未解決リスク R-1〜R-6 全件に escape hatch 記載

## Phase 11 への申し送り事項

1. **手動 smoke 必須項目**:
   - drift なし状態で 2 回連続 PR を作成し、両方 PASS（AC-3 false positive 検証）
   - 意図的に `.claude/skills/aiworkflow-requirements/indexes/` のいずれかを 1 byte 改変して PR を出し、fail を確認（AC-2）
   - fail 時の job log に差分ファイル名が出力されていることを目視（Phase 5 `Detect drift` step）
2. **OS 差検証**: local（macOS）で `pnpm indexes:rebuild` 後に `git diff --exit-code` が clean、CI（Ubuntu）と bytewise で一致することを R-2 escape hatch として実測
3. **Required Status Checks 設定提案**: Phase 13 PR 説明欄に「branch protection の `required_status_checks` に `verify-indexes-up-to-date` を追加する手順」を含める
4. **R-1（non-deterministic 出力）**: 手動 smoke 1 回目で検出された場合、本タスク発行を Phase 12 unassigned-task-detection に登録

## 完了条件

- [x] 11 軸全てで判定が確定
- [x] AC-1〜AC-7 全項目に Phase ref が紐付く
- [x] blocker 0 件
- [x] 未解決リスク R-1〜R-6 全件 escape hatch 明記
- [x] 4 条件 全 PASS
- [x] Phase 11 申し送り 4 項目 文書化

## 次 Phase

Phase 11（手動 smoke）へ **GO 判定** + AC-1〜AC-7 達成根拠 + R-1 / R-2 / R-6 の手動 smoke
実測項目 + Required Status Checks 設定提案を引き継ぐ。
