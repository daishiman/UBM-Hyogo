# Phase 13: commit / PR / merge


## 目的

Issue #626 RB-01 の Phase 13 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 13 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 多段承認 gate（G1-G4）

| Gate | 内容 | 必要承認 |
| --- | --- | --- |
| G1 | local PASS evidence（typecheck / lint / actionlint / regression / secret grep） | AI 自動取得可 |
| G2 | dry-run PR で `build-test` / `lighthouse-ci` PASS + duplication 0 件 | AI 自動取得可（PR push 後） |
| G3 | branch protection before/after diff = 0 件 | AI 自動取得可（read-only） |
| G4 | merge to `dev` | **user 明示承認必須** |

G4 のみ user 承認が必要。AI は merge を自動実行しない。

## commit 戦略

単一 commit 推奨（rollback 容易化のため）。`Refs #626, #608` を含める。`Closes` / `Fixes` は使わない（Issue #626 は本タスク完了後に user が手動 close する想定）。

### commit message テンプレ

```
ci(workflows): share build output between lighthouse and pr build jobs

Integrate lighthouse-ci into pr-build-test.yml as a downstream job that
downloads the next-build-${{ github.sha }} artifact uploaded by build-test.
Remove the standalone lighthouse.yml. Update RB-01 backlog status.

Refs #626, #608
```

## PR テンプレ

- base: `dev`
- title: `ci(workflows): share build output between lighthouse and pr build jobs (RB-01)`
- body:
  - ## Summary（3 bullet 以内）
  - ## Test plan（T-01 〜 T-09 の checklist）
  - ## Evidence（Phase 11 evidence path 一覧）
  - ## Rollback（Phase 10 手順引用）
  - Refs #626, #608

## merge 後アクション

1. backlog.md の RB-01 `implemented-local-runtime-pending` が `dev` に反映され、PR runtime evidence 取得後に completed/closed へ昇格できることを確認
2. Issue #626 を user が close（or AI が `gh issue close 626 --comment "Refs ..."` を user 承認後に実行）
3. workflow root の `metadata.workflow_state` を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `completed` に更新（runtime evidence 未取得の間は `completed` 禁止）
4. ディレクトリを `docs/30-workflows/completed-tasks/<category>/` 配下に移動（`completed-tasks-policy.md` 準拠）

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 13 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 1 (`phase-01.md`)
- Phase 2 (`phase-02.md`)
- Phase 5 (`phase-05.md`)
- Phase 6 (`phase-06.md`)
- Phase 7 (`phase-07.md`)
- Phase 8 (`phase-08.md`)
- Phase 9 (`phase-09.md`)
- Phase 10 (`phase-10.md`)
- Phase 11 (`phase-11.md`)
- Phase 12 (`phase-12.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-13.md`
- Phase 13 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] G1 〜 G4 すべて通過済
- PR が `dev` に merge されている
- Issue #626 が close されている
- `docs/30-workflows/completed-tasks/` へ移動済
