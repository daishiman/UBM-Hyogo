# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
|---|---|
| タスク ID | runtime-smoke-staging-mint-recurrence-fix |
| Phase | 8 / 13 |
| 実装区分 | 実装仕様書（CONST_004） |
| 採用方針 | Option C（静的 fallback 維持＋鮮度ゲート） |
| 入力 | phase-5-implementation.md / phase-6-test-additions.md / phase-7-coverage.md |

## 目的

Phase 5（実装）/ Phase 6（テスト拡充）で成立させた振る舞いを**変えずに**、構造の明瞭性・重複削減・命名整合性を高めるリファクタリングを記録する（skill feedback RT-03 準拠）。本タスクの主眼は (1) `exp` decode ロジックを `bearer-freshness-gate.mts` に一元化し gate と smoke runner で重複させないこと、(2) reason 文字列が SSOT のディシジョンツリーと完全一致することを確認することの 2 点に閉じる。

> 前提: ここで挙げる変更は**外部挙動を変えない**。`runtime-smoke auth path: minted/static-fallback` の notice、鮮度ゲートの exit code（fresh→0 / stale・expired・invalid→1）、reason 文字列（`auth-token-expired` / `auth-secret-drift` / `auth-secret-binding-missing` / `auth-not-admin`）、mint の `GITHUB_OUTPUT` key 名、required status context 名（`runtime smoke staging / smoke`）はすべて不変。挙動が変わるものはリファクタリングではなく Phase 5 の実装差分として扱う。

## 実行タスク

1. 変更を `対象 / Before / After / 理由` テーブルで記録する（4 ファイル分）。
2. `exp` decode を `bearer-freshness-gate.mts` に一元化し、gate / smoke runner の重複が 0 であることを確認する。
3. mint self-verify を単一 guard block に集約し重複 0 を確認する。
4. reason 文字列 4 種が SSOT ディシジョンツリーと完全一致することを N-1〜N-3 で検証する。
5. 採用しないリファクタリングを見送り理由付きで列挙する。
6. 外部挙動不変であることを §5 で確認する。

## 0. リファクタリングの原則（過度な抽象化の回避）

- **YAGNI 優先**: 「他 workflow でも使うかも」という推測に基づく共通化はしない。本タスクは 1 module + 既存 3 ファイルの局所差分・1 サイクル完結であり、再利用の事実が出るまで抽象化を先送りする。
- **decode の一元化は実利があるため採用する**: `exp` decode は gate（C-1）と smoke runner（C-3）の双方が必要とするが、smoke runner（bash）は `bearer-freshness-gate.mts` の `explainAuthFailureFromBearer` を `tsx -e` 経由で呼ぶことで decode 実装を持たない。decode の TS / bash 二重実装を構造的に 0 にする。
- **shell の関数抽出は副作用が読みやすくなる範囲に限る**: `set -euo pipefail` 下での戻り値・サブシェルの落とし穴があるため、reason 判定の分岐増だけを対象にし、runner 全体の再構造化はしない。
- **workflow の step 共通化はしない**: GitHub Actions の YAML anchor / composite は actionlint 互換性と可読性の両面でコストが高い。auth-path notice と freshness-gate は明示的な 2 step として並べ、composite へ押し込まない。

## 1. リファクタリング記録（対象 / Before / After / 理由）

### 1.1 `scripts/smoke/bearer-freshness-gate.mts`（新規）

| 対象 | Before | After | 理由 |
|---|---|---|---|
| `exp` decode の所有 | gate と smoke runner（bash の jq / base64）で別々に exp を読む構造になりうる | `decodeJwtExp` を本 module の唯一の decode 実装とし、gate（`classifyBearerFreshness`）も classify（`explainAuthFailureFromBearer`）も内部で `decodeJwtExp` を呼ぶ | decode ロジックを 1 関数に集約。`classifyBearerFreshness` と `explainAuthFailureFromBearer` で base64url decode を再実装しない（重複 0） |
| 純粋関数と CLI の分離 | decode / 判定と `process.env` 読み取り・`::error::` 出力が同一スコープに同居しうる | 3 純粋関数（`decodeJwtExp` / `classifyBearerFreshness` / `explainAuthFailureFromBearer`）を env 非依存で export し、env 読み取り・`::error::` 出力・exit は `import.meta.url === pathToFileURL(entry).href` guard 配下の CLI ブロックに隔離 | spec が `process.env` に依存せず純粋関数を直接叩ける（テスト容易性）。命名規則（Phase 1）の「env を直接読まず引数で受ける」に整合 |
| token 非出力の責務境界 | エラー文に token を含める誘惑 | CLI のエラー出力は `label` + `secondsRemaining` + reason 文字列のみ。token 文字列・`exp` 以外の claim を出さない | 不変条件 5 を構造として固定。純粋関数は値を返すだけで I/O を持たない |

### 1.2 `scripts/smoke/runtime-attendance-provider.sh`（修正）

