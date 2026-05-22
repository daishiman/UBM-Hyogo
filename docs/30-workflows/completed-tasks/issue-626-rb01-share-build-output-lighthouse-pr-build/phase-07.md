# Phase 7: レビュー観点


## 目的

Issue #626 RB-01 の Phase 7 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 7 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## レビュー必須観点

1. **trust 境界**: `pr-build-test.yml` の `permissions: {}` / `secrets 非注入` / `persist-credentials: false` が維持されているか
2. **job 名不変**: `build-test` / `lighthouse-ci` が status check 名と完全一致しているか
3. **artifact 共有経路**: `actions/upload-artifact` / `actions/download-artifact` が同一 `${{ github.sha }}` 名で結合され、`needs:` で順序保証されているか
4. **build 重複除去**: `lighthouse-ci` job 内に `pnpm ... build` が含まれていないこと
5. **削除整合**: `.github/workflows/lighthouse.yml` が完全削除されており、参照する他 workflow / docs が `pr-build-test.yml` 側へ正しくリダイレクトされているか
6. **SHA pinning**: 新規 step の action が SHA pinning されているか（UT-GOV-007）
7. **backlog 同期**: `docs/30-workflows/e2e-quality-uplift/backlog.md` の RB-01 status が更新されているか
8. **branch protection**: `contexts` 配列の drift がないこと

## レビュー対象差分

```
.github/workflows/pr-build-test.yml   # 編集
.github/workflows/lighthouse.yml      # 削除
docs/30-workflows/e2e-quality-uplift/backlog.md  # 編集
docs/30-workflows/issue-626-rb01-share-build-output-lighthouse-pr-build/**  # 仕様書一式
```

## レビュー観点の非対象

- Lighthouse 閾値変更 / 認証付き計測（EXT-X1） は本 PR の対象外
- composite action 化（RB-02） は本 PR の対象外

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 7 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 5 (`phase-05.md`)
- Phase 6 (`phase-06.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-07.md`
- Phase 7 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] Phase 7 の実行タスクが本文に反映されている。
- [ ] 参照資料と成果物が矛盾していない。
