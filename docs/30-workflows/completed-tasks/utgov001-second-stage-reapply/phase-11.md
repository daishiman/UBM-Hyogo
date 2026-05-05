# Phase 11: 手動 smoke / 検証（NON_VISUAL 代替 evidence）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke / 検証（NON_VISUAL 代替 evidence） |
| 作成日 | 2026-04-30 |
| 前 Phase | 10 (最終レビュー / Go-No-Go) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | implementation / governance / NON_VISUAL |
| taskType | implementation |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| user_approval_required | false（本 Phase は仕様書記述。実 PUT は Phase 13 で `user_approval_required: true`） |
| GitHub Issue | #202 (CLOSED — ユーザー指示によりクローズドのままタスク仕様書化) |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは GitHub branch protection の REST API 操作のみを対象とし、UI 実装 / API endpoint 実装 / D1 migration を一切伴わない。
  - 出力先は GitHub side の branch protection 設定（dev / main）と、本タスクの outputs（current / applied JSON / drift-check / verification-log）のみ。
  - screenshot / wrangler dev / curl / D1 SELECT は本タスクの一次証跡として **不要**。一次証跡は (a) 適用前 GET 応答 JSON、(b) dry-run 差分プレビュー（`jq diff`）、(c) 適用後 GET 応答 JSON、(d) drift 検査 6 値 `jq` 結果。
  - `outputs/phase-11/screenshots/` は **作成しない**（NON_VISUAL 整合）。
- 必須 outputs:
  - `outputs/phase-11/main.md`（NON_VISUAL 宣言 / 代替 evidence 差分表 / 申し送り先サマリー）
  - `outputs/phase-11/manual-verification-log.md`（NON_VISUAL 代替版。GitHub REST API 呼び出し / GET 応答の手動確認ログ）

## 目的

本 Phase は NON_VISUAL（UI なし）タスクのため、`phase-11-non-visual-alternative-evidence.md`（NON_VISUAL 代替 evidence プレイブック）に従い、**GitHub REST API 呼び出し / GET 応答の手動確認** で smoke / 検証を代替する。Phase 13 ユーザー承認後の実 PUT に向けた以下 4 軸の手動確認手順を本 Phase で固定する。

1. **適用前 GET の手動確認**（dev / main 別個に取得し、現行 6 値が CLAUDE.md / deployment-branch-strategy.md と一致しているかを目視）
2. **dry-run 差分プレビューの手動確認**（payload と適用前 GET の `jq diff` が contexts のみ差分であることを目視）
3. **適用後 GET の手動確認**（実 PUT 直後に GET を取得し、期待 contexts と集合一致することを目視）
4. **drift 検査の手動 diff**（CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements ci-cd の 6 値と applied JSON の `jq` 結果を手動 diff）

これらすべての確認手順を `outputs/phase-11/manual-verification-log.md` に貼付し、AC-3 / AC-5 / AC-6 / AC-7 の runtime trace は Phase 13 approval 後に完了するものとして分離する。VISUAL evidence は不要だが、**NON_VISUAL manual-evidence は必須**として代替 evidence ファイル名を明示する。

## 本 Phase でトレースする AC

- AC-3（適用前 GET の dev / main 個別取得・保全 / 手動確認）
- AC-5（dev / main 独立 PUT の REST API 成功 / applied JSON 保存 / 手動確認）
- AC-6（適用後 GET の `required_status_checks.contexts` が期待 contexts と完全一致 / 手動 diff 確認）
- AC-7（CLAUDE.md / deployment-branch-strategy.md drift 0 / 手動 diff 確認）

## 実行タスク

1. NON_VISUAL 縮約テンプレの必須3成果物（`main.md` / `manual-smoke-log.md` / `manual-verification-log.md`）を確認する。
2. 本タスク固有の詳細ログとして `manual-verification-log.md` を作成し、GitHub REST API の手動確認項目を記録する。
3. screenshot 不要根拠、実 PUT 未実行境界、Phase 13 user approval gate を明記する。
4. workflow内リンク、artifacts parity、expected contexts、payload path、drift-check path の参照整合を確認する。
5. Phase 13 へ、実 GET / PUT / GET 証跡採取の未実行項目を引き渡す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | NON_VISUAL 縮約テンプレ |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/artifacts.json | `visualEvidence=NON_VISUAL` と outputs ledger |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-02/expected-contexts-{dev,main}.json | expected contexts |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-09/drift-check.md | drift 検査 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md | user approval 後の実行手順 |

