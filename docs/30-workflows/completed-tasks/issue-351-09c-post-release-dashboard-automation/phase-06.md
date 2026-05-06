# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | completed |

実装が網羅すべき failure mode と検出・回復方針を一覧化する。


## 目的

Cloudflare API、D1 metrics、cron status、artifact 保存、secret 誤用の異常系を検証する。


## 実行タスク

- 既存本文の該当 Phase 内容を確認する。
- artifacts.json の phase status と outputs 宣言に矛盾がないことを確認する。
- 後続実装が必要な項目は user gate と evidence path を明示する。


## 参照資料

- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/index.md`
- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`


## 成果物

- `phase-06.md`
- `outputs/phase-06/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない


## 統合テスト連携

- 本仕様書サイクルでは実装未着手のため、実行可能な統合テストは後続実装サイクルで取得する。
- Phase 11 では NON_VISUAL evidence として CLI / GitHub Actions log / artifact JSON / redaction check / schema check を保存する。

## 1. 失敗モード一覧

| ID | 失敗モード | 発火条件 | workflow 上の挙動 | 検出 | 回復 |
| --- | --- | --- | --- | --- | --- |
| F-1 | analytics token 未配置 | `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` secret 未登録 | step `Verify token presence` で exit 1 | step log | 1Password から rotate 後に secret 再登録 |
| F-2 | analytics token 失効 / scope 不足 | Cloudflare 側で revoke / scope 削減 | curl が 401 / 403 を返し set -e で fail | curl exit code | 1Password で新 token 払い出し → secret 更新 |
| F-3 | Cloudflare GraphQL の dataset 名変更 | `httpRequestsAdaptiveGroups` 等が rename | curl 200 でも `data` が空 / null | metric value が `null` → judgment `UNKNOWN` | dataset discover step を再実行し lib を改修（skill feedback で記録） |
| F-4 | account id 不一致 | `vars.CLOUDFLARE_ACCOUNT_ID` が古い | accounts[0] が空 → metrics 全部 UNKNOWN | dashboard.json の judgment | variables を更新 |
| F-5 | jq 未インストール | runner 設定漏れ | bash 実行時 `jq: command not found` | step log | runner image (`ubuntu-latest`) は jq 同梱。fallback として `apt-get install jq` を CI step に追加可（不要で開始） |
| F-6 | gh auth 不在 | `GH_TOKEN` 未渡し | `gh run list` が 401 | cron-status 取得失敗 → cron_status UNKNOWN | `secrets.GITHUB_TOKEN` を `GH_TOKEN` env で渡す（phase-02 §2.2） |
| F-7 | redaction grep が hit | token / Bearer / 40+ hex が dashboard に混入 | `redaction_check` が exit 1 → workflow fail | step log | 直近の collector 改修を rollback。secret 出力経路を再点検 |
| F-8 | artifact size 超過 | 想定外に巨大化 | upload-artifact が時間超過 | step log | metric 配列を summary のみに圧縮（lookback 短縮） |
| F-9 | timeout-minutes 5 超過 | API 遅延 / runner 遅延 | step が cancel | step log | curl `--max-time 30` を追加し再試行回数を 1→0 に |
| F-10 | schedule 連続走行による衝突 | runner 枯渇 | concurrency.group で待機 | run queue | `cancel-in-progress: false` のまま許容 |
| F-11 | UTC date 解釈ミス | runner local TZ 干渉 | target_date が JST に | step `Resolve UTC date` で `date -u` 強制 | `date -u +%Y-%m-%d` 固定（phase-02 §2.2） |
| F-12 | metric naming drift | 後の Phase で label を変更 | 09c との naming 一致が崩れる | grep 不整合 | naming テストを Phase 09 QA に組み込む |
| F-13 | `_READONLY` 接尾辞欠落で write token 流用 | secret 名命名規約違反 | scope 過大の token が使われる | code review | naming-mapping table 必読化（phase-09） |
| F-14 | Cloudflare API rate limit | 短時間連続実行 | curl 429 | exit code | schedule 1 日 1 回固定で発生確率低（NFR-3） |
| F-15 | dataset discover step 取り違え | `__schema` クエリで間違った type を採用 | metric が常時 0 | dashboard 内容 review | discover step の出力を artifact に含める（phase-11） |
| F-16 | `outputs/post-release-dashboard/` を実装ブランチが commit してしまう | 開発者ミス | 不要ファイルが git 履歴に残る | `git status` | `.gitignore` に `outputs/post-release-dashboard/**` を追加（phase-05 §3 に追記対象） |
| F-17 | dependabot による `actions/upload-artifact` major version 上げ | breaking change | upload step fail | actionlint | 半年に 1 回 minor / major review |
| F-18 | Issue #351 が CLOSED のまま | 仕様運用 | reopen で運用混乱 | PR description | `Refs #351` のみ使用、`Closes #351` 禁止 |

## 2. 回復シーケンス（F-7 redaction fail を例に）

```
1. workflow run log で redaction_check の hit 行を確認
2. 直近の collector PR を `git revert <merge_sha>`
3. main に push し schedule を一旦止めるなら workflow file を `on:` から schedule を一時削除
4. 再発防止策（jq での字句パターン除去 / curl `-v` 残置の検出）を skill feedback に記録
5. 修正 PR を作成し、再度 workflow_dispatch dry-run
6. dry-run が PASS したら schedule を復活
```

## 3. 監視 / 観測

- workflow run の最新 conclusion が `failure` のまま 3 連続続いた場合、人手で確認（自動 alert は本タスク scope 外）。
- 1 ヶ月ごとに `gh run list --workflow=post-release-dashboard.yml --limit=40` を眺め、`success` 率を skill feedback に記録。

## 4. .gitignore 方針

| path | 理由 |
| --- | --- |
| `outputs/post-release-dashboard/**/dashboard.json` | local dry-run で生成。git 履歴に入れない |
| `outputs/post-release-dashboard/**/dashboard.md` | 同上 |
| `outputs/post-release-dashboard/**/redaction-check.md` | 同上 |

> Phase 11 で取得する `outputs/phase-11/*` は本仕様書ディレクトリ配下なので `.gitignore` 対象外（仕様書の evidence として commit する）。

## 5. 完了条件

- [x] 失敗モードが網羅されている
- [x] 各 mode に検出 / 回復方針がある
- [x] redaction fail のリカバリ手順が明文化
- [x] `.gitignore` 方針が確定

## outputs

- `outputs/phase-06/failure-modes.md`
