# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 8 (DRY 化) |
| 下流 | Phase 10 (最終レビュー) |
| 状態 | pending |
| user_approval_required | false |

## 目的

typecheck / lint / `git check-attr`（対象 / 除外）/ smoke を一括判定し、全 AC の GREEN を機械検証する。Phase 10 へ提出する quality gate evidence を作成する。

## 入力

- DRY 化後 `.gitattributes`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-04/test-strategy.md`

## 検証コマンド一括

```bash
# 1. typecheck（コード変更なしの確認）
mise exec -- pnpm typecheck

# 2. lint
mise exec -- pnpm lint

# 3. check-attr 対象（TC-1）
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
git check-attr merge -- .claude/skills/task-specification-creator/changelog/_legacy.md
# 期待: merge: union

# 4. check-attr 除外（TC-2）
git check-attr merge -- .claude/skills/aiworkflow-requirements/indexes/keywords.json
git check-attr merge -- pnpm-lock.yaml
git check-attr merge -- .claude/skills/aiworkflow-requirements/SKILL.md
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/20260101-000000-main-deadbeef.md
# 期待: merge: unspecified

# 5. smoke（簡易: Phase 11 の本番証跡は別途）
git status --porcelain   # クリーン状態確認
```

## 一括判定ルール

| Gate | 期待 | FAIL 時の戻り |
| --- | --- | --- |
| typecheck | exit 0 | Phase 5（実装ランブック） |
| lint | exit 0 | Phase 5 |
| TC-1 全件 `union` | 全件期待一致 | Phase 5 / Phase 8 |
| TC-2 全件 `unspecified` | 全件期待一致 | Phase 5 / Phase 8 / Phase 6 防御線見直し |
| AC マトリクス GREEN | 全件 PASS | 該当 Phase へ戻る |

## 実行タスク

1. 検証コマンドを順次実行し標準出力を main.md に取り込む
2. 各 gate の PASS / FAIL を判定
3. FAIL 時の戻り Phase を確定
4. AC マトリクス（Phase 7）の各 AC に GREEN マークを付与

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
| 必須 | `outputs/phase-07/ac-matrix.md` |
| 必須 | `outputs/phase-04/test-strategy.md` |
| 必須 | `outputs/phase-08/main.md` |

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-09/main.md` | 検証ログ / 一括判定結果 / AC GREEN マトリクス |

## 完了条件 (DoD)

- [ ] typecheck / lint exit 0
- [ ] TC-1 全件 `merge: union`
- [ ] TC-2 全件 `merge: unspecified`
- [ ] AC-1〜AC-11 全件 GREEN
- [ ] FAIL 時の戻り Phase が明記済み

## 苦戦箇所・注意

- **`mise exec` 忘れ**: グローバル node で実行すると別バージョンで pass/fail が変わる。必ず `mise exec --` 経由
- **path の OS 依存**: macOS では `git check-attr` が `/dev/null` 入力で挙動が変わる。`-- <path>` 形式を厳守
- **ログ取り込みの揮発**: `main.md` に「実行した」と書くだけでなく標準出力を本文に貼る。Phase 10 で再実行が必要になる事故を防ぐ

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 10（最終レビュー）
- 引き継ぎ: 一括判定結果 / AC GREEN マトリクス
