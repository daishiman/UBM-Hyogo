# Lessons Learned — google-form-reflection-diagnostics（2026-05-26）

## 概要

Google Form 31 項目の admin / profile / public 3 経路欠落事象を、修復前段の事実取得層として `/admin/diagnostics/forms-pipeline` (集計) と `/admin/diagnostics/member/:memberId` (本人単位) の read-only diagnostic API、`/admin/sync-status` UI、Member Drawer 診断パネルで実装した Spec-A の完了知見。H1 ingest / H2 identity / H3 visibility / H4 alias の 4 仮説を staging 上で機械的に切り分ける目的で、独立 SELECT 並列集計 + 純関数による仮説フラグ導出 + boolean-only secret readiness の 3 つを設計の柱とした。修復 (Spec-B) は本 spec 範囲外で `docs/30-workflows/unassigned-task/google-form-reflection-diagnostics-followup-{001..004}.md` に予配置済み。同種の「修復前段の診断基盤」を将来短時間で再現するための知見集。

## 苦戦箇所と知見

### L-GFRD-001: 同期ジョブ metrics_json の多版互換抽出

**苦戦**: `sync_jobs.metrics_json` の key 名が ingest job のバージョン差で `responsesFetched` / `fetched` / `inserted` / `updated` / `processed` 等に分岐していたため、単一 key で読むと過去 job の集計が 0 として H1 仮説（ingest 未稼働）に誤判定される。`error_json` 側も同様に `message` / `error` / `code` の順序差があった。

**知見**: read-only diagnostic で過去ログ集計を扱う場合、key は**複数候補のフォールバックチェーン**で読む。実装は `readResponsesFetched()` / `readErrorMessage()` (`apps/api/src/diagnostics/forms-pipeline.ts` L58-83) の `?? ?? ??` パターン。これにより ingest 実装変更に対し diagnostic 側を後方互換に保てる。

**How to apply**: `*_json` カラムを集計対象とする全 diagnostic で、Phase 4 data-contract に「fallback key list（優先順位付き）」を明記してから実装に入る。

### L-GFRD-002: 4 層スナップショットを 4 本独立 SELECT で並列構築する

**苦戦**: ingest 稼働状況 / 件数 / 公開可視性 / identity 健全性は単一 JOIN で 1 行にまとめたくなるが、各層の真理値が独立して必要（例: 「件数 0 だが ingest は走っている」と「件数 0 で ingest も止まっている」を区別したい）で、JOIN するとどちらかの NULL が他層を汚す。

**知見**: diagnostic snapshot は **counts / sync_jobs / visibility / identity_health の 4 本独立 SELECT** で集計し、各層を independent slice として TypeScript 側で合成する。実装は `getFormsPipelineSnapshot()` (`forms-pipeline.ts` L115-239)。read-only かつ件数が limited なので N+1 懸念より独立性を優先する。

**How to apply**: 仮説が複数の独立 signal の AND/OR で組まれる diagnostic では Phase 2 architecture で「層 × signal マトリクス」を作り、層ごとに独立 SELECT を割り当てる。

### L-GFRD-003: 仮説フラグ導出を純関数として分離しテストで真理値表検証

**苦戦**: 「0 responses かつ failed runs ≥ N → H1」のような複合判定を SELECT 結果に直書きすると、テストで D1 fixture seeding が必要になり真理値の境界条件 (0/1/N) を網羅できない。

**知見**: SQL 集計結果から H1-H4 boolean を導出する `deriveFormsPipelineHypotheses()` を**純関数として分離**し、unit test で真理値表を組み合わせ網羅する（`forms-pipeline.spec.ts`）。D1 access を伴う統合検証は contract spec に分離（`forms-pipeline.contract.spec.ts`）。

**How to apply**: 仮説判定を含む diagnostic は Phase 5 implementation-guide で「D1 access 層 / 仮説導出純関数層 / route handler 層」の 3 層分離を必須化し、純関数層に unit / D1 層に contract spec を割り当てる。

### L-GFRD-004: Server Component での 2 段エラーハンドリング (HTTP × schema)

**苦戦**: `/admin/sync-status/page.tsx` で `safeServerFetch` → `FormsPipelineSnapshotSchema.safeParse` の 2 段。HTTP 層エラー（401/403/500）と schema 不一致エラー（adapter drift）を同じ UI に流すと運用側で原因切り分けができない。

**知見**: SSR fetch + zod 検証は **`!result.ok` (HTTP) と `!parsed.success` (schema) を独立分岐**し、UI 側で `AdminSectionErrorClient` に異なる reason を渡す。実装は `page.tsx` L37-66。schema drift は静かに失敗させず必ず可視化する。

**How to apply**: Server Component で外部 API 取得 + zod 検証を行う全 page で、Phase 5 で「HTTP 失敗時の UI / schema 失敗時の UI」の 2 経路を明示する。

