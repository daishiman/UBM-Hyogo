# Phase 4: Test Creation（テスト作成 / RED 設計）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-03-design-review.md（PASS 判定済み） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| Phase の主旨 | 新規テスト追加ではなく、**既存 693 spec を vitest 4.1.8 で走らせて RED（fail）を採取し C1〜C8（v4 版）へ分類する** |

## TDD RED の読み替え（依存アップグレード特有）

通常の機能開発では「RED = 仕様を満たさない新規テストを先に書いて落とす」が、本タスクは**依存ライブラリのメジャーアップグレード**であり新機能を持たない。したがって本 Phase の RED は次のように読み替える:

> **RED = Lane 0（bump + 確定設定修正 C1/C5/C7）完了後の状態で既存 693 spec を実行し、v3→v4 の破壊的変更（主に C2〜C4）に起因して fail するテストを観測・記録すること。**

- 新しい `*.spec.ts` は作らない（既存テスト資産の green 維持が目的。index.md スコープ外）。
- v4 は v3 と異なり **bump 単体で起動不能になる確定破壊**（C1: pool API 削除 / CLI `--minWorkers` 削除、C5: plugin-react peer、C7: exact pin）を含むため、**RED 採取は Phase 5 の Lane 0（確定修正）完了後**に行う。Lane 0 を先行させることで「起動不能 fail（ノイズ）」と「挙動変化 fail（観測対象）」が分離される（Phase 2 / Phase 3 の設計通り）。
- RED の対象は「既に存在するテスト」であり、GREEN（Phase 5 実装）で**期待値・モック設定・snapshot・config・閾値**を最小修正して回復させる。
- RED が **ゼロ件**であれば、それ自体が望ましい観測結果であり、Phase 5 の Lane A/B/C は通過確認のみで完了する。
- C2（coverage 数値変動）は spec の `FAIL` ではなく**カバレッジゲートの赤化**として現れるため、Phase 7 の実測設計で扱う。本 Phase では各 shard の coverage 実行が完走することのみ確認する。

> 本 Phase は「fail を採取する手順と分類の枠組み」を確定するもので、実 fail の修正は Phase 5 が担う。RED 採取は Phase 5 の Lane 0 完了後に同一サイクル内で実行する。

## Phase 4 開始前チェック（esbuild / worktree 起動前検証 — FB-MSO-002）

worktree 環境では esbuild arch mismatch / node_modules 非分離により vitest が**起動前に**停止することがある（issue-747 runbook）。RED 採取の前に必ず以下を通す:

```bash
# 1) 依存インストール（worktree ごとに node_modules 独立）
mise exec -- pnpm install

# 2) vitest runtime の 3 verify（node arch / worktree isolation / esbuild version）
mise exec -- pnpm verify:vitest-runtime
```

- いずれかが fail した場合は `mise exec -- pnpm install --force` で復旧し、再度 `verify:vitest-runtime` を通してから RED 採取に進む（詳細復旧手順: `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md`）。
- ここで観測される fail は v4 破壊的変更とは**無関係**（環境起因）であり、C1〜C8 の分類対象に含めない。

## RED 前の事前 grep タスク（静的検出）

bump 前後どちらでも実行可能な静的検出。RED 観測の前に影響範囲を機械的に見積もり、結果（ヒット件数・所在）を記録する。

### (a) C8 残党 grep（削除/改名オプションの使用有無）

現行 config / テストは**いずれも未使用**と調査済み（phase-02 C8）。grep で「未使用」を証跡化する。

