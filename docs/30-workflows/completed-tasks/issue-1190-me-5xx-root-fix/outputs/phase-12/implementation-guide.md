# Phase 12: 実装ガイド（implementation-guide）

## メタ情報

| 項目 | 値 |
|------|------|
| Phase | 12 |
| taskType | `implementation` |
| visualEvidence | NON_VISUAL（証跡は focused vitest + grep gate + diff + staging 実機ログ） |
| workflow_state | `implemented_local_evidence_captured`（コード実装・ローカル検証は本サイクルで完了） |

---

## Part 1: 中学生レベルの概念説明（なぜ → 何を）

### なぜこれが必要か（レストランの例え話）

マイページを開くのは、レストランで「定食」を注文するのに似ています。定食には、メインのおかず（あなたのプロフィール本体）と、小鉢（「変更申請中ですよ」のお知らせ・顔写真・編集リンク）が付いてきます。

いま問題なのは、**小鉢を 1 つ用意できなかっただけで、店員さんが「本日は営業できません」と定食ぜんぶを下げてしまう**ことです。顔写真や編集リンクの小鉢は「用意できなければ載せずに出す」ルールになっているのに、「申請中のお知らせ」の小鉢だけそのルールがなく、失敗するとお店全体のエラー（500）になってしまいます。これが 1 つ目の直すところです（F-1）。お客さんには「小鉢が 1 つ無いだけの定食」をちゃんと出すようにします。

2 つ目の問題は、厨房で何かが失敗したとき、**報告書に「厨房のどこで失敗したか」が書かれない**ことです。今は全部「なにかのエラー（UBM-5000）」とだけ書かれるので、「入口の確認（session-guard）で転んだのか、メイン調理（profile 組み立て）で転んだのか」を後から特定できません。実は「データベースのエラー（UBM-5001）」という専用の報告用紙がもう用意されているのに使われていません。これからは専用用紙に「どこで転んだか（scope）」も書きます（F-2）。大事なのは、報告書に**お客さんの個人情報（会員番号やメールアドレス）は絶対に書かない**ことです。場所と原因だけ書きます。

3 つ目は、**この「正しい失敗のしかた」を確認するテストが無い**ことです（F-3）。わざとデータベースを失敗させてみて、「定食はちゃんと出るか」「報告書は正しく書かれるか」を自動で確認するテストを足します。

お客さんから見えるもの（画面・住所・返事の形・エラー番号の種類）は何も変わりません。変わるのは「失敗したときの店の中の動き方」だけです。

### 何をするか（3 行まとめ）

1. 「申請中のお知らせ」取得が失敗してもマイページ全体を 500 にせず、その欄だけ空にして 200 を返す（T01）。
2. 入口確認・プロフィール組み立てのデータベース失敗を「UBM-5001 + どこで失敗したか（scope）」で報告書（ログ）に書く（T02）。お客さんへの返事の形は変えない。
3. わざと失敗させるテスト（TC-1〜TC-4）でこの動きを固定する（T03）。あわせて Issue #1190 に「現状コードに合わせた再定義」の説明コメント草稿を用意する（T04・投稿はユーザー承認後）。

---

## Part 2: 技術者向け実装ガイド

### 背景

`GET /me`・`GET /me/profile`（`apps/api/src/routes/me/index.ts`・`createMeRoute`）はグローバル `app.onError(errorHandler)`（`apps/api/src/index.ts:195`）配下にマウントされており、未捕捉例外は `ApiError.fromUnknown(err, "UBM-5000")` → `application/problem+json` + 構造化 `logError` に整形される。しかし (a) `getPendingRequestsForMember`（P4・`routes/me/index.ts:181`）だけ fail-hard で二次データの D1 例外が全体 500 になる、(b) 一次データ経路（P1 `session-guard.ts:84-87` / P2 `:105` / P3 `routes/me/index.ts:170-175`）の例外が汎用 `UBM-5000` に丸まり発生 scope を特定できない、(c) D1 例外注入の契約テストが無い。経路マップ P1-P8 は Phase 1 で行番号実測検証済み。

### 要約

catch ブロック 4 箇所 + import 数行 + 既存 contract spec への追記で F-1〜F-3 を解消する。`/me` の path・shape・status 体系（200/401/404/410/5xx）・D1 schema・apps/web は一切変更しない。新規 production ファイル・新規エラーコード・新規ログイベントは作らない（`UBM-5001` は `packages/shared/src/errors.ts:33` に既定義）。

### 実装ステップ

