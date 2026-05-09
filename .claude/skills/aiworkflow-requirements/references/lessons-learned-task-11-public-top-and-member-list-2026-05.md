---
task_root: docs/30-workflows/task-11-public-top-and-member-list/
synced_at: 2026-05-09
state: implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING
related_lessons:
  - lessons-learned-06a-public-web-2026-04.md
  - lessons-learned-task-10-ui-primitives-2026-05.md
related_specs:
  - docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md
  - docs/00-getting-started-manual/specs/01-api-schema.md
  - docs/00-getting-started-manual/claude-design-prototype/
follow_ups:
  - task-ut-04 seed-data-runbook（local D1 に member_identities 投入する runbook 起票）
  - task-08b firefox / mobile playwright project 復活 follow-up
---

# task-11: 公開トップ `/` と会員一覧 `/members` 実装の苦戦箇所

> 対象タスク: `docs/30-workflows/task-11-public-top-and-member-list/`
> 同期日: 2026-05-09
> 実装範囲:
> - `apps/web/app/page.tsx`（公開トップ 4セクション集約）
> - `apps/web/app/(public)/layout.tsx`、`apps/web/app/(public)/members/page.tsx`
> - `apps/web/src/components/public/{Hero,Stats,ZoneIntro,Timeline,MemberFilters.client,MemberGrid,MemberTable,DensityToggle.client,PublicHeader,PublicFooter}.tsx`
> - `apps/web/src/lib/api/public.ts`（API adapter 新設）
> - `apps/web/playwright.config.ts`、`apps/web/playwright/tests/public-top-and-list.spec.ts`
> 削除: `apps/web/app/(public)/members/_components/*`、`apps/web/src/components/public/StatCard.tsx`

---

## L-T11-001: route segment colocation（`_components/`）廃止と `src/components/public/` 集約

### 状況

`/members` 配下に `app/(public)/members/_components/MemberList.tsx` / `MembersFilterBar.client.tsx` が colocation で配置されていた。
task-11 で `MemberFilters.client` / `MemberGrid` / `MemberTable` / `DensityToggle.client` を新設する際、
公開トップ `/` 側でも一部 primitive を再利用する必要が出てきて、
route segment 内に閉じた colocation だと `app/page.tsx` から import するのが不自然になった。

### 判断 / 採用解

`app/(public)/members/_components/` を**全削除**し、
`apps/web/src/components/public/` に**公開層の UI primitive を一元集約**した。
`MemberList` の責務は `MemberGrid` + `MemberTable` + `DensityToggle.client` の組み合わせに分解し、
filter bar は `MemberFilters.client` に rename して URL state（`router.replace`）担当を明確化した。

### なぜ

- 公開層の primitive は route 跨ぎ（`/` と `/members`）で再利用される設計に変わったため、segment colocation は局所最適
- task-10 で確立した `apps/web/src/components/ui/`（基底 primitive）と並行して、`apps/web/src/components/public/`（ドメイン specific composite）の階層分離を整える方が、後続 task-12..14 の認識負荷が下がる
- `_components/` prefix は Next.js の private folder 規約だが、import path が長くなるデメリットの方が大きかった

### 再発防止 / 将来適用パターン

- 公開層・会員層・管理層の **segment 跨ぎ再利用 primitive** は `apps/web/src/components/{public,member,admin}/` 直下に置く
- route segment colocation は「その route だけが使うことが Phase 2 設計時に確定している場合」に限定する
- task-specification-creator の Phase 5 設計テンプレに「colocation か `src/components/{layer}/` 集約か」を明示判断する 1 line を追加する候補

---

## L-T11-002: Hero / StatCard / Timeline 単体構成 → Hero+Stats+ZoneIntro+Timeline 4セクション集約への置換

### 状況

06a 期の公開トップは `Hero` + `StatCard` 複数 + `Timeline` の 3 階層フラット構成だった。
task-11 では prototype（`docs/00-getting-started-manual/claude-design-prototype/`）に合わせて、
Hero（above-the-fold）/ Stats（stat 集約 1 ブロック）/ ZoneIntro（兵庫の所属ゾーン紹介）/ Timeline（年表）の **4 セクション集約**へ再構成する必要があった。
旧 `StatCard` を残すか、`Stats` に集約するかで token 駆動レイアウトの整合性が取れない問題が発生。

### 判断 / 採用解

- 旧 `apps/web/src/components/public/StatCard.tsx` および `__tests__/StatCard.test.tsx` を**削除**
- 新規 `Stats.tsx` を 1 ブロックの section component として導入（`/public/stats` を集約消費する単一責務）
- `ZoneIntro.tsx` を新設し、所属ゾーン（兵庫支部の地区）を prototype tokens で配置
- `Hero` / `Timeline` は OKLch token + spacing rhythm に合わせて props 整理
- `__tests__/Stats.test.tsx` を新設して 4 セクション正本の test boundary を `Stats` に移動