## 適用条件チェック（プレイブック適用条件 3 件）

| # | 条件 | 本タスク該当 |
| --- | --- | --- |
| 1 | UI 差分なし（API repository / library / config / boundary tooling） | 該当（GitHub branch protection 操作のみ） |
| 2 | staging 環境が未配備、または実フロー前提のシナリオが現環境で実行不能 | 該当（branch protection は production GitHub 側操作で staging 概念なし） |
| 3 | phase-11.md の S-1 〜 S-N が wrangler / dep-cruiser バイナリ / 実フォーム / 実 D1 を要求 | 該当しない（本タスクは `gh api` のみで完結。ただし実 PUT は Phase 13 ユーザー承認後で本 Phase は実行しない） |

> 条件 1 / 2 該当のため、本 Phase は NON_VISUAL 代替 evidence プレイブックを適用する。条件 3 は本 Phase スコープ外（実 PUT は Phase 13 で実施）。

## 代替 evidence の 4 階層（プレイブック準拠）

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| L1: 仕様書整合 | `pnpm typecheck` / Markdown lint / 仕様書 diff スキャン | 仕様書の構造整合性 / Phase 番号 / AC 番号 | runtime 振る舞い → Phase 13 実 PUT |
| L2: REST API GET の手動確認 | `gh api repos/{owner}/{repo}/branches/{branch}/protection` の応答 JSON 目視 + 6 値 `jq` 抽出 | GitHub 側 protection の現行値 / 適用後値 | 実 PUT の成功 → Phase 13 |
| L3: payload / applied JSON の `jq` 比較 | `jq 'sort'` 集合比較 + `jq 'del(.required_status_checks.contexts)' \| diff` | 期待 contexts と applied contexts の集合一致 / contexts 以外の不変性 | 実 PUT 操作自体 → Phase 13 |
| L4: 意図的 violation snippet | わざと `expected-contexts-{branch}.json` に workflow 名（`build-and-test.yml`）を 1 行混ぜ、L3 集合一致検証が **fail** することを確認 | 「赤がちゃんと赤になる」 | 実 PUT 後の事故検出 → Phase 13 rollback ゲート |

## 必須テンプレ: 代替 evidence 差分表

> `outputs/phase-11/main.md` に以下を必ず含める。

| Phase 11 シナリオ（VISUAL タスクの元前提） | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 | UI 画面で branch protection 設定状態を確認 | `gh api repos/{owner}/{repo}/branches/dev/protection` GET の手動確認 | 適用前 dev 6 値の現行状態（AC-3） | Phase 13 実取得 |
| S-2 | UI 画面で main の同設定確認 | `gh api repos/{owner}/{repo}/branches/main/protection` GET 手動確認 | 適用前 main 6 値の現行状態（AC-3） | Phase 13 実取得 |
| S-3 | UI で payload preview | `jq '. | sort' expected-contexts-dev.json` と `jq '.required_status_checks.contexts | sort' payload-dev.json` の手動 diff | dry-run 差分プレビュー（contexts 反映確認） | Phase 13 で実 PUT 直前 |
| S-4 | UI で適用後の状態確認 | 適用後 GET（`gh api ... > applied-{branch}.json`）の手動確認 + 集合一致検証（AC-5 / AC-6） | applied JSON の contexts と期待 contexts の集合一致 | Phase 13 で実 PUT 直後 |
| S-5 | UI で drift（CLAUDE.md と差分）確認 | `jq '.enforce_admins.enabled, .allow_force_pushes.enabled, ...'` で 6 値抽出 + CLAUDE.md grep 結果と手動 diff | drift 検査 6 値（AC-7） | Phase 13 直後 / drift 検出時 B-01 起票 |
| S-6 | 意図的 violation で red 確認（L4） | わざと `expected-contexts-dev.json` に workflow 名（`build-and-test.yml`）を 1 行追加 → L3 比較式が fail することを目視 | 「赤がちゃんと赤になる」 | （L3 で吸収済） |
| S-7 | rollback 経路の確認 | UT-GOV-001 rollback payload path への参照確認 + `gh api -X PUT --input <path>` コマンド形式の目視確認（実行はしない） | rollback 即応性（AC-8 / AC-10） | Phase 13 失敗時 |

