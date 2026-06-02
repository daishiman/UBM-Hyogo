# Phase 4: テスト作成（TDD RED）

> **[実装区分: 実装仕様書]**。本 Phase は実装前に失敗するテスト（RED）を設計し、AC-2/3/4/5/8 の検証ケースを固定する。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`
- テスト方針: TDD RED 先行。Phase 5 実装後に GREEN へ遷移する。
- テストファイル命名: `*.spec.{ts,tsx}` のみ（invariant #8。`*.test.{ts,tsx}` は lefthook `block-test-suffix` / GitHub Actions `verify-test-suffix` が reject する）。
- 対象 package 名（filter 用 canonical）: shared = `@ubm-hyogo/shared` / api = `@ubm-hyogo/api` / web = `@ubm-hyogo/web`

## 目的

Phase 2 §2 の契約（schema optional + `.strict()` 維持 / batch helper / resolver DI / UI src 配線 / fail-soft）に対して、実装前に失敗する検証テストを定義する。各テストの期待値を固定し、Phase 5 実装の受入基準とする。

## テスト lane と対象ファイル

| lane | テストファイル | 対象 AC | 種別 |
|------|---------------|---------|------|
| A: shared schema | `packages/shared/src/zod/__tests__/viewmodel.spec.ts`（既存に追記） | AC-2 | 新規ケース追記 |
| B: repository batch | `apps/api/src/repository/__tests__/member-photos.batch.spec.ts`（新規） | AC-8 | 新規ファイル |
| C: list use-case | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`（既存に追記） | AC-3/AC-8 | 新規ケース追記 |
| D: profile use-case | `apps/api/src/use-cases/public/__tests__/get-public-member-profile.spec.ts`（既存に追記） | AC-4 | 新規ケース追記 |
| E: MemberCard render | `apps/web/src/components/public/__tests__/MemberCard.spec.tsx`（新規） | AC-3/AC-5 | 新規ファイル |
| F: ProfileHero render | `apps/web/src/components/public/__tests__/ProfileHero.component.spec.tsx`（新規） | AC-4/AC-5 | 新規ファイル |

> lane A/C/D の既存テストファイルが存在しない場合は同名・同 dir で新規作成する。lane B/E/F は本 task の新規ファイル（index.md 成果物インベントリと一致）。

## 実行タスク

### lane A: shared schema（AC-2）

`PublicMemberListItemZ` / `PublicMemberProfileZ` の photoUrl 追加に対する parse 検証。

| # | ケース | 入力 | 期待値 |
|---|--------|------|--------|
| A-1 | list item: photoUrl 有・有効 url を parse 成功 | 全必須 + `photoUrl: "https://r2.example.com/key?sig=x"` | `parse` 成功・`result.photoUrl` が入力値と一致 |
| A-2 | list item: photoUrl 省略を parse 成功 | 全必須・photoUrl キー無し | `parse` 成功・`result.photoUrl === undefined` |
| A-3 | list item: 不正 url を reject | `photoUrl: "not-a-url"` | `safeParse().success === false` |
| A-4 | profile: photoUrl 有・有効 url を parse 成功 | 全必須 + `photoUrl: "https://r2.example.com/p?sig=x"` | `parse` 成功・`result.photoUrl` 一致 |
| A-5 | profile: photoUrl 省略を parse 成功 | photoUrl キー無し | `parse` 成功・`result.photoUrl === undefined` |
| A-6 | profile: `.strict()` 維持（余分キー reject） | 全必須 + `photoUrl` + `extraKey: "x"` | `safeParse().success === false`（unknown key で reject） |
| A-7 | profile: 不正 url を reject | `photoUrl: "ftp://bad"` 等 url 失敗値 | `safeParse().success === false` |

> A-6 は profile schema の `.strict()` が photoUrl 追加後も保たれることの回帰 guard。list item schema は `.strict()` を持たないため余分キー reject ケースは設けない（Phase 2 §2.1 の注記に整合）。

### lane B: repository batch helper（AC-8）

`listMemberPhotosByIds(c, memberIds): Promise<Map<string,string>>` の単体検証。`DbCtx` は prepare/bind/all をスタブした fake で注入する。

| # | ケース | 入力 | 期待値 |
|---|--------|------|--------|
| B-1 | 空配列は空 Map（SQL 非発行） | `memberIds = []` | `result.size === 0` かつ stub の `prepare` が呼ばれない |
| B-2 | 複数 id を Map で返す | `["m1","m2"]`・stub results = 2 row | `result.get("m1")` / `result.get("m2")` が各 object_key と一致・`result.size === 2` |
| B-3 | 未登録 id は Map に含めない | `["m1","m2","m3"]`・stub results = m1/m2 のみ | `result.has("m3") === false`・`result.size === 2` |
| B-4 | プレースホルダ数が id 数と一致 | `["m1","m2","m3"]` | stub に渡る SQL の `?` 個数が 3・`bind` 引数が `["m1","m2","m3"]` |
| B-5 | `results` が undefined でも空 Map | stub all() が `{ results: undefined }` | `result.size === 0`（throw しない） |

