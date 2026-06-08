# Phase 5: 実装（Lane-1 / 対策A: role-scoping・対策D: degrade）

> 前提: [phase-1.md](../phase-1/phase-1.md), [phase-2.md](../phase-2/phase-2.md)（§2.2 role-scoping / §2.5 degrade）, [phase-3.md](../phase-3/phase-3.md), [phase-4.md](../phase-4/phase-4.md)（RED テスト）。
> 本 phase は Phase 4 の RED テストを GREEN にする実装手順。**コード実装そのものは別工程**（本仕様書はコードを書かず手順を確定する）。NON_VISUAL。CONST_005 の必須項目（変更ファイル一覧・関数シグネチャ・入出力・副作用・テスト方針・実行コマンド・DoD）を全て記載する。

## 5.1 変更対象ファイル一覧

| パス | 変更種別 | 対策 | 概要 |
|------|----------|------|------|
| `scripts/smoke/mint-staging-bearers.mts` | **編集** | A, D | role モデル / `parseRoles` / `requiredEnvForRoles` / `findMissingEnv` / `mintStagingBearersForRoles` を追加。`main()` を role-scoping + degrade 対応へ改修。既存 `mintStagingBearers` は無改変で維持 |
| `.github/workflows/runtime-smoke-staging.yml` | **編集** | A, D | `bulk-tag-runtime-smoke` の mint step に `--roles admin` + `MINT_ROLES: 'admin'` + `RUNTIME_SMOKE_MINT_DEGRADE: '1'` を追加し、ME 系 secret 参照を含めない。`smoke` job は後方互換重視で**無改修**（既定 admin,me） |

> Lane-2（対策B: `verify-mint-env-contract.mts` / `.yml`）, Lane-3（対策C: `provision-staging-secrets.sh`）, doc（`scripts/smoke/README.md`）は本 lane の対象外（Phase 6-9 で扱う）。ただし `ROLE_REQUIRED_ENV` / `COMMON_REQUIRED_ENV` は対策B が import するため**本 lane で export 必須**（5.2.1）。

## 5.2 mint-staging-bearers.mts 実装指示

### 5.2.1 role モデル定数（phase-2 §2.2.1 逐語転記 → 実装指示）

`mintStagingBearers` の手前（import 群の直後）に追加。**両定数とも `export`**（対策B が単一の真実として import するため。export しないと契約の二重定義が発生）。

```ts
export type MintRole = "admin" | "me";

// 各 role が必要とする env 名の宣言的マップ（drift gate と共有する単一の真実）。
// 宣言順がそのまま requiredEnvForRoles の戻り順の基礎になる（admin → me）。
export const ROLE_REQUIRED_ENV: Record<MintRole, readonly string[]> = {
  admin: ["STAGING_ADMIN_MEMBER_ID", "STAGING_ADMIN_EMAIL"],
  me: ["STAGING_ME_MEMBER_ID", "STAGING_ME_EMAIL"],
};

// 全 role 共通の前提 env（署名鍵）。role に依らず常に必須。
export const COMMON_REQUIRED_ENV = ["STAGING_AUTH_SECRET"] as const;
```

> **export 必須の根拠**: AC-6/AC-7 の drift gate（対策B）が `ROLE_REQUIRED_ENV` / `COMMON_REQUIRED_ENV` を import して契約を算出する。本 lane で export しないと対策B が契約を再定義し二重定義になる（phase-2 §2.2.1 / §2.3.1 V-4）。

### 5.2.2 `parseRoles`（phase-2 §2.2.2 逐語転記 → 実装指示）

```ts
// pure・process.env 非参照。--roles 文字列を MintRole[] へ正規化する。
export function parseRoles(rawRoles: string | undefined): MintRole[];
```

実装手順:

1. `rawRoles` が `undefined` または trim 後 `""` → 既定 `["admin", "me"]` を返す（後方互換 / T-RS-01, T-RS-02）。
2. comma 区切りで分割し各要素を `trim()`。空要素は除去（T-RS-07）。
3. 各要素が `"admin"` / `"me"` 以外 → `throw new Error(\`unknown role: ${role}\`)`。**throw メッセージには当該 role 名のみ含め、入力全体・env 値を含めない**（T-RS-08, T-RS-09 / 不変条件 1）。
4. 重複排除（T-RS-06）。
5. **宣言順（admin → me）に正規化**して返す。実装は `ROLE_REQUIRED_ENV` のキー順（`["admin","me"]`）で `filter(r => requested.has(r))` する（T-RS-05 の `"me,admin"` → `["admin","me"]` を保証）。

