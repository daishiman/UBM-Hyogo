# Phase 6 — テスト拡充（カバレッジ目標到達）

`[実装区分: 実装仕様書]`（taskType=implementation / visualEvidence=VISUAL / workflow_state=implemented_local_evidence_captured）

> Phase 5（Green）で実装した分岐・純関数・SQL・命名の **境界とエッジケース** を網羅し、カバレッジ目標へ到達させる追加テスト仕様。
> 唯一の正本は `../../_shared-context.md`（SSOT）。spec は `*.spec.{ts,tsx}` のみ（不変条件 #8）。新 endpoint / schema 変更なし。

---

## 1. Lane C — parsePendingRequestTypes 純関数の境界

対象ファイル: `apps/api/src/routes/admin/members.contract.spec.ts`（拡充）または純関数を export して `apps/api/src/routes/admin/__tests__/members-pending-request.spec.ts`（新規・unit）。

> `parsePendingRequestTypes` は現状 module-local（非 export）。境界を直接 unit test するには `members.ts` から named export する（副作用なし・surface 影響なし）。export を避ける場合は contract spec で D1 fixture 経由（下記 §2）で同等カバレッジを取る。**推奨: export して unit 化**（分岐網羅が安定）。

| # | ケース名 | 入力 | 期待 |
| --- | --- | --- | --- |
| P-1 | `null は空配列` | `null` | `[]` |
| P-2 | `空文字は空配列` | `""` | `[]` |
| P-3 | `不正 JSON は空配列（throw しない）` | `"{not json"` | `[]` |
| P-4 | `配列でない JSON は空配列` | `'"visibility_request"'`（文字列）/ `'{"a":1}'` | `[]` |
| P-5 | `未知 note_type を除外` | `'["visibility_request","general","note"]'` | `["visibility_request"]` |
| P-6 | `両種別を保持` | `'["visibility_request","delete_request"]'` | set 等価で両方 |
| P-7 | `重複は DISTINCT で 1 つに畳む` | `'["visibility_request","visibility_request"]'` | `["visibility_request"]`（length 1） |
| P-8 | `null 要素や数値要素を無視` | `'[null, 1, "delete_request"]'` | `["delete_request"]` |

> P-7 は SQL 側で `json_group_array(DISTINCT ...)` を使うため通常重複しないが、純関数の防御として Set で畳む実装を assert（多層防御）。

---

## 2. Lane C(API) — 相関サブクエリの件数バリエーション

対象ファイル: `apps/api/src/routes/admin/members.contract.spec.ts`（拡充）

Phase 4 の C-T1..C-T6 に加えて、相関サブクエリが返す件数の網羅:

| # | ケース名 | seed | 期待 |
| --- | --- | --- | --- |
| Q-1 | `0 件: 申請なし member は空配列` | 申請 0 | `pendingRequestTypes === []` |
| Q-2 | `1 件: visibility のみ` | visibility×1 | `["visibility_request"]` |
| Q-3 | `1 件: delete のみ` | delete×1 | `["delete_request"]` |
| Q-4 | `両種別: visibility + delete` | 両方×1 | set 等価で両方・length 2 |
| Q-5 | `同種別複数 pending は DISTINCT で 1 つ` | visibility×2（別 note_id） | `["visibility_request"]`（length 1） |
| Q-6 | `resolved/rejected は除外` | visibility resolved×1 + delete pending×1 | `["delete_request"]` のみ |
| Q-7 | `他 member の申請は混ざらない` | m1 に visibility、m2 に delete を seed → `/members` | m1 行は `["visibility_request"]`、m2 行は `["delete_request"]`（相関の member_id 境界） |
| Q-8 | `note_type が general 等の管理メモは無視` | `note_type='general'` の note を seed | `[]`（IN 句で除外） |

> Q-7 は相関サブクエリの `WHERE amn.member_id = mi.member_id` 境界の回帰ガード（他者申請の漏れ込み防止）。`seedPendingRequest`（Phase 4 §2 ヘルパ）を再利用。

---

## 3. Lane C(web) — MembersTable バッジ表示の網羅

