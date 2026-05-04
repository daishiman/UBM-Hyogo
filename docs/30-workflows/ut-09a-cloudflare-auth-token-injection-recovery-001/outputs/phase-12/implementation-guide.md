# Implementation Guide — ut-09a-cloudflare-auth-token-injection-recovery-001

## Part 1: 中学生レベルの説明

### 何をするタスクか

Cloudflare というクラウドサービスを操作するための「合言葉（API Token）」がうまく届かなくなって、`bash scripts/cf.sh whoami`（自己紹介してねコマンド）が「君が誰か分からないよ（You are not authenticated）」と返してしまっています。これを直して、「あなたは ◯◯ さんですね」と返してくれる状態にする作業です。

### 例え話: 家の鍵の話

- **家の鍵 = Cloudflare API Token**
  Cloudflare の家のドアを開けるための鍵。これがないと中に入れない。
- **鍵預かり所 = 1Password**
  鍵をなくさないように預かってくれる安全な場所。鍵を渡すときには毎回ここから出してもらう。
- **ロッカー番号メモ = `.env` の op 参照**
  「鍵預かり所のロッカー 5 番に大事な鍵があります」とメモした紙。**鍵そのものはメモには書いていない。** 番号だけ。
- **三段ラップ（op run → mise exec → wrangler）**
  1. 鍵預かり所からロッカー番号で鍵を出してもらう（op run）
  2. 正しい部屋に持っていく（mise exec で Node 24 環境を選ぶ）
  3. 玄関を開ける（wrangler が Cloudflare に話しかける）
  どこかでつまずくと玄関が開かない。今回はその「どこでつまずいたか」を調べて直します。

### `wrangler login` 残置 とは

「予備の鍵を勝手に作って、鍵預かり所と別管理してしまう状態」です。これがあると、鍵預かり所の鍵より予備の鍵が優先されてしまって、鍵預かり所のメモを直しても玄関が開かないままになります。なので予備の鍵は作らない / 残っていたら捨てる、というルールにしています。

### 中身を絶対に覗かない理由

鍵そのもの（API Token の値）を見てしまうと、メモやログにうっかり書き写してしまう事故が起きます。だから「ロッカーに鍵があるか」「ロッカー番号メモに番号が書いてあるか」だけ確認して、**鍵自体は絶対に開けて見ない** ルールにしています。

### 専門用語セルフチェック

| 用語 | やさしい説明 |
| --- | --- |
| API Token | Cloudflare の家を開ける鍵 |
| 1Password | 鍵預かり所 |
| `.env` の op 参照 | 鍵預かり所のロッカー番号メモ。鍵そのものは書いていない |
| op run | 鍵預かり所から鍵を出してもらう動作 |
| mise exec | 正しい部屋（Node 24 環境）に持っていく動作 |
| wrangler whoami | 鍵で玄関を開けて「自己紹介してね」と聞く動作 |
| `wrangler login` | 予備の鍵を勝手に作る動作。**禁止** |
| `bash scripts/cf.sh` | Cloudflare に話しかけるときの正しい受付窓口。直接 `wrangler` を呼んではいけない |

## Part 2: 技術者向け

### 三段ラップ図解

```
┌──────────────────────────────────────────────────────────────────┐
│ Stage 1: 1Password                                               │
│   op run --env-file=.env -- <child>                              │
│     └── .env の op://Vault/Item/Field 参照を実値に解決           │
│         子プロセスの環境変数として揮発的に注入                   │
│   失敗症状: "op signin needed" / "could not resolve secret ref"  │
│   切り分け: op whoami / op item list                             │
└──────────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ Stage 2: mise                                                    │
│   mise exec -- <child>                                           │
│     └── Node 24 / pnpm 10 / wrangler バイナリを解決              │
│   失敗症状: "command not found: wrangler" / Node mismatch        │
│   切り分け: mise current / mise exec -- which wrangler           │
└──────────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ Stage 3: wrangler                                                │
│   wrangler whoami                                                │
│     └── 環境変数 CLOUDFLARE_API_TOKEN を読み Cloudflare API へ   │
│         identity 問い合わせ                                      │
│   失敗症状: "You are not authenticated" / "Auth error 10000"     │
│   切り分け: bash scripts/cf.sh whoami の最終 exit code で判定    │
└──────────────────────────────────────────────────────────────────┘
```

### 変更対象ファイル一覧

| file | 変更内容 |
| --- | --- |
| `scripts/cf.sh` | drift 確認 / 必要時にのみ最小修正（Stage 2-3 のラップ構造、`ESBUILD_BINARY_PATH` 解決、secret 非露出を維持） |
| `scripts/with-env.sh` | drift 確認 / 必要時にのみ最小修正（`op run --env-file=.env` ラップ構造を維持） |
| `.env` | 値は読まない。op 参照キー名（`CLOUDFLARE_API_TOKEN=op://...` 形式）の存在を「キー名抽出のみ」で確認 |

