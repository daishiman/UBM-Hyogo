# task-17: admin-schema-conflicts-audit

> 責務 dir: `07-screens-admin`
> 担当画面: `/admin/schema`（schema diff）, `/admin/identity-conflicts`（同一人物統合）, `/admin/audit`（監査ログ）
> 依存: task-09 (`tailwind-v4-setup`), task-10 (`ui-primitives`)
> 並列: task-15 / task-16 と完全並列可（`(admin)/layout.tsx` は task-15 で先行確定済み前提）
> 改訂日: 2026-05-07

---

## §0. 自己完結コンテキスト

> 本セクションは task-17 を **単独で読み解くために必要な情報** をすべて inline で展開する自己完結ブロック。`outputs/phase-1..3` や `CLAUDE.md`、`task-08/10/15` を都度開かなくても、ここを読めば実装着手できる。150〜250 行を厚めに使い、admin 8 画面のうち本 task が担当する 3 画面（`/admin/schema` / `/admin/identity-conflicts` / `/admin/audit`）を完全に閉じる。

### §0.1 上位ゴール（why this task exists）

UBM 兵庫支部会 admin の **データ整合性 / ガバナンス系 3 画面** を再構築する。`/admin/schema` は Google Form schema の current/latest diff + stableKey 割当 UI、`/admin/identity-conflicts` は同一人物候補ペアの side-by-side 比較 + merge/dismiss、`/admin/audit` は監査ログの FilterBar + Timeline。`apps/api/src/routes/admin/{schema, sync-schema, identity-conflicts, audit}.ts` の既存 endpoint を adapter で接続するのみで、新規 endpoint は追加しない。phase-2 §5.2 で 1.25 人日。task-15 の `(admin)/layout.tsx` 確定後に着手（§0.10）。

### §0.2 DAG 座標

```
task-09 (tailwind v4 + tokens) ─┐
task-10 (ui primitives 11) ─────┼──► task-15 ── (layout merge) ──► task-17 (本タスク) ─► task-18
                                 └─────────────────────────────► task-16 (並列)
```

- 直接依存元: task-09 / task-10 / **task-15（`(admin)/layout.tsx` 確定後）**。
- 並列可: task-16（tags / meetings / requests）— `apps/web/src/lib/api/admin.ts` の object key 追記が衝突しないよう末尾追記に統一。
- 直接依存先: task-18（Playwright smoke / `verify-design-tokens` / a11y regression）。
- task-15 layout 完成前着手は禁止。詳細 §0.10。

### §0.3 触れるファイル群（M=Modify / C=Create / R=Read-only）

| 区分 | path | 役割 |
|------|------|------|
| C | `apps/web/src/app/(admin)/admin/schema/page.tsx` | server, `/admin/schema/diff` 初期フェッチ |
| C | `apps/web/src/app/(admin)/admin/identity-conflicts/page.tsx` | server, `/admin/identity-conflicts` 初期フェッチ |
| C | `apps/web/src/app/(admin)/admin/audit/page.tsx` | server, `/admin/audit` 初期フェッチ + searchParams |
| C | `apps/web/src/features/admin/components/_schema/*.tsx` | SchemaDiffView / SchemaDiffRow / SchemaApplyButton |
| C | `apps/web/src/features/admin/components/_conflicts/*.tsx` | ConflictPairList / ConflictPairCompare / ConflictResolveModal |
| C | `apps/web/src/features/admin/components/_audit/*.tsx` | AuditFilterBar / AuditTimeline / AuditEntry |
| M | `apps/web/src/lib/api/admin.ts` | `schema / identityConflicts / audit` namespace を追記 |
| M | `apps/web/src/features/admin/components/index.ts` | barrel export 追記 |
| R | `apps/web/src/app/(admin)/layout.tsx` | task-15 確定済み。**編集禁止** |
| R | `apps/web/src/components/ui/*` | task-10 完成 primitive を import のみ |
| R | `apps/api/src/routes/admin/{schema,sync-schema,identity-conflicts,audit}.ts` | endpoint 仕様正本（変更禁止） |

### §0.4 既存 API（不変 surface — `apps/api/src/routes/admin/` を変更しない）

- `GET /admin/schema/diff` (`schema.ts:143`) — current vs latest diff + recommendation per question。
- `POST /admin/schema/aliases` (`schema.ts:156`) — diff 1 件に stableKey alias を割当。body: `{ diffId, stableKey, reason? }`。プロトタイプの "stableKey 割当 UI" は本 endpoint に対応。**endpoint 不在の場合は disabled button + tooltip "未提供"**。
- `GET /admin/schema/aliases/:diffId/backfill` (`schema.ts:253`) — backfill 影響件数の事前確認（apply 前 confirm modal で表示）。
- `POST /admin/sync/schema` (`sync-schema.ts:97`) — schema 取り込み（adminGate 必須）。response の差分をそのまま反映、dry-run なし。
- `GET /admin/identity-conflicts` (`identity-conflicts.ts:38`) — 候補ペア一覧。query: `status? / cursor?`。
- `POST /admin/identity-conflicts/:id/merge` (`identity-conflicts.ts:54`) — 2 件 merge。body: `{ keepMemberId, reason }`。
- `POST /admin/identity-conflicts/:id/dismiss` (`identity-conflicts.ts:91`) — 候補棄却。body: `{ reason }`。
- `GET /admin/audit` (`audit.ts:134`) — 監査ログ。query: `actor? / action? / target? / from? / to? / cursor? / pageSize?`。

### §0.5 不変条件（CLAUDE.md + phase-1 整合）

1. **D1 直アクセス禁止**: web → api 経由のみ。`adminClient.schema / identityConflicts / audit` は `fetch` ラッパに限定。
2. **OKLch tokens 専用**: HEX 直書き 0 件。schema diff の add/remove/modify 色分けは token の `success / danger / warning` から。syntax highlight ライブラリ不採用。
3. **GAS prototype 非昇格**: `gas-prototype/` 参考のみ。プロトタイプ未掲載の identity-conflicts / audit は admin sidebar 派生パターンで（§0.9）。
4. **stableKey 割当はサーバ側責務**: クライアントは入力 + submit のみ。バリデーション（重複 / 命名規約）はサーバ応答に従う。
5. **`responseEmail` は system field**: identity-conflicts の比較 view でも form 項目とは分離して表示。
6. **新 endpoint 禁止**: `apps/api/src/routes/admin/` の app.\* 行を増やさない。`/admin/schema/assign-stable-key` のような新名称ではなく既存 `/admin/schema/aliases` を使う。
7. **MVP では candidate 2 件のみ**: identity-conflicts の同時 merge は 2 件まで。3 件以上は別 task。

### §0.6 上流シグネチャ（本 task が呼び出す API — 1 行サマリ）

