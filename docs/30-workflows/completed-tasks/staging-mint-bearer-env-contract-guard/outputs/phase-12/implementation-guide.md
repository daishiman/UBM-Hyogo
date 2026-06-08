# 実装ガイド — staging-mint-bearer-env-contract-guard

> 本サイクルは **implemented_local_evidence_captured**（実装仕様書の作成 + 実コード反映 + local evidence 完了）。NON_VISUAL（CI workflow / Node script / shell のみ・UI 変更なし）。

## Part 1: 実装者向けナビ（専門用語なしの説明）

### なぜ必要か（背景）

たとえば、合鍵屋さんを想像してください。お客さんが「管理人室の鍵（admin）だけ作って」と頼んでいるのに、合鍵屋さんが「うちは管理人室の鍵と自分の部屋の鍵（me）の両方の型が揃わないと、一本も作れません」と突っぱねてしまう。お客さんは自分の部屋の鍵なんて頼んでいないのに、その型（材料）が無いというだけで作業全体が止まってしまいます。

いまの CI で起きていたのはこれと同じことです。`bulk-tag-runtime-smoke` という作業（job）は「管理人の鍵（admin の bearer）」だけが必要なのに、鍵を作る道具（`mint-staging-bearers.mts`）が「admin と me の材料（env）が両方そろわないと作らない」という頑固な作り方になっていました。その結果、自分の部屋の鍵の材料（`STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL`）が無いというだけで、毎回 `missing env` というエラーで作業が止まり、CI 全体が赤くなっていました。

しかも厄介なのは、この食い違い（材料の頼み方と作り方のズレ）が、コードを直す段階（PR）では誰にも見つからず、本番の CI が走って初めて発覚することでした。直すたびにまた別の作業で同じズレが起きる、という悪循環があったのです。

### 何をするか（対策）

この悪循環を断つため、4 つの手当てをします。

1. **対策 A（役割ごとに材料を分ける）**: 鍵屋さんに「`--roles admin` と言われたら管理人の鍵だけ作る」「`--roles me` なら自分の部屋の鍵だけ」「何も言わなければ両方（いまと同じ）」と教えます。これで admin だけ頼んだ作業は、me の材料が無くても止まりません。
2. **対策 B（ズレを早期発見する見張り番）**: 新しい見張り番（`verify-mint-env-contract` という gate）を置きます。これは「各作業が頼んでいる材料」と「鍵屋さんがその役割で必要とする材料」と「材料倉庫（provision script）に実際にある材料」がきちんと一致しているかを、PR の時点で照合します。ズレていればその場で赤信号を出すので、本番まで気付かないことがなくなります。
3. **対策 C（倉庫の中身をそろえる）**: 材料倉庫（`provision-staging-secrets.sh`）の在庫リストを、いま実際に必要な材料（JWT を作るための env 一式）に合わせて更新します。古い在庫（静的 bearer）は「予備」として、はっきり分けて残します。
4. **対策 D（材料が足りなくても staging では止めない＝degrade）**: staging（練習用の環境）に限って、材料が一時的に足りないときは作業を強制停止する代わりに「警告だけ出して、その作業はそっと飛ばす」ようにします。これは練習用だから許される緩和で、本番（production）では今まで通りきっちり止めます。

なぜこの順番かというと、A（根本の作り方を直す）が無いと B/C/D は意味がなく、B（見張り番）が再発防止の本体だからです。

### 変更ファイル一覧

| 区分 | パス | 何をするか |
| ---- | ---- | ---------- |
| EDIT | `scripts/smoke/mint-staging-bearers.mts` | 役割ごとに材料を分ける仕組み（対策 A）と、材料不足時に止めない degrade（対策 D）を追加 |
| NEW | `scripts/smoke/verify-mint-env-contract.mts` | ズレを見つける見張り番スクリプト（対策 B） |
| EDIT | `.github/workflows/runtime-smoke-staging.yml` | `bulk-tag-runtime-smoke` 作業を「admin だけ」に配線（対策 A）+ degrade 連携（対策 D） |
| NEW | `.github/workflows/verify-mint-env-contract.yml` | 見張り番を PR / push で自動実行する CI（対策 B） |
| EDIT | `scripts/smoke/provision-staging-secrets.sh` | 倉庫の在庫リストを最新の必要材料に更新（対策 C） |
| EDIT | `scripts/smoke/README.md` | 上記の使い方を文書化 |
| EDIT | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | 役割分けと degrade のテストを追加 |
| NEW | `scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | 見張り番のテスト（新規） |

### 実行コマンド（実装 wave で GREEN 化する順）

```bash
# 1) 型チェック（新しい型・関数を最初に通す）
mise exec -- pnpm typecheck
# 2) lint
mise exec -- pnpm lint
# 3) 役割分け + degrade + 見張り番のテスト
mise exec -- pnpm exec vitest run \
  scripts/smoke/__tests__/mint-staging-bearers.spec.ts \
  scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts \
  scripts/smoke/__tests__/verify-mint-env-contract.spec.ts
