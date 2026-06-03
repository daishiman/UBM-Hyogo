# Lessons Learned — issue-1054-wrangler-binding-drift-ci-gate（2026-06-02）

> task: `docs/30-workflows/completed-tasks/issue-1054-wrangler-binding-drift-ci-gate/`（implementation, NON_VISUAL, implemented_local_evidence_captured）
> issue: #1054（= issue-57-followup-001）CLOSED のまま。reopen / 本文 mutation は user-gated
> 起点 spec: `docs/30-workflows/completed-tasks/issue-57-followup-001-wrangler-binding-drift-ci-gate.md`（consumed → completed-tasks へ co-locate）
> 親 workflow: `docs/30-workflows/completed-tasks/issue-57-kv-r2-guardrail-degrade-design/`
> 関連 source: `scripts/verify-wrangler-binding-drift.mjs`、`scripts/__tests__/verify-wrangler-binding-drift.spec.ts`、`.github/workflows/verify-wrangler-binding-drift.yml`、`apps/api/wrangler.toml`、`apps/api/src/env.ts`
> 関連 reference: [deployment-cloudflare.md](deployment-cloudflare.md)（Current Cloudflare binding inventory = machine-checked SSOT）、[workflow-issue-1054-wrangler-binding-drift-ci-gate-artifact-inventory.md](workflow-issue-1054-wrangler-binding-drift-ci-gate-artifact-inventory.md)

| ID | Lesson |
| --- | --- |
| L-I1054-001 | TOML ライブラリはコメント行を構文上無視し `applied:false`（コメントアウト block）を区別できない → 行走査の自作軽量パーサで `# [[...]]` + `# binding = "..."` を `applied:false` として明示捕捉する |
| L-I1054-002 | 棚卸し表 state 列は自由記述で表記揺れが大きい → `active` / `not-applied` / `optional-or-commented` の 3 値へ正規化し、未知語は warning に降格して誤 fail を避ける |
| L-I1054-003 | env-prefixed binding（`[[env.production.*]]` / `[[env.staging.*]]`）は同名で複数行存在 → `kind:name` キーの upsert で 1 エントリに集約し envs 配列を union する |
| L-I1054-004 | コメントアウト binding を active と同基準で突合すると過検出 → 突合は `applied:true` のみを対象にする片方向突合とし、`applied:false` は fail させない（AC-5） |
| L-I1054-005 | `env.ts` を正規表現で抽出すると secrets property（`wrangler secret put` 起源・toml binding 無し）が混入する → binding 突合対象を D1/Analytics/R2/KV/Queue に限定し secrets を誤検出しない（AC-6） |
| L-I1054-006 | binding 名だけ一致しても Kind 不一致は実害（access 時 runtime error）→ `INVENTORY_KIND_MISMATCH` を追加し棚卸し Kind と wrangler 種別の完全一致を要求する（AC-4） |
| L-I1054-007 | gate を CI へ入れる前に現存ドリフト（`MEMBER_PHOTOS` 棚卸し欠落）を同一 wave で是正しないと即 fail する → 「棚卸し表追記 → gate 実装 → CI 配線」順で現行 repo を exit 0 化して landing する（AC-10） |
| L-I1054-008 | read-only 制約（不変条件 #5/#7・AC-7）は人手 review で漏れる → `writeFileSync`/`fetch`/`child_process` を grep する gate を回帰に組み込み、`import.meta.url` ガードで pure function を CLI 副作用から分離する |

## 教訓一覧

### L-I1054-001: コメントアウト block の applied 判定は TOML ライブラリでなく自作行パーサで行う

- **症状**: `@iarna/toml` 等の TOML パーサライブラリでは `# [[env.production.r2_buckets]]` のようなコメントアウト block を「存在しない」と判定し、`applied: true / false` を区別できない。
- **原因**: TOML パーサは AST を返す設計で、構文上のコメントをメタ情報として保持しない。binding の applied 状態は「コメント行の有無」という字句レベルの情報に依存する。
- **対策**: 行走査ベースの軽量パーサを自作し、先頭の `#` を capture（例 `/^(#\s*)?\[\[([^\]]+)]]/`）して `applied:false` を明示捕捉する。Phase 2 で行走査ロジックを固定し、env-prefix 正規化と applied 判定を 1 pass で完成させる。
- **一般化**: 「コメントアウトされた宣言」を意味のある状態（予約・無効化）として扱う検出 gate では、ライブラリ AST でなく字句レベルの自作パーサが必要になる。