対象ファイル: `apps/web/src/features/admin/components/_members/__tests__/MembersTable.pendingRequest.spec.tsx`（拡充）

| # | ケース名 | item | 期待 |
| --- | --- | --- | --- |
| W-1 | `空配列でバッジ非表示` | `pendingRequestTypes: []` | `queryByText(/申請中/)` が null |
| W-2 | `undefined 相当でも落ちない` | `pendingRequestTypes` を default([]) 経由で未指定（型上は配列） | 例外なく render・バッジなし |
| W-3 | `visibility のみ → 公開申請中 1 チップ + href` | `["visibility_request"]` | `getByRole("link", { name: /公開申請中（会員からの申請へ）/ })` の href が `/admin/requests?type=visibility_request` |
| W-4 | `delete のみ → 退会申請中 + href` | `["delete_request"]` | href が `/admin/requests?type=delete_request` |
| W-5 | `両種別 → visibility 先・delete 後の順で 2 チップ` | `["delete_request","visibility_request"]`（入力順逆） | DOM 上の順序が 公開申請中 → 退会申請中（SSOT §5 visibility 優先） |
| W-6 | `バッジクリックは行 onOpenRow を発火しない` | バッジ Link を click | `onOpenRow` mock が呼ばれない（`stopPropagation` 検証） |
| W-7 | `aria-label assertion（命名 a11y）` | `["visibility_request"]` | accessible name に「公開申請中」「会員からの申請へ」を含む |

> W-6 は `onOpenRow={vi.fn()}` を渡し、`fireEvent.click(badgeLink)` 後に `expect(onOpenRow).not.toHaveBeenCalled()`。

---

## 4. Lane B(web) — 命名の aria-label / テキスト一貫性 assertion

対象ファイル: `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` / `RequestQueueDetail.spec.tsx`（拡充）

| # | ケース名 | 期待 |
| --- | --- | --- |
| N-1 | `Panel: 申請一覧 ul の aria-label` | `getByRole("list", { name: "申請一覧" })` が存在（旧「依頼一覧」が DOM に無い: `queryByLabelText("依頼一覧")` が null） |
| N-2 | `Panel: 空状態文言` | items=[] → `getByText("未処理の申請はありません")`・`queryByText("未処理の依頼はありません")` が null |
| N-3 | `Panel: showHeading 時 h1「会員からの申請」+ 会員管理リンク` | h1 level1 name「会員からの申請」・`getByRole("link", { name: /会員管理/ })` の href が `/admin/members` |
| N-4 | `Detail: 申請詳細 aria-label + 見出し` | `getByLabelText("申請詳細")` 存在・見出し「申請詳細」・`queryByText("依頼詳細")` が null |
| N-5 | `不変識別子の回帰` | h1 の `id="admin-requests-h"`・フィルタ group `aria-label="依頼種別"`・`NOTE_TYPE_LABEL` の「公開停止/再開」「退会」タブが不変 |
| N-6 | `Detail 空状態文言の一貫性（任意）` | EmptyState「左の一覧から申請を選択してください。」（Phase 5 で揃えた場合）。揃えない場合は本ケースを skip |

> N-5 は「内部識別子は不変・表示テキストのみ命名変更」（SSOT §3）の回帰ガード。`id` を変えると CSS/Playwright/テストセレクタが壊れるため明示 assert。

---

## 5. Lane A — seed drift guard の冪等性 + CI 手順

対象ファイル: `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts`（拡充）

| # | ケース名 | 期待 |
| --- | --- | --- |
| D-1 | `buildSeedSql は冪等（2 回呼んで同一文字列）` | `buildSeedSql() === buildSeedSql()`（非決定値・datetime('now') 不混入の再確認） |
| D-2 | `committed seed.sql と byte 一致` | `readFileSync(seedPath,"utf8") === buildSeedSql()`（Phase 4 A-T8 の継続・Green 後に PASS） |
| D-3 | `committed cleanup.sql と byte 一致` | `readFileSync(cleanupPath,"utf8") === buildCleanupSql()` |
| D-4 | `manifest は不変（member 10 / loginable 7 / publicListed 5 / admin active 2）` | `buildManifest()` の件数が requests 追加後も不変（申請は member メタに非影響） |
| D-5 | `note 行に非決定 datetime が無い` | `expect(buildSeedSql()).not.toMatch(/datetime\('now'\)/)`（固定 ISO のみ） |

