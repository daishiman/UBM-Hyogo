# 管理者権限管理設計

## 基本方針

- 管理者 UI は `公開状態の管理 / タグ割当 / スキーマ差分レビュー / 開催日と参加履歴の管理` に責務を限定する
- `gas-prototype/` は操作イメージの参考であり、本番の認証・保存・同期仕様の正本ではない
- 他人のプロフィール本文を管理画面で直接編集しない
- 本人情報の更新は Google Form 再回答で行い、管理者は公開状態と運用状態を管理する
- 実装先は `apps/web` の管理画面と `apps/api` の管理操作 API で分離する

---

## 権限一覧

| 機能 | 一般メンバー | 管理者 |
|------|:-----------:|:------:|
| 公開一覧・公開詳細の閲覧 | ✅ | ✅ |
| 自分の掲載内容の確認 | ✅ | ✅ |
| Google Form への更新導線利用 | ✅ | ✅ |
| 公開/非公開の切り替え | ❌ | ✅ |
| 論理削除/復元 | ❌ | ✅ |
| 管理メモの記録 | ❌ | ✅ |
| タグ割当レビュー | ❌ | ✅ |
| Google Form 差分レビュー | ❌ | ✅ |
| `stableKey` 割当 | ❌ | ✅ |
| 開催日追加 | ❌ | ✅ |
| 参加履歴付与/解除 | ❌ | ✅ |
| 監査ログ閲覧 | ❌ | ✅ |

---

## 管理画面

### `/admin`

- 未処理タスクを俯瞰するダッシュボード
- 必須表示は `総会員数 / 公開中人数 / 未タグ人数 / スキーマ未解決件数`
- ここから `メンバー管理 / タグ割当 / スキーマ差分 / 開催日管理` へ遷移する

### `/admin/members`

- 基本レイアウトは `一覧 + 右ドロワー`
- 一覧では `公開中 / 非公開 / 退会済み` を切り替えられるようにする
- ドロワーで扱う操作は次に限定する
  - 公開/非公開切替
  - 論理削除/復元
  - 管理メモ
  - 回答メタデータ確認
  - 参加履歴確認

### `/admin/tags`

- 正式用途は `未タグ会員への割当キュー`
- 左側に未タグ会員キュー、右側に対象会員の要約とタグ選択を置く
- `タグ辞書編集` や `タグルール編集` はこの画面の主責務にしない
- 本人がタグを自己申告で編集する運用は採用しない

### `/admin/schema`

- Google Form の構造変化をレビューする専用画面
- `added / changed / removed / unresolved` を区別して表示する
- `stableKey` 未割当を最優先で解消する

### `/admin/meetings`

- 支部会の開催日を追加する
- 開催日ごと、会員ごとの両方から参加履歴を管理できるようにする
- 開催日と参加履歴はフォーム項目ではなく、管理者データとして扱う

### `/admin/audit`

- `audit_log` を read-only に検索・閲覧する
- `action / actorEmail / targetType / targetId / from / to / limit` の filter と cursor pagination を提供する
- 日時入力は JST、API query は UTC、表示は JST に揃える
- `before_json` / `after_json` は初期折り畳みとし、展開時も email / phone / address / name 相当値は masked view だけを表示する
- 編集・削除・再実行・export などの mutation UI は置かない

### `/admin/requests`

- 会員本人が `/me/visibility-request` / `/me/delete-request` から作った依頼を処理する queue
- `visibility_request` と `delete_request` を切り替え、pending 行を FIFO で確認する
- 詳細 panel で理由・最小化済み payload・現在の公開状態 / 削除状態を確認する
- approve / reject は confirmation modal 経由で実行する
- delete approve と visibility approve は破壊的操作として alert 表示し、二重 resolve は 409 toast で再読込する
- 初回 local visual evidence は admin session + D1 fixture が必要なため staging smoke task へ委譲する

---

## 管理操作の UI 原則

| 操作 | UI |
|------|----|
| 公開/非公開切替 | `Switch` |
| 論理削除/復元 | `Dialog` |
| 個別詳細確認 | `Drawer` |
| タグ割当 | `Queue + Tag picker` |
| スキーマ差分確認 | `List + review panel` |
| 開催日追加 | `Form` |
| 参加履歴付与/解除 | `Button` または `Checkbox` |
| 監査ログ閲覧 | `Filter + Table + Disclosure` |
| 依頼キュー処理 | `Queue + Detail panel + Confirmation dialog` |
| identity conflict merge | `List + two-step confirmation + dismiss` |

---

## 運用ルール

1. 管理者は他人のプロフィール本文を直接編集しない
2. 本人更新は Google Form 再回答に誘導する
3. 削除は物理削除ではなく論理削除とする
4. タグ付与は管理者レビューを通す
5. Google Form の変更対応は `/admin/schema` に集約する
6. 開催日と参加履歴はフォーム同期対象と分離して管理する
7. 監査ログは append-only とし、閲覧画面では保存値を変更せず表示時 masking を行う
8. 本人依頼の approve / reject は `/admin/requests` に集約し、管理者が member 本文を直接編集する UI は作らない
9. identity merge は `identity_aliases` と audit ledger の追加だけで表現し、`member_responses` / `response_fields` / `member_status` の本文列を直接更新しない