### L-I1054-002: 自由記述の棚卸し state 列は 3 値正規化 + 未知語 warning にする

- **症状**: `deployment-cloudflare.md` の state 列は「production/staging active in ...」「not applied」「optional; ...」など表記揺れが大きく、固定値判定だと表記違いの行が誤 fail / silent 無視される。
- **原因**: マークダウン棚卸し表は人手記述でフォーマットを強制しない。将来の state 表現追加時に既存 entries も新分類に晒され、「未知 state = fail」だと保守性が落ちる。
- **対策**: `normalizeInventoryState(rawState)` を pure function 化し `active` / `not-applied` / `optional-or-commented` の 3 値へ正規化、未分類は `unknown` として warning に降格。drift 判定は active のみ対象にし unknown は誤 fail させない。表記追加は regex 追記で対応。
- **一般化**: 人手記述ドキュメントを機械検出の SSOT にするときは、正規化関数を pure function として test 対象化し、未知入力は fail でなく warning にして誤検出を避ける。

### L-I1054-003: env-prefixed 重複 binding は upsert で 1 エントリに集約する

- **症状**: `[[env.production.r2_buckets]]` / `[[env.staging.r2_buckets]]` で同名 `binding = "MEMBER_PHOTOS"` が 2 行存在し、単純ループだと重複エントリが生成され突合が「同じ binding が 2 件」と混乱する。
- **原因**: env-prefixed binding は環境ごとに同名で複数存在し得る（prod/staging で同じ binding を使う意図）。
- **対策**: `kind:name` をキーにした `upsertBinding(map, next)` で既存があれば envs 配列を union、無ければ新規 entry を作る。結果は `[...map.values()].sort()` で deterministic に。test で「prod/staging 2 行 → 1 エントリ envs=['production','staging']」を固定。
- **一般化**: 同一論理エンティティが複数行に分散し得る入力は、論理キーで upsert して 1 エントリへ畳み込む。

### L-I1054-004: 突合は applied:true のみを対象にする片方向突合にする

- **症状**: コメントアウト binding（`# [[env.*.kv_namespaces]]`）を active と同基準で env.ts / 棚卸し表と突合すると、optional property や optional 行があっても過検出になる。
- **原因**: commented-out binding（`applied:false`）は「将来有効化を想定した予約欄」で、現時点では使用していない。Env mandatory 化も棚卸し記載も不要が正常。
- **対策**: `reconcile()` を `applied:true` の binding のみ active 扱いに限定し、`applied:false` は warning level に降格（AC-5）。test で「コメント block + Env optional + 棚卸し optional/commented = pass」を固定。
- **一般化**: 「宣言が存在するか」でなく「適用されているか」を軸に突合し、未適用宣言は将来予約として fail させない。

### L-I1054-005: binding 突合から secrets（toml binding を持たない Env property）を除外する

- **症状**: `env.ts` に `R2_ACCOUNT_ID?: string` 等の secrets property が混在し、`readonly <NAME>?:` を正規表現抽出すると secrets が binding 突合に混入して false positive を生む。
- **原因**: binding（wrangler.toml で declare → Env 型 → code access）と secret（`gh secret set` / `wrangler secret put` → Env 型のみ）は SSOT が異なる。
- **対策**: `reconcile()` の env.ts 突合・棚卸し突合を D1/Analytics/R2/KV/Queue の Cloudflare binding に限定し、棚卸し inventory に binding として列挙されていない property は突合対象外にする（AC-6）。test fixture に secrets を含めて回避を固定。
- **一般化**: 複数 SSOT が同じ型定義に同居する場合、突合は「対象 SSOT に属するエントリ」へ明示的に絞り込む。

### L-I1054-006: binding 名一致だけでなく Kind 一致も検証する（INVENTORY_KIND_MISMATCH）