| method | path | request | response | source |
|--------|------|---------|----------|--------|
| GET | `/admin/schema/diff` | （無） | `{ items: SchemaDiffItem[], recommendations: Map<questionId, string[]> }` | `schema.ts:143` |
| POST | `/admin/schema/aliases` | body: `{ diffId, stableKey, reason? }` | `{ ok, diffId, stableKey }`（不在時 disabled） | `schema.ts:156` |
| GET | `/admin/schema/aliases/:diffId/backfill` | path: `diffId` | `{ affectedCount, sampleMembers: [] }` | `schema.ts:253` |
| POST | `/admin/sync/schema` | （body 任意） | `{ ok, applied, version }` | `sync-schema.ts:97` |
| GET | `/admin/identity-conflicts` | query: `status? / cursor?` | `{ items: ConflictPair[], nextCursor }` | `identity-conflicts.ts:38` |
| POST | `/admin/identity-conflicts/:id/merge` | body: `{ keepMemberId, reason }` | `{ ok, mergedInto }` | `identity-conflicts.ts:54` |
| POST | `/admin/identity-conflicts/:id/dismiss` | body: `{ reason }` | `{ ok, conflictId }` | `identity-conflicts.ts:91` |
| GET | `/admin/audit` | query: `actor? / action? / target? / from? / to? / cursor? / pageSize?` | `{ items: AuditEntry[], nextCursor }` | `audit.ts:134` |

### §0.7 下流シグネチャ（task-17 が後続に提供する surface）

- `apps/web/src/lib/api/admin.ts` に `adminClient.schema = { getDiff, assignAlias, getBackfill, syncApply }`、`adminClient.identityConflicts = { list, merge, dismiss }`、`adminClient.audit = { list }` を追加。
- `apps/web/src/features/admin/components/index.ts` に `SchemaDiffView` / `ConflictPairList` / `AuditTimeline` 等を追記 export。task-15 dashboard の RecentActions 行クリックは `/admin/audit?actor=...` に遷移するため、本 task の AuditFilterBar が `searchParams` から actor を初期反映する。
- task-18 の Playwright smoke は 3 画面の SSR 200 + 主要 confirm modal の出現確認まで。
- `(admin)/layout.tsx` には **書き込まない**（task-15 確定済み・read-only）。

### §0.8 用語（admin 文脈で頻出）

| 用語 | 定義 |
|------|------|
| Schema Diff | 現行 schema と最新 Form 取得結果の差分。type: `added` / `removed` / `modified` |
| stableKey | Form の questionId に紐づく不変キー。alias を割り当てることで question の rename にも追従 |
| Backfill | alias 割当時に既存 response 群へ stableKey を遡及適用する処理。事前に件数確認 |
| Identity Conflict | email / 氏名 / 入会年月 等から **同一人物の可能性が高い候補ペア** を列挙したもの |
| Merge | conflict pair の 1 件を keep、もう 1 件を archived として keep に統合する操作 |
| Dismiss | conflict pair を「別人」として確定し、以後候補から除外する操作 |
| Audit Entry | `{ at, actor, action, target, payload }` の不変ログ 1 件。JST 表示で日付グルーピング |

### §0.9 画面の概念（layout pattern）

- **`/admin/schema`（schema diff）**: pattern = **2 カラム比較 + 行内 inline form**。左に "現行 schema"、右に "最新取得"、中央に SchemaDiffView の 1 行 = `SchemaDiffRow`（type chip + question label + stableKey 入力 + 割当 Button）。下部に "全体 apply" の `SchemaApplyButton`（確認 modal で `/admin/schema/aliases/:diffId/backfill` を call し affectedCount を見せてから `/admin/sync/schema` を実行）。プロトタイプ `SchemaDiffPage` を踏襲しつつ stableKey 割当 UI を拡張。
- **`/admin/identity-conflicts`（同一人物統合）**: pattern = **List + Side-by-side Compare**。左に `ConflictPairList`（status filter + 候補ペア一覧）、右に `ConflictPairCompare`（candidate A / B を Card で並列表示・identity / answers / 入会年月を強調表示）+ resolve action（merge / dismiss は確認 modal 経由・reason 必須）。プロトタイプ未掲載のため admin sidebar の Side-by-side Compare パターンを派生適用（phase-3 §3.1）。candidate は **2 件のみ**。
- **`/admin/audit`（監査ログ）**: pattern = **FilterBar + Timeline**。上部に `AuditFilterBar`（actor / action / target / 期間 from-to の date input・URL searchParams と双方向同期）、中央に `AuditTimeline`（JST 換算で日付グルーピング・各 entry は `AuditEntry` Card で actor / action / target / payload 抜粋を表示）、末尾に cursor pagination の "次のページ" Button。CSV エクスポートは MVP 範囲外（disabled + tooltip "Coming soon"）。プロトタイプ未掲載のため admin sidebar の FilterBar+Timeline パターンを派生適用。

### §0.10 競合回避（共通 layout 確定担当 = task-15）

> **task-15 が `(admin)/layout.tsx` を main にマージするまで本 task は着手しない**。layout の `requireAdmin` server guard と `AdminSidebar` aria-current 判定が確定していないと、本 task の sub-route page.tsx 群が SSR で破綻する。

| ファイル | task-15 | task-16 | task-17（本 task） | 解決方針 |
|---------|--------|---------|---------|---------|
| `apps/web/src/app/(admin)/layout.tsx` | M（確定担当） | R | **R（編集禁止）** | task-15 の merge 後に rebase。conflict 出たら task-15 側を正とする |
| `apps/web/src/lib/api/admin.ts` | C（base + admin） | M（tags 等追記） | M（`schema / identityConflicts / audit` 追記） | object key の **末尾追加のみ**。task-16 と insertion order が異なっても merge tool が解決可能なよう関数間に空行 1 行 |
| `apps/web/src/features/admin/components/index.ts` | M | M（追記） | M（末尾追記） | 行追記のみ。task-16 と alphabetical sort で衝突しないよう **末尾追記** に統一 |
| OKLch tokens（`@theme`） | R | R | R | task-09 確定。本 task で編集しない |

警告: task-15 W5 完了前に着手すると、`(admin)/layout.tsx` 不在で page.tsx の routing が 404 化し、`adminClient` の base 雛形不在で import 解決に失敗する。`/admin/schema/aliases` が未提供環境では割当 button を `disabled` + tooltip 表示にフォールバックすること（§0.4 注記）。**task-15 完了確認後に着手**。

### §0.11 W（Wave）分割

| Wave | 内容 | gate |
|------|------|------|
| W1 | task-15 W5 通過確認 + `apps/api/src/routes/admin/schema.ts` の `/aliases` POST 存在確認 | endpoint 不在時は disabled + tooltip フォールバックを採用 |
| W2 | `_schema/*` + `adminClient.schema.\*` + `/admin/schema/page.tsx`（diff view + assign + apply） | schema diff SSR 200 + apply confirm modal 動作 |
| W3 | `_conflicts/*` + `adminClient.identityConflicts.\*` + `/admin/identity-conflicts/page.tsx`（side-by-side + merge / dismiss） | conflict resolve modal 動作 |
| W4 | `_audit/*` + `adminClient.audit.\*` + `/admin/audit/page.tsx`（FilterBar + Timeline + cursor pagination） | audit 100 件以上で次ページ取得が動作 |
| W5 | task-15 dashboard の Recent Actions click → `/admin/audit?actor=...` 反映の連結確認 | searchParams からの初期フィルタ反映 |
| W6 | jest-axe / vitest / 手動 smoke 通過 | task-18 引き渡し |

### §0.12 a11y / i18n / token の現場ルール

