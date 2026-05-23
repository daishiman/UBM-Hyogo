# 実装ガイド — ci-green-recovery-smoke-coverage-shard

> 本ガイドは 2 パート構成。Part 1 は専門知識のない人にも分かる例え話、Part 2 は実装者向けの技術詳細。
> secret 実値・JWT 文字列・署名鍵は一切転記しない（`::add-mask::` 前提）。

## 実装完了サマリ（2026-05-23）

3 lane すべてを 1 サイクルで実装し、ローカル検証 green。

| 検証 | 結果 |
|---|---|
| `pnpm typecheck` | ✅ exit 0 |
| `pnpm lint` | ✅ exit 0 |
| mint parity unit（`mint-staging-bearers.spec.ts`） | ✅ 8 tests passed |
| shell reason unit（`runtime-attendance-provider.test.sh`） | ✅ T-4-6/7/8 PASS + 既存回帰なし |
| `pnpm smoke:test` 全体 | ✅ 全 PASS |
| `pnpm test:workflow-secrets` | ✅ PASS |
| `actionlint .github/workflows/*.yml` | 未実行（local `actionlint` command not found） |
| coverage-guard `--no-run` MISSING HINT | ✅ 追記反映・判定ロジック不変 |

> 実 staging を要する項目（`runtime-smoke-staging / smoke` の緑化、`coverage-gate-shard (packages)` checkout 復旧）は、`STAGING_AUTH_SECRET` ほか mint secret 投入後の CI 実行で確定する（runbook 参照・ユーザー gated）。コード/CI config 側の恒久対策はすべて実装済み。

---

# Part 1 — 中学生にも分かる説明

## 何が壊れていたの？

CI（コードを自動で検査する仕組み）で 3 つの問題が起きていました。

### 問題A: 合鍵が毎朝期限切れになる

会員サイトの「管理者専用ドア」を自動テストで開けるために、**合鍵（bearer トークン）**を使っています。
ところが今までは、その合鍵を金庫（GitHub の secret）に**作り置き**していました。この合鍵には「作ってから 24 時間で使えなくなる」というタイマーが付いています。

だから、

1. 朝に合鍵を作って金庫に入れる
2. 24 時間後、合鍵が勝手に期限切れになる
3. テストがドアを開けられず「401（あなたは入れません）」で失敗する
4. 人間が気づいて、また新しい合鍵を作る …（無限ループ）

これが「runtime-smoke が赤くなる」原因でした。

**直し方**: 合鍵を作り置きするのをやめて、**テストを始める直前にその場で新しい合鍵を作る**方式にします。
金庫には合鍵そのものではなく、「**合鍵を作る機械（署名鍵）**」と「だれの合鍵か（メンバー情報）」だけを入れておきます。
作りたてホヤホヤの合鍵は 10 分しかもたない設定にしますが、テストはすぐ終わるので問題ありません。**作り置きしないので、期限切れになりようがありません。**

> 大事なルール: 作った合鍵は、人の目に触れないよう**すぐに黒塗り（マスク）**します。ログにも文書にも本物の合鍵は書きません。

### 問題C: 倉庫の鍵が読めなくてドアの前で止まる

CI は「テスト結果（カバレッジ）」を倉庫に出し入れします。その倉庫に入る前に、まず**ソースコードを取りに行く**作業（checkout）があります。
ここで「ユーザー名が読めません」というエラーが出て、ドアの前で止まってしまいました。

**直し方**: CI に「このドアは"読むだけ"の権限でいいよ」という**通行証（permissions）**を最初にきちんと貼っておきます。
別の似たテストにはこの通行証が貼ってあって成功していたので、それに合わせます。これは無害で、貼っておくだけで止まりにくくなります。

### 問題B: 「在庫がない」という勘違いの貼り紙

問題C でソースコードが取れないと、その先の「テスト結果を倉庫にしまう」作業も当然できません。
すると最後の集計係が倉庫を見て「**在庫（カバレッジ結果）がない！**」と貼り紙（MISSING エラー）を出します。
でも本当の原因は「在庫が無い」ことではなく「**そもそも前の作業（C）で止まったから運び込めなかった**」ことです。この貼り紙は人を勘違いさせます。

**直し方**: 集計係が貼り紙を出す**前に**、「前の作業がコケてないか」を先にチェックします。
コケていたら「在庫がない」ではなく「**前の作業 X が失敗したので結果を運べませんでした**」と正しい原因を先に出します。

## まとめ（たとえ話）

| 問題 | たとえ | 直し方 |
|---|---|---|
| A | 合鍵が 24h で期限切れ | その場で 10 分だけ有効な合鍵を作る |
| C | 倉庫前で「鍵が読めない」 | 「読むだけ通行証」を最初に貼る |
| B | 「在庫がない」の勘違い貼り紙 | 貼る前に「前の作業がコケてないか」を先に見る |

