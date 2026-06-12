# T04: diagnose-profile-session.sh に transport 確認手順 echo を追加（read-only・冪等）

> レーン C。コードに依存しない完全独立タスク。並列着手可。

正本参照: `../../_shared-context.md`（§4 F6・§9 DoD 実機確認手順）/ `../phase-4/phase-4.md`（§4 ログ出力キー契約）/ 実機確認は Phase 11 手順

## 既存スクリプトの現状（踏まえる前提）

`scripts/diagnose-profile-session.sh` は既存（前 WF 成果・dev 取込済）。read-only で、`set -euo pipefail` のもと:
- `BASE_URL`（既定 staging）の `/me` に `curl` で HTTP ステータスのみ取得（`-o /dev/null -w "%{http_code}"`）。
- `profile_session.me_status` / `base_url` / `cookie_source` / `curl_exit` を出力。
- `scripts/cf.sh` の有無で `cf_wrapper` present/missing と `cf_env` を出力。
- ステータスごとに `profile_session.candidate=...`（401/404/410/5xx/000/2xx/その他）を分類出力。
- cookie / secret / token / member identifier は一切出力しない旨を usage に明記済。

本タスクは**この read-only / 冪等性を一切壊さず**、「transport（service-binding か http か・どの host か）を `wrangler tail` で確認する手順」への案内 echo を追加するだけ。

## 変更対象ファイル

| # | ファイル | 種別 | 変更概要 |
|---|---------|------|---------|
| 1 | `scripts/diagnose-profile-session.sh` | 編集 | `server_fetch_failed` ログの `transportKind`/`baseHost` を `wrangler tail`（`scripts/cf.sh` 経由）で確認する案内 echo を追加 |

新規スクリプトは作らない。テストコードは追加しない（シェルスクリプトは `bash -n` 構文検査で担保）。

## シグネチャ（出力契約）

新規に出力する行（`printf` で既存スタイルに合わせる。`profile_session.*` 名前空間を踏襲）:

| 出力キー（例） | 内容 |
|----------------|------|
| `profile_session.transport_hint` | `server_fetch_failed` ログに `transportKind`/`baseHost` が出る旨と、`baseHost` が service-binding 固定 origin の host（= localhost でない）であることを確認する案内 |
| `profile_session.tail_cmd_hint` | `wrangler tail` を直叩きせず `bash scripts/cf.sh` 経由で観測する案内（実コマンド文字列は案内テキストとして表示。`wrangler` 直叩きを促さない） |

実装方針:
- 既存の `printf 'profile_session.cf_wrapper=...'` ブロックの近傍に、`cf_wrapper=present` のときだけ `tail_cmd_hint` を出す分岐を追加してよい（present のときのみ tail 案内が意味を持つため）。
- 案内テキストには `127.0.0.1` / `localhost` / `8787` / `8888` の**リテラルを新規に書かない**（不変条件 #4・`verify-no-localhost-bake` gate）。「`baseHost` が localhost でないことを確認する」という**説明文**は可（説明文中の語としての言及は許容。コードリテラル URL を足さない）。
- secret / token / cookie / member identifier を出力しない（既存方針維持）。`wrangler tail` コマンド例にトークンや secret を埋め込まない。

## 入出力・副作用

- 入力: 既存の環境変数（`PROFILE_SESSION_*`）。新規環境変数は増やさない。
- 出力: 既存出力 + `transport_hint` / `tail_cmd_hint` の案内行（stdout）。
- 副作用: なし（read-only。ネットワークは既存 `curl /me` のみ。`wrangler tail` は**案内のテキスト出力に留め、スクリプトからは実行しない**＝冪等性維持）。
- `set -euo pipefail` を維持。終了コードの挙動を変えない。

## テスト方針

- シェルスクリプトのため unit test は追加しない。`bash -n scripts/diagnose-profile-session.sh` で構文検査。
- read-only / 冪等性の確認: スクリプトが `wrangler` を実行しないこと（案内テキストのみ）を目視 + grep で確認。
- `verify-no-localhost-bake`（`--src-only` は src スコープだが、scripts は別途）で localhost リテラル新規追加が無いこと。スクリプト単体は `grep -nE '127\.0\.0\.1|localhost|:8787|:8888' scripts/diagnose-profile-session.sh` で新規リテラル 0 を確認（既存 script に該当リテラルは無い）。

## ローカル実行・検証コマンド

```bash
bash -n scripts/diagnose-profile-session.sh
grep -nE '127\.0\.0\.1|localhost|:8787|:8888' scripts/diagnose-profile-session.sh || echo "no-localhost-literal: ok"
# read-only 確認（wrangler を実行しないこと）
grep -nE '\bwrangler\b' scripts/diagnose-profile-session.sh   # 案内テキスト内のみ・実行行が無いこと
# 任意の実行確認（ネットワーク到達は staging 依存・user-gated）
PROFILE_SESSION_BASE_URL=https://example.invalid bash scripts/diagnose-profile-session.sh
```

## 完了条件(DoD)

- [ ] `transport_hint` / `tail_cmd_hint` の案内行が追加され、`transportKind`/`baseHost` を `wrangler tail`（`scripts/cf.sh` 経由）で確認する導線が示される。
- [ ] スクリプトは read-only / 冪等のまま（`wrangler` を実行しない・案内テキストのみ）。
- [ ] `127.0.0.1`/`localhost`/`8787`/`8888` の新規リテラルを追加していない。
- [ ] secret / token / cookie / member identifier を出力しない。
- [ ] `bash -n` 構文検査 green。
