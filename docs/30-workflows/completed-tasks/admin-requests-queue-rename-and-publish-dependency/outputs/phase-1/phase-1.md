# Phase 1 — 要件定義

`[実装区分: 実装仕様書]` / taskType: implementation / visualEvidence: VISUAL / workflow_state: implemented_local_evidence_captured

> 正本は [_shared-context.md](../../_shared-context.md)。本 Phase は要件・スコープ・受け入れ基準・前提検証を確定する。

## 1.1 背景と問題提起（ユーザーの声）

ステージング `https://ubm-hyogo-web-staging.../admin/requests`（依頼キュー）を見たユーザーから次の疑問が出た:

1. この画面が何のためにあるか分からない。
2. 会員管理（`/admin/members`）で公開/非公開を切り替えられるのに、依頼キューとの依存関係がない状態に見える。会員管理で非公開にしているなら、依頼キューの存在意義は何か。
3. 仕組みを整理してほしい。**不要なら削除**してほしい。
4. 公開/非公開以外で依頼キュー側に必要なものがあれば整えてほしい。
5. 「依頼キュー」という名前が分かりにくい。エンジニア以外でも分かる命名にしてほしい。
6. staging で「依頼を出しているユーザー」をテストアカウントとして作り、どう動くか見たい。

## 1.2 真因分析（RCA）— コードによる裏取り

| 観点 | 事実（裏取り元） |
| --- | --- |
| 依頼キューの正体 | 会員本人が `/me/visibility-request`・`/me/delete-request`（マイページ）から出した申請を `admin_member_notes`（`note_type=visibility_request\|delete_request`, `request_status=pending`）として受け、管理者が `POST /admin/requests/:noteId/resolve` で承認/却下する**承認フロー**。`apps/api/src/routes/me/index.ts` L245-348（申請作成）、`apps/api/src/routes/admin/requests.ts` L241-470（一覧・resolve） |
| 承認時の作用 | visibility_request approve → `member_status.publish_state` を payload.desiredState に更新。delete_request approve → `is_deleted=1` + retention purge 予約。通知 outbox に enqueue。`requests.ts` L373-455 |
| 会員管理トグルの正体 | 管理者が `PATCH /admin/members/:memberId/status { publishState }` で**即時・直接**変更（承認フロー不要・管理者起点）。`apps/api/src/routes/admin/member-status.ts` L43-89 |
| 仕様上の位置づけ | `docs/00-getting-started-manual/specs/11-admin-management.md` に「会員本人が作った依頼を処理する queue」「本人依頼の approve/reject は `/admin/requests` に集約し、管理者が member 本文を直接編集する UI は作らない」と明記 |

**結論（真因）**: 依頼キューと会員管理トグルは**起点が異なる別機能**であり冗長ではない。

- 依頼キュー = **会員本人発**の申請を承認する（セルフサービス + 承認 + audit + 通知）
- 会員管理トグル = **管理者起点**の即時操作

冗長に見えるのは **apps/web 表現層がこの違い・相互関係・命名を一切説明していないため**。機能・API・D1 スキーマは正しく動いており無罪。よってユーザーの「不要なら削除」に対する正しい回答は「**削除しない。役割と依存関係を画面で明示し、命名を平易化する**」。これを AskUserQuestion で確認し承認を得た（§1.4）。

## 1.3 「会員管理で非公開なら依頼キューの存在意義は？」への回答

会員管理で管理者が非公開にしても、それは**管理者の判断**による状態。依頼キューが扱うのは**会員本人の意思表示**（「自分で掲載を止めたい」「再開したい」「退会したい」）であり、両者は同じ `publish_state` 列を更新しうるが**発生源・責任主体・audit の意味が異なる**。

- 会員本人がマイページから「公開停止」を申請 → 管理者が内容確認の上で承認（誰の意思で止まったかが残る）。
- 管理者が運営判断で即座に非公開化（管理者の意思で止めた）。

両経路は独立に機能し、依頼キューは「会員の自己決定権の受付 + 承認の記録」という固有価値を持つ。よって削除は不適切。ただし UI でこの差を可視化する必要がある（Lane B/C）。

## 1.4 ユーザー決定（AskUserQuestion 2026-06-09）

| # | 質問 | 決定 |
| --- | --- | --- |
| Q1 | 機能の扱い | **存続+役割明確化**（削除しない） |
| Q2 | 新名称 | 「依頼キュー」→ **「会員からの申請」** |
| Q3 | テスト依頼 seed | **既存 TEST-MEM 会員に依頼を紐付け** |
| Q4 | 依存関係の可視化 | **会員管理に「申請中」バッジ** ＋ **相互リンク＋説明文** |

Q4 で「500 エラー調査」「承認 before→after 公開状態の差分表示」は**選択されなかった** → スコープ外（Phase 12 で baseline 候補として記録のみ）。

## 1.5 スコープ

### 含む（3 レーン・1 サイクル完結）

- Lane A: テスト依頼 seed（`catalog.ts` + `build-seed-sql.ts` 拡張、SQL 再生成）
- Lane B: 命名平易化 + 依頼キュー画面の役割明確化（表示テキスト + 説明 + 相互リンク）
- Lane C: 会員管理「申請中」バッジ + 相互リンク + 会員一覧 API の `pendingRequestTypes` 追加

### 含まない（スコープ外・理由付き）

| 項目 | 理由 | 扱い |
| --- | --- | --- |
| `GET /api/admin/members/TEST-MEM-01 500` の修正 | Q4 で非選択。会員詳細取得の別系統バグで本タスク（命名/依存/seed）と独立 | Phase 12 未タスク検出に baseline 記録 |
| 承認の before→after 公開状態の差分強調 UI | Q4 で非選択 | Phase 12 未タスク検出に baseline 記録 |
| ルートパス `/admin/requests` のリネーム | URL は内部識別子。リダイレクト追加は 1 サイクルのコスト/リスク増。表示ラベルのみ平易化で目的達成 | 不変（AC-4） |

## 1.6 受け入れ基準（AC）

[_shared-context.md §6](../../_shared-context.md) の AC-1〜AC-13 を本タスクの受け入れ基準とする（命名 AC-1..4 / seed AC-5..8 / バッジ・API AC-9..11 / 非破壊・依存整合 AC-12..13）。

## 1.7 前提検証（実コード Read による裏取り — Issue #1065 対策）

| 前提 | 検証結果 |
| --- | --- |
| 依頼は admin_member_notes に格納される | ✅ `0006`/`0007` migration で note_type / request_status 追加済 |
| 会員一覧 API は member_status を JOIN 済 | ✅ `members.ts` L403-406。相関サブクエリ追加が低コストで可能 |
| 会員一覧に pending 申請フィールドは未存在 | ✅ L432-446 の projection に pending 関連なし → 新規追加が必要 |
| seed は catalog → build-seed-sql → committed SQL の決定論生成 | ✅ drift guard あり。catalog 拡張で seed に依頼を載せられる |
| 既存 seed に依頼レコードはない | ✅ test-accounts seed に admin_member_notes INSERT なし（別途 issue-399 seed に前例） |
| 表示文言「依頼キュー」の出現箇所 | ✅ shell-config / requests page / RequestQueuePanel / RequestQueueDetail |

## 1.8 完了条件（Phase 1）

- [x] 真因（会員本人発の承認 vs 管理者起点の即時操作）を確定
- [x] ユーザー決定 4 件を反映
- [x] スコープ（3 レーン・含まない 3 項目）を確定
- [x] AC-1..13 を確定（_shared-context §6）
- [x] 前提を実コードで裏取り
