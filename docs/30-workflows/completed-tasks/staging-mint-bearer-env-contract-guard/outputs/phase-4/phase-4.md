# Phase 4: テスト作成（Lane-1 / 対策A・対策D）

> 前提: [phase-1.md](../phase-1/phase-1.md), [phase-2.md](../phase-2/phase-2.md)（特に §2.2 role-scoping / §2.5 degrade）, [phase-3.md](../phase-3/phase-3.md)。
> 本 phase は **TDD RED** フェーズ。対策A（mint role-scoping）と対策D（degrade）の振る舞いを、まだ実装の無い関数・CLI 挙動に対する失敗テストとして先に書き下す。実装は Phase 5。
> NON_VISUAL タスク。コード実装そのものは行わず、テストファイルの追加内容（ケース表・方針）を確定する。

## 4.1 対象テストファイル

| パス | 変更種別 | 役割 |
|------|----------|------|
| `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | **編集**（ケース追加） | pure 関数（`parseRoles`/`requiredEnvForRoles`/`findMissingEnv`/`mintStagingBearersForRoles`）の単体テスト + CLI（`--roles` / degrade）の E2E テスト |

> 既存ケース T-A1〜T-A8 は削除・改変しない（AC-12 後方互換）。**追記のみ**。

## 4.2 RED 観点（なぜ今このテストが失敗するか）

| 観点 | 現状（Phase 5 前） | RED で確認したい挙動 |
|------|--------------------|----------------------|
| `parseRoles` 未実装 | export が存在しない | import 時点で型エラー / 実行時 undefined → テスト失敗（RED） |
| `requiredEnvForRoles` 未実装 | 同上 | 同上 |
| `findMissingEnv` 未実装 | 同上 | 同上 |
| `mintStagingBearersForRoles` 未実装 | 同上 | 同上 |
| CLI `--roles admin` | 現 `main()` は常に5 env必須 → ME 系欠落で exit 2 | `--roles admin` + ME env 未設定で **exit 0** を期待 → 現状 exit 2 で失敗（RED） |
| degrade | `RUNTIME_SMOKE_MINT_DEGRADE` を解釈しない | 必須 env 欠落 + degrade=1 で exit 0 + `mint_degraded=1` を期待 → 現状 exit 2 で失敗（RED） |

> RED 確認コマンド: 実装着手前に `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts` を実行し、追加ケースが FAIL（既存 T-A1〜T-A8 は PASS）であることを確認する。

## 4.3 テスト方針（private / CLI の取り扱い）

| 区分 | 方針 | 根拠 |
|------|------|------|
| pure 関数（`parseRoles` / `requiredEnvForRoles` / `findMissingEnv` / `mintStagingBearersForRoles`） | `import { ... } from "../mint-staging-bearers.mts"` で**直接 import** して呼ぶ。`process.env` を読まないため env 注入不要（引数で env を渡す） | 不変条件 3（pure 関数は引数で env を受け取る） |
| `main()` の CLI 挙動（`--roles` 解釈・degrade・exit code・GITHUB_OUTPUT 内容） | **`execFileSync` 経由**で `pnpm exec tsx scripts/smoke/mint-staging-bearers.mts --roles <v>` を実行し、一時 `GITHUB_OUTPUT` ファイルの内容と exit code を assert | `main()` は `process.exit` を呼ぶため in-process では検証不能。既存 `mint-staging-session-cookie.spec.ts` の `runCli` パターンを踏襲 |
| secret リテラル | テスト文字列・env 値はすべて**ダミーリテラル**（`test-secret-*` / `*-member-id` / `*@example.com`）。実 secret を一切置かない | 不変条件 1・3（既存 spec 踏襲） |

### 4.3.1 CLI runner ヘルパ（追加する `runMintCli`）

既存 `mint-staging-session-cookie.spec.ts` の `runCli` を参考に、本 spec 用に exit code と stderr も取得できる runner を追加する。

```ts
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface CliResult {
  readonly status: number;       // exit code（throw 時は error.status）
  readonly output: string;       // GITHUB_OUTPUT ファイル内容
  readonly stderr: string;       // stderr テキスト（env 名のみ・JWT 非露出を確認）
}