## 必須チェック（プレイブック準拠）

- [ ] 代替 evidence で **何を保証し**、**何を保証できないか** を上表で明示
- [ ] 保証できない項目はすべて Phase 13 / blocker B-01〜B-04 / `unassigned-task-detection.md`（Phase 12 で実施）に申し送り済
- [ ] L4（意図的 violation → red 確認）を 1 件以上記述
- [ ] `outputs/phase-11/manual-verification-log.md` に「NON_VISUAL のため screenshot 不要」を明記
- [ ] Phase 12 implementation-guide.md の §「やってはいけないこと」に typo context 違反例（workflow 名混入）を含める旨を申し送り
- [ ] token 値 / `op://...` 参照の **値** は記録しない（Secret hygiene）。マスクして「`op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN`（admin scope 必須）」の参照のみ記述

## NON_VISUAL 系 Phase 11 outputs 構成

| ファイル | 役割 | 必須項目 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言 / 代替 evidence 差分表 / 申し送り先 / 既知制限 | `visualEvidence: NON_VISUAL`、L1〜L4 結果サマリ、保証できない範囲 |
| `outputs/phase-11/manual-smoke-log.md` | NON_VISUAL 縮約テンプレ必須の手動 smoke log | 実行コマンド / 期待結果 / 実測 / PASS or FAIL。実 PUT は Phase 13 へ defer |
| `outputs/phase-11/manual-verification-log.md` | NON_VISUAL 縮約テンプレ必須の手動検証計画 | approval 後の GET / PUT / diff 手順と placeholder 境界 |
| `outputs/phase-11/link-checklist.md` | 補助リンク検証 | workflow内リンク / artifacts parity / SKILL参照の状態 |
| `outputs/phase-11/manual-verification-log.md` | 本タスク固有の GitHub REST API 呼び出し / GET 応答の手動確認ログ | 実行コマンド・終了コード・所要時間・実行者・実行日時 / 6 値 `jq` 結果 / 集合一致 diff 結果 |

> `outputs/phase-11/screenshots/.gitkeep` は **作成しない**（NON_VISUAL 整合）。

## 検証ログ記録方法

`outputs/phase-11/manual-verification-log.md` に以下のセクション構成で記録する。

```
# Phase 11 manual-verification-log

> NON_VISUAL のため screenshot 不要。
> token 値・`op://...` 参照値は本ログに記録しない（Secret hygiene）。

## §L1 仕様書整合
- [日時 / 実行者 / コマンド / exit code / stdout 抜粋]

## §L2 適用前 GET（dev）
- コマンド: `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > outputs/phase-13/branch-protection-current-dev.json`
- 6 値 `jq` 抽出結果（マスクなし。値そのものは GitHub 側正本のため記録可）
- CLAUDE.md / deployment-branch-strategy.md との手動 diff 結果

## §L2 適用前 GET（main）
- 同上（main 用）

## §L3 dry-run 差分プレビュー（dev）
- `jq` 比較式と diff 結果

## §L3 dry-run 差分プレビュー（main）
- 同上

## §L3 適用後 GET（dev）
- コマンド・期待 contexts との集合一致 diff 結果

## §L3 適用後 GET（main）
- 同上

## §L3 適用前後 GET 差分検証（contexts 以外完全一致）
- dev / main それぞれの `jq 'del(...)' | diff` 結果

## §L4 意図的 violation snippet
- 仮想シナリオ・期待 fail 結果

## §drift 検査 6 値
- 6 値の `jq` 結果と CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements ci-cd の期待値との手動 diff