| 対象 | Before | After | 理由 |
|---|---|---|---|
| `exp` decode の重複 | 401 reason 細分化のため bash 側で jq / base64 による exp decode を実装する誘惑 | bash は decode を**実装せず**、`classify_unauthorized_bearer "$bearer"` が `explainAuthFailureFromBearer({ token })` を呼ぶ | decode の TS / bash 二重実装を 0 にする（C-1 へ一元化）。decode 仕様変更時の修正点が 1 箇所 |
| reason 判定の関数抽出 | 401/403/500 の reason 分岐が `request_json` 内にインライン展開（細分化で 401 が 2 分岐へ増加） | 401 分類だけを `classify_unauthorized_bearer` に局所化し、`request_json` 本筋（HTTP 実行）と分類を分ける | 分岐が増え可読性が落ちる箇所だけを局所化。runner 全体の関数化はしない |
| decode 不能分類 | （無し） | `decodeJwtExp` が `null` の場合も `explainAuthFailureFromBearer` が `auth-secret-drift` を返す | RV-2（Phase 3）解消。decode 不能でも復旧導線が一意 |

### 1.3 `scripts/smoke/mint-staging-bearers.mts`（修正）

| 対象 | Before | After | 理由 |
|---|---|---|---|
| 署名と自己検証の分離 | `signSessionJwt(...)` を `mintStagingBearers` 内で直接呼ぶ | admin / me の署名後に `Promise.all([verifySessionJwt(adminBearer), verifySessionJwt(meBearer)])` で自己検証し、claim parity を同じ guard で確認する | self-verify を 1 ブロックに集約。Phase 2 §C-4 を構造として固定 |
| self-verify エラーの情報粒度 | （新規） | throw メッセージは固定文言のみ。token 文字列・secret を含めない | 不変条件 5 維持。format drift を smoke 前に検出しつつ secret を漏らさない |

### 1.4 `.github/workflows/runtime-smoke-staging.yml`（修正）

| 対象 | Before | After | 理由 |
|---|---|---|---|
| `setup-project` の `if` 条件 | `if: env.STAGING_AUTH_SECRET != ''`（mint 有効時のみ走る） | `if` を撤去し常時実行（静的 fallback 時も `pnpm exec tsx` が必要なため） | 鮮度ゲートが tsx を要する。mint step の `if` は維持するため AC-6 と両立（setup 常時化のみ） |
| auth-path 可視化 / 鮮度ゲートの step 配置 | mask の直後に smoke が走る | `mask staging credentials` が auth path notice も担い、その直後に `verify bearer freshness` を挿入。composite / anchor 化しない | サイレント退行を可視退行へ。step を共通化せず明示再掲で actionlint 互換と diff 可読性を保つ |

## 2. duplicate 削減観点（exp decode 一元化の確認）

| 観点 | 確認内容 | 合格基準 |
|---|---|---|
| decode 実装数 | `exp` の base64url decode 実装が `bearer-freshness-gate.mts` の `decodeJwtExp` の **1 箇所のみ** | smoke runner（`.sh`）に jq / base64 / openssl による exp decode が存在しない（`explainAuthFailureFromBearer` 委譲のみ） |
| gate / classify の共有 | `classifyBearerFreshness` と `explainAuthFailureFromBearer` が `decodeJwtExp` を内部呼び出しし、各自で decode を再実装していない | 2 関数とも `decodeJwtExp` を経由する |
| self-verify の共有 | admin / me 双方の verify が同じ guard ブロックにあり、verify ロジックが 2 箇所に展開されていない | `verifySessionJwt` 呼び出しが self-verification block に集約されている |

> 結論: `exp` decode と mint self-verify はそれぞれ 1 箇所に集約され、重複 0。

## 3. naming drift チェック（reason 文字列 ⇔ SSOT ディシジョンツリー）

reason 文字列が `reference/bearer-lifecycle-ssot.md`（C-5）の診断ディシジョンツリーと**完全一致**することを確認する。

| reason 文字列 | 出力元（パス） | SSOT ディシジョンツリーの項目 | 一致確認 |
|---|---|---|---|
| `auth-token-expired` | `runtime-attendance-provider.sh`（401, `explainAuthFailureFromBearer`→`auth-token-expired`） | 「401, exp ≤ now → 静的 bearer 失効 → 再発行 or mint 有効化」 | 文字列完全一致 |
| `auth-secret-drift` | `runtime-attendance-provider.sh`（401, `explainAuthFailureFromBearer`→`auth-secret-drift`） | 「401, exp > now / decode 不能 → mint 鍵 ≠ API 鍵 or token 形式不整合 → 両者を同値に再同期」 | 文字列完全一致 |
| `auth-secret-binding-missing` | `runtime-attendance-provider.sh`（500） | 「500 → staging API に `AUTH_SECRET` 未投入 → `scripts/cf.sh secret put`」 | 文字列完全一致（不変） |
| `auth-not-admin` | `runtime-attendance-provider.sh`（403） | 「403 → identity の isAdmin=false → member identity secret 修正」 | 文字列完全一致（不変） |