### 5.2.3 `requiredEnvForRoles`（phase-2 §2.2.2 逐語転記 → 実装指示）

```ts
// pure。要求 role に対する必須 env 名一覧を返す。
export function requiredEnvForRoles(roles: MintRole[]): string[];
//   = COMMON_REQUIRED_ENV ∪ (各 role の ROLE_REQUIRED_ENV を flat)
```

実装手順:

1. 結果配列を `[...COMMON_REQUIRED_ENV]` で開始（`STAGING_AUTH_SECRET` を先頭固定）。
2. `roles` を宣言順（admin → me）に走査し、各 role の `ROLE_REQUIRED_ENV[role]` を順に push。
3. 重複除去（`COMMON_REQUIRED_ENV` は1件のみ・各 role env は重複しない想定だが念のため `[...new Set(...)]` で正規化 / T-RE-03）。
4. 戻り順は `["STAGING_AUTH_SECRET", "STAGING_ADMIN_MEMBER_ID", "STAGING_ADMIN_EMAIL", "STAGING_ME_MEMBER_ID", "STAGING_ME_EMAIL"]` の部分集合（Phase 4 §4.4 注と整合）。
5. `["admin"]` は ME 系を含まない / `["me"]` は ADMIN 系を含まない（T-RE-01, T-RE-02）。

### 5.2.4 `findMissingEnv`（phase-2 §2.2.2 逐語転記 → 実装指示）

```ts
// pure。env オブジェクトから不足 env 名を返す（値は読まず存在判定のみ）。
export function findMissingEnv(
  required: string[],
  env: Record<string, string | undefined>,
): string[];
```

実装手順:

1. `required` を順に走査し、`env[name]` が falsy（`undefined` / `""`）の name のみを抽出（T-FM-02, T-FM-03）。
2. **値の中身では分岐しない**。truthy であれば充足扱い（T-FM-04）。
3. 入力 `required` の順序を保持（T-FM-02 の `["B"]`）。

### 5.2.5 `mintStagingBearersForRoles`（phase-2 §2.2.2 逐語転記 → 実装指示）

```ts
export interface MintRoleResult {
  readonly adminBearer?: string;
  readonly meBearer?: string;
  readonly memberId?: string; // admin role 含有時のみ（既存 STAGING_MEMBER_ID 互換）
}

export async function mintStagingBearersForRoles(
  roles: MintRole[],
  env: {
    authSecret: string;
    adminMemberId?: string;
    adminEmail?: string;
    meMemberId?: string;
    meEmail?: string;
    ttlSeconds?: number;
  },
): Promise<MintRoleResult>;
```

実装手順:

1. `ttlSeconds = env.ttlSeconds ?? DEFAULT_TTL_SECONDS`。
2. 結果を蓄積する `let adminBearer / meBearer / memberId`（初期 undefined）。
3. `roles.includes("admin")` の場合:
   - `signSessionJwt(env.authSecret, { memberId: env.adminMemberId as MemberId, email: env.adminEmail!, isAdmin: true, ttlSeconds })` で `adminBearer` を mint。
   - `memberId = env.adminMemberId`（T-MR-01, T-MR-04）。
   - self-verify: `verifySessionJwt(adminBearer, env.authSecret)` の `memberId === env.adminMemberId` かつ `isAdmin === true` を確認。不一致は `throw new Error("minted admin bearer self verification failed")`（既存ガード踏襲 / T-MR-02）。
4. `roles.includes("me")` の場合:
   - `signSessionJwt(env.authSecret, { memberId: env.meMemberId as MemberId, email: env.meEmail!, isAdmin: false, ttlSeconds })` で `meBearer` を mint。
   - self-verify: `verifySessionJwt(meBearer, env.authSecret)` の `memberId === env.meMemberId` かつ `isAdmin === false` を確認。不一致は `throw new Error("minted me bearer self verification failed")`。
5. **mint した role の bearer のみ** self-verify する（admin 不在なら admin verify しない / phase-2 §2.2.2 注）。
6. `return { adminBearer, meBearer, memberId }`（含まれない role のキーは undefined のまま / T-MR-03, T-MR-05）。

