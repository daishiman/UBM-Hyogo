# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-28 |
| 上流 | Phase 6 (異常系検証) |
| 下流 | Phase 8 (DRY 化) |
| 状態 | pending |
| user_approval_required | false |

## 目的

AC-1〜AC-11 と検証コマンド / 証跡の対応を一覧化し、Phase 9 / Phase 10 で参照可能な追跡可能行列を作成する。

## 入力

- Phase 1 確定 AC（AC-1〜AC-11）
- Phase 4 TC-1〜TC-4
- Phase 6 FC-1〜FC-4

## AC × 検証コマンド × 証跡 マトリクス

| AC ID | 内容 | 検証 TC / FC | 検証コマンド | 証跡 path |
| --- | --- | --- | --- | --- |
| AC-1 | B-1 セクション追記、対象は行独立 append-only Markdown のみ | TC-1-1〜TC-1-3 | `git check-attr merge -- <_legacy.md>` | `outputs/phase-05/implementation-runbook.md` 実行ログ |
| AC-2 | JSON / YAML / SKILL.md / lockfile に `union` 不適用 | TC-2-1〜TC-2-3, FC-2 | `git check-attr merge -- <json/yaml/lock>` | `outputs/phase-05/` 検証ログ |
| AC-3 | 2 worktree smoke で衝突 0 件、両エントリ保存 | TC-3-1 | `git merge --no-ff` + `git ls-files --unmerged` | `outputs/phase-11/manual-smoke-log.md` |
| AC-4 | 行レベル独立のみへの限定が check-attr で機械検証可能 | TC-2-4, FC-3 | `git check-attr merge -- <現役 fragment>` | `outputs/phase-05/` 検証ログ |
| AC-5 | A-2 完了後の解除手順が `.gitattributes` コメント / runbook に明記 | コメント目視 | `grep "解除条件" .gitattributes` | `outputs/phase-12/implementation-guide.md` |
| AC-6 | skill 自身の `_legacy.md` も棚卸しに含まれる | TC-1-2 | `git check-attr merge -- .claude/skills/task-specification-creator/changelog/_legacy.md` | `outputs/phase-01/main.md` |
| AC-7 | 解除条件とロールバック手順が Phase 2 / 3 / 12 で追跡可能 | review | `rg -n "解除条件|ロールバック" docs/30-workflows/skill-ledger-b1-gitattributes` | `outputs/phase-02/main.md`, `outputs/phase-03/main.md`, `outputs/phase-12/implementation-guide.md` |
| AC-8 | A-1 / A-2 / A-3 完了が NO-GO 条件として重複明記 | review | `rg -n "A-1.*A-2.*A-3|NO-GO" docs/30-workflows/skill-ledger-b1-gitattributes` | `phase-01.md`, `outputs/phase-02/main.md`, `outputs/phase-03/main.md` |
| AC-9 | `docs-only` / `NON_VISUAL` / `spec_created` が artifacts と一致 | metadata | `node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/skill-ledger-b1-gitattributes/artifacts.json','utf8'))"` | `artifacts.json`, `outputs/artifacts.json` |
| AC-10 | 代替案 4 案以上を PASS / MINOR / MAJOR で評価 | review | `rg -n "PASS|MINOR|MAJOR" docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-03/main.md` | `outputs/phase-03/main.md` |
| AC-11 | Phase 1〜13、outputs、依存関係が artifacts と一致 | validator | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/skill-ledger-b1-gitattributes` | validation log |

## 依存トレース

| AC | 上流 Phase | 下流 Phase |
| --- | --- | --- |
| AC-1 | Phase 1 / 2 | Phase 9 / 10 |
| AC-2 | Phase 1 / 2 / 6 (FC-2) | Phase 9 / 10 |
| AC-3 | Phase 2 (smoke 設計) | Phase 11 |
| AC-4 | Phase 2 / 6 (FC-3) | Phase 9 / 10 |
| AC-5 | Phase 2 / 5 (コメント) | Phase 12 |
| AC-6 | Phase 1 (棚卸し) | Phase 9 |
| AC-7 | Phase 2 / 3 | Phase 12 |
| AC-8 | Phase 1 / 2 / 3 | Phase 10 / 13 |
| AC-9 | index / artifacts | Phase 9 / 12 |
| AC-10 | Phase 3 | Phase 10 |
| AC-11 | artifacts / phase files | Phase 9 / 12 |

## 実行タスク

1. AC × TC × FC 対応表を作成
2. 各行に検証コマンドと証跡パスを記載
3. 依存トレース（上流 / 下流 Phase）を作成
4. Phase 9 / Phase 10 / Phase 11 で参照可能な形式に整理

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Skill Ledger Overview | `.claude/skills/aiworkflow-requirements/references/skill-ledger-overview.md` | A-2 → A-1 → A-3 → B-1 の実装順序と責務境界 |
| Skill Ledger Gitattributes Policy | `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md` | B-1 `merge=union` の許可・禁止・解除条件 |
| Skill Ledger Lessons Learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-skill-ledger-redesign-2026-04.md` | skill ledger 4施策の苦戦箇所と再発防止 |


| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-01/main.md` |
| 必須 | `outputs/phase-04/test-strategy.md` |
| 必須 | `outputs/phase-06/failure-cases.md` |

## 依存Phase明示

- Phase 5 成果物を参照する。
- Phase 6 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-07/ac-matrix.md` | AC × 検証コマンド × 証跡 / 依存トレース |

## 完了条件 (DoD)

- [ ] AC-1〜AC-11 全てがマトリクスに含まれる
- [ ] 各 AC に検証コマンドが紐付く
- [ ] 各 AC に証跡 path が紐付く
- [ ] 依存トレースが作成済み

## 苦戦箇所・注意

- **証跡 path の先取り**: Phase 11 / 12 の成果物は未生成だが、path だけ確定させる。Phase 11 / 12 で実体作成時にパスズレが起きないよう Phase 7 でパス命名を確定
- **AC-5 の check 漏れ**: 「コメントが書かれているか」は機械検証しにくい。`grep "解除条件"` のような minimal grep を入れて自動化に乗せる

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 8（DRY 化）
- 引き継ぎ: AC マトリクス / 証跡 path 一覧
