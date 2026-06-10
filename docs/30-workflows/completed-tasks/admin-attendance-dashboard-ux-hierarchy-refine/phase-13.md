# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 上流 | Phase 12（ドキュメント更新） |
| 下流 | なし（最終 Phase） |
| 状態 | pending（user 承認待ち） |
| user_approval_required | **true** |
| base ブランチ | `dev` |

## 目的

実装サイクル完了後、本タスクの全変更を 1 つの PR として `dev` ブランチへ作成する。**commit / PR / push はユーザーの明示承認後のみ実行する**。承認がない限り本 Phase は blocked のまま維持する。PR 本文は Phase 12 の `implementation-guide.md` を反映し、VISUAL タスクとして Phase 11 の screenshot canonical 名を参照する。

## 実行タスク

1. **PR 前ローカル検証**: `outputs/phase-13/local-check-result.md` の想定コマンド（`pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`）を PR 作成直前に再実行する。現時点では focused vitest / typecheck / lint / token gate / task-spec strict gate が PASS。
2. **変更概要の確定**: `outputs/phase-13/change-summary.md` に実変更を記録する（実装後に埋める）。
3. **PR 本文作成**: `outputs/phase-13/pr-template.md` をベースに、`implementation-guide.md` の内容と Phase 11 screenshot 参照を反映する。
4. **PR 作成**: **ユーザー承認後のみ** `gh pr create --base dev` で作成する。

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/component-map.md` / `outputs/phase-02/layout-blueprint.md` | PR 変更概要で設計意図を説明 |
| Phase 5 | `outputs/phase-05/main.md` / `outputs/phase-05/runbook.md` | 実装対象・手順を change-summary に反映 |
| Phase 6 | `outputs/phase-06/main.md` / `outputs/phase-06/failure-cases.md` | テスト結果欄の境界ケースとして反映 |
| Phase 7 | `outputs/phase-07/main.md` / `outputs/phase-07/ac-matrix.md` | PR AC チェックリストの根拠 |
| Phase 8 | `outputs/phase-08/main.md` / `outputs/phase-08/before-after.md` | リファクタ要約を PR 本文に反映 |
| Phase 9 | `outputs/phase-09/main.md` / `outputs/phase-09/token-audit.md` | PR 前品質ゲート結果へ反映 |

## ブロック条件（厳守）

| # | 条件 |
| --- | --- |
| 1 | commit / PR / push は **ユーザーの明示承認後のみ**実行する。 |
| 2 | 承認がない限り本 Phase は **blocked**。実装 diff は存在するが commit / push / PR は user 明示承認後のみ。 |
| 3 | base ブランチは `dev`。本タスクは relatedIssue=null（staging 観察起点）・production リリースを伴わないため `--base main` は使用しない。 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/implementation-guide.md | PR 本文（Phase 13 仕様）の主ソース |
| 必須 | outputs/phase-11/screenshot-plan.json | PR 本文の screenshot 参照 canonical 名 |
| 必須 | outputs/phase-10/go-no-go.md | Go 判定 / Phase 13 blocked 条件 |
| 必須 | `.claude/commands/ai/diff-to-pr.md` | PR 作成の完全自律フロー仕様 |
| 必須 | CLAUDE.md「PR作成の完全自律フロー」 | base=dev / 品質検証 4 コマンド |

## 実行手順

### ステップ 1: PR 前ローカル検証（実装サイクル完了後）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

- 失敗時は最大 3 回まで自動修復し、修復差分をコミットする（CLAUDE.md フロー準拠）。
- VISUAL タスク固有: `verify-design-tokens`（HEX 0 件）が PASS であることを確認する。

### ステップ 2: PR 本文作成

- `outputs/phase-13/pr-template.md` のタイトル案・背景・変更内容・AC チェックリスト・screenshot 参照・テスト結果欄を埋める。
- `outputs/phase-11/screenshots/` に実 capture がある場合は PR 本文に画像参照を含める。capture がない場合は screenshot 専用セクションを残さない（CLAUDE.md フロー準拠）。

### ステップ 3: PR 作成（ユーザー承認後のみ）

```bash
git diff dev...HEAD --name-only   # PR に含まれるファイル一覧
gh pr create --base dev --title "<pr-template.md のタイトル案>" --body-file <PR 本文>
```

## 多角的チェック観点（AIが判断）

| 観点 | 確認内容 |
| --- | --- |
| base ブランチ | `dev` であること（`main` ではない） |
| 承認境界 | commit / PR がユーザー承認後にのみ実行されること |
| AC-7 diff | `apps/api` / `packages/shared` の diff が 0 件で PR に含まれないこと |
| screenshot 参照整合 | PR 本文の画像参照数が `outputs/phase-11/screenshots/` の実 capture 数と一致すること（capture 無しなら screenshot セクション無し） |
| implementation-guide 反映 | PR 本文に implementation-guide の主要見出しが漏れなく反映されること |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | PR 前ローカル検証想定 | 13 | pending | local-check-result.md |
| 2 | 変更概要テンプレート | 13 | pending | change-summary.md |
| 3 | PR 本文テンプレート | 13 | pending | pr-template.md |
| 4 | PR 作成（user 承認後） | 13 | pending | gh pr create --base dev |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 総括・承認境界 |
| ドキュメント | outputs/phase-13/local-check-result.md | PR 前ローカル検証コマンド想定（未実行記録） |
| ドキュメント | outputs/phase-13/change-summary.md | 変更概要テンプレート（実装後に埋める） |
| ドキュメント | outputs/phase-13/pr-template.md | PR 本文テンプレート |

## 完了条件

- [ ] `outputs/phase-13/{main,local-check-result,change-summary,pr-template}.md` が実体ファイルとして存在する
- [ ] commit / PR / push が user 明示承認後のみである旨が明記されている
- [ ] base ブランチ = `dev` が明記されている
- [ ] PR 本文テンプレートに AC チェックリスト・screenshot 参照欄・テスト結果欄がある
- [x] ローカル検証の実行済み範囲と PR 作成未実行の承認境界が記録されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜3 が完了している（4 は user 承認後）
- [ ] outputs/phase-13/* の 4 ファイルが配置済み
- [ ] 承認境界（commit/PR は user 承認後のみ）が複数箇所に明記されている
- [ ] base=dev / relatedIssue=null / `--base main` 不使用が記録されている
- [ ] artifacts.json の Phase 13 が pending / user_approval_required=true に整合している

## 次Phase

- 次: なし（最終 Phase）
- 引き継ぎ事項: PR URL（作成後）/ 採用ブランチ / 自動修復記録 / 残課題
- ブロック条件: ユーザー承認がない限り PR 作成を実行しない（blocked 維持）
