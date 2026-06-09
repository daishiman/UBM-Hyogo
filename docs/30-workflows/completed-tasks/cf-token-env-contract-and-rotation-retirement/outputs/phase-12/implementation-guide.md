# 実装ガイド — cf-token-env-contract-and-rotation-retirement

## Part 1（中学生レベル）

### たとえ話で理解する

家に「留守番さん」（＝CI の自動テスト）を雇っているとします。留守番さんは毎日、家のいくつかの部屋を見回って「ちゃんと動いているか」を確認します。ところがある部屋（＝本番に近い動作確認）に入るには **特別な合鍵**（＝`CLOUDFLARE_API_TOKEN` というアクセス用の鍵）が必要でした。

留守番さんには「使ってよい鍵を入れておく鍵束」（＝`staging-runtime-smoke` という環境）を渡してあります。鍵束に入れる鍵は、別の紙のリスト（＝`provision-staging-secrets.sh` という台本）に書かれた分だけ入る仕組みです。

ところが、その**リストに合鍵を書き忘れていた**のです。だから鍵束にはその合鍵が入らず、留守番さんは毎日「その部屋の鍵がない！」と怒って報告（＝CI が毎回赤）していました。最初は「鍵が古くなって使えなくなった（＝週ごとに失効した）のかな？」と思いましたが、調べてみると鍵そのものは無事で、**ただリストに書き忘れていただけ**でした。

### なぜ必要か → 何をするか

問題が「リストの書き忘れ」だと分かったので、次の 4 つを直します。

1. **なぜ必要か**: そもそも合鍵が鍵束に入らないと留守番さんが部屋を確認できない。
   **何をするか**: リスト（provision 台本）に合鍵を 1 行書き足す（A1）。

2. **なぜ必要か**: 合鍵が一時的に手元にない日でも、留守番さんに毎回「鍵がない！」と怒鳴られたくない。
   **何をするか**: 「合鍵が無い日は、その部屋の確認は静かにお休みする」というルールを作る（A2 = degrade）。ただし**もっと大事な鍵**（家の玄関の鍵 = `STAGING_API_BASE` など）が無い時は、これまで通りちゃんと大声で知らせる。

3. **なぜ必要か**: また誰かが新しい部屋を増やしたとき、リストに鍵を書き忘れたら同じ事故が起きる。
   **何をするか**: 「留守番さんが使う鍵」と「リストに書いてある鍵」を**毎回つき合わせる係**（A3 = drift gate）を置く。書き忘れがあったら、その場で「リストに足りない鍵があるよ」と教えてくれる。

4. **なぜ必要か**: これまでは「90 日ごとに鍵を作り直す」習慣にしていたが、作り直しのたびに手間と事故のリスクがあった。
   **何をするか**: 鍵を定期的に作り直す習慣はやめる。代わりに **必要最小限の用途だけ開く合鍵**（その部屋だけ・期限なし）にして、**もし鍵を無くしたらすぐ無効化する**運用に変える（B1-B4）。さらに「お試し用の部屋の鍵」と「本番の部屋の鍵」は**別々の合鍵**にして、片方が漏れてももう片方は安全にする。

これで「毎日怒られる」状態が消え、同じ書き忘れが二度と起きにくくなり、鍵の管理もシンプルで安全になります。

## Part 2（開発者レベル）

### A1: `provision-staging-secrets.sh`（編集）

`SECRETS` 配列に 1 エントリ追加（位置は STAGING 認証群の後・SLACK の前を推奨）:

```bash
SECRETS=(
  "STAGING_API_BASE:op://Employee/ubm-hyogo-env/STAGING_API_BASE"
  # ...
  "CLOUDFLARE_API_TOKEN:op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE"  # ★追加
  "SLACK_WEBHOOK_INCIDENT:op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING"
)
```

- `op` 参照命名: 1Password item は `CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE`（staging runtime smoke 専用・狭スコープトークン値）。新規 item で、`production deploy` 用とは別物。命名は `<論理名>_STAGING_RUNTIME_SMOKE` 規約に従い、環境分離を item 名レベルで明示する。
- `CLOUDFLARE_ACCOUNT_ID` は **repo variable**（`vars.CLOUDFLARE_ACCOUNT_ID`）で管理し、`SECRETS`（環境シークレット投入）には含めない。コメントでその旨を明記する。
- 既存の inventory 検証ループは `SECRETS` を参照するため、追加分は自動的に網羅性検証の対象になる（コード追加不要）。

### A2: `runtime-smoke-staging.yml` degrade step（編集）

`bulk-tag-runtime-smoke` の `verify required staging secrets` step を 2 段階（hard-fail 群 + degrade 群）に再設計する bash 擬似コード:

```bash
# 前提 secret（欠落は hard-fail・AC-3）
hard_missing=()
for name in STAGING_API_BASE STAGING_ADMIN_BEARER CLOUDFLARE_ACCOUNT_ID; do
  if [ -z "${!name:-}" ]; then hard_missing+=("$name"); fi
done
if [ "${#hard_missing[@]}" -gt 0 ]; then
  printf "::error::missing required secrets in 'staging-runtime-smoke': %s\n" "${hard_missing[*]}"
  exit 1
fi

# CF token（欠落は degrade-skip・AC-2）
cf_missing=()
for name in CLOUDFLARE_API_TOKEN; do
  if [ -z "${!name:-}" ]; then cf_missing+=("$name"); fi
done
if [ "${#cf_missing[@]}" -gt 0 ]; then
  echo "cf_degraded=1" >> "$GITHUB_OUTPUT"
  printf "::notice::bulk-tag runtime smoke skipped; missing CF credentials: %s (register via provision-staging-secrets.sh)\n" "${cf_missing[*]}"
fi
```

後続 step の `if:` 条件に AND 追加:

```yaml
# mask staging credentials / run bulk tag runtime smoke / redaction grep gate / upload evidence artifact
if: env.RUNTIME_SMOKE_MINT_DEGRADED != '1' && steps.verify-bulk-inputs.outputs.cf_degraded != '1'
```

- `verify-bulk-inputs.outputs.cf_degraded`（CF 欠落で skip）は既存 `RUNTIME_SMOKE_MINT_DEGRADED`（mint 失敗で skip）と同じ degrade 境界だが、GitHub Actions の `if:` 評価を確実にするため step output で後続へ伝播する。

### A3: `verify-runtime-smoke-secret-contract.mts`（新規・pure functions + main）

```typescript
export interface SecretContractViolation {
  readonly kind: "missing_provision" | "stale_provision" | "missing_exemption_rationale";
  readonly names: readonly string[];
  readonly severity: "error" | "warn";
}

// runtime-smoke-staging.yml の全 `${{ secrets.<NAME> }}` を抽出（重複排除・name のみ）
export function extractWorkflowSecrets(workflowYaml: string): string[];

// provision-staging-secrets.sh の `"<NAME>:op://..."` を抽出（既存 verify-mint-env-contract と同パターン）
export function extractProvisionedSecrets(provisionSh: string): string[];

// workflowSecrets ⊆ provisionedSecrets ∪ documented legacy exemptions を検査
export function detectSecretContractViolations(input: {
  readonly workflowSecrets: readonly string[];
  readonly provisionedSecrets: readonly string[];
  readonly exemptSecretRationales?: Readonly<Record<string, string>>;
}): SecretContractViolation[];

// provisioning 対象外だが正当に消費される legacy secret と根拠
export const DEFAULT_EXEMPT_SECRET_RATIONALES: Readonly<Record<string, string>>;

export function main(): Promise<void>; // error 違反があれば stderr + exit 1 / warn は stdout / error なしなら PASS 出力
```

**DEFAULT_EXEMPT_SECRET_RATIONALES の根拠**:

| secret | exempt 要否 | 理由 |
| ------ | ----------- | ---- |
| `GITHUB_TOKEN` | verifier 内部で除外 | GitHub Actions が自動提供。provision 対象外で正当 |
| `SLACK_WEBHOOK_INCIDENT` | exempt 不要 | provision 済（`provisioned` 集合に含まれ通過） |
| `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID` | rationale 付き legacy exemption | JWT mint が使えない時の legacy static bearer fallback。provisioning 正本には載せないが、空 rationale は error として検出 |
| `STAGING_AUTH_SECRET` 等 mint 系 | exempt 不要 | provision 済。mint env 契約は `verify-mint-env-contract` の責務（AC-7・本 gate は名前の包含のみ判定） |
| `CLOUDFLARE_API_TOKEN` | exempt にしない | **本タスクで provisioned へ追加するのが正解**。exempt にすると gap を見逃すため禁止 |

- `main()` は workflow と provision script を読み、`detectSecretContractViolations` の `severity:"error"` が 1 件でもあれば stderr に出して `exit 1`、`severity:"warn"` のみなら stdout に警告を出したうえで PASS する。`import.meta.url === pathToFileURL(process.argv[1]).href` ガードで test import 時に `main` を走らせない（既存 verifier と同パターン）。
- **トークン値は一切読まない**（抽出は secret **名**のみ）。AC-8（redaction / mask 不変・name のみ）を構造的に保証する。

**エラーハンドリング / エッジケース**:

| ケース | 期待挙動 |
| ------ | -------- |
| 空 YAML（workflowSecrets 0 件） | violation 0 件で PASS（空集合 ⊆ 任意集合は真） |
| provision script に secret 0 件 | workflowSecrets が非空かつ documented exemption 外なら全件 missing_provision（fail-fast）。workflowSecrets も 0 件なら PASS |
| 同名 secret の重複参照 | `extractWorkflowSecrets` で重複排除し 1 件として扱う |
| provisioned だが workflow 未消費 | `stale_provision` warn を出す。現時点では fail ではないが、投入正本の掃除候補として可視化 |
| exemption rationale が空 | `missing_exemption_rationale` error を出す。legacy exemption は根拠なしに mute できない |
| 大文字小文字 / 前後空白 | 正規表現で `[A-Z0-9_]+` を厳密抽出・trim 済み name のみ集合化 |
| ファイル read 失敗 | I/O 例外を握り潰さず throw（CI が異常として赤になる方が安全） |

**設定可能パラメータ一覧**:

| パラメータ | 既定 | 説明 |
| ---------- | ---- | ---- |
| workflow path | `.github/workflows/runtime-smoke-staging.yml` | 消費側 |
| provision path | `scripts/smoke/provision-staging-secrets.sh` | 投入側 |
| `DEFAULT_EXEMPT_SECRET_RATIONALES` | `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID` の rationale map | 正当な legacy fallback exemption。`GITHUB_TOKEN` は内部 secret として抽出時に除外 |

### A4: `verify-runtime-smoke-secret-contract.spec.ts`（新規・Vitest）

純関数 unit test。fixture YAML / sh 文字列をインラインで与え、以下を網羅する:

- `CLOUDFLARE_API_TOKEN` 追加**前** fixture → `detectSecretContractViolations` が `missing_provision` を返す（AC-4 fail）。
- 追加**後** fixture → violation 0 件（AC-4 PASS）。
- hard-fail matrix（`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` の有無は本 verifier の責務外であることを明示・gate は provision 契約のみ判定）。
- 空 YAML / secret 0 件のエッジ（PASS）。
- `GITHUB_TOKEN` は抽出時に除外され、legacy static bearer exemption は rationale 付きなら violation にならない。

### A5: `verify-runtime-smoke-secret-contract.yml`（新規・CI gate）

`verify-mint-env-contract.yml` を雛形に、`tsx` で `main()` を実走。

```yaml
on:
  pull_request:
    paths:
      - .github/workflows/runtime-smoke-staging.yml
      - scripts/smoke/provision-staging-secrets.sh
      - scripts/smoke/verify-runtime-smoke-secret-contract.mts
      - .github/workflows/verify-runtime-smoke-secret-contract.yml
  push:
    branches: [dev, main]
```

- **paths フィルタ footgun（memory issue-1146 教訓）**: 本 gate を将来 dev/main の required status check に登録する場合、`pull_request.paths` があると非該当 PR で永久 pending になり block する。required 化は user-gated（branch protection）であり、登録時は `paths` 除去（常時実行化）を検討する旨を runbook / phase-5 に注記済み。本 spec の既定は「required 化は未実施・PR/push トリガのみ」。

### B1-B4: rotation 撤廃 + runbook

- **B1（削除）**: `cf-token-rotation-reminder.yml` を `git rm`。reminder の唯一の参照元のため、削除で `CF_TOKEN_ISSUED_AT` var は未参照になる。削除時は CLAUDE.md / docs の stale 参照を grep して同時是正する。
- **B2（新規 runbook）**: 章立て = (1) トークン設計原則（非失効・最小権限・環境分離・即時失効）/ (2) staging smoke 用発行手順（scope: **D1:Edit on ubm-hyogo-db-staging のみ / TTL なし**）/ (3) production deploy 用発行手順（scope: **Workers Scripts:Edit + D1:Edit on production のみ / TTL なし / staging と別トークン**）/ (4) 1Password 保管 / (5) GitHub 環境投入 / (6) 漏洩時即時失効（roll token → reissue → 再投入）/ (7) 不採用判断記録（90 日カレンダーローテ撤廃理由・OIDC 不採用理由）。
- **B3（tombstone）**: 旧 `cf-token-rotation-runbook.md` 冒頭に `> **RETIRED (YYYY-MM-DD)**: 90日カレンダーローテーションは撤廃。後継は cf-token-provisioning-and-revocation-runbook.md` を追記。本文は監査履歴として保持。
- **B4（追記）**: `cf-token-rotation-log.md` 末尾に「rotation policy retired・event-based revocation へ移行」を 1 行追記。

## 視覚証跡

UI/UX 変更なしのため **Phase 11 スクリーンショット不要（NON_VISUAL）**。本タスクの変更対象は GitHub Actions workflow YAML・shell script・TypeScript pure function・docs であり、ブラウザ描画物が存在しない。代替証跡は `outputs/phase-10` / `outputs/phase-11` の evidence ledger（drift gate の Vitest 実行ログ・`tsx` 実走ログ・`actionlint` / `bash -n` 出力）である。local evidence 4 件は `present`、Cloudflare token 発行後に取得する provisioning inventory と staging smoke run は user-gated `pending` として分離する。
