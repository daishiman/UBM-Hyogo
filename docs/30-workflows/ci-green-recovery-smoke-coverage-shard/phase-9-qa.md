# Phase 9: 品質保証（QA）

3 lane の実装が緑になる前提条件を、コミット前にローカルで検証する手順と結果として記録する。本サイクルでは mint parity Vitest、runtime smoke shell unit、構文検査を実行済み。remote CI でしか確定できない runtime-smoke / coverage-gate は user-gated 観測として Phase 11 に残す。

> Phase 3 R-6 の引き継ぎ: top-level `permissions` 追加が既存 job の token を縮退させないかを **actionlint + job 別 permissions 突合**で必須チェックする（§3）。

---

## 1. QA gate 一覧（PASS 基準表）

| # | gate | 実行コマンド（expected） | 対象 | PASS 基準（expected） |
|---|---|---|---|---|
| G-1 | typecheck | `mise exec -- pnpm typecheck` | 全 workspace（mint helper `.mts` 含む） | exit 0。`mint-staging-bearers.mts` の `MintedBearers` 型・`@ubm-hyogo/shared` import が型解決。エラー 0 件 |
| G-2 | lint | `mise exec -- pnpm lint` | 全 workspace + scripts | exit 0。`--fix` 適用後も残違反 0。新規 `.mts` / `.spec.ts` が lint 対象に含まれる |
| G-3 | mint parity unit | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | mint helper | 全 case PASS。mint→`verifySessionJwt` で admin=`isAdmin:true` / me=`isAdmin:false`、必須 env 欠落 case で `exit 2` 相当のエラー（AC-2/AC-4） |
| G-4 | shell reason unit | Phase 6 で定めた shell unit（`classify_failure_reason` 単体） | smoke runner | 401→`auth-token-invalid-or-expired` / 403→`auth-not-admin` / 500→`auth-secret-binding-missing` を返す。既存 reason の回帰なし |
| G-5 | actionlint（ci.yml） | `actionlint .github/workflows/ci.yml` | Lane B/C workflow | exit 0。top-level `permissions` 構文・step 順序入れ替え後の YAML が valid |
| G-6 | actionlint（runtime-smoke） | `actionlint .github/workflows/runtime-smoke-staging.yml` | Lane A workflow | exit 0。mint step / setup-project step / fallback `if:` 条件が valid |
| G-7 | permissions 突合 | actionlint 結果 + 目視 + grep（§3） | 両 workflow | top-level `contents: read` 追加で既存 job の write 系 permissions が縮退していない（R-6） |
| G-8 | shellcheck | `shellcheck scripts/smoke/runtime-attendance-provider.sh scripts/coverage-guard.sh scripts/smoke/mint-staging-bearers.mts`（.sh のみ） | 修正 .sh | `.sh` 2 本で exit 0（または既存 baseline と同等）。`classify_failure_reason` 抽出による新規 warning 0 |
| G-9 | redaction grep gate | §4 の grep 群 | helper / runner / workflow | JWT 文字列・署名鍵・secret 実値が console echo / log 経路に現れない。`::add-mask::` が mint 値に適用される構造であること |

> G-3 の vitest 実行はタスクが `pnpm exec tsx ...` を想定する場合でも、`.spec.ts` は vitest runner で実行する（CLAUDE.md 不変条件 #8: `*.spec.ts`）。helper 本体は `tsx` 実行、テストは vitest という分担。

---

## 2. 実行手順（順序）

1. `mise exec -- pnpm install`（依存確定。worktree 独立の `node_modules` のため必須）
2. `mise exec -- pnpm typecheck`（G-1）
3. `mise exec -- pnpm lint`（G-2。失敗時はまず `pnpm lint --fix`）
4. `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts`（G-3）
5. Phase 6 の shell unit（G-4）
6. `actionlint`（G-5/G-6）→ permissions 突合（G-7）
7. `shellcheck`（G-8）
8. redaction grep gate（G-9）

