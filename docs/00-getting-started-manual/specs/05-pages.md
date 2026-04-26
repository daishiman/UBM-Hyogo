# ページ構成・画面設計

## この文書の位置づけ

- 本文書は `claude-design-prototype/` を基準に、正式なフロントエンド画面構成を定義する
- `gas-prototype/` は操作感確認用の叩き台として参照するが、本番バックエンド仕様の正本にはしない
- UI は `公開 / 会員 / 管理` の3レイヤで分ける
- 実装先は `apps/web` のページ群で、データ更新や認証判定は `apps/api` と分離する

---

## 正式ルーティング

| レイヤ | URL | 役割 |
|------|-----|------|
| 公開 | `/` | ランディング。Hero、統計、UBM区画説明、最近の支部会、FAQ、会員導線を出す |
| 公開 | `/members` | 公開メンバー一覧。`q / zone / status / tag / sort / density` で絞り込む |
| 公開 | `/members/[id]` | 公開メンバー詳細。掲載同意済みかつ公開中の情報だけを表示する |
| 公開 | `/register` | メンバー登録案内ページ。Google Form へ遷移する。設問プレビューと公開範囲の説明を含む |
| 公開 | `/login` | 会員ログイン。メールリンク送信と Google ログインの2導線を持つ |
| 会員 | `/profile` | マイページ。自分の公開状態、公開範囲サマリ、回答内容確認、更新導線、公開停止/退会申請を扱う |
| 管理 | `/admin` | 管理ダッシュボード。全体KPI、未タグ件数、未解決スキーマ差分、最近の開催日を集約表示する |
| 管理 | `/admin/members` | メンバー管理。公開/非公開、論理削除、管理メモ、回答確認、参加履歴確認を行う |
| 管理 | `/admin/tags` | タグ割当キュー。未タグ会員を順にレビューし、手動でタグを割り当てる |
| 管理 | `/admin/schema` | スキーマ差分レビュー。Google Form の変更差分と `stableKey` 未割当項目を処理する |
| 管理 | `/admin/meetings` | 開催日と参加履歴の管理。開催日追加と会員ごとの参加付与/解除を行う |

---

## 画面ごとの責務

### 公開レイヤ

#### `/`

- 第一導線は `メンバー一覧を見る`
- 第二導線は `会員ログイン`
- 補助導線として `メンバー登録` を配置する
- ランディングは営業資料ではなく、支部会の参加者像と活動頻度がすぐ分かる情報設計にする

#### `/members`

- 未ログインでも閲覧できる
- 表示対象は `掲載同意済み` かつ `管理上公開中` のメンバーだけに限定する
- 一覧の主要操作は検索、絞り込み、並び替え、表示密度切替に絞る
- 空状態では「該当メンバーなし」と絞り込み解除導線を出す

#### `/members/[id]`

- 一覧と同じ公開条件で閲覧可能にする
- Hero で `氏名 / 職業 / UBM区画 / 参加ステータス / 所在地 / 主タグ` を先頭表示する
- 本文は `ビジネス概要 / スキル / 提供できること / 人となり / SNS・連絡先` の順で出す
- 管理操作や本人編集導線は混在させない

#### `/register`

- アプリ内入力画面は持たず、Google Form 回答への遷移ページとして扱う
- 設問プレビューでは `公開 / 会員限定 / 管理用` の可視性を明示する
- 登録フローは `Google Form 回答 -> 自動同期 -> ログイン -> マイページ確認` で説明する

#### `/login`

- `メールリンク送信` と `Google ログイン` の2導線を持つ
- 送信後は `input -> sent` の状態遷移を持つ
- 未登録ユーザー向けに `/register` への導線を常に表示する

### 会員レイヤ

#### `/profile`

- 公開プロフィールの確認画面と、自分向けの回答確認画面を兼ねる
- 更新はアプリ内自由編集ではなく、Google Form 再回答導線で行う
- `情報を更新する` はモーダル確認後に `/register` ではなく実 Google Form へ遷移する
- `公開停止` と `退会申請` はマイページから申請できるが、反映は管理処理で行う

### 管理レイヤ

#### `/admin`

- ダッシュボードは `公開中人数 / 非公開人数 / 未タグ人数 / スキーマ未解決件数` を最短で把握できる構成にする
- 主要ショートカットは `メンバー管理 / タグ割当 / スキーマ差分 / 開催日管理` とする

#### `/admin/members`

- 一覧 + 右ドロワーを基本にする
- ここで行うのは `公開切替 / 論理削除 / 管理メモ / 回答確認 / 参加履歴確認` に限定する
- 他人のプロフィール本文を直接編集する画面にはしない

#### `/admin/tags`

- 正式用途は `未タグ会員への割当キュー` と `割当レビュー`
- `タグ辞書編集` や `ルール編集` はこの画面の主目的にしない
- メンバー自身がタグを選ぶ UI は採用しない

#### `/admin/schema`

- `added / changed / removed / unresolved` を区別して表示する
- 未解決項目には `stableKey` 割当操作を提供する
- Google Form の変更をアプリ内の他画面に散らさず、ここに集約する

#### `/admin/meetings`

- 開催日を追加できる
- 各開催日に対して会員ごとの参加付与/解除ができる
- 開催日と参加履歴はフォーム回答とは別の管理データとして扱う

UI レイアウト:

```
[開催日追加フォーム: タイトル / 日付 / 備考 / 追加ボタン]
─────────────────────────────────────────
[開催日一覧（新しい順）]
  ▶ 2026-04-20 月例会 (16名参加)  [展開]
    └ 参加者リスト: Avatar + 氏名 + [解除] ボタン
    └ [参加者を追加] → メンバー選択 Combobox
  ▶ 2026-03-16 月例会 (12名参加)  [展開]
```

