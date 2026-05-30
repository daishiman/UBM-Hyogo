<!-- workflow: members-list-ux-clarity / task: B / phase: 13 -->

[実装区分: 実装仕様書]

# Phase 13 — PR作成 (Task B)

> 前提: Phase 12 完了 / **user の明示承認後のみ実施**

## 1. 実施条件

- user から「PR作成」または同等の明示指示があること
- 親 workflow の Task A / B / C のうち、本タスク (B) 単独で PR を出すか、3 タスクまとめて出すかは user 判断に従う
- CLAUDE.md の「PR作成の完全自律フロー」既定方針に従う (base ブランチ既定: `dev`)

## 2. PR base ブランチ

- 既定: `dev`
- production リリース時のみ `main`

## 3. 事前検証

CLAUDE.md `PR作成の完全自律フロー` § 5 の通り:

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

## 4. PR 本文骨子

- Summary: Task B の 3 主目的 (live-filter hint / aria-live 件数 / SelectedFiltersBar 統一 chip 列 + clear 統合)
- Test plan: Phase 5 § 7 のコマンド一式
- スクリーンショット: Phase 11 § 2 の任意 screenshot を参照 (なければセクション省略)
- 不変条件遵守: URL query / API / D1 schema / 新 primitive いずれも変更なし

## 5. 出力

`outputs/phase-13/pr-creation-result.md` に以下を記録:

- PR URL
- 採用ブランチ / base ブランチ
- 自動修復した内容
- 解消したコンフリクト
- 残課題

## 6. DoD

- [ ] user の明示承認を受領
- [ ] § 3 検証 4 コマンドが GREEN
- [ ] `git diff dev...HEAD --name-only` が PR ファイル一覧と一致
- [ ] `outputs/phase-13/pr-creation-result.md` 作成
