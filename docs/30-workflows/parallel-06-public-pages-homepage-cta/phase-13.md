# Phase 13: コミット / PR

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 前 Phase | 12 |
| 次 Phase | — |
| 状態 | pending_user_approval |

## 事前確認

- [x] Phase 1-12 が `completed` へ遷移済
- [x] AC-1 〜 AC-10 すべて満たす
- [x] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` GREEN
- [x] Phase 11 evidence 一式が `outputs/phase-11/` に存在

## ブランチ / コミット

- ブランチ: `feature/parallel-06-public-pages-homepage-cta`（CLAUDE.md ブランチ戦略）
- base: `dev`（既定 / production リリース時のみ `main`）

### 推奨コミット粒度

1. `feat(public): add FORM_RESPONDER_URL constant and unify register fallback`
2. `feat(public): add CallToActionCTA component with dark variant`
3. `feat(public): integrate CallToActionCTA into HomePage`
4. `test(public): add CallToActionCTA spec and HomePage order assertion`
5. `docs(parallel-06-public-pages-homepage-cta): finalize task spec phases 1-13`

> 単一 PR にまとめる前提のため、squash も許容。

## PR 作成

- **base**: `dev`
- **head**: `feature/parallel-06-public-pages-homepage-cta`
- **title 候補**: `feat(public): add FOR MEMBERS CTA section to HomePage (parallel-06)`

### PR 本文に含める項目

- Summary: HomePage に prototype 136-149 行準拠の FOR MEMBERS CTA セクションを追加。
- Related: 親ワークフロー `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-06-public-pages/spec.md` への参照
- 変更ファイル一覧: `artifacts.json` の `target_files` を転記
- スクリーンショット: `outputs/phase-11/screenshots/` 4 枚（desktop / mobile × 全体 / CTA セクション）
- Test plan:
  - [x] `pnpm typecheck` GREEN
  - [x] `pnpm lint` GREEN
  - [x] `pnpm test` GREEN（206 files / 1447 tests passed / 1 skipped）
  - [x] `pnpm build` GREEN
  - [x] local desktop / mobile screenshot で `/` の CTA セクション目視確認
  - [x] CTA リンクが Google Form URL + `target="_blank"` + `rel="noopener noreferrer"` を持つことを component spec で確認

## 承認ゲート

- ユーザーが「PR 作成」を明示指示した時のみ `gh pr create` を実行する
- 本 spec 単独では PR 作成しない（CONST_002）

## 完了条件

- PR がオープンされ CI GREEN
- レビューワーが prototype との比較を確認可能
