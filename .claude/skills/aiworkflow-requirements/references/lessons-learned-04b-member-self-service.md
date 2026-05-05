# lessons-learned: 04b Member Self-Service API 苦戦箇所（2026-04-29）

> 対象タスク: `docs/30-workflows/04b-parallel-member-self-service-api-endpoints/`
> Wave: 2 / parallel / implementation_non_visual
> 関連 references: `api-endpoints.md`（§UBM-Hyogo Member Self-Service API 04b）, `database-admin-repository-boundary.md`（§04b member self-service queue）, `docs/00-getting-started-manual/specs/04-types.md`, `docs/00-getting-started-manual/specs/06-member-auth.md`, `docs/00-getting-started-manual/specs/07-edit-delete.md`

将来同様のタスクを簡潔に解決するための知見をまとめる。

## L-04B-001: `SessionUserZ.authGateState` enum は「保持」と「ゲート判定」で文脈が違う

**苦戦箇所**: spec 04-types.md の `SessionUserZ.authGateState` 既存定義（`input` / `sent` / `unregistered` / `rules_declined` / `deleted`）と、`/me` response が必要とする「認証済み会員のゲート状態」（`active` / `rules_declined` / `deleted`）が一致せず、独自 `MeSessionUserZ` を再定義するか spec を分けるか迷った。`input` / `sent` / `unregistered` は magic-link 発行〜未登録の経路状態であり、認証済み `/me` 文脈では出現しない。

**解決方針**: spec 04-types.md と spec 06-member-auth.md を「セッション保持時 enum」と「ゲート判定時 enum」に文脈分離する形で更新（本タスクで spec 04 / 06 / 07 を modify 済み）。`MeSessionResponseZ.user.authGateState` は `active | rules_declined | deleted` の 3 値に固定し、`SessionUserZ` を直接消費する。再定義しない。

**適用先**: 「同じ概念名でもライフサイクルの段階で値域が違う enum」は、spec で文脈別に明示分離する。client 型を独自再定義する前に必ず spec 側で吸収する。

## L-04B-002: `packages/shared` の exports field にサブパスを網羅する

**苦戦箇所**: 04b 実装初期に `@ubm-hyogo/shared/zod/viewmodel` を import しようとしたが `packages/shared/package.json` の `exports` field に `./zod/viewmodel` 等のサブパスが網羅されておらず、import path を変える / barrel に経由させる対応が必要だった。

**解決方針**: 新規 zod schema を別 app から消費する場合は、まず `packages/shared/package.json` の `exports` field を update する PR を先行させる。barrel 経由の暫定回避は test 安定後に解消する。follow-up は unassigned-task として登録済み。

**適用先**: monorepo の shared package で zod / viewmodel / domain schema を分散公開する際は、`exports` field を canonical とし、sub-path export は新規追加時に必ず同 wave で更新する。

## L-04B-003: 「本文編集禁止」の不変条件根拠は specs に分散しているので 1 箇所に集約参照する

**苦戦箇所**: 04b の `PATCH /me/profile` を作らない判断の根拠が `specs/07-edit-delete.md`（再回答での更新を MVP の正式経路とする）と `specs/13-mvp-auth.md`（auth 経路の MVP 制約）に分散しており、レビュー時にどちらを引用すべきか判断が遅れた。

**解決方針**: `references/api-endpoints.md` §UBM-Hyogo Member Self-Service API（04b）の「禁止」節に「`PATCH /me/profile` は作らない」「`/me/*` path に `:memberId` を入れない」「GET 系 response に `admin_member_notes` 由来の `notes` / `adminNotes` を含めない」を集約。skill reference をワンストップにする。

**適用先**: 不変条件は仕様書本体に書きつつ、API 設計の禁止事項として skill reference 側の該当 endpoint セクションにも併記する。

## L-04B-004: `admin_member_notes` schema 変更は wave 間 ownership を Phase 1 で宣言する

**苦戦箇所**: 04b で `admin_member_notes.note_type` 列追加 (migration 0006) は本来 02c の admin repository ownership 領域に侵入する変更だった。Phase 1 の audit で「他 wave に schema 影響を出す変更」を明示宣言していなかったため、parallel wave の他タスクとの競合が顕在化した。