function runMintCli(args: string[], env: NodeJS.ProcessEnv): CliResult {
  const dir = mkdtempSync(join(tmpdir(), "mint-bearers-"));
  const outputFile = join(dir, "github-output.txt");
  try {
    let status = 0;
    let stderr = "";
    try {
      const stdout = execFileSync(
        "pnpm",
        ["exec", "tsx", "scripts/smoke/mint-staging-bearers.mts", ...args],
        {
          cwd: process.cwd(),
          env: { PATH: process.env.PATH, HOME: process.env.HOME, GITHUB_OUTPUT: outputFile, ...env },
          stdio: ["ignore", "pipe", "pipe"],
          encoding: "utf8",
        },
      );
      void stdout;
    } catch (e) {
      const err = e as { status?: number; stderr?: Buffer | string };
      status = typeof err.status === "number" ? err.status : 1;
      stderr = err.stderr ? String(err.stderr) : "";
    }
    const output = readFileSync(outputFile, "utf8");
    return { status, output, stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
```

> **注**: `execFileSync` は非0 exit で throw する。exit 0 を期待するケースでは throw されないため `status=0`、exit 2 を期待するケースでは catch 節で `error.status` を取得する。stderr も catch 節（throw 時）と正常時の両方で取得できるよう設計する。degrade（exit 0）ケースの stderr は正常戻り値からは取れないため、`stdio` の `pipe` で stderr を別経路取得するか、degrade ケースでは GITHUB_OUTPUT 内容（`mint_degraded=1`）と exit code のみを主 assert とする。

## 4.4 追加テストケース表（pure 関数）

| ID | 目的 | 入力 | 期待値 |
|----|------|------|--------|
| T-RS-01 | `parseRoles` 既定（後方互換） | `parseRoles(undefined)` | `["admin", "me"]` |
| T-RS-02 | `parseRoles` 空文字も既定 | `parseRoles("")` | `["admin", "me"]` |
| T-RS-03 | `parseRoles` admin 単独 | `parseRoles("admin")` | `["admin"]` |
| T-RS-04 | `parseRoles` me 単独 | `parseRoles("me")` | `["me"]` |
| T-RS-05 | `parseRoles` 複数（順序正規化・宣言順固定） | `parseRoles("me,admin")` | `["admin", "me"]`（宣言順 admin→me に正規化） |
| T-RS-06 | `parseRoles` 重複排除 | `parseRoles("admin,admin,me")` | `["admin", "me"]` |
| T-RS-07 | `parseRoles` 空白トリム | `parseRoles(" admin , me ")` | `["admin", "me"]` |
| T-RS-08 | `parseRoles` 未知 role は throw（値のみ・secret 非露出） | `parseRoles("foo")` | `toThrow(/unknown role: foo/)`。throw メッセージに `foo` 以外の入力値・env 値が含まれないこと |
| T-RS-09 | `parseRoles` 既知+未知混在も throw | `parseRoles("admin,foo")` | `toThrow(/unknown role: foo/)` |
| T-RE-01 | `requiredEnvForRoles(["admin"])` が ME 系を含まない | `["admin"]` | `["STAGING_AUTH_SECRET", "STAGING_ADMIN_MEMBER_ID", "STAGING_ADMIN_EMAIL"]`（順不同許容だが ME 系 0 件）。`expect(r).not.toContain("STAGING_ME_MEMBER_ID")` / `not.toContain("STAGING_ME_EMAIL")` |
| T-RE-02 | `requiredEnvForRoles(["me"])` が ADMIN 系を含まない | `["me"]` | `STAGING_AUTH_SECRET` + ME 系のみ。`not.toContain("STAGING_ADMIN_MEMBER_ID")` |
| T-RE-03 | `requiredEnvForRoles(["admin","me"])` は全 env | `["admin","me"]` | `STAGING_AUTH_SECRET` + ADMIN 系2 + ME 系2 の5件（重複 AUTH_SECRET は1件のみ） |
| T-FM-01 | `findMissingEnv` 全充足で空配列 | `findMissingEnv(["A","B"], { A: "x", B: "y" })` | `[]` |
| T-FM-02 | `findMissingEnv` 欠落のみ返す（順序保持） | `findMissingEnv(["A","B","C"], { A: "x", C: "z" })` | `["B"]` |
| T-FM-03 | `findMissingEnv` 空文字も欠落扱い | `findMissingEnv(["A"], { A: "" })` | `["A"]` |
| T-FM-04 | `findMissingEnv` は値を読まず存在判定のみ（値で分岐しない） | `findMissingEnv(["A"], { A: "any-non-empty-value" })` | `[]`（値内容に依存しない。truthy なら充足） |
| T-MR-01 | `mintStagingBearersForRoles(["admin"], env)` が admin のみ | `["admin"]` + admin env のみ | `result.adminBearer` 定義あり / `result.memberId === env.adminMemberId` / `result.meBearer === undefined` |
| T-MR-02 | admin role の bearer が verify 通過し isAdmin=true | 同上 | `verifySessionJwt(result.adminBearer, secret)` の `isAdmin === true` |
| T-MR-03 | `mintStagingBearersForRoles(["me"], env)` が me のみ | `["me"]` + me env のみ | `result.meBearer` 定義あり / `result.adminBearer === undefined` / `result.memberId === undefined` |
| T-MR-04 | `mintStagingBearersForRoles(["admin","me"], env)` は両方 | `["admin","me"]` + 全 env | adminBearer / meBearer / memberId すべて定義。`mintStagingBearers`（既存）と同等の bearer を産出 |
| T-MR-05 | admin 不在時 memberId を返さない | `["me"]` | `result.memberId === undefined`（既存 `STAGING_MEMBER_ID` 互換は admin role 含有時のみ） |

> `requiredEnvForRoles` の戻り順は実装で固定（`COMMON_REQUIRED_ENV` → 各 role 宣言順）。テストは「ME 系を含まない / 含む」の集合判定を主 assert とし、完全一致 assert を併記する場合は実装順に合わせる（Phase 5 で順序確定: `["STAGING_AUTH_SECRET", "STAGING_ADMIN_MEMBER_ID", "STAGING_ADMIN_EMAIL", "STAGING_ME_MEMBER_ID", "STAGING_ME_EMAIL"]` の部分集合）。

## 4.5 追加テストケース表（CLI 実行 / `execFileSync`）

| ID | 目的 | 入力（args + env） | 期待値 |
|----|------|---------------------|--------|
| T-CLI-01 | `--roles admin` は ME env 未設定でも exit 0 / admin のみ出力（AC-1, AC-3） | args=`["--roles","admin"]`, env=`{ STAGING_AUTH_SECRET, STAGING_ADMIN_MEMBER_ID, STAGING_ADMIN_EMAIL }`（ME 系**未設定**） | `status === 0`。`output` に `admin_bearer=` と `member_id=` を含む。`output` に `me_bearer=` を**含まない**。`output` に `mint_degraded=` を含まない |
| T-CLI-02 | `--roles=admin`（= 形式）も同じ挙動（AC-1） | args=`["--roles=admin"]`, env=admin系のみ | T-CLI-01 と同一 assert |
| T-CLI-03 | env `MINT_ROLES=admin` でも同じ（CLI 無指定時 env 経路） | args=`[]`, env=`{ MINT_ROLES: "admin", STAGING_AUTH_SECRET, STAGING_ADMIN_MEMBER_ID, STAGING_ADMIN_EMAIL }` | T-CLI-01 と同一 assert |
| T-CLI-04 | CLI 優先（CLI `--roles me` が env `MINT_ROLES=admin` を上書き） | args=`["--roles","me"]`, env=`{ MINT_ROLES: "admin", STAGING_AUTH_SECRET, STAGING_ME_MEMBER_ID, STAGING_ME_EMAIL }` | `status === 0`。`output` に `me_bearer=` を含み `admin_bearer=` / `member_id=` を**含まない** |
| T-CLI-05 | 既定（引数・env 無指定）は admin,me 両方（後方互換 / AC-2） | args=`[]`, env=全5 env | `status === 0`。`output` に `admin_bearer=` / `me_bearer=` / `member_id=` すべて含む |
| T-CLI-06 | `--roles admin,me` 明示も両方（AC-2） | args=`["--roles","admin,me"]`, env=全5 env | T-CLI-05 と同一 assert |
| T-CLI-07 | 要求 role の env 欠落時のみ missing を出す（admin role で admin env 欠落・degrade 無し / AC-4, AC-11） | args=`["--roles","admin"]`, env=`{ STAGING_AUTH_SECRET }`（ADMIN 系欠落, degrade 未設定） | `status === 2`。`stderr` に `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` を含む。`stderr` に `STAGING_ME_*` を**含まない**（要求外 role の env を missing 報告しない） |
| T-CLI-08 | missing 報告に値・JWT を露出しない（AC-4） | T-CLI-07 と同じ | `stderr` が env 名のみ。env に渡したダミー値（`test-secret-*` 等）が `stderr` に出現しないこと |
| T-CLI-09 | degrade: 必須 env 欠落 + `RUNTIME_SMOKE_MINT_DEGRADE=1` → exit 0 + mint_degraded=1（AC-10） | args=`["--roles","admin"]`, env=`{ RUNTIME_SMOKE_MINT_DEGRADE: "1" }`（必須 env 全欠落） | `status === 0`。`output` に `mint_degraded=1` を含む。`output` に `admin_bearer=` / `me_bearer=` を**含まない** |
| T-CLI-10 | degrade 未設定（既定）は hard-fail 維持（AC-11） | args=`["--roles","admin"]`, env=`{}`（degrade 未設定・必須 env 全欠落） | `status === 2`。`output` に `mint_degraded=` を**含まない** |
| T-CLI-11 | degrade=1 でも env 充足時は通常 mint（degrade は欠落時のみ発火） | args=`["--roles","admin"]`, env=`{ RUNTIME_SMOKE_MINT_DEGRADE: "1", STAGING_AUTH_SECRET, STAGING_ADMIN_MEMBER_ID, STAGING_ADMIN_EMAIL }` | `status === 0`。`output` に `admin_bearer=` を含み `mint_degraded=` を**含まない** |
| T-CLI-12 | degrade トリガは `=== "1"` 厳密（`"0"` / `"true"` では発火しない / AC-11 補強） | args=`["--roles","admin"]`, env=`{ RUNTIME_SMOKE_MINT_DEGRADE: "0" }`（必須 env 欠落） | `status === 2`（degrade しない） |

> CLI ケースは JWT 署名 + verify を含むため、各ケースに `30_000` ms timeout を付与（既存 `mint-staging-session-cookie.spec.ts` 踏襲）。

## 4.6 回帰（後方互換）確認

| ID | 目的 | 期待 |
|----|------|------|
| T-A1〜T-A8 | 既存 `mintStagingBearers` テスト（変更なし） | 全 PASS（AC-12）。既存ケースは1文字も改変しない |
| T-CLI-05 | CLI 既定が現行と同一出力（admin_bearer / me_bearer / member_id 全出力） | PASS（AC-12 の CLI レベル後方互換） |

## 4.7 不変条件（テスト記述時）

1. テスト文字列・env 値に実 secret を置かない。すべてダミーリテラル（`test-secret-mint-parity` 等の既存定数を再利用、または `*-member-id` / `*@example.com`）。
2. degrade / missing ケースで `stderr` / `output` にダミー値の漏れが無いことを T-CLI-08 で能動的に確認（env 名のみ露出の不変条件 1 をテストで担保）。
3. `mintStagingBearersForRoles` の戻り値キー集合が `adminBearer` / `meBearer` / `memberId` のみ（予期せぬキー無し）を確認（既存 T-A8 と同型の防御を T-MR で踏襲可）。

## 4.8 ローカル実行コマンド

```bash
# 本 spec 単体（RED → 実装後 GREEN）
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts

# self-verify と合わせて回帰確認
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts
```

## 4.9 完了条件（Phase 4）

- [ ] `mint-staging-bearers.spec.ts` に T-RS-01〜09 / T-RE-01〜03 / T-FM-01〜04 / T-MR-01〜05 / T-CLI-01〜12 を追記（既存 T-A1〜T-A8 は無改変）
- [ ] CLI runner `runMintCli`（exit code + GITHUB_OUTPUT + stderr 取得）を追加
- [ ] 追加ケースが実装着手前に FAIL（RED）し、既存 T-A1〜T-A8 が PASS であることを確認
- [ ] AC-1〜AC-4, AC-10〜AC-12 をテストレベルで網羅（対応 ID: AC-1=T-CLI-01/02/03, AC-2=T-CLI-05/06, AC-3=T-CLI-01, AC-4=T-CLI-07/08, AC-10=T-CLI-09, AC-11=T-CLI-10/12, AC-12=T-A1〜T-A8+T-CLI-05）
