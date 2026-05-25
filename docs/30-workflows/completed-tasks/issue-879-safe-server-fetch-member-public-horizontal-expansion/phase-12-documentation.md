# Phase 12: ドキュメント同期

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 12 / 13 |
| visual category | NON_VISUAL |

## 目的

- 本 spec を canonical workflow として確立
- 既存 unassigned-task spec の stale 参照を補修
- 中学生レベル概念説明＋開発者向け技術詳細を残す

## 実行タスク

- unassigned-task → 本ディレクトリ参照に正本切替
- Phase 12 canonical 9 heading 遵守
- 親 workflow（admin-ui-prototype-alignment）からの follow-up 参照を本 spec へ繋ぐ

## Part 1: 概念説明（中学生レベル・専門用語なし）

ホームページを 1 つの画面として見ると、その中には小さな「区画」がいくつも並んでいます。たとえばメンバー一覧の画面なら、「メンバーの並び」「絞り込みボタン」「タグの一覧」などです。

今までは、たとえば「タグの一覧」を取りに行くサーバーが一瞬調子悪くなっただけで、画面ぜんぶが「エラーです」になってしまっていました。これは、たった 1 つの区画が転んだだけなのに、画面全部が「もう何も見せない」と決めつけてしまう設計だったからです。

管理者の画面ではすでに、転んだ区画だけ「ここだけ読み込めませんでした」と表示して、ほかの区画は普通に見せる仕組みが入っています。今回の変更で、メンバー画面と自分のページにも同じ仕組みを広げます。これで、ひとつの区画が転んでも、ほかは見られる、という当たり前のことが、当たり前に動くようになります。

仕組みの中心になるのは「安全に取りに行く道具」です。普通に取りに行くと「失敗 = 全体が止まる」になりますが、この道具を通すと「失敗 = ここだけ静かに失敗を返す」に変わります。返ってきた結果を見て、「成功なら普通の見た目」「失敗ならエラーカード」を区画ごとに描き分けます。

## Part 2: 技術詳細（開発者向け）

### 2.1 アーキテクチャ

- `apps/web/src/lib/server-fetch/safe-fetch.ts` を共通 SSOT として新設
- `apps/web/src/lib/admin/safe-server-fetch.ts` を re-export 層に縮小し、既存 admin import path / error code prefix を不変に維持
- `apps/web/src/lib/result.ts` の `SafeResult<T>` は据え置き

### 2.2 page 置換

- `/profile`: auth gate（`fetchAuthed("/me")`）は素 throw 維持。`AuthRequiredError` で `redirect("/login")`。`/me/profile` のみ safeServerFetch wrap。失敗時は MemberSectionError で degrade
- `/(public)/members`: `listMembers` を safeServerFetch wrap。失敗時は PublicSectionError 描画＋他 UI 維持
- `/(public)/members/[id]`: `fetchPublicOrNotFound` を safeServerFetch wrap。`rethrowOn: [FetchPublicNotFoundError]` で notFound() 経路保護

### 2.3 SectionError

public / member の 2 layer で props shape (`title?`/`detail?`/`retryHref?`/`className?`) を完全一致。admin は既存 `AdminSectionError` API を維持し、role / aria / SafeResult diagnostics の設計パターンを揃える。実装は layer ごと（theme 差分を OKLch token で吸収）。

### 2.4 rethrowOn allowlist

- `AuthRequiredError`: redirect 経路保護
- `FetchPublicNotFoundError`: notFound 経路保護
- 上記以外の Next.js framework signal が必要になれば allowlist を拡張する

## 視覚証跡

NON_VISUAL のため visual baseline 更新なし。SectionError は既存 token のみ参照、既存 playwright smoke の巡回路に乗る。

## Phase 12 成果物

- 本ファイル
- `outputs/phase-12/implementation-guide.md`（実装済み差分と検証コマンドの索引）

## system spec 更新判定

| 文書 | 更新要否 | 理由 |
|---|---|---|
| `docs/00-getting-started-manual/specs/*` | 不要 | API surface / D1 / 認証契約に変更なし |
| `docs/00-getting-started-manual/claude-design-prototype/*` | 不要 | 新規 primitive / 新規 visual なし |
| `CLAUDE.md` | 不要 | 既存不変条件（OKLch / D1 直禁止 / *.spec.{ts,tsx}）の遵守継続のみ |
| `.claude/skills/aiworkflow-requirements/*` | 更新済み | task-workflow-active / quick-reference / resource-map / artifact inventory / changelog を同 wave で同期 |
| `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-10/final-review.md` の deferred 行 | 不要 | source unassigned consumed trace と aiworkflow 索引で正本導線を確保 |
| `docs/30-workflows/unassigned-task/admin-ui-prototype-alignment-followup-001-safe-server-fetch-horizontal-expansion.md` | 補注済み | Phase 1-13 化に伴い本 spec が正本。物理削除せず consumed trace で既存参照を保護 |

## 参照資料

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- 既存 admin 実装: `apps/web/src/lib/admin/safe-server-fetch.ts` / `apps/web/src/lib/result.ts`
- CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 1/2/3、§5、§8

## 成果物

- 本ファイル
- `outputs/phase-12/implementation-guide.md`

## 完了条件

- canonical 9 heading が揃っている
- Part 1（中学生レベル）/ Part 2（技術詳細）が揃っている
- system spec 更新判定が記録されている
