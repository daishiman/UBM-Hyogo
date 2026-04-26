# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 13 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 12 (ドキュメント更新) |
| 下流 Phase | （後続 Wave 1a/1b 着手可能） |
| 状態 | pending（user approval 必須） |

## 目的

ユーザー承認後に feature branch から `dev` への PR を作成する。spec phase は本リポジトリへの commit を含むが、実装 PR は別タスクで feature branch を切って行う。本 Phase では PR template と local-check の確認のみを定義する。

## ⚠️ Approval Gate

**この Phase は user の明示的承認なしに実行禁止**。承認待ちの間は status を `pending_approval` に保つ。

## 実行タスク

1. local-check 結果の取得（typecheck / lint / test）
2. change-summary 生成（差分一覧）
3. PR template 確定（title / body / 確認項目）
4. user 承認確認
5. `gh pr create` 実行（承認後のみ）
6. outputs/phase-13/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/documentation-changelog.md | 変更点 |
| 必須 | outputs/phase-12/implementation-guide.md | レビュー観点 |
| 必須 | CLAUDE.md | ブランチ戦略 |

## 実行手順

### ステップ 1: local-check
```bash
pnpm -w typecheck && pnpm -w lint && pnpm -w test
git status
git diff --stat
```

### ステップ 2: change-summary 生成

### ステップ 3: PR template 作成

### ステップ 4: user 承認確認（必須）

### ステップ 5: gh pr create（承認後のみ）

```bash
gh pr create \
  --base dev \
  --head feature/02-app-implementation-00-foundation \
  --title "feat(app/00): monorepo + shared types + UI primitives foundation" \
  --body "$(cat outputs/phase-13/pr-template.md)"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 後続 Wave 1a/1b | この PR が `dev` にマージされ次第、着手可能 |

## 多角的チェック観点（不変条件参照）

- **#1**: PR description に「型 4 層分離維持」を明記
- **#5**: PR description に「apps/web → D1 禁止 lint」を明記
- **#6**: 同 prototype 由来コード持ち込み禁止
- **#8**: 同 localStorage 非正本

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local-check | 13 | pending | 3 軸 PASS |
| 2 | change-summary | 13 | pending | 差分 stat |
| 3 | PR template | 13 | pending | outputs/phase-13/pr-template.md |
| 4 | user 承認 | 13 | pending | **必須** |
| 5 | gh pr create | 13 | pending | 承認後のみ |
| 6 | outputs 作成 | 13 | pending | outputs/phase-13/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 作成サマリー |
| ドキュメント | outputs/phase-13/pr-template.md | PR description |
| evidence | outputs/phase-13/local-check.log | typecheck/lint/test 出力 |
| evidence | outputs/phase-13/change-summary.txt | git diff --stat |
| メタ | artifacts.json | Phase 13 を completed（PR url 記録） |

## 完了条件

- [ ] user 承認取得
- [ ] local-check 3 軸 PASS
- [ ] PR が dev に作成され URL 記録
- [ ] change-summary が PR body に含まれている

## タスク 100% 実行確認【必須】

- [ ] 全 6 サブタスク completed
- [ ] outputs/phase-13/main.md と pr-template.md 配置済み
- [ ] artifacts.json に PR URL 記録
- [ ] **user 承認取得**

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項: 後続 Wave 1a/1b の着手 GO
- ブロック条件: user 承認なし

## PR Template

```markdown
## Summary
- monorepo scaffold（apps/web + apps/api + packages/shared + packages/integrations/google）の spec
- UI primitives 15 種の仕様確定（16-component-library.md 完全準拠）
- 型 4 層 placeholder（schema / response / identity / viewmodel）の export 表面確定
- ESLint rule placeholder（apps/web → D1 禁止）

## Changes
- docs/00-serial-monorepo-shared-types-and-ui-primitives-foundation/ 新規 15 ファイル
- specs/ 更新: なし
- 実装コード: なし（spec_created）

## Invariants
- #1 型 4 層分離維持
- #5 apps/web → D1 禁止 ESLint rule placeholder
- #6 GAS prototype の localStorage 依存除去
- #8 Avatar 決定論的 hue 算出（localStorage 不使用）

## Test Plan
- [ ] outputs/phase-04/test-matrix.md に従い typecheck / lint / test / scaffold-smoke 設計を確認
- [ ] outputs/phase-05/runbook.md の 6 step が順序整合
- [ ] outputs/phase-09/main.md で 4 軸 PASS の根拠確認
- [ ] outputs/phase-12/implementation-guide.md で後続 Wave 引き渡し内容確認

## Downstream Unblocked
- Wave 1a (D1 schema migrations + tag seed)
- Wave 1b (zod view models + Forms API client)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Local-check 結果（placeholder）

```bash
$ pnpm -w typecheck
# expected: exit 0
$ pnpm -w lint
# expected: exit 0
$ pnpm -w test
# expected: exit 0
```

実装完了後に上記 evidence を `outputs/phase-13/local-check.log` に保存。

## Change Summary（placeholder）

```bash
$ git diff --stat dev...feature/02-app-implementation-00-foundation
# expected: doc/02-application-implementation/00-... 配下 15 ファイル
```