### なぜ

- prototype の above-the-fold は「Hero → Stats → ZoneIntro → Timeline」の縦リズム前提で token spacing が組まれており、`StatCard` 個別配置だと rhythm が壊れる
- `StatCard`（primitive）と `Stats`（section composite）は責務が異なる。primitive 化したいなら `apps/web/src/components/ui/` に `Stat` を置くべきで、`public/StatCard` は中間状態だった
- task-10 の `Stat` primitive と重複していたのを解消（task-10 ui-primitives spec の `Stat` が canonical primitive）

### 再発防止 / 将来適用パターン

- 公開層の section component は **prototype の縦リズム単位**で構成する（1 section 1 file）
- primitive と section composite を混在させない（primitive は `components/ui/`、section composite は `components/{layer}/`）
- 大改修で旧 component を削除する場合、対応 test も同 wave で削除し、責務移転先 test を新設する

---

## L-T11-003: `apps/web/src/lib/api/public.ts` API adapter 層新設で D1 直接アクセス禁止を強制

### 状況

task-11 実装初期は、`app/page.tsx` / `app/(public)/members/page.tsx` から直接 `fetch('/public/stats')` / `fetch('/public/members?...')` を書いていた。
しかし複数 page で fetch URL / cache config / response shape parse が散在し、
不変条件 #5（`apps/web` から D1 直接アクセス禁止 + apps/api 経由のみ）の boundary が grep だけでは追えない状態だった。
さらに `revalidate` 値（stats=60 / members=30）も page ごとに hardcode されていた。

### 判断 / 採用解

`apps/web/src/lib/api/public.ts` に **API adapter 層**を新設:

- `getPublicStats()` / `getPublicMembers(searchParams)` の 2 関数で fetch wrapper を統一
- response を `zod` schema で `parse` し、shape drift を build-time / runtime 双方で fail-fast
- `revalidate` 値（stats=60s / members=30s）を adapter に集約
- `__tests__/public.test.ts` で contract test を実装（mock fetch + zod parse 失敗ケース）
- API base URL は `getEnv()` 経由のみ参照（`process.env.*` 直参照禁止 = task-02 不変条件）

### なぜ

- 不変条件 #5 を **fetch wrapper の単一 entry point に集約**することで、grep gate（task-18）が `apps/web/src/lib/api/` 配下だけ見れば済む
- zod parse による shape drift fail-fast は、apps/api 側の response 変更を build-time で検出できる（PR レビュー前に CI で気付ける）
- revalidate config を 1 箇所に集約し、後続 task-12..14 でも同 adapter を再利用させる

### 再発防止 / 将来適用パターン

- `apps/web` から `apps/api` を呼ぶ箇所は **必ず `apps/web/src/lib/api/{layer}.ts` adapter 経由**にする
- response parse は zod など runtime validation を必須とする（型だけでは shape drift が build を通ってしまう）
- adapter 単位で `__tests__` を置き、fetch mock + parse 失敗ケースを最低 1 件入れる

---

## L-T11-004: `force-dynamic` 撤去 → `connection()` 移行（OpenNext + Cloudflare Workers）

### 状況

06a 期の `app/page.tsx` / `app/(public)/members/page.tsx` は `export const dynamic = 'force-dynamic'` で build-time prerender を回避していた。
task-11 で `revalidate` ベースの ISR-like cache（stats=60s / members=30s）に切り替える際、
`force-dynamic` が残っていると revalidate が効かず、毎リクエスト fetch が走る挙動になっていた。
さらに OpenNext + Cloudflare Workers で build 時に `/public/stats` への fetch が試みられて build が失敗するケースもあった。

### 判断 / 採用解

- `force-dynamic` を**撤去**
- 代わりに React canary `connection()` API を call して **request-time rendering** を opt-in
- `revalidate` 値は adapter（L-T11-003）に集約済みなので、page 側は `connection()` のみで build-time fetch を回避
- task-11 の禁則として `force-dynamic` 不使用を Phase 5 不変条件に追加

### なぜ

- `force-dynamic` は revalidate を無効化してしまうため、ISR-like cache 設計と両立しない
- `connection()` は「request-time signal が必要」を宣言するだけで、cache 自体は revalidate に従うため両立可能
- OpenNext + Cloudflare Workers の build phase で外部 fetch が走る事故は再発しやすい（過去にも複数 task で踏んでいる）

### 再発防止 / 将来適用パターン

