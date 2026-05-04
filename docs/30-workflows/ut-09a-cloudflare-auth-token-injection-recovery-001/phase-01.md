# Phase 1: 要件定義 — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 1 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (OPEN, treated as CLOSED for spec) |
| scope | `bash scripts/cf.sh whoami` を exit 0 へ復旧する SOP / `.env` op 参照と 1Password item の存在確認 / `scripts/cf.sh` `scripts/with-env.sh` の drift 確認のみ。secret 値の記録 / `wrangler login` 採用 / 実 deploy / commit / push / PR は user 明示指示時のみ |

## Schema / 共有コード Ownership 宣言

| 対象 | 本タスクでの編集権 | owner / 参照元 | 理由 |
| --- | --- | --- | --- |
| DB schema / migrations | no | U-04 / 03a / 03b | 本タスクは認証経路の復旧のみで schema を変更しない |
| shared schema / packages/shared | no | upstream implementation tasks | API contract 変更を含まない |
| `scripts/cf.sh` | yes（必要時に最小修正） | 本タスク | `whoami` を含む Cloudflare CLI ラッパーの drift 確認・必要時の最小修正 |
| `scripts/with-env.sh` | yes（必要時に最小修正） | 本タスク | `op run --env-file=.env` ラッパーの drift 確認・必要時の最小修正 |
| `.env` | no（参照のみ・値を読まない） | local 開発者 | op 参照キーの存在確認のみ。値は読まない / 記録しない |
| 1Password vault items | no（存在確認のみ） | local 開発者 | item の存在確認のみ。値は読まない / 記録しない |
| Cloudflare API Token（dashboard 側） | no（scope 設定確認のみ） | local 開発者 | scope の確認のみ。本タスクで token を再発行しない（再発行は user 明示指示時のみ） |
| `apps/api` / `apps/web` 側 routes / config | no | apps owner | 本タスクは認証経路に閉じる |
| aiworkflow-requirements index | yes, Phase 12 only | 本タスク | task-workflow-active 同期 / discoverability の正本同期のみ |

## 変更対象ファイル一覧（CONST_005）

- 確認 / 必要時に最小修正: `scripts/cf.sh`
  - `whoami` サブコマンドの三段ラップ（`op run --env-file=.env` → `mise exec --` → `wrangler whoami`）が drift していないこと
  - `ESBUILD_BINARY_PATH` 解決が現状の Node 24 / esbuild 環境に整合していること
  - secret 値を stdout / log に出さない実装であること
- 確認 / 必要時に最小修正: `scripts/with-env.sh`
  - `op run --env-file=.env` ラップ実装が drift していないこと
- 確認のみ: `.env`
  - Cloudflare API Token 用 op 参照キー（例: `CLOUDFLARE_API_TOKEN=op://...`）が存在すること
  - 値は `Read` / `cat` / `grep` で読まない（CLAUDE.md 禁止事項）
- 確認のみ: 1Password vault item の存在
  - `op item list` 等で存在確認のみ実施。値は `op item get` で読まない
- 確認のみ: Cloudflare dashboard の API Token 設定（必要 scope 付与状況）

## 関数 / コマンド signature（本タスクで固定する正本）

```
bash scripts/cf.sh whoami
  # exit 0 の場合: account identity が stdout に出力される（token 値は出力されない）
  # exit ≠ 0 の場合: "You are not authenticated" 等のメッセージが stderr に出力される

bash scripts/cf.sh d1 list
bash scripts/cf.sh deploy --config <wrangler.toml> --env <env>
  # いずれも内部で op run --env-file=.env → mise exec -- → wrangler を呼ぶ
```

## 入出力契約

- 入力: なし（`scripts/cf.sh whoami` はサブコマンドのみ）
- 標準出力: Cloudflare account identity（email / account id 等、CLI 既定出力）
- 標準エラー: 認証失敗時のメッセージ
- exit code: 0（成功） / 非 0（失敗）
- 副作用: ファイル書き込みなし。`op run` が環境変数を揮発的に注入するのみ
- evidence 化対象: exit code / 標準出力（redaction 後 / token 値は元から出ない設計）

## 目的