```bash
# C8-1: workspace / defineWorkspace / vitest.workspace.*（v4 で削除 → projects へ）
grep -rn "defineWorkspace\|vitest\.workspace" vitest.config.ts vitest.d1.config.ts package.json apps packages scripts infra 2>/dev/null || echo "OK: workspace 系なし"
ls vitest.workspace.* 2>/dev/null || echo "OK: vitest.workspace.* ファイルなし"

# C8-2: poolMatchGlobs / environmentMatchGlobs（v4 で削除）
grep -rn "poolMatchGlobs\|environmentMatchGlobs" vitest.config.ts vitest.d1.config.ts || echo "OK: MatchGlobs なし"

# C8-3: deps.external / deps.inline / deps.fallbackCJS（v4 で削除）/ deps.optimizer.web（→ client）
grep -rn "deps\.external\|deps\.inline\|fallbackCJS\|optimizer\.web" vitest.config.ts vitest.d1.config.ts || echo "OK: deps 系残党なし"

# C8-4: basic reporter（v4 で削除）
grep -rn "basic" vitest.config.ts vitest.d1.config.ts package.json apps/api/package.json apps/og/package.json .github/workflows 2>/dev/null | grep -i "reporter" || echo "OK: basic reporter なし"

# C8-5: test()/describe() 第3引数オブジェクト記法（v4 で throw）
grep -rnE "(test|it|describe)\([^)]*,[^)]*,[[:space:]]*\{" --include="*.spec.ts" --include="*.spec.tsx" apps packages scripts infra || echo "OK: 第3引数オブジェクト記法なし"

# C8-6: 型 UserConfig（v4 で ViteUserConfig へ。Node 系型は vitest/node から）
grep -rn "UserConfig" vitest.config.ts vitest.d1.config.ts || echo "OK: UserConfig 型 import なし"
```

> C8-5 の grep は第3引数に timeout 数値を渡す正当な記法と区別できないため、ヒット時は目視で「オブジェクト `{ ... }` を渡しているか」を確認する。オブジェクト記法のみが C8 対象（v4 で throw）。

### (b) snapshot 所在 grep（C4 影響範囲の事前見積もり）

```bash
# snapshot を使う spec の所在（C4: [MockFunction spy] → [MockFunction] 差分の影響候補）
grep -rln "toMatchSnapshot\|toMatchInlineSnapshot" --include="*.spec.ts" --include="*.spec.tsx" apps packages scripts infra || echo "OK: snapshot 使用 spec なし"

# 外部 snapshot ファイルの所在（obsolete 残骸の清掃対象候補。v4 は CI 上の obsolete snapshot で fail）
find apps packages scripts infra -type d -name "__snapshots__" -not -path "*/node_modules/*" 2>/dev/null || echo "OK: __snapshots__ なし"
```

### (c) mock/spy 挙動変更の使用箇所 grep（C3 影響範囲の事前見積もり）

```bash
# C3 直撃候補: restoreAllMocks の限定化 / restoreMocks config / invocationCallOrder 1 始まり / getMockName 既定変更
grep -rn "vi\.restoreAllMocks\|restoreMocks\|invocationCallOrder\|getMockName" \
  --include="*.spec.ts" --include="*.spec.tsx" --include="*.ts" \
  apps packages scripts infra vitest.config.ts vitest.d1.config.ts || echo "OK: C3 直撃 API の使用なし"
```

> ヒットした spec は RED 採取時に優先して結果を確認し、fail しなくても「v4 挙動変更の影響を受けうる箇所」として記録に残す（fail しない = 影響なし、で確定してよい）。

## RED 採取手順（shard 別）

RED 採取は CI shard + ローカル補助 suite の単位に揃え、各 shard を独立実行して fail をカテゴリタグ付けする。実行は全て `mise exec --` 経由で Node 24.15.0 / pnpm 10.33.2 を固定する。

