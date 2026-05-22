# Phase 11: 手動テスト

## 1. 前提

- テストアカウント（admin）: `manjumoto.daishi@senpai-lab.com`
- ローカル: `mise exec -- pnpm --filter @ubm-hyogo/web dev` → `http://localhost:3000`
- staging: Cloudflare Workers staging URL（`apps/web/wrangler.toml` の `[env.staging]` 設定値、デプロイ済みの場合のみ）
- 認証経路: Auth.js / Google OAuth または Magic Link（`docs/00-getting-started-manual/specs/13-mvp-auth.md`）

## 2. 起動

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

別 terminal:

```bash
open http://localhost:3000/login
```

## 3. 手順

### 3.1 admin login

1. `/login` で admin アカウント（`manjumoto.daishi@senpai-lab.com`）で sign-in
2. session 確立後、リダイレクトされたら `/admin` ダッシュボード到達を確認
3. `/admin/schema` の既存 diff page が従来通り描画されることを確認（regression なし）

### 3.2 履歴 page 遷移

1. `/admin/schema` page の Breadcrumb / リンクから「履歴」を選択（または直接 `/admin/schema/history` を URL 入力）
2. `Breadcrumb` が `admin > schema > history` で描画されること
3. `data-page="admin-schema-history"` が root element に付与されていること（DevTools console: `document.querySelector('[data-page="admin-schema-history"]')`）

### 3.3 履歴行表示確認

事前に少なくとも 1 件の resolve 履歴を `apps/api/src/routes/admin/schema.ts` の resolve mutation 経由で作成しておく（または D1 staging に既存履歴がある状態で実施）。

確認:

- 各行に `操作日時 (ISO) / 操作者 email / before stableKey / after stableKey / question text` が表示される（AC-2）
- 時系列降順（最新が上）（AC-1）
- 行 DOM に `data-audit-id` 属性が付く（followup-004 rollback 起動 anchor）

### 3.4 filter 操作

1. 操作者 email filter: `manjumoto.daishi@senpai-lab.com` を入力 → 該当行のみ残ること
2. 期間 from/to filter: 過去 1 日 / 過去 7 日範囲を指定 → 該当期間内の行のみ残ること
3. question text 部分一致 filter: 既存 question の部分文字列を入力 → 該当行のみ残ること
4. 3 つを組み合わせて適用 → 全条件 AND で絞り込み動作（AC-3）
5. filter クリア → 全件表示に戻る

### 3.5 cursor pagination 操作

50 件超の履歴がある状態で:

1. 初期表示は 50 件 / page
2. 「次の 50 件」ボタン押下 → 次ページに遷移し、cursor が URL query または state に反映
3. 「前の 50 件」ボタン押下 → 前ページに戻る
4. cursor を opaque string として扱い、URL を共有しても同じページが再現できる（AC-4）

### 3.6 空状態確認

1. filter を「該当 0 件になる組み合わせ」（例: 存在しない email）に設定
2. `EmptyState` primitive で「該当する履歴がありません」が表示されること（AC-5）
3. filter を解除すれば一覧が復帰

### 3.7 エラー境界確認

DevTools → Network → `/admin/audit` (または schema history endpoint) のレスポンスを 500 に書き換え:

1. `role="alert"` の feedback 領域に「履歴の取得に失敗しました」が表示されること
2. 既に表示済みの履歴行がある場合は保持されること

### 3.8 a11y 確認

DevTools → Elements → Accessibility パネル:

- root に landmark role が付与されている
- filter 入力に label（FormField 既定）が紐付いている
- pagination ボタンに aria-label が付いている
- focus ring が OKLch token 由来で表示される

## 4. screenshot evidence path

`outputs/phase-11/screenshots/` 配下に以下を保存（authenticated browser screenshot は user-gated）:

| Test Case | Screenshot path | 内容 |
|---|---|---|
| TC-VIS-01 | `outputs/phase-11/screenshots/schema-history-list.png` | 履歴行が複数件表示された通常状態（desktop） |
| TC-VIS-02 | `outputs/phase-11/screenshots/schema-history-empty.png` | 空状態（EmptyState 表示） |
| TC-VIS-03 | `outputs/phase-11/screenshots/schema-history-filter.png` | filter 適用後の絞り込み状態 |
| TC-VIS-04 | `outputs/phase-11/screenshots/schema-history-pagination.png` | 2 ページ目への遷移後（cursor 反映） |
| TC-VIS-05 | `outputs/phase-11/screenshots/schema-history-breadcrumb.png` | `admin > schema > history` Breadcrumb 拡大 |

## 5. runtime boundary

| Evidence | 区分 | 取得タイミング |
|---|---|---|
| typecheck / lint / spec / HEX grep | Phase 9 自動 | local |
| component DOM isolated screenshot | local component render | local（自動取得可） |
| authenticated browser screenshot（admin login 必須） | user-gated | user 明示承認後に手動取得 |
| Cloudflare staging runtime smoke | user-gated | staging deploy 完了 + user 承認後 |

## 6. 確認後の状態更新

- `outputs/phase-11/evidence/` に local 自動 evidence を保存
- `outputs/phase-11/screenshots/` に手動 screenshot を保存
- `outputs/phase-11/screenshot-coverage.md` で 5 screenshot の coverage を表化
- Phase 12 documentation で unassigned-task-detection §3 を consumed に更新
