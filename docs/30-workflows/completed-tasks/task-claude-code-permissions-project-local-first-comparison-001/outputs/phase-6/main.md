# Phase 6 Output: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 5 |
| 下流 | Phase 7（カバレッジ確認） |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |

## 0. 結論サマリ

Phase 4 主シナリオ（TC-01〜TC-04）に対して、比較表の **fail path / 回帰 guard** を以下 4 件追加した。本 Phase は spec_only / docs-only のため、実機書き換えは禁止し、読み取り or 公式仕様引用のみで成立する手順に限定する。

| ID | 種別 | 概要 |
| --- | --- | --- |
| TC-F-01 | fail path | 案 B / ハイブリッド採用時、新 worktree で prompt 復帰を必ず観測できる手順 |
| TC-F-02 | fail path | 案 A 採用時、`~/dev` 配下他プロジェクトで `defaultMode` 変化していないことを grep で検出 |
| TC-R-01 | 回帰 guard | global / global.local 不整合の検出（読み取りのみ） |
| TC-R-02 | 回帰 guard | deny 検証タスク結果到着後の比較表更新 guard |

## 1. TC-F-01: 新 worktree での prompt 復帰検出

| 項目 | 内容 |
| --- | --- |
| 紐付け案 | 案 B / ハイブリッド |
| 操作 | `bash scripts/new-worktree.sh feat/dummy-comparison-test` で worktree を 1 件作成（書き換え対象は当該 worktree の `<project>/.claude/settings.local.json` のみ。本タスクでは読み取り観測のみ） |
| 期待 | 新 worktree の `<project>/.claude/settings.local.json` が **未配置** で、`defaultMode` が default に戻り prompt 復帰することを観測 |
| 失敗時挙動 | prompt が復帰しない場合 → project-local-first の前提が誤り。Phase 5 比較表 Section 2 の再発判定を再評価 |
| 実施可否 | 本 spec_only タスクでは設計のみ。実観測は apply タスクまたは Phase 11 手動レビュー（実値読み取り無し） |

## 2. TC-F-02: 案 A 採用時の他プロジェクト副作用検出

| 項目 | 内容 |
| --- | --- |
| 紐付け案 | 案 A |
| 操作 | `grep -rln '"defaultMode"' ~/dev/**/.claude/settings.json 2>/dev/null` で `defaultMode` 明示プロジェクトを全件列挙（件数のみ、値は記録しない） |
| 期待 | 列挙結果と Phase 5 `comparison.md` Section 5「他プロジェクト副作用一覧」が一致。案 A 採用後の最終値変化が表で説明されている |
| 失敗時挙動 | grep に表に無い entry が出現 → Section 5 を更新 |

## 3. TC-R-01: global / global.local 不整合の回帰 guard

| 項目 | 内容 |
| --- | --- |
| 紐付け案 | 全案 |
| 操作 | `cat ~/.claude/settings.json \| jq '.defaultMode'` と `ls -la ~/.claude/settings.local.json 2>/dev/null` を順に実行（読み取りのみ。`.env` は対象外） |
| 期待 | Phase 5 比較表「fresh 環境挙動」列の前提が現状値と矛盾しない |
| 失敗時挙動 | global.local が想定外に存在 / 想定値と異なる → 採用方針の前提を再確認 |
| 注意 | API token 等を含むキーは取り出さない。`defaultMode` のみ |

## 4. TC-R-02: deny 検証タスク結果到着後の比較表更新 guard

| 項目 | 内容 |
| --- | --- |
| 紐付け案 | 案 A / ハイブリッドの alias 強化部分 |
| 操作 | `task-claude-code-permissions-deny-bypass-verification-001` の outputs パスを参照し、結果到着の有無を確認 |
| 期待 | 結果到着後、ハイブリッドの fallback に alias 強化（`--dangerously-skip-permissions`）を追加するかの再評価依頼を Phase 12 `unassigned-task-detection.md` に記録 |
| 失敗時挙動 | 結果到着済みなのに比較表が未更新 → Phase 5 Section 6 をループバック更新 |

## 5. Phase 4 シナリオへの追加トレース

| TC | 補完元 |
| --- | --- |
| TC-01（再発判定） | TC-F-01 で観測手順を具体化 |
| TC-02（シナリオ A / B 不変） | TC-F-02 で grep ベースの検出に拡張 |
| TC-03（fresh 環境許容判断） | TC-R-02 で deny 検証依存を明記 |
| TC-04（rollback dry-run） | TC-R-01 で読み取り観測の前提整合を追加 |

## 6. 完了条件チェック

- [x] Phase 4 主シナリオに対する fail path / 回帰 guard を 4 件追加
- [x] 全シナリオが docs-only / 読み取りのみで成立
- [x] `wrangler` 直接実行を含む手順を追加していない
- [x] `.env` 中身読み取りを含む手順を追加していない

## 7. 次 Phase へのハンドオフ

- Phase 7: AC × 成果物 × TC のトレース表を作成
- Phase 11: TC-F-* / TC-R-* も `manual-smoke-log.md` の対象に含める

## 8. 参照資料

- `phase-06.md`
- `outputs/phase-4/test-scenarios.md`
- `outputs/phase-5/comparison.md`