いずれかが FAIL の場合は Phase 8 / Phase 5 へ差し戻し、修正後に該当 gate から再実行する。

---

## 3. actionlint + job 別 permissions 突合（R-6 引き継ぎ・必須）

top-level `permissions: contents: read` の追加は、GitHub Actions 仕様上 **job が個別 `permissions` を持たない場合のみ default を上書きする**。本タスクの懸念は「top-level 追加により write が必要な既存 job のトークンが縮退しないか」。

### 3.1 突合手順（expected）

| 手順 | 内容 | 期待結果 |
|---|---|---|
| P-1 | `actionlint .github/workflows/ci.yml` | exit 0。permissions ブロックの構文エラーなし |
| P-2 | ci.yml の各 job の `permissions:` 有無を列挙（grep `^\s\spermissions:` 相当でブロック範囲確認） | write を要する job（もしあれば）は **job 個別 permissions を保持**しており top-level の `contents: read` に飲み込まれない |
| P-3 | ci.yml の job が typecheck / lint / coverage 系のみで write 操作（push / release / deploy / PR comment）を含まないことを確認 | write 系 step なし → `contents: read` で十分（Phase 3 R-6 結論） |
| P-4 | `runtime-smoke-staging.yml` の既存 top-level `permissions: contents: read`（L15-16）と整合 | 2 workflow で permissions 表現が一貫。Lane A workflow の job token が縮退していない |

### 3.2 縮退検知の合格条件

- ci.yml に write 系操作（`actions/upload-artifact` は artifact API であり `contents` write を要さない点に注意）が無いこと。artifact upload/download は `actions: read/write` ではなく専用 API のため `contents: read` で動作する。
- もし将来 write を要する job が ci.yml に存在する場合は、その job に明示 `permissions:` を付与し top-level に依存させない（本タスク時点では非該当）。

---

## 4. redaction grep gate（G-9 詳細・secret 非露出の検証）

mint した JWT・署名鍵・secret 実値が log / 成果物 / docs に出ないことを構造的に検証する。**実値の grep は行わず、危険な出力経路の不在を grep する**。

| 検査 | 内容（expected） | 合格基準 |
|---|---|---|
| C-1 | mint helper が JWT を console へ echo する経路の不在（`console.log`/`process.stdout.write` で bearer 変数を出していない） | 該当 0 件。出力は `GITHUB_OUTPUT`/`GITHUB_ENV` 追記のみ |
| C-2 | workflow の mint step が `::add-mask::` を mint 値に適用してから `GITHUB_ENV` へ export する順序 | mint→mask→export が同一 step に閉じている（レース不在・Phase 2 §1.2 R-1） |
| C-3 | runner の reason 出力が redact 済み body 由来で、生の bearer / `authorization` ヘッダ値を log しない | reason は `jq` の `.error` 種別のみ。bearer 文字列の log 経路 0 件 |
| C-4 | runbook（secret-provisioning.md）に署名鍵・JWT 実値が転記されていない | op 参照（`op://...`）と手順のみ。実値 0 件 |
| C-5 | 仕様書（本ワークフロー docs 全体）に secret 実値・JWT・鍵が無い | 0 件（不変条件 3） |

---

## 5. 完了条件（DoD）

- [ ] G-1〜G-9 が PASS 基準付きの表で定義されている
- [ ] `mise exec --` 経由のコマンドが明記されている
- [ ] actionlint で ci.yml / runtime-smoke-staging.yml の両方を検証する手順がある（R-6）
- [ ] top-level permissions 追加と job 別 permissions の突合手順（§3）がある
- [ ] shellcheck の対象 `.sh` が列挙されている
- [ ] redaction grep gate（§4）が secret 非露出の検証として定義されている
- [ ] すべて「実行結果」ではなく「expected な QA 手順」として記述されている

## 成果物

- `outputs/phase-9/qa.md`（本 Phase の確定事項サマリ）