> **既存 `mintStagingBearers` との関係**: `mintStagingBearers`（両 role 固定）は**無改変で維持**（AC-12 / T-A1〜T-A8）。`mintStagingBearersForRoles(["admin","me"], ...)` は同等の bearer を産出するが、既存関数は別経路として残す（後方互換・既存 spec 保護）。重複ロジックの集約は Phase 8（リファクタ lane）で判断し、本 lane では既存関数に触れない。

### 5.2.6 `main()` フロー改修（phase-2 §2.2.3 の6ステップを実装手順化）

既存 `main()`（現行 L59-98）を以下に置換する。

```
1. rawRoles の解決（CLI 優先）:
   a. argv から --roles を取得:
      - "--roles" の次トークン（args[i] === "--roles" → args[i+1]）
      - "--roles=<v>" 形式（args[i].startsWith("--roles=") → slice 後）
   b. CLI 指定が無ければ process.env.MINT_ROLES
   c. どちらも無ければ undefined（parseRoles 側で既定 admin,me）
   d. roles = parseRoles(rawRoles)   // 未知 role は throw → catch せず exit code 非0（後述 5.2.7）

2. required = requiredEnvForRoles(roles)

3. missing = findMissingEnv(required, process.env)

4. if (missing.length > 0):
     degrade = process.env.RUNTIME_SMOKE_MINT_DEGRADE === "1"   // 厳密一致（"0"/"true" は false / T-CLI-12）
     if (degrade):
       process.stderr.write(`mint-staging-bearers: degraded (missing env: ${missing.join(", ")}); skipping mint\n`)
       // env 名のみ・値は出さない（不変条件 1）
       const out = process.env.GITHUB_OUTPUT
       if (out) appendFileSync(out, "mint_degraded=1\n")
       process.exit(0)        // ← 対策D: staging では fail させない（AC-10）
     else:
       process.stderr.write(`mint-staging-bearers: missing env: ${missing.join(", ")}\n`)  // 既存メッセージ維持（AC-4）
       process.exit(2)        // hard-fail 維持（AC-11 / T-CLI-07, T-CLI-10）

5. ttlSeconds の解決（既存ロジック維持）:
   const ttlSeconds = process.env.MINT_TTL_SECONDS ? Number(process.env.MINT_TTL_SECONDS) : DEFAULT_TTL_SECONDS

6. minted = await mintStagingBearersForRoles(roles, {
     authSecret: process.env.STAGING_AUTH_SECRET!,
     adminMemberId: process.env.STAGING_ADMIN_MEMBER_ID,
     adminEmail: process.env.STAGING_ADMIN_EMAIL,
     meMemberId: process.env.STAGING_ME_MEMBER_ID,
     meEmail: process.env.STAGING_ME_EMAIL,
     ttlSeconds,
   })

7. GITHUB_OUTPUT へ存在する role の bearer のみ追記:
   const out = process.env.GITHUB_OUTPUT
   if (out):
     if (minted.adminBearer !== undefined) appendFileSync(out, `admin_bearer=${minted.adminBearer}\n`)
     if (minted.memberId !== undefined)    appendFileSync(out, `member_id=${minted.memberId}\n`)
     if (minted.meBearer !== undefined)     appendFileSync(out, `me_bearer=${minted.meBearer}\n`)
   else:
     process.stderr.write("mint-staging-bearers: GITHUB_OUTPUT is not set; nothing written\n")
```

> **`--roles` / `MINT_ROLES` 優先順位**: CLI `--roles`（または `--roles=`）> env `MINT_ROLES` > 既定 `admin,me`（T-CLI-04 が CLI 優先を固定）。
> **argv 解析の起点**: `process.argv.slice(2)` を走査（`argv[0]=node` / `argv[1]=script` を除外）。

### 5.2.7 未知 role 時の挙動

- `parseRoles` が throw すると `main()` 内の未捕捉例外として Node がデフォルト exit code 1 で終了する。本仕様では未知 role はワークフローからは渡らない（gate が事前検出）ため、追加の catch は設けない。Phase 4 の T-RS-08/09 は pure 関数 `parseRoles` を直接 import して throw を assert する（CLI 経由の exit code は本 lane では assert 対象外）。

## 5.3 入力・出力・副作用