## §rollback 経路の目視確認
- UT-GOV-001 rollback payload path 確認・コマンド形式確認（実行はしない）

## §既知制限・申し送り先
- Phase 13 実 PUT、blocker B-01〜B-04 への委譲
```

## 実行手順

### ステップ 1: L1 仕様書整合（typecheck / lint / 仕様書 diff）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

- 期待値: exit 0。本タスクはコード変更を伴わないため typecheck / lint は既存 green を維持。
- 仕様書 diff スキャン: index.md と phase-XX.md の AC 番号 / Phase 番号 / 採用結論表記が一致しているか目視 + `rg 'AC-1[0-4]|AC-[1-9]\b'` で確認。

### ステップ 2: 適用前 GET の手動確認（dev / main 別個）

```bash
# dev
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  -H "Accept: application/vnd.github+json" \
  > outputs/phase-13/branch-protection-current-dev.json

# main
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  > outputs/phase-13/branch-protection-current-main.json

# 6 値抽出
jq '{
  required_pull_request_reviews,
  enforce_admins: .enforce_admins.enabled,
  required_linear_history: .required_linear_history.enabled,
  required_conversation_resolution: .required_conversation_resolution.enabled,
  allow_force_pushes: .allow_force_pushes.enabled,
  allow_deletions: .allow_deletions.enabled
}' outputs/phase-13/branch-protection-current-dev.json
```

- 期待値: 6 値が `null` / `true` / `true` / `true` / `false` / `false`（CLAUDE.md / deployment-branch-strategy.md と一致）。
- 不一致時は drift 検出として `manual-verification-log.md` に記録、blocker B-01 へ register。
- **本 Phase では実取得を仕様書化のみ**。実 GET は Phase 13 ユーザー承認後に実行。

### ステップ 3: dry-run 差分プレビューの手動確認

```bash
# payload と期待 contexts の集合一致（dev / main 別個）
jq '. | sort' outputs/phase-02/expected-contexts-dev.json > /tmp/expected-dev.sorted.json
jq '.required_status_checks.contexts | sort' outputs/phase-13/branch-protection-payload-dev.json > /tmp/payload-dev.contexts.sorted.json
diff /tmp/expected-dev.sorted.json /tmp/payload-dev.contexts.sorted.json
# 期待: 差分ゼロ

# payload と適用前 GET の差分が contexts のみであることを確認
jq 'del(.required_status_checks.contexts)' outputs/phase-13/branch-protection-current-dev.json > /tmp/current-dev.no-contexts.json
jq 'del(.required_status_checks.contexts)' outputs/phase-13/branch-protection-payload-dev.json > /tmp/payload-dev.no-contexts.json
diff /tmp/current-dev.no-contexts.json /tmp/payload-dev.no-contexts.json
# 期待: 差分ゼロ（contexts 以外は不変）
```

- 上記検証式の正本は Phase 9（DRY 化済）。本 Phase は §参照のみ。
- 不一致時は Phase 2 設計へ差し戻し。

### ステップ 4: 適用後 GET の手動確認

```bash
# Phase 13 ユーザー承認後の実 PUT 直後に取得
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-13/branch-protection-applied-dev.json

# 集合一致検証（Phase 9 § 期待 contexts 集合一致検証 §参照）
jq '.required_status_checks.contexts | sort' outputs/phase-13/branch-protection-applied-dev.json > /tmp/applied-dev.sorted.json
diff /tmp/expected-dev.sorted.json /tmp/applied-dev.sorted.json
# 期待: 差分ゼロ
```

- 期待値: `required_status_checks.contexts` が期待 contexts と集合一致（順序不問）。
- 不一致時は即時 rollback（Phase 5 §参照）。

### ステップ 5: drift 検査の手動 diff

```bash
# applied JSON の 6 値 vs CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements ci-cd 期待値
jq '{
  required_pull_request_reviews,
  enforce_admins: .enforce_admins.enabled,
  required_linear_history: .required_linear_history.enabled,
  required_conversation_resolution: .required_conversation_resolution.enabled,
  allow_force_pushes: .allow_force_pushes.enabled,
  allow_deletions: .allow_deletions.enabled
}' outputs/phase-13/branch-protection-applied-dev.json

