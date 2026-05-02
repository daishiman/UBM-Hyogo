# Phase 11: 実測 evidence（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 実測 evidence（NON_VISUAL 縮約テンプレ） |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (リリース準備) |
| 次 Phase | 12 (ドキュメント・未タスク検出・スキルフィードバック) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | **NON_VISUAL** |

## 適用テンプレ

`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` のため、`.claude/skills/task-specification-creator/references/phase-template-phase11.md` の **NON_VISUAL 縮約テンプレ** および `phase-11-non-visual-alternative-evidence.md` の 4 階層代替 evidence を適用する。

screenshot は **生成禁止**（false green 防止）。CI gate / lint なので画面なし。

> **重要**: 本タスク仕様書では evidence の **取得方法とパス** のみを定義する。実際の取得は実装タスクのワークフロー実行時に行う旨を明記する（spec_created → implementation 別 wave）。

## 目的

NON_VISUAL lint / CI gate の evidence plan を固定し、実装 wave で取得すべきログ・snapshot・link check を明確にする。

## 必須 outputs（NON_VISUAL 縮約テンプレ準拠 / 3 ファイル）

| # | ファイル | 役割 | 最小フォーマット |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL / lint walkthrough）/ 必須 outputs リンク / 「保証する範囲・しない範囲」/ 申し送り先 |
| 2 | `outputs/phase-11/manual-smoke-log.md` | lint 実行ログ（intentional violation / clean PASS / allow-list snapshot 取得） | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」テーブル |
| 3 | `outputs/phase-11/link-checklist.md` | 仕様書 → eslint config / allow-list 設定 / 03a 仕様書 / SKILL リンクの dead link チェック | 「参照元 → 参照先 / 状態（OK / Broken）」テーブル |

## 必須 evidence ファイル（NON_VISUAL 実測証跡 / 3 件 + 任意 1 件）

| # | ファイル | 取得方法（実装タスク wave で実行） | 何を保証 |
| --- | --- | --- | --- |
| E1 | `outputs/phase-11/evidence/lint-violation-fail.txt` | Phase 9 で設計した L4 intentional violation を仮投入 → `pnpm lint --format compact 2>&1 \| tee outputs/phase-11/evidence/lint-violation-fail.txt`、確認後 stash | 「赤がちゃんと赤になる」（rule の error 出力） |
| E2 | `outputs/phase-11/evidence/lint-clean-pass.txt` | clean 状態で `pnpm lint --format compact 2>&1 \| tee outputs/phase-11/evidence/lint-clean-pass.txt` | 既存 03a / app code が suppression 無しで PASS |
| E3 | `outputs/phase-11/evidence/allow-list-snapshot.json` | allow-list 設定ファイルを `jq` または手動転記で JSON 化（絶対パス禁止、repo 相対 path のみ） | allow-list 内容のスナップショットと監査可能性 |
| E4（任意） | `outputs/phase-11/evidence/ci-job-link.md` | dry-run PR の GitHub Actions URL を記録 | 実 CI gate での挙動証跡（補助） |

E1〜E3 は必須、E4 は staging dry-run PR を作成した場合のみ取得。

## 代替 evidence 4 階層

`phase-11-non-visual-alternative-evidence.md` の 4 階層に従い、本タスクのカバー範囲を明示する。

| 階層 | 代替手段 | 何を保証 | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| L1: 型 | `pnpm typecheck` | rule 実装の TS 型整合 | runtime AST 走査の正しさ |
| L2: lint / boundary | `pnpm lint`（本 rule 自体を含む） | allow-list 外で stableKey literal が静的に検出される | runtime での dynamic literal（template literal の動的合成） |
| L3: in-memory test | rule の RuleTester unit test（ESLint 提供） | rule 述語の真偽 / allow-list path 判定 | monorepo 全体の lint 統合動作 |
| L4: 意図的 violation | E1（intentional violation snippet） | 「赤がちゃんと赤になる」 | （L2 で吸収済） |

## 代替 evidence 差分表（main.md に転記必須）