- Next.js 16 + OpenNext + Cloudflare Workers では **`force-dynamic` を原則使わない**
- request-time rendering が必要なら `connection()`、cache 戦略は `revalidate` で表現
- task-specification-creator の Phase 5 テンプレに「`force-dynamic` 不使用 / `connection()` + `revalidate` 二段構成」を warning として追加候補

---

## L-T11-005: local D1 に `member_identities` 不在で screenshot / axe 未取得 → task-ut-04 seed-data-runbook follow-up

### 状況

Phase 11 で `pnpm dev` 起動 → `/` / `/members` の screenshot 取得 + axe 監査を取る予定だったが、
local D1 binding に `member_identities` テーブルの seed data が無く、
`/public/members` が空配列を返して member grid / table が空状態でしか撮影できなかった。
production 同等の実 evidence が取れず、Phase 11 outputs を `PENDING_RUNTIME_EVIDENCE` で確定した。

### 判断 / 採用解

- Phase 11 outputs に `PENDING_RUNTIME_EVIDENCE` ラベルで明示し、artifacts.json の status を `pending` に揃える
- 後続 follow-up として **task-ut-04 seed-data-runbook** を起票（local D1 に `member_identities` を seed する runbook 整備）
- task-11 自体の AC を「実装ローカル反映 + adapter contract test PASS + Playwright local PASS」に限定し、screenshot / axe / coverage / commit / push / PR は user-gated に分離

### なぜ

- seed data 不在は task-11 のスコープ外（infra / dev 環境整備の責務）で、無理に task-11 に取り込むと責務が肥大化する
- `PENDING_RUNTIME_EVIDENCE` を明示することで、後段の Phase 13 で「なぜ evidence が無いのか」を再調査せずに済む
- follow-up を別 task に切り出すことで、task-11 の close-out 判定が seed runbook の完了に block されない

### 再発防止 / 将来適用パターン

- runtime evidence（screenshot / axe / coverage）が seed / fixture の有無に依存する場合、Phase 1 で **seed precondition を明示**し、不在時は follow-up 起票方針を Phase 12 に書く
- `PENDING_RUNTIME_EVIDENCE` は status 値として artifacts.json schema に正式採用し、grep で拾えるようにする
- task-specification-creator は「local seed precondition」セクションを Phase 5 設計テンプレに追加候補

---

## L-T11-006: `playwright.config.ts` を `desktop-chromium` 単独 project に絞り込み

### 状況

06a 期の `apps/web/playwright.config.ts` は `desktop-chromium` / `firefox` / `mobile-chrome` の 3 project 並列だった。
task-11 で `public-top-and-list.spec.ts` を新設する際、firefox / mobile project が
- network mock の差異（fetch の Service Worker 挙動）
- viewport 差異による layout assertion failure
- CI 実行時間の増加（3 並列 × 全 spec）
で flaky になっており、CI gate を blocking していた。

### 判断 / 採用解

- `playwright.config.ts` の `projects` を **`desktop-chromium` 単独**に絞り込み
- firefox / mobile-chrome は task-08b follow-up（cross-browser / responsive smoke 復活）として別 task で扱う
- task-11 の AC は desktop-chromium PASS のみで close-out 可能とする
- spec 側は viewport 依存しない assertion（role / text / data-testid）に揃える

### なぜ

- task-11 の主目的は「実装ローカル反映と adapter contract」で、cross-browser / responsive 対応は別レイヤーの問題
- flaky な firefox / mobile を残すと、毎 PR で再実行が発生して CI cost / 待ち時間が増える
- desktop-chromium は最も安定した baseline で、まず baseline を緑に固定してから cross-browser を足す方が回帰検出が容易

### 再発防止 / 将来適用パターン

- Playwright project 増設は **baseline（desktop-chromium）緑固定後**に行う
- cross-browser / responsive smoke は責務を別 task に切り出し、task-11 のような実装 task の AC を肥大化させない
- task-08b（firefox / mobile follow-up）と関連付けて、project 復活条件（flaky 率 / 平均実行時間）を Phase 5 で明示する

---

## 横断教訓

- **責務分離の徹底**: route segment colocation 廃止（L-T11-001）/ section composite と primitive 分離（L-T11-002）/ API adapter 層新設（L-T11-003）はすべて「再利用可能性の境界線」を明示する同質の判断
- **build-time 安全と runtime 安全の二段構え**: zod parse（build/runtime）+ `connection()` + `revalidate`（runtime cache）の組み合わせで、shape drift と prerender 事故の双方を防止
- **scope を肥大化させない follow-up 切り出し**: seed runbook（L-T11-005）/ cross-browser smoke（L-T11-006）は task-11 の責務外として明示的に follow-up 起票
- **prototype 駆動の縦リズム**: 公開層 section の構造（L-T11-002）は prototype の token spacing を正本にし、コードから生やさない
