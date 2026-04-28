# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 9 |
| 下流 | Phase 11 |
| 状態 | completed |

## 目的

Phase 1〜9 の成果物を統合レビューし、`verify-indexes-up-to-date` CI gate 仕様の
**GO/NO-GO** を判定する。`docs + CI / NON_VISUAL` タスクであるため、判定対象は
(a) AC-1〜AC-7 の達成見込み、(b) 4 条件（価値性・実現性・整合性・運用性）、
(c) 無料枠 / secret hygiene / mirror parity、(d) blocker / 未解決リスクの 4 軸。

## GO/NO-GO 判定基準

| 軸 | 基準 | 判定 |
| --- | --- | --- |
| AC-1〜AC-7 | Phase 7 AC マトリクスで全項目に test 設計が紐付き、Phase 5 ランブックに対応 step が存在 | TBD |
| 不変条件 | CLAUDE.md #1〜#7 に触れない | TBD（触れない設計） |
| 上流 | task-git-hooks-lefthook-and-post-merge 完了済（post-merge 廃止が前提） | TBD |
| Phase 8 DRY | 命名規則 4 階層確定 + 共通 setup 抽出見送り判断 | TBD |
| Phase 9 line budget | YAML ≤ 60 行 / step ≤ 7 | TBD |
| Phase 9 link | L-1〜L-5 alive | TBD |
| Phase 9 mirror parity | `.claude` ↔ `.agents` 影響なし | TBD（影響なし確定） |
| Phase 9 secret hygiene | `permissions: contents: read` のみ / 新規 secret なし | TBD |
| Phase 9 free-tier | 月間消費 ≤ 12%（≤ 240 min / 2000 min） | TBD |
| 既存 4 workflow 非衝突 | concurrency / job id / trigger 重複なし | TBD |
| solo 運用ポリシー | required reviewers 0 / required status checks に追加可能 | TBD |

## AC 達成チェック（AC-1〜AC-7）

| AC | 内容 | 達成根拠（Phase ref） | 判定 |
| --- | --- | --- | --- |
| AC-1 | PR / push 時に gate が自動起動 | Phase 2 trigger 設計 + Phase 5 ランブック | TBD |
| AC-2 | drift 時 fail + 差分ファイル名出力 | Phase 5 `report-drift` step + Phase 6 異常系 | TBD |
| AC-3 | drift なしで false positive にならず PASS | Phase 4 連続 2 回実行 test + Phase 6 決定論性検証 | TBD |
| AC-4 | post-merge hook に index 再生成を戻していない | Phase 3 案 D 却下 + lefthook.yml 非変更 | TBD |
| AC-5 | 既存 4 workflow と job 名 / trigger / concurrency で非衝突 | Phase 8 命名規則 + Phase 9 確認 | TBD |
| AC-6 | Node 24 / pnpm 10.33.2 環境で実行 | Phase 5 setup-node@v4 + pnpm/action-setup@v4 | TBD |
| AC-7 | `git add -N` 後の `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` で indexes のみ判定 | Phase 5 ランブック path 引数 | TBD |

## blocker 一覧

| ID | blocker | 影響 | 対処 | 現状 |
| --- | --- | --- | --- | --- |
| B-1 | （現時点では blocker なし。検出された場合に追記する枠） | — | — | open |

> 設計時点で blocker は識別されていない。Phase 10 実行時点で
> Phase 1〜9 outputs に矛盾が発見された場合、本表に B-2 以降を追記する。

## 未解決リスク

| ID | リスク | 影響 | 検知 | 対処（escape hatch） |
| --- | --- | --- | --- | --- |
| R-1 | `generate-index.js` の出力が non-deterministic（タイムスタンプ / Map iteration order / 改行コード差）になり false positive を生む | AC-3 失敗、PR 全件で gate fail | Phase 4 の連続 2 回実行 test / Phase 11 手動 smoke で初回検出 | (1) generate-index.js 側を deterministic 化する本タスクを発行（本タスク scope 外）。(2) 暫定として workflow 側で `LC_ALL=C` / 改行統一の env を投入。(3) どうしても解消困難な場合は Required Status Checks から一時除外 |
| R-2 | OS 差（macOS local vs Ubuntu CI runner）で改行コード / glob 順序差が発生 | AC-3 false positive | Phase 11 手動 smoke で local 実行と CI 実行の bytewise 比較 | core.autocrlf / git attributes で改行統一、glob は明示 sort |
| R-3 | pnpm cache miss が連続し free-tier 比率が想定超過 | 運用コスト増 | GitHub Actions usage page で月次監視 | cache key 見直し / lockfile 安定化 |
| R-4 | 将来 `aiworkflow-requirements` 以外の skill index が増えた際、本 gate が他 skill drift を検知できない | drift 漏れ | Phase 8 navigation drift 棚卸しで識別済み | 同 workflow 内に並列 job を追加（拡張容易・Phase 3 案 A 採用の利点） |
| R-5 | drift 検出後の修正手順が CLAUDE.md に未記載 | 開発者が `pnpm indexes:rebuild` を発見できない | Phase 12 で CLAUDE.md 追記 | Phase 12 で必ず消化（N-1） |
| R-6 | `git diff --exit-code` が untracked file（新規生成 index）を見逃す可能性 | drift 検出漏れ | Phase 6 異常系で `git status --short` 併用を仕様化 | ランブックで `git add -N .` 相当 or `git status --porcelain` を併用 |

