# Phase 1: 要件定義（設計書）

> 設計書フェーズ（親 workflow root）。タスク仕様書（tasks/A-D）はこの要件を前提に作成する。

## 1. 背景と問題

staging `/members`（会員ディレクトリ）で、会員 2 名が在籍しているにもかかわらず
「現在、公開設定中のメンバーがいません」と表示される（`AllHiddenFallback` が発火）。
ユーザーは「以前このメンバーを許可した」と認識している。あわせて以下を要望:

1. 以前保存した Google Form の回答もメンバー一覧に反映できる仕組み
2. Google Form 登録から一覧／本人プロフィールへ反映されるまでの所要時間の説明
3. 「どこに反映されるか（一覧／本人プロフィール）」の明確化
4. 管理画面から Google Form の回答一覧表へ遷移できるリンク

## 2. 根本原因（確定）

| # | 事実 | 根拠 |
|---|------|------|
| RC-1 | 公開判定は `public_consent='consented' AND publish_state='public' AND is_deleted=0` の 3 条件 AND | `apps/api/src/repository/publicMembers.ts:37-39` |
| RC-2 | `publish_state` の初期値は `member_only`。public 昇格は auto-publish ポリシー ON かつ sync 実行時のみ | `apps/api/migrations/0002_admin_managed.sql:13`, `apps/api/src/lib/policies/auto-publish.ts:21-28` |
| RC-3 | 「以前許可した」メンバーは consent 済みでも `publish_state=member_only` のまま滞留している可能性が高い | RC-1/RC-2 から導出 |
| RC-4 | 救済 endpoint `POST /admin/sync/responses?fullSync=true-publish-state` は実装済みだが admin UI 導線が無い | `apps/api/src/routes/admin/sync-backfill-publish-state.ts` |
| RC-5 | 手動 sync `POST /admin/sync/responses`・診断 `GET /admin/diagnostics/forms-pipeline` も実装済みだが操作 UI 無し | `apps/api/src/routes/admin/sync.ts`, `apps/web/.../sync-status/page.tsx`（表示のみ） |
| RC-6 | 反映 SLA を明記したドキュメントが存在しない | `docs/00-getting-started-manual/specs/03-data-fetching.md` |
| RC-7 | admin nav は内部 `<Link>` 専用で外部リンク項目が無い | `apps/web/src/components/shell/shell-config.ts` |

## 3. 受け入れ基準（AC）

### 全体
- **AC-G1**: 4 タスクが責務分離され、各タスク仕様書が CONST_005 の必須項目（変更ファイル・シグネチャ・入出力・テスト・実行コマンド・DoD）を満たす。
- **AC-G2**: 新規 D1 migration・Google Form schema 変更・cron 間隔変更を含まない。
- **AC-G3**: 4 タスクすべて 1 サイクル内完了スコープ（先送り無し、CONST_007）。

### Task A（公開状態 backfill 管理 UI）
- **AC-A1**: 管理者が `admin/sync-status` から **dry-run** を実行し、`scanned/candidates/skipped` の内訳を確認できる。
- **AC-A2**: 管理者が **apply** を実行し、同意済み×member_only メンバーが public へ昇格、`applied` 件数が表示される。
- **AC-A3**: apply は admin override（hidden / 非 system updated_by）と is_deleted を尊重しスキップする（既存 endpoint 仕様の踏襲）。
- **AC-A4**: mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）。

### Task B（手動フォーム再取込 UI）
- **AC-B1**: 管理者が `admin/sync-status` から手動 form response sync を実行でき、結果（取込件数・status）が表示される。
- **AC-B2**: 既存保存済み回答も対象になる full / cursor reset の選択肢を提示する（既存 endpoint の引数に準拠）。
- **AC-B3**: 実行中の二重起動を防止する（disabled / pending 状態）。

### Task C（反映タイミング可視化 + SLA doc）
- **AC-C1**: `/members` に「最終同期時刻」と「反映目安（最大約 N 分）」が表示される。
- **AC-C2**: `/profile` に本人データの「最終反映時刻」と「公開状態（公開／会員限定）」が表示される。
- **AC-C3**: `docs/00-getting-started-manual/specs/03-data-fetching.md` に反映フロー時系列と SLA（cron `*/15`、ISR 30s、最悪 15-45 分）を追記する。
- **AC-C4**: 「本人プロフィールは公開状態に関係なく反映される／一覧は公開条件を満たす場合のみ」を doc と UI コピーで明示する。

### Task D（管理画面→Form 回答一覧表リンク）
- **AC-D1**: admin サイドバーに「フォーム回答」項目が表示され、クリックで Google Form 回答一覧表（編集 URL）が**別タブ**で開く。
- **AC-D2**: 外部リンクは `target="_blank" rel="noopener noreferrer"`（不変条件 #7 準拠）。
- **AC-D3**: URL は `apps/web/src/lib/constants/form.ts` の新定数経由（hardcode 禁止）。
- **AC-D4**: 内部リンクと視覚的に区別できる（外部リンク icon / 表示）。

## 4. 参照（aiworkflow-requirements / specs）

| 参照資料 | パス | 内容 |
|---------|------|------|
| Google Form 結果 | `docs/00-getting-started-manual/google-form/02-result.md` | 編集/回答一覧 URL 正本 |
| データ取得仕様 | `docs/00-getting-started-manual/specs/03-data-fetching.md` | データフロー（C で SLA 追記） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | consent / publish 項目 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/` | 既存設計整合 |
