# Phase 4: Test Creation（テスト作成 / RED 設計）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 前提 | phase-01 / phase-02 / phase-03 |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| Phase の主旨 | 新規テスト追加ではなく、**既存 651 spec を vitest 3.2.6 で走らせて RED（fail）を採取し C1〜C8 へ分類する** |

## TDD RED の読み替え（依存アップグレード特有）

通常の機能開発では「RED = 仕様を満たさない新規テストを先に書いて落とす」が、本タスクは**依存ライブラリのメジャーアップグレード**であり新機能を持たない。したがって本 Phase の RED は次のように読み替える:

> **RED = vitest を `^3.2.6` へ bump した状態で既存 651 spec を実行し、v2→v3 の破壊的変更（C1〜C8）に起因して fail するテストを観測・記録すること。**

- 新しい `*.spec.ts` は作らない（不変条件: test file は既存資産の維持が目的）。
- RED の対象は「既に存在するテスト」であり、GREEN（Phase 5 実装）で**期待値・モック設定・config・閾値**を最小修正して回復させる。
- RED が **ゼロ件**（破壊的変更の影響を受けるテストが無い）であれば、それ自体が望ましい観測結果であり、Phase 5 は version bump + lockfile 確認のみで完了する。

> 本 Phase は「fail を採取する手順と分類の枠組み」を確定するもので、実 fail の修正は Phase 5 が担う。RED 採取は Phase 5 の Step 1（bump）完了後に同一サイクル内で実行する。

## RED 採取手順（shard 別）

RED 採取は CI shard の単位に揃え、各 shard を独立実行して fail をカテゴリタグ付けする。実行は全て `mise exec --` 経由で Node 24.15.0 / pnpm 10.33.2 を固定する。

| shard | spec 数 | 実行コマンド（bump 後に実行） | fail 分類タグ付けの観点 |
| --- | --- | --- | --- |
| api-unit | 198（d1 を除く） | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api` | `toThrow`/`toEqual` の比較厳格化（C1）、spy/mockReset（C2）、fakeTimers（C3） |
| api-d1 | （api 198 の D1 系） | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api` | `pool: forks`/`singleFork` 下の fakeTimers（C3）。port exhaustion が起きないことも観測 |
| web | 348 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web` | C1/C2 中心 + react alias / optimizeDeps が壊れていないこと |
| og | 6 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og` | C1 中心（小規模） |
| packages | 33 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts packages` | C1 中心 |
| scripts | 56 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts` | C1 中心。`vitest` 実行系の spec（coverage-threshold-lint 等）に C6/C7 が混在しうる |
| infra | 10 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts infra` | C1 中心（cloudflare-alerts / sentry-alerts） |

> `--root=.` はワークツリールートを指す（root の `package.json` から実行する場合）。apps/* の package.json script は `--root=../..` を用いるため、apps 内から実行する場合は既存 script（`pnpm --filter @ubm-hyogo/api test` 等）をそのまま使ってもよい。**重要なのは config の対応（unit=`vitest.config.ts` / D1=`vitest.d1.config.ts`）を崩さないこと**。
>
> fail 分類は各 shard 出力の `FAIL` 行から、後述の「fail 分類テーブル」のカテゴリ（C1〜C8）を該当テストごとに付与し、Phase 5 の修正対象一覧に転記する。

## 事前検出 grep コマンド（config 非推奨 / C8 記法の有無確認）

bump 前後どちらでも実行可能な静的検出。**現 config が C4/C5 の非推奨 API を使っていないこと**と、**C8 の第3引数オブジェクト記法の有無**を機械的に確定する。

```bash
# --- C4: deps.inline 非推奨の使用有無（config に記述があれば要対応 / 無ければ警告ゼロ確認のみ） ---
grep -rn "deps.inline\|inline:" vitest.config.ts vitest.d1.config.ts || echo "OK: deps.inline 記述なし（C4 影響なし）"

# --- C5: workspace 非推奨（v3.2 で projects へ改名推奨）の使用有無 ---
grep -rn "workspace" vitest.config.ts vitest.d1.config.ts vitest.workspace.* 2>/dev/null || echo "OK: workspace 記述なし（C5 影響なし）"

# --- C8: test/it/describe の第3引数オブジェクト記法（v4 で throw 予定）の検出 ---
# 例: test('name', fn, { retry: 2 }) / it('name', fn, { timeout: 1000 })
grep -rnE "(test|it|describe)\([^)]*,[^)]*,[[:space:]]*\{" --include="*.spec.ts" --include="*.spec.tsx" . || echo "OK: 第3引数オブジェクト記法なし（C8 影響なし）"

