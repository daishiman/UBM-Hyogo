# Phase 12: Phase 12 compliance & 完了判定

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 | 前 | 11 | 次 | 13 |
| 状態 | completed |
| 区分 | implementation / VISUAL |

## 0. このタスクが何をするのか（中学生にもわかる説明）

このタスクは、ホームページを「SNS で共有したときに見栄えのする説明と画像が出るようにする」ものです。

たとえば LINE や X（旧 Twitter）に `https://ubm-hyogo.daishimanju.workers.dev/` のような URL を貼り付けると、いまは「UBM Hyogo」という小さなタイトルしか出ません。これだと何のサイトかわかりません。

このタスクを終えると、URL を貼ったときに次の 3 つが自動で出るようになります:

1. **サイトの大きな画像（OG image）** — 1200×630 ピクセルの画像で「UBM 兵庫支部会」と書いてある
2. **タイトル** — 「ホーム | UBM 兵庫支部会」「メンバー一覧 | UBM 兵庫支部会」のようにページごとに変わる
3. **説明文** — 「兵庫を拠点に活動する UBM 支部会のメンバーディレクトリと活動紹介」のような短い説明

それから、Google や Bing といった検索エンジンに「このサイトのこのページは検索結果に出していいですよ」「テスト用の staging 環境は検索結果に出さないでください」と伝えるためのファイル（`sitemap.xml` と `robots.txt`）も自動で作ります。

仕組みは Next.js という Web フレームワークが持っている「特別なファイル名のルール」を使います。`app/sitemap.ts` というファイルを置くと自動で `/sitemap.xml` というアドレスができる、というルールです。実装者はその関数を書くだけで、URL の配信は Next.js が自動でやってくれます。

## 1. Phase 12 必須 7 outputs path 事前チェック

以下 7 ファイルを `outputs/phase-12/` 配下に配置すること。1 件でも欠落すれば FAIL。

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `main.md` | このファイル（Phase 12 結果サマリ） |
| 2 | `implementation-guide.md` | 後続実装者向け実装ガイド（PR 本文の Phase 13 入力） |
| 3 | `phase12-task-spec-compliance-check.md` | Phase 12 compliance チェック結果 |
| 4 | `system-spec-update-summary.md` | system spec 更新有無（本タスクでは更新なし → no-op を明記） |
| 5 | `skill-feedback-report.md` | task-specification-creator skill への feedback |
| 6 | `unassigned-task-detection.md` | 派生 followup（動的 OG image / member detail OG image 等）の検出 |
| 7 | `documentation-changelog.md` | 本タスクで触れた docs の差分一覧 |

## 2. Phase 12 必須 9 セクション（canonical heading SSOT）

`main.md` 本体に以下 9 見出しを **そのままの文字列** で含めること（CI gate `verify-phase12-compliance`）:

1. `## 完了 Phase 一覧`
2. `## 主要成果物`
3. `## 検証結果`
4. `## 不変条件チェック`
5. `## 未タスク検出 (unassigned-task-detection)`
6. `## skill feedback`
7. `## 影響範囲`
8. `## 次の Phase / 後続タスク`
9. `完了条件 (DoD)` heading

## 3. 状態語彙

本サイクル内 close-out 状態は以下を使用:
- code 変更を伴い local PASS 5 点取得済み + runtime evidence 取得済み → `completed`
- local 実装済みだが runtime evidence 未取得（dev server 起動できない CI 環境等） → `IMPLEMENTED_LOCAL_RUNTIME_PENDING`
- 今回サイクルの最終状態 → `implemented_local_evidence_captured`
- PASS 単独表記禁止

## 4. 不変条件チェック（Phase 12 で必ず確認）

| # | 不変条件 | 確認方法 |
| --- | --- | --- |
| 1 | `process.env` 直接参照禁止 (`apps/web`) | `grep -rn "process\.env\." apps/web/app/sitemap.ts apps/web/app/robots.ts apps/web/src/lib/seo` → 0 件 |
| 2 | D1 への web 直接アクセスなし | `grep -rn "DB\.\|d1Database" apps/web/app/sitemap.ts` → 0 件 |
| 3 | `*.test.{ts,tsx}` 新規追加なし | `git diff --name-only dev...HEAD \| grep -E "\.test\.(ts\|tsx)$"` → 0 件 |
| 4 | HEX 直書き color の不要追加なし（OG image 内 RGB は例外として許容、token と同色） | `git diff dev...HEAD apps/web/src/styles/` → 変更なし |
| 5 | 新規 API endpoint 追加なし | `git diff --name-only dev...HEAD apps/api/src/routes/` → 0 件 |

## 5. CONST_007 適用評価
- 本サイクル内で全 Phase 完了可能
- 「将来 followup」として記録するのは動的 OG image / `/members/[id]/opengraph-image.tsx` のみ（独立スコープ、Phase 12 §未タスク検出に記録）

## 6. 派生 unassigned-task 候補
- `task-issue-274-followup-001-dynamic-member-og-image.md` — `/members/[id]/opengraph-image.tsx` で動的に member 名入り OG image を生成
- 上記は `docs/30-workflows/unassigned-task/` に新規作成して登録

## 7. DoD
- [x] §1 の 7 ファイルが全て配置されている
- [x] §2 の 9 見出しが `main.md` に含まれる
- [x] §4 の不変条件チェック全 PASS
- [x] `outputs/phase-12/main.md` 末尾に check result が記録されている


## 目的
Phase 12 の責務を完了し、後続 Phase が参照できる検証可能な入力を作る。


## 実行タスク
- [x] Phase 12 strict 7 outputs を作成する
- [x] system spec / skill feedback / unassigned task detection を同一 wave で判定する
- [x] 4条件と state vocabulary を compliance check に記録する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| Phase 12 spec | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | strict 7 outputs / required tasks |
| Compliance template | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | 9 section compliance gate |
| aiworkflow index | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | same-wave registration |


## 成果物
- `outputs/phase-12/{main,implementation-guide,phase12-task-spec-compliance-check,system-spec-update-summary,skill-feedback-report,unassigned-task-detection,documentation-changelog}.md`


## 依存 Phase 参照
- Phase 1 の成果物を参照する
- Phase 2 の成果物を参照する
- Phase 5 の成果物を参照する
- Phase 6 の成果物を参照する
- Phase 7 の成果物を参照する
- Phase 8 の成果物を参照する
- Phase 9 の成果物を参照する
- Phase 10 の成果物を参照する
- Phase 11 の成果物を参照する


## 完了条件
- [x] 上記成果物が作成または更新されている
- [x] 参照資料との矛盾がない
- [x] 次 Phase が必要とする入力が本文または成果物に明記されている
