# Phase 4: 検証戦略

## 検証レイヤ

| レイヤ | 対象 | 手法 | 実行コマンド |
| ------ | ---- | ---- | ------------ |
| 文書 presence | runbook 必須見出し | bats grep assertion | `bats scripts/d1/__tests__/migration-guideline-presence.bats` |
| 既存 CI 回帰 | d1-migration-verify 既存 step | 既存 bats suite 維持 | `bats scripts/d1/__tests__/*.bats` |
| CI comment 動作 | github-script step | dry PR で post 確認 | actionlint + PR で実 post |
| Lint | YAML 構文 | `actionlint` | `actionlint .github/workflows/d1-migration-verify.yml` |
| Lint | runbook Markdown | repo lint policy 準拠 | `pnpm lint`（対象に含まれる場合） |

## テスト追加方針

- 追加: `scripts/d1/__tests__/migration-guideline-presence.bats`（新規 4 ケース）
- 既存: `scripts/d1/__tests__/*.bats` の他 file は変更しない
- spec ファイル（`*.spec.ts`）の追加なし（bash + Markdown 範疇のみのため）

## CI 動作確認方法

1. 本 PR に `apps/api/migrations/__verify__.sql`（空 dummy）等を含める or 別 small PR で migration ファイル変更を含めて手動確認
2. PR comment に runbook link bot が 1 件投稿される
3. 同 PR に追加 push しても comment が **重複せず update** される
4. `pull-requests: write` permission がない場合は post step が graceful fail し、verify job 全体は green を維持

## 完了条件

- 上記検証コマンドが Phase 9 で全 green を出せる準備が整っていること

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 4 |
| status | completed |

## 目的

実装後に何をもって green とするかを検証レイヤごとに固定する。

## 実行タスク

- bats、YAML lint、link check、apps/web diff check を定義する。
- PR comment runtime evidence を Phase 13 へ分離する。

## 参照資料

- `phase-02.md`
- `phase-09.md`

## 成果物/実行手順

Phase 9 で実行する検証コマンド一覧を確定する。

## 統合テスト連携

新規 bats test と既存 `scripts/d1/__tests__/*.bats` の回帰実行に接続する。
