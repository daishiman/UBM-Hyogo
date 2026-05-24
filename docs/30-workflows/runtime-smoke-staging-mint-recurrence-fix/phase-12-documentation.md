# Phase 12: ドキュメント同期

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 12 / 13 |
| 入力 | phase-10-final-review.md / phase-11-manual-test.md / reference/bearer-lifecycle-ssot.md |
| 状態 | `implemented_local_evidence_captured`（本改善サイクルでコード・テスト・Phase 12 出力を反映） |

## 目的

鮮度ゲート・reason 細分化・mint 自己検証・SSOT 化を、運用者が迷わず追えるドキュメント群に落とす。
中学生レベルの概念説明（Part 1）と開発者レベルの技術詳細（Part 2）の 2 パート構成を確定し、
視覚証跡セクションで NON_VISUAL（スクリーンショット不要）を明記する。

## 実行タスク

1. Part 1（中学生レベル）で「合言葉が時間で期限切れになる仕組み」の例えで bearer 失効と鮮度ゲートを説明する。
2. Part 2（技術者向け）で関数シグネチャ・reason 値一覧・workflow step 挿入・env・エラーハンドリング・SSOT リンクを記述する。
3. 視覚証跡セクションで「UI/UX 変更なしのため Phase 11 スクリーンショット不要」を明記する。
4. Phase 12 の 6 成果物を `outputs/phase-12/` に生成し、実装済み証跡として同期する。
5. system spec 更新判定（新規インターフェース追加 = Step2 該当）を本改善サイクルで記録する。

---

## Part 1: 概念説明（中学生レベル・専門用語なし）

### なぜこれが必要なのか

学校のクラブで、部室に入るための「合言葉」を決めたとします。
ただしこの合言葉にはルールがあり、決めてから **24 時間たつと自動的に使えなくなる**約束になっています。
このサイトの裏側でも、自動点検のロボットが bearer という合言葉を使って staging API に入ろうとします。

これまでは、合言葉が期限切れになったことに点検が失敗してから初めて気づいていました。
さらに「合言葉が古くなった」のか「合言葉を作る鍵と確認する鍵が食い違っている」のかの区別がつかず、毎回原因調査が必要でした。
同じ失敗が 24 時間周期で繰り返される構造そのものが問題でした。

### このタスクで何をするのか

1. **期限切れになる前に先回りで知らせる見張り役を置く**（鮮度ゲート）
   点検を始める前に「この合言葉、あと何秒で期限切れ？」を確認します。
   残りが 6 時間を切っていたら、点検を始めず loud fail します。

2. **今どっちの合言葉を使っているかを表示する**（auth-path 可視化）
   実行ごとに `minted` か `static-fallback` かを notice に出します。
   こっそり古い方に戻るサイレント退行を見える状態にします。

3. **失敗の理由を細かく分ける**（reason 細分化）
   401 を `auth-token-expired` と `auth-secret-drift` に分けます。
   期限切れなら再発行または mint 有効化、鍵の食い違いなら secret 同期という形で次アクションを一意にします。

---

## Part 2: 技術詳細（開発者向け）

### 新規 / 変更コンポーネント

| コンポーネント | 種別 | 受入条件 |
|---|---|---|
| `scripts/smoke/bearer-freshness-gate.mts` | 新規 | AC-1 / AC-3 |
| `scripts/smoke/__tests__/bearer-freshness-gate.spec.ts` | 新規 | AC-1 / AC-3 |
| `.github/workflows/runtime-smoke-staging.yml` | 修正（auth-path notice + freshness gate + `setup-project` 常時実行） | AC-1 / AC-2 |
| `scripts/smoke/runtime-attendance-provider.sh` | 修正（401 reason を expired / drift に細分化） | AC-3 |
| `scripts/smoke/mint-staging-bearers.mts` | 修正（署名後 `verifySessionJwt` self-check） | AC-4 |
| `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` / `scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` | 既存 parity 回帰 + self-check fail path を検証 | AC-4 |
| `reference/bearer-lifecycle-ssot.md` | 新規（本改善サイクル で実体完成） | AC-5 |
| `secret-provisioning.md` | 修正（SSOT リンク + 鮮度ゲート運用注記） | AC-5 |

### 関数シグネチャ

```ts
export function decodeJwtExp(token: string): number | null;

export function classifyBearerFreshness(input: {
  readonly label: string;
  readonly token: string;
  readonly nowSeconds?: number;
  readonly thresholdSeconds?: number;
}): {
  readonly label: string;
  readonly exp: number | null;
  readonly secondsRemaining: number | null;
  readonly status: "fresh" | "stale" | "expired" | "invalid";
};

export function explainAuthFailureFromBearer(input: {
  readonly token: string;
  readonly nowSeconds?: number;
}): "auth-token-expired" | "auth-secret-drift";
```

```ts
export async function mintStagingBearers(env: {
  authSecret: string;
  adminMemberId: string;
  adminEmail: string;
  meMemberId: string;
  meEmail: string;
  ttlSeconds?: number;
}): Promise<{ adminBearer: string; meBearer: string; memberId: string }>;
```

`mintStagingBearers` は署名直後に同じ secret で `verifySessionJwt` を実行し、admin / me の `memberId` と `isAdmin` が一致しなければ throw する。JWT 文字列は stdout / stderr に出さない。

### reason 値一覧