`apps/api` / `apps/web` 側 routes / config には変更なし。

### コマンド signature

```bash
bash scripts/cf.sh whoami
  # exit 0: account identity を stdout 出力（token 値は出力されない）
  # exit ≠ 0: stderr に認証失敗メッセージ
```

### `.env` op 参照存在確認 SOP（Codex は `.env` を読まない）

```bash
# 1. scripts/cf.sh / scripts/with-env.sh が参照する環境変数名を逆引き
grep -nE 'CLOUDFLARE_[A-Z_]+' scripts/cf.sh scripts/with-env.sh
```

2. ユーザーがローカル `.env` を確認し、要求キーが存在し `op://...` 形式を指すことを確認する。
3. ユーザーが 1Password / Cloudflare dashboard で item existence と required scope を確認する。
4. artifact には要求キー名、`confirmed_by_user`、scope checklist のみを記録する。secret 値・実 vault 名・実 item 名・`.env` 値は記録しない。

### token scope 点検 SOP

| 操作対象 | 必要 scope（最低限） |
| --- | --- |
| Workers / Pages deploy | Account: Workers Scripts:Edit / Workers Routes:Edit / Pages:Edit |
| D1 操作 | Account: D1:Edit |
| tail / observability | Account: Workers Tail:Read |
| user identity 取得 | 最低 1 つ以上の Account scope |

token 値そのものは確認しない。1Password item の説明欄 / Cloudflare dashboard の token 管理画面で scope 設定だけを確認する。

### 復旧手順（runbook 抜粋）

```bash
# 0. 認証確認（復旧前 baseline）
bash scripts/cf.sh whoami; echo "exit=$?"

# 1. Stage 1（op 段）切り分け
op whoami; echo "exit=$?"
op item list 2>&1 | head

# 2. Stage 2（mise 段）切り分け
mise current
mise exec -- node -v
mise exec -- which wrangler

# 3. Stage 3（wrangler 段）+ .env op 参照確認
grep -nE 'CLOUDFLARE_[A-Z_]+' scripts/cf.sh scripts/with-env.sh
# .env / 1Password / token scope はユーザー確認結果のみを記録する

# 4. wrangler login 残置確認
ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1
# 残置ありかつ user 明示指示後のみ:
# rm ~/Library/Preferences/.wrangler/config/default.toml

# 5. 復旧後 whoami（user 明示指示後）
bash scripts/cf.sh whoami; echo "exit=$?"
```

### AC ↔ evidence path 対応表

| AC | 内容 | evidence path |
| --- | --- | --- |
| AC-1 | `bash scripts/cf.sh whoami` exit 0 + identity | `outputs/phase-11/whoami-exit-code.log` / `outputs/phase-11/whoami-account-identity.log` |
| AC-2 | secret / vault 名 / item 名 非露出 | `outputs/phase-11/redaction-checklist.md` |
| AC-3 | `.env` op 参照キー + 1Password item 存在 | `outputs/phase-11/env-key-existence.md` |
| AC-4 | token scope 点検 PASS | `outputs/phase-11/token-scope-checklist.md` |
| AC-5 | 三段ラップ Stage 1〜3 切り分け SOP 成立 | `outputs/phase-11/stage-isolation.md` |
| AC-6 | 親タスクへの evidence path handoff | `outputs/phase-11/handoff-to-parent.md` |
| AC-7 | `wrangler login` OAuth 残置なし | `outputs/phase-11/wrangler-login-residue.md` |

### Definition of Done

- AC-1〜AC-7 が全て PASS
- `redaction-checklist.md` PASS（secret / vault 名 / item 名 / `.env` 値 / 個人情報の非露出）
- `artifacts.json` parity PASS
- 親タスク `ut-09a-exec-staging-smoke-001` Phase 11 への handoff 完了
- Issue #414 が OPEN のまま据え置かれている（本タスクで close しない）
- secret 値が PR diff / log に含まれていない
- `wrangler login` を採用していない / 残置していない

### 失敗時の切り分け

1. `op whoami` exit ≠ 0 → user 明示指示後に `op signin` 実行
2. `mise exec -- which wrangler` 解決失敗 → `mise exec -- pnpm install`
3. `bash scripts/cf.sh whoami` で "Authentication error 10000" → token 失効 → 1Password で token 更新（user 明示指示後）
4. `~/Library/Preferences/.wrangler/config/default.toml` 残置 → user 明示指示後に除去
5. `.env` キー名抽出で `CLOUDFLARE_API_TOKEN` が見えない → `.env` に op 参照キーを追加（実値は user が `op://...` 形式で記述）
