# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## ユーザー承認確認文（冒頭必須）

- 本 Phase はユーザーの明示承認がある場合のみ実行する
- 承認なしで `gh pr create` 等を実行しない
- 承認確認テンプレ: 「04c の Phase 12 まで完了。`feature/04c-admin-backoffice-api-endpoints` ブランチで PR 作成して良いか」

## 目的

15 ファイルの新規仕様書群を `feature/04c-admin-backoffice-api-endpoints` ブランチで PR 化する。`feature → dev → main` フローに従い、staging への merge を 1 名 review、main への merge を 2 名 review でゲートする。

## 実行タスク

1. ローカル check（local-check-result.md）
2. change-summary.md 作成
3. user 承認確認
4. PR 作成（CI が green になるまで待つ）
5. 同 Wave (04a / 04b) との conflict 検査

## Approval gate

- [ ] user 承認のテキスト確認済み
- [ ] Phase 12 のすべての成果物が green
- [ ] AC matrix に空欄ゼロ（AC-1〜AC-11）
- [ ] 不変条件 #4, #5, #11, #12, #13, #14, #15 が phase-07 で trace 済み
- [ ] 同 Wave 04a / 04b の命名と衝突なし
- [ ] 上流 02a / 02b / 02c / 03a / 03b の AC 引き渡し記述あり

## Local check result

| 項目 | コマンド | 期待 | 結果 |
| --- | --- | --- | --- |
| ファイル数 | `find . -name "phase-*.md" -o -name "index.md" -o -name "artifacts.json" \| wc -l` | 15 | TBD |
| markdown lint | `pnpm lint:md` | エラーゼロ | TBD |
| link check | `pnpm lint:links` | 404 ゼロ | TBD |
| artifacts.json schema | `jq . artifacts.json` | parse 成功 | TBD |
| AC matrix 空欄チェック | grep で TBD 検出 | 空欄ゼロ | TBD |
| endpoint count | `grep -c '^| \(GET\|POST\|PATCH\|DELETE\)' phase-02.md` | 18 | TBD |

## Change summary

| 種別 | 内容 |
| --- | --- |
| 新規ファイル | docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/index.md |
| 新規ファイル | docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/artifacts.json |
| 新規ファイル | phase-01.md 〜 phase-13.md (13 個) |
| 影響範囲 | apps/api/src/routes/admin/* 実装の前提固定（コードは別タスク） |
| residual risk | R-1〜R-5 (Phase 10 参照) |
| blocker | B-1〜B-6 (Phase 10 参照、5 上流 wave + 05a) |

## PR タイトル / 本文 雛形

| 項目 | 内容 |
| --- | --- |
| title | docs(app): admin backoffice API endpoints task spec (04c) |
| target branch | dev |
| reviewers | 1 名 |

PR 本文（HEREDOC 用）:

```
## Summary
- 04c-parallel-admin-backoffice-api-endpoints の 13 phase 仕様書を新規追加
- `/admin/dashboard`, `/admin/members*`, `/admin/tags/queue*`, `/admin/schema/*`, `/admin/meetings*`, `/admin/sync/*` の 18 endpoint API spec を確定
- 不変条件 #4 / #11 / #12 / #13 / #14 / #15 を構造的に保証
  - PATCH /admin/members/:memberId/profile 不在
  - PATCH /admin/members/:memberId/tags 不在（queue resolve のみ）
  - schema 操作を /admin/schema/* の 2 endpoint に集約
  - response list に notes 不在（detail のみ admin context）
  - attendance UNIQUE (sessionId, memberId) 制約

## Out of scope
- 実装コードの追加
- Auth.js provider 設定（05a）
- admin gate middleware 実装（05a）
- UI 実装（06c / 07a / 07b / 07c）

## Dependencies (blockers)
- 02a, 02b, 02c, 03a, 03b の repository / job 提供
- 05a の admin gate helper（consumer 想定 mock を本タスクで用意）

## Test plan
- [ ] Phase 1〜13 の AC matrix 完全性（AC-1〜AC-11）
- [ ] 同 Wave (04a / 04b) との命名整合
- [ ] 上流 02a / 02b / 02c / 03a / 03b の AC 引き渡し記述あり
- [ ] 18 endpoint すべてに zod schema 定義
- [ ] failure case F-1〜F-20 がすべて AC trace 済み

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## CI チェック

- docs lint（markdown）
- link check（相対パス）
- required validation（artifacts.json の schema parse）
- 同 Wave conflict 検査（branch base が 04a / 04b と分離）

## Close-out checklist

- [ ] user 承認あり
- [ ] outputs/phase-13/local-check-result.md 配置
- [ ] outputs/phase-13/change-summary.md 配置
- [ ] Phase 12 close-out 済み
- [ ] artifacts.json の Phase 13 を completed に更新
- [ ] PR URL を user に報告

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | CLAUDE.md | branch 戦略 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | 同 Wave 整合 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 05a | dev merge 後に admin gate middleware を本タスクの consumer 想定 mock で置換 |
| 06c / 07a / 07b / 07c | dev merge 後に UI wave が consume |
| 08a | dev merge 後に test wave が consume |

## 多角的チェック観点（不変条件マッピング）

- #4 / #11 / #12 / #13 / #14 / #15: PR 説明本文で「これらが構造的に保証されている」を明示
- #5: 「apps/web → D1 直接 import を本タスクで一切追加していない」を明示
- #10: 無料枠 1% 未満を PR 説明に明示

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check | 13 | pending | outputs/phase-13/local-check-result.md |
| 2 | change summary | 13 | pending | outputs/phase-13/change-summary.md |
| 3 | user 承認待ち | 13 | pending | 明示承認テキスト確認 |
| 4 | PR 作成 | 13 | pending | 承認後のみ |
| 5 | close-out | 13 | pending | checklist 全 pass |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 主成果物 |
| ドキュメント | outputs/phase-13/local-check-result.md | local check 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| メタ | artifacts.json | Phase 13 を completed に更新 |

## 完了条件

- [ ] user 承認確認済み
- [ ] local check 全 green
- [ ] change summary に residual risk と blocker 記述
- [ ] PR URL を user に報告
- [ ] close-out checklist 全 pass

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 13 を completed に更新

## 次 Phase

- 次: なし
- 引き継ぎ事項: dev branch merge 後に 05a / 05b / 06c / 07a / 07b / 07c / 08a の wave が本タスクの仕様書を入力として消費
- ブロック条件: user 承認なし、または local check fail なら PR 作成しない
