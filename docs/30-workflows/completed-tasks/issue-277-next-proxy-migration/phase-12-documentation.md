# Phase 12: ドキュメント（概念説明含む）

## 中学生レベルの概念説明

### Next.js の middleware って何？

ウェブサイトは「ユーザーの操作 → サーバーが返事を返す」という流れで動きます。例えば `/admin` ページを開こうとしたら、サーバーは「管理者しか見ちゃダメな場所」だと判断して、未ログインの人は `/login` に追い返す必要があります。

この **「ページが描画される前に間に入って割り込む仕組み」** を Next.js では `middleware`（ミドルウェア = 中間に入るやつ）と呼んでいました。

### なんで名前が `proxy` に変わったの？

`middleware` という単語は Express.js（別のフレームワーク）でも使われていて、意味がちょっと違ったので混乱の原因でした。Next.js のチームは「これは実は **proxy**（プロキシ = 玄関の門番）の方が役割が分かりやすい」と判断して、Next.js 16 から名前を `proxy` に変更しました。

- 中身の動きは同じ
- ファイル名を `middleware.ts` → `proxy.ts` に
- 関数名を `middleware()` → `proxy()` に

たったこれだけです。

### 今回の変更で何が起きるの？

1. ユーザーが `/profile` を開く → `proxy.ts` が「ログインしてる？」とチェック
2. ログインしてない → `/login?redirect=%2Fprofile` に飛ばす
3. ログインしてる → そのまま `/profile` を表示

`/admin` も同じで、「admin 権限のユーザーかどうか」までチェックします。**この動きはこれまでと完全に同じ**です。名前だけ変えるので、ユーザーから見ると何も変わりません。

### なんで今やるの？

Next.js が古い名前（`middleware`）に対して「将来消すよ」と警告（deprecation warning）を出しているからです。今のうちに新しい名前に揃えておかないと、将来 Next.js をアップグレードしたときにビルドが壊れる可能性があります。

## 仕様変更サマリ

| 項目 | Before | After |
|---|---|---|
| ファイルパス | `apps/web/middleware.ts` | `apps/web/proxy.ts` |
| named export 関数名 | `middleware` | `proxy` |
| default export | `export default middleware` | `export default proxy` |
| matcher 設定 | `["/admin/:path*", "/profile/:path*"]` | 同左（変更なし） |
| 振る舞い | admin/profile gate（redirect / 403） | 同左（完全保持） |

## 不変条件への影響

| 不変条件 | 影響 |
|---|---|
| #5 D1 直接アクセス禁止 | 影響なし（JWT verify のみ継続） |
| #9 `/no-access` 専用画面非依存 | 影響なし |
| #11 admin/profile HTML 未認証 SSR 防止 | 影響なし（proxy で先回り redirect / 403） |

## 関連ドキュメント

- Next.js 公式: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- 既存仕様: `docs/30-workflows/completed-tasks/UT-06B-NEXT-PROXY-MIGRATION.md`
- 親タスク: `docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/`

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 12 strict 7 と aiworkflow same-wave sync を完了し、仕様書を skill 準拠状態にする。

## 実行タスク

- implementation guide を作成する。
- system spec update summary を作成する。
- documentation changelog / unassigned detection / skill feedback / compliance check を作成する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- strict 7 がすべて存在する。
- 4条件 verdict が PASS である。