# CLAUDE.md grep
rg 'required_pull_request_reviews|enforce_admins|required_linear_history|required_conversation_resolution|allow_force_pushes|allow_deletions' CLAUDE.md
```

- drift 検出時は `outputs/phase-09/drift-check.md` および `outputs/phase-11/manual-verification-log.md` に記録、blocker B-01 へ register。

### ステップ 6: L4 意図的 violation snippet（red 確認）

- 仮想的に `expected-contexts-dev.json` に workflow 名（`build-and-test.yml` / `.github/workflows/ci.yml`）を 1 行追加した場合、Phase 9 集合一致検証が hit して fail することを目視確認（実際の追加はしない）。
- 「赤がちゃんと赤になる」を `manual-verification-log.md` に記録。

## 既知制限のリスト化

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | 本 Phase 11 では実 PUT を行わない（仕様書記述のみ） | runtime 適用 | Phase 13 ユーザー承認後に実 PUT |
| 2 | CLAUDE.md / deployment-branch-strategy.md drift 検出時の追従更新は別タスク | docs 同期 | blocker B-01 |
| 3 | aiworkflow-requirements references / indexes の実更新は別タスク | references 同期 | blocker B-02 |
| 4 | UT-GOV-004 成果物に重複 / workflow 名混入があった場合の修正 | 上流仕様 | blocker B-03 |
| 5 | UT-GOV-005〜007 の起票（本タスク完了後） | 後続 governance | blocker B-04 |
| 6 | 1 PUT 失敗時の即時 rollback の実行は Phase 13 で実施 | runtime rollback | Phase 13 / Phase 5 ランブック |
| 7 | NON_VISUAL のため screenshot ベースの evidence は採取しない | UI evidence | NON_VISUAL 整合 |

## 申し送り先サマリー（保証できない範囲）

| 保証できない項目 | 申し送り先 |
| --- | --- |
| 実 PUT 操作の成功 | Phase 13（ユーザー承認後） |
| 実 PUT 直後の applied JSON 取得 | Phase 13 |
| CLAUDE.md / deployment-branch-strategy.md drift 検出時の追従更新 | blocker B-01 |
| aiworkflow-requirements references / indexes の実更新 | blocker B-02 |
| UT-GOV-004 成果物の不整合修正 | blocker B-03 |
| UT-GOV-005〜007 の起票 | blocker B-04 |
| 1 PUT 失敗時の rollback 実行 | Phase 13 / Phase 5 ランブック |

## 自動テスト結果サマリー

> 本タスクはコード変更を伴わないため、自動テスト（unit / contract / integration / authz）は **該当なし**。既存 CI（typecheck / lint / vitest / verify-indexes）の green を維持することのみ確認。

| 種別 | 状態 | 備考 |
| --- | --- | --- |
| typecheck | 既存 green 維持 | コード変更なし |
| lint | 既存 green 維持 | コード変更なし |
| vitest | 既存 green 維持 | コード変更なし |
| verify-indexes-up-to-date | 既存 green 維持（drift 検出時は blocker B-02 へ） | 本タスクで indexes 更新なし |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | NON_VISUAL 代替 evidence 採取結果を unassigned-task-detection / documentation-changelog に転記 |
| Phase 13 | 代替 evidence サマリー + 検証ログを PR description / 実 PUT 直前直後の確認手順に転記。本 Phase の手順は Phase 13 で実行される |
| 別タスク（B-01〜B-04） | 申し送り先サマリー経由で保証できない範囲を委譲 |

## 多角的チェック観点

- 価値性: 代替 evidence で `contexts=[]` 解消の整合性が証明されているか。
- 実現性: NON_VISUAL 範囲で `gh api` + `jq` + `diff` のみで完結するか。
- 整合性: 不変条件 6 値が手動 diff で確認可能になっているか。
- 運用性: 保証できない範囲が blocker / Phase 13 に申し送られているか。
- dev / main 独立性: 手動確認手順が dev → main 順 / 別個実行になっているか。
- 集合一致原則: 順序不問の `jq 'sort' | diff` が手順に含まれているか。
- typo context 防止: L4 意図的 violation snippet で workflow 名混入の検出可能性が確認されているか。
- Secret hygiene: token 値 / `op://...` 参照値が `manual-verification-log.md` に記録されない原則が記述されているか。
- PR 自動実行禁止: 本 Phase で実 PUT を行わない原則が記述されているか。
- NON_VISUAL 整合: `outputs/phase-11/screenshots/` が **作成されていない** か。
- L4 violation: 「赤がちゃんと赤になる」確認が記述されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | NON_VISUAL 適用条件チェック | 11 | spec_created | 条件 1 / 2 該当 |
| 2 | 代替 evidence 4 階層（L1〜L4）採取手順 | 11 | spec_created | プレイブック準拠 |
| 3 | 代替 evidence 差分表（7 シナリオ） | 11 | spec_created | main.md |
| 4 | L1 typecheck / lint 既存 green 確認手順 | 11 | spec_created | コード変更なし |
| 5 | L2 適用前 GET 手動確認手順（dev / main 別個） | 11 | spec_created | manual-verification-log §L2 |
| 6 | L3 dry-run 差分プレビュー手動確認手順 | 11 | spec_created | Phase 9 §参照 |
| 7 | L3 適用後 GET 手動確認手順 | 11 | spec_created | 集合一致 diff |
| 8 | L3 適用前後 GET 差分検証手順 | 11 | spec_created | contexts 以外不変 |
| 9 | drift 検査 6 値 手動 diff 手順 | 11 | spec_created | manual-verification-log §drift |
| 10 | L4 意図的 violation snippet（red 確認） | 11 | spec_created | 仮想 / 目視 |
| 11 | 既知制限リスト（7 件以上） | 11 | spec_created | Phase 13 / B-01〜B-04 委譲 |
| 12 | 申し送り先サマリー | 11 | spec_created | 保証できない範囲 |

