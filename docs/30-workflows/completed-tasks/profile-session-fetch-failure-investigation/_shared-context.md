# SSOT: profile-session-fetch-failure-investigation

> 本ファイルは Phase 1-13 仕様書生成の **設計正本（Single Source of Truth）**。各 phase-N.md / index.md / artifacts.json はこの内容と矛盾してはならない。
> 衝突時の正本順位: 本 SSOT → index.md → outputs/phase-{1,2,3}/phase-N.md → outputs/phase-5/task-*.md。

---

## 0. メタ情報（全 phase 共通）

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-fetch-failure-investigation` |
| canonical_root | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation` |
| branch | `feat/profile-session-fetch-failure-investigation` |
| 起点 | `origin/dev` (b59a9b450) |
| 種別 | investigation / diagnosis（観測性向上のコード変更を含む） |
| **実装区分** | **`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`** |
| taskType | VISUAL（`/profile` のエラー表示分岐を観測性目的で変更するため。監査タスク再解釈を参考にしつつ実装タスク骨格を優先） |
| implementation_mode | `new`（診断用の新規コード + 新規テスト） |
| visualEvidence | VISUAL_ON_EXECUTION（`/profile` エラーバナー表示の区別化。現象 screenshot はユーザー提供済み、診断後の static UI contract screenshot は実装時に取得、staging 認証 runtime screenshot は user-gated） |
| workflow_state | `implemented_local_evidence_captured`（本サイクルはローカル実装とfocused tests完了。実装・commit・PR は後続の 03.実装.md / user-gated） |
| 想定 PR base | `dev` |
| relatedIssue | null（staging 実機観察起点） |

### 実装区分の判定根拠（CONST_004 準拠・仕様書冒頭に明記すること）

- ユーザー指定スコープは **「調査・原因特定のみ（診断中心）」**。
- ただし「マイページが取得できない原因を**確認可能にする**」目的の達成には、現状 410/5xx/FAILED を一律「時間をおいて再読み込み」へ集約して root cause を隠蔽している観測性欠如（H6）を是正する**コード変更（エラーコード区別表示・構造化ログ・診断スクリプト）が必須**。
- よって CONST_004 に従い、純粋な docs-only ではなく **診断・観測性向上のコード変更を含む実装仕様書**として作成する。
- 本格的な根本修正（410 復帰フロー / 5xx 原因の session-resolver・API 修正 / transport デプロイ齟齬の運用是正 / 管理者 `/profile` 専用 UX）は、**真因が staging 実機調査で確定するまで修正方針を確定できない**ため CONST_007 例外条件①（合意未済の仕様分岐）に該当し、Phase 12 で未タスク化する（ユーザーが「調査・原因特定のみ」を選択済み = 分離承認済み）。

---

## 1. 主問題（真の論点）

**staging `/profile`（マイページ）で、ログイン済みにもかかわらず「セッション情報を取得できませんでした / 時間をおいて再読み込みしてください」エラーバナーが表示され、マイページ本体が描画されない。この root cause を staging 実機で確定し、以後同種事象を即座に切り分けられる観測性を獲得する。**

