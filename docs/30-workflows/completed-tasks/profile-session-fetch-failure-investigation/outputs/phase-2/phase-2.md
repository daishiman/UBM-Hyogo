# Phase 2: 設計

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| taskType | implementation（VISUAL） |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

Phase 1 で確定した真因仮説（H3/H4/H5 が画像症状一致 / H6 が診断不能の主因）と AC-1〜8 を、**調査 lane 設計**（実機調査 / コード経路静的解析 / D1 read-only）と**観測性向上設計**（D1=区別分岐 / D2=構造化ログ / D3=診断スクリプト）へ落とし込み、責務分離・状態所有権・因果ループ・validation path を確定する。既存コンポーネント再利用可否（FB-SDK-07-1）を判定する。

## 実行タスク

### 2.1 真の論点と因果

- **真の論点**: 「ログイン済みなのに `/profile` がデフォルト失敗バナーを出す」現象の主問題は **真因が観測できないこと**（H6）。`page.tsx:66-74` が 410（H3）/ 5xx（H4）/ transport 失敗（H5）を一律「時間をおいて再読み込み」に集約し、root cause を隠蔽しているため、staging 実機でどの真因かを切り分けられない。
- **因果ループ（バランスループ B1）**:
  - 観測性欠如（H6）→ 真因不明 → 場当たり対処（リロード / 再デプロイの当て推量）→ 再発 → さらに観測性が必要、という自己強化的に悪化するバランスループ。
  - これを **原因コード可視化（D1）+ 構造化ログ（D2）+ 診断スクリプト（D3）** で断ち切る。D1 で UI 層、D2 で server ログ層、D3 で運用層の 3 層から `/me` 失敗の真因コード（410/5xx/FAILED）を観測可能にし、ループを止める。
- **状態所有権**:
  - `/me` の **認証判定（401/410 を決める）の所有権は `apps/api` の `session-guard`**（`session-guard.ts:78-79`=401 / `89-92`=identity・status 不在 401 / `95-100`=is_deleted 410）。
  - `apps/web` は **表示と観測のみ所有**し、認証判定を web 側に持ち込まない（fail-closed 維持）。web は `/me` の status/code を「受けて区別表示・ログするだけ」で、認証の真偽を再判定しない。

### 2.2 調査 lane 設計（責務分離）

調査は 3 lane に分け、各 lane の責務・read-only 制約・収束先（H）を分離する。lane 間に state 引き渡しは無く、それぞれが独立に H3/H4/H5 の証拠を集める単純並行。

| Lane | 名称 | 責務 | read-only 制約 | 収束先 |
| --- | --- | --- | --- | --- |
| Lane1 | staging 実機調査 | DevTools Network で `/profile` SSR が叩く `/me`（service-binding 経由）/ web proxy `/api/me` の HTTP status を観測。診断スクリプト（D3）で staging `/me` を直 https で叩き status を確認 | HTTP GET のみ。secret 値は出力しない | H1（版数）/ H2/H3/H4（status）/ H5（応答可否） |
| Lane2 | コード経路静的解析 | `page.tsx:41-74` → `safe-fetch.ts:34-37`（code 生成）→ `authed.ts`（401/非2xx 分岐）→ `transport.ts:27,40-42`（service-binding/throw）の経路を anchor で確定し、各 status がどの `MEMBER_SESSION_*` になるかを表で固定 | ファイル Read のみ | H5（FAILED か `_status` か） |
| Lane3 | D1 read-only 確認 | 当該 member の `member_status.is_deleted` を `bash scripts/cf.sh d1 ... --command "SELECT ..."`（read-only SELECT）で確認。identity/status 整合（orphan 有無）も確認 | `apps/api` 経由の read-only SELECT のみ。memberId はログに残さない（#11） | H3（is_deleted=1）/ H2（orphan→401） |

> Lane3 の D1 参照は不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）に従い、`bash scripts/cf.sh d1` ラッパー経由の read-only SELECT のみ。`wrangler` 直叩き禁止。

### 2.3 観測性向上設計（D1/D2/D3 の責務分離）

| 区分 | 名称 | 層 | 責務 | スコープ境界（含まない） |
| --- | --- | --- | --- | --- |
| D1 | エラーコード区別分岐 | `apps/web` UI（`page.tsx` + `SectionError`） | `page.tsx:66-74` のデフォルト分岐を `MEMBER_SESSION_410` / 5xx 族 / `MEMBER_SESSION_FAILED` で区別。ユーザー向け文言は安全側を維持しつつ、原因コードを `data-*` 属性で可視化（root cause を隠蔽しない）。404→再ログイン CTA / 401→redirect は不変 | 410 の本格復帰フロー / 5xx 根治 / 管理者専用 UX（Phase 12 未タスク化） |
| D2 | 構造化ログ | `apps/web` lib（`safe-fetch.ts`） | `/me` 取得失敗時に `status`/`code`/`path` を構造化ログ出力（`console.error` の構造化 or 既存 Sentry 経路）。memberId 等の個人情報は出さない（#11） | API worker 側のログ設計変更 / Sentry 構成変更 |
| D3 | 診断スクリプト | `scripts/` 運用 | `scripts/diagnose-profile-session.sh`（read-only・冪等）: staging `/me` を https 直で叩き status 確認 / env・secret parity（`AUTH_SECRET` 等の有無のみ）/ staging deploy 版数を 1 本に集約 | secret 実値の出力 / `wrangler` 直叩き / deploy 等の書込操作 |

