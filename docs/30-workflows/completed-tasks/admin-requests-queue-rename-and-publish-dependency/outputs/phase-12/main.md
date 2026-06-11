`[実装区分: 実装仕様書]`

# Phase 12 — ドキュメント同期 総括（admin-requests-queue-rename-and-publish-dependency）

`taskType: implementation` / `visualEvidence: VISUAL` / `workflow_state: implemented_local_evidence_captured`

> 正本は [_shared-context.md](../../_shared-context.md)。本サイクルは implemented_local_evidence_captured（ローカル実装済み）。本ファイルは Phase 12 の総括として、Part 1（中学生レベルの概念説明）と Part 2（技術者レベルの 3 レーン要約）を示す。

---

## Part 1 — 中学生にも分かる説明

### このタスクで困っていたこと

管理画面に「依頼キュー」という画面があります。でも、それを見た人が「この画面は何のためにあるの？」「会員管理の画面で公開・非公開を切り替えられるなら、依頼キューはいらないのでは？」と迷ってしまいました。

### 実は、2 つの画面は「入口」が違うだけ

学校のクラスで例えるとこうです。

- **依頼キュー（=会員からの申請）** は、**生徒（会員）が自分で出した「お願い」を、係の人（管理者）が受け取って OK/NG を決める受付ボックス**です。たとえば「私のプロフィールを一時的に隠してください」「退会したいです」というお願いを、生徒が自分で書いて出します。係の人はそれを見て「承認」ボタンを押します。
- **会員管理** は、**係の人が自分の判断で、その場ですぐに公開・非公開を切り替える操作盤**です。誰かのお願いを待つのではなく、係の人が必要だと思ったらすぐ切り替えます。

つまり、お願いを「受け付けて承認する受付」と、係の人が「自分ですぐ切り替える操作盤」の **2 つは入口が違うだけで、どちらも必要** なのです。重なっているわけではありません。

### だから、消さずに分かりやすくする

機能はちゃんと正しく動いています。問題は「画面がその違いを何も説明していない」ことと、「依頼キューという言葉が分かりにくい」ことでした。そこで:

1. 名前を **「会員からの申請」** という分かりやすい言葉に変える（画面に出る文字だけ）。
2. 画面に「ここは会員本人が出した申請を承認する場所です。係の人が自分で切り替えたいときは会員管理へ」という案内を出す。
3. 会員管理の一覧で、申請を出している会員には **「申請中」の目印（バッジ）** を付けて、押すと申請の画面に飛べるようにする。これで「この会員はこっちの画面で申請を出しているんだな」と一目で分かる。
4. ステージング（試験環境）で実際に動きを確かめられるよう、お試しの申請データ（seed）を 3 件用意する。

### 大事なポイント

URL やプログラムの中の名前は変えません。**人が画面で読む文字だけ** を分かりやすくします。中身の仕組みは正しいので、見た目と案内だけ直す、という考え方です。

---

## Part 2 — 技術者向け 3 レーン要約

RCA: 機能（member-initiated 承認フロー / admin-initiated 即時トグル）は正しく、真因は **apps/web の情報設計欠如 + 命名の不親切さ**。API/D1/Form は無罪。よって削除せず存続させ、表示層の改善 + 依存可視化 + テスト seed を 1 サイクルで行う。

| Lane | スコープ | 主な変更 | 不変条件 |
| --- | --- | --- | --- |
| **A — テスト依頼 seed** | apps/api / testing | `catalog.ts` に `requests: TestRequest[]`（TEST-NOTE-V01/V02/D01）を追加。`build-seed-sql.ts` に `admin_member_notes` INSERT（`body=json_object('reason',?,'payload',json(?))`・`INSERT OR REPLACE`）と cleanup `DELETE ... note_id LIKE 'TEST-NOTE-%'` を追加。committed `test-accounts-{seed,cleanup}.sql` を再生成し drift guard PASS。 | D1 schema 変更なし（既存 `admin_member_notes` への seed 追加のみ）。manifest は member メタ不変なら不変。 |
| **B — 命名平易化 + 役割明確化** | apps/web | 「依頼キュー」族 → 「会員からの申請 / 申請一覧 / 申請詳細」へ **表示テキスト + aria-label のみ** 変更（shell-config / page.tsx / RequestQueuePanel / RequestQueueDetail）。説明文 + 会員管理への相互リンクを追加。 | ルート `/admin/requests`・API パス・コンポーネントファイル名・`id`/`data-*`/テストセレクタは不変。 |
| **C — 会員管理「申請中」バッジ + 相互リンク + API** | apps/api + apps/web | `GET /members` に相関サブクエリ（`json_group_array(DISTINCT note_type)` where `request_status='pending'`）追加 → `pendingRequestTypes` projection。`AdminMemberListViewZ` member item に `pendingRequestTypes: z.array(z.enum([...])).default([])` 追加。web 行に「申請中」バッジ + `Link(?type=...)`、会員管理ページに説明 + 相互リンク。 | 新 endpoint なし（projection 拡張のみ）。apps/web は D1 直接アクセスせず API レスポンスを読む。色は OKLch トークンのみ・既存チップ primitive 再利用。 |

DoD: typecheck / lint / focused test 全 PASS、HEX 0 件、seed drift guard PASS、AC-1..13 充足。staging seed apply / screenshot / commit / PR は user-gated（Phase 13）。

詳細実装手順は [implementation-guide.md](./implementation-guide.md) を参照。