- 現象 URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile`
- 観測状態: 左下アカウント「万壽本大嗣・管理者」でログイン済み。コンソールの Sentry/拡張ノイズは無関係（スコープ外）。

---

## 2. 真因仮説マトリクス（調査の核心）

`/profile` Server Component は `safeServerFetch(() => fetchAuthed<MeSessionResponse>("/me"), { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] })` で `/me` を取得する（`apps/web/app/(member)/profile/page.tsx:38-50`）。エラー分岐は次の 2 つだけ:

- `meResult.error.code === "MEMBER_SESSION_404"` → 「アカウント情報を確認できませんでした。再ログインしてください。」+ 再ログイン CTA（page.tsx:53-63）
- それ以外（非2xx 全般 / transport 失敗）→ **「時間をおいて再読み込みしてください。」+ 再読み込み（page.tsx:66-74）← 画像の症状**

`/me` の API 側分岐（`apps/api/src/middleware/session-guard.ts`）:

| API 応答 | 条件 | web 側の帰結 | エラーバナー文言 | 画像症状と一致 |
| --- | --- | --- | --- | --- |
| 401 UNAUTHENTICATED | session 未解決 / identity or status 不在（session-guard.ts:78-79, 89-92） | `fetchAuthed` が 401→`AuthRequiredError` throw → `rethrowOn` で rethrow → **`/login?redirect=/profile` へ redirect**（page.tsx:46-47） | （バナー無し・redirect） | **✗ 不一致** |
| 404 NOT_FOUND | route 解決層・末尾スラッシュ非マッチ（既存 WF profile-reload-session-404-fix が対処済み） | `MEMBER_SESSION_404` → 「再ログイン」分岐 | 再ログイン CTA | **✗ 不一致** |
| 410 DELETED | `member_status.is_deleted=1`（session-guard.ts:95-100） | `FetchAuthedError(410)` → `MEMBER_SESSION_410` → デフォルト分岐 | 時間をおいて再読み込み | **✓ 一致** |
| 5xx | session-resolver / D1 / ハンドラ例外 | `FetchAuthedError(5xx)` → `MEMBER_SESSION_5xx` → デフォルト分岐 | 時間をおいて再読み込み | **✓ 一致** |
| transport 失敗 | service-binding 未応答 / 旧 bundle / network（message に 3桁が無く `statusFromError`→null） | `MEMBER_SESSION_FAILED` → デフォルト分岐 | 時間をおいて再読み込み | **✓ 一致** |

### 仮説一覧（Phase 1 に転記）

| ID | 仮説 | 症状一致 | 一次切り分け方法 |
| --- | --- | --- | --- |
| H1 | 既存 6 WF の staging 未デプロイ（古い bundle が残存） | △（主要修正は dev マージ済みだが staging 反映状態は要確認） | staging deploy 版数 / `/me` を直 https で叩く |
| H2 | 401（session 未解決 / identity・status 不在） | ✗（redirect されバナーにならない） | `/me` の HTTP status を DevTools / 診断スクリプトで確認 |
| H3 | **410（`member_status.is_deleted=1`）→ `MEMBER_SESSION_410`** | ✓ | `/me` status=410 か / 当該 member の `member_status.is_deleted` を D1 で確認（read-only） |
| H4 | **5xx（session-resolver / D1 / ハンドラ例外）→ `MEMBER_SESSION_5xx`** | ✓ | `/me` status=5xx か / API worker ログ |
| H5 | **transport 失敗（service-binding 未応答 / 旧 bundle / network）→ `MEMBER_SESSION_FAILED`** | ✓ | service-binding 経由応答確認 / `MEMBER_SESSION_FAILED` か `_410`/`_5xx` か |
| H6 | **観測性欠如（410/5xx/FAILED を一律「時間をおいて再読み込み」に集約）= 診断不能の主因** | 主問題 | page.tsx:66-74 の分岐 |

最有力: **H3 / H4 / H5**（いずれも非404・非redirect でデフォルト分岐に落ちる）。**401・404 は症状と矛盾するため一次的に除外可能**。どれが真かは観測性が無いため現状切り分け不能 → これが H6 を是正する動機。

---

## 3. スコープ（CONST_007: 今回 1 サイクルで完結）

### IN（今回サイクル）

1. **原因調査（diagnosis）**: staging 実機で `/me` の HTTP status / error code を確定し、H1〜H5 のどれかへ収束させる手順と結果記録。
2. **観測性向上（observability・最小コード変更）**:
   - **D1**: `/profile` page.tsx のエラー分岐を `MEMBER_SESSION_410` / `MEMBER_SESSION_5xx`(5xx族) / `MEMBER_SESSION_FAILED` で区別し、ユーザー向けには安全な文言、開発者向けには `data-*` 属性 or ログで原因コードを可視化する（root cause を隠蔽しない）。
   - **D2**: server-side で `/me` 取得失敗時に `status` / `code` / `path` を構造化ログ出力（`console.error` の構造化 or 既存 Sentry 経路）。技術文字列をユーザーに露出しない不変条件は維持。
   - **D3**: 診断スクリプト `scripts/diagnose-profile-session.sh`（read-only）: staging の `/me` を https 直で叩き status を確認、env/secret parity（AUTH_SECRET 等）と staging deploy 版数の確認手順を 1 本に集約。
3. **回帰テスト**: D1/D2 の分岐・ログを `*.spec.{ts,tsx}` で固定。

### OUT（CONST_007 例外①で未タスク化・Phase 12 で formalize）

| 項目 | 分離理由（真因確定後でないと方針を決められない） | 起票先 |
| --- | --- | --- |
| 410 の本格対応（is_deleted member の復帰 or 明示誘導） | 真因が 410 と確定した場合のみ着手。誘導文言は要合意 | `completed-tasks/<wf>/unassigned-task/` |
| 5xx の根治（session-resolver / API worker / D1 のバグ修正） | 真因が 5xx と確定し、例外箇所を特定してから | 同上 |
| transport デプロイ齟齬の運用是正（旧 bundle 残存） | 真因が transport と確定した場合のみ。deploy 操作は user-gated | 同上 |
| 管理者アカウントの `/profile` 専用 UX | 管理者が member profile を持つ/持たないが調査で確定してから | 同上 |

### 不変条件（CLAUDE.md / UI prototype alignment 準拠）

- 既存 API endpoint surface を変更しない（`/me` の path・レスポンス shape・status 体系は不変。観測は read-only）。
- D1 直接アクセスは `apps/api` に閉じる（不変条件 #5。調査での D1 参照は read-only かつ `apps/api` 経由 or `bash scripts/cf.sh d1` ラッパー経由）。
- `apps/web` の env 参照は `getEnv()` / `getPublicEnv()` / `getAuthEnv()` / `getPublicFetchEnv()` 経由のみ（`process.env` 直接参照禁止）。
- 不変条件 #11: `/me/*` は `session.user.memberId` のみ参照し、memberId を response/ログに露出しない（ログは memberId をマスク or 出さない）。
- OKLch トークン正本（HEX 直書き禁止）。エラー表示変更は既存 `section-error` primitive と `SectionError` props 拡張に留め、新規 primitive を生やさない。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。
- `wrangler` 直叩き禁止。Cloudflare 系は `bash scripts/cf.sh` ラッパー経由。
- secret 実値・トークンを出力/ドキュメントに転記しない。`.env` を cat/Read しない。

---

## 4. 受入条件（AC・Phase 1 に転記）

| ID | 受入条件 |
| --- | --- |
| AC-1 | staging 実機で `/profile` アクセス時の `/me` HTTP status（404/410/5xx/transport 失敗）と web 側 error code（`MEMBER_SESSION_*`）を確定し、H1〜H5 のいずれかへ収束した結論を `outputs/phase-11/manual-test-result.md` に根拠付きで記録する |
| AC-2 | 管理者アカウント（万壽本大嗣・管理者）が member identity/status を保持するか、session-resolver が staging で Auth.js cookie を解決できるかを read-only で確認し、管理者 `/profile` の期待挙動を結論として明記する |
| AC-3 | `/profile` のエラー分岐が `MEMBER_SESSION_410` / 5xx 族 / `MEMBER_SESSION_FAILED` を区別し、root cause を開発者が判別できる（ユーザー向け文言は安全側を維持しつつ、原因コードを `data-*` 属性 or ログで可視化）。401→redirect・404→再ログイン CTA の既存挙動は回帰なし |
| AC-4 | `/me` 取得失敗時に server-side で `status`/`code`/`path` を構造化ログ出力する（memberId 等の個人情報は出さない）。技術文字列はユーザー画面に露出しない |
| AC-5 | 診断スクリプト `scripts/diagnose-profile-session.sh`（read-only・冪等）が存在し、staging `/me` の status 確認・env/secret parity 確認・deploy 版数確認の手順を 1 本で再現できる |
| AC-6 | `/me` のレスポンス shape・path・status 体系、D1 schema、Google Form 仕様、認証境界（fail-closed）を一切変更しない |
| AC-7 | 区別分岐・ログ・診断の挙動を `*.spec.{ts,tsx}` で固定し、`mise exec -- pnpm typecheck` / `pnpm lint` / 対象 vitest がすべて PASS |
| AC-8 | 真因確定後に必要となる本格修正を Phase 12 で未タスク化し、配置先・実施時期・依存を明記する（0 件にしない） |

---

## 5. 対象 inventory（current code anchor）

| 系統 | パス | 役割 / 調査観点 |
| --- | --- | --- |
| profile page (web) | `apps/web/app/(member)/profile/page.tsx` | `/me` 結果分岐（53-63=404再ログイン / 66-74=デフォルト「時間をおいて再読み込み」）。D1 の改修対象 |
| error UI (web) | `apps/web/src/components/member/SectionError.tsx` | `title/detail/retryHref/actionHref/actionLabel` props。`data-*` 可視化の拡張対象 |
| safe fetch (web) | `apps/web/src/lib/server-fetch/safe-fetch.ts` | `normalizeError`（`codePrefix_<status>` 生成 / status 無→`_FAILED`）。`STATUS_FROM_MESSAGE=/\bfailed:?\b.*\b(\d{3})\b/`。D2 ログ挿入候補 |
| authed fetch (web) | `apps/web/src/lib/fetch/authed.ts` | 401→`AuthRequiredError` / 非2xx→`FetchAuthedError(status,text)`。cookie 転送 |
| transport (web) | `apps/web/src/lib/fetch/transport.ts` | service-binding 優先 → baseUrl → local fallback → 非local で throw |
| env (web) | `apps/web/src/lib/env.ts` | `getAuthEnv()`（`API_SERVICE`/`INTERNAL_API_BASE_URL`）。read-only 確認 |
| me route (api) | `apps/api/src/routes/me/index.ts` | `GET /me` ハンドラ（200）。read-only |
| session guard (api) | `apps/api/src/middleware/session-guard.ts` | 401（78-79, 89-92）/ 410（95-100）判定。真因切り分けの中核 |
| session resolver (api) | `apps/api/src/middleware/me-session-resolver.ts` | Auth.js cookie/JWT → session 解決。staging 動作の確認対象 |
| me mount (api) | `apps/api/src/index.ts` | `/me` mount + `notFound`。read-only |
| web wrangler | `apps/web/wrangler.toml` | `[env.staging]` に `API_SERVICE`(service)/`INTERNAL_API_BASE_URL` 設定済みを確認（H5 切り分け） |
| 診断スクリプト | `scripts/diagnose-profile-session.sh`（**新規**） | staging `/me` status / parity / deploy 版数 |
| 既存ラッパー | `scripts/cf.sh` | Cloudflare CLI（read-only D1 / whoami / deploy 版数）。直 wrangler 禁止 |

### 既存命名規則（FB-01 / FB-SDK-07-4 遵守）

- web fetch: `fetchAuthed` / `safeServerFetch`、error code `MEMBER_SESSION_<status>` / `MEMBER_SESSION_FAILED`。
- error UI: `SectionError`（`section-error` primitive）。CTA は `actionHref`/`actionLabel` の既存 optional props を使う。新規 primitive 禁止。
- script: `scripts/*.sh`（既存 `diagnose-auth-secret-parity.sh` / `smoke-staging-me.sh` と同系の命名・read-only 規約に揃える。既存スクリプトを再利用できる場合は再利用）。
- test: `*.spec.{ts,tsx}`。

---

## 6. 既存関連ワークフローとの関係（重複回避・真因引き継ぎ）

すべて `implemented_local_evidence_captured`（ローカル実装済み・一部 dev マージ済み・未デプロイ要素あり）。本タスクは **これらが解決済みの真因（404・loopback・resolver 未接続・safeServerFetch 化）を「解決済み前提」として引き継ぎ、なお残るデフォルト分岐（410/5xx/FAILED）の真因を切り分ける**ことで重複しない。

| 既存 WF | 解決済み真因 | 本タスクでの扱い |
| --- | --- | --- |
| `profile-reload-session-404-fix` | `/me` 末尾スラッシュ 404（route 解決層） | 404 は「再ログイン」分岐 = 画像症状と不一致。解決済み前提で除外 |
| `staging-api-url-and-session-recovery` | service-binding loopback 404 / localhost 焼込み | service-binding は wrangler staging に設定済みを確認。応答性は H5 で再確認 |
| `06b-A-me-api-authjs-session-resolver` | Auth.js cookie session resolver 未接続 | resolver は実装済み。staging での実動作を AC-2 で確認 |
| `login-stale-link-and-profile-me-safe-fetch` / `issue-879-...` | `/me` 失敗の throw 伝播 → `safeServerFetch`+`SectionError` 化 | 現状の集約分岐（page.tsx:66-74）はこの成果。本タスクはここに観測性を足す |
| `admin-member-detail-status-404-fix` | orphan `member_status`（identity 有・status 無） | 同種データ不整合は H2(401) 側。本症状(410/5xx)とは別経路だが調査で参照 |

> dev に現状マージ済みであることを確認した anchor: `page.tsx` は `safeServerFetch`+`MEMBER_SESSION_404` 分岐済み、`transport.ts` は service-binding 優先 + 非local throw 済み、`/me` proxy route と `me-session-resolver.ts` が存在。

---

## 7. Phase 構成（13 仕様書・各 phase の責務）

> 調査主導タスクのため、`phase-template-audit-task.md` の Phase 再解釈を「参考」にしつつ、観測性のコード変更があるため実装タスク骨格（RED/GREEN・カバレッジ）を主とするハイブリッド。

| Phase | 名称 | 本タスクでの責務 | 主成果物 |
| --- | --- | --- | --- |
| 1 | 要件定義 | 観測事象・真因仮説マトリクス（H1-H6）・AC-1〜8・inventory・命名規則・実装区分判定根拠・既存WF棚卸し | `outputs/phase-1/phase-1.md` |
| 2 | 設計 | 調査 lane 設計（実機調査 / コード経路 / D1 read-only）+ 観測性向上の設計（D1/D2/D3）+ 状態所有権 + 因果ループ + validation path | `outputs/phase-2/phase-2.md` |
| 3 | 設計レビュー | Phase 4 へ進む判定。調査の網羅性・観測性変更が不変条件を侵さないかをレビュー。Phase 11 が「staging 実機切り分け」に特化する旨を宣言 | `outputs/phase-3/phase-3.md` |
| 4 | I/O 契約 / テスト設計 | `/me` status × web error code の対応表を契約化。診断スクリプトの I/O。区別分岐・ログの期待値（RED 観点） | `outputs/phase-4/phase-4.md` |
| 5 | 実装手順 | D1（page.tsx 区別分岐）/ D2（構造化ログ）/ D3（診断スクリプト）の Before→After 手順を task 分割。本格修正は範囲外と明記 | `outputs/phase-5/phase-5.md` + `task-01-error-branch-disambiguation.md` / `task-02-structured-logging.md` / `task-03-diagnose-script.md` |
| 6 | テスト拡充 | 410/5xx/FAILED/404/401 各分岐の fail path / 回帰 guard。ログ出力テスト | `outputs/phase-6/phase-6.md` |
| 7 | カバレッジ確認 | 変更ブロック（page.tsx 分岐 / safe-fetch ログ）の line/branch 実測（広域でなく変更箇所に限定） | `outputs/phase-7/phase-7.md` |
| 8 | リファクタリング | 区別ロジックの重複排除（error code → 表示/ログ のマッピング純関数化）+ rollback 方針 | `outputs/phase-8/phase-8.md` |
| 9 | 品質保証 | typecheck/lint/対象 vitest 一括 + design-token gate + apps/api 非接触確認 | `outputs/phase-9/phase-9.md` |
| 10 | 最終レビュー | AC-1〜8 充足判定・blocker・MINOR 追跡（0件でも理由記載） | `outputs/phase-10/phase-10.md` |
| 11 | 手動テスト | **staging 実機切り分け手順**（DevTools Network で `/me` status 確認 / 診断スクリプト実行 / D1 read-only 確認）+ 現象 screenshot（ユーザー提供）+ 診断後 static UI contract screenshot 計画。真因の確定結論 | `outputs/phase-11/manual-test-result.md` + `screenshots/` |
| 12 | ドキュメント更新 | 必須 6 成果物（実装ガイド Part1/2・spec sync・changelog・未タスク検出・skill feedback・compliance）。本格修正を未タスク化 | `outputs/phase-12/*.md` |
| 13 | PR作成 | user 明示承認後のみ。`dev` base。多段ゲート | `outputs/phase-13/phase-13.md` |

### 因果ループ（Phase 2 に記載）

- バランスループ B1: 観測性欠如(H6) → 真因不明 → 場当たり対処 → 再発 → さらに観測性が必要、を「原因コード可視化(D1)+構造化ログ(D2)+診断スクリプト(D3)」で断ち切る。
- 状態所有権: `/me` 認証判定の所有権は **api/session-guard**（401/410 を決める）。web は **表示と観測**のみ所有し、認証判定を web 側に持ち込まない（fail-closed 維持）。

---

## 8. 検証コマンド（Phase 9 / close-out）

```bash
# 仕様書構造検証
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation
node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation
# 実装時（後続 03.実装.md）の品質ゲート
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# 診断（read-only・実装後）
bash scripts/diagnose-profile-session.sh
```

---

## 9. SubAgent 分担（並列生成）

- Lane A: Phase 1, 2, 3, 4（要件〜I/O契約）
- Lane B: Phase 5（+ task-01/02/03）, 6, 7, 8（実装手順〜リファクタ）
- Lane C: Phase 9, 10, 11（+ manual-test-result.md）, 12（6成果物）, 13

各 Lane は本 SSOT を唯一の入力とし、AC ID・H ID・anchor・命名規則を逐語で踏襲する。screenshots/ は VISUAL_ON_EXECUTION のため `.gitkeep` を残し、実 PNG は implemented_local_evidence_captured 段階では置かない（現象 screenshot 参照はユーザー提供画像を文中参照）。
