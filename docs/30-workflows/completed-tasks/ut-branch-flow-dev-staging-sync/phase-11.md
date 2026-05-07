# Phase 11: 動作確認・スモーク

## Evidence state

**判定: DOC_PASS / NON_VISUAL**

本タスクは repository operation + shell/docs 変更であり、スクリーンショットは不要。PR merge 後の staging deploy 実測は Phase 13 後続確認であり、本 Phase 11 ではローカル構文・同期状態・文書 drift 検出を evidence とする。

## スモーク手順

1. **ローカル**: `bash -n scripts/new-worktree.sh`（syntax OK）
2. **ローカル統合**: 任意の throwaway ブランチで `bash scripts/new-worktree.sh feat/_smoke-$(date +%s)` を試行 → 生成された worktree が `origin/dev` 起点か `git log -1 origin/dev` で確認 → `git worktree remove` で破棄
3. **同期確認**: `git fetch origin && [ "$(git rev-parse origin/main)" = "$(git rev-parse origin/dev)" ]`
4. **CD 確認 (PR マージ後)**: dev push trigger で `backend-ci.deploy-staging` / `web-cd.deploy-staging` が success 終了

## 実測ログ

実測ログは `outputs/phase-11/main.md`、`link-checklist.md`、`manual-smoke-log.md` に保存する。

## スクリーンショット

なし（CI/シェル結果が evidence。`outputs/phase-11/` 配下にスクリーンショット画像は配置しない）。

## 観察ログのテンプレート

```
[date]      <YYYY-MM-DD HH:MM>
[operator]  daishiman
[step]      dev sync force-push
[result]    + <old>...<new> origin/main -> dev (forced update)
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

NON_VISUAL smoke evidence を収集する。

## 実行タスク

syntax check、remote sync check、stale grep、link checklist を実施する。

## 参照資料

`outputs/phase-11/main.md`、`manual-smoke-log.md`、`link-checklist.md`。

## 成果物

Phase 11 補助 3 ファイル。

## 完了条件

補助 3 ファイルが存在し、スクリーンショット不要境界が明記されている。

## 統合テスト連携

Phase 12 compliance check に接続する。
