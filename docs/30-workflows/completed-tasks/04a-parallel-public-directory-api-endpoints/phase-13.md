# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 12（ドキュメント更新） |
| 次 Phase | なし |
| 状態 | pending |

## ユーザー承認確認文（冒頭必須）

- 本 Phase はユーザーの明示承認がある場合のみ実行する
- 承認なしで `gh pr create` 等を実行しない
- 承認確認テンプレ:「04a の Phase 12 まで完了。`feature/04a-public-directory-api-endpoints` ブランチで PR 作成して良いか」

## 目的

15 ファイルの新規仕様書群を `feature/04a-public-directory-api-endpoints` ブランチで PR 化する。`feature → dev → main` フローに従い、staging（dev branch）への merge を 1 名 review、production（main branch）への merge を 2 名 review でゲートする。本タスクは spec_created なので実装コードは含まず、仕様書のみが diff 対象。

## 実行タスク

1. ローカル check（local-check-result.md）
2. change-summary.md 作成
3. user 承認確認
4. PR 作成（CI が green になるまで待つ）
5. 同 Wave（04b / 04c）との conflict 検査
6. close-out

## Approval gate

- [ ] user 承認のテキスト確認済み
- [ ] Phase 12 のすべての成果物が green
- [ ] AC matrix（Phase 7）に空欄ゼロ
- [ ] 不変条件 #2 / #3 / #11 が phase-07 で trace 済み
- [ ] 同 Wave 04b / 04c の命名と衝突なし
- [ ] leak test report（Phase 9）の 10 ケース placeholder 配置済み
- [ ] 公開境界（session middleware 不適用）が Phase 5 sanity check で確認済み

## Local check result

| 項目 | コマンド | 期待 | 結果 |
| --- | --- | --- | --- |
| ファイル数 | `find . -name "phase-*.md" -o -name "index.md" -o -name "artifacts.json" \| wc -l` | 15 | TBD |
| markdown lint | `pnpm lint:md` | エラーゼロ | TBD |
| link check | `pnpm lint:links` | 404 ゼロ | TBD |
| artifacts.json schema | `jq . artifacts.json` | parse 成功 | TBD |
| AC matrix 空欄チェック | grep で TBD 検出 | leak 系で空欄ゼロ | TBD |
| 同 Wave conflict | branch 比較 | router / 命名衝突なし | TBD |

## Change summary