## identity conflict merge（Issue #194）

`/admin/identity-conflicts` は 03b response sync の `EMAIL_CONFLICT` 運用を閉じるための管理画面である。候補は `member_identities` 全体を対象に、`fullName` と `occupation` が NFKC/trim 後に完全一致する pair として表示する。source は新しい `last_submitted_at` 側、target は古い identity 側に揃える。

管理者は候補ごとに以下を実行できる:

| action | behavior |
| --- | --- |
| merge | 二段階確認後、`POST /admin/identity-conflicts/:id/merge` で `identity_aliases` / `identity_merge_audit` / `audit_log` を単一 D1 batch に記録する |
| dismiss | `POST /admin/identity-conflicts/:id/dismiss` で pair を `identity_conflict_dismissals` に保存し、再検出から除外する。重複 dismiss は upsert |

UI は `responseEmailMasked` だけを表示し、merge reason に含まれる email / phone は API 側で `[redacted]` に置換する。誤 merge の取り消しは自動 UI では提供せず、`identity_merge_audit` を根拠に管理者承認付きの手動 runbook で扱う。

## schema alias assignment（07b）

`/admin/schema` の schema 差分解消は 07b API workflow が正本である。UI は `recommendedStableKeys` を候補表示に使い、dryRun で影響範囲を確認してから apply する。apply 後は `schema_diff_queue` を `queued -> resolved` に進め、過去回答の `__extra__:<questionId>` を stableKey へ back-fill する。

管理 UI は stableKey を直接固定せず、API の 409 / 422 境界を toast 等で分けて表示する。多言語 label 正規化や大規模 back-fill の retryable contract は `UT-07B-schema-alias-hardening-001` で扱う。

## tag assignment queue（UT-02A / 07a）

Forms 同期から発生する tag candidate は `tag_assignment_queue` に投入し、管理者が `/admin/tags/queue` で確認する。`GET /admin/tags/queue?status=dlq` は retry 上限超過行を表示できる。通常の確認結果は `POST /admin/tags/queue/:queueId/resolve` で `resolved` / `rejected` に進める。

現行 candidate row は tagCode 未確定のため、重複防止は `<memberId>:<responseId>` の `idempotency_key` で行う。`member_tags` への直接編集 UI / API は作らず、確定書き込みは 07a resolve workflow の guarded update 成功後だけ許可する。retry tick、DLQ requeue、DLQ audit は UT-02A follow-up として分離する。

---

## 明示的に採用しないもの

- 管理者追加/削除の UI
- 他人プロフィールの本文編集 UI
- `admin/tags` をタグ辞書・ルール編集の主画面にする構成
- 物理削除

---

## 管理者ゲート（admin gate）二段防御

`/admin/*` の HTML 表示と API mutation を共に未認証 / 非 admin に許さないため、
admin gate は **apps/web middleware（UI gate）** と **apps/api `requireAdmin`（API gate）** の
二段防御で実装する。一方が bypass されても他方が独立して 403 を返す。

| 段 | 実装 | 責務 | D1 アクセス |
|---|------|------|------------|
| 第1段（UI gate） | `apps/web/middleware.ts`（matcher: `/admin/:path*`） | 未ログイン / 非 admin の SSR ブロック → `/login?gate=admin_required` redirect | しない（JWT verify のみ） |
| 第2段（API gate） | `apps/api/src/middleware/require-admin.ts` | `/admin/*` route mount に `requireAdmin` 適用、`claims.isAdmin !== true` は 403 | しない（JWT verify のみ） |

不変条件:

- `/admin` shell は sidebar footer にログアウト導線を持つ。
- ログアウト導線は member UI と同じ `SignOutButton` を使い、Auth.js `signOut({ redirectTo: "/login" })` に委譲する。

1. **UI gate / API gate ともに D1 を触らない**。admin 判定は session JWT の `isAdmin` claim を信頼する。`admin_users` の lookup は session 発行時の `/auth/session-resolve` で済んでいる。
2. **UI gate を bypass しても API gate が独立に 403 を返す**（`__Secure-authjs.session-token` を改竄、Authorization Bearer の偽装、UI middleware の matcher 漏れ等を想定）。
3. **`/admin/sync*` の cron / Worker-to-Worker 経路は `requireSyncAdmin`（`SYNC_ADMIN_TOKEN` Bearer）を維持** し、人間向け `/admin/*` の `requireAdmin` と分離する。
4. **admin 剥奪は session JWT 失効まで反映されない（24h TTL）**。即時失効が必要な場合は `AUTH_SECRET` rotate で全 session を invalidate する。MVP では「次回ログインで反映」を許容する。

参照:

- `apps/web/middleware.ts`（UI gate）
- `apps/api/src/middleware/require-admin.ts`（API gate）
- `apps/api/src/index.ts`（`/admin/*` ルートへの `requireAdmin` mount）
- `02-auth.md`（`/auth/session-resolve` 内部 endpoint）
- `13-mvp-auth.md`（session JWT 構造 / admin 剥奪反映ポリシー）