### L-GFRD-005: 本人診断は複合条件を named boolean で合成する

**苦戦**: member 単体の H3 判定は `(publicConsent && published && responseFieldCount >= EXPECTED)` のような複合 AND で表現できるが、コードに直書きすると「どの条件が false で hidden になったか」が運用側に伝わらない。

**知見**: 個別フラグを `visibleOnPublicDirectory` / `identityMissing` / `H3_hiddenByConsentOrPublish` / `H4_missingFieldsNonEmpty` のように **named boolean に分解**してから合成する（`member-diagnosis.ts` L80-108）。response 側でも個別 boolean を返し、UI で「どの条件で hidden か」を表示可能にする。

**How to apply**: 本人単位 diagnostic を作る場合、Phase 4 contract で各 boolean field を独立 export し、合成 boolean は導出値として補助に留める。

### L-GFRD-006: Client Island fetch は cancelled flag で race を防ぐ

**苦戦**: `MemberDiagnosticsPanel` は member drawer の `memberId` query が変わるたび再 fetch するが、useEffect 内 fetch のままだと前 fetch の応答が後 fetch を上書きする race condition。

**知見**: `useEffect` 内で `let cancelled = false` を立て、unmount / memberId 変化時の cleanup で `cancelled = true`、setState を `if (!cancelled)` でガードする（`MemberDiagnosticsPanel.tsx` L19-32）。AbortController でも可だが、cancelled flag は React 18 strict mode の double-invoke でも安全。

**How to apply**: client island で props 駆動 fetch を行う全 component で、cancelled flag パターンをデフォルトとする。Phase 5 implementation-guide のテンプレに含める。

### L-GFRD-007: env-gated Playwright fixture で mock diagnostic を decoupled に注入

**苦戦**: staging 不在時に Playwright smoke を CI で走らせると実 API 不在で fail。実 API を待つと CI 時間が伸びる。

**知見**: `apps/web/playwright/fixtures/auth.ts` に `diagnosticsFormsPipelineBody()` / `diagnosticsMemberBody(memberId)` mock body を追加し、mock API server で `GET /admin/diagnostics/*` を正規表現で捕捉して動的応答。`STAGING_SMOKE=1` で staging 経路を、未設定時は mock 経路を選択。

**How to apply**: diagnostic / admin-only route の Playwright smoke は **mock body を fixture に組み込み env で切替**を Phase 6 test-strategy のデフォルトにする。staging deploy 前でも UI 検証が走る。

### L-GFRD-008: secret readiness は boolean のみで返す不変条件

**苦戦**: secret 投入状況を運用者に見せたい誘惑から `secret 末尾 4 文字` / `hash` / `投入日時` を response に含めたくなるが、admin 権限を持つアカウント漏洩時に secret 復元手掛かりとなる。

**知見**: `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` / `AUTH_SECRET` 等は **`hasText(env.X)` の boolean のみ**を返す不変条件として Phase 4 contract で明示し、contract spec で grep assert（実値が response 文字列に含まれないこと）する。実装は `forms-pipeline.ts` L214-221、契約検証は `forms-pipeline.contract.spec.ts` の "secrets readiness は実値を含まない" ケース。

**How to apply**: secret 状態を可視化する全 diagnostic で「boolean-only readiness + grep assert contract」を不変条件としてテンプレ化し、Phase 4 で実値を返さないこと、Phase 6 で grep assert を必須化する。

## 運用知見

### OP-GFRD-1: Spec-B 修復タスクは Spec-A 完了前から unassigned-task に予配置する

H1-H4 の修復は staging 投入後の観測結果を待つ user-gated ステップだが、観測結果が出てから初めて Spec-B を起票すると着手まで時間がかかる。Spec-A の Phase 8 DoD で「Spec-B 候補 4 件が各候補のトリガ条件付きで列挙されていること」を必須化し、`docs/30-workflows/unassigned-task/google-form-reflection-diagnostics-followup-{001..004}.md` として予配置する。staging 観測で trigger 条件が満たされた候補のみが user 承認で起票される。

### OP-GFRD-2: 「修復しない宣言」を CONST_007 例外として Phase 1 / Phase 8 に明示する

diagnostic 基盤は本質的に「観測で原因が判明したのに即時修復しない」設計で、CONST_003 (実装と仕様の同期) と矛盾する見え方をする。Phase 1 requirements の "scope" と Phase 8 DoD の "out-of-scope" の両方で **CONST_007 例外として「Spec-B 起票へ委譲」を明示**し、Phase 12 phase12-task-spec-compliance-check.md でも CONST_007 適用を verdict に書く。これにより review 時に「なぜ修復を含めないのか」の説明コストが消える。