```markdown
## 代替 evidence 差分表

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 | 実 CI gate で違反 PR が fail する | E1 (lint-violation-fail.txt) + E4 (ci-job-link.md, 任意) | rule の error 検出 | dry-run PR (Phase 10 段階 ① warning) |
| S-2 | 既存 app code が clean PASS | E2 (lint-clean-pass.txt) | suppression 0 件で PASS | （本タスク内で完結） |
| S-3 | allow-list の正本一覧 | E3 (allow-list-snapshot.json) | allow-list 内容の固定化 | Phase 12 implementation-guide で参照 |
| S-4 | runtime literal（dynamic 合成） | （未対応） | — | Phase 12 unassigned-task-detection.md（runtime guard 検討） |
```

## AC × evidence × 不変条件 1:N トレース表

| AC | 内容 | evidence | 不変条件 | 階層 |
| --- | --- | --- | --- | --- |
| AC-1 | 違反 PR で CI fail | E1 / E4 | #1 / #6 | L4 / L2 |
| AC-2 | 既存 03a 実装が suppression なしで PASS | E2 | #1 | L2 |
| AC-3 | AC-7 を fully enforced へ昇格可能 | E1 + E2 + Phase 10 changelog draft | #1 | L1〜L4 |
| AC-4 | allow-list と例外ポリシーの明文化 | E3 + `outputs/phase-02/allow-list-spec.md` | #1 / #6 | L2 |
| AC-5 | rollback が rule 削除のみで戻る | Phase 10 rollback-plan.md | （process） | （N/A） |

## manual-smoke-log.md 必須メタ

- 証跡の主ソース: `pnpm lint`（本 rule 含む） / RuleTester unit test 件数
- screenshot を作らない理由: **NON_VISUAL**（CI gate / lint なので画面なし）
- 実行日時 / 実行者（worktree なら branch 名）
- secret hygiene grep: `grep -iE '(token|cookie|authorization|bearer|set-cookie)' outputs/phase-11/evidence/*.txt` が 0 hit

## link-checklist.md 最小項目

- 本仕様書 → `eslint.config.*`（実装後）
- 本仕様書 → `outputs/phase-02/allow-list-spec.md`
- 本仕様書 → `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md`（AC-7 昇格対象）
- 本仕様書 → `docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md`（legacy stub）
- workflow 内 `index.md` / `phase-*.md` / `outputs/*` 間リンク

## 異常時処理

- E1 で lint が error を返さない: rule 実装 bug → 実装タスクへ差戻し
- E2 で既存コードに hit: allow-list 漏れ → Phase 4 allow-list 追加 PR
- secret hygiene grep が hit: evidence ファイル再生成、token 文字列を sanitize
- L1 typecheck fail: rule 実装の型不整合、実装タスクへ差戻し

## 実行タスク

- [ ] 代替 evidence で **何を保証し**、**何を保証できないか** を main.md に明示
- [ ] 保証できない項目（runtime dynamic literal）を Phase 12 `unassigned-task-detection.md` に申し送り
- [ ] L4（intentional violation → red 確認）を 1 件以上実施
- [ ] manual-smoke-log.md に「NON_VISUAL のため screenshot 不要」を明記
- [ ] secret hygiene grep 0 hit

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-09/main.md | quality gate |
| 必須 | outputs/phase-10/main.md | release stage |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | NON_VISUAL template |

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | evidence plan index |
| `outputs/phase-11/manual-smoke-log.md` | manual smoke log |
| `outputs/phase-11/link-checklist.md` | link check |

## 統合テスト連携

Phase 12 は本 Phase の evidence が `NOT_EXECUTED` か実測済みかを明確に分け、false green を防ぐ。

## 完了条件

- [ ] 必須 outputs 3 ファイル + evidence 3 件（任意 E4 を除く）すべて取得済み
- [ ] AC × evidence × 不変条件 トレース表が埋まっている
- [ ] 代替 evidence 差分表が main.md に転記済み
- [ ] secret hygiene PASS

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全 evidence 配置済み
- [ ] secret hygiene PASS
- [ ] artifacts.json の phase 11 を completed

## 次 Phase

- 次: Phase 12 (ドキュメント・未タスク検出・スキルフィードバック)
- 引き継ぎ: 取得 evidence サマリ、未タスク化対象（runtime guard 等）