### lane C: list use-case（AC-3/AC-8）

`listPublicMembersUseCase` に `resolvePhotoUrls` を DI したときの photoUrl 出し分け。公開 gate と summary 取得は既存 repo を fake で固定する。

| # | ケース | 入力（deps） | 期待値 |
|---|--------|-------------|--------|
| C-1 | resolver 注入で item に photoUrl | `resolvePhotoUrls = async () => new Map([["m1","https://r2/m1?s=x"]])`・gate member = m1 | `items[0].photoUrl === "https://r2/m1?s=x"` |
| C-2 | resolver 未注入で photoUrl なし | `resolvePhotoUrls` 省略 | `items[0].photoUrl === undefined`（既存テスト後方互換） |
| C-3 | resolver が一部 member だけ返す | gate member = m1/m2・resolver Map = m1 のみ | `items[m1].photoUrl` 有・`items[m2].photoUrl === undefined` |
| C-4 | resolver は抽出 memberIds で 1 回だけ呼ばれる | gate member = m1/m2 | `resolvePhotoUrls` spy 呼び出し回数 === 1・引数 === `["m1","m2"]`（N+1 無し検証） |
| C-5 | resolver が空 Map（fail-soft）でも 200 相当を維持 | `resolvePhotoUrls = async () => new Map()` | use-case が throw せず items 返却・全 item photoUrl undefined |

### lane D: profile use-case（AC-4）

`getPublicMemberProfileUseCase` に `resolvePhotoUrl` を DI したときの photoUrl 注入と公開 gate 不通過時の漏れ防止。

| # | ケース | 入力（deps） | 期待値 |
|---|--------|-------------|--------|
| D-1 | resolver 注入で photoUrl | gate 通過 member・`resolvePhotoUrl = async () => "https://r2/p?s=x"` | `profile.photoUrl === "https://r2/p?s=x"` |
| D-2 | resolver 未注入で photoUrl なし | `resolvePhotoUrl` 省略・gate 通過 | `profile.photoUrl === undefined` |
| D-3 | 公開 gate 不通過は 404 で写真も漏れない | gate 非通過 member・resolver は url を返す stub | use-case が 404 相当（既存 NotFound 経路）を投げ、resolver が呼ばれない（spy 呼び出し回数 === 0） |
| D-4 | resolver が undefined（写真未登録 / fail-soft） | gate 通過・`resolvePhotoUrl = async () => undefined` | `profile.photoUrl === undefined`・throw しない |

> D-3 は AC-4/AC-6 の境界 guard。公開 gate 通過後にのみ resolver を呼ぶ Phase 2 §1.2 の順序を検証する。

### lane E: MemberCard render（AC-3/AC-5）

`MemberCard` の `member.photoUrl` を `<Avatar src>` まで渡す配線を density 全種で検証する。`photoUrl` は MemberCard の external prop（`member` の field）であり、内部 state ではない。

| # | ケース | 入力（density / member） | 期待値 |
|---|--------|------------------------|--------|
| E-1 | photoUrl 有・comfy で img src | `density="comfy"`・`member.photoUrl="https://r2/m1?s=x"` | render 結果に `img` が存在し `src` が photoUrl と一致 |
| E-2 | photoUrl 有・dense で img src | `density="dense"`・同上 | 同上（img src 一致） |
| E-3 | photoUrl 有・list で img src | `density="list"`・同上 | 同上（img src 一致） |
| E-4 | photoUrl 無で img なし（hue placeholder） | `density="comfy"`・`member.photoUrl` 省略 | `img` が render されない（Avatar が hue placeholder へ fallback） |

### lane F: ProfileHero render（AC-4/AC-5）

`ProfileHero` の `photoUrl?` prop を `<Avatar src>` まで渡す配線を検証する。`photoUrl` は ProfileHero の external prop。

| # | ケース | 入力（props） | 期待値 |
|---|--------|--------------|--------|
| F-1 | photoUrl 有で img src | `photoUrl="https://r2/p?s=x"` | render 結果に `img` が存在し `src` が photoUrl と一致 |
| F-2 | photoUrl 無で hue placeholder | `photoUrl` 省略 | `img` が render されない（hue placeholder へ fallback） |

### fail-soft 横断（AC-8）

