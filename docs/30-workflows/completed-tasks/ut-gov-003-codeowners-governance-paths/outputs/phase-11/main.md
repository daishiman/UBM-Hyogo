# Phase 11 main — UT-GOV-003 CODEOWNERS governance paths（NON_VISUAL spec walkthrough）

> **ラベル**: implementation / NON_VISUAL / infrastructure_governance / spec_created
> **smoke test status**: **PARTIALLY EXECUTED — `gh api` PASS / test PR suggested reviewer 観察は未実行**
> **本 Phase の責務**: CODEOWNERS 静的/API evidence と、ユーザー承認後に行う PR smoke 手順の固定。

## 目的

`.github/CODEOWNERS` の governance path 適用に対し、NON_VISUAL タスクの代替 evidence プレイブック（L1/L2/L3/L4）を適用し、4 階層で保証範囲と保証外範囲を明示する。CODEOWNERS は GitHub 上の機構であり、UBM-Hyogo Web アプリの UI ではないため screenshot 不要。

## NON_VISUAL 代替 evidence 4 階層

| 階層 | 適用内容（CODEOWNERS 版） | 保証する範囲 | 保証できない範囲（→ Phase 12 申し送り） |
| --- | --- | --- | --- |
| L1: 構文 | `.github/CODEOWNERS` の path / owner spec を GitHub 公式 grammar に対し token-level 検証 | 構文の型整合 | 実リポジトリ上での owner 解決 |
| L2: 順序 / boundary | 「最終マッチ勝ち」仕様に対し `* @daishiman` global fallback が冒頭 1 行のみ、governance path はその後段に配置されることを spec レベルで boundary 検証 | order-sensitivity の静的整合 | 後段に意図せず広域 glob を追加した際の事故 |
| L3: API 検証 | `gh api repos/:owner/:repo/codeowners/errors` の実行手順を仕様レベルで固定（期待 `errors: []`） | GitHub 公式 validator による syntax / 権限エラー検出手順 | API 実行時点の owner 状態の時刻依存性 |
| L4: 意図的 violation | 存在しない user (`@nonexistent-bot-handle-xyz`) を governance path に書いた fixture を spec walkthrough で red 確認手順として提示 | 「赤がちゃんと赤になる」設計妥当性 | （L4 は green 保証ではない） |

## 観察対象 governance path（5 path）

| # | path | 期待 owner | 観察方法 |
| --- | --- | --- | --- |
| 1 | `docs/30-workflows/**` | `@daishiman` | test PR で 1 ファイル touch → suggested reviewer 表示 |
| 2 | `.claude/skills/**/references/**` | `@daishiman` | 同上 |
| 3 | `.github/workflows/**` | `@daishiman` | 同上 |
| 4 | `apps/api/**` | `@daishiman` | 同上 |
| 5 | `apps/web/**` | `@daishiman` | 同上 |

> 本タスクは solo 運用方針のため owner は個人 handle `@daishiman` に寄せる。将来 team handle 採用時は組織側で write 権限事前付与が必要。

## 保証できない範囲（Phase 12 申し送り候補）

1. GitHub UI の suggested reviewer 表示は CODEOWNERS 反映タイミングと時刻ずれが発生する場合があり、L1〜L3 は「手順固定」までしか保証しない。
2. team handle (`@org/team`) の権限要件（write 以上）を満たさない場合 CODEOWNERS が silently skip されるが、本タスクは個人 handle 前提のため未検証。
3. CODEOWNERS の glob は gitignore 風だが完全互換ではなく、`**` の扱い / ディレクトリ末尾 `/` で挙動差がある。`.claude/skills/**/references/**` の多段ワイルドカードは API errors と test PR 観察の両面で確認が必要だが、本 Phase では実走しない。
4. solo 運用のため `require_code_owner_reviews=true` は有効化しない方針。よって CODEOWNERS は強制力ゼロの「ownership 文書化」に留まる。将来有効化する場合の移行手順は別タスクで切る。

## smoke 実走計画

| 区分 | 実走時期 | 実走者 |
| --- | --- | --- |
| 本 Phase | `gh api .../codeowners/errors` 実行済み / test PR smoke 未実行 | `{"errors":[]}` |
| Phase 13 / PR 作成後 | suggested reviewer 観察 | `@daishiman`（実装担当） |
| 定常監視 | UT-GOV-001 / UT-GOV-004 と並行 | CI（codeowners-validator action 採用は unassigned-task として記録） |

## 関連 outputs

- `outputs/phase-11/manual-smoke-log.md`: 5 governance path × suggested reviewer 観察手順 + `gh api .../codeowners/errors` の実行結果
- `outputs/phase-11/link-checklist.md`: 仕様書間 / 原典スペック / CLAUDE.md / 関連 UT-GOV タスク間リンク健全性