### CI で回す手順（drift gate）

drift 検出の正本は `scripts/gen-test-accounts-seed.mjs --check`（committed と現生成物を比較し差分で exit 1）。CI/ローカル両方で:

```bash
# 1) 生成器を変えたら必ず再生成してコミット
mise exec -- pnpm seed:test-accounts:gen
git add apps/api/migrations/seed/test-accounts-seed.sql apps/api/migrations/seed/test-accounts-cleanup.sql

# 2) drift check（CI gate と同等。exit 0 で drift なし）
mise exec -- pnpm seed:test-accounts:gen -- --check

# 3) vitest 側 byte 一致ガード（D-2/D-3）も同時に PASS
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/testing/test-accounts
```

> 既存 CI（`.github/workflows` の backend-ci / verify 系）が `pnpm seed:test-accounts:gen --check` を呼ぶ場合はそのまま gate になる。呼ばない場合でも vitest の D-2/D-3 byte 一致が drift ガードとして機能する（commit 漏れ＝fail）。新規 CI job は追加しない（不変条件: surface を増やさない）。

---

## 6. shared schema の境界（viewmodel.spec.ts 拡充・任意）

対象ファイル: `packages/shared/src/zod/viewmodel.spec.ts`（拡充）

| # | ケース名 | 入力 | 期待 |
| --- | --- | --- | --- |
| S-1 | `pendingRequestTypes 省略時 default []` | item から `pendingRequestTypes` を省いて parse | `.pendingRequestTypes === []` |
| S-2 | `未知 enum 値は parse fail` | `pendingRequestTypes: ["unknown"]` | `safeParse().success === false` |
| S-3 | `両 enum 値を受理` | `["visibility_request","delete_request"]` | success・配列保持 |
| S-4 | `既存 members 空配列 parse は非破壊` | `{ total:0, members:[] }`（既存 L260 ケース） | 引き続き success（回帰） |

---

## 7. 実行コマンド（拡充後 全 PASS 確認・DoD）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/routes/admin src/testing/test-accounts
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin src/features/admin/components/_members
mise exec -- pnpm --filter @ubm-hyogo/shared test --run
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm seed:test-accounts:gen -- --check   # drift 0
rg -n "bg-\[#|text-\[#|#[0-9a-fA-F]{6}" apps/web/src/components/admin apps/web/src/features/admin/components/_members  # HEX 0 件
```

DoD: 上記全 PASS、drift 0、HEX 0 件、AC-1..13 充足、parsePendingRequestTypes / 相関サブクエリ / バッジ表示 / 命名 / seed drift の各分岐がカバーされている。

---

## 完了条件

- [ ] `parsePendingRequestTypes` の境界（null / 空 / 不正 JSON / 配列でない / 未知 type 除外 / 両種別 / 重複 DISTINCT / null・数値要素無視）が P-1..P-8 で網羅されている（export 方針 or fixture 方針を明記）。
- [ ] 相関サブクエリの件数バリエーション（0/1/両種別/同種別 DISTINCT/resolved 除外/他 member 非混入/general 除外）が Q-1..Q-8 で網羅されている。
- [ ] バッジ非表示（空配列）・href・順序（visibility 優先）・onOpenRow 非発火・aria-label が W-1..W-7 で網羅されている。
- [ ] 命名の aria-label / テキスト一貫性（申請一覧 / 申請詳細 / 未処理の申請 / 会員からの申請）と不変識別子（`#admin-requests-h` / `aria-label="依頼種別"`）の回帰が N-1..N-6 で assert されている。
- [ ] seed drift guard の冪等性（D-1）と committed byte 一致（D-2/D-3）・manifest 不変（D-4）・非決定値非混入（D-5）が記述され、CI で回す手順（`pnpm seed:test-accounts:gen --check`）が明記されている。
- [ ] shared schema の default / enum 境界（S-1..S-4）が記述されている。
- [ ] 拡充後の全 PASS 実行コマンドと DoD が記載されている。