| 種別 | 内容 |
| --- | --- |
| 新規ファイル | docs/30-workflows/04a-parallel-public-directory-api-endpoints/index.md |
| 新規ファイル | docs/30-workflows/04a-parallel-public-directory-api-endpoints/artifacts.json |
| 新規ファイル | phase-01.md 〜 phase-13.md（13 個） |
| 影響範囲 | apps/api/src/routes/public/* 実装の前提固定（コードは別タスク） |
| residual risk | R-1〜R-7（Phase 10 参照） |
| 不変条件保証 | #2 / #3 / #11 を構造的に保証（公開フィルタ + view converter 二重 + 404 で存在隠蔽） |

## PR タイトル / 本文 雛形

| 項目 | 内容 |
| --- | --- |
| title | docs(app): public directory API endpoints task spec (04a) |
| target branch | dev |
| reviewers | 1 名（dev へは 1 名、main 統合時に 2 名） |
| labels | `docs`, `wave-4`, `spec-created` |

PR 本文（HEREDOC 用）:

```
## Summary
- 04a-parallel-public-directory-api-endpoints の 13 phase 仕様書を新規追加
- `/public/stats`, `/public/members`, `/public/members/:memberId`, `/public/form-preview` の API spec を確定
- 不変条件 #2 / #3 / #11 を構造的に保証（publicConsent='consented' のみ表現 + responseEmail/rulesConsent/adminNotes を view converter で delete + 不適格 member は 404 で隠蔽）
- 不変条件 #5 を遵守（apps/web から D1 への直接アクセスを追加せず、本 API 経由に統一）
- 不変条件 #10 を満たす（無料枠見積もり 0.17%、write 0、stats / form-preview のみ 60s cache）
- 不変条件 #14 を遵守（form-preview は schema_questions から動的構築、enum 直書き禁止）

## Out of scope
- 実装コードの追加
- web 側 UI（06a 担当）
- admin の publishState 設定 UI（04c 担当）
- 同期 job（03a / 03b 担当）
- Auth.js provider 設定（05a 担当）

## Test plan
- [ ] Phase 1〜13 の AC matrix 完全性
- [ ] 同 Wave（04b / 04c）との命名整合
- [ ] 上流 02a / 02b / 03b / 01b の AC 引き渡し記述あり
- [ ] leak test report 10 ケース placeholder の配置確認

## Residual risk
- R-1: 検索 LIKE 性能（MVP 規模では許容）
- R-2: form-preview と admin sync の整合（client refresh）
- R-3: 公開フィルタ漏れ（SQL + view 二重チェックで防御）
- R-4: D1 一時障害時の 5xx（503 統一）
- R-5: cache hit 時の即時反映遅延（stats / form-preview のみ 60s 許容）
- R-6: OPTIONS preflight の browser 依存（CORS middleware で吸収）
- R-7: 04b / 04c との helper 共通化（Phase 8 で守るべき境界明示）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## CI チェック

- docs lint（markdown）
- link check（相対パス）
- required validation（artifacts.json の schema parse）
- 同 Wave conflict 検査（branch base が 04b / 04c と分離）

## Close-out checklist

- [ ] user 承認あり
- [ ] outputs/phase-13/local-check-result.md 配置
- [ ] outputs/phase-13/change-summary.md 配置
- [ ] Phase 12 close-out 済み
- [ ] artifacts.json の Phase 13 を `completed` に更新
- [ ] PR URL を user に報告
- [ ] 04b / 04c との conflict が 0 件であることを確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | CLAUDE.md | branch 戦略 |
| 必須 | docs/30-workflows/_design/phase-2-design.md | 同 Wave 整合 |
| 必須 | outputs/phase-12/documentation-changelog.md | PR 本文 source |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 06a | dev merge 後に UI wave が consume |
| 08a | dev merge 後に contract / leak test wave が consume |
| 08b | dev merge 後に E2E wave が consume |
| 04b / 04c | 同 Wave で共通 lib（error type / paginationMeta / app.onError）の最終確定 |

## 多角的チェック観点（不変条件マッピング）

- #2 / #3 / #11: PR 説明本文で「これらが構造的に保証されている」を明示
- #5: 「apps/web → D1 直接 import を本タスクで一切追加していない」を明示
- #10: 無料枠 0.17% を PR 説明に明示
- #14: 「form-preview の field 数を hardcode していない」を明示

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check | 13 | pending | outputs/phase-13/local-check-result.md |
| 2 | change summary | 13 | pending | outputs/phase-13/change-summary.md |
| 3 | user 承認待ち | 13 | pending | 明示承認テキスト確認 |
| 4 | PR 作成 | 13 | pending | 承認後のみ |
| 5 | 同 Wave conflict 検査 | 13 | pending | 04b / 04c |
| 6 | close-out | 13 | pending | checklist 全 pass |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 主成果物 |
| ドキュメント | outputs/phase-13/local-check-result.md | local check 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| メタ | artifacts.json | Phase 13 を `completed` に更新 |

## 完了条件

- [ ] user 承認確認済み
- [ ] local check 全 green
- [ ] change summary に residual risk 記述
- [ ] PR URL を user に報告
- [ ] close-out checklist 全 pass

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 全完了条件チェック
- [ ] artifacts.json の Phase 13 を `completed` に更新

## 次 Phase

- 次: なし
- 引き継ぎ事項: dev branch merge 後に 06a / 08a / 08b の wave が本タスクの仕様書を入力として消費
- ブロック条件: user 承認なし、leak test placeholder 不在、または local check fail なら PR 作成しない
