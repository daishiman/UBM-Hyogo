# Phase 4 main: テスト作成サマリ

## Phase 3 Go 判定転記

- 最終判定: **FORCED-GO**（前提タスク 2 件未実施をユーザー承認 = 選択肢 C で許容）
- 制約: TC-05 / AC-5 は **BLOCKED**（前提タスク `deny-bypass-verification-001` 未完）
- 出典: `outputs/phase-03/go-no-go.md` §2

## 採用方針（ユーザー承認済ベストプラクティス）

| 項目 | 方針 |
| --- | --- |
| `defaultMode` 配置 | nested `permissions.defaultMode` で統一（root には書き加えない） |
| whitelist | 採用候補 (b)（既存 allow 維持 + §4 minimum guarantee 包含） |
| `cc` alias 正本 | `~/.config/zsh/conf.d/79-aliases-tools.zsh:7`（実機正本） |
| zshrc source 設定 | `~/.zshrc:25` で `79-aliases-tools.zsh` を個別 source 済み（追記不要・no-op） |

## worktree esbuild 整合チェック [FB-MSO-002]

| 項目 | 結果 |
| --- | --- |
| `bash scripts/cf.sh whoami` | 本タスクは Cloudflare 操作を伴わないため未実行（host 環境ファイル編集のみ）。Phase 5 でも `wrangler` 系は触らない |
| `mise exec -- node -v` | Phase 1 inventory 時点で v24.x（Phase 1 で確認済） |
| `mise exec -- pnpm -v` | 10.x（Phase 1 で確認済） |

## TC ID 一覧（8 件）

| TC | 区分 | 状態 |
| --- | --- | --- |
| TC-01 | Happy path（global settings） | Phase 5 反映前は **既に PASS**（実機既設定） |
| TC-02 | Happy path（globalLocal） | **N/A**（globalLocal 不在を維持。`settings.local.json` は作成しない） |
| TC-03 | Happy path（project settings allow/deny） | Phase 5 反映前は **FAIL**（§4 7+3 件未包含） |
| TC-04 | Happy path（cc alias） | Phase 5 反映前は **FAIL**（旧形式 + 連続スペース + skip-permissions 未付与） |
| TC-05 | Happy path（bypass + deny 実効性） | **BLOCKED**（前提タスク #1 未完） |
| TC-F-01 | Fail path（defaultMode typo） | Phase 6 で実注入 |
| TC-F-02 | Fail path（alias 重複） | Phase 6 で実注入 |
| TC-R-01 | Regression（他 zsh conf 残置検出 guard） | Phase 6 で guard スクリプト記述 |

## Red 状態確認結果（Phase 5 実装前）

```bash
# TC-01: jq -r '.permissions.defaultMode' ~/.claude/settings.json → bypassPermissions（PASS：既設定）
# TC-03: jq '.permissions.allow' に "Bash(pnpm install)" 等 §4 7件が無い → FAIL
# TC-04: type cc → /usr/bin/cc（alias 未 source）→ FAIL
#        zsh -i -c 'type cc' → 'claude  --verbose --permission-mode bypassPermissions'（旧形式）→ FAIL
```

→ **TC-03 / TC-04 が Red**。最低 1 件 FAIL の Red 状態を確認した。Phase 5 で Green 化を実施する。

## 成果物リンク

- `outputs/phase-04/test-scenarios.md`: TC 詳細
- `outputs/phase-04/expected-results.md`: 期待値定数

## carry-over

- TC-F-01 / TC-F-02 / TC-R-01 の **本格的な fail injection 手順は Phase 6** で記述
- TC-05 は Phase 5 / Phase 11 でも判定不能（前提タスク未完）→ BLOCKED 継続

## 完了条件チェック

- [x] Phase 3 Go 判定転記
- [x] esbuild 整合チェック結果記録（本タスクは cf.sh 不要のため簡略化）
- [x] test-scenarios.md に 8 件記述
- [x] expected-results.md に 5 種定数 + マッピング
- [x] Red 状態確認（TC-03 / TC-04 FAIL）
- [x] artifacts.json `phases[3].outputs` 3 ファイルと一致
