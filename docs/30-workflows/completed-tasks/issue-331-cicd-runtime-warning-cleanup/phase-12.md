# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 12 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## 目的

実装結果を仕様書 / skill references / changelog に同期し、aiworkflow-requirements の current facts と整合させる。

## 必須 7 ファイル

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 サマリー |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念説明）+ Part 2（技術者向け） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 仕様書同期サマリー（deployment-gha.md / environment-variables.md の差分） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 更新履歴 + supersede 関係 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 派生タスク列挙 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | skill 検証 4 条件と feedback |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance evidence |

## 変更対象ファイル（skill references）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 編集 | web-cd の `pages deploy` → `scripts/cf.sh deploy --config apps/web/wrangler.toml` 経路に書き換え |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 編集 | `CLOUDFLARE_PAGES_PROJECT` 項に「Workers 移行後は未参照（廃止候補）」と注記 |

## Part 1（中学生レベル概念説明）骨子

`implementation-guide.md` の冒頭に必須:

- 「変数の置き場所が 2 つあると、どっちが本当か CI が文句を言う」（vars 重複の説明）
- 「アプリの形が変わった（ページ → ワーカー）のに、配るスクリプトが古いままだった」（Pages → Workers 不整合の説明）
- 「会社のルールで、配るときは決まった台所（scripts/cf.sh）を必ず通すことにした」（不変条件の説明）

## supersede 関係

| supersede 対象 | 関係 |
| --- | --- |
| `docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md` | 本タスクで完全実装し supersede |
| UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION | Workers deploy 経路採用で結論済みとして supersede |

## 派生タスク（unassigned-task-detection.md）

- OIDC / step-scoped `CF_TOKEN_*` cutover（現行 `web-cd.yml` は `CLOUDFLARE_API_TOKEN` を継続）
- `CLOUDFLARE_PAGES_PROJECT` Variable の削除
- staging Pages project の dashboard / API 経由削除
- API Token のスコープ最小化監査（既存 issue がある場合は追跡）

## same-wave sync ルール

aiworkflow-requirements の `indexes/` 配下（resource-map / topic-map / keywords）への影響を監査し、該当する場合は同 PR で更新する。`pnpm indexes:rebuild` を Phase 13 前に実行する。

## 完了条件

- [ ] 7 ファイルが揃っている
- [ ] skill references の更新内容が記載されている
- [ ] supersede 関係が明記されている
- [ ] 派生タスクが列挙されている
- [ ] same-wave sync チェックが完了している

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 依存Phase参照

- Phase 2: `phase-02.md` / `outputs/phase-02/main.md`
- Phase 5: `phase-05.md` / `outputs/phase-05/main.md`
- Phase 6: `phase-06.md` / `outputs/phase-06/main.md`
- Phase 7: `phase-07.md` / `outputs/phase-07/main.md`
- Phase 8: `phase-08.md` / `outputs/phase-08/main.md`
- Phase 9: `phase-09.md` / `outputs/phase-09/main.md`
- Phase 10: `phase-10.md` / `outputs/phase-10/main.md`
- Phase 11: `phase-11.md` / `outputs/phase-11/main.md`