# --- 参考: 第3引数に数値 timeout を渡す正当な記法（C8 非該当）と区別するため目視確認 ---
grep -rnE "(test|it)\([^)]*,[^)]*,[[:space:]]*[0-9]" --include="*.spec.ts" --include="*.spec.tsx" . | head -20
```

> C8 の grep は誤検出（第3引数が timeout 数値の正当な記法）を含みうるため、ヒット時は目視で「オブジェクト `{ ... }` を渡しているか」を確認する。オブジェクト記法のみが C8 対象（v3 では警告・動作はする）。

## fail 分類テーブル（RED テストケース ID と想定 fail）

RED 採取で観測されうる典型 fail を、テスト ID 形式 `RED-C{n}-{seq}` で事前カタログ化する。**実 fail の有無は bump 後の実行で確定する**が、Phase 5 はこのカタログに沿って分類・修正する。

| RED ID | カテゴリ | 想定 fail の典型例 | v2→v3 で何が変わるか | Phase 5 の修正方針 |
| --- | --- | --- | --- | --- |
| RED-C1-01 | C1 | `expect(() => fn()).toThrow(Error)` だが実際は `TypeError`（`Error` のサブクラス）を投げる | v3 は `toThrow`/`toThrowError` で error の **prototype/name まで** 比較。`Error` 指定に `TypeError` 実体が来ると不一致で fail | テスト期待値を `toThrow(TypeError)` へ、またはメッセージ文字列マッチ `toThrow(/...msg.../)` へ修正 |
| RED-C1-02 | C1 | `expect(actualError).toEqual(new Error('x'))` で `cause` 付きの error と比較 | v3 は `toEqual` が error の `cause`/`name` まで比較。`cause` 差異で fail | 期待 error を実体に合わせる（`cause` を含めて構築）か、`expect(err.message).toBe('x')` へ分解 |
| RED-C1-03 | C1 | カスタムエラー（`class ValidationError extends Error`）の throw を `toThrow(Error)` で許容していた | prototype 比較で `ValidationError` を `Error` 期待に通していたものが厳格化で挙動変化（メッセージ比較に依存） | 期待値をカスタムエラー型へ明示（`toThrow(ValidationError)`） |
| RED-C2-01 | C2 | `vi.spyOn(obj, 'method')` を 2 度呼び、2 度目で新規モックが作られる前提のテスト | v3 は既にモック済みメソッドへの `vi.spyOn` が**既存モックを再利用**。新規 mock を期待すると呼び出し履歴が想定外 | `beforeEach` で `vi.restoreAllMocks()`、または明示 `mockReset()`/`mockRestore()` を見直し |
| RED-C2-02 | C2 | `mockReset()` 後に元実装が呼ばれない前提（v2 は undefined 返し） | v3 は `mockReset()` が **元の実装へ復帰** する（spy の場合）。リセット後に実関数が走り副作用が変化 | 元実装復帰を断ちたいなら `mockReset` ではなく `mockImplementation(() => ...)` で空実装を再設定 |
| RED-C3-01 | C3 | `vi.useFakeTimers()` 後に `process.nextTick`/`queueMicrotask` が fake 化される前提 | v3 は既定で `nextTick`/`queueMicrotask` を **fake 化しない**。これらに依存した時間制御が効かず fail | `vi.useFakeTimers({ toFake: ['nextTick', 'queueMicrotask', ...] })` で対象を明示。ただし `--pool=forks`（D1）では `nextTick` モック不可のため設計を見直す |
| RED-C3-02 | C3 | D1 shard（`pool: forks`）で `nextTick` を fake 化しようとして失敗 | forks pool では `nextTick` をモックできない（v3 制約） | D1 テストは `nextTick` 非依存へ書き換え、または当該テストを unit（threads）側へ移すなど設計調整（プロダクトコードは触らない） |

> C6（coverage `ignoreEmptyLines` 由来の閾値ずれ）と C7（`@vitest/*` バージョン不一致警告）は spec の `FAIL` ではなく**カバレッジゲート/警告ログ**として現れるため、上表の RED 採取ではなく Phase 5 Step 2（バージョン整合）/ Step 6（閾値）で扱う。

## ローカル実行コマンド一覧

```bash
# 0) bump 後の前提（Phase 5 Step 1-2 完了が前提）
mise exec -- pnpm install                 # lockfile 再生成
mise exec -- pnpm why vitest              # 解決バージョンが 3.2.6 系で一致するか
mise exec -- pnpm why @vitest/coverage-v8 # vitest と同一バージョンか

# 1) shard 別 RED 採取（fail をカテゴリタグ付けして記録）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api    # api-unit
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api # api-d1
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web    # web
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og     # og
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts packages    # packages
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts     # scripts
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts infra       # infra

# 2) 静的検出（C4/C5/C8）
grep -rn "deps.inline\|inline:" vitest.config.ts vitest.d1.config.ts || echo "OK: C4 なし"
grep -rn "workspace" vitest.config.ts vitest.d1.config.ts || echo "OK: C5 なし"
grep -rnE "(test|it|describe)\([^)]*,[^)]*,[[:space:]]*\{" --include="*.spec.ts" --include="*.spec.tsx" . || echo "OK: C8 なし"

# 3) deprecation 警告の採取（stderr を含めて確認）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"
```

## 完了条件

- [ ] 「依存アップグレードにおける RED の読み替え」が記載されている
- [ ] shard 別（api-unit / api-d1 / web / og / packages / scripts / infra）の RED 採取手順と実行コマンドが記載されている
- [ ] C4/C5/C8 の事前検出 grep コマンドが具体的に記載されている
- [ ] fail 分類テーブル（`RED-C1-01` 等の ID で C1〜C3 の典型 fail を 3 件以上）が記載されている
- [ ] ローカル実行コマンド一覧（コメント付き）が記載されている
- [ ] RED の分類結果が Phase 5 の修正対象一覧へ転記される導線が示されている
