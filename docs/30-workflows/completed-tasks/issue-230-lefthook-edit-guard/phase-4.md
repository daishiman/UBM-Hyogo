# Phase 4: テスト作成 — issue-230-lefthook-edit-guard

> **[実装区分: 実装仕様書 / NON_VISUAL]**
> Phase 2 設計 + Phase 3 補正（§3.4）を正本に、guard / integrity 両 shell script の振る舞いを検証する vitest spec をテストファーストで定義した。
> 追加する spec は 2 本。invariant #8 に従い `*.spec.ts` のみ（`*.test.ts` は禁止）。

## 4.1 追加するテストファイル

| # | パス | 検証対象 | 技法 |
|---|------|---------|------|
| 5 | `scripts/hooks/__tests__/lefthook-edit-guard.spec.ts` | `scripts/hooks/lefthook-edit-guard.sh`（R-1 local / R-2 / R-3 / R-4） | vitest + `execFileSync('bash', [SCRIPT])` + 一時 git repo fixture |
| 6 | `scripts/__tests__/verify-hook-integrity.spec.ts` | `scripts/verify-hook-integrity.sh`（R-1 CI 観測面） | 同上 |

> `scripts/hooks/__tests__/` は新規作成。`scripts/__tests__/` は実装時に存在確認し無ければ作成。

## 4.2 共通テスト技法（`coverage-guard.spec.ts` パターン踏襲）

```text
beforeEach:
  root = mkdtempSync(resolve(tmpdir(), "lefthook-guard-"))   // 一時ディレクトリ
  execFileSync("git", ["init", "-q"], { cwd: root })          // git repo 化
  execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: root })
  execFileSync("git", ["config", "user.name",  "Test"], { cwd: root })
  // fixture を root に書く → 必要なら git add で stage
afterEach:
  rmSync(root, { recursive: true, force: true })
```

- guard 実行ヘルパー: `node:child_process` の `spawnSync("bash", [SCRIPT], { cwd: root, env, encoding: "utf8" })` を使い `{ code: r.status ?? 1, stdout, stderr }` を返す。
- `env` は `{ ...process.env, LEFTHOOK_EDIT_ACK }` を差し替えて ack 有無を切り替える。`LEFTHOOK_EDIT_ACK` を渡さないケースでは `process.env` に同名が無いことを保証するため、ヘルパー内で明示的に `delete env.LEFTHOOK_EDIT_ACK` してから設定する。
- `SCRIPT = resolve(__dirname, "..", "lefthook-edit-guard.sh")`（guard）/ `resolve(__dirname, "..", "verify-hook-integrity.sh")`（integrity, `scripts/__tests__/` から見て `..`）。
- guard は `.git/hooks/` を `git rev-parse --git-common-dir` 経由で解決するため、fixture の `.git/hooks/<file>` を直接 `writeFileSync` で作る。`mkdirSync(resolve(root, ".git/hooks"), { recursive: true })` は `git init` 済みなら既存だが防御的に `recursive: true` で作る。
- stage 操作は `execFileSync("git", ["add", "<path>"], { cwd: root })`。

## 4.3 `lefthook-edit-guard.spec.ts` ケース一覧

`describe("lefthook-edit-guard.sh")` 配下に以下を定義する。

| ID | ケース | fixture / 前提 | 実行 | 期待 exit | 期待メッセージ assertion |
|----|--------|---------------|------|-----------|------------------------|
| LG-a | clean repo（staged 変更なし・手書き hook なし） | 何も stage しない / `.git/hooks` は空 or `.sample` のみ | `LEFTHOOK_EDIT_ACK` 無で実行 | `0` | （特になし。`code === 0`） |
| LG-b | `lefthook.yml` を stage + ack 無 | `writeFileSync(root/lefthook.yml, "...")` → `git add lefthook.yml` | `LEFTHOOK_EDIT_ACK` 無 | `1` | stdout/stderr が `LEFTHOOK_EDIT_ACK`、`CLAUDE.md`、`lefthook-operations.md` を**いずれも含む** |
| LG-c | `lefthook.yml` を stage + `LEFTHOOK_EDIT_ACK=1` | LG-b と同じ stage | `env.LEFTHOOK_EDIT_ACK = "1"` | `0` | （ブロックされない） |
| LG-d | 手書き `.git/hooks/pre-commit`（lefthook 署名なし） | `writeFileSync(root/.git/hooks/pre-commit, "#!/bin/sh\necho custom\n")` | ack 無 | `1` | 出力に `pre-commit`（offender パス）と `CLAUDE.md` / `lefthook-operations.md` を含む |
| LG-e | `.git/hooks/pre-commit.sample`（除外対象） | `writeFileSync(root/.git/hooks/pre-commit.sample, "#!/bin/sh\n")` のみ | ack 無 | `0` | （`.sample` は offender にしない） |
| LG-f | lefthook 署名入り hook（managed として除外） | `writeFileSync(root/.git/hooks/pre-commit, "#!/bin/sh\n# LEFTHOOK\nlefthook run pre-commit\n")` | ack 無 | `0` | （`LEFTHOOK` 文字列を含む hook は除外） |
| LG-g | `MERGE_HEAD` 存在時（sync-merge skip） | 手書き hook + `lefthook.yml` stage を両方仕込んだ上で `writeFileSync(root/.git/MERGE_HEAD, "deadbeef\n")` | ack 無 | `0` | （marker 存在で全 guard を skip） |

