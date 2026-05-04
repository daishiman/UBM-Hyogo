# Phase 4: テスト戦略 — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 4 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (treated as CLOSED for spec) |

## 目的

本タスクは shell script 経由の認証経路復旧であり、ユニットテスト対象のコード差分が中心ではない。そのため契約テスト（exit code / 標準出力形式 / secret 非露出）と SOP 検証（三段ラップ切り分け / `.env` 非露出 / `wrangler login` 残置検知）を中心に、ローカル smoke / staging 確認の役割分担と各 AC の検証戦略を確定する。

## 実行タスク

1. 三段ラップ各段の到達確認手段（op 段 / mise 段 / wrangler 段）を契約テストとして定義する
2. `bash scripts/cf.sh whoami` の exit code / 標準出力形式を契約テストとして固定する
3. secret 非露出（token 値が log / artifact に出ない）を契約として固定する
4. `wrangler login` 残置検知 SOP の検証手順を定める
5. `.env` 値非露出（`.env` の値を読まない運用）を SOP 検証として組み込む

## 参照資料

- scripts/cf.sh（実コード・必要時にのみ最小修正）
- scripts/with-env.sh（実コード・必要時にのみ最小修正）
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」「禁止事項」
- docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md

## テスト戦略

### Layer 1: 契約テスト — `bash scripts/cf.sh whoami` 出力契約

- 対象 AC: AC-1 / AC-2
- 範囲:
  - exit 0 時: 標準出力に Cloudflare account identity（email / account id 等）が現れること
  - exit ≠ 0 時: 標準エラーに認証失敗メッセージが現れること
  - いずれの場合も標準出力 / 標準エラーに API Token / OAuth token / cookie 値が含まれないこと
- 手段: 復旧前後で `bash scripts/cf.sh whoami` を実行し、stdout / stderr / exit code を redaction 後に保存

### Layer 2: 三段ラップ切り分け SOP 検証

- 対象 AC: AC-5
- 範囲:
  - Stage 1（op）: `op whoami` exit 0 / `op item list | head` で item 名が見えること（値は読まない）
  - Stage 2（mise）: `mise current` で Node 24 / pnpm 10 が現在 active であること、`mise exec -- which wrangler` で wrangler バイナリが解決できること
  - Stage 3（wrangler）: 環境変数注入後に `wrangler whoami` 相当が exit 0 になること（`bash scripts/cf.sh whoami` を最終確認として使う）
- 手段: 各 stage の確認コマンドを SOP として固定し、復旧手順実行中に各段の到達状態を `outputs/phase-11/stage-isolation.md` に記録

### Layer 3: `.env` op 参照存在確認

- 対象 AC: AC-3
- 手段:
  - `scripts/cf.sh` / `scripts/with-env.sh` を Read し、参照されている環境変数名（`CLOUDFLARE_API_TOKEN` 等）を逆引きで列挙
  - 該当キーが `.env` に存在し `op://...` 形式を指すことはユーザー確認結果として記録する（Codex は `.env` を読まない）
  - 1Password 側に対応する item が存在することを `op item list` で確認（item の値は `op item get` で読まない）
- evidence: `outputs/phase-11/env-key-existence.md`（キー名と存在 / 不存在のみ記録）

### Layer 4: token scope 点検 SOP

- 対象 AC: AC-4
- 手段:
  - 1Password item の説明欄 / Cloudflare dashboard の token 管理画面で scope を確認（token 値そのものは読まない）
  - 必要 scope（Workers Scripts:Edit / D1:Edit / Pages:Edit / Workers Tail:Read 等）の付与状況を chesklist 形式で記録
- evidence: `outputs/phase-11/token-scope-checklist.md`

### Layer 5: `wrangler login` 残置検知 / 除去 SOP

- 対象 AC: AC-7
- 手段:
  - `ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1` の結果記録
  - 残置している場合は user 明示指示後にのみ除去
- evidence: `outputs/phase-11/wrangler-login-residue.md`

### Layer 6: 親タスクへの引き渡し contract

- 対象 AC: AC-6
- 手段:
  - `outputs/phase-11/main.md` に復旧 evidence path を集約
  - 親タスク `ut-09a-exec-staging-smoke-001` の Phase 11 で参照可能な path 形式（相対パスではなく workflow root からの path）で記録
- evidence: `outputs/phase-11/handoff-to-parent.md`

### AC ↔ Layer 対応

| AC | 内容 | Layer | 主コマンド | evidence path |
| --- | --- | --- | --- | --- |
| AC-1 | `bash scripts/cf.sh whoami` exit 0 + account identity | Layer 1 | `bash scripts/cf.sh whoami; echo "exit=$?"` | `outputs/phase-11/whoami-exit-code.log` / `outputs/phase-11/whoami-account-identity.log` |
| AC-2 | secret 値が log / artifact に混入しない | Layer 1 + redaction | redaction-checklist 適用 | `outputs/phase-11/redaction-checklist.md` |
| AC-3 | `.env` op 参照キー存在 + 1Password item 存在 | Layer 3 | 参照側スクリプトの要求キー確認 + ユーザー確認結果 | `outputs/phase-11/env-key-existence.md` |
| AC-4 | token scope 点検 PASS | Layer 4 | dashboard / 1Password 説明欄 確認 | `outputs/phase-11/token-scope-checklist.md` |
| AC-5 | 三段ラップの各段切り分け SOP 成立 | Layer 2 | `op whoami` / `mise current` / `bash scripts/cf.sh whoami` | `outputs/phase-11/stage-isolation.md` |
| AC-6 | 親タスクへ evidence path 引き渡し | Layer 6 | path collation | `outputs/phase-11/handoff-to-parent.md` |
| AC-7 | `wrangler login` OAuth 残置なし | Layer 5 | `ls ~/Library/Preferences/.wrangler/config/default.toml` | `outputs/phase-11/wrangler-login-residue.md` |

## 統合テスト連携

- 親タスク `ut-09a-exec-staging-smoke-001` の Phase 11 は本タスク Phase 11 の AC-6 evidence path を入力として再開する
- Phase 11 で `whoami` PASS が取れない場合は本タスク Phase 6 異常系分類に従い分類して記録する

## 多角的チェック観点

- ハッピーパス（`whoami` PASS）のみで AC PASS にしない（AC-2 / AC-7 など並行確認が必要）
- redaction 漏れ（log / artifact への token 混入）を PASS 条件に必ず含める
- 三段ラップの 1 段でも切り分け不能なら AC-5 を PASS にしない

## サブタスク管理

- [ ] AC-1〜AC-7 に Layer を割り当てる
- [ ] 三段ラップ切り分け SOP を契約として定義する
- [ ] redaction checklist を log evidence の PASS 条件に紐付ける
- [ ] `wrangler login` 残置検知 SOP を定義する
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md

## 完了条件

- AC-1〜AC-7 がいずれかの Layer で検証可能になっている
- Layer 別のコマンド・evidence path が `outputs/phase-11/` 配下と一致している
- redaction の責務が log evidence の PASS 条件に組み込まれている
- 親タスクへの handoff contract が定義されている

## タスク100%実行確認

- [ ] AC ↔ Layer の割当に漏れがない
- [ ] 契約テスト / SOP 検証 / 親タスク handoff の役割分担が明確である
- [ ] redaction ルールが含まれている

## 次 Phase への引き渡し

Phase 5 へ、AC ↔ Layer 割当・三段ラップ切り分け SOP・`.env` op 参照存在確認手順・token scope 点検 SOP・`wrangler login` 残置検知 SOP・親タスク handoff contract を渡す。