## 4 条件最終

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | post-merge 廃止後に残った drift 流入リスクを CI 側で structural に閉じる。Solo 開発でも `--no-verify` 迂回不能 |
| 実現性 | PASS | 既存 ci.yml の setup パターンをそのまま流用、新規依存なし。月間 free-tier 比率 ≤ 12% |
| 整合性 | PASS | AC-4 / AC-5 / 不変条件 #1〜#7 と非衝突。`.claude` ↔ `.agents` mirror parity 影響なし |
| 運用性 | PASS | 撤去は `git revert` 1 コミットで可能。Required Status Checks 設定で gate 化 / 解除も独立に可能 |

## レビューチェックリスト

- [ ] AC-1〜AC-7 全項目に Phase ref あり
- [ ] 不変条件 #1〜#7 への抵触なし
- [ ] Phase 8 命名規則 4 階層確定（workflow / job / step / concurrency）
- [ ] Phase 9 Q-1〜Q-4（line budget）クリア見込み
- [ ] Phase 9 L-1〜L-5（link）alive
- [ ] Phase 9 M-1〜M-4（mirror parity 影響なし）確定
- [ ] Phase 9 S-1〜S-7（secret hygiene）全 PASS
- [ ] free-tier 月間消費 ≤ 12%
- [ ] blocker 0 件 or 全件に対処計画
- [ ] 未解決リスク R-1〜R-6 全件に escape hatch 記載

## 実行タスク

1. GO/NO-GO 判定基準 11 軸を `outputs/phase-10/go-no-go.md`
2. AC-1〜AC-7 達成チェックを `outputs/phase-10/ac-check.md`
3. blocker / 未解決リスクを `outputs/phase-10/main.md`
4. 4 条件最終判定を main.md
5. Phase 11 への申し送り事項を main.md 末尾

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 1〜9 outputs | 統合レビュー対象 |
| 必須 | Phase 7 outputs/phase-07/main.md | AC マトリクス |
| 必須 | Phase 8 outputs/phase-08/main.md | DRY 確定事項 |
| 必須 | Phase 9 outputs/phase-09/* 5 ファイル | quantitative 根拠 |
| 参考 | docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md | 元タスク制約 |
| 参考 | docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md | 派生元 |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 11 | 手動 smoke の実行範囲（local 再生成 vs CI 再生成の差分比較）を確定 |
| Phase 12 | navigation drift N-1〜N-4 の消化指示 + 未解決リスク R-5 の解消 |
| Phase 13 | PR 作成時の Required Status Checks 設定提案を申し送る |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 上流 AC | — | task-git-hooks-lefthook-and-post-merge 完了 |
| 不変条件 | #1〜#7 | 触れない |
| solo 運用 | — | required reviewers 0 と整合 / Required Status Checks のみで gate 化 |
| 撤去容易性 | — | `git revert` 1 コミットで除去可能（独立 file） |
| free-tier | #10 | ≤ 12% / 月 |

## Phase 11 への申し送り事項

1. **手動 smoke 必須項目**:
   - drift なし状態で 2 回連続 PR を作成し、両方 PASS することを確認（AC-3 false positive 検証）
   - 意図的に `.claude/skills/aiworkflow-requirements/indexes/` のいずれかを 1 byte 改変して PR を出し、fail することを確認（AC-2 検証）
   - fail 時の job log に差分ファイル名が出力されていることを目視確認（Phase 5 `report-drift` step）
2. **OS 差検証**: local（macOS）で `pnpm indexes:rebuild` 後に `git diff --exit-code` が clean になることを確認し、CI（Ubuntu）と bytewise で一致することを R-2 escape hatch として実測
3. **Required Status Checks 設定提案**: Phase 13 PR 説明欄に「branch protection の required_status_checks に `verify-indexes-up-to-date` を追加する手順」を含める
4. **未解決リスク R-1（non-deterministic 出力）**: 手動 smoke で 1 回目検出された場合の即時対応として、本タスク発行を Phase 12 unassigned-task-detection に登録する

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | GO/NO-GO 判定基準 11 軸 | completed |
| 2 | AC-1〜AC-7 達成チェック | completed |
| 3 | blocker / 未解決リスク棚卸し | completed |
| 4 | 4 条件最終判定 | completed |
| 5 | Phase 11 申し送り | completed |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-10/main.md | blocker / リスク / 4 条件 / 申し送り |
| outputs/phase-10/go-no-go.md | 11 軸判定 |
| outputs/phase-10/ac-check.md | AC-1〜AC-7 達成根拠 |

## 完了条件

- [ ] 11 軸全てで判定が確定（PASS / NO-GO 明示）
- [ ] AC-1〜AC-7 全項目に Phase ref が紐付く
- [ ] blocker 0 件 or 全件 plan あり
- [ ] 未解決リスク R-1〜R-6 全件 escape hatch 明記
- [ ] 4 条件 全 PASS
- [ ] Phase 11 申し送り 4 項目 文書化

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 completed
- [ ] outputs/phase-10/* 3 ファイル配置済み
- [ ] GO 判定 or 戻し計画
- [ ] artifacts.json の Phase 10 を completed

## 次 Phase

- 次: Phase 11（手動 smoke）
- 引き継ぎ事項:
  - GO 判定 + AC-1〜AC-7 達成根拠
  - 未解決リスク R-1（non-deterministic）/ R-2（OS 差）/ R-6（untracked file）の手動 smoke 実測項目
  - Required Status Checks 設定提案を Phase 13 PR 説明欄に含める指示
- ブロック条件:
  - blocker 1 件以上発生で対処不能 → Phase 2 設計戻し
  - free-tier 比率 30% 超 → Phase 2 設計戻し（trigger 縮小検討）
  - mirror parity に予期せぬ影響あり → Phase 8 戻し
