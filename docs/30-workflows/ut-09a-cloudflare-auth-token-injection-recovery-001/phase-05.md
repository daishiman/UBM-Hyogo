# Phase 5: 実装ランブック — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 5 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (treated as CLOSED for spec) |

## 目的

`bash scripts/cf.sh whoami` を `You are not authenticated` 状態から exit 0 状態に戻す復旧手順を、再現可能な runbook として固定する。本仕様書はランブックの定義のみを行い、実 `whoami` 実行 / token 再発行 / commit / push / PR は user 明示指示後の Phase 11 で実行する。

## 実行タスク（ランブック構造の確定のみ）

1. 三段ラップ切り分け手順（op 段 / mise 段 / wrangler 段）を確定する
2. `.env` op 参照キー存在確認 / 1Password item 存在確認手順を確定する（値は読まない）
3. token scope 点検 SOP を確定する
4. `wrangler login` 残置検知 / 除去手順（user 明示指示 gate 付き）を確定する
5. 復旧後の `bash scripts/cf.sh whoami` 実行 / evidence 集約 / 親タスク handoff 手順を確定する

## 参照資料

- scripts/cf.sh（実コード・必要時にのみ最小修正）
- scripts/with-env.sh（実コード・必要時にのみ最小修正）
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」「禁止事項」
- docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md

## 仕様化対象の擬似 diff（必要時のみ最小修正）

### `scripts/cf.sh` / `scripts/with-env.sh`

```sh
# 既存コードを正本とする。drift があった場合のみ最小修正。
# 構造（再確認のみ）:
#   scripts/cf.sh:
#     ESBUILD_BINARY_PATH=... \
#       bash scripts/with-env.sh \
#         mise exec -- wrangler "$@"
#   scripts/with-env.sh:
#     op run --env-file=.env -- "$@"
```

> 本タスクスコープでは drift がない限りコード変更しない。drift 検知時のみ「最小修正」を行い、PR で示す。

## 実行手順（ランブック詳細）

### 0. 前提

- `op` (1Password CLI) がインストール済 / signin 可能
- mise がインストール済 / `.mise.toml` の Node 24 / pnpm 10 が install 済
- Cloudflare API Token が 1Password 側に保管済（再発行は user 明示指示後）
- `.env` に Cloudflare API Token の op 参照キーが設定済（値は確認しない）
- `wrangler` 直接実行は禁止（必ず `bash scripts/cf.sh` 経由）

### 1. 失敗症状の確認（復旧前 baseline）

```bash
bash scripts/cf.sh whoami; echo "exit=$?"
```

期待: 復旧前は `You are not authenticated` + `exit≠0` が観測される。これを baseline として `outputs/phase-11/whoami-exit-code.log` の冒頭に記録する（token 値は元から出ない）。

### 2. Stage 1（op 段）切り分け

```bash
op whoami; echo "exit=$?"
op item list 2>&1 | head
```

- `op whoami` exit ≠ 0 の場合: `op signin` を user 明示指示後に実行（pass phrase / TouchID 入力は user 操作）
- `op item list` で item 名が見えない場合: vault 設定 / アクセス権限を確認（item の値は読まない）

evidence: `outputs/phase-11/stage-isolation.md` の Stage 1 セクション

### 3. Stage 2（mise 段）切り分け

```bash
mise current
mise exec -- node -v
mise exec -- which wrangler
```

- `node -v` が `v24.x` 系でない場合: `mise install` を実行
- `which wrangler` で wrangler が解決できない場合: `mise exec -- pnpm install` を実行

evidence: `outputs/phase-11/stage-isolation.md` の Stage 2 セクション

### 4. Stage 3（wrangler 段）切り分け / `.env` op 参照確認

```bash
# scripts/cf.sh / scripts/with-env.sh が参照しているキー名を逆引き（.env は読まない）
grep -nE 'CLOUDFLARE_[A-Z_]+' scripts/cf.sh scripts/with-env.sh
```

`.env` に当該キーが存在し `op://...` 形式を指すこと、1Password item が存在すること、token scope が足りていることは、ユーザーが 1Password / Cloudflare dashboard / ローカル `.env` を確認し、artifact には `confirmed_by_user` と scope checklist だけを記録する。secret 値・実 vault 名・実 item 名・`.env` 値は記録しない。

evidence: `outputs/phase-11/env-key-existence.md`

### 5. token scope 点検

- 1Password item の説明欄 / Cloudflare dashboard の token 管理画面で以下を確認:
  - Account: Workers Scripts:Edit
  - Account: Workers Routes:Edit
  - Account: D1:Edit
  - Account: Pages:Edit
  - Account: Workers Tail:Read
- token 値そのものは読まない / 仕様書に記録しない

evidence: `outputs/phase-11/token-scope-checklist.md`

### 6. `wrangler login` 残置検知 / 除去（user 明示指示後）

```bash
ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1
# 存在する場合（"No such file" でない場合）→ user 明示指示後にのみ除去:
# rm ~/Library/Preferences/.wrangler/config/default.toml
```

evidence: `outputs/phase-11/wrangler-login-residue.md`

### 7. 復旧後 `whoami` 実行

```bash
bash scripts/cf.sh whoami; echo "exit=$?"
```

期待: exit 0 + 標準出力に staging 操作対象 Cloudflare account identity が現れる（token 値は出ない）

evidence:
- `outputs/phase-11/whoami-exit-code.log`
- `outputs/phase-11/whoami-account-identity.log`（identity 行のみ）

### 8. evidence 集約 / 親タスク handoff

- `outputs/phase-11/main.md` に AC-1〜AC-7 の PASS / FAIL を集約
- `outputs/phase-11/handoff-to-parent.md` に親タスク `ut-09a-exec-staging-smoke-001` Phase 11 が参照すべき path 一覧を記録
- `outputs/phase-11/redaction-checklist.md` で token / secret 非露出を確認

## 多角的チェック観点

- ランブックを「実行する」のではなく「定義する」フェーズである
- 実 `whoami` 実行 / token 再発行 / `wrangler login` 残置除去は user 明示指示まで実行しない
- secret は `op://` 参照経由で `bash scripts/with-env.sh` を介して動的注入のみ
- `.env` の値を読まない原則を全 step で遵守する

## 統合テスト連携

Phase 11 の各 evidence file（`whoami-exit-code.log` / `whoami-account-identity.log` / `stage-isolation.md` / `env-key-existence.md` / `token-scope-checklist.md` / `wrangler-login-residue.md` / `redaction-checklist.md` / `handoff-to-parent.md`）に接続する。Phase 5 は手順定義のみであり、runtime PASS は Phase 11 の実行結果だけで判定する。

## サブタスク管理

- [ ] 0〜8 の各ステップを実行可能な粒度で定義
- [ ] 擬似 diff が実コードと一致している（編集は最小修正のみ）
- [ ] user 明示指示 gate（`op signin` / token 再発行 / `wrangler login` 残置除去）を明記
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md

## 完了条件

- ランブックの 0〜8 ステップが実行可能な粒度で確定している
- user 明示指示 gate が明記されている
- evidence path が Phase 7 AC マトリクスと一致している

## タスク100%実行確認

- [ ] `wrangler` 直接呼出が含まれていない
- [ ] `wrangler login` 採用手順が含まれていない
- [ ] secret 値・実 vault 名・実 item 名・account id が含まれていない
- [ ] `.env` の値を読む手順が含まれていない

## 次 Phase への引き渡し

Phase 6 へ、ランブックの異常系・失敗時手順を渡す。