| # | ケース | 検証 lane | 期待値 |
|---|--------|----------|--------|
| FS-1 | secret 未設定相当（resolver 未注入）で list が結果を返す | lane C-2 | items 返却・全 photoUrl undefined・throw 無し |
| FS-2 | secret 未設定相当（resolver 未注入）で profile が結果を返す | lane D-2 | profile 返却・photoUrl undefined・throw 無し |
| FS-3 | presign 失敗相当（resolver 空 Map / undefined）で 200 維持 | lane C-5 / D-4 | throw 無し・photoUrl undefined |

> route 層 resolver 内部の「R2 secret 未設定 → 空 Map / undefined」分岐は Phase 5 で実装し、use-case 視点では「resolver 未注入 / 空 Map / undefined」として上記 lane でカバーする。route resolver 自体の分岐網羅は Phase 6 で拡充する。

## ローカル実行コマンド（RED 確認）

すべて `mise exec` 経由で Node 24 を保証して実行する。

```bash
# lane A: shared schema
mise exec -- pnpm --filter @ubm-hyogo/shared test

# lane B/C/D: api（repository batch / list use-case / profile use-case）
mise exec -- pnpm --filter @ubm-hyogo/api test

# lane E/F: web（MemberCard / ProfileHero render）
mise exec -- pnpm --filter @ubm-hyogo/web test
```

> Phase 4 時点では対象シンボル（photoUrl field / `listMemberPhotosByIds` / resolver deps / Avatar src 配線）が未実装のため、上記コマンドは型エラーまたはアサーション失敗で **RED** になる。これが期待状態である。

## Props vs internal state の明記

- MemberCard の `photoUrl` は `member` オブジェクト経由の **external prop**。component 内 `useState` で保持しない。
- ProfileHero の `photoUrl` は **external prop**（`props.photoUrl?`）。
- Avatar の `imgFailed` のみが internal state（既存実装・本 task で変更しない）。テストは prop 入力 → render 出力のみ検証し、internal state を直接アサートしない。

## private/internal テスト方針

- `listMemberPhotosByIds` は export 済み public 関数として直接呼ぶ（lane B）。internal helper は新設しない。
- resolver（route 層で構築する `resolvePhotoUrls` / `resolvePhotoUrl`）は use-case の DI 境界でスタブ注入してテストする（lane C/D）。route 内部の private な bucket 名解決ロジックは Phase 6 の route 統合で間接検証する。
- shared schema は `parse` / `safeParse` の public API のみ使用（lane A）。

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | public member API contract / photoUrl 追加位置 |
| security | `.claude/skills/aiworkflow-requirements/references/security-*.md` | PII / consent 境界（公開 gate 後にのみ photoUrl 解決） |
| database | `.claude/skills/aiworkflow-requirements/references/database-*.md` | member_status（公開 gate）/ member_photos（object_key batch） |

- `index.md`（§2 AC-1..8）
- `phase-1.md`（命名規約 / 成果物インベントリ）
- `phase-2.md`（§2 契約・§1 データフロー・resolver DI）
- `phase-3.md`（AC カバレッジ表）
- `apps/api/src/routes/admin/members.ts:289-318`（`resolvePhotoUrl` 先例）

## 成果物

- Phase 4 テスト設計（本ファイル）
- 新規テストファイル: `apps/api/src/repository/__tests__/member-photos.batch.spec.ts`（lane B）
- 新規テストファイル: `apps/web/src/components/public/__tests__/MemberCard.spec.tsx`（lane E）
- 新規テストファイル: `apps/web/src/components/public/__tests__/ProfileHero.component.spec.tsx`（lane F）
- 既存テストへの追記ケース: lane A（shared）/ lane C（list use-case）/ lane D（profile use-case）

## 完了条件

- [ ] lane A の 7 ケース（A-1..A-7）が定義され `.strict()` 維持と url reject を検証する
- [ ] lane B の 5 ケース（B-1..B-5）が空配列・複数 id・未登録 id・プレースホルダ数・results undefined を検証する
- [ ] lane C の 5 ケース（C-1..C-5）が resolver 注入有無・部分返却・1 回呼び出し・空 Map fail-soft を検証する
- [ ] lane D の 4 ケース（D-1..D-4）が resolver 注入有無・gate 不通過の漏れ防止・undefined fail-soft を検証する
- [ ] lane E の 4 ケース（E-1..E-4）が comfy/dense/list の img src と photoUrl 無の hue placeholder を検証する
- [ ] lane F の 2 ケース（F-1/F-2）が img src と hue placeholder を検証する
- [ ] 全テストが `*.spec.{ts,tsx}` 命名である（invariant #8）
- [ ] 上記コマンドが Phase 4 時点で RED（未実装ゆえ失敗）になることが記録されている

## 統合テスト連携

Phase 5 実装が本 Phase の RED テストを GREEN へ遷移させる。Phase 6 が route resolver 内部分岐・回帰 guard を拡充する。Phase 7 が変更ブロックの line/branch カバレッジを実測する。Phase 11 が AC-3/4/5 の visual evidence を取得する。