# 4) 倉庫スクリプトの構文・lint（副作用なし）
bash -n scripts/smoke/provision-staging-secrets.sh
shellcheck scripts/smoke/provision-staging-secrets.sh
# 5) CI workflow の構文チェック
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 \
  .github/workflows/runtime-smoke-staging.yml \
  .github/workflows/verify-mint-env-contract.yml
```

### 既知の制限

- `STAGING_AUTH_SECRET` などの実 secret は user が 1Password へ整備する前提。実 staging deploy・実 secret 投入・required status check への gate 登録はすべて user-gated（コード実装は本サイクルで完了）。
- degrade（対策 D）は staging の過渡期の安全網です。secret 整備が完了したら撤去して staging も hard-fail に戻す運用判断が将来発生しえます（恒久 degrade を既定化しない）。
- 倉庫スクリプトの 1Password item（`op://...`）の実在は user の前提。仕様書には参照キーのみ書き、実値は書きません（CLAUDE.md シークレット管理）。

## Part 2: 実装詳細（技術者向け）

### 背景

`mint-staging-bearers.mts` の現行 `main()` は role に関わらず常に 5 env（`STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL`）を必須化していた（RC-1）。`bulk-tag-runtime-smoke` job は admin bearer のみ必要で ME 系 env を渡さない（RC-2）ため、admin-only job が原理的に `exit 2` する。さらに `provision-staging-secrets.sh` は旧 static-bearer 集合を provision し JWT-mint 集合を provision しない drift があった（RC-3）。本タスクは role-scoping（A）・drift gate（B）・provision 整合（C）・degrade（D）でこれを解消する。

### 型・シグネチャ（phase-2 §2.2 / phase-5 §5.2 から逐語転記）

#### role モデル定数（`mint-staging-bearers.mts`・両定数とも `export` 必須）

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

> `export` 必須の根拠: 対策 B（drift gate）が `ROLE_REQUIRED_ENV` / `COMMON_REQUIRED_ENV` を import して契約を算出する。export しないと契約が二重定義になる（phase-2 §2.2.1 / §2.3.1 V-4）。

#### pure 関数群（`process.env` 非参照・引数注入で test 可能化）

```ts
// --roles 文字列を MintRole[] へ正規化する。
//   undefined / "" → ["admin", "me"]（既定 = 後方互換）
//   "admin" → ["admin"] / "me" → ["me"]
//   "admin,me" / "me,admin" → 重複排除し宣言順 ["admin","me"]
//   未知 role（"foo"）→ throw new Error("unknown role: foo")（role 名のみ・secret 非露出）
export function parseRoles(rawRoles: string | undefined): MintRole[];

// 要求 role に対する必須 env 名一覧を返す（= COMMON_REQUIRED_ENV ∪ 各 role の ROLE_REQUIRED_ENV を flat）。
// 戻り順は ["STAGING_AUTH_SECRET", "STAGING_ADMIN_MEMBER_ID", "STAGING_ADMIN_EMAIL",
//           "STAGING_ME_MEMBER_ID", "STAGING_ME_EMAIL"] の部分集合。
export function requiredEnvForRoles(roles: MintRole[]): string[];

// env オブジェクトから不足 env 名を返す（値は読まず存在判定のみ。falsy = undefined / "" を不足扱い）。
export function findMissingEnv(
  required: string[],
  env: Record<string, string | undefined>,
): string[];
```

#### role-scoped mint wrapper

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
//   roles に "admin" 含む → adminBearer + memberId を mint（self-verify: memberId 一致 + isAdmin===true）
//   roles に "me" 含む    → meBearer を mint（self-verify: memberId 一致 + isAdmin===false）
//   mint した role の bearer のみ self-verify する（不在 role は verify しない）
```

> 既存 `mintStagingBearers(env)`（両 role 固定）は**無改変で維持**（AC-12）。重複ロジックの集約は Phase 8（refactor lane）で判断し、本 lane では既存関数に触れない。

#### drift gate の型（`verify-mint-env-contract.mts`・phase-2 §2.3.2 逐語転記）

```ts
// 解析対象 step を表す中間表現（pure 関数が受け取る）
export interface MintStepDescriptor {
  readonly jobId: string;
  readonly stepName: string;
  readonly roles: MintRole[];        // --roles / MINT_ROLES から解決済み（既定 admin,me）
  readonly providedEnv: string[];    // step env: ブロックのキー名
  readonly degrade: boolean;         // RUNTIME_SMOKE_MINT_DEGRADE === '1'
}

