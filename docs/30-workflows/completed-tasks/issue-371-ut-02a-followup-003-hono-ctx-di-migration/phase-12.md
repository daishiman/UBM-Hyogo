# Phase 12: implementation-guide / unassigned 検出 / skill feedback / compliance

実装区分: 実装仕様書

## 12.1 7 必須ファイル一覧

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 本体サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | システム仕様書（specs/ 配下）への更新指示 |
| 4 | `outputs/phase-12/documentation-changelog.md` | ドキュメント更新履歴（canonical absolute path で列挙） |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 残課題検出（0 件でも出力） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | スキルフィードバック（改善なしでも出力、3 観点固定） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | コンプライアンスチェック |

## 12.2 Part 1（中学生レベル）の主旨

> これまで「どのテストデータを使うか」をお店で言うときに、注文するたびに毎回伝えていた。
> これからは入口で店員さんに一度だけ伝えれば、その後の注文に自動でついてくる仕組みに変えた。
> 引数（注文の付け足し）が減るので、メニューが増えても注文の手間が増えない。
> もし入口で言い忘れたら、お店は「忘れてるよ」と即座に返す（黙って空っぽを返さない）。

## 12.3 Part 2（技術者レベル）に含めるべき内容

- 旧 API: `buildMemberProfile(c, mid, deps?)` / `buildAdminMemberDetailView(c, mid, adminNotes, deps?)`
- 新 API: `buildMemberProfile(c, mid)` / `buildAdminMemberDetailView(c, mid, adminNotes)`
- 注入経路: `attendanceProviderMiddleware` → `c.var.attendanceProvider`
- 型: `RepositoryProviderVariables`、`Variables: SessionGuardVariables & RepositoryProviderVariables`
- silent fallback 廃止: provider 未注入時 throw
- 移行手順: Phase 5 step 1〜7 を引用
- ADR: Phase 3 を引用
- 検証: Phase 7-9 grep gate + テスト結果

## 12.4 12-2 system-spec-update-summary.md（更新対象）

| 仕様書 | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | repository builder 注入経路を「Hono ctx 経由」へ更新（該当章があれば） |
| 不変条件追加候補 | 「repository provider 注入は Hono ctx 経由を標準とする。引数追加方式は禁止」を Phase 13 後にユーザー判断で追加 |

更新が不要と判断した場合は、その旨と判断根拠を 12-2 に明記する。

## 12.5 12-3 documentation-changelog.md（必須エントリ最小セット）

```markdown
- /Users/dm/.../docs/30-workflows/issue-371-.../index.md (created)
- /Users/dm/.../docs/30-workflows/issue-371-.../phase-01.md ~ phase-13.md (created)
- /Users/dm/.../docs/30-workflows/issue-371-.../outputs/phase-03/adr-di-strategy.md (created)
- /Users/dm/.../docs/30-workflows/issue-371-.../outputs/phase-11/evidence/*.log (created)
- /Users/dm/.../docs/30-workflows/issue-371-.../outputs/phase-12/*.md (created)
- /Users/dm/.../apps/api/src/middleware/repository-providers.ts (created)
- /Users/dm/.../apps/api/src/middleware/repository-providers.test.ts (created)
- /Users/dm/.../apps/api/src/repository/_shared/builder.ts (modified)
- /Users/dm/.../apps/api/src/repository/_shared/builder.test.ts (modified)
- /Users/dm/.../apps/api/src/repository/__tests__/builder.test.ts (modified)
- /Users/dm/.../apps/api/src/routes/me/index.ts (modified)
- /Users/dm/.../apps/api/src/routes/admin/members.ts (modified)
- （該当時）/Users/dm/.../.claude/skills/<skill>/SKILL.md (modified) + LOGS.md (modified)
```

`SKILL.md` だけ列挙して `LOGS.md` 省略は FAIL（task-specification-creator skill の Phase 12 規定）。

## 12.6 12-4 unassigned-task-detection.md（0 件でも出力）

候補:

- 02b/02c で write/tag/note provider が必要になった際、本タスクと同パターン（middleware + ctx）で実装する旨の標準化未済（ADR で表明済みだが、実装ガイドラインへの昇格は未）
- public profile builder への同パターン適用（attendance を含まないため scope out したが、将来 attendance を含むなら追従）

候補が 0 件でも、本ファイルは「対象タスクに残課題なし」明記で出力する。

## 12.7 12-5 skill-feedback-report.md（3 観点固定）

```markdown
## テンプレ改善
（task-specification-creator のテンプレに対する改善提案。なしの場合「なし」と明記）

## ワークフロー改善
（Phase 1-13 のワークフロー改善提案）

## ドキュメント改善
（references / SKILL.md 等のドキュメント改善提案）
```

## 12.8 12-6 phase12-task-spec-compliance-check.md

| 項目 | 確認 |
| --- | --- |
| 実装区分が冒頭に明記されている（全 Phase） | ✅ |
| CONST_005 必須項目が実装仕様書に揃っている | ✅（Phase 2 / 4 / 5） |
| AC × test mapping が存在 | ✅（Phase 4） |
| ADR が独立ファイル | ✅（Phase 3 / outputs） |
| evidence マニフェスト存在 | ✅（Phase 11。local implementation logs captured; runtime smoke pending） |
| 7 必須ファイル揃え | ✅（Phase 12 outputs 実体化済み） |
| Issue 状態（CLOSED）について冒頭で言及 | ✅（index.md メタ情報） |

## 12.9 完了条件

- 7 ファイル全て `outputs/phase-12/` に実体存在
- 12-3 documentation-changelog.md が canonical absolute path で列挙
- 12-6 compliance check 全 ✅