## manual evidence（NON_VISUAL 代替版・実採取時の placeholder）【必須】

| 項目 | コマンド / 確認 | 採取先 | 採取済 |
| --- | --- | --- | --- |
| typecheck 既存 green | `mise exec -- pnpm typecheck` | manual-verification-log.md §L1 | TBD |
| lint 既存 green | `mise exec -- pnpm lint` | §L1 | TBD |
| 仕様書 AC / Phase 番号整合 | `rg 'AC-1[0-4]\|AC-[1-9]\b' docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` | §L1 | TBD |
| 適用前 GET（dev） | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` | §L2-dev | TBD |
| 適用前 GET（main） | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` | §L2-main | TBD |
| dry-run 差分プレビュー（dev） | `jq` 集合 diff + `jq 'del(...)' \| diff` | §L3-dev | TBD |
| dry-run 差分プレビュー（main） | 同上（main） | §L3-main | TBD |
| 適用後 GET（dev） | Phase 13 実 PUT 後に `gh api ...` | §L3-applied-dev | TBD |
| 適用後 GET（main） | Phase 13 実 PUT 後に `gh api ...` | §L3-applied-main | TBD |
| 集合一致検証（dev） | `diff <(jq sort expected) <(jq sort applied)` | §L3-dev | TBD |
| 集合一致検証（main） | 同上（main） | §L3-main | TBD |
| 適用前後 GET 差分検証（contexts 以外完全一致） | `jq 'del(...)' \| diff` | §L3 | TBD |
| drift 検査 6 値 | `jq` 6 値抽出 + CLAUDE.md grep + 手動 diff | §drift | TBD |
| L4 意図的 violation 仮想確認 | grep / jq が hit する条件の目視確認 | §L4 | TBD |
| rollback 経路の目視確認 | UT-GOV-001 rollback payload path 確認 | §rollback | TBD |
| NON_VISUAL screenshot 不要宣言 | 文言記載 | manual-verification-log.md 冒頭 | TBD |

> 各セクションには「コマンド」「実行日時」「stdout / stderr 抜粋」「期待値との一致 / 不一致」を記録。
> token 値・`op://...` 参照値は **記録しない**（Secret hygiene）。実値出力ゼロを維持する。