| reason | HTTP | 判定条件 | 原因 → アクション |
|---|---|---|---|
| `auth-secret-binding-missing` | 500 | body `error == "auth misconfigured"` | API に AUTH_SECRET 未投入 → `scripts/cf.sh secret put` |
| `auth-token-expired` | 401 | `error == "unauthorized"` かつ `exp <= now` | 静的 bearer 失効 → 再発行 or mint 有効化 |
| `auth-secret-drift` | 401 | `error == "unauthorized"` かつ `exp > now` または decode 不能 | 署名鍵不一致 / JWT 形式不整合 → secret 同期 |
| `auth-not-admin` | 403 | body `error == "forbidden"` | isAdmin=false → member identity secret 修正 |

### workflow step 挿入

`setup-project` は鮮度ゲートが `pnpm exec tsx` を使うため常時実行へ変更した。
mint step の `if: env.STAGING_AUTH_SECRET != ''` は維持し、Option C の静的 fallback を壊さない。
`mask staging credentials` step で `RUNTIME_SMOKE_AUTH_PATH=minted/static-fallback` を notice に出し、`verify bearer freshness` を `run runtime smoke` の直前に挿入する。

| step 名 | 役割 | AC |
|---|---|---|
| `mask staging credentials` | auth path notice と credential mask | AC-2 / AC-7 |
| `verify bearer freshness` | admin / me bearer が 6h 以上 fresh でなければ exit 1 | AC-1 |

### env / 既定値

| env | 既定値 | 用途 |
|---|---|---|
| `FRESHNESS_THRESHOLD_SECONDS` | `21600`（6h） | 鮮度ゲートの失効間近 threshold |
| `RUNTIME_SMOKE_AUTH_PATH` | `minted` or `static-fallback` | workflow notice と gate output の非機密 auth path 表示 |

### エラーハンドリング

| 状況 | 振る舞い |
|---|---|
| 鮮度ゲート `stale` / `expired` / `invalid` | exit 1。`::error::` で label + secondsRemaining を出力（JWT 文字列非出力） |
| mint 自己検証 `verifySessionJwt` が null | throw。JWT 文字列非出力 |
| smoke runner 401 | `explainAuthFailureFromBearer` で `auth-token-expired` / `auth-secret-drift` に分岐 |

### SSOT へのリンク

bearer / secret ライフサイクル・診断ディシジョンツリーの正本は
`docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`。
`secret-provisioning.md` からこの SSOT へリンクし、「鮮度ゲートが失効 6h 前に loud fail する」運用注記を追記する。

## 視覚証跡

| 項目 | 内容 |
|---|---|
| 視覚証跡の有無 | **UI/UX 変更なしのため Phase 11 スクリーンショット不要**（撮影対象の画面・スタイル・導線が存在しない） |
| 代替証跡の参照先 | `phase-10-final-review.md` / `phase-11-manual-test.md` / focused test output |

## Phase 12 成果物

| ファイル | 役割 |
|---|---|
| `implementation-guide.md` | 2 パート構成（Part 1 概念説明 + Part 2 技術詳細）+ 視覚証跡セクション |
| `system-spec-update-summary.md` | aiworkflow 正本への反映要否判定と same-wave sync |
| `documentation-changelog.md` | ドキュメント変更ログ |
| `unassigned-task-detection.md` | スコープ外項目の未タスク候補列挙（0 件でも出力必須） |
| `skill-feedback-report.md` | skill 改善点（なしでも出力必須） |
| `phase12-task-spec-compliance-check.md` | canonical headings / Phase 11 evidence 表 / workflow root scan の compliance チェック |

## system spec 更新判定

| 観点 | 判定 |
|---|---|
| 新規インターフェース追加の有無 | あり（`auth-token-expired` / `auth-secret-drift`、`classifyBearerFreshness` / `explainAuthFailureFromBearer`） |
| 判定 | **Step2 該当** |
| 実施タイミング | 本改善サイクルで aiworkflow 正本（deployment secret / task workflow / artifact inventory）へ反映する |

## 参照資料

| 参照資料 | パス | 内容 |
|---|---|---|
| SSOT | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` | reason 4 値 / TTL / 同期不変条件 |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | session JWT 設計 |
| 認証/セキュリティ core | `.claude/skills/aiworkflow-requirements/references/architecture-auth-security-core.md` | session 検証境界 |
| セキュリティ運用 | `.claude/skills/aiworkflow-requirements/references/security-operations.md` | secret 取り扱い |

## 成果物

- 本ファイル（`phase-12-documentation.md`）: Part 1 概念説明 / Part 2 技術詳細 / 視覚証跡 / 6 成果物列挙 / system spec 更新判定。
- `outputs/phase-12/` の 6 成果物（本改善サイクルで生成）。

## 完了条件

- [x] Part 1 が中学生レベルの例え話（合言葉が時間で期限切れ）で構成されている。
- [x] Part 2 に関数シグネチャ / reason 値一覧 / workflow step / env / エラーハンドリング / SSOT リンクがある。
- [x] 視覚証跡セクションで「UI/UX 変更なしのため Phase 11 スクリーンショット不要」を明記している。
- [x] Phase 12 の 6 成果物を列挙し、本改善サイクルで生成することを明記している。
- [x] system spec 更新判定（Step2 該当・本改善サイクルで実施）を記録している。
