# Phase 11: 手動 smoke / 実測 evidence — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 11 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (treated as CLOSED for spec) |
| execution_allowed | false until explicit_user_instruction |

## 目的

`bash scripts/cf.sh whoami` を実行し、`You are not authenticated` 状態から exit 0 + staging 操作対象 Cloudflare account identity を返す状態に復旧したことを実測 evidence で確定する。secret 値を一切露出させず、復旧 evidence path を親タスク `ut-09a-exec-staging-smoke-001` Phase 11 に引き渡す。**実行は user 明示指示後**。

## 実行タスク（実行は user 明示指示後）

1. 復旧前 baseline: `bash scripts/cf.sh whoami; echo "exit=$?"` を実行し失敗症状を記録（token 値は元から出ない）
2. Stage 1（op 段）切り分け: `op whoami` / `op item list | head` を実行し evidence 化
3. Stage 2（mise 段）切り分け: `mise current` / `mise exec -- which wrangler` を実行し evidence 化
4. `.env` op 参照存在確認: `scripts/cf.sh` 側 grep で要求キー名を逆引きし、`.env` 側はユーザー確認結果のみ記録する（Codex は `.env` を読まない）
5. 1Password item 存在確認: ユーザーが 1Password で存在確認し、artifact には `confirmed_by_user` のみ記録する
6. token scope 点検: ユーザーが 1Password 説明欄 / Cloudflare dashboard で必要 scope を確認する（token 値は読まない）
7. `wrangler login` 残置検知: `ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1` 実行
8. 残置されている場合は **user 明示指示後のみ** 除去
9. 復旧後 `whoami`: `bash scripts/cf.sh whoami; echo "exit=$?"` を実行し exit 0 + identity を確認
10. evidence を `outputs/phase-11/` に集約し redaction-checklist を完了
11. `outputs/phase-11/handoff-to-parent.md` に親タスク参照可能な path 一覧を記録
12. `artifacts.json` parity を更新し、Issue #414 (OPEN) は OPEN のまま据え置き

## 参照資料

- `docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md`
- `docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/main.md`
- scripts/cf.sh / scripts/with-env.sh
- CLAUDE.md（secret / cf.sh / 禁止事項）

## 統合テスト連携

- 復旧後の `bash scripts/cf.sh whoami` exit 0 + identity 取得 + redaction PASS の 3 つを揃えて初めて AC-1 / AC-2 を PASS にする
- AC-3〜AC-5 / AC-7 はそれぞれ独立 evidence で判定する
- AC-6 は親タスク handoff path として記録した時点で PASS
- PASS / FAIL / BLOCKED 結果は Phase 7 AC matrix と Phase 12 system spec 更新に接続する

## 必須 evidence path（NON_VISUAL）

| path | 内容 | 関連 AC |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 実行サマリ | 全体 |
| `outputs/phase-11/whoami-exit-code.log` | `bash scripts/cf.sh whoami` の `exit=` 行 | AC-1 |
| `outputs/phase-11/whoami-account-identity.log` | identity 行のみ（token 非露出） | AC-1 |
| `outputs/phase-11/redaction-checklist.md` | secret 非露出 / vault 名・item 名非転記の確認 | AC-2 |
| `outputs/phase-11/env-key-existence.md` | `.env` キー名 + 1Password item 名の存在確認（値は記録しない） | AC-3 |
| `outputs/phase-11/token-scope-checklist.md` | 必要 scope の checklist | AC-4 |
| `outputs/phase-11/stage-isolation.md` | Stage 1〜3 各段の到達 / 失敗記録 | AC-5 |
| `outputs/phase-11/handoff-to-parent.md` | 親タスク `ut-09a-exec-staging-smoke-001` への path 引き渡し記録 | AC-6 |
| `outputs/phase-11/wrangler-login-residue.md` | OAuth config 残置確認 / 除去記録 | AC-7 |

`redaction-checklist.md` が PASS でない場合、AC-1 / AC-2 / AC-3 / AC-5 は PASS にしない。

## 多角的チェック観点

- placeholder（`<account>` など）のままで PASS にしない
- secret 値（API Token / OAuth token / cookie / account secret）/ 実 vault 名 / 実 item 名 を artifact / log に保存しない
- `.env` の値（`op://` 以降の参照値）も保存しない
- 取得不能ケース（op signin 不可・token 失効等）は「実行不能」として log 冒頭に理由を明記し、AC ごとに `BLOCKED` で記録する
- token 再発行 / `wrangler login` 残置除去 / `op signin` は user 明示指示が無い限り絶対に行わない
- 復旧後の identity 表示に email が含まれる場合、redaction 判断対象として扱う

## サブタスク管理

- [ ] user から実 `whoami` 復旧実行の明示指示を得る
- [ ] 復旧前 baseline を記録
- [ ] Stage 1 / Stage 2 / Stage 3 切り分けを記録
- [ ] `.env` キー名 + 1Password item 存在確認
- [ ] token scope 点検
- [ ] `wrangler login` 残置検知（除去は user 明示指示後）
- [ ] 復旧後 `whoami` 実行
- [ ] 親タスク handoff path 記録
- [ ] redaction checklist を完了
- [ ] `artifacts.json` を更新
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- 上記「必須 evidence path」一式

## 完了条件

- AC-1〜AC-7 がそれぞれ PASS / FAIL / BLOCKED いずれかで判定済み
- `outputs/phase-11/` に必須ファイルが揃っている
- redaction-checklist が PASS
- `artifacts.json` parity が PASS
- 親タスクへの handoff が完了している

## タスク100%実行確認

- [ ] secret / vault 名 / item 名 / `.env` 値 / 個人情報 漏洩がゼロ
- [ ] AC ごとに evidence path が実在
- [ ] `bash scripts/cf.sh whoami` が exit 0 で identity を返している
- [ ] `wrangler login` を実行していない
- [ ] 親タスク handoff path が記録されている

## 次 Phase への引き渡し

Phase 12 へ、実測 evidence と system spec 更新差分の元データを渡す。