3 区分は関心が分離（UI 表示 / server ログ / 運用診断）し、独立に並列実装可能（T01=D1 / T02=D2 / T03=D3）。

### 2.4 既存コンポーネント再利用可否（FB-SDK-07-1）

| 対象 | 再利用 | 方針 |
|------|--------|------|
| `SectionError` | ✅ 拡張再利用 | 既存 `actionHref`/`actionLabel` props を使い、区別表示は `data-*` 属性（例 `data-error-code`）で付与。新規 primitive を作らない |
| `safeServerFetch` の error code（`MEMBER_SESSION_<status>` / `_FAILED`） | ✅ 再利用 | `safe-fetch.ts:34-37` の `codePrefix`_`<status>` 規約をそのまま判定に使用 |
| `AuthRequiredError` redirect 経路（`page.tsx:46-47`） | ✅ 不変 | AC-3（401→redirect 回帰なし）のため変更しない |
| `console.error` / 既存 Sentry 経路 | ✅ 再利用 | D2 のログは既存出力経路に構造化 payload を載せる。新規ログ基盤を作らない |
| 既存 `diagnose-auth-secret-parity.sh` / `smoke-staging-me.sh` | ✅ 参照・再利用可 | D3 は同系の read-only 命名・規約に揃える。再利用できる部分は再利用 |

### 2.5 状態所有権 / 実行状態テーブル

| レイヤ | 所有する状態 | 本タスクでの変更 |
| --- | --- | --- |
| API `session-guard`（`apps/api`） | `/me` の認証判定（401/410） | **変更なし**（read-only。認証境界 fail-closed 維持） |
| web `safeServerFetch`（`safe-fetch.ts`） | `meResult`（`SafeResult` / error code） | D2: 失敗時に `status`/`code`/`path` を構造化ログ出力（観測の追加のみ。code 生成ロジック不変） |
| web `/profile` SC（`page.tsx`） | error code → 表示分岐 | D1: デフォルト分岐を 410/5xx族/FAILED で区別（表示と `data-*` のみ。認証再判定なし） |
| `SectionError` | 表示のみ（状態なし） | D1: `data-*` 属性付与（既存 props 範囲） |
| `scripts/diagnose-profile-session.sh` | なし（read-only 観測） | D3: 新規作成（副作用なし） |

### 2.6 validation path（検証経路）

| 検証 | 経路 | 期待 |
| --- | --- | --- |
| 静的（仕様書構造） | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation` | 構造健全 |
| 型 | `mise exec -- pnpm typecheck` | PASS（実装後） |
| lint / design-token | `mise exec -- pnpm lint`（HEX 直書き禁止・新規 primitive 禁止） | PASS（実装後） |
| 単体（区別分岐 / ログ） | 対象 `*.spec.{ts,tsx}` vitest | RED→GREEN（Phase 6 で展開） |
| 実機切り分け | `bash scripts/diagnose-profile-session.sh`（read-only） | `/me` status / parity / 版数を出力（Phase 11） |
| 非接触確認 | `apps/api` diff 空 / `/me` shape・path・status 体系不変（AC-6） | diff 空 |

> ステップ間 state 引き渡しは無し（D1/D2/D3 は単純分岐で独立）。調査 lane（Lane1/2/3）も並行独立で、状態の受け渡しを持たない。

## 完了条件

- [x] 調査 lane（Lane1 実機 / Lane2 コード経路 / Lane3 D1 read-only）の責務・read-only 制約・収束先 H を分離
- [x] 観測性向上設計 D1/D2/D3 の責務分離・スコープ境界を確定
- [x] 状態所有権（`/me` 認証判定 = api/session-guard 所有・web は表示と観測のみ）を確定
- [x] 因果ループ B1（観測性欠如→真因不明→場当たり→再発を D1/D2/D3 で断つ）を明示
- [x] 既存コンポーネント再利用可否（新規 primitive なし）と validation path を確定

## 成果物

- `outputs/phase-2/phase-2.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | `/me` 解決 / session 境界 / fail-closed |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | authGateState / session 境界 |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | エラー表示 / 導線の方針 |

- `outputs/phase-1/phase-1.md`（AC・真因仮説）
- `_shared-context.md`（SSOT §7 因果ループ / 状態所有権）

## 統合テスト連携

Phase 4 で各 lane / D1・D2・D3 の I/O 契約とテスト期待値を表に落とし込み、Phase 5 で実装仕様書本体（task-01..03）へ展開する。Phase 11 は Lane1（staging 実機切り分け）に特化する。