---

# Part 2 — 開発者向け技術詳細

## 0. 変更対象ファイル

| パス | 種別 | lane |
|---|---|---|
| `scripts/smoke/mint-staging-bearers.mts` | 新規 | A |
| `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | 新規 | A |
| `scripts/smoke/runtime-attendance-provider.sh` | 修正（reason 分岐） | A |
| `.github/workflows/runtime-smoke-staging.yml` | 修正（setup + mint step + fallback） | A |
| `.github/workflows/ci.yml` | 修正（permissions / token / step 順序） | B, C |
| `scripts/coverage-guard.sh` | 修正（MISSING 診断強化） | B |
| `docs/.../runbooks/secret-provisioning.md` | 修正（mint secret + 再発行手順） | A |

## 1. Lane A — mint helper

### 1.1 型定義とシグネチャ（Phase 2 §1.2 と一致）

```ts
// scripts/smoke/mint-staging-bearers.mts
import { signSessionJwt } from "@ubm-hyogo/shared";

interface MintedBearers {
  readonly adminBearer: string;
  readonly meBearer: string;
  readonly memberId: string;
}

// 純粋関数: env を引数で受け取る（process.env を直接読まない → test 可能）
export async function mintStagingBearers(env: {
  authSecret: string;
  adminMemberId: string;
  adminEmail: string;
  meMemberId: string;
  meEmail: string;
  ttlSeconds?: number;
}): Promise<{ adminBearer: string; meBearer: string; memberId: string }>;
```

- `signSessionJwt(authSecret, { memberId, email, isAdmin, ttlSeconds })` を 2 回呼ぶ。
  - admin: `isAdmin: true`
  - me: `isAdmin: false`
- `memberId` は admin-detail / attendance 用に既存 `STAGING_MEMBER_ID` 互換で `adminMemberId` を返す。
- 必須 env 欠落時は明示メッセージで `process.exit(2)`（fallback 判定は workflow 側責務）。
- `import.meta.main` 相当の guard で CLI と純粋関数を分離（test import 時は main を走らせない）。
- helper は `GITHUB_OUTPUT` / `GITHUB_ENV` 追記のみ。**JWT 文字列を console に echo しない**（R-1 CRITICAL）。

### 1.2 signSessionJwt / verifySessionJwt の正本

| 関数 | 場所 | シグネチャ |
|---|---|---|
| `signSessionJwt` | `packages/shared/src/auth.ts:93` | `signSessionJwt(secret, { memberId, email, isAdmin, name?, nowSeconds?, ttlSeconds? }): Promise<string>`（純粋 Web Crypto HS256） |
| `verifySessionJwt` | `packages/shared/src/auth.ts:127` | `verifySessionJwt(token, secret, nowSeconds?): Promise<claims \| null>` |
| `SESSION_JWT_TTL_SECONDS` | `packages/shared/src/auth.ts:42` | `86400`（静的 bearer の失効原因。mint では `MINT_TTL_SECONDS` で上書き） |

> `@ubm-hyogo/shared` は `.` = `./src/index.ts` の TS 直 export（build 不要）。root devDep の `tsx ^4.19.0` で `.mts` を実行する。

### 1.3 ci.yml / runtime-smoke-staging.yml step 順序

**runtime-smoke-staging.yml（mint 経路）**:

```
1. checkout
2. uses ./.github/actions/setup-project   ← node/pnpm/install（tsx 実行のため新規追加）
3. mint step（STAGING_AUTH_SECRET が空でなければ実行）:
     a. tsx scripts/smoke/mint-staging-bearers.mts で admin/me JWT を mint
     b. mint した値に ::add-mask:: を即適用
     c. GITHUB_ENV に STAGING_ADMIN_BEARER / STAGING_ME_BEARER / STAGING_MEMBER_ID を export
   （STAGING_AUTH_SECRET が空なら if: でスキップ＝後方互換 fallback）
4. 既存 mask step（GITHUB_ENV 経由の値も mask 対象に）
5. 既存 verify step（最終変数の存在検査）
6. smoke 実行（runtime-attendance-provider.sh）
```

> mint → mask → export を **1 step に閉じる**ことで JWT 平文露出のレースを排除（R-1）。

### 1.4 runtime-attendance-provider.sh の reason 分岐（診断強化）

`request_json` の `status != 200` ブロック（既存 L165-168 を拡張）:

```sh
if printf '%s' "$redacted_body" | jq -e '.error == "auth misconfigured"' >/dev/null 2>&1; then
  failure_reason="auth-secret-binding-missing"          # 500: AUTH_SECRET binding 欠落
elif [[ "$status" == "401" ]] && printf '%s' "$redacted_body" | jq -e '.error == "unauthorized"' >/dev/null 2>&1; then
  failure_reason="auth-token-invalid-or-expired"        # 401: bearer 失効/改ざん