### 各ケースの補足

- **LG-a**: `git init` 直後の `.git/hooks/` には lefthook が配置されていない実 `.sample` 群が並ぶが、fixture では `.git/hooks` を一旦空にしてから検証する。実装簡素化のため `rmSync(resolve(root, ".git/hooks"), { recursive: true, force: true })` 後 `mkdirSync(...)` で空ディレクトリにリセットする helper を用意してもよい。
- **LG-b / LG-c**: `lefthook.yml` の内容は任意の最小 YAML（例 `"pre-commit:\n  commands: {}\n"`）でよい。検知は「staged path が `^lefthook\.yml$` に一致するか」のみに依存する。
- **LG-d**: offender 検知は `find "$hooks_dir" -maxdepth 1 -type f` の結果から `.sample` と lefthook 署名を除いた残り。`pre-commit` をパスに含むことを `expect(out).toContain("pre-commit")` で確認。
- **LG-g**: marker は `MERGE_HEAD` を代表ケースとする（`REBASE_HEAD` / `CHERRY_PICK_HEAD` / `REVERT_HEAD` の網羅は Phase 6 で追加）。

## 4.4 `verify-hook-integrity.spec.ts` ケース一覧

`describe("verify-hook-integrity.sh")` 配下に以下を定義する。integrity script は `lefthook.yml` と `git ls-files` を `cwd` 基準で参照するため、fixture repo 内に `lefthook.yml` と必要な `scripts/hooks/*.sh` を配置し `git add` する。

| ID | ケース | fixture / 前提 | 期待 exit | 期待メッセージ assertion |
|----|--------|---------------|-----------|------------------------|
| VI-a | 正常 `lefthook.yml`（参照先 script すべて実在 + `min_version` あり + stray hook なし） | `lefthook.yml`（`min_version: 1.6.0` + `run: bash scripts/hooks/foo.sh`）+ `scripts/hooks/foo.sh` 実在 → `git add -A` | `0` | stdout が `OK`（例 `OK: lefthook.yml integrity verified`）を含む |
| VI-b | 参照先 script 欠落（`scripts/hooks/missing.sh` を参照するが実体なし） | `lefthook.yml` に `run: bash scripts/hooks/missing.sh` を含め、`missing.sh` は作らない | `1` | stdout/stderr が `::error::` と `missing.sh`（または `missing`）を含む |
| VI-c | `min_version` 行欠落 | `lefthook.yml` から `min_version:` 行を除いた内容 | `1` | 出力が `::error::` と `min_version` を含む |
| VI-d | tracked stray hook（`hooks/pre-commit` が git 管理下に commit されている） | `mkdirSync(root/hooks)` → `writeFileSync(root/hooks/pre-commit, ...)` → `git add hooks/pre-commit` → `git commit`（`git ls-files` に現れるよう commit する） | `1` | 出力が `::error::` と `hooks/pre-commit`（または `stray`）を含む |

### 各ケースの補足

- **参照抽出（Phase 3 §3.4-3 補正）**: integrity script は `run:` 行から**第2トークン（スクリプトパス）**を抽出する。`run: bash scripts/hooks/foo.sh --flag` のような引数付き行でも `--flag` を script path と誤検出しないよう、fixture に引数付き `run:` 行を 1 本含めて誤検出しないこと（exit 0）を VI-a で兼ねて確認する。
- **VI-d の commit 必須性**: `git ls-files` は tracked（少なくとも index 登録済み）ファイルを列挙する。`git add` のみでも index には載るが、fixture では `git commit` まで実行して安定的に tracked 状態にする。`git add` 直後の検証で十分な場合は commit 省略可だが、本 spec では commit を既定とする。
- **`::error::` 出力**: GitHub Actions annotation 形式。local 実行でもそのまま stdout に出る前提で文字列 assertion する。

## 4.5 実行コマンド（1 行）

```bash
mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts
```

## 4.6 テストファースト方針

- Phase 4 時点では guard / integrity script は未実装のため、上記 spec は **初回 RED**（全ケース失敗 or script not found）となる想定。
- Phase 5（実装）で script を実装し、本 spec が GREEN になることを GREEN ゲートとする。
- spec のファイル名は invariant #8 を満たす `*.spec.ts`。lefthook `block-test-suffix` / CI `verify-test-suffix` が `*.test.ts` を reject するため、新規 `*.test.ts` を作らない。

## 完了条件（Phase 4）

- `lefthook-edit-guard.spec.ts` の 7 ケース（LG-a〜LG-g）が R-1..R-4 を被覆する形で表定義されている。
- `verify-hook-integrity.spec.ts` の 4 ケース（VI-a〜VI-d）が参照整合 / min_version / stray hook を被覆する形で表定義されている。
- 一時 git repo fixture の組み立て手順（mkdtemp + git init + config + stage）と guard 実行ヘルパーが明記されている。
- 2 本とも `*.spec.ts`（invariant #8 準拠）で、1 行実行コマンドが記載されている。