- **Schema diff**: 各行に `role="row"` + `aria-label="追加: question 名"` 等で type を音声化。色だけでなくテキスト prefix（"追加 / 削除 / 変更"）併記。
- **Side-by-side compare**: 2 Card を `<section aria-label="候補A">` / `<section aria-label="候補B">` で囲む。merge confirm modal 内で keep 選択は `<radiogroup>`。
- **Audit timeline**: 日付見出しは `<h3>`（h1=ページタイトル / h2=セクションを下回らないこと）、entry は `<article>` + `aria-label="2026-05-07 14:30 admin@... が member-status を変更"`。
- **Date input**: `<input type="date">` の min/max は from <= to で client validate。サーバ側 ISO8601 (UTC) 送信、表示は JST（`Asia/Tokyo`）。
- **token**: diff の add=success / remove=danger / modify=warning は `bg-success-soft / bg-danger-soft / bg-warning-soft` 経由。HEX 0 件。
- **CSV export disabled**: `<button disabled aria-disabled="true">` + Tooltip "Coming soon"。

### §0.13 想定エラーパターン

| 症状 | 想定原因 | 対処 |
|------|---------|------|
| schema apply が 409 | 他 admin が同時実行中 | API の lock 応答を Banner で表示、再フェッチ提案 |
| stableKey 重複 | サーバ側 unique violation | response の `errorCode` を form エラー文に bind |
| identity merge が 422 | candidate がすでに resolved | 一覧再フェッチ + 該当行を fade-out |
| audit timeline がページネーションで重複 | cursor の重複送信 | `useTransition` + `pending` でガード、cursor が同値なら no-op |
| FilterBar の date が空 | URL searchParams 未指定 | from/to 未指定時は最近 30 日 default、`?from=&to=` の空も許容 |
| `/admin/schema/aliases` 不在 | endpoint 未実装環境 | `SchemaApplyButton` を render しつつ assign Button を `disabled` + tooltip "未提供"（§0.4） |
| backfill affectedCount が極大 | schema 変更 scope が広い | confirm modal で件数 + サンプル 5 件を表示し、明示的に "適用" 押下を要求 |

### §0.14 phase-1..3 / CLAUDE.md からの根拠引用

- phase-1 §3.3: `/admin/schema` `/admin/identity-conflicts` `/admin/audit` の endpoint は schema.ts / sync-schema.ts / identity-conflicts.ts / audit.ts に閉じる。
- phase-2 §5.2: 工数 1.25 人日。task-15 layout merge 後に task-16 と並列実行可能。
- phase-3 §3.1: identity-conflicts / audit はプロトタイプ未掲載。Side-by-side Compare / FilterBar+Timeline パターンを派生適用。
- phase-3 §3.2: schema apply / identity merge / dismiss は **すべて confirm modal 経由 + reason 必須**。
- CLAUDE.md「重要な不変条件」§1: 実フォームの schema をコードに固定しすぎない。stableKey は admin が割り当て、コード側は alias 経由で参照。
- CLAUDE.md「重要な不変条件」§3: `responseEmail` は system field。identity-conflicts でも form 項目から分離表示。
- CLAUDE.md「重要な不変条件」§4: Google Form schema 外のデータは admin-managed として分離。stableKey 割当はその境界線そのもの。

### §0.15 セキュリティ前提

- **`requireAdmin` server guard**: layout 任せ。schema apply / identity merge は **追加で admin role の sub-claim** を API 側で検査する想定（client は 403 を Banner で表示するのみ）。
- **audit log 改竄不可**: client から audit を直接書かない（読み取り専用）。merge / dismiss / apply は API 側で audit を記録。
- **PII 表示**: identity-conflicts の比較画面で `responseEmail` は masked + 完全一致判定の結果のみ表示（実値の hover 表示は禁止）。
- **CSRF**: 全 state-changing endpoint で `credentials: 'include'`、Origin は API 側で検査済み。
- **stableKey 命名**: `^[a-z][a-zA-Z0-9_]{2,63}$` を client 側でも先行 validate（サーバ最終 validate）。

---

## 0. ヘッダー

| 項目 | 値 |
|------|-----|
| task ID | task-17 |
| task name | admin-schema-conflicts-audit |
| 責務 dir | `07-screens-admin` |
| 工数見積 | 1.25 人日（phase-2 §5.2） |
| 主担当 | Frontend |
| 主要 deliverable | `/admin/schema` + `/admin/identity-conflicts` + `/admin/audit` の 3 画面（diff / compare / timeline） |
| 直接依存 | task-09, task-10, task-15（`(admin)/layout.tsx` 確定） |
| 並列可 | task-15, task-16 |
| 後続 | task-18（regression / Playwright smoke） |
| 関連 spec | `docs/00-getting-started-manual/specs/11-admin-management.md` §schema 同期 / §identity-conflicts |

### 0.1 画面とプロトタイプ掲載状況

| 画面 | プロトタイプ jsx | 設計指針 |
|------|----------------|---------|
| `/admin/schema` | 部分掲載（`SchemaDiffPage`、簡潔な list） | 仕様 11-admin §schema を満たすため stableKey 割当 UI を追加（プロトタイプ拡張） |
| `/admin/identity-conflicts` | 未掲載 | admin sidebar の Side-by-side compare パターンで再構成（phase-3 §3.1） |
| `/admin/audit` | 未掲載 | admin sidebar の FilterBar + Timeline パターンで再構成（phase-3 §3.1） |

### 0.2 並列実行時の競合対策

| ファイル | task-15 | task-16 | task-17 | 解決方針 |
|---------|--------|---------|---------|---------|
| `apps/web/src/lib/api/admin.ts` | C | M | M（add schema/conflicts/audit） | 関数追加方式 |
| `apps/web/src/features/admin/components/index.ts` | M | M | M | 追記方式 |

---

## 1. ゴール / 非ゴール

### 1.1 ゴール

| ID | 条件 | 検証方法 |
|----|------|---------|
| G-01 | `/admin/schema` が SSR 200。current / latest / diff の 2 カラム比較 + 各 diff 行に stableKey 割当 UI + apply Button が動作 | Playwright + vitest |
| G-02 | `/admin/identity-conflicts` が SSR 200。候補ペアの side-by-side 比較 + resolve（merge / dismiss）action が動作 | Playwright + vitest |
| G-03 | `/admin/audit` が SSR 200。actor / action / 期間 / target でフィルタ可能、cursor pagination で次ページ取得 | Playwright + vitest |
| G-04 | `apps/api` の `/admin/schema`, `/admin/sync-schema`, `/admin/identity-conflicts`, `/admin/identity-conflicts/:id/resolve`, `/admin/audit` を adapter 経由で接続 | client mock test |
| G-05 | OKLch tokens のみ使用、HEX 直書き 0 件 | `pnpm verify-design-tokens` |
| G-06 | jest-axe critical 0 件 | a11y test |
| G-07 | apply / resolve action は確認 modal を経由 | vitest |
| G-08 | audit timeline は日付グルーピング表示（JST 換算） | vitest |
| G-09 | `pnpm typecheck` / `pnpm lint` green | CI |

### 1.2 非ゴール

