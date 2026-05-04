# Phase 2: 設計

## 変更対象ファイル一覧

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `.github/workflows/ci.yml` | 条件付き編集 | legacy cleanup 完了後、`ci` job に `Lint stableKey strict` step を追加 |
| `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/index.md` | 条件付き編集（Phase 12） | strict 0 violations + CI gate 追加後のみ `enforced_dry_run` → `enforced` に更新 |
| `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/implementation-guide.md` | 条件付き編集（Phase 12） | strict 0 violations + CI gate 追加後のみ AC-7 を `fully enforced` に更新 |
| `.claude/skills/aiworkflow-requirements/indexes/*` / `references/*` | 編集 | 現行 blocker と completed-tasks 配下の prerequisite path を正本化 |

## ci.yml 差分設計

legacy cleanup により `pnpm lint:stablekey:strict` が exit 0 になった後、`ci` job の `Lint` step（既存 `pnpm lint`）の直後に以下 step を追加する:

```yaml
      - name: Lint stableKey (strict)
        if: steps.ready.outputs.value == 'true'
        run: pnpm lint:stablekey:strict
```

設計判断:

- 配置位置: 既存 `Lint` step 直後。`pnpm lint` が早期失敗してもこの step が実行されるかは GitHub Actions の既定挙動（前 step が fail すれば後続 step は skip）に依存し、それで OK（root cause が lint なら strict も走らせる必要なし）。早期失敗の救済が必要な場合は `if: always() && steps.ready.outputs.value == 'true'` を将来検討。
- `continue-on-error` は付けない（blocking gate）。現行 148 violations のまま追加しない。
- 既存 `ci` job 内に組み込むことで required status context 名（`ci`）を維持し、branch protection 変更不要。
- 新 job 化しないのは、新 context 名 drift / branch protection PUT が発生し scope out に抵触するため。

## 関数・モジュールシグネチャ

該当なし（YAML 設定 + 既存 mjs スクリプトの呼び出しのみ）。

## 入力 / 出力 / 副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | `pnpm lint:stablekey:strict` 実行時のリポジトリ全体ファイル |
| 出力 | exit code（0 / 非 0）、stdout（違反一覧） |
| 副作用 | CI のみ（コードベース無変更） |

## required_status_checks 整合戦略

- `gh api repos/daishiman/UBM-Hyogo/branches/main/protection/required_status_checks` と `.../dev/...` を Phase 9 / 11 で実行し `contexts` に `ci` が含まれることを確認。
- PUT は禁止（scope out）。drift があれば aiworkflow-requirements 側 doc 更新と Phase 12 unassigned-task 化で対応。

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-02/main.md
- outputs/phase-02/ci-yml-diff-design.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 2 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 2: 設計 の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

## 実行タスク

- 現行 148 violations を前提に、CI を壊す変更を実行しない。
- cleanup 後に実行する作業と、今回実体化する evidence を分離する。
- AC / 依存関係 / Phase 12 strict outputs との整合を確認する。

## 参照資料

- docs/30-workflows/issue-394-stablekey-strict-ci-gate/index.md
- docs/30-workflows/completed-tasks/task-03a-stablekey-strict-ci-gate-001.md
- docs/30-workflows/completed-tasks/task-03a-stablekey-literal-legacy-cleanup-001.md
- .github/workflows/ci.yml
- package.json
- scripts/lint-stablekey-literal.mjs

## 成果物/実行手順

- 対応する `outputs/phase-02/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
