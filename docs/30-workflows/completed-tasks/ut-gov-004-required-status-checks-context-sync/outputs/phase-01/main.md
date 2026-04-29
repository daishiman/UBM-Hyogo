# Phase 1: 要件定義 — 主成果物

> 作成日: 2026-04-29
> タスク: UT-GOV-004 / branch protection 草案 8 contexts と CI 実在 job 名の同期

## 1. 真の論点 (true issue) — リネームではなく実績担保

本タスクの本質は「草案 8 件を CI 実在名にリネームする」ことではない。本質は次の 1 文に集約される。

> **branch protection に投入する文字列は、過去 30 日以内に GitHub 上で 1 回以上 `conclusion=success` の check-run として記録された実績を持つこと**

この契約を破ると `Expected — Waiting for status to be reported` で merge が永続停止し、admin override か protection 編集でしか解除できない（原典苦戦箇所 #1）。よって以下の 3 経路で吸収する。

1. **rename**: 設計の意図を保ったまま実在 context 名へ置換する
2. **exclude**: 実在しない contexts は branch protection 投入対象から除外し、UT-GOV-005 等での新設後に後追い投入する
3. **新設はしない**（本タスクのスコープ外）

副次的論点: lefthook と CI のドリフト防止のため、両者は同一 `pnpm` script を呼ぶ規約を運用契約として固定する。

## 2. 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-GOV-001 の安全実行に唯一不可欠。代替なし（実績未確認の投入は永続停止リスク）。 |
| 実現性 | PASS | `.github/workflows/` grep + `gh api check-runs` のみで完結、新規実装ゼロ。 |
| 整合性 | PASS | governance 層に閉じ、CLAUDE.md §「重要な不変条件」#1〜#7（apps 層）に影響しない。 |
| 運用性 | PASS | 段階適用 + 名前変更時の同一 PR 運用ルールでドリフトを継続的に防止できる。 |

MAJOR ゼロ。

## 3. 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | なし | - | - |
| 下流（強） | UT-GOV-001 | 確定 context リスト・strict 採否・段階適用フェーズ | `outputs/phase-08/confirmed-contexts.yml` を唯一の機械可読入力として渡す |
| 関連 | task-git-hooks-lefthook-and-post-merge | hook 名と pnpm script 規約 | `outputs/phase-02/lefthook-ci-correspondence.md` |
| 関連 | UT-GOV-005（docs/skill 系 CI 追加） | 新規 CI リレー先 | exclude 行の「将来必要 context」リスト |
| 関連 | UT-GOV-006 / UT-GOV-007 | deploy 系・action ピン留め | 名前変更運用ルールの参照 |
| 既存組み込み | task-github-governance-branch-protection | phase-2/design.md §2.b 草案 8 件 | 上書き確定リスト |

## 4. 草案 8 contexts の暫定分類（Phase 2 で確定）

| # | 草案 context 名 | 想定経路 | 暫定根拠 |
| --- | --- | --- | --- |
| 1 | typecheck | rename → `ci` | `pnpm typecheck` は `ci` job のステップ。独立 context ではない |
| 2 | lint | rename → `ci` | 同上、`pnpm lint` ステップ |
| 3 | unit-test | exclude | 独立 unit-test workflow / job が現時点で存在しない |
| 4 | integration-test | exclude | 同上、UT-GOV-005 リレー候補 |
| 5 | build | rename → `Validate Build` | `validate-build.yml` job が実在 |
| 6 | security-scan | exclude | 該当 workflow なし、UT-GOV-005 リレー候補 |
| 7 | docs-link-check | exclude | 該当 workflow なし、UT-GOV-005 リレー候補 |
| 8 | phase-spec-validate | rename → `verify-indexes-up-to-date` | skill indexes drift 検出という近接の趣旨。Phase 2 で代替案も比較 |

> 確定は Phase 2 (`context-name-mapping.md`) で `gh api check-runs` の実績証跡付きで行う。

## 5. 既存 CI / hook 命名規則チェックリスト（Phase 2 入力）

Phase 2 で実在 context 名を抽出する前に、以下 6 観点を必ず走査する。