elif [[ "$status" == "403" ]] && printf '%s' "$redacted_body" | jq -e '.error == "forbidden"' >/dev/null 2>&1; then
  failure_reason="auth-not-admin"                        # 403: isAdmin=false
fi
```

reason は redact 済み body から error 種別のみを `jq` で読む。JWT 文字列は出力しない。

## 2. Lane C — ci.yml permissions / token hardening

| 変更 | 内容 |
|---|---|
| top-level permissions | `on:` と `jobs:` の間に `permissions:\n  contents: read` を追加。`runtime-smoke-staging.yml:15-16` に揃える |
| shard checkout token | `coverage-gate-shard` / `coverage-gate` の `actions/checkout@v4` に `with: { token: ${{ github.token }}, persist-credentials: true }` を明示 |

> 同 run 前段 `ci` job は同じ default checkout で成功していたため transient の可能性が残る。hardening は無害・回帰リスクなしの防御的変更。再現確認（re-run）はユーザー運用側。

## 3. Lane B — coverage-gate step 順序 + 診断

**(a) step 順序入れ替え**（「Fail closed on failed shard」を `coverage-guard.sh --no-run` の前へ）:

```
3. download-artifact (coverage-*)
4. Fail closed on failed shard   ← needs.coverage-gate-shard.result != 'success' で即 exit 1
                                    「upstream shard X failed — coverage artifacts unavailable」
5. merge api unit+d1
6. coverage-guard.sh --no-run    ← shard 全成功時のみ到達。ここで MISSING なら真の欠落
```

**(b) coverage-guard.sh 診断強化**: `--no-run` の MISSING 出力（`scripts/coverage-guard.sh:304-338`）に「shard 成功時にここに来た場合のみ真の欠落。shard 失敗が疑われる場合は coverage-gate-shard の結果を確認せよ」を追記。**MISSING 判定ロジック自体は不変**（false negative を作らない / R-4）。

## 4. エラーハンドリング

| 状況 | 挙動 |
|---|---|
| mint helper の必須 env 欠落 | 明示メッセージ + `process.exit(2)` |
| `STAGING_AUTH_SECRET` 未設定 | workflow が mint step を `if:` スキップ → 静的 bearer fallback |
| mint JWT が verify 失敗（鍵不一致） | smoke が 401 → reason `auth-token-invalid-or-expired` で切り分け。runbook に「staging AUTH_SECRET と同値」明記（R-3） |
| shard checkout 失敗 | coverage-gate が「upstream shard X failed」を先に出して fail（AC-7） |
| coverage 真の欠落 | 全 shard 成功後の `--no-run` で MISSING + exit 1（判定不変） |

## 5. 設定パラメータ一覧

| パラメータ | 既定値 | 由来 / 用途 |
|---|---|---|
| `MINT_TTL_SECONDS` | `600`（10 分） | mint JWT の TTL。smoke 実行時間に対し十分・短命 |
| `SESSION_JWT_TTL_SECONDS` | `86400` | shared 既定（静的 bearer 失効原因）。mint では `ttlSeconds` で上書き |
| `STAGING_AUTH_SECRET` | （secret） | HS256 署名鍵。staging API の `AUTH_SECRET` と同値 |
| `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` | （secret） | admin bearer の identity |
| `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL` | （secret） | me bearer の identity |
| ci.yml `permissions` | `contents: read` | workflow token 縮退防止 |
| checkout `token` | `${{ github.token }}` | shard checkout の明示認証 |

## 6. 受入条件マッピング

| AC | lane | 検証 |
|---|---|---|
| AC-1 | A | smoke admin-list 200 / contract PASS |
| AC-2 | A | mint→`verifySessionJwt` parity test |
| AC-3 | A | redaction grep gate |
| AC-4 | A | fallback 動作 |
| AC-5 | C | actionlint + permissions/token |
| AC-6 | B/C | shard 成功時 coverage-gate exit 0 |
| AC-7 | B/C | shard 失敗時の明確エラー先行 |
| AC-8 | 全体 | required context 名不変 |
| AC-9 | 全体 | typecheck / lint / unit |

---

## 視覚証跡

**UI/UX 変更なしのため Phase 11 スクリーンショット不要。**
本タスクは CI workflow / shell script / mint helper の変更で、画面・スタイル・導線を一切変更しない（NON_VISUAL）。撮影対象が存在しないため、スクリーンショットは取得しない。

代替証跡として以下を参照する。

| 代替証跡 | 参照先 |
|---|---|
| 最終レビュー（Semantic 層の確定） | `outputs/phase-10/final-review.md`（`phase-10-final-review.md`） |
| 手動テスト代替証跡（CI ログ / mint parity / summary.json reason） | `outputs/phase-11/manual-test-result.md`（`phase-11-manual-test.md`） |

3 層評価: Semantic=型/契約（主評価軸）、Visual=N/A、AI UX=N/A。
