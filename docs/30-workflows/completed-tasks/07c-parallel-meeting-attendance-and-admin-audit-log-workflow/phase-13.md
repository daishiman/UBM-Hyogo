# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## ユーザー承認確認文 (冒頭必須)

**この Phase は user の明示承認がある場合のみ実行する。** 承認がない状態で `gh pr create` を呼ぶことは禁止。

## 目的

仕様書一式を `feature/02-app-07c-attendance-audit` ブランチに配置し、`dev` への PR を作成。レビュー後 `main` へマージ可能な状態にする。

## 実行タスク

- [ ] approval gate 確認（user の明示承認）
- [ ] local-check-result.md（typecheck / lint / docs lint 結果）
- [ ] change-summary.md（diff 要約）
- [ ] PR template 適用
- [ ] `gh pr create` 実行（承認後のみ）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/* | PR 本文素材 |
| 必須 | CLAUDE.md | ブランチ戦略 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | release runbook |

## approval gate

| チェック | 状態 |
| --- | --- |
| user 明示承認あり | TBD |
| Phase 12 全成果物配置済み | TBD |
| Phase 11 smoke 全 pass | TBD |
| Phase 10 GO 判定済み | TBD |
| 不変条件 #5/#7/#11/#13/#15 カバー済み | TBD |

## local-check-result.md

```bash
# 実行コマンド
pnpm typecheck
pnpm lint
pnpm test --filter @ubm/api
# docs lint
pnpm docs:lint   # markdown link / heading lint

# 期待: 全 PASS
```

結果記録欄:

| コマンド | exit code | 備考 |
| --- | --- | --- |
| pnpm typecheck | TBD | — |
| pnpm lint | TBD | — |
| pnpm test --filter @ubm/api | TBD | — |
| pnpm docs:lint | TBD | — |

## change-summary.md

| カテゴリ | 変更 | 影響範囲 |
| --- | --- | --- |
| docs | docs/30-workflows/07c-parallel-meeting-attendance-and-admin-audit-log-workflow/ 配下 | Phase 1-12 成果物と Phase 13 承認ゲート |
| code | apps/api/src/routes/admin/attendance.ts / apps/api/src/repository/attendance.ts | attendance API 実装 |
| invariants | #5, #7, #11, #13, #15 を runbook / matrix で固定 | 後続 task 参照 |
| residual risk | audit_log 閲覧 UI 未割当 | unassigned に記録 |

## PR template

```markdown
## Summary
- Wave 7c の attendance / audit log workflow 仕様書 15 ファイルを生成
- 不変条件 #5 (admin 分離) / #7 (論理削除) / #11 (profile 直接編集なし) / #13 (admin-managed) / #15 (重複阻止) を runbook + AC matrix で固定
- audit hook を 07a / 07b と整合する命名 (`auditHook(action)`) で共通化方針を策定
- spec_created: コード変更なし、後続 task で実装

## Test plan
- [ ] doc lint pass
- [ ] markdown link check pass
- [ ] artifacts.json schema valid
- [ ] Phase 1〜13 セクション準拠 (compliance-check 参照)
- [ ] 不変条件 #5/#7/#11/#13/#15 が phase-07 / phase-09 に記述

## Related
- 上流: 04c, 06c, 02c, 03b, 02b
- 下流: 08a, 08b
- 設計: docs/30-workflows/02-application-implementation/_design/phase-2-design.md (Wave 7c)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## ブランチ / マージ戦略

```
feature/02-app-07c-attendance-audit  ──PR──>  dev  ──PR──>  main
        (本 task)                          (staging)     (production)
```

- レビュアー: 1 名（dev へのマージ）
- main マージ時は 2 名レビュー（CLAUDE.md 準拠）

## CI チェック

- docs lint / link check / artifacts.json validation を通す
- typecheck は spec 差分のみのため不要、ただしリポジトリ単位の lint は通す

## close-out チェックリスト

- [ ] user 承認あり
- [ ] local-check-result.md 配置
- [ ] change-summary.md 配置
- [ ] PR URL を outputs/phase-13/main.md に記録
- [ ] artifacts.json の phase 13 を completed に更新
- [ ] artifacts.json の最終更新日時を記録

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| 下流 08a / 08b | dev マージ後に 08a / 08b の Phase 1 着手可能 |
| Wave 9 | 09a / 09b / 09c が本 task 含む全 wave の dev マージを前提 |

## 多角的チェック観点

- 不変条件 **#5 / #7 / #11 / #13 / #15** が PR 本文に明記
- spec_created の責務として、コード差分なしを確認（git diff で `apps/`, `packages/` の差分ゼロ）
- secret hygiene: PR diff に secret 文字列なし

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | approval gate | 13 | pending | user 承認 |
| 2 | local-check-result | 13 | pending | typecheck / lint |
| 3 | change-summary | 13 | pending | diff 要約 |
| 4 | PR template | 13 | pending | 上記 PR 雛形 |
| 5 | gh pr create | 13 | pending | 承認後のみ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 結果 + URL |
| ドキュメント | outputs/phase-13/local-check-result.md | typecheck / lint 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | diff 要約 |
| ドキュメント | outputs/phase-13/pr-template.md | 上記 PR 雛形 |
| メタ | artifacts.json | phase 13 status |

## 完了条件

- [ ] user 承認あり
- [ ] 4 ドキュメント生成
- [ ] PR URL 記録
- [ ] artifacts.json の最終 phase 完了

## タスク100%実行確認【必須】

- [ ] user 承認確認
- [ ] 全成果物配置済み
- [ ] PR URL 記録
- [ ] artifacts.json の phase 13 を completed に更新
- [ ] CI green を確認

## 次 Phase

- 次: なし（本 task の最終 Phase）
- 引き継ぎ: PR URL を 08a / 08b の Phase 1 上流確認に提示
- ブロック条件: user 承認なしでは実行不可