1. **T02（P1/P2: session-guard 分類）** — `apps/api/src/middleware/session-guard.ts` の `Promise.all([findIdentityByMemberId, getStatus])`（:84-87）と `findAdminByEmail`（:105）に `.catch((err: unknown): never => { throw new ApiError({ code: "UBM-5001", log: { cause: err, context: { scope: "me-session-guard" }, ...(err instanceof Error && err.stack !== undefined ? { stack: err.stack } : {}) } }); })` を付与する。`ApiError` の `cause`/`context` は**トップレベルではなく `log` オプション配下**（Phase 2 §3 で実コンストラクタ契約を確定済み）。
2. **T02（P3: builder 分類）** — `apps/api/src/routes/me/index.ts` の `buildMemberProfile` 呼び出し（:170-175）に同型の `.catch` を付与する（scope は `me-profile-builder`）。
3. **T01（P4: fail-soft 統一）** — 同ファイルの `getPendingRequestsForMember`（:181）を `.catch((err: unknown): PendingRequests => { logError({ code: "UBM-5001", status: 500, message: "pendingRequests fail-soft", path: "/me/profile", context: { scope: "me-pending-requests" }, log: { cause: err } }); return {}; })` へ変更する（photoUrl :183-185 と同方針・200 維持。`logError` は `context`/`log` が**トップレベル**にあり ApiError と配置が異なる点に注意）。
4. **T03（契約テスト）** — `index.contract.spec.ts` に `app.onError(errorHandler)` 付き harness と SQL パターン選択式 failing D1 Proxy を追記し、TC-1〜TC-4 を既存 `/me` contract spec へ集約する。TC-4 は既存全件の回帰緑。詳細は Phase 2 §7.2 / Phase 4 の期待値表。
5. **T04（Issue 草稿）** — `outputs/phase-12/issue-1190-comment-draft.md`（本 Phase で作成済み）を Issue #1190 へ投稿する（user-gated・Phase 13 G3）。

### scope 識別子（固定 3 値・ログ専用）

| scope | 経路 | 露出先 |
|-------|------|--------|
| `me-session-guard` | P1/P2（session-guard の D1 lookup） | `logError` の `context` のみ。client へ返る problem+json（`toClientJSON`）には `log` が構造的に含まれず非露出 |
| `me-profile-builder` | P3（`buildMemberProfile`） | 同上 |
| `me-pending-requests` | P4（fail-soft 後の logError） | 同上 |

`context` は literal `{ scope: "<3 値のいずれか>" }` 固定。memberId / email / 動的値の混入を禁止（不変条件 #11・grep gate + TC アサーションで機械保証）。

### 検証コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts -t issue-1190
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
git diff --stat -- apps/web        # 空（AC-6）
rg -n 'type Me.*DatabaseScope|toMeDatabaseError\("me-(session-guard|profile-builder)"|scope: "me-pending-requests"' apps/api/src/middleware/session-guard.ts apps/api/src/routes/me/index.ts
pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix
pnpm gate-metadata:validate
```

### 既知制限

- `/me` の shape・path・status 体系・D1 schema・Google Form 仕様・apps/web は一切変更しない（AC-4/AC-6/AC-7）。`UBM-5500`（503）への変更は status 体系変更にあたるため行わない。
- 本 WF は「staging 事象の真因が H4 だったか」の確定を待たない設計。真因確定（MT-6）・410 復帰運用（#1189）・transport 根治（別 WF）はスコープ外。
- 本サイクルは implemented_local_evidence_captured。コード実装・テスト実行は完了。commit・PR・staging・Issue mutation は user-gated（Phase 13 G2-G4）。

---

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要（n/a）。代替証跡は `../phase-11/manual-test-result.md`（MT-1〜MT-6 手順・結果欄）と focused vitest（TC-1〜TC-4）である。物理 PNG・screenshots ディレクトリは作らない。

| 証跡 | パス / 内容 | 状況 |
|------|-------------|------|
| focused vitest | TC-1〜TC-4（既存 `/me` contract spec に集約） | present |
| grep gate / diff 証跡 | #11 literal scope・apps/web 空 | present |
| staging 実機ログ | `UBM-5001` + `context.scope`（`cf.sh tail`・MT-5/MT-6） | pending（user-gated） |
| スクリーンショット | （NON_VISUAL ゆえ取得しない） | n/a |

## 完了条件

- [x] Part 1（中学生レベル・例え話・なぜ→何を・専門用語を避けた説明）を記述した。
- [x] Part 2（背景・要約・実装ステップ・scope 識別子・検証コマンド・既知制限）を記述した。
- [x] `## 視覚証跡` で「UI/UX 変更なしのためスクリーンショット不要。代替証跡は manual-test-result.md と focused vitest」を明記した。
- [x] 識別子（`UBM-5001` / `me-session-guard` / `me-profile-builder` / `me-pending-requests` / P1-P8 / F-1〜F-3 / TC-1〜TC-4）を SSOT と一致させた。

## 成果物
- `outputs/phase-12/implementation-guide.md`（本ファイル）

## 参照資料
- `../../_shared-context.md` §2（経路マップ）/ §3（タスク分解・シグネチャ）
- `../phase-1/phase-1.md`（行番号実測・関数契約検証）/ `../phase-2/phase-2.md`（Before/After・テスト戦略）
- `packages/shared/src/errors.ts` / `logging.ts`、`apps/api/src/middleware/error-handler.ts`（既設・無変更）

## 統合テスト連携
本ガイドの実装ステップは Phase 5 のタスク仕様書（T01-T04）と同一の正本（SSOT §3 / Phase 2）に基づく。本サイクルで TC-1〜TC-4 緑 + 検証コマンド全 PASS を取得後、Phase 13 の PR 本文へ本ガイドを反映する。
