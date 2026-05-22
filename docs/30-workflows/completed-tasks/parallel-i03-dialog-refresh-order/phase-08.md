# Phase 08: ドキュメント更新

## 更新対象ドキュメント

| Path | 更新内容 |
|------|----------|
| docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i03-dialog-refresh-order/spec.md | スコープ確定ノート: status を `pending → completed`、canonical_workflow に本 root path を記載 |
| docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-02-state-sync/ 関連 | §4.2 順序ルールの実装完了リンク追加（既存記述は触らず脚注で言及） |
| docs/30-workflows/parallel-i03-dialog-refresh-order/outputs/phase-08/docs-updates.md | 本 phase 主成果物 |

## 不変条件への影響

- CLAUDE.md の不変条件は変更不要（D1 直接アクセス・getEnv 等への影響なし）
- 親 spec の §4.2 ルールには変更を加えない（実装側で順守する形）

## skill / 設定ファイルへの影響

- `.claude/skills/*` への影響なし
- `lefthook.yml` への影響なし
- GitHub Actions workflow への影響なし

## changelog

`outputs/phase-12/documentation-changelog.md` に下記を記録:

- `parallel-i03-dialog-refresh-order` workflow root を新設
- profile request dialog で `router.refresh()` を dialog 内で先発火するパターンを採用
- parent (`RequestActionPanel`) は refresh 発火責務から解放

## DoD

- [x] `outputs/phase-08/docs-updates.md` に更新対象一覧と差分意図を記載
- [x] 親 spec 側に completion marker を追記（Phase 12 内で実行済み）
