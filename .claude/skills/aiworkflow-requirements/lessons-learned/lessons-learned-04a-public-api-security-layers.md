# Lessons Learned — 04a public directory API security layers（2026-04-29）

> task: `04a-parallel-public-directory-api-endpoints`
> 関連 spec: `api-endpoints.md`（公開ディレクトリ API 章）/ `architecture-monorepo.md` / `task-workflow.md`
> 関連 LOGS: 2026-04-29 entry

## 教訓一覧

### L-04A-001: 公開 API の leak 防御は **6 層構成** で組む
- **背景**: `/public/*` は未認証で叩ける endpoint で、`responseEmail` / `rulesConsent` / `adminNotes` 等の admin-only field が 1 度でも response に混じると即 incident。
- **教訓**: 単一防壁では不十分。次の 6 層を全て通すこと。
  1. SQL where 条件（`buildPublicWhereParams` で `publishState='published' AND publicConsent='consented' AND is_deleted=0`）
  2. Repository 層 EXISTS check（`existsPublicMember` → `UBM-1404` で「存在しないように振る舞う」）
  3. Converter 内 status 二重チェック（`isPublicStatus`）
  4. Visibility filter（`keepPublicFields` が `schema_questions.visibility='public'` のみ通す）
  5. Runtime delete（`FORBIDDEN_KEYS = ['responseEmail','rulesConsent','adminNotes']` を最終 sweep）
  6. Zod `.strict()` parse fail close（未知 key を拒否）
- **適用**: 公開 API endpoint 追加時は 6 層全て備わっているか PR 上でチェックする。schema 変更時は **`_shared/public-filter.ts` の更新を最初に行う**。

### L-04A-002: visibility 未設定時の既定値は **`member`**（privacy first）
- **背景**: `schema_questions.visibility` 列が NULL / 未設定の field を public 扱いすると leak する。
- **教訓**: visibility 解釈の既定値は `member`（公開しない）。明示的に `public` と書かれた field のみ公開する。02a / 04a で同じ前提を共有している。
- **適用**: 04b / 04c / 06a の view-model でも privacy first を継続する。

### L-04A-003: `FORBIDDEN_KEYS = ['responseEmail','rulesConsent','adminNotes']` は **runtime で必ず delete**
- **背景**: visibility filter / Zod strict があっても、新規 field 追加時に visibility 設定漏れで public 扱いされる事故余地がある。FORBIDDEN_KEYS は不変条件 #3 / #11 / #12（responseEmail は system field、rulesConsent は会員側内部、adminNotes は admin-managed）の最後の砦。
- **教訓**: builder の戻り値に対し `FORBIDDEN_KEYS.forEach(k => delete obj[k])` を必ず実行。これは「冗長な防御」ではなく「層構成の 1 層」として運用する。
- **適用**: 全 public view-model builder で必須。

### L-04A-004: shared zod schema の field `kind` は **camelCase 正規化** が必要
- **背景**: 当タスクで `kind: "short_text"`（snake_case / D1 由来）と `"shortText"`（camel / shared schema 期待値）のずれで unit test が初回 fail（skill-feedback-report S-1）。
- **教訓**: shared zod schema は camelCase を正本とする。D1 → shared の境界で snake_case → camelCase 変換を強制する converter を 1 箇所に集約する。
- **適用**: Phase 1 の前提条件に「shared zod の enum 値は camelCase」を明記。`task-specification-creator` 側へ S-1 として申し送り。

### L-04A-005: converter unit test では **leak key 注入の defensive assert** をテンプレ化
- **背景**: 当タスクで `JSON.stringify(result).not.toContain("leak@example.com")` 形式の defensive assert を converter ごとに反復した（skill-feedback-report S-2）。「visibility filter / FORBIDDEN_KEYS が機能している」を構造的にではなく実値で確認する重要パターン。
- **教訓**: converter unit test 雛形に「leak fixture（responseEmail に明らかな sentinel 値を入れる）+ JSON.stringify で sentinel が含まれないこと」を組み込む。リグレッション検出力が大幅に上がる。
- **適用**: `task-specification-creator` skill 化候補（S-2）。06a 以降の converter test テンプレに継承する。

### L-04A-006: Cache-Control 値の判断軸を **endpoint 単位で明文化**
- **背景**: 04a では `/public/stats` と `/public/form-preview` が `public, max-age=60`、`/public/members` と `/public/members/:id` が `no-store`。混在する根拠が暗黙だと後続 endpoint で迷う。
- **教訓**:
  - 集計・schema preview など「全公開ユーザー共通 + 短時間で陳腐化しても許容」→ `public, max-age=60`
  - 個人プロフィール / 検索結果など「ユーザー固有 or leak リスク」→ `no-store`
  - cache 化したい個人 endpoint は `no-store` のまま Workers KV 側で短 TTL cache（U-2 follow-up）を選ぶ
- **適用**: api-endpoints.md の各 endpoint 表に Cache-Control 列を必須化。

### L-04A-007: `apps/api` miniflare contract test setup の **skill 化が望まれる**
- **背景**: 「miniflare で D1 を立てて 4 endpoint を叩く」雛形を毎タスクで再発明している（skill-feedback-report S-4）。04a は unit + converter で leak を担保し、E2E は範囲外として後続に申し送った。
- **教訓**: miniflare D1 + Hono app instantiate + binding 注入の test fixture を `apps/api/src/__tests__/_setup/` の正本として整備し、skill にもテンプレ化する。
- **適用**: 未タスク `task-04a-followup-001-miniflare-contract-leak-suite.md` で formalize 済み。06a 着手時に同タスク着手を検討。

## 申し送り先（unassigned-task-detection.md より）

- 06a / 別タスク: miniflare contract / integration / leak suite（U-1 / followup-001）
- 将来タスク: `/public/members/:id` の KV cache 化（U-2 / followup-002）— trigger は traffic >3k/day
- 06a: `apps/web` 用 query parser を `packages/shared` 配置（U-3 / followup-003）
- Phase 11 manual smoke / deploy 後: Cloudflare cache rules による Cache-Control override 検証（U-4 / followup-004）
- 後続タスク: tags 一括取得の N+1 防止（U-5 / followup-005）

## 申し送り先（skill-feedback-report より）

- `task-specification-creator`: S-1（shared zod kind の camelCase 前提を Phase 1 テンプレ化）/ S-2（converter unit test の leak key 注入テンプレ化）/ S-3（failure case 7 カテゴリ × 1 件以上の機械チェック）
- `aiworkflow-requirements`（本ファイル）: S-4 を未タスク U-1 へ申し送り
