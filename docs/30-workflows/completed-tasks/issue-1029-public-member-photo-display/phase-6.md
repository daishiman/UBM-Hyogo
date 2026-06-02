# Phase 6: テスト拡充

> **[実装区分: 実装仕様書]**。本 Phase は Phase 4/5 の基本ケースに対し fail path・境界・回帰 guard を追加する。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation`
- 対象: route 層 resolver の内部分岐（Phase 4 では use-case 境界でスタブ化していた部分）/ schema の reject 境界 / pixel-diff ゼロ回帰の自動化前提
- テストファイル命名: `*.spec.{ts,tsx}` のみ（invariant #8）

## 目的

Phase 4 の happy path に対し、presign 失敗・空 member list・空文字 / 不正 url reject・gate 不通過の漏れ防止・route resolver 内部の R2 secret 分岐を fail path として追加し、AC-3/4/6/8 の境界を回帰 guard で固定する。

## 拡充テスト lane

| lane | 対象ファイル | 対象 AC |
|------|-------------|---------|
| G: route resolver 内部分岐 | `apps/api/src/routes/public/__tests__/members.spec.ts` / `member-profile.spec.ts`（既存に追記 / 無ければ新規） | AC-3/AC-6/AC-8 |
| H: schema reject 境界 | `packages/shared/src/zod/__tests__/viewmodel.spec.ts`（Phase 4 lane A に追記） | AC-2 |
| I: use-case fail path | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` / `get-public-member-profile.spec.ts`（Phase 4 lane C/D に追記） | AC-3/AC-4/AC-8 |
| J: UI 回帰 | `apps/web/src/components/public/__tests__/MemberCard.spec.tsx` / `ProfileHero.component.spec.tsx`（Phase 4 lane E/F に追記） | AC-5 |

## 拡充テストケース詳細

### lane G: route resolver 内部分岐（AC-3/AC-6/AC-8）

route handler で構築する resolver の R2 secret 分岐と bucket 名解決を検証する。`env` と `db` を fake で注入し、`presignMemberPhotoGetUrl` / `listMemberPhotosByIds` / `getMemberPhoto` をスタブする。

| # | ケース | 入力 | 期待値 |
|---|--------|------|--------|
| G-1 | R2 secret 未設定 → list resolver は空 Map | `env.R2_ACCESS_KEY_ID` 未設定 | resolver 戻り値 `size === 0`・`listMemberPhotosByIds` が呼ばれない |
| G-2 | R2 secret 未設定 → profile resolver は undefined | 同上 | resolver 戻り値 `undefined`・`getMemberPhoto` が呼ばれない |
| G-3 | `MEMBER_PHOTOS` binding 無し → bucketName null で空/undefined | secret 有・`MEMBER_PHOTOS` 未設定 | list 空 Map / profile undefined |
| G-4 | `ENVIRONMENT="production"` → prod bucket 名で presign | secret 有・`ENVIRONMENT="production"` | `presignMemberPhotoGetUrl` 引数 bucket === `"ubm-hyogo-member-photos-prod"` |
| G-5 | `ENVIRONMENT!=="production"` → staging bucket 名で presign | secret 有・`ENVIRONMENT="staging"` | bucket === `"ubm-hyogo-member-photos-staging"` |
| G-6 | presign が null → list は当該 member を Map に含めない | `presignMemberPhotoGetUrl` stub = null | resolver Map に当該 memberId が無い（`has === false`） |
| G-7 | presign が null → profile resolver は undefined | 同上 | resolver 戻り値 `undefined` |
| G-8 | list resolver は memberId 全件で 1 query batch | memberIds = 3 件 | `listMemberPhotosByIds` 呼び出し回数 === 1（N+1 無し） |
| G-9 | presigned URL 以外（bucket 名 / object key）が戻り値に露出しない | 全成功 | 戻り値 string が presigned URL のみ・object key 文字列を含まない |

### lane H: schema reject 境界（AC-2）

Phase 4 lane A の url reject に加え、空文字・誤形式を網羅する。

| # | ケース | 入力 | 期待値 |
|---|--------|------|--------|
| H-1 | photoUrl 空文字を reject | `photoUrl: ""` | `safeParse().success === false`（`z.string().url()` が空文字を url 不正と判定） |
| H-2 | photoUrl スキーム無しを reject | `photoUrl: "r2.example.com/key"` | `safeParse().success === false` |
| H-3 | photoUrl が number を reject | `photoUrl: 123`（型不正） | `safeParse().success === false` |
| H-4 | photoUrl が null を reject | `photoUrl: null` | `safeParse().success === false`（optional は undefined のみ許容・null は不可） |
| H-5 | profile: photoUrl 追加後も既存余分キーを reject | 既存フィールド + `photoUrl` + 余分キー | `safeParse().success === false`（`.strict()` 回帰 guard） |

