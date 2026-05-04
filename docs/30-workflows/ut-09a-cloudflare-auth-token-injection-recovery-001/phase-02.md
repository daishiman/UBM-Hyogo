# Phase 2: 設計 — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| phase | 2 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`bash scripts/cf.sh whoami` の三段ラップ（`op run --env-file=.env` → `mise exec --` → `wrangler whoami`）を 1 経路の正本として再確認し、各段で「ここまで到達した / ここで落ちた」を切り分けるための SOP / コマンド・evidence 化方針を確定する。secret 値を覗かずに復旧確認するための制約を構造化する。

## 実行タスク

1. 三段ラップの構造図と各段の責務 / 失敗時症状を確定する
2. `.env` op 参照キー名 / 1Password item 存在確認手順を確定する（値は読まない）
3. Cloudflare API Token に必要な scope の点検 SOP を確定する（dashboard / 1Password 上の説明欄を参照、token 値は読まない）
4. `bash scripts/cf.sh whoami` 実行時の evidence path / redaction ルールを確定する
5. `wrangler login` 残置検知と除去 SOP を確定する

## 参照資料

- scripts/cf.sh（実コード・必要時にのみ最小修正）
- scripts/with-env.sh（実コード・必要時にのみ最小修正）
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」「禁止事項」
- docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md

## 実行手順

- 既存 repo 配下のパス・コマンド名は実在確認してから記述する（仮置き禁止）
- secret 値 / 実 vault 名 / 実 item 名 / account id を設計に書かない
- 設計サンプルは構造を示す擬似定義に留め、実コード差分は既存 `scripts/cf.sh` を正本として参照する

## 設計ポイント

### 三段ラップの構造

```
[Stage 1: 1Password]
  op run --env-file=.env -- <child>
    └── .env の op://Vault/Item/Field 参照を実値に解決し、子プロセスの環境変数として揮発的に注入
        失敗症状: "op signin needed" / "could not resolve secret reference"
        切り分けコマンド: op whoami / op item list（item 名のみ確認、値は確認しない）

[Stage 2: mise]
  mise exec -- <child>
    └── Node 24 / pnpm 10 / wrangler のバイナリ解決
        失敗症状: "command not found: wrangler" / Node version mismatch
        切り分けコマンド: mise current / mise exec -- node -v

[Stage 3: wrangler]
  wrangler whoami
    └── 環境変数 CLOUDFLARE_API_TOKEN を読み Cloudflare API へ identity 問い合わせ
        失敗症状: "You are not authenticated" / "Authentication error [code: 10000]"
        切り分け: 環境変数の到達確認（値ではなく長さ等の存在指標のみ）
```

### Cloudflare env key / op reference 存在確認手順

| 手順 | コマンド / 操作 | 期待 |
| --- | --- | --- |
| 参照側の要求キー確認 | `grep -nE 'CLOUDFLARE_[A-Z_]+' scripts/cf.sh scripts/with-env.sh` | コード側の要求キー名のみが分かる |
| `.env` op reference 存在確認 | ユーザーが `.env` を開き、要求キーが `op://...` 形式を指すことを目視確認して結果だけを申告する | artifact にはキー名と `confirmed_by_user` のみ記録し、値・vault 名・item 名は記録しない |
| 1Password item 存在確認 | ユーザーが 1Password / Cloudflare dashboard で存在と scope を確認する | artifact には `confirmed_by_user` と必要 scope checklist のみ記録し、secret 値・実 item 名は記録しない |

> `.env` は `cat` / `Read` / `grep` 等で表示・読み取りしない。Codex が確認できるのは参照側スクリプトの要求キー名までで、`.env` と 1Password の存在確認はユーザー確認結果だけを redacted evidence として記録する。

### Cloudflare API Token scope 点検 SOP

