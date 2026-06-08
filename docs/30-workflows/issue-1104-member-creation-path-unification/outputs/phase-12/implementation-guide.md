# Implementation Guide — issue-1104 member 作成経路の単一 helper 統一

- 区分: 実装仕様書（NON_VISUAL / implementation_mode: new / implemented_local_evidence_captured）
- workflow: `docs/30-workflows/issue-1104-member-creation-path-unification/`
- issue: #1104（CLOSED・2026-06-05T01:50:06Z）/ 本仕様書は CLOSED のまま現行コードへ最適化（reopen しない）
- 対象ファイル: `apps/api`（repository / job / auto-link 内部ロジック）。`apps/web` は無変更。

---

## Part 1（やさしい説明 / 中学生レベル）

### 背景（なぜ必要か）

このタスクが必要な理由は、**会員を登録するときに「会員カード」と「会員ステータス票」を別々の人が別々のタイミングで作っていて、たまにステータス票を作り忘れることがある**からです。

たとえば、図書館で新しい利用者が来たときに、「利用者カード（名前と ID）」と「貸出ステータス票（延滞しているか、利用停止中か）」の 2 枚をセットで作る決まりだとします。ところが、カードを作る入口（窓口）が複数あって、ある窓口では「カードだけ作ってステータス票を作り忘れる」ことが起きていました。すると、その利用者は「カードはあるのにステータス票がない」という宙ぶらりんの状態（専門用語で「orphan = 親なし／みなしご状態」）になります。

この状態になると、職員がその利用者の詳細を開こうとしても「ステータス票が見つかりません」とエラー（404）になってしまい、操作ができなくなります。実際にこのシステムでも、会員の詳細を開けない・ステータスを変更できないという不具合が以前起きました。

### なぜ「窓口を 1 つにまとめる」のか

今までは「カードを作る処理」と「ステータス票を作る処理」が別々のプログラムに書かれていて、新しい入口（経路）を追加するたびに、開発者が「ステータス票も作るんだったな」と手で覚えて書き足す必要がありました。人が覚えておく仕組みは、いつか必ず忘れます。

そこで、**「会員カードを作るときは、必ずステータス票も一緒に作る」という決まりを 1 つの窓口（共通の処理 = 単一 helper）にまとめます**。これからは、どの入口から会員を登録しても、この 1 つの窓口を通すので、ステータス票の作り忘れが「構造的に」起きなくなります。覚えておく必要がなくなる、ということです。

### 何をするか（要約）

- 「会員カード（identity）」と「ステータス票（status）」を必ずセットで作る共通の窓口（単一 helper `createMemberWithStatus`）を 1 つ新しく作る。
- 会員が作られる入口は今 2 つあります。1 つは「申込フォームの取り込み（ingest）」、もう 1 つは「ログイン時のメール照合での自動ひも付け（auto-link）」です。この 2 つの入口を、両方ともこの新しい窓口（またはステータス票を必ず付ける処理）に通すように直します。
- とくに 2 つ目の「自動ひも付け」は、元の問題報告（issue）が見落としていた入口で、ここが今いちばんステータス票を作り忘れている場所です。今回ここを必ず直します。
- 3 つ目の処理（ステータス変更の前に、古い会員にステータス票がなければ補う守りの処理）は、新しく会員を作る入口ではないので、わざと残します。古い会員を守るための保険だからです。

### 既知の注意点（やさしい版）

- これは画面（見た目）を一切変えない作業です。だからスクリーンショットは不要です。
- 今回のローカル作業では、プログラム書き換えと自動テストまで完了しています。公開に関わる commit・PR 作成・staging 確認だけは、あなた（利用者）が「やってOK」と言ってから行います。
- データベースの構造（テーブルの形）は変えません。すでにある「ステータス票を作る部品」を再利用するだけです。

---

## Part 2（開発者向け詳細）

### 背景

`member_identities` 行を生成しうる production 経路が複数あり、各経路が `member_status` 既定行の生成を「各自のタイミングで・別呼び出しで」行う。生成責務が単一点に集約されていないため、ある経路が `member_status` 生成を欠くと orphan 会員（`member_identities` あり / `member_status` なし）が発生し、詳細 GET・status PATCH が 404 になる。親タスク `admin-member-detail-status-404-fix` が止血した症状の再発リスクであり、本タスクは生成責務を repository 層の単一 helper へ集約して構造的に封じる。

### 採用方針（要約）

