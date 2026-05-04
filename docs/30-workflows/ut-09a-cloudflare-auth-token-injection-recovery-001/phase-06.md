# Phase 6: 異常系検証 — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 6 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (treated as CLOSED for spec) |

## 目的

`bash scripts/cf.sh whoami` 復旧手順で発生しうる異常系を網羅的に列挙し、各々の検出条件・recover 手順・evidence 化方針を確定する。三段ラップ（op / mise / wrangler）の各段で「どの段で落ちたか」を確実に切り分けられる SOP を異常系単位で詰める。

## 実行タスク

1. Stage 1（op 段）の異常系（signin 未済 / item アクセス権限不足 / vault 切替忘れ）
2. Stage 2（mise 段）の異常系（Node version mismatch / wrangler バイナリ未解決）
3. Stage 3（wrangler 段）の異常系（token 失効 / scope 不足 / `wrangler login` 残置による上書き）
4. `.env` 系の異常系（op 参照キー欠落 / `.env` 自体が存在しない）
5. 1Password item 系の異常系（item 削除済 / item 名 typo）
6. secret 露出時の即時停止 / redaction ルール
7. 親タスク handoff 系の異常系（path 引き渡し失敗）

## 参照資料

- docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/phase-05.md
- scripts/cf.sh / scripts/with-env.sh
- CLAUDE.md「禁止事項」

## 異常系一覧

### Stage 1（op 段）系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| `op signin` 未済 | `op whoami` が `not signed in` を返す | user 明示指示後に `op signin` 実行（pass phrase / TouchID 入力は user 操作） |
| 1Password vault 切替忘れ | `op item list` で目的の item が見えない | `op` 側で vault を切替（item の値は読まない） |
| item アクセス権限不足 | `op item list` で item 名は見えるが secret 解決時に access denied | 1Password 側で権限を付与（user 操作） |
| `op run` ラップが旧版 | `op run --env-file=.env` が op CLI バージョンによって挙動差異 | `op --version` 確認、必要なら upgrade |

### Stage 2（mise 段）系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| Node version mismatch | `mise current` が Node 24 でない | `mise install` 実行 |
| wrangler バイナリ未解決 | `mise exec -- which wrangler` が空 | `mise exec -- pnpm install`（ワークツリーごとに必要） |
| `ESBUILD_BINARY_PATH` 解決失敗 | `bash scripts/cf.sh` 実行時に esbuild バージョン不整合エラー | `scripts/cf.sh` 側のロジック確認、必要なら最小修正 |

### Stage 3（wrangler 段）系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| token 失効 | `wrangler whoami` 相当が "Authentication error [code: 10000]" を返す | 1Password 側で token を更新 / 再発行（user 明示指示後）。値は仕様書に書かない |
| token scope 不足 | identity は取れるが deploy / d1 操作で 403 | dashboard / 1Password 説明欄で scope を付与 |
| `wrangler login` 残置による上書き | `~/Library/Preferences/.wrangler/config/default.toml` 存在 → `.env` 経路を上書きして OAuth 経路が優先される | 残置ファイルを user 明示指示後に除去 |
| 環境変数到達失敗 | `bash scripts/cf.sh whoami` が unauthenticated のまま。Codex は `.env` や `op run -- env` を読まない | 参照側スクリプトの要求キー確認とユーザー確認結果で `.env` / 1Password / token scope を切り分ける |

### `.env` 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| op 参照キー欠落 | `scripts/cf.sh` 側 grep で参照されているキー名を、ユーザーが `.env` に存在しないと確認した | `.env` に op 参照キーを追加（user 操作）。値は `op://...` 形式のみで、artifact には記録しない |
| `.env` 自体が存在しない | `ls .env` で No such file | `.env` を新規作成（user 操作）。値は op 参照のみ |
| `.env` に実値が混入 | ユーザー確認でキー値が `op://` 形式ではないと判明した | 即時 `.env` を 1Password 参照に書き換え（user 操作、CLAUDE.md「実値を絶対に書かない」） |

### 1Password item 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| item 削除済 | `op item list` に該当 item が見えない | user 明示指示後に item を再作成（値は user が直接 1Password 上で入力） |
| item 名 typo | ユーザー確認で `.env` 側 op 参照と 1Password 側 item が一致しない | item 名 / 参照キー名のいずれかを修正（artifact には実 item 名を書かない） |

### Secret / 個人情報露出

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| log に token 値 | `outputs/phase-11/*.log` に CLOUDFLARE_API_TOKEN の長い文字列 | log 全体破棄 → redaction 後に再取得 |
| log に account secret | account id + secret らしき文字列 | log 全体破棄 → redaction 後に再取得 |
| 仕様書に op 参照の vault 名 | 仕様書に `op://Vault/...` の Vault 名が転記 | 仕様書から削除し、抽象キー名に置換 |

### 親タスク handoff 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| path 引き渡し失敗 | 親タスク `ut-09a-exec-staging-smoke-001` Phase 11 から本タスク evidence path が解決できない | `outputs/phase-11/handoff-to-parent.md` の path 表記を workflow root からの絶対 path に揃える |
| 復旧 evidence が PASS でないまま親タスク再開 | 親タスク Phase 11 が再び `whoami` failure で停止 | 本タスク Phase 11 を再実行（fail loop に陥る場合は Stage 1〜3 の切り分け SOP を再走） |

## 多角的チェック観点

- 異常系を「失敗」ではなく「evidence 化対象」として扱う
- secret 露出時は AC PASS / FAIL 判定より優先で停止する
- 三段ラップのどの段で落ちたかを Stage 1〜3 で確実に切り分ける
- `wrangler login` を「対処手段」として採用する選択肢を絶対に作らない

## 統合テスト連携

Phase 11 runtime smoke で BLOCKED / FAIL が発生した場合、本 Phase の異常系分類に従って `outputs/phase-11/main.md` と該当 evidence file の冒頭へ原因を記録する。分類不能な失敗は AC を PASS にせず、Phase 12 compliance check に `EXECUTED_BLOCKED` として同期する。

## サブタスク管理

- [ ] 各異常系の検出条件と evidence 化フォーマットを記述
- [ ] AC への影響を case 単位で記述（AC-1 / AC-3 / AC-4 / AC-5 / AC-7 が主に影響）
- [ ] secret 露出時の即時停止フローを記述
- [ ] `wrangler login` を採用しない原則を再確認
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md

## 完了条件

- Stage 1 / Stage 2 / Stage 3 / `.env` / 1Password item / secret 露出 / 親タスク handoff の異常系が網羅されている
- 各 case の evidence 化と再実行条件が定義されている
- AC への影響が case 単位で記述されている

## タスク100%実行確認

- [ ] 異常系を PASS と誤認するルートが残っていない
- [ ] secret 露出時の停止が他判定より優先されている
- [ ] `wrangler login` を対処手段として採用するルートが残っていない

## 次 Phase への引き渡し

Phase 7 へ、AC マトリクスの前提（異常系含む）を渡す。