- 新 admin endpoint の追加（`apps/api` を変更しない）
- audit log の CSV エクスポート（既存 endpoint に export なし。disable button + tooltip "Coming soon"）
- identity-conflicts の 3 件以上同時マージ（candidate pair = 2 件のみ）
- schema apply の dry-run プレビュー機能（`/admin/sync-schema` の response をそのまま反映）
- diff の syntax highlight（外部 lib を入れない。色分けのみ token で）

---

## 2. 変更対象ファイル表

| 区分 | path | 役割 |
|------|------|------|
| C | `apps/web/src/app/(admin)/admin/schema/page.tsx` | server, `/admin/schema` 初期フェッチ |
| C | `apps/web/src/app/(admin)/admin/identity-conflicts/page.tsx` | server, `/admin/identity-conflicts` 初期フェッチ |
| C | `apps/web/src/app/(admin)/admin/audit/page.tsx` | server, `/admin/audit` 初期フェッチ + searchParams |
| C | `apps/web/src/features/admin/components/_schema/SchemaDiffView.tsx` | 2 カラム diff |
| C | `apps/web/src/features/admin/components/_schema/SchemaDiffRow.tsx` | 1 件 diff（stableKey 割当 UI） |
| C | `apps/web/src/features/admin/components/_schema/SchemaApplyButton.tsx` | confirm modal + apply call |
| C | `apps/web/src/features/admin/components/_conflicts/ConflictPairList.tsx` | 候補ペア list |
| C | `apps/web/src/features/admin/components/_conflicts/ConflictPairCompare.tsx` | side-by-side card x 2 |
| C | `apps/web/src/features/admin/components/_conflicts/ConflictResolveBar.tsx` | merge / dismiss action |
| C | `apps/web/src/features/admin/components/_audit/AuditFilterBar.tsx` | actor / action / 期間 / target |
| C | `apps/web/src/features/admin/components/_audit/AuditTimeline.tsx` | 日付グルーピング表示 |
| C | `apps/web/src/features/admin/components/_audit/AuditPager.tsx` | cursor pagination |
| C | `apps/web/src/lib/api/admin-schema.ts` | schema 関連 client fns |
| C | `apps/web/src/lib/api/admin-conflicts.ts` | conflicts 関連 client fns |
| C | `apps/web/src/lib/api/admin-audit.ts` | audit 関連 client fns |
| C | `apps/web/src/features/admin/components/__tests__/SchemaDiffView.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/SchemaApplyButton.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/ConflictPairCompare.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/ConflictResolveBar.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/AuditFilterBar.test.tsx` | vitest |
| C | `apps/web/src/features/admin/components/__tests__/AuditTimeline.test.tsx` | vitest |
| R | `apps/api/src/routes/admin/schema.ts` / `sync-schema.ts` | schema endpoint 正本 |
| R | `apps/api/src/routes/admin/identity-conflicts.ts` | conflicts endpoint 正本 |
| R | `apps/api/src/routes/admin/audit.ts` | audit endpoint 正本（`QueryZ` の `action / actorEmail / targetType / targetId / from / to / cursor / limit`） |

---

## 3. 共通パターンとプロトタイプ未掲載画面の派生ルール

| 画面 | パターン | 構成 primitive |
|------|---------|---------------|
| `/admin/schema` | Diff view + Apply CTA | `AdminPageHeader` + `SchemaDiffView`（2 カラム）+ `SchemaApplyButton` |
| `/admin/identity-conflicts` | Side-by-side compare | `AdminPageHeader` + `ConflictPairList`（左）+ `ConflictPairCompare`（右、card×2 並置）+ `ConflictResolveBar` |
| `/admin/audit` | FilterBar + Timeline | `AdminPageHeader` + `AuditFilterBar` + `AuditTimeline`（日付ヘッダ + Card 縦並び） + `AuditPager` |

OKLch ルール:

- diff の add 行: `bg-[color-mix(in_oklch,var(--ubm-color-success)_8%,transparent)]`
- diff の delete 行: `bg-[color-mix(in_oklch,var(--ubm-color-danger)_8%,transparent)]`
- diff の changed 行: `bg-[color-mix(in_oklch,var(--ubm-color-warning)_8%,transparent)]`
- audit の action chip: action 種別ごとに固定 tone（後述）
- 任意 HEX / `bg-[#...]` 禁止

---

## 4. 画面 1: `/admin/schema`

### 4.1 構成

```
[AdminPageHeader: "ADMIN / SCHEMA" / "スキーマ差分"]   [SchemaApplyButton]
[SchemaDiffView]
  ├ 左カラム: current（公開中の Form schema snapshot）
  └ 右カラム: latest（Google Forms 最新）
[各 diff 行]
  ├ 種別 badge (added / removed / changed / unresolved)
  ├ field 情報（label / type / sectionIndex）
  └ stableKey 割当 input（unresolved のときのみ表示）
```

### 4.2 サーバーコンポーネント

```tsx
// apps/web/src/app/(admin)/admin/schema/page.tsx
import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";
import { SchemaDiffView } from "@/features/admin/components/_schema/SchemaDiffView";
import { SchemaApplyButton } from "@/features/admin/components/_schema/SchemaApplyButton";
import { fetchAdminSchema } from "@/lib/api/admin-schema";

export const dynamic = "force-dynamic";

export default async function AdminSchemaPage() {
  const view = await fetchAdminSchema();
  const unresolvedCount = view.diff.filter((d) => d.type === "unresolved" || d.type === "added").length;

  return (
    <div className="flex flex-col">
      <AdminPageHeader
        eyebrow="ADMIN / SCHEMA"
        title="スキーマ差分"
        description="Google Forms 最新と公開中スキーマの差分を確認し、stableKey を割り当てて適用します。"
        actions={<SchemaApplyButton unresolvedCount={unresolvedCount} />}
      />
      <div className="flex flex-col gap-4 px-8 py-6">
        <SchemaDiffView current={view.current} latest={view.latest} diff={view.diff} />
      </div>
    </div>
  );
}
```

### 4.3 SchemaDiffView

```tsx
// apps/web/src/features/admin/components/_schema/SchemaDiffView.tsx
"use client";
import { SchemaDiffRow } from "./SchemaDiffRow";
import type { AdminSchemaSnapshot, AdminSchemaDiffEntry } from "@/lib/api/admin-schema";

export interface SchemaDiffViewProps {
  current: AdminSchemaSnapshot;
  latest: AdminSchemaSnapshot;
  diff: AdminSchemaDiffEntry[];
}

export function SchemaDiffView({ current, latest, diff }: SchemaDiffViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section
          aria-label="公開中スキーマ"
          className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-5"
        >
          <header className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-3)]">
            CURRENT (PUBLISHED)
          </header>
          <dl className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
            <dt>取得時刻</dt><dd className="font-mono text-xs">{current.fetchedAt}</dd>
            <dt>section 数</dt><dd>{current.sectionCount}</dd>
            <dt>field 数</dt><dd>{current.fieldCount}</dd>
          </dl>
        </section>
        <section
          aria-label="最新スキーマ"
          className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-5"
        >
          <header className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-3)]">
            LATEST (FETCHED FROM FORMS)
          </header>
          <dl className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
            <dt>取得時刻</dt><dd className="font-mono text-xs">{latest.fetchedAt}</dd>
            <dt>section 数</dt><dd>{latest.sectionCount}</dd>
            <dt>field 数</dt><dd>{latest.fieldCount}</dd>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)]">
        <header className="border-b border-[var(--ubm-color-border)] px-5 py-3">
          <h2 className="text-base font-semibold">差分一覧 ({diff.length} 件)</h2>
        </header>
        {diff.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--ubm-color-text-2)]">
            差分はありません。
          </p>
        ) : (
          <ul className="divide-y divide-[var(--ubm-color-border)]">
            {diff.map((d) => (
              <SchemaDiffRow key={d.entryId} entry={d} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

### 4.4 SchemaDiffRow（stableKey 割当 UI 含む）

```tsx
// apps/web/src/features/admin/components/_schema/SchemaDiffRow.tsx
"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { assignStableKey } from "@/lib/api/admin-schema";
import type { AdminSchemaDiffEntry } from "@/lib/api/admin-schema";