## 既知制限リスト【必須】

> 上記「既知制限のリスト化」セクションと同一。再掲のためここでは省略し、`main.md` には完全版を転記する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | NON_VISUAL 宣言 / 代替 evidence 差分表 / 申し送り先 / 既知制限 |
| ログ | outputs/phase-11/manual-smoke-log.md | NON_VISUAL 縮約テンプレ必須の手動 smoke log |
| 手動検証 | outputs/phase-11/manual-verification-log.md | approval 後の GET / PUT / diff 手順 |
| リンク | outputs/phase-11/link-checklist.md | 補助: workflow内リンク / artifacts parity / SKILL参照チェック |
| 詳細ログ | outputs/phase-11/manual-verification-log.md | L1〜L4 整合性検査ログ + GitHub REST API 呼び出し / GET 応答の手動確認ログ + drift 検査 6 値 + rollback 経路目視確認 |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `manual-verification-log.md` の必須3ファイルが揃っている（`link-checklist.md` は補助成果物）
- [ ] NON_VISUAL 適用条件 1 / 2 が該当することが確認されている
- [ ] 代替 evidence 4 階層（L1〜L4）すべて採取手順記述
- [ ] 代替 evidence 差分表が 7 シナリオで埋まっている
- [ ] L4（意図的 violation → red 確認）が 1 件以上記述（workflow 名混入 → 集合一致 fail）
- [ ] manual evidence テーブル（16 項目）すべての採取列が完了（または各 N/A 理由が記載）
- [ ] 適用前 GET / 適用後 GET / drift 検査の手動 diff 手順が dev / main 別個に記述（AC-3 / AC-5 / AC-6 / AC-7 は Phase 13 approval 後に runtime evidence 化）
- [ ] 既知制限が 7 項目以上列挙され、それぞれ委譲先（Phase 13 / blocker B-01〜B-04）が記述
- [ ] 申し送り先サマリーで保証できない範囲が漏れなく blocker / Phase 13 に register
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] `manual-verification-log.md` 冒頭に「NON_VISUAL のため screenshot 不要」明記
- [ ] token 値・`op://...` 参照値を記録しない原則が記述（Secret hygiene）
- [ ] 本 Phase で実 PUT を行わない原則が記述（実 PUT は Phase 13 ユーザー承認後）

## タスク 100% 実行確認【必須】

- 全実行タスク（12 件）が `spec_created`
- 成果物 4 ファイルが `outputs/phase-11/` 配下に配置される設計になっている
- 実 PUT が Phase 13 へ委譲されることが明記
- 実コード / migration / references / indexes 更新が blocker B-01〜B-04 へ委譲されることが明記
- 本 Phase で手順を準備する AC（AC-3 / AC-5 / AC-6 / AC-7）が完了条件に含まれ、runtime evidence は Phase 13 approval 後に限定される
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - NON_VISUAL 代替 evidence 採取手順（L1〜L4）を Phase 12 unassigned-task-detection / documentation-changelog に転記
  - 既知制限 7 項目を Phase 12 implementation-guide.md に取り込み（特に実 PUT は Phase 13 / 実コード撤回は blocker B-01〜B-04 委譲）
  - 申し送り先サマリー（保証できない範囲）を Phase 12 で blocker register
  - L4 意図的 violation snippet（workflow 名混入 → 集合一致 fail）パターンを Phase 12 implementation-guide.md §「やってはいけないこと」に転記
  - 手動 diff 手順を Phase 13 実 PUT 直前直後の確認手順として継承
- ブロック条件:
  - manual evidence の項目に未採取 / 未 N/A 化が残っている
  - L4 の意図的 violation snippet が記述されていない
  - `screenshots/` ディレクトリが誤って作成されている
  - 既知制限が 5 件未満
  - 保証できない範囲が blocker / Phase 13 に申し送られていない
  - 本 Phase 内で実 PUT を行う方針が混入している
  - token 値・`op://...` 参照値が `manual-verification-log.md` に記録されている
