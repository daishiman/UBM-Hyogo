# Phase 9: 品質保証

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

## QA チェックリスト

| 項目 | 判定基準 |
|------|---------|
| line budget | 各 phase-N.md が 200 行以内 |
| link 有効性 | `INVARIANT-AUDIT.md` 内の file:line リンクが現存ファイルを指す |
| read-only 担保 | `git diff apps/ packages/` が空 |
| matrix 完備 | 132 セル全埋め |
| evidence 保存 | `outputs/phase-5/grep-evidence.txt` が存在し空でない |

## mirror parity

`.claude/skills/` 配下は本タスクで触らない（mirror 同期対象外）。

## メタ情報
- Phase: 9 / 品質保証
- State: completed

## 目的
監査成果物、正本同期、read-only DoD を品質 gate として確認する。

## 実行タスク
- Phase 5 evidence の存在を確認する。
- artifacts parity を確認する。
- apps/packages 差分 0 を確認する。

## 参照資料
- `artifacts.json`
- `outputs/artifacts.json`
- `outputs/phase-5/`

## 成果物
- `phase-9.md`

## 完了条件
- [x] Phase 5 evidence が存在する
- [x] artifacts parity が成立する
- [x] apps/packages 差分がない

## 統合テスト連携
Phase 12 の `verify:phase12-compliance` と汎用 phase validator に接続する。