- **症状**: 棚卸し表に `MEMBER_PHOTOS | R2 bucket` とあるのに wrangler 側で誤って `kv_namespaces` に定義された場合など、名前一致だけでは見逃す。
- **原因**: 棚卸し表が「機械検出 SSOT」と認識されていないと、手動 entry の Kind ズレが gate を通過し、binding access 時に runtime error となる（型チェックでは catch されない）。
- **対策**: AC-4 として `INVENTORY_KIND_MISMATCH` を追加。棚卸し側も `normalizeInventoryKind()` で D1/Analytics/R2/KV/Queue に正規化し wrangler 側 kind との完全一致を要求。test で「wrangler=R2 / inventory=KV」fixture を入力して検出を固定。
- **一般化**: 名前を主キーにする突合では、付随する種別（Kind）も突合対象に含めないと型レベルの偽陽性一致を見逃す。

### L-I1054-007: 現存ドリフトを同一 wave で是正してから gate を landing する

- **症状**: issue-1054 は「将来ドリフト防止」を目的にしていたが、着手時点で `MEMBER_PHOTOS`（issue-983）の 3 者ドリフトが既に顕在化しており、gate を先に CI へ入れると即 fail する。
- **原因**: 棚卸し表は gate の source of truth なので、欠落行があると gate を deploy した瞬間に fail する順序依存がある。
- **対策**: spec-created → implementation の同一 wave で「棚卸し表へ `MEMBER_PHOTOS` 追記」と「gate 実装」と「CI 配線」を同時に行い、現行 repo で `pnpm verify:wrangler-binding-drift` exit 0 を確定（AC-10）。`implemented_local_evidence_captured` を artifacts に記録して現存ドリフト消滅を evidence 化。
- **一般化**: 検出 gate を導入する際は「gate 実装」と「現存違反の是正」を同一 PR で完成させ、landing 時点で green を担保する（宣言 → 型 → 棚卸しの 3 点セットを同時更新する運用 norm 化）。

### L-I1054-008: read-only 制約は grep gate と import ガードで機械担保する

- **症状**: binding drift 検出は read-only 解析（AC-7 / 不変条件 #5・#7）で完結すべきだが、実装中に誤って `writeFileSync` や `fetch` を混入させるリスクが人手 review で見落とされやすい。
- **原因**: `readFileSync(...).replace().split()` の連鎖の中に副作用 API が紛れても目視で気づきにくい。
- **対策**: Phase 9 quality gate / Phase 11 smoke で `rg -n "writeFileSync|writeFile|appendFile|fetch\(|child_process|execSync|spawn" scripts/verify-wrangler-binding-drift.mjs` のヒット 0 を自動検証。`import.meta.url` + `pathToFileURL` ガードで CLI 実行を pure function の副作用から分離し、vitest から import しても副作用が走らない構造を test で固定。
- **一般化**: 「read-only であること」を AC にした tooling は、副作用 API を grep する回帰 gate と import-safe なエントリポイント分離で機械的に担保する。

## 同期した正本

| 種別 | パス | 反映内容 |
| --- | --- | --- |
| Reference | [deployment-cloudflare.md](deployment-cloudflare.md) | Current Cloudflare binding inventory を machine-checked SSOT と明記し `DB` / `SYNC_ALERTS` / `MEMBER_PHOTOS` 行を追加（現存ドリフト是正） |
| Reference | [task-workflow-active.md](task-workflow-active.md) | wrangler binding drift gate / read-only 制約 / implementation targets を正本化 |
| Reference | [workflow-issue-1054-wrangler-binding-drift-ci-gate-artifact-inventory.md](workflow-issue-1054-wrangler-binding-drift-ci-gate-artifact-inventory.md) | 成果物台帳 + Lessons Learned 節 |
| Index | indexes/resource-map.md / quick-reference.md | `2026-06-02` 行を completed-tasks パスで登録 |
| Changelog | SKILL-changelog.md / SKILL.md | `v2026.06.02-issue1054-wrangler-binding-drift-ci-gate` |
| LOGS | LOGS/_legacy.md | 最新更新ヘッドライン |

## 境界 / user gate

commit、push、PR 作成、GitHub Issue #1054 の本文・状態 mutation は未実行で user-gated。本ワークフローはローカル実装・検証・skill 同期までで完結する。
