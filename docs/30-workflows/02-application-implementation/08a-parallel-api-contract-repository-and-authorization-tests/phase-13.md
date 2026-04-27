# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## ユーザー承認確認文 (冒頭必須)

**この Phase は user の明示承認がある場合のみ実行する。** 承認なしで `gh pr create` を呼ぶことは禁止。

## 目的

仕様書一式を `feature/02-app-08a-api-tests` ブランチに配置し、`dev` への PR を作成。spec_created なのでコード変更なし、docs only。

## 実行タスク

- [ ] approval gate
- [ ] local-check-result.md
- [ ] change-summary.md
- [ ] PR template
- [ ] gh pr create（承認後のみ）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/* | PR 本文素材 |
| 必須 | CLAUDE.md | ブランチ戦略 |

## approval gate

| チェック | 状態 |
| --- | --- |
| user 明示承認 | TBD |
| Phase 12 全成果物配置 | TBD |
| Phase 11 smoke 全 pass | TBD |
| Phase 10 GO 判定 | TBD |
| 不変条件 #1/#2/#5/#6/#7/#11 カバー | TBD |

## local-check-result.md

```bash
pnpm typecheck
pnpm lint
pnpm docs:lint
# spec_created なのでコード差分なし、docs lint のみ必須
```

| コマンド | exit | 備考 |
| --- | --- | --- |
| pnpm typecheck | TBD | 差分なしなら 0 |
| pnpm lint | TBD | 差分なしなら 0 |
| pnpm docs:lint | TBD | markdown link / heading |

## change-summary.md

| カテゴリ | 変更 | 影響 |
| --- | --- | --- |
| docs | 08a 配下 15 ファイル | spec のみ、コードなし |
| invariants | #1/#2/#5/#6/#7/#11 を test 戦略に固定 | 後続実装が test 化 |
| residual | visual regression 未割当 | unassigned に記録 |

## PR template

```markdown
## Summary
- Wave 8a の API contract / repository / authorization / type / lint test 戦略 15 ファイル
- 不変条件 #1 (schema 固定しすぎない) / #2 (responseEmail system field) / #5 (3 層分離) / #6 (apps/web → D1 禁止) / #7 (論理削除) / #11 (profile 編集なし) を test 戦略として固定
- in-memory sqlite + msw + vitest 構成、coverage 閾値 statements 85% / branches 80%
- spec_created: コード変更なし、後続 task で実装

## Test plan
- [ ] doc lint pass
- [ ] markdown link check pass
- [ ] artifacts.json schema valid
- [ ] Phase 1〜13 必須セクション準拠
- [ ] 不変条件 #1/#2/#5/#6/#7/#11 が phase-04 / phase-07 / phase-09 に test として記述

## Related
- 上流: 06a, 06b, 06c, 07a, 07b, 07c
- 下流: 09a, 09b
- 設計: doc/02-application-implementation/_design/phase-2-design.md (Wave 8a)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## ブランチ / マージ戦略

```
feature/02-app-08a-api-tests  ──PR──>  dev  ──PR──>  main
```

- dev へのマージ: 1 名レビュー
- main マージ: 2 名レビュー

## CI チェック

- docs lint / link check / artifacts.json validation

## close-out チェックリスト

- [ ] user 承認
- [ ] local-check-result.md 配置
- [ ] change-summary.md 配置
- [ ] PR URL を outputs/phase-13/main.md に記録
- [ ] artifacts.json phase 13 completed
- [ ] artifacts.json 最終更新日時記録

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| 下流 09a / 09b | dev マージ後に着手可 |

## 多角的チェック観点

- 不変条件 **#1/#2/#5/#6/#7/#11** PR 本文に明記
- spec_created の責務として code 差分なし確認
- secret hygiene: PR diff に secret 文字列なし

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | approval gate | 13 | pending | user 承認 |
| 2 | local-check-result | 13 | pending | typecheck / lint / docs |
| 3 | change-summary | 13 | pending | diff |
| 4 | PR template | 13 | pending | 上記雛形 |
| 5 | gh pr create | 13 | pending | 承認後のみ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 結果 + URL |
| ドキュメント | outputs/phase-13/local-check-result.md | typecheck / lint |
| ドキュメント | outputs/phase-13/change-summary.md | diff |
| ドキュメント | outputs/phase-13/pr-template.md | 雛形 |
| メタ | artifacts.json | phase 13 status |

## 完了条件

- [ ] user 承認
- [ ] 4 ドキュメント生成
- [ ] PR URL 記録

## タスク100%実行確認【必須】

- [ ] user 承認確認
- [ ] 全成果物配置
- [ ] PR URL 記録
- [ ] artifacts.json phase 13 completed
- [ ] CI green

## 次 Phase

- 次: なし
- 引き継ぎ: PR URL を 09a / 09b へ
- ブロック条件: user 承認なしで実行不可
