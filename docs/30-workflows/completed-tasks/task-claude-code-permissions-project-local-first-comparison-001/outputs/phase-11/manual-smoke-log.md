# Manual Smoke Log（NON_VISUAL 主証跡）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 区分 | 手動レビュー証跡（NON_VISUAL の `screenshots/` 代替） |
| 作成日 | 2026-04-28 |
| 実施日 | 2026-04-28 |
| visualEvidence | NON_VISUAL |
| AC 充足 | AC-8 |

## 0. 共通ガード

- 実 `~/.claude/settings.json` / `~/.zshrc` / `.env` の **中身** を読まない
- 実書き換えは禁止（apply タスクで実施）
- 引用 / 参照は読み取りのみで完結
- API token / OAuth トークン値の転記禁止

## 1. 主シナリオ（TC-01〜TC-04）

### TC-01: project-local-first 単独で fresh プロジェクトの `defaultMode` が `bypassPermissions` を維持するか

| 項目 | 内容 |
| --- | --- |
| 紐付け AC | AC-2 |
| 操作 | `outputs/phase-5/comparison.md` Section 2 を読み合わせ。公式 docs 引用と Phase 3 R-2 結論をクロスチェック |
| 期待 | 「project-local-first 単独では新規 worktree / fresh プロジェクトで再発する」が 1 行で結論記載 |
| 観測 | 同 Section 2.1 に **「再発する」** と明記。Section 2.2 で公式 docs と実機運用論拠が併記されている |
| 判定 | **PASS** |

### TC-02: 案 A 適用後、シナリオ A / B の最終 `defaultMode` が変化しないこと

| 項目 | 内容 |
| --- | --- |
| 紐付け AC | AC-1, AC-3, AC-7 |
| 操作 | `outputs/phase-5/comparison.md` Section 1 / Section 3.2 を読み合わせ。評価順序と勝ち優先順位の評価過程をトレース |
| 期待 | シナリオ A / B では案 A / 案 B どちらも `bypassPermissions` で最終値が変化しない |
| 観測 | Section 3.2 シナリオ A / B 行で両案ともに `bypassPermissions`。Section 1.2 に評価順序 / 勝ち順序が併記 |
| 判定 | **PASS** |

### TC-03: 案 A 適用後、fresh 環境（シナリオ C / D）で意図せず bypass 化することの許容判断

| 項目 | 内容 |
| --- | --- |
| 紐付け AC | AC-3, AC-4, AC-7 |
| 操作 | `outputs/phase-5/comparison.md` Section 3.1 AX-5 / Section 6 を読み合わせ |
| 期待 | 「個人開発マシン限定」前提で CONDITIONAL ACCEPT、deny 検証依存が明記されている |
| 観測 | AX-5 列に CONDITIONAL ACCEPT、Section 3.3 で deny 検証タスク依存と alias 強化除外を明記 |
| 判定 | **PASS** |

### TC-04: rollback 手順 dry-run 読み合わせ

| 項目 | 内容 |
| --- | --- |
| 紐付け AC | AC-5, AC-6 |
| 操作 | `outputs/phase-5/comparison.md` Section 4 のコマンド列を上から「読む」（実行はしない） |
| 期待 | バックアップ取得 → 復元 → `source ~/.zshrc` → JSON validity 確認 が抜けなく並び、`wrangler` 直接実行など `scripts/cf.sh` / `op run` 経路を破る記述がない |
| 観測 | Section 4.1〜4.3 の手順は 5 段階で抜けなし。`wrangler` 直接実行は含まれず、`scripts/cf.sh` ルールに整合 |
| 判定 | **PASS** |

## 2. Fail path（TC-F-01 / TC-F-02）

### TC-F-01: 新 worktree での prompt 復帰検出（読み合わせ）