操作:
- `POST /admin/meetings` で `meeting_sessions` に追加
- `POST /admin/meetings/:sessionId/attendance` で `member_attendance` に追加
- `DELETE /admin/meetings/:sessionId/attendance/:memberId` で参加解除
- prototype には存在しないため、本実装で追加する初出画面

---

## 正式採用しない画面

### `/no-access`

- 専用ページとしては採用しない
- 未登録、規約未同意、削除済みは `/login` と `/register`、必要に応じて `/profile` の状態バナーで案内する

### `/profile/edit`

- 正式画面から外す
- 理由は、本人更新の正規フローを `Google Form 再回答` に一本化するため

---

## 主要遷移

```text
[公開]
/ -> /members -> /members/[id]
/ -> /login
/ -> /register -> Google Form

[会員]
/login -> /profile
/profile -> Google Form 再回答 -> 同期完了後に /profile で確認

[管理]
/admin -> /admin/members
/admin -> /admin/tags
/admin -> /admin/schema
/admin -> /admin/meetings
```

---

## 実装メモ

- `claude-design-prototype/` の route key は `landing / members / member-form / login / my / admin-dashboard / admin-members / admin-tags / schema-diff`
- 実装時はこれを上記 URL に正規化してよい
- `gas-prototype/` にある `settings` は正式には `/admin/schema`、`admin-meetings` は正式には `/admin/meetings` として扱う

---

## prototype 移植ルール

### 採用するもの

- `styles.css` と `primitives.jsx` の UI 密度、余白、Chip、Drawer、Segmented、FilterBar の操作感
- 公開トップの `Hero / Stats / About / Featured / Recent Meetings / CTA`
- メンバー一覧の `q / zone / status / tag / sort / density`
- メンバー詳細の `ProfileHero` とセクション分割
- `/login` の `input -> sent` 状態
- `/register` の設問プレビューと visibility 表示
- `/profile` の公開状態バナー、visibility summary、Google Form 再回答導線
- 管理の Dashboard、Members drawer、Tags queue、Schema diff review

### 採用しないもの

- `localStorage` による route/data/session の永続化
- `theme / nav / detailLayout / editMode` のエンドユーザー機能化
- demo toast だけで完了する更新処理
- 管理画面で他人のプロフィール本文を直接編集する導線
- prototype 内の placeholder Google Form URL

### 不足しているため追加する画面

prototype には `/admin/meetings` がないため、本実装で追加する。

要件:

- 開催日一覧
- 開催日追加
- 開催日ごとの参加者表示
- 会員ごとの参加付与/解除
- `meeting_sessions` と `member_attendance` のみを更新し、Google Form schema には混ぜない

---

## ページと API の接続

| URL | primary API |
|-----|-------------|
| `/` | `GET /public/stats`, `GET /public/members?limit=6` |
| `/members` | `GET /public/members?q=&zone=&status=&tag=&sort=` |
| `/members/[id]` | `GET /public/members/:memberId` |
| `/register` | `GET /public/form-preview` |
| `/login` | Auth.js routes, `POST /auth/magic-link`, `GET /me` |
| `/profile` | `GET /me/profile`, `POST /me/visibility-request`, `POST /me/delete-request` |
| `/admin` | `GET /admin/dashboard` |
| `/admin/members` | `GET /admin/members`, `GET /admin/members/:memberId`, `PATCH /admin/members/:memberId/status`, `POST/PATCH /admin/members/:memberId/notes` |
| `/admin/tags` | `GET /admin/tags/queue`, `POST /admin/tags/queue/:queueId/resolve` |
| `/admin/schema` | `GET /admin/schema/diff`, `POST /admin/schema/aliases`, `POST /admin/sync/schema`, `POST /admin/sync/responses` |
| `/admin/meetings` | `GET /admin/meetings`, `POST /admin/meetings`, `POST /admin/meetings/:sessionId/attendance`, `DELETE /admin/meetings/:sessionId/attendance/:memberId` |

---

## 画面状態 contract

全ページで `loading / empty / error / unauthorized` を明示的に実装する。

| 画面 | empty | unauthorized / forbidden | mutation 後 |
|------|-------|--------------------------|-------------|
| `/members` | 絞り込み解除 CTA | なし | query 再評価 |
| `/members/[id]` | 404 表示 | なし | なし |
| `/login` | なし | `unregistered / rules_declined / deleted` を案内状態として表示 | `sent` へ遷移 |
| `/profile` | 登録導線 | `/login` へ誘導 | profile 再取得 |
| `/admin/*` | 対象別 empty state | `/login` または forbidden 表示 | 対象 API を再取得 |

---

## prototype 文言・操作の置換表

| prototype 表現/操作 | 正式仕様 |
|--------------------|----------|
| `確認・編集できます` | `確認できます。更新は Google Form から行います` |
| 本人画面の Avatar upload | MVP 不採用。ローカル保存しない |
| `管理者が表記を修正できます` | `管理者は公開状態・タグ・開催日・参加履歴を管理します` |
| demo toast で即時成功 | API 成功後に toast 表示 |
| placeholder Google Form URL | `01-api-schema.md` の responderUrl |
| admin members drawer のタグ直接編集 | `/admin/tags` の queue resolve へ誘導 |
| `detailLayout` の3案 | `ProfileHero + 縦セクション` の1案に固定 |
