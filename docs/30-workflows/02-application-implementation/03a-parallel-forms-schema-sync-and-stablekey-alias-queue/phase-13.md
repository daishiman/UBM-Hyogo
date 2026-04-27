# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 12（ドキュメント更新） |
| 次 Phase | なし |
| 状態 | pending（user 承認待ち） |

## ユーザー承認確認文（冒頭必須）

- この Phase は **ユーザーの明示承認** が得られた場合のみ実行する。
- 承認なしで `gh pr create` を実行しない。
- branch は `feature/sync-schema-spec` を想定。

## 目的

承認後に PR を 1 本作成し、本タスクの成果物（index.md / artifacts.json / phase-01〜13 / outputs）をレビュー可能な単位でまとめる。

## 実行タスク

1. local check（typecheck / lint / test / build）を実行し結果を `outputs/phase-13/local-check-result.md` に保存。
2. change summary を `outputs/phase-13/change-summary.md` に作成。
3. PR template（title / body）を準備する。
4. ユーザー承認後、`gh pr create` を実行する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/documentation-changelog.md | PR description 素材 |
| 必須 | outputs/phase-10/main.md | GO/NO-GO 結果 |
| 必須 | outputs/phase-11/manual-evidence.md | smoke evidence |
| 必須 | doc/02-application-implementation/_templates/phase-template-app.md | テンプレ準拠 |

## 実行手順

### ステップ 1: local check
```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
- 結果を outputs/phase-13/local-check-result.md にコピー（exit code, 失敗時の log）。

### ステップ 2: change-summary
- 後述「change-summary template」を参照。

### ステップ 3: PR template 準備
- 後述「PR template」を参照。

### ステップ 4: PR 作成（承認後のみ）
```bash
gh pr create --base dev --head feature/sync-schema-spec \
  --title "docs(app): 03a forms schema sync and stableKey alias queue spec" \
  --body "$(cat outputs/phase-13/change-summary.md)"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| - | 本 Phase で task は閉じる |
| 並列 03b | 共通モジュールの review を相互レビュー |
| Wave 4c | PR merge 後に endpoint 実装着手 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| schema 集約 | #14 | endpoint 一覧が PR description にある |
| stableKey 直書き禁止 | #1 | review checklist で確認 |
| 無料枠 | #10 | free-tier estimate へリンク |
| apps/api 限定 | #5 | 触るパスが apps/api 配下のみ |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check 実行 | 13 | pending | 4 コマンド |
| 2 | change-summary 作成 | 13 | pending | - |
| 3 | PR template 準備 | 13 | pending | title + body |
| 4 | 承認待ち | 13 | pending | user 明示承認 |
| 5 | gh pr create 実行 | 13 | pending | 承認後 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 作成記録 |
| ドキュメント | outputs/phase-13/local-check-result.md | local check log |
| ドキュメント | outputs/phase-13/change-summary.md | PR description 本文 |
| メタ | artifacts.json | phase 13 を `completed` に更新（PR URL 記録） |

## 完了条件

- [ ] ユーザー承認の根拠（log / message）が記録
- [ ] local check が green
- [ ] PR が作成され URL が記録
- [ ] artifacts.json の phase 13 が `completed`

## タスク100%実行確認【必須】

- [ ] local check 4 コマンドすべて green
- [ ] change-summary が作成
- [ ] PR template が準備
- [ ] 承認後のみ PR 作成
- [ ] artifacts.json の phase 13 が `completed`

## 次 Phase

- なし。本 Phase で task close-out。

## change-summary template

```markdown
## Summary

- 03a-parallel-forms-schema-sync-and-stablekey-alias-queue の spec_created 完了
- 15 ファイル新規生成（index / artifacts / phase-01〜13）
- 主要設計: forms.get → flatten → resolve stableKey → schema_versions / schema_questions upsert + schema_diff_queue 投入
- 不変条件 #1, #5, #6, #7, #10, #14 を満たす

## 影響範囲

- specs 変更: なし
- code 変更: なし（spec のみ）
- D1 schema 変更: なし（01a に依存）
- secret 追加: なし

## downstream

- 04c-parallel-admin-backoffice-api-endpoints が `POST /admin/sync/schema` の handler を実装
- 07b-parallel-schema-diff-alias-assignment-workflow が `schema_diff_queue` の resolve を実装

## test plan

- [ ] phase-01〜13 のセクション網羅確認
- [ ] AC-1〜AC-8 の matrix 確認
- [ ] 不変条件 6 件のマッピング確認
```

## PR タイトル / 本文 雛形

| 項目 | 内容 |
| --- | --- |
| title | docs(app): 03a forms schema sync and stableKey alias queue spec |
| base | dev |
| head | feature/sync-schema-spec |
| reviewer | 1 名 |

## CI チェック

- docs lint
- link check
- markdown lint
- pnpm typecheck / lint / test（spec のみだが workspace 全体で green を維持）

## close-out チェックリスト

- [ ] ユーザー承認あり
- [ ] local-check-result.md がある
- [ ] change-summary.md がある
- [ ] Phase 12 close-out 済み
- [ ] PR URL が artifacts.json に記録された