| 区分 | 内容 |
|------|------|
| 入力 | `process.env`（`STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL` / `MINT_ROLES` / `RUNTIME_SMOKE_MINT_DEGRADE` / `MINT_TTL_SECONDS` / `GITHUB_OUTPUT`） + `process.argv`（`--roles` / `--roles=`） |
| 出力 | `GITHUB_OUTPUT` ファイルへの key=value 追記。通常時=存在 role 分の `admin_bearer` / `member_id` / `me_bearer`。degrade 時=`mint_degraded=1` のみ |
| 副作用 | stderr への診断メッセージ（**env 名のみ**。JWT・secret 値・env 値は一切出さない / 不変条件 1）。`process.exit(0|2|1)` |
| 非露出保証 | JWT 文字列・secret 値を stdout / console / stderr / エラーメッセージに出さない。missing / degrade メッセージは env 名のみ（T-CLI-08 が能動検証） |

## 5.4 degrade 実装（phase-2 §2.5）

| 項目 | 実装 |
|------|------|
| トリガ | `process.env.RUNTIME_SMOKE_MINT_DEGRADE === "1"`（厳密一致。`"0"` / `"true"` / 未設定は非 degrade / T-CLI-12） |
| 発火条件 | 必須 env が1件以上欠落しているとき**のみ**（env 充足時は degrade フラグがあっても通常 mint / T-CLI-11） |
| 挙動 | stderr に `degraded (missing env: <names>); skipping mint`（env 名のみ）→ `GITHUB_OUTPUT` へ `mint_degraded=1` → `exit 0` |
| production 非適用 | production workflow は `RUNTIME_SMOKE_MINT_DEGRADE` を設定しない → 未設定なので hard-fail（exit 2）維持（AC-11） |

## 5.5 workflow yml 差分（phase-2 §2.2.5）

### 5.5.1 `bulk-tag-runtime-smoke` job の mint step（編集）

現行（runtime-smoke-staging.yml L155-168）の "mint staging admin bearer" step を以下へ変更:

```yaml
      - name: mint staging admin bearer
        if: env.STAGING_AUTH_SECRET != ''
        env:
          STAGING_AUTH_SECRET: ${{ secrets.STAGING_AUTH_SECRET }}
          STAGING_ADMIN_MEMBER_ID: ${{ secrets.STAGING_ADMIN_MEMBER_ID }}
          STAGING_ADMIN_EMAIL: ${{ secrets.STAGING_ADMIN_EMAIL }}
          MINT_ROLES: 'admin'                      # ← 追加（admin only）
          RUNTIME_SMOKE_MINT_DEGRADE: '1'          # ← 追加（D: staging degrade）
          MINT_TTL_SECONDS: '600'
        run: |
          mint_out="$(mktemp)"
          GITHUB_OUTPUT="$mint_out" pnpm exec tsx scripts/smoke/mint-staging-bearers.mts --roles admin
          admin="$(grep '^admin_bearer=' "$mint_out" | tail -n1 | cut -d= -f2-)"
          rm -f "$mint_out"
          echo "::add-mask::$admin"
          echo "STAGING_ADMIN_BEARER=$admin" >> "$GITHUB_ENV"
```

変更点:

| 行 | 変更 | 理由 |
|----|------|------|
| `env:` ブロック | `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL` を**含めない**（現行でも未記載のため追加しない） | admin-only job に ME secret 不要（RC-2 解消 / AC-5） |
| `MINT_ROLES: 'admin'` 追加 | env 経路でも admin only を明示 | gate（対策B）の `MINT_ROLES` 読取と整合 |
| `RUNTIME_SMOKE_MINT_DEGRADE: '1'` 追加 | secret 未配備過渡期に CI を止めない | 対策D / AC-10 |
| `run` の mint 呼び出しに `--roles admin` 付与 | CLI 経路でも admin only（CLI 優先） | AC-5 / T-CLI-01 |

> degrade 時は `admin_bearer=` が出力されず `STAGING_ADMIN_BEARER` が空になる。後続 "verify required staging secrets" step が空を検出して fail する可能性があるが、本 lane では mint step の挙動確定までを対象とする。degrade 時の後続 fallback / skip 配線は Lane-3（対策C/QA）と協調して Phase 9 で最終調整する（degrade marker `mint_degraded=1` の workflow 側消費は phase-2 §2.5「workflow 側」記載の通り後続 step の `if` で扱う設計）。