export interface ContractViolation {
  readonly jobId: string;
  readonly stepName: string;
  readonly kind: "missing_env" | "excess_env" | "provision_gap";
  readonly names: string[];          // 値ではなく env 名のみ
  readonly severity: "error" | "warn";
}

// pure: step 記述子群 + provision カバー集合 → 違反一覧
export function detectContractViolations(input: {
  readonly steps: MintStepDescriptor[];
  readonly provisionedSecrets: string[];
  readonly strict?: boolean;
}): ContractViolation[];
```

> gate は mint script から `ROLE_REQUIRED_ENV` / `COMMON_REQUIRED_ENV` を import し、`requiredEnvForRoles(step.roles)` を満たさない step を `missing_env`（severity=error）、role 不要な env を渡す step を `excess_env`（warn）、provision カバー集合が全 role 必須 env を含まなければ `provision_gap`（error）として返す（V-1 / V-2 / V-3）。`RUNTIME_SMOKE_MINT_DEGRADE=1` は runtime fallback であり、静的契約欠落を免除しない。error が 1 件以上で main は exit 1、warn のみなら exit 0。

### `main()` フロー（phase-5 §5.2.6・6 ステップ）

```text
1. rawRoles = CLI --roles（--roles <v> または --roles=<v>）> env MINT_ROLES > undefined
   roles = parseRoles(rawRoles)
2. required = requiredEnvForRoles(roles)
3. missing  = findMissingEnv(required, process.env)
4. if (missing.length > 0):
     degrade = process.env.RUNTIME_SMOKE_MINT_DEGRADE === "1"   // 厳密一致（"0"/"true"/未設定は false）
     if (degrade):
       stderr "mint-staging-bearers: degraded (missing env: <names>); skipping mint"  // env 名のみ
       GITHUB_OUTPUT へ "mint_degraded=1"
       exit 0   // ← 対策 D: staging では fail させない（AC-10）
     else:
       stderr "mint-staging-bearers: missing env: <names>"   // 既存メッセージ維持（AC-4）
       exit 2   // hard-fail 維持（AC-11）
5. ttlSeconds = process.env.MINT_TTL_SECONDS ? Number(...) : DEFAULT_TTL_SECONDS
6. minted = await mintStagingBearersForRoles(roles, {...process.env 由来...})
   GITHUB_OUTPUT へ存在する role の bearer のみ追記:
     admin 含む → admin_bearer / member_id
     me 含む    → me_bearer
```

> 優先順位は CLI `--roles` > env `MINT_ROLES` > 既定 `admin,me`。`process.argv.slice(2)` を起点に走査する。

### 使用例

```bash
# admin のみ（bulk-tag-runtime-smoke job が使う形）。ME 系 env 未設定でも exit 0。
GITHUB_OUTPUT=out.txt pnpm exec tsx scripts/smoke/mint-staging-bearers.mts --roles admin
#   → out.txt に admin_bearer=... / member_id=... のみ（me_bearer は書かれない）

# 既定（両 role）。smoke job は無改修でこの動作（後方互換 AC-12）。
GITHUB_OUTPUT=out.txt pnpm exec tsx scripts/smoke/mint-staging-bearers.mts
#   → admin_bearer / member_id / me_bearer の 3 行

# env 経由での role 指定（workflow から簡潔に渡す形）
MINT_ROLES=me GITHUB_OUTPUT=out.txt pnpm exec tsx scripts/smoke/mint-staging-bearers.mts
#   → me_bearer のみ

# 必須 env 不足 + degrade（staging 過渡期）
RUNTIME_SMOKE_MINT_DEGRADE=1 pnpm exec tsx scripts/smoke/mint-staging-bearers.mts --roles admin
#   → STAGING_ADMIN_MEMBER_ID 等が無ければ stderr に degraded 警告 + GITHUB_OUTPUT に mint_degraded=1・exit 0

# drift gate（PR で自動実行される静的検査）
pnpm exec tsx scripts/smoke/verify-mint-env-contract.mts
#   → drift があれば exit 1（missing_env / provision_gap）、無ければ exit 0
```

### workflow 差分（phase-5 §5.5.1 + phase-9 §9.1.3）

`bulk-tag-runtime-smoke` job の mint step に `MINT_ROLES: 'admin'` + `RUNTIME_SMOKE_MINT_DEGRADE: '1'` + `--roles admin` を追加し、ME 系 secret 参照を含めない。degrade marker 伝播は phase-9 D-1〜D-4 で確定:

```bash
        run: |
          mint_out="$(mktemp)"
          GITHUB_OUTPUT="$mint_out" pnpm exec tsx scripts/smoke/mint-staging-bearers.mts --roles admin
          if grep -q '^mint_degraded=1$' "$mint_out"; then
            rm -f "$mint_out"
            echo "::notice::mint degraded (missing env); bulk-tag runtime smoke will be skipped"
            echo "RUNTIME_SMOKE_MINT_DEGRADED=1" >> "$GITHUB_ENV"
          else
            admin="$(grep '^admin_bearer=' "$mint_out" | tail -n1 | cut -d= -f2-)"
            rm -f "$mint_out"
            echo "::add-mask::$admin"
            echo "STAGING_ADMIN_BEARER=$admin" >> "$GITHUB_ENV"
          fi