`bash scripts/cf.sh whoami` の `You are not authenticated` 状態を、1Password / `.env` / Cloudflare API Token / `scripts/cf.sh` 経路の整合性確認と必要最小修正で解消し、staging 操作対象 Cloudflare account で exit 0 を返す状態に戻す。本 phase ではその scope / AC / 上流前提 / approval gate / 三段ラップ切り分け方針を確定する。

## 実行タスク

1. 既存の `scripts/cf.sh` `scripts/with-env.sh` を Read し、`whoami` 実行時の三段ラップ（op → mise → wrangler）の構造と secret 注入経路を文書化する。完了条件: 三段ラップの呼び出し関係が文書化される。
2. `.env` に存在すべき op 参照キー名（値ではなくキー名のみ）を CLAUDE.md / `scripts/cf.sh` から逆引きして列挙する。完了条件: キー名のみが列挙され、値・vault 名は記録されない。
3. user approval が必要な操作（実 `whoami` 実行 / token 再発行 / commit / push / PR / production deploy）を分離する。完了条件: 自走禁止操作が明記される。
4. AC-1〜AC-7 と evidence path / 切り分け層（op 段 / mise 段 / wrangler 段）の対応表を確定する。完了条件: 対応表が確定する。
5. `wrangler login` 禁止 / OAuth トークン残置禁止の SOP を Phase 5 / 6 に申し送る方針を確定する。完了条件: 申し送り項目が明記される。

## 参照資料

- docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md
- docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/main.md
- scripts/cf.sh / scripts/with-env.sh
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」「禁止事項」セクション
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## 実行手順

- 対象 directory: docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/
- 本仕様書作成では実 `whoami` 実行 / token 再発行 / commit / push / PR を行わない
- 実復旧 / evidence 取得は Phase 5 / Phase 11 の runbook に従う
- Cloudflare CLI は必ず `bash scripts/cf.sh` 経由で扱い、`wrangler` を直接呼ばない
- `.env` の中身は `Read` / `cat` / `grep` で読まない（op 参照キー名は `scripts/cf.sh` 等の参照側から逆引き）

## 統合テスト連携

- 上流: ut-27（GitHub Secrets / Variables）/ 1Password CLI signin / Cloudflare API Token の事前発行
- 下流: `ut-09a-exec-staging-smoke-001` Phase 11（本タスク復旧後に再実行する）

## 多角的チェック観点

- secret 値（API Token / OAuth token / cookie / account secret）を stdout / artifact / log / 仕様書に記録しない（存在確認のみ）
- `wrangler` 直接実行に切り替えない（必ず `bash scripts/cf.sh` 経由）
- `wrangler login` で OAuth トークンを残置しない（CLAUDE.md 禁止事項）
- `.env` の中身を直接読まない
- Issue #414 を本仕様書作成では reopen / close しない

## サブタスク管理

- [ ] `scripts/cf.sh` `scripts/with-env.sh` の三段ラップ構造を文書化する
- [ ] `.env` に存在すべき op 参照キー名を列挙する（値は記録しない）
- [ ] required token scope を列挙する（Workers Scripts Edit / D1 Edit / Pages Edit 等）
- [ ] AC-1〜AC-7 と evidence path / 切り分け層の対応表を作成する
- [ ] approval gate 一覧を明記する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 完了条件

- 三段ラップ（op → mise → wrangler）の構造と切り分け方針が確定している
- `.env` op 参照キー名（値ではない）と必要 token scope が列挙されている
- AC-1〜AC-7 と evidence path / 切り分け層の対応表が確定している
- approval gate（実 `whoami` 実行 / token 再発行 / commit / push / PR）が分離されている
- `wrangler login` 禁止 SOP の申し送りが明記されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] task-09a-cloudflare-auth-token-injection-recovery-001 の bug-fix follow-up gate の仕様になっている
- [ ] 実 `whoami` 実行 / token 再発行 / commit / push / PR を実行していない
- [ ] secret 値・実 vault 名を含めていない

## 次 Phase への引き渡し

Phase 2 へ、三段ラップ構造、`.env` op 参照キー名一覧、必要 token scope、AC-evidence-切り分け層対応表、approval gate、`wrangler login` 禁止 SOP の申し送りを渡す。