### lane I: use-case fail path（AC-3/AC-4/AC-8）

| # | ケース | 入力 | 期待値 |
|---|--------|------|--------|
| I-1 | 空 member list で resolver を呼んでも throw しない | gate member = 0 件 | items === `[]`・resolver は空配列で呼ばれるか呼ばれない（実装に整合）・throw 無し |
| I-2 | resolver が reject（例外）でも use-case が伝播させず 200 維持 | `resolvePhotoUrls = async () => { throw new Error("presign down") }` | use-case が catch して photoUrl 無しで items 返却（fail-soft）。実装で try/catch を resolver 呼び出しに付けることを本ケースが要求する |
| I-3 | profile: resolver reject でも profile 自体は返る | `resolvePhotoUrl = async () => { throw new Error("down") }` | profile 返却・`photoUrl === undefined`・throw 無し |
| I-4 | gate 不通過 member は resolver を呼ばず 404 | gate 非通過 | resolver spy 0 回・404 経路（lane D-3 強化版） |

> I-2/I-3 は Phase 5 実装に対する追加要求である。route 層 resolver は内部で fail-soft（null/undefined/空 Map）を返すが、resolver が予期せず throw した場合でも list/profile を 200 で維持するため、use-case 側の resolver 呼び出しを try/catch で包む。

### lane J: UI 回帰（AC-5）

| # | ケース | 入力 | 期待値 |
|---|--------|------|--------|
| J-1 | photoUrl undefined の MemberCard は photoUrl 有り render と同一 DOM 構造（img 除く） | comfy / photoUrl 無 | hue placeholder 要素が render され `img` が無い（pixel-diff ゼロの DOM 前提） |
| J-2 | photoUrl undefined の ProfileHero は hue placeholder | photoUrl 無 | `img` 無し・hue placeholder 要素あり |
| J-3 | photoUrl 有 → onError で hue placeholder へ fallback（Avatar 既存） | Avatar の `img` に error イベント発火 | fallback で `img` が消え hue placeholder（Avatar internal state は直接アサートせず render 結果で確認） |

> pixel-diff ゼロ回帰（写真なし member）の最終確認は Phase 11 の visual evidence（screenshot 比較）で行う。lane J は DOM レベルの構造一致を保証する前段 guard。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web test
```

## 実行タスク

- lane G の 9 ケースで route resolver の R2 分岐・bucket 名・presign null・1 query batch を網羅する。
- lane H の 5 ケースで schema reject 境界を固定する。
- lane I の 4 ケースで use-case の fail-soft（resolver throw 含む）を保証する。
- lane J の 3 ケースで UI の hue placeholder 回帰を DOM レベルで guard する。

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | photoUrl 露出境界 |
| security | `.claude/skills/aiworkflow-requirements/references/security-*.md` | bucket 名 / object key 非露出（AC-6） |
| database | `.claude/skills/aiworkflow-requirements/references/database-*.md` | member_photos batch query |

- `index.md` / `phase-2.md`（§1.1/§1.2 resolver 順序）/ `phase-4.md`（lane A-F）/ `phase-5.md`（resolver 実装）
- `apps/api/src/routes/admin/members.ts:289-318`（resolver 分岐の先例）

## 成果物

- Phase 6 拡充テスト設計（本ファイル）
- lane G/H/I/J の追加テストケース（本実装サイクルで既存 / 新規 spec に追記）

## 完了条件

- [ ] lane G の 9 ケースが R2 secret 未設定 / binding 無し / prod・staging bucket 名 / presign null / 1 query batch / URL 以外非露出を検証する
- [ ] lane H の 5 ケースが空文字・スキーム無し・number・null・`.strict()` 回帰を reject する
- [ ] lane I の 4 ケースが空 list / resolver throw / profile resolver throw / gate 不通過の fail-soft を検証する
- [ ] lane J の 3 ケースが photoUrl 無の hue placeholder と onError fallback を DOM レベルで guard する
- [ ] 全拡充テストが PASS し既存 test を破壊しない
- [ ] 全テストが `*.spec.{ts,tsx}` 命名である（invariant #8）

## 統合テスト連携

lane G/I が AC-3/4/6/8 の fail path を固定し、Phase 9 の品質保証 grep gate と整合する。lane J が Phase 11 の pixel-diff ゼロ回帰の前段 DOM guard となる。Phase 7 が本 Phase で追加した分岐の branch カバレッジを実測する。