const tone = {
  added:      "success",
  removed:    "danger",
  changed:    "warning",
  unresolved: "danger",
} as const;

export interface SchemaDiffRowProps {
  entry: AdminSchemaDiffEntry;
}

export function SchemaDiffRow({ entry }: SchemaDiffRowProps) {
  const [stableKey, setStableKey] = useState(entry.proposedStableKey ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!/^[a-z][a-z0-9_]*$/.test(stableKey)) {
      setError("stableKey は snake_case で入力してください。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await assignStableKey(entry.entryId, stableKey);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-col gap-2 px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone={tone[entry.type]}>{entry.type}</Badge>
          <span className="text-sm font-medium">{entry.label}</span>
          <span className="text-xs text-[var(--ubm-color-text-2)]">
            section {entry.sectionIndex} · {entry.fieldType}
          </span>
        </div>
        {entry.currentStableKey ? (
          <span className="font-mono text-xs text-[var(--ubm-color-text-2)]">
            stableKey: {entry.currentStableKey}
          </span>
        ) : null}
      </div>

      {entry.type === "unresolved" || entry.type === "added" ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={stableKey}
            onChange={(e) => setStableKey(e.target.value)}
            placeholder="stableKey (snake_case)"
            disabled={done}
            className="w-64 rounded-md border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] px-3 py-1.5 font-mono text-xs"
          />
          <Button variant="ghost" disabled={busy || done} onClick={submit}>
            {done ? "割当済" : busy ? "保存中…" : "割当"}
          </Button>
          {error ? <span role="alert" className="text-xs text-[var(--ubm-color-danger)]">{error}</span> : null}
        </div>
      ) : null}
    </li>
  );
}
```

### 4.5 SchemaApplyButton

```tsx
// apps/web/src/features/admin/components/_schema/SchemaApplyButton.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { applySchema } from "@/lib/api/admin-schema";

export interface SchemaApplyButtonProps {
  unresolvedCount: number;
}

export function SchemaApplyButton({ unresolvedCount }: SchemaApplyButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await applySchema();
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="primary" disabled={unresolvedCount > 0} onClick={() => setOpen(true)}>
        {unresolvedCount > 0 ? `未解決 ${unresolvedCount} 件` : "差分を適用"}
      </Button>
      {open ? (
        <Modal open onClose={() => setOpen(false)} ariaLabel="スキーマ適用の確認">
          <header className="border-b border-[var(--ubm-color-border)] px-6 py-4">
            <h2 className="text-base font-semibold">スキーマを適用しますか？</h2>
          </header>
          <div className="px-6 py-5 text-sm">
            <p>最新スキーマを公開中 schema として確定します。この操作は audit log に記録されます。</p>
            {error ? <p role="alert" className="mt-3 text-[var(--ubm-color-danger)]">{error}</p> : null}
          </div>
          <footer className="flex justify-end gap-2 border-t border-[var(--ubm-color-border)] px-6 py-4">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>キャンセル</Button>
            <Button variant="primary" onClick={submit} disabled={busy}>
              {busy ? "適用中…" : "適用"}
            </Button>
          </footer>
        </Modal>
      ) : null}
    </>
  );
}
```

---

## 5. 画面 2: `/admin/identity-conflicts`

### 5.1 構成（プロトタイプ未掲載）

```
[AdminPageHeader: "ADMIN / IDENTITY" / "Identity 重複"]
[grid 2col]
  ├ 左: ConflictPairList（候補ペア一覧）
  └ 右: ConflictPairCompare（card×2 並置）+ ConflictResolveBar
```

### 5.2 サーバーコンポーネント

```tsx
// apps/web/src/app/(admin)/admin/identity-conflicts/page.tsx
import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";
import { ConflictsClientShell } from "@/features/admin/components/_conflicts/ConflictsClientShell";
import { fetchIdentityConflicts } from "@/lib/api/admin-conflicts";

export const dynamic = "force-dynamic";

export default async function AdminIdentityConflictsPage() {
  const initial = await fetchIdentityConflicts();
  return (
    <div className="flex flex-col">
      <AdminPageHeader
        eyebrow="ADMIN / IDENTITY"
        title="Identity 重複"
        description="同一人物候補ペアを比較し、統合または棄却します。"
      />
      <div className="flex flex-col gap-4 px-8 py-6">
        <ConflictsClientShell initial={initial} />
      </div>
    </div>
  );
}
```

### 5.3 ConflictsClientShell

```tsx
// apps/web/src/features/admin/components/_conflicts/ConflictsClientShell.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConflictPairList } from "./ConflictPairList";
import { ConflictPairCompare } from "./ConflictPairCompare";
import { ConflictResolveBar } from "./ConflictResolveBar";
import type { ConflictPair, ConflictListResponse } from "@/lib/api/admin-conflicts";

export interface ConflictsClientShellProps {
  initial: ConflictListResponse;
}

export function ConflictsClientShell({ initial }: ConflictsClientShellProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ConflictPair | null>(initial.items[0] ?? null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <ConflictPairList
        items={initial.items}
        selectedId={selected?.conflictId ?? null}
        onSelect={setSelected}
      />
      {selected ? (
        <div className="flex flex-col gap-4">
          <ConflictPairCompare pair={selected} />
          <ConflictResolveBar
            pair={selected}
            onResolved={() => {
              setSelected(null);
              router.refresh();
            }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--ubm-color-border)] p-10 text-center text-sm text-[var(--ubm-color-text-2)]">
          左の一覧から候補ペアを選択してください。
        </div>
      )}
    </div>
  );
}
```

### 5.4 ConflictPairList

```tsx
// apps/web/src/features/admin/components/_conflicts/ConflictPairList.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import type { ConflictPair } from "@/lib/api/admin-conflicts";

export interface ConflictPairListProps {
  items: ConflictPair[];
  selectedId: string | null;
  onSelect: (p: ConflictPair) => void;
}