```

- 後続 `verify required staging secrets` / `mask staging credentials` / `run bulk tag runtime smoke` step に `if: env.RUNTIME_SMOKE_MINT_DEGRADED != '1'`（degrade 時 skip / D-2〜D-4）。
- `smoke` job は無改修（既定 `admin,me` で現行と完全同一動作・AC-12）。
- `verify-mint-env-contract.yml` は `verify-hook-integrity.yml` 構造を踏襲し `on.pull_request.paths`（mint / gate / provision / runtime-smoke-staging）+ `push: [dev, main]` で `pnpm exec tsx scripts/smoke/verify-mint-env-contract.mts` を実行（AC-8）。

### provision 整合（対策 C・phase-2 §2.4 / phase-8）

`provision-staging-secrets.sh` の `SECRETS` を JWT-mint 集合（`STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL`）へ整合し、旧 static-bearer（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID`）は runtime fallback として受け付けるが、この script の provision 対象からは明示分離する。各エントリは `"NAME:op://Vault/Item/Field"` 形式（実値非記載）。gate V-3 が「全 role 必須 env が SECRETS に含まれる」ことを検証し、provision 実行後の inventory 検証は「`SECRETS` 必須集合が live environment に含まれる」ことを確認する（AC-7 / AC-9）。

### 設定値一覧（env / 定数）

| 名前 | 種別 | 既定 | 用途 |
| ---- | ---- | ---- | ---- |
| `MINT_ROLES` | env（入力） | 未設定（= `admin,me`） | role 指定の env 経路。CLI `--roles` が優先 |
| `RUNTIME_SMOKE_MINT_DEGRADE` | env（入力フラグ） | 未設定（= 非 degrade） | `"1"` 厳密一致で degrade 発火許可（staging 限定）。production は未設定 |
| `RUNTIME_SMOKE_MINT_DEGRADED` | env（marker 結果） | — | mint step が degrade 発火時に `GITHUB_ENV` へ書く。後続 step の skip 判定に使う（入力フラグと名前を分離） |
| `MINT_TTL_SECONDS` | env | `DEFAULT_TTL_SECONDS`（既存値） | JWT の TTL 秒数 |
| `GITHUB_OUTPUT` | env | — | bearer / `mint_degraded=1` の追記先ファイル |
| `STAGING_AUTH_SECRET` | env（必須・共通） | — | `COMMON_REQUIRED_ENV`。HS256 署名鍵 |
| `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` | env（admin role） | — | `ROLE_REQUIRED_ENV.admin` |
| `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL` | env（me role） | — | `ROLE_REQUIRED_ENV.me` |

### エラーハンドリングとエッジケース

- 未知 role（`--roles foo`）→ `parseRoles` が `throw new Error("unknown role: foo")`。`main()` が捕捉して `mint-staging-bearers: unknown role: foo` を stderr へ出し、exit 2（env 値・secret 非露出）。
- 必須 env 不足 + `RUNTIME_SMOKE_MINT_DEGRADE != "1"` → `missing env: <names>`（env 名のみ）+ exit 2（AC-4 / AC-11）。
- 必須 env 不足 + degrade → `mint_degraded=1` + exit 0、bearer は書かない。後続 step は `if` で skip（AC-10）。
- env 充足時は degrade フラグがあっても通常 mint（degrade 発火は不足時のみ）。
- self-verify 失敗（mint した bearer の `memberId` / `isAdmin` 不一致）→ `throw new Error("minted <role> bearer self verification failed")`。
- 非露出保証: JWT 文字列・secret 値・env 値を stdout / console / stderr / エラーメッセージに一切出さない。出力は env 名のみ（不変条件 #1）。

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。本タスクは CLI / CI workflow / shell のみでレンダリングされる画面を持たず、視覚的回帰の対象が存在しない（screenshots / `.gitkeep` も作らない）。代替証跡は以下を参照する:

- `outputs/phase-11/manual-test-result.md`（NON_VISUAL 証跡メタ・AC-1〜AC-12 の実施チェックリスト・PASS結果）
- `outputs/phase-10/phase-10.md`（最終レビュー・AC 判定・MINOR / 残課題候補）

実装サイクルで生成予定の証跡ファイル（`outputs/phase-11/evidence/mint-role-scope-test.log`・`verify-mint-env-contract-actionlint.log`）は本サイクルでは未生成（`pending`）。実装後に tracked file として配置し inventory を昇格する。