| 操作対象 | 必要 scope（最低限） |
| --- | --- |
| Workers / Pages deploy | Account: Workers Scripts:Edit / Workers Routes:Edit / Pages:Edit |
| D1 操作 | Account: D1:Edit |
| tail / observability | Account: Workers Tail:Read |
| user identity 取得 | （token 検証で `wrangler whoami` が exit 0 になる、最低 1 つ以上の Account scope） |

> token 値そのものは確認しない。1Password item の説明欄 / Cloudflare dashboard の token 管理画面で scope 設定だけを確認する。

### evidence 化ルール

- `outputs/phase-11/whoami-exit-code.log` — `bash scripts/cf.sh whoami; echo "exit=$?"` の `exit=` 行のみ
- `outputs/phase-11/whoami-account-identity.log` — `bash scripts/cf.sh whoami` の標準出力のうち identity 行のみ（token / secret は元から出力されない）
- `outputs/phase-11/redaction-checklist.md` — secret / token id / account secret が含まれていないことのチェック結果
- `outputs/phase-11/stage-isolation.md` — 三段ラップの各段でどこまで通ったか / どこで落ちたかの切り分け記録

### `wrangler login` 残置検知

| 確認項目 | コマンド | 期待 |
| --- | --- | --- |
| OAuth config 残置 | `ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1` | "No such file" を期待。存在する場合は除去 SOP を実行 |
| 除去 SOP | `rm ~/Library/Preferences/.wrangler/config/default.toml`（user 明示指示後） | `.env` op 参照経路に一本化 |

> `wrangler login` は CLAUDE.md「禁止事項」に従い使用しない。残置されている場合は user 明示指示後にのみ除去する。

### scripts/cf.sh / scripts/with-env.sh drift 確認

| 観点 | 確認方法 |
| --- | --- |
| `op run --env-file=.env` の呼び出し有無 | `scripts/with-env.sh` を Read（実コードを読む。`.env` の中身は読まない） |
| `mise exec --` の呼び出し有無 | `scripts/cf.sh` を Read |
| `ESBUILD_BINARY_PATH` 解決 | `scripts/cf.sh` を Read（Node 24 / esbuild バージョン整合） |
| secret を stdout に出さない実装 | `scripts/cf.sh` の log / echo 箇所を Read |

## 統合テスト連携

- Phase 4 のテスト戦略は契約テスト（exit code / stdout 形式 / secret 非露出）を中心とする
- Phase 11 の手動 smoke で三段ラップの各段が分離して観測される

## 多角的チェック観点

- secret 値・実 vault 名・実 item 名・account id を設計に書かない
- `wrangler` 直接呼出を設計に書かない（必ず `bash scripts/cf.sh` 経由）
- `wrangler login` を設計に組み込まない
- `.env` の中身を読む手順を設計に組み込まない（キー名抽出のみに限定）
- 三段ラップのどこで落ちたかが切り分け可能になっている

## サブタスク管理

- [ ] 三段ラップの構造図 / 失敗症状 / 切り分けコマンドを確定する
- [ ] `.env` op 参照キー存在確認手順を確定する（値は読まない）
- [ ] required token scope 一覧を確定する
- [ ] evidence 化ルールを確定する
- [ ] `wrangler login` 残置検知 / 除去 SOP を確定する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- 三段ラップの構造 / 切り分け方針 / evidence 化ルールが確定している
- `.env` op 参照キー存在確認手順 / required token scope が確定している
- `wrangler login` 残置検知 / 除去 SOP が確定している
- 仮置きパス / 仮置きコマンドが含まれていない

## タスク100%実行確認

- [ ] 仮置きパス / 仮置きコマンドが含まれていない
- [ ] secret 値・実 vault 名・実 item 名・account id が含まれていない
- [ ] `wrangler` 直接呼出が含まれていない
- [ ] `wrangler login` を採用する設計になっていない

## 次 Phase への引き渡し

Phase 3 へ、三段ラップ構造、切り分けコマンド、`.env` op 参照キー存在確認手順、required token scope、evidence 化ルール、`wrangler login` 残置検知 SOP を渡す。
