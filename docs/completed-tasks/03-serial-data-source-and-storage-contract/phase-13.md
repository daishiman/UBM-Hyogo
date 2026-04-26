# Phase 13: PR作成

## ユーザー承認確認文 (冒頭必須)

- 本 Phase は **ユーザーの明示承認がある場合のみ** 実行する。承認なしでの PR 作成・push は禁止。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR作成 |
| 作成日 | 2026-04-23 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |
| タスク種別 | NON_VISUAL |
| implementation_mode | new |
| user_approval_required | true |

## 目的

Phase 12 までの成果物を `feature/* → dev → main` のブランチ戦略に沿って PR 化し、CI と review を通過させる。

## ブランチ戦略（CLAUDE.md 準拠）

```
feature/* --PR--> dev --PR--> main
  (local)       (staging)   (production)
```

| ブランチ | 環境 | レビュー |
| --- | --- | --- |
| `feature/*` | localhost | 不要 |
| `dev` | Cloudflare staging | 1名 |
| `main` | Cloudflare production | **2名** |

- 本タスクは docs 中心のため `feature/docs/03-data-contract` 系ブランチから `dev` へ PR を出す。
- `main` への昇格は別 PR とし 2 名レビューを必須とする。

## 実行タスク

- 変更サマリーを生成する
- PR タイトル / body を雛形から作成する
- CI（typecheck / lint / test / docs link check）を通す
- close-out チェックリストを満たす

## PR タイトル / body 雛形

| 項目 | 内容 |
| --- | --- |
| title | `docs(infra/03): finalize data-source-and-storage-contract` |
| base | `dev` |
| head | `feature/docs/03-data-contract` |

PR body テンプレ:

```
## Summary
- Sheets→D1 data contract / sync flow / runbook を確定
- Phase 11 evidence と Phase 12 必須6成果物を同梱

## Changes
- doc/03-serial-data-source-and-storage-contract/* 更新
- aiworkflow-requirements 参照同期（必要時）

## Test plan
- [ ] pnpm typecheck
- [ ] pnpm lint
- [ ] pnpm test
- [ ] docs link check
- [ ] artifacts.json JSON validate

## Risks / Rollback
- docs-only。rollback は revert PR で対応。
```

## CI チェック項目

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- docs link check / artifacts.json validate

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | CLAUDE.md | ブランチ戦略 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 方針 |
| 必須 | outputs/phase-12/documentation-changelog.md | PR body 反映元 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | 6成果物を PR body / 添付に同梱 |
| Phase 11 | evidence のリンクを PR body に貼る |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認取得 | 13 | pending | 明示承認必須 |
| 2 | branch 作成 / push | 13 | pending | feature/docs/03-* |
| 3 | PR 作成 | 13 | pending | base=dev |
| 4 | CI / review 完了 | 13 | pending | 2名 (main 昇格時) |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| ドキュメント | outputs/phase-13/local-check-result.md | CI / lint ローカル結果 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

依存Phase 2 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10: `outputs/phase-02/data-contract.md` / `outputs/phase-05/d1-bootstrap-runbook.md` / `outputs/phase-06/failure-cases.md` / `outputs/phase-07/coverage-matrix.md` / `outputs/phase-08/refactor-record.md` / `outputs/phase-09/qa-report.md` / `outputs/phase-10/final-review-result.md`

依存成果物参照: `outputs/phase-02/data-contract.md` / `outputs/phase-05/d1-bootstrap-runbook.md` / `outputs/phase-06/failure-cases.md` / `outputs/phase-07/coverage-matrix.md` / `outputs/phase-08/refactor-record.md` / `outputs/phase-09/qa-report.md` / `outputs/phase-10/final-review-result.md`

- [ ] ユーザー明示承認済み
- [ ] PR が `dev` に向けて作成され CI PASS
- [ ] close-out チェックリスト全 PASS

## close-out チェックリスト

- [ ] ユーザー承認あり
- [ ] outputs/phase-13/local-check-result.md がある
- [ ] outputs/phase-13/change-summary.md がある
- [ ] Phase 12 close-out 済み
- [ ] CI 全 PASS
- [ ] main 昇格 PR には 2 名レビュー

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: なし
- 引き継ぎ事項: 下流タスク（04 / 05a / 05b）に契約確定を共有。
- ブロック条件: 承認・CI 未完了なら main 昇格を行わない。