### 3.1 naming drift 検証コマンド

| 手順 | コマンド / 内容 | 期待結果 |
|---|---|---|
| N-1 | `grep -oE 'auth-token-expired\|auth-secret-drift\|auth-secret-binding-missing\|auth-not-admin' scripts/smoke/runtime-attendance-provider.sh` で runner の reason 文字列を列挙 | 4 文字列がすべて出現し、SSOT 外の reason 文字列が無い |
| N-2 | `grep -oE 'auth-token-expired\|auth-secret-drift\|auth-secret-binding-missing\|auth-not-admin' docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` で SSOT の reason 文字列を列挙 | runner と同一の 4 文字列が出現 |
| N-3 | N-1 と N-2 の文字列集合が一致することを確認 | 集合差分 0（runner ⊇ SSOT かつ SSOT ⊇ runner） |

## 4. 採用しない（意図的に見送る）リファクタリング

| 候補 | 見送り理由 |
|---|---|
| `bearer-freshness-gate.mts` を `packages/shared` 配下へ昇格 | smoke 専用の CI スクリプトであり API ランタイムが import しない。`scripts/smoke/` に閉じるのが責務的に正しい。共有化は再利用の事実が出てから |
| `decodeJwtExp` を汎用 JWT decode ライブラリ化（全 claim 対応） | 本タスクで必要なのは `exp` のみ。全 claim parser は YAGNI。`exp` 以外を読むと不変条件 5（exp 以外の claim 非出力）の表面積が増える |
| workflow の auth-path notice / freshness-gate を composite action 化 | actionlint 互換性と他 workflow への波及リスク。2 step の明示再掲で十分（CONST_007 スコープ内） |
| smoke runner 全体の bats 移植 | reason 分岐は `` 委譲で TS 側の spec が網羅。runner の HTTP 経路まで bats 化するのはスコープ外 |

## 5. リファクタリング後の不変条件確認（Phase 9 へ引き継ぐ観点）

1. `exp` decode 実装が `decodeJwtExp` の 1 箇所のみ（§2）。smoke runner に独自 decode が無い。
2. reason 4 文字列が SSOT と完全一致（§3）。drift 検証コマンド N-1〜N-3 が PASS。
3. mint の `GITHUB_OUTPUT` key 名・mint step の `if: env.STAGING_AUTH_SECRET != ''` が不変（AC-6）。
4. required status context 名（`runtime smoke staging / smoke`）が不変（不変条件 2）。
5. gate / classify / mint helper のいずれも JWT 文字列・署名鍵・secret 実値を console / log に出さない（不変条件 5）。
6. 外部挙動（auth-path 文字列・gate exit code・reason 文字列・mint 出力）が Phase 5 から変わっていない。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 7（カバレッジ） | exp decode 一元化（§2）後も branch 網羅が維持されることを coverage で確認する | phase-7-coverage.md |
| Phase 9（QA） | §5 の不変条件確認（exp decode 1 箇所・reason ⇔ SSOT 一致・required context 不変・非漏洩）を QA gate へ引き継ぐ | phase-9-qa.md |
| reason ⇔ SSOT 統合 | §3 の naming drift チェック（reason 4 文字列と SSOT ディシジョンツリーの一致）を smoke runner / SSOT 間で結線検証する | scripts/smoke/runtime-attendance-provider.sh ↔ reference/bearer-lifecycle-ssot.md |

## 参照資料

| 参照資料 | パス | 内容 |
|---|---|---|
| 設計（module / 責務境界） | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-2-design.md` | C-1〜C-6 / 責務境界テーブル |
| 設計レビュー（RV-2 auth-secret-drift） | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-3-design-review.md` | RV-2 fallback / RV-3 責務分離 |
| 実装手順 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-5-implementation.md` | 変更 / 新規ファイルの差分方針 |
| SSOT（reason ⇔ アクション） | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` | 診断ディシジョンツリー（C-5） |
| smoke runner 現行 | `scripts/smoke/runtime-attendance-provider.sh` | reason 分類（L167-180） |
| フォーマット参照 | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/phase-8-refactor.md` | 先行タスクの Before/After 記録構成 |

## 成果物

- 本ファイル（`phase-8-refactor.md`）: 対象 / Before / After / 理由テーブル、decode 一元化の重複 0 確認、reason 文字列 ⇔ SSOT の naming drift チェック、見送りリファクタリング。

## 完了条件

- [x] 変更を `対象 / Before / After / 理由` テーブル形式で記録した（RT-03）。
- [x] `exp` decode を `bearer-freshness-gate.mts` に一元化し gate / smoke runner で重複させない（重複 0）方針を明記した。
- [x] mint self-verify を単一 guard block に集約し重複 0 とした。
- [x] reason 文字列 4 種が SSOT ディシジョンツリーと完全一致することの検証チェック（N-1〜N-3）を記載した。
- [x] 採用しないリファクタリングを見送り理由付きで列挙した（過度な抽象化回避）。
- [x] 外部挙動不変であることを §5 で確認した。