### 5.5.2 `smoke` job の方針（後方互換重視で無改修を推奨）

| 選択肢 | 決定 |
|--------|------|
| **(採用) 無改修** | `smoke` job の mint step は両 role（admin + me）が必要。`--roles` / `MINT_ROLES` 無指定で `parseRoles(undefined) = ["admin","me"]` となり現行と完全同一動作（AC-12 / T-CLI-05）。差分 0 でリスク最小 |
| (不採用) 明示 `--roles admin,me` 付与 | 動作は同一だが、gate の「明示性」要求が strict mode で無い限り不要。差分を増やすと回帰面が広がる |

> **決定: `smoke` job は無改修**。既定挙動が現行と同一であることをテスト T-CLI-05 / T-CLI-06 が保証する。gate（対策B）は `--roles` 無指定 step を既定 admin,me として算出するため、無改修でも drift 判定は整合する（phase-3 §3.2 リスク緩和済み）。

## 5.6 テスト方針（Phase 4 を GREEN に）

| 対象 | 方針 |
|------|------|
| pure 関数 | Phase 4 §4.4 の T-RS / T-RE / T-FM / T-MR が直接 import で GREEN |
| CLI | Phase 4 §4.5 の T-CLI-01〜12 が `execFileSync` 経由で GREEN |
| 回帰 | 既存 T-A1〜T-A8 + `mint-staging-bearers-self-verify.spec.ts` が無改変で GREEN（AC-12） |
| actionlint | `runtime-smoke-staging.yml` の編集が actionlint を通過（YAML 構文・式構文） |

## 5.7 ローカル実行・検証コマンド

```bash
# Phase 4 テスト（pure + CLI）GREEN 確認
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts

# 型チェック（新規 export 型 MintRole / MintRoleResult 含む）
pnpm typecheck

# lint
pnpm lint

# workflow 静的検証（bulk-tag step 編集後の YAML / 式構文）
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml
```

## 5.8 DoD（完了条件）

- [ ] `scripts/smoke/mint-staging-bearers.mts` に `MintRole` / `ROLE_REQUIRED_ENV`（export）/ `COMMON_REQUIRED_ENV`（export）/ `parseRoles` / `requiredEnvForRoles` / `findMissingEnv` / `MintRoleResult` / `mintStagingBearersForRoles` を追加。既存 `mintStagingBearers` は無改変
- [ ] `main()` を role-scoping（CLI `--roles` > env `MINT_ROLES` > 既定 admin,me）+ degrade 対応へ改修。存在 role の bearer のみ GITHUB_OUTPUT へ追記
- [ ] `.github/workflows/runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke` mint step に `MINT_ROLES: 'admin'` + `RUNTIME_SMOKE_MINT_DEGRADE: '1'` + `--roles admin` を追加。ME 系 secret 参照を含めない。`smoke` job は無改修
- [ ] `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` 全 PASS
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml` PASS
- [ ] AC-1〜AC-5, AC-10〜AC-12 充足（AC-1=T-CLI-01/02/03, AC-2=T-CLI-05/06, AC-3=T-CLI-01, AC-4=T-CLI-07/08, AC-5=bulk-tag step 差分+actionlint, AC-10=T-CLI-09, AC-11=T-CLI-10/12, AC-12=T-A1〜T-A8+T-CLI-05）
- [ ] `bulk-tag-runtime-smoke` job が ME 系 env なしで mint 成功（RC-1/RC-2 回帰防止 / CI 失敗の根本解消）
- [ ] JWT・secret 値・env 値を stdout/stderr/log に露出しない（不変条件 1。T-CLI-08 で能動確認）

## 5.9 不変条件（実装時・既存維持）

1. JWT 文字列・secret 値を console/stdout/log/エラーメッセージに出さない（env 名のみ）。
2. `GITHUB_OUTPUT` への key=value 追記のみ（mask は呼び出し元 workflow が適用）。
3. `process.env` を直接読むのは `main()` のみ。pure 関数（`parseRoles` / `requiredEnvForRoles` / `findMissingEnv` / `mintStagingBearersForRoles`）は引数で env を受け取る。
4. 本タスクは CI/script のみ。`apps/*` のランタイムコードは変更しない（CLAUDE.md 不変条件 #5）。
5. 既存 `mintStagingBearers` と既存テスト T-A1〜T-A8 を無改変で維持（AC-12）。