- repo helper（新設）: identity 生成と `member_status` 既定行生成を **同一 helper 内で必ず両方行う** `createMemberWithStatus` を新設し、生成責務を 1 点へ集約。
- ingest 経路（P-1）: `upsertMember` + 別呼び出しの `ensureMemberStatusRow`（2 呼び出し）を単一 helper 1 呼び出しへ統合。
- auto-link 経路（P-2・最重要）: `backfillIdentityFromCandidate` の identity INSERT 直後に `ensureMemberStatusRow` を連結し、issue が見落とした orphan 源を構造的に解消。
- route 防御（P-3）: `member-status.ts:60` の防御呼び出しは新規生成経路でなく legacy orphan への mutation backstop。**意図的に保持**する。

### 単一 helper シグネチャ（F-1）

`apps/api/src/repository/members.ts` に追加する（既存 `upsertMember`（`members.ts:63`）と `ensureMemberStatusRow`（`repository/status.ts`）を内部委譲）:

```ts
/**
 * 会員を作成（upsert）し、member_status 既定行を必ず同期生成する単一 helper。
 * member 生成の唯一の正規経路。どの呼び出し元から作っても member_status orphan が
 * 構造的に発生しないことを保証する（issue #1104）。
 */
export async function createMemberWithStatus(
  c: DbCtx,
  row: UpsertMemberInput,
): Promise<void> {
  await upsertMember(c, row);                     // member_identities（既存関数を内部委譲）
  await ensureMemberStatusRow(c, row.memberId);   // member_status 既定行（既存 helper 再利用）
}
```

> import: `members.ts` で `ensureMemberStatusRow` を `./status` から import する。`status.ts` の現行 import は `_shared/db` / `_shared/brand` / `@ubm-hyogo/shared` / `_shared/sql` のみで `members.ts` を import しないため循環は発生しない（phase-3 §2 で確認済み）。

### 経路差し替え対応表（P-1 / P-2 / P-3）

| # | 経路 | 起点 | 差し替え内容 | 種別 |
| --- | --- | --- | --- | --- |
| P-1 | ingest（Form 同期） | `apps/api/src/jobs/sync-forms-responses.ts:307-314` | `upsertMember` + `ensureMemberStatusRow` の 2 呼び出しを `createMemberWithStatus` 1 呼び出しへ置換。`writeCount += 2` は不変（helper 内部 2 write） | 統合（F-2） |
| P-2 | auto-link（session 解決） | `apps/api/src/repository/identities.ts:69`（`backfillIdentityFromCandidate`）/ 呼び出し元 `apps/api/src/routes/auth/session-resolve.ts:53` | `INSERT OR IGNORE` 後に `findIdentityByEmail` で実際の identity を確定し、`ensureMemberStatusRow(c, asMemberId(identity.member_id))` を連結。既存 identity early return でも同じ補完を行う。戻り値 `Promise<MemberIdentityRow \| null>` は不変（副作用追加のみ） | status 連結（F-3・最重要） |
| P-3 | route mutation（status PATCH 防御） | `apps/api/src/routes/admin/member-status.ts:60` | **保持**。新規生成経路でなく legacy orphan への mutation backstop。コメントで「new-member 生成は createMemberWithStatus が保証。本呼び出しは legacy orphan への mutation 防御 backstop」と意図を明記 | 意図的保持（F-4） |

> `createMemberWithStatus` をそのまま auto-link に流用しない理由: `backfillIdentityFromCandidate` は upsert ではなく `INSERT OR IGNORE` で、引数型が `UpsertMemberInput` と異なる（`AutoLinkCandidate`）。よって helper 流用ではなく identity INSERT 直後の `ensureMemberStatusRow` 連結で両行生成を保証する（phase-2 §2.3）。

### エラーハンドリング / 冪等性 / エッジケース

- **冪等性**: `createMemberWithStatus` 内の identity は `ON CONFLICT DO UPDATE`、status は `INSERT OR IGNORE`。再呼び出しで重複 INSERT を起こさず throw しない。
- **既存行への INSERT OR IGNORE no-op**: auto-link で `backfillIdentityFromCandidate` の `INSERT OR IGNORE INTO member_identities` が既存 identity に対し no-op になるケースでも、`findIdentityByEmail` で実際の identity を確定してから `ensureMemberStatusRow` を実行するため安全。既存 status があれば no-op、無ければ既定行を生成する（legacy orphan の修復も兼ねる）。競合時に losing candidate の member_id へ status を誤生成しない。
- **member_status 既定行の安全性**: `member_status`（`apps/api/migrations/0002_admin_managed.sql:5-15`）の NOT NULL 列は全て DEFAULT 値あり（`public_consent='unknown'` / `rules_consent='unknown'` / `publish_state='member_only'` / `is_deleted=0` / `updated_at=datetime('now')`）。`member_id` のみ渡せば既定行が完成する。
- **D1 例外**: いずれの write も D1 例外は呼び出し元（ingest job の `withSyncMutex` / auth route）の既存ハンドリングに委ねる。本タスクで握り潰さない。
- **writeCount セマンティクス**: ingest の `writeCount += 2` は helper 内部 2 write のまま不変。

