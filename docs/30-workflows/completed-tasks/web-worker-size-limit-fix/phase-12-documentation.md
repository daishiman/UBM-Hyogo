# Phase 12: ドキュメント同期

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
|------|-----|
| task_id | `web-worker-size-limit-fix` |
| task_type | `implementation` |
| visual_category | `NON_VISUAL` |
| workflow_state | `implemented_local_evidence_captured` |
| canonical_workflow | `docs/30-workflows/completed-tasks/web-worker-size-limit-fix/` |
| Gate-A | `passed`（spec review） |
| Gate-B / Gate-C | `pending`（実装 / external ops は user-gated） |
| 関連 Issue | なし（バックログ起票候補 1 件は unassigned-task-detection 参照） |

## 目的

ubm-hyogo-web-staging Worker の gzip 後サイズが 3316KiB となり、Cloudflare 無料プランの 3072KiB（3MiB）上限を 244KiB 超過して `[code: 10027]` で deploy 失敗した問題を解消するための、ドキュメント同期 Phase。Task A（`next/og` 撤去 → 静的 `og-default.png` 化）と Task B（OpenNext production minify 維持 + CI サイズ gate）の実装方針を、正本仕様・skill references・PR 本文へ漏れなく反映する。

## 実行タスク

1. `outputs/phase-12/main.md` を Phase 12 トップ index として作成し、strict 7 ファイルへ誘導する。
2. `outputs/phase-12/implementation-guide.md` を Part1（中学生レベル概念説明）+ Part2（技術者向け Task A/B 詳細）で作成する。
3. `outputs/phase-12/system-spec-update-summary.md` で正本仕様への反映方針を記述する。
4. `outputs/phase-12/documentation-changelog.md` で本 workflow 生成物を列挙する。
5. `outputs/phase-12/unassigned-task-detection.md` で未タスクを検出する（1 件検出）。
6. `outputs/phase-12/skill-feedback-report.md` を 3 観点固定で作成する。
7. `outputs/phase-12/phase12-task-spec-compliance-check.md` を canonical 9 見出し厳守で作成する。

## 参照資料

- `docs/00-getting-started-manual/specs/08-free-database.md`（無料プラン制約の正本）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`（Worker bundle size ガードの正本）
- `apps/web/src/lib/seo/site-metadata.ts`（実装 target）/ `apps/web/open-next.config.ts`（確認のみ）
- `.github/workflows/web-cd.yml`（CI deploy パイプライン）

## 実行手順

1. Phase 1-11 成果物と artifacts.json（root + outputs mirror）の整合を確認する。
2. strict 7 ファイルを `outputs/phase-12/` へ生成する。
3. `phase-13-pr.md` に commit/push/PR/staging deploy の user-gated blocked ルールを明記する。
4. `pnpm verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` で drift がないことを確認する。

## 多角的チェック観点（AIが判断）

- next/og 撤去後も OGP メタタグ（`og:image`）が静的 `og-default.png` を指し続けること（SEO 回帰なし）。
- production minify が OpenNext Workers 互換であり、`next build --webpack` 正本と矛盾しないこと。
- CI サイズ gate が両 deploy job（staging/production）で deploy 前段に挿入されること。
- HEX 直書き禁止・env アクセサ経由・D1 直アクセス禁止の不変条件に違反しないこと。

## サブタスク管理

| サブタスク | 区分 | 状態 |
|-----------|------|------|
| Task A: next/og 撤去 + 静的 OG 画像化 | implementation | implemented_local_evidence_captured |
| Task B: production minify 維持 + CI サイズ gate | implementation | implemented_local_evidence_captured |

## 成果物

- `phase-12-documentation.md`（本ファイル）
- `outputs/phase-12/` 配下 strict 7 ファイル

## 完了条件

- [ ] strict 7 ファイルが `outputs/phase-12/` に揃っている
- [ ] phase12-task-spec-compliance-check.md が canonical 9 見出しを逐語・順序固定で含む
- [ ] artifacts.json（root + outputs mirror）が一致している
- [ ] `verify:phase12-compliance` / `gate-metadata:validate` が PASS する

## タスク100%実行確認【必須】

- [ ] Phase 12 の全タスク（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / compliance-check）を出力した
- [ ] unassigned-task-detection を 0 件でも必ず出力した
- [ ] phase-13 に user-gated blocked ルールを明記した

## 次Phase

Phase 13（commit-pr-release）。ただし commit/push/PR/staging deploy は user 承認まで実行禁止。
