# Phase 10: rollback 設計


## 目的

Issue #626 RB-01 の Phase 10 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 10 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## rollback トリガ

- `lighthouse-ci` job が 3 連続で flaky 失敗（artifact download / server start 起因）
- `build-test` の artifact upload が timeout で job 全体を tail で遅延させる
- branch protection contexts 不整合により merge 不能

## rollback 手順

1. `pr-build-test.yml` から `lighthouse-ci` job と `Upload Next.js build output` step を removal
2. `.github/workflows/lighthouse.yml` を元の内容で復元（git revert または手動再作成）
3. `docs/30-workflows/e2e-quality-uplift/backlog.md` の RB-01 を `open` に戻す
4. branch protection `contexts` は変更していないため触らない

## rollback コマンド例

```bash
# 単一 commit で導入していれば revert 一発
git revert <merge-commit-or-impl-commit>
git push origin <branch>
gh pr create --base dev --title "revert: roll back RB-01 build sharing (Refs #626)"
```

## rollback 後 follow-up

- `docs/30-workflows/unassigned-task/` 配下に再挑戦タスクを起票
- flaky 原因（download timeout / start-up race 関連項目）を analytics で特定してから再着手

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 10 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 1 (`phase-01.md`)
- Phase 2 (`phase-02.md`)
- Phase 5 (`phase-05.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-10.md`
- Phase 10 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] rollback 経路がドキュメント化されている
- rollback は単一 revert で復帰可能な実装構造を Phase 5 で保つ（複数 commit に分割しない）