### 検証コマンド（PASS（2026-06-05 focused evidence））

```bash
# 型チェック
mise exec -- pnpm typecheck

# focused D1 contract test（実行済み: 5 files / 51 tests PASS）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts --maxWorkers=1 \
  apps/api/src/repository/__tests__/members.repository.spec.ts \
  apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/member-status.contract.spec.ts \
  apps/api/src/routes/auth/session-resolve.contract.spec.ts

# lint
mise exec -- pnpm lint

# grep gate（AC-3: P-1 は createMemberWithStatus 経由、P-2 は identities.ts 内の2つの意図的 ensure、P-3 は backstop として保持）
grep -rn "ensureMemberStatusRow" apps/api/src --include="*.ts" | grep -v ".spec.ts"

# apps/web 無変更確認（AC-6）/ 新規 migration なし確認（AC-7）
git diff --name-only | grep "apps/web" || echo "apps/web 無変更 OK"
git diff --name-only apps/api/migrations || echo "新規 migration なし OK"
```

> 実テストファイル名は Phase 4/5 で確定済み。上記 5 ファイルが focused evidence の対象。

### 既知制限（5 項目）

1. **ローカル実装済み**: `createMemberWithStatus` 新設・経路差し替え・focused D1 tests は 2026-06-05 に完了。commit/PR/staging のみ user-gated。
2. **FK 制約は followup-002 へ委譲**: `member_status.member_id` → `member_identities` の FK 制約（DB 層の整合性保証）は別関心であり、本タスクに含めない。本タスクはアプリ層の生成責務集約に限定する（AC-7）。
3. **staging smoke はユーザーゲート**: staging deploy / D1 への mutation / authenticated admin smoke は副作用を伴うため Phase 13（user-gated）。本仕様書の責務外。
4. **P-3 を保持するため grep gate は P-1/P-2 を対象に判定**: AC-3 の「散在集約」対象は新規生成経路（P-1/P-2）のみ。P-3（`member-status.ts:60`）は mutation 防御で性質が異なり意図的に残すため、grep 結果には P-3 の 1 件が残る（それを除いた新規生成経路の独立呼び出しが 0 件であることを確認する）。
5. **issue 棚卸し表の前提誤りを本タスクで補完**: issue #1104 §5.1 の作成経路棚卸しは auto-link（P-2）を見落としており、行番号も陳腐化していた（`:303→:307` / `:385→:391` / migration `0024→0025`）。本仕様書 index §1.2 が現行コードへ最適化した棚卸しを正本とする（issue は CLOSED のまま・reopen しない）。

---

## issue 前提の訂正注記（index §0/§1.2 の要約・必須）

issue #1104 §5.1 は member 作成経路を **ingest のみ**列挙し、**auto-link（`backfillIdentityFromCandidate` → `session-resolve.ts:53`）を棚卸しから欠落**させていた。auto-link は `INSERT OR IGNORE INTO member_identities` で identity を生成するが `member_status` を一切生成しない現役の orphan 源であり、staging で観測された orphan の有力な発生源である。本タスクはこれを統一対象（F-3）に含める。issue の行番号も現行コードと乖離していた（`:303→:307` / `:385→:391` / migration `0024→0025`）ため、本仕様書 index §1.2 を現行 grep 由来の正本とする。

---

## 視覚証跡

UI/UX 変更なし（`apps/web` 無変更・既存 endpoint surface / レスポンス shape 不変）のため Phase 11 スクリーンショットは不要。

代替証跡として以下を参照:

- `outputs/phase-11/manual-test-result.md`（NON_VISUAL 宣言・D1 contract test 計画と期待値・staging 手順）
- `../phase-10.md`（最終レビュー・AC 充足判定）
- D1 contract test（`vitest.d1.config.ts`・PASS（2026-06-05 focused evidence））= member_status 同期生成を機械検証する主証跡