| # | 観点 | 確認対象 | 期待される情報 |
| --- | --- | --- | --- |
| 1 | Workflow ファイル一覧 | `.github/workflows/*.yml` 全件 | 各ファイルの top-level `name:` 値 |
| 2 | Job 単位 | 各 workflow の `jobs.<key>.name` | 明示 `name:` 有無、未指定時は YAML キー名 |
| 3 | Matrix 展開 | `strategy.matrix` | 最終 context 名（`gh run view` で目視確認） |
| 4 | 直近成功実績 | `gh api repos/:owner/:repo/commits/<sha>/check-runs` | 過去 30 日以内の `conclusion=success` の有無 |
| 5 | lefthook 設定 | `lefthook.yml` | hook 名 → pnpm script マッピング |
| 6 | pnpm script | `package.json` の `scripts` | `typecheck` / `lint` / `test` の実体 |

## 6. AC ロック (AC-1〜AC-10)

index.md と完全一致させる（差分ゼロ）。

- AC-1: 全 workflow を走査し、実在 `<workflow>/<job>` (matrix 展開後を含む) 一覧表が成果物に含まれる
- AC-2: 草案 8 件すべてに rename 先 (フルパス) または「除外」が確定
- AC-3: 確定 context は過去 30 日以内に 1 回以上 `conclusion=success` の証跡を持つ
- AC-4: 未出現 context は除外され、後追い投入条件が「段階適用案」に明記
- AC-5: lefthook hook ↔ CI job 対応表が `task-git-hooks-lefthook-and-post-merge` と整合
- AC-6: UT-GOV-001 投入確定リストが参照可能なファイルパスで明示
- AC-7: `strict: true` 採否が dev / main 別に決定、根拠付き
- AC-8: 同名 job のフルパス記載規約 (`<workflow>/<job>`) が遵守
- AC-9: context 名変更を伴う refactor の運用ルール（同一 PR or 新旧並列→旧外し）が文書化
- AC-10: 4条件最終判定 PASS、MAJOR ゼロ

## 7. 苦戦箇所 → AC マッピング

| 苦戦箇所 | 対応 AC / チェック観点 |
| --- | --- |
| #1 merge 完全停止 | AC-3 / AC-4 |
| #2 context 名規則 | AC-2 / AC-8 |
| #3 同名 job 衝突 | AC-8 |
| #4 strict トレードオフ | AC-7 |
| #5 lefthook ドリフト | AC-5 |
| #6 名前変更事故 | AC-9 |

## 8. 多角的チェック観点（AI 判定）

- branch protection 永続停止リスクが AC-3 / AC-4 に組み込まれているか → ✅
- `strict` 採否が dev / main 別に決定可能な構造か → ✅ (AC-7)
- CI 実績の真正性が `gh api` で機械検証可能か → ✅ (Phase 2 §A コマンド付き)
- hook 整合性が「同一 pnpm script を双方が呼ぶ」規約として明文化されているか → ✅ (AC-5 / Phase 2 §D)
- 名前変更事故の運用ルールが AC に含まれているか → ✅ (AC-9)

## 9. Phase 2 への引き渡し事項

- 真の論点 = 実績担保
- 4条件 全 PASS（根拠付き）
- 暫定分類: rename 3 件 (`ci` ×2, `Validate Build` ×1) + 候補 1 件 (`verify-indexes-up-to-date`) / exclude 4 件
- 命名規則チェック 6 観点
- 設計成果物を 3 ファイル分離 (`context-name-mapping.md` / `staged-rollout-plan.md` / `lefthook-ci-correspondence.md`)

## 10. 完了条件 (Phase 1)

- [x] 真の論点が「実績担保」に再定義
- [x] 4条件評価が全 PASS、根拠記載
- [x] 依存境界（下流 1 強・関連 4・既存組み込み 1）が前提と出力付きで記述
- [x] AC-1〜AC-10 が index.md と完全一致
- [x] 草案 8 件すべてに暫定分類が付与
- [x] 命名規則チェック 6 観点が Phase 2 入力として整理