| shard | spec 数 | 実行コマンド（Lane 0 完了後に実行） | fail 分類タグ付けの観点 |
| --- | --- | --- | --- |
| api-unit | 201 のうち unit 群 | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit` | C3 中心（mock/spy 挙動）。`--minWorkers=1` 削除後に起動することを確認（C1 消化の検証） |
| api-d1 | 201 のうち D1 群 | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1` | C1: `maxWorkers: 1` 化で port exhaustion 非再発・完走を確認。`isolate: false` は採用しないため、ファイル間モジュール状態共有を導入しない |
| web | 385 | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` | C3/C4 中心 + react alias / plugin-react ^5.2 健全性（vite 8 解決時の起動確認） |
| og | 6 | `mise exec -- pnpm --filter @ubm-hyogo/og test:coverage` | C3/C4 中心（小規模） |
| packages | 35 | `mise exec -- pnpm --filter './packages/*' test:coverage` | C3/C4 中心 |
| scripts | 56 | `mise exec -- pnpm test:scripts` | C3 中心。vitest 実行系の spec（coverage-threshold-lint 等）に C2 波及が混在しうる |
| infra | 10 | `mise exec -- pnpm test:alerts && mise exec -- pnpm test:sentry-alerts` | C3 中心（cloudflare-alerts / sentry-alerts） |

> coverage 系コマンドは artifacts.json の `mutation_commands` と一致させている（shard_api_unit / shard_api_d1 / shard_web / shard_og / shard_scripts / shard_alerts）。fail 箇所のみを再実行する場合は `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts <path>`（D1 系は `--config=vitest.d1.config.ts`）で個別実行してよい。**config の対応（unit=`vitest.config.ts` / D1=`vitest.d1.config.ts`）を崩さないこと**。
>
> fail 分類は各 shard 出力の `FAIL` 行から、後述の「fail 分類テーブル」のカテゴリ（C1〜C8 v4 版）を該当テストごとに付与し、Phase 5 の修正対象一覧に転記する。

## fail 分類テーブル（RED テストケース ID と想定 fail）

RED 採取で観測されうる典型 fail を、テスト ID 形式 `RED-C{n}-{seq}` で事前カタログ化する。**実 fail の有無と件数は RED 採取結果に従属する**。Phase 5 はこのカタログに沿って分類・修正する。

| RED ID | カテゴリ | 想定 fail の典型例 | v3→v4 で何が変わるか | Phase 5 の修正方針 |
| --- | --- | --- | --- | --- |
| RED-C1-01 | C1 | api-d1 shard で `isolate: false` 化によりテスト間のモジュール状態共有が顕在化（順序依存 fail） | 旧 `singleFork: true` の等価表現として `isolate: false` を採用すると、ファイル間でモジュールキャッシュが共有される | 本 workflow では `isolate` を外し `maxWorkers: 1` のみで port exhaustion 非再発を実測する方針を採用 |
| RED-C3-01 | C3 | `vi.restoreAllMocks()` で `vi.mock` / `vi.fn` の状態もリセットされる前提のテスト | v4 の `vi.restoreAllMocks` は**手動 `vi.spyOn` の restore のみ**（状態 reset 廃止。config `restoreMocks` も同様） | `vi.resetAllMocks()` / 個別 `mockReset()` の明示追加など、テスト側のモック後始末を v4 セマンティクスへ追従 |
| RED-C3-02 | C3 | `mock.invocationCallOrder` の値を 0 始まり前提で比較 | v4 で **1 始まり**へ変更 | 期待値を +1 へ修正 |
| RED-C3-03 | C3 | `getMockName()` の既定値 `'spy'` を期待値に持つテスト | 既定が `'spy'` → `'vi.fn()'` へ変更 | 期待値を `'vi.fn()'` へ修正（または `mockName()` で明示命名） |
| RED-C3-04 | C3 | `vi.fn(() => ...)` / `vi.spyOn(...).mockImplementation(() => ...)` のアロー関数実装を `new` で呼び出すコードのテストが `not a constructor` で fail | v4 はアロー関数をコンストラクタ呼出できない（実装関数がそのまま使われる） | mockImplementation を `function` 式 / class へ変更（テスト側のみ。プロダクトコード不変） |
| RED-C3-05 | C3 | automock した getter / `mock.settledResults` の件数・タイミング前提 | automock の getter 挙動変更・`settledResults` が `'incomplete'` で即時 populate | 期待値をv4 実挙動に合わせて修正（RED 採取結果に従属） |
| RED-C4-01 | C4 | mock を含む snapshot が `[MockFunction spy]` ≠ `[MockFunction]` で不一致 | getMockName 既定変更により serializer 出力が変化 | `--update` で snapshot 更新 + diff 目視（機械的差分のみ受入。Phase 5 で「生成」と「diff 確認」を別ステップ化） |
| RED-C4-02 | C4 | CI 相当実行で obsolete snapshot により fail | v4 は **CI 上で obsolete snapshot があると fail** | obsolete 残骸の清掃（削除）。AC-8（obsolete 0 件）で担保 |
| RED-C4-03 | C4 | custom elements を含む snapshot に shadow root が出力され不一致 | v4 で shadow root を snapshot 出力に含める | 原則 snapshot 更新で受入。旧挙動が必要な場合のみ `snapshotFormat.printShadowRoot: false` を検討（config 変更はエスカレーション対象として記録） |

> C2（coverage AST remapping の数値変動）は spec fail ではなくカバレッジゲートで現れるため Phase 7 で実測する。C5/C7 は Lane 0 の install / `pnpm why` で消化済みであることを確認する。C6（`test.exclude` デフォルト簡素化）は現行 config が exclude 全列挙済みで実影響なし（記録のみ）。
>
> **v4.1 deprecation（fail はしない）**: 複数 `vitest/*` エントリポイント、spy アサーション `toBe*` 系 → `toHaveBeen*` 推奨、`vi.mock`/`vi.hoisted` のモジュールトップレベル外宣言で警告。RED 採取時に件数を記録し、対応は Phase 8 で判断する。

## ローカル実行コマンド一覧

```bash
# 0) 起動前チェック（FB-MSO-002 / issue-747）
mise exec -- pnpm install
mise exec -- pnpm verify:vitest-runtime

# 1) Lane 0 完了確認（Phase 5 Step 1-4 完了が前提）
mise exec -- pnpm why vitest               # 解決バージョンが 4.1.x 系で全 workspace 一致か
mise exec -- pnpm why @vitest/coverage-v8  # vitest と完全同一バージョンか（exact pin / C7）
mise exec -- pnpm why vite                 # ^6/^7/^8 範囲で解決されているか
mise exec -- pnpm why @vitejs/plugin-react # ^5.2 系で peer 警告ゼロか（C5）

# 2) shard 別 RED 採取（fail をカテゴリタグ付けして記録）
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit   # api-unit
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1     # api-d1（直列化完走を確認）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage        # web
mise exec -- pnpm --filter @ubm-hyogo/og test:coverage         # og
mise exec -- pnpm --filter './packages/*' test:coverage        # packages
mise exec -- pnpm test:scripts                                 # scripts
mise exec -- pnpm test:alerts && mise exec -- pnpm test:sentry-alerts  # infra

# 3) 事前 grep（C8 残党 / snapshot 所在 / C3 直撃 API）— 本文の (a)(b)(c) を実行

# 4) deprecation 警告の採取（stderr を含めて確認）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"
```

## 完了条件

- [ ] 「依存アップグレードにおける RED の読み替え（Lane 0 後に RED 採取）」が記載されている
- [ ] Phase 4 開始前チェック（`pnpm install` + `pnpm verify:vitest-runtime` / FB-MSO-002）が明記されている
- [ ] RED 前の事前 grep タスク (a) C8 残党 (b) snapshot 所在 (c) C3 直撃 API が具体的コマンドで記載されている
- [ ] shard 別（api-unit / api-d1 / web / og / packages / scripts / infra）の RED 採取手順と実行コマンドが記載され、artifacts.json の mutation_commands と整合している
- [ ] fail 分類テーブル（`RED-C{n}-{seq}` ID で C1/C3/C4 の典型 fail）が記載されている
- [ ] C2 は Phase 7、C5/C7 は Lane 0、C6 は記録のみ、という分担が明示されている
- [ ] RED の分類結果が Phase 5 の修正対象一覧へ転記される導線が示されている

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `phase-02-design.md`, `artifacts.json` mutation commands, existing shard scripts
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-04-test-creation.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