| 項目 | 内容 |
| --- | --- |
| 操作 | `outputs/phase-6/main.md` §1 を読み合わせ |
| 期待 | `bash scripts/new-worktree.sh feat/dummy-comparison-test` 実施時、`<project>/.claude/settings.local.json` 未配置で再発を観測する手順が定義されている |
| 観測 | §1 の操作 / 期待 / 失敗時挙動の 3 行が記載 |
| 判定 | **PASS**（実観測は apply タスクまたは別 worktree で実施） |

### TC-F-02: 案 A 採用時の他プロジェクト副作用検出（読み合わせ）

| 項目 | 内容 |
| --- | --- |
| 操作 | `outputs/phase-6/main.md` §2 と `outputs/phase-3/impact-analysis.md` §3.4 を突合 |
| 期待 | `grep -rln '"defaultMode"' ~/dev/**/.claude/settings.json 2>/dev/null` で全件列挙し、Section 5 と一致確認する手順 |
| 観測 | grep コマンドが具体化、Section 5 の `~/dev/**` 行に勝ち優先順位による影響評価が記載 |
| 判定 | **PASS** |

## 3. 回帰 guard（TC-R-01 / TC-R-02）

### TC-R-01: global / global.local 不整合の回帰 guard

| 項目 | 内容 |
| --- | --- |
| 操作 | `outputs/phase-6/main.md` §3 を読み合わせ |
| 期待 | 読み取りのみのコマンド（`jq` で `defaultMode` のみ取得、`ls` で存在確認）で実値転記がない |
| 観測 | §3 の操作行に値抽出が `defaultMode` のみで、実値 / token 取り出しを含まない |
| 判定 | **PASS** |

### TC-R-02: deny 検証タスク結果到着後の比較表更新 guard

| 項目 | 内容 |
| --- | --- |
| 操作 | `outputs/phase-6/main.md` §4 を読み合わせ。`unassigned-task-detection.md` への記録依頼を確認 |
| 期待 | `task-claude-code-permissions-deny-bypass-verification-001` の結果到着後、Phase 5 Section 6 を更新する旨が明記 |
| 観測 | §4 期待欄に「結果到着後の追加再評価依頼を Phase 12 `unassigned-task-detection.md` に記録」とある |
| 判定 | **PASS** |

## 4. 採用案ハンドオフの読み合わせ

| 項目 | 内容 |
| --- | --- |
| 観点 | apply タスク向けハンドオフ箇条書きの妥当性 |
| 操作 | `outputs/phase-5/comparison.md` Section 6 を読み合わせ |
| 期待 | (a) 採用案 1 案確定 (b) 設定変更対象ファイルの列挙 (c) 変更キーと値 (d) rollback 参照 (e) 依存タスク結果待ちが明記 |
| 観測 | Section 6.1 / 6.2 / 6.3 で全項目満たす |
| 判定 | **PASS** |

## 5. シナリオ A〜D 対応の読み合わせ

| シナリオ | 案 A | 案 B | ハイブリッド | 判定 |
| --- | --- | --- | --- | --- |
| A | bypass | bypass | bypass | OK |
| B | bypass | bypass | bypass | OK |
| C | bypass | default（再発） | bypass（fallback） | OK |
| D | bypass | default（再発） | bypass（fallback） | OK |

## 6. 環境ブロッカー記録

| ブロッカー | 状態 | 影響 |
| --- | --- | --- |
| `task-claude-code-permissions-deny-bypass-verification-001` 結果未着 | 未着想定 | alias 強化を採用案から除外（既に除外済み） |
| Anthropic 公式 docs `defaultMode` 未指定時の文書化 | 部分的 | 公式 + 補助観測で代替（既に対応） |

## 7. 総合判定

**全 8 件 PASS（TC-01/02/03/04, TC-F-01/02, TC-R-01/02）**

## 8. 参照資料

- `phase-11.md`
- `outputs/phase-4/test-scenarios.md`
- `outputs/phase-5/comparison.md`
- `outputs/phase-6/main.md`
- `outputs/phase-3/impact-analysis.md`