**解決方針**: additive migration（`note_type TEXT NOT NULL DEFAULT 'general'`）に限定して既存行と既存テストを破壊しない設計に倒した。Phase 1 audit で「他 wave に schema 影響を出す変更を含む」場合は冒頭で明示し、対象 wave の owner と additive 制約に合意する手順を skill workflow に組み込む。`database-admin-repository-boundary.md` の `adminNotes.ts` 行に 04b queue 拡張を追記済み。

**適用先**: parallel wave 設計時、Phase 1 で「DB schema 変更が wave 境界を跨ぐか」を明示確認する gate を入れる。additive only 制約をデフォルトにする。

## L-04B-005: Auth.js 未着フェーズの dev session ヘッダは production guard を必ず最初に書く

**苦戦箇所**: 05a / 05b の Auth.js cookie resolver が未着のため、04b 単体で endpoint テストを完結させる目的で `x-ubm-dev-session: 1` + `Authorization: Bearer session:<email>:<memberId>` の dev token 方式を導入した。production / staging 環境で dev token が誤受理されるリスクがあった。

**解決方針**: `session-guard` middleware で `ENVIRONMENT === 'production' || ENVIRONMENT === 'staging'` の場合は dev token を一切受け付けない明示ガードを最初に実装した。`x-ubm-dev-session: 1` 無しの request は dev token を無効化し 401 として扱う。Auth.js resolver 着任時は DI で `resolveSession` を差し替える前提で `createMeRoute(deps)` をファクトリ化した。

**適用先**: 認証スタック未着の段階で dev token を入れる場合は、(1) 環境別 deny ガードを最初に書く、(2) resolver を DI で差し替え可能にする、(3) dev token 受理経路を test ログ以外には残さない、を 3 点セットで実施する。

## L-04B-006: pending 判定は「最新行存在」ではなく `request_status` 列ベースに移行する（04b-followup-001）

**苦戦箇所**: 04b 初版の `hasPendingRequest` は「同一 member × note_type の最新 1 件が存在するか」で pending 判定していたため、admin が resolved/rejected 処理した後も「最新行が残っている」状態となり、本人の再申請が永久に弾かれる構造的バグを抱えていた。`/me/visibility-request` の AC-3（重複ガード）と AC-7（resolved 後の再申請許可）を両立する手段が無かった。既存テストは「最新行存在 = pending」前提で 9 件あり、列ベース判定への切替時に互換性を壊さないよう同期更新が必要だった。

**解決方針**: migration 0007 で `admin_member_notes` に `request_status TEXT` / `resolved_at INTEGER` / `resolved_by_admin_id TEXT` の 3 列を additive ALTER で追加し、既存 visibility_request / delete_request 行を `pending` で backfill した上で partial index `idx_admin_notes_pending_requests`（`WHERE request_status='pending'` 限定）を張った。partial index は pending 行のみを対象とすることで、resolved/rejected 行が増えても index サイズが膨らまない設計とした。`hasPendingRequest` を `WHERE request_status='pending'` の 1 行 SELECT に変更し、resolved 後の再申請を構造的に許容。`apps/api/src/routes/me/index.test.ts` に resolved 後の `POST /me/visibility-request` が 202 で成功するケースを追加し、列ベース判定の互換性を回帰テストで固定した。migration は 0006（note_type 追加）→ 0007（request_status 追加）の additive 連鎖で in-place ALTER + backfill + partial index を 1 migration に収めた。

**適用先**: queue 系テーブルで「処理状態 × 重複ガード × 再申請許容」の 3 条件を満たす際は、行存在ベースではなく状態列 + partial index を初手で採用する。state 列追加 migration は (a) ALTER ADD COLUMN, (b) 既存行 backfill, (c) 状態限定 partial index を 1 migration にまとめ、判定 helper の SQL を WHERE 句で絞ることで O(log n) を担保する。互換性確保には「最新行存在前提」のテストを列ベース前提に書き換えるリストを Phase 4 test-strategy で先に列挙する。