export function ConflictPairList({ items, selectedId, onSelect }: ConflictPairListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-6 text-sm text-[var(--ubm-color-text-2)]">
        重複候補はありません。
      </div>
    );
  }
  return (
    <ul
      role="listbox"
      aria-label="重複候補ペア"
      className="flex max-h-[640px] flex-col gap-2 overflow-y-auto rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-2"
    >
      {items.map((p) => (
        <li key={p.conflictId} role="option" aria-selected={p.conflictId === selectedId}>
          <button
            type="button"
            onClick={() => onSelect(p)}
            className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition ${
              p.conflictId === selectedId
                ? "bg-[var(--ubm-color-primary-soft)] text-[var(--ubm-color-primary-strong)]"
                : "hover:bg-[var(--ubm-color-bg)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">候補 {p.conflictId.slice(0, 6)}</span>
              <Badge tone="warning">類似度 {Math.round(p.similarity * 100)}%</Badge>
            </div>
            <span className="text-xs text-[var(--ubm-color-text-2)]">
              {p.left.email} ↔ {p.right.email}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### 5.5 ConflictPairCompare

```tsx
// apps/web/src/features/admin/components/_conflicts/ConflictPairCompare.tsx
"use client";
import type { ConflictPair, ConflictMember } from "@/lib/api/admin-conflicts";

export interface ConflictPairCompareProps {
  pair: ConflictPair;
}

function MemberCard({ side, member }: { side: "left" | "right"; member: ConflictMember }) {
  return (
    <section
      aria-label={side === "left" ? "候補 A" : "候補 B"}
      className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-5"
    >
      <header className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-3)]">
          {side === "left" ? "候補 A" : "候補 B"}
        </span>
        <span className="font-mono text-xs">{member.memberId.slice(0, 8)}</span>
      </header>
      <dl className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
        <dt>email</dt><dd className="font-mono text-xs">{member.email}</dd>
        <dt>fullName</dt><dd>{member.fullName}</dd>
        <dt>publishState</dt><dd>{member.publishState}</dd>
        <dt>最終回答</dt><dd className="font-mono text-xs">{member.lastSubmittedAt}</dd>
      </dl>
    </section>
  );
}

export function ConflictPairCompare({ pair }: ConflictPairCompareProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MemberCard side="left" member={pair.left} />
      <MemberCard side="right" member={pair.right} />
    </div>
  );
}
```

### 5.6 ConflictResolveBar

```tsx
// apps/web/src/features/admin/components/_conflicts/ConflictResolveBar.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { resolveConflict } from "@/lib/api/admin-conflicts";
import type { ConflictPair } from "@/lib/api/admin-conflicts";

export interface ConflictResolveBarProps {
  pair: ConflictPair;
  onResolved: () => void;
}

type Action = "merge_left" | "merge_right" | "dismiss";

export function ConflictResolveBar({ pair, onResolved }: ConflictResolveBarProps) {
  const [pending, setPending] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      await resolveConflict(pair.conflictId, { action: pending });
      onResolved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-bg)] p-4">
        <span className="text-sm">どちらを正本として残しますか？</span>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setPending("merge_left")}>
            候補 A を残す
          </Button>
          <Button variant="primary" onClick={() => setPending("merge_right")}>
            候補 B を残す
          </Button>
          <Button variant="ghost" onClick={() => setPending("dismiss")}>
            別人として棄却
          </Button>
        </div>
      </div>
      {pending ? (
        <Modal open onClose={() => setPending(null)} ariaLabel="統合の確認">
          <header className="border-b border-[var(--ubm-color-border)] px-6 py-4">
            <h2 className="text-base font-semibold">操作を確定しますか？</h2>
          </header>
          <div className="px-6 py-5 text-sm">
            <p>
              {pending === "merge_left"  && "候補 A を正本として候補 B を統合します。"}
              {pending === "merge_right" && "候補 B を正本として候補 A を統合します。"}
              {pending === "dismiss"     && "このペアを別人として棄却します。"}
            </p>
            {error ? <p role="alert" className="mt-3 text-[var(--ubm-color-danger)]">{error}</p> : null}
          </div>
          <footer className="flex justify-end gap-2 border-t border-[var(--ubm-color-border)] px-6 py-4">
            <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>キャンセル</Button>
            <Button
              variant={pending === "dismiss" ? "ghost" : "primary"}
              onClick={submit}
              disabled={busy}
            >
              {busy ? "処理中…" : "確定"}
            </Button>
          </footer>
        </Modal>
      ) : null}
    </>
  );
}
```

---

## 6. 画面 3: `/admin/audit`

### 6.1 構成（プロトタイプ未掲載）

```
[AdminPageHeader: "ADMIN / AUDIT" / "監査ログ"]
[AuditFilterBar]                        ← actor / action / targetType / 期間
[AuditTimeline]                         ← 日付ヘッダ + Card 縦並び（JST 換算）
[AuditPager]                            ← cursor pagination
```

### 6.2 サーバーコンポーネント

```tsx
// apps/web/src/app/(admin)/admin/audit/page.tsx
import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";
import { AuditFilterBar } from "@/features/admin/components/_audit/AuditFilterBar";
import { AuditTimeline } from "@/features/admin/components/_audit/AuditTimeline";
import { AuditPager } from "@/features/admin/components/_audit/AuditPager";
import { fetchAdminAudit } from "@/lib/api/admin-audit";

export const dynamic = "force-dynamic";

export interface AdminAuditPageProps {
  searchParams: Promise<{
    actorEmail?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    from?: string;
    to?: string;
    cursor?: string;
  }>;
}

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const sp = await searchParams;
  const data = await fetchAdminAudit(sp);

  return (
    <div className="flex flex-col">
      <AdminPageHeader
        eyebrow="ADMIN / AUDIT"
        title="監査ログ"
        description="管理操作の履歴を時系列で参照します（JST 換算）。"
      />
      <div className="flex flex-col gap-4 px-8 py-6">
        <AuditFilterBar value={sp} />
        <AuditTimeline items={data.items} />
        <AuditPager nextCursor={data.nextCursor ?? null} />
      </div>
    </div>
  );
}
```

### 6.3 AuditFilterBar

```tsx
// apps/web/src/features/admin/components/_audit/AuditFilterBar.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

export interface AuditFilterValue {
  actorEmail?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
}

export interface AuditFilterBarProps {
  value: AuditFilterValue;
}

const TARGET_OPTIONS = [
  { value: "",                  label: "すべて" },
  { value: "member",            label: "member" },
  { value: "admin_member_note", label: "admin_member_note" },
  { value: "tag_queue",         label: "tag_queue" },
  { value: "schema_diff",       label: "schema_diff" },
  { value: "meeting",           label: "meeting" },
  { value: "system",            label: "system" },
];

export function AuditFilterBar({ value }: AuditFilterBarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const apply = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const next = new URLSearchParams();
    for (const k of ["actorEmail", "action", "targetType", "targetId", "from", "to"] as const) {
      const v = (fd.get(k) ?? "").toString().trim();
      if (v) next.set(k, v);
    }
    next.delete("cursor");
    startTransition(() => router.replace(`/admin/audit?${next.toString()}`));
  };

  const reset = () => {
    startTransition(() => router.replace(`/admin/audit`));
  };

  return (
    <form
      role="search"
      aria-label="監査ログのフィルタ"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-4"
      onSubmit={(e) => { e.preventDefault(); apply(e.currentTarget); }}
    >
      <Input name="actorEmail" type="email"   defaultValue={value.actorEmail ?? ""} placeholder="操作者メール" aria-label="操作者メール" />
      <Input name="action"     type="text"    defaultValue={value.action ?? ""}     placeholder="action 名（例: member.update）" aria-label="action" className="w-64" />
      <Select name="targetType" aria-label="対象種別" defaultValue={value.targetType ?? ""} options={TARGET_OPTIONS} />
      <Input name="targetId"   type="text"    defaultValue={value.targetId ?? ""}   placeholder="targetId" aria-label="targetId" className="w-48 font-mono text-xs" />
      <Input name="from"       type="date"    defaultValue={value.from ?? ""}       aria-label="期間 開始" />
      <Input name="to"         type="date"    defaultValue={value.to ?? ""}         aria-label="期間 終了" />
      <div className="flex gap-2">
        <Button type="submit" variant="primary">適用</Button>
        <Button type="button" variant="ghost" onClick={reset}>リセット</Button>
      </div>
    </form>
  );
}
```

### 6.4 AuditTimeline

```tsx
// apps/web/src/features/admin/components/_audit/AuditTimeline.tsx
"use client";
import type { AuditEvent } from "@/lib/api/admin-audit";
import { formatJstDate, formatJstTime } from "@/lib/format/datetime";
import { Badge } from "@/components/ui/badge";

export interface AuditTimelineProps {
  items: AuditEvent[];
}

const actionTone = (action: string): "success" | "warning" | "danger" | "info" | "neutral" => {
  if (action.endsWith(".delete") || action.endsWith(".reject")) return "danger";
  if (action.endsWith(".create") || action.endsWith(".confirm")) return "success";
  if (action.endsWith(".update") || action.endsWith(".resolve")) return "warning";
  if (action.endsWith(".view")) return "neutral";
  return "info";
};

function groupByDate(items: AuditEvent[]) {
  const out = new Map<string, AuditEvent[]>();
  for (const it of items) {
    const d = formatJstDate(it.createdAt);
    if (!out.has(d)) out.set(d, []);
    out.get(d)!.push(it);
  }
  return Array.from(out.entries());
}

export function AuditTimeline({ items }: AuditTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-8 text-center text-sm text-[var(--ubm-color-text-2)]">
        条件に一致する監査ログはありません。
      </div>
    );
  }

  const groups = groupByDate(items);

  return (
    <div className="flex flex-col gap-6">
      {groups.map(([date, rows]) => (
        <section key={date} aria-label={`${date} のログ`}>
          <header className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-3)]">
            {date}
          </header>
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li
                key={r.auditId}
                className="flex items-start gap-3 rounded-lg border border-[var(--ubm-color-border)] bg-[var(--ubm-color-surface)] p-3 text-sm"
              >
                <span className="font-mono text-xs text-[var(--ubm-color-text-2)] w-16 shrink-0">
                  {formatJstTime(r.createdAt)}
                </span>
                <Badge tone={actionTone(r.action)}>{r.action}</Badge>
                <div className="flex flex-col">
                  <span>
                    <span className="font-medium">{r.actorEmail ?? "system"}</span>
                    {" → "}
                    <span className="text-[var(--ubm-color-text-2)]">{r.targetType}</span>
                    {r.targetId ? (
                      <span className="ml-1 font-mono text-xs">/ {r.targetId.slice(0, 8)}</span>
                    ) : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

### 6.5 AuditPager

```tsx
// apps/web/src/features/admin/components/_audit/AuditPager.tsx
"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface AuditPagerProps {
  nextCursor: string | null;
}

export function AuditPager({ nextCursor }: AuditPagerProps) {
  const sp = useSearchParams();
  if (!nextCursor) {
    return (
      <p className="text-center text-xs text-[var(--ubm-color-text-2)]">これ以上の履歴はありません。</p>
    );
  }
  const next = new URLSearchParams(sp);
  next.set("cursor", nextCursor);
  return (
    <div className="flex justify-center">
      <Link
        href={`/admin/audit?${next.toString()}`}
        className="rounded border border-[var(--ubm-color-border)] px-4 py-2 text-sm hover:bg-[var(--ubm-color-bg)]"
      >
        次のページを読み込む
      </Link>
    </div>
  );
}
```

---

## 7. データフロー

### 7.1 admin-schema.ts

```ts
// apps/web/src/lib/api/admin-schema.ts
import { z } from "zod";
import { authedFetch } from "./_authed-fetch";
import { env } from "@/lib/env";
const apiBase = () => env.API_BASE_URL;

export const AdminSchemaSnapshotZ = z.object({
  fetchedAt: z.string(),
  sectionCount: z.number().int().nonnegative(),
  fieldCount: z.number().int().nonnegative(),
});
export const AdminSchemaDiffEntryZ = z.object({
  entryId: z.string(),
  type: z.enum(["added", "removed", "changed", "unresolved"]),
  label: z.string(),
  fieldType: z.string(),
  sectionIndex: z.number().int().nonnegative(),
  currentStableKey: z.string().nullable(),
  proposedStableKey: z.string().nullable(),
});
export const AdminSchemaViewZ = z.object({
  current: AdminSchemaSnapshotZ,
  latest: AdminSchemaSnapshotZ,
  diff: z.array(AdminSchemaDiffEntryZ),
});
export type AdminSchemaSnapshot = z.infer<typeof AdminSchemaSnapshotZ>;
export type AdminSchemaDiffEntry = z.infer<typeof AdminSchemaDiffEntryZ>;
export type AdminSchemaView = z.infer<typeof AdminSchemaViewZ>;

export async function fetchAdminSchema() {
  const res = await authedFetch(`${apiBase()}/admin/schema`, { cache: "no-store" });
  if (!res.ok) throw new Error(`schema ${res.status}`);
  return AdminSchemaViewZ.parse(await res.json());
}

export async function applySchema() {
  const res = await authedFetch(`${apiBase()}/admin/sync-schema`, { method: "POST" });
  if (!res.ok) throw new Error(`sync-schema ${res.status}`);
  return z.object({ ok: z.literal(true) }).parse(await res.json());
}

export async function assignStableKey(entryId: string, stableKey: string) {
  // 既存 endpoint に PATCH 専用 fn が無い場合は sync-schema body の一部として送る
  // adapter として `/admin/schema/:entryId/assign` を期待し、無ければ 422 を投げる前提
  const res = await authedFetch(
    `${apiBase()}/admin/schema/${encodeURIComponent(entryId)}/assign`,
    {
      method: "POST",
      body: JSON.stringify({ stableKey }),
      headers: { "content-type": "application/json" },
    },
  );
  if (!res.ok) throw new Error(`schema assign ${res.status}`);
  return z.object({ ok: z.literal(true) }).parse(await res.json());
}
```

> `assignStableKey` が現行 `apps/api` の surface に存在しない場合は、UI 側で `disabled` 表示 + tooltip "API 未対応" を出して非操作可能にする。**API 側の追加は本 task の非ゴール**（phase-1 §1.2）。

### 7.2 admin-conflicts.ts

```ts
// apps/web/src/lib/api/admin-conflicts.ts
import { z } from "zod";
import { authedFetch } from "./_authed-fetch";
import { env } from "@/lib/env";
const apiBase = () => env.API_BASE_URL;

const ConflictMemberZ = z.object({
  memberId: z.string(),
  email: z.string(),
  fullName: z.string(),
  publishState: z.string(),
  lastSubmittedAt: z.string(),
});
export const ConflictPairZ = z.object({
  conflictId: z.string(),
  similarity: z.number().min(0).max(1),
  left: ConflictMemberZ,
  right: ConflictMemberZ,
});
export const ConflictListZ = z.object({ items: z.array(ConflictPairZ) });
export type ConflictMember = z.infer<typeof ConflictMemberZ>;
export type ConflictPair = z.infer<typeof ConflictPairZ>;
export type ConflictListResponse = z.infer<typeof ConflictListZ>;

export async function fetchIdentityConflicts() {
  const res = await authedFetch(`${apiBase()}/admin/identity-conflicts`, { cache: "no-store" });
  if (!res.ok) throw new Error(`identity-conflicts ${res.status}`);
  return ConflictListZ.parse(await res.json());
}

export async function resolveConflict(
  conflictId: string,
  body: { action: "merge_left" | "merge_right" | "dismiss" },
) {
  const res = await authedFetch(
    `${apiBase()}/admin/identity-conflicts/${encodeURIComponent(conflictId)}/resolve`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    },
  );
  if (!res.ok) throw new Error(`identity-conflicts resolve ${res.status}`);
  return z.object({ ok: z.literal(true) }).parse(await res.json());
}
```

### 7.3 admin-audit.ts

```ts
// apps/web/src/lib/api/admin-audit.ts
import { z } from "zod";
import { authedFetch } from "./_authed-fetch";
import { env } from "@/lib/env";
const apiBase = () => env.API_BASE_URL;

export const AuditEventZ = z.object({
  auditId: z.string(),
  actorEmail: z.string().nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  createdAt: z.string(),
});
export const AuditListZ = z.object({
  items: z.array(AuditEventZ),
  nextCursor: z.string().nullable().optional(),
});
export type AuditEvent = z.infer<typeof AuditEventZ>;
export type AuditListResponse = z.infer<typeof AuditListZ>;

export async function fetchAdminAudit(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const res = await authedFetch(`${apiBase()}/admin/audit?${sp.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`audit ${res.status}`);
  return AuditListZ.parse(await res.json());
}
```

---

## 8. テスト方針

### 8.1 vitest

| ファイル | 検証内容 |
|---------|---------|
| `SchemaDiffView.test.tsx` | diff=[] で empty / type ごとに badge tone が正しい |
| `SchemaApplyButton.test.tsx` | unresolvedCount>0 で disabled / 0 で modal 開く / 適用成功で `router.refresh` |
| `ConflictPairCompare.test.tsx` | left/right 両方の dl に email / fullName / publishState / lastSubmittedAt が現れる |
| `ConflictResolveBar.test.tsx` | 3 action それぞれで confirm modal を経由 / mock 成功で `onResolved` |
| `AuditFilterBar.test.tsx` | actorEmail 入力 → submit で URL に反映 / リセットで `?` 無し URL に戻る |
| `AuditTimeline.test.tsx` | items=[] で empty / 日付グルーピングが JST で正しい / action tone（`.delete` → danger / `.create` → success） |

### 8.2 Playwright（task-18 で実装、観点）

| ID | ステップ | 期待 |
|----|---------|------|
| P-17-01 | admin ログイン → `/admin/schema` | 200、CURRENT / LATEST 表示、diff list 表示 |
| P-17-02 | apply ボタン押下 | 確認 modal 表示（unresolved=0 の前提） |
| P-17-03 | `/admin/identity-conflicts` | 200、左 list / 右 compare、resolve bar 表示 |
| P-17-04 | resolve 「候補 A を残す」 | confirm modal、確定で list 再フェッチ |
| P-17-05 | `/admin/audit` | 200、FilterBar、Timeline、Pager の "次のページを読み込む" |

### 8.3 a11y（jest-axe）

- 6 component すべてで violations.length=0
- modal は `role="dialog"` + focus trap（`Modal` primitive 保証）
- `Tabs`, `listbox`, `option` の semantics を守る
- diff の色分け（success/danger/warning）は色のみで意味を伝えない（必ず Badge text を併置）

---

## 9. ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm -F @ubm-hyogo/web typecheck
mise exec -- pnpm -F @ubm-hyogo/web lint
mise exec -- pnpm -F @ubm-hyogo/web build

# 単体テスト
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/features/admin/components/__tests__/SchemaDiffView.test.tsx \
  src/features/admin/components/__tests__/SchemaApplyButton.test.tsx \
  src/features/admin/components/__tests__/ConflictPairCompare.test.tsx \
  src/features/admin/components/__tests__/ConflictResolveBar.test.tsx \
  src/features/admin/components/__tests__/AuditFilterBar.test.tsx \
  src/features/admin/components/__tests__/AuditTimeline.test.tsx

# dev server
mise exec -- pnpm -F @ubm-hyogo/web dev
# -> http://localhost:3000/admin/schema
# -> http://localhost:3000/admin/identity-conflicts
# -> http://localhost:3000/admin/audit?targetType=member

mise exec -- pnpm verify-design-tokens
mise exec -- pnpm -F @ubm-hyogo/web e2e -- --grep "P-17"
```

---

## 10. Definition of Done

- [ ] D-01: `/admin/schema` が SSR 200。current/latest 表示 + diff list + stableKey 割当 UI + apply button が機能
- [ ] D-02: `/admin/identity-conflicts` が SSR 200。候補 list + side-by-side compare + resolve bar が機能
- [ ] D-03: `/admin/audit` が SSR 200。filter（actorEmail/action/targetType/targetId/from/to）+ timeline + cursor pager が機能
- [ ] D-04: `/admin/schema`, `/admin/sync-schema`, `/admin/identity-conflicts`（resolve 含む）, `/admin/audit` を adapter 経由で接続
- [ ] D-05: `verify-design-tokens` green
- [ ] D-06: jest-axe critical violations 0
- [ ] D-07: vitest テスト（§8.1 の 6 ファイル）green
- [ ] D-08: AdminSidebar の active 表示が `/admin/schema` `/admin/identity-conflicts` `/admin/audit` で当たる
- [ ] D-09: 派生ルール（schema: Diff+Apply / conflicts: Side-by-side / audit: FilterBar+Timeline）が phase-3 §3.1 と整合
- [ ] D-10: `apps/api` 側変更 0 行
- [ ] D-11: `pnpm typecheck` / `pnpm lint` green
- [ ] D-12: 8 admin 画面のうち task-17 担当 3 画面が auth gate 越え → 200 を Playwright で確認
- [ ] D-13: 8 admin 画面（task-15/16/17 合計）すべてで OKLch 適用、a11y critical 0、AdminSidebar の active 一致、API 接続が確認できる

---

## 11. 参考資料

- phase-1 §3.3 / phase-2 §1, §5.2 / phase-3 §1.2, §2.3, §3.1, §3.2
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `apps/api/src/routes/admin/schema.ts` / `sync-schema.ts` / `identity-conflicts.ts` / `audit.ts`
- `apps/api/src/routes/admin/audit.test.ts`
- `apps/web/src/components/layout/AdminSidebar.tsx`（task-09/10 確定済み）
- task-15（layout 確定 + dashboard / members）
- task-16（tags / meetings / requests）


---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する
