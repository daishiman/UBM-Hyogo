# Phase 9: 品質保証（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` / `phase-5.md` / `phase-6.md` / `phase-7.md` / `phase-8.md` |
| 出力 | jq 構文検証 / `gh auth` スコープ確認 / heredoc 構文確認 / 失敗パターン table |

---

## 1. jq クエリ構文検証

Phase 2 §3 / Phase 4 §3 / Phase 6 §1.2 の全 jq クエリを構文チェックする。

```bash
# 1) JSON parse の sanity（任意の有効 JSON で全クエリが構文 OK か）
echo '{}' | jq '.required_status_checks.contexts'                  # ok
echo '{}' | jq '.required_status_checks.contexts | sort | .[]'    # ok
echo '{}' | jq '.required_status_checks.contexts | length'        # 0
echo '{}' | jq '.required_status_checks.strict'                    # null
echo '{}' | jq '.required_pull_request_reviews'                    # null
echo '{}' | jq '.lock_branch.enabled'                              # null
echo '{}' | jq '.enforce_admins.enabled'                           # null
echo '{}' | jq '.required_conversation_resolution.enabled'         # null
```

全 7 件で `jq: error: ...` が出ないこと（exit 0）。

## 2. `gh auth` スコープ確認

```bash
gh auth status
```

期待:

| スコープ | 用途 | 必要性 |
|----------|------|-------|
| `repo` | branch protection の read/write | **必須** |
| `admin:repo_hook` | webhook 列挙（参考） | 任意 |
| `workflow` | workflow 編集（3a / 3b で使用） | 3c では不要 |

`repo` スコープが付いていない場合は `gh auth refresh -s repo` を実行。

> **注意**: 1Password 等で管理する PAT を `GH_TOKEN` 環境変数で渡している場合、PAT スコープに `repo` が含まれているか別途確認する。

## 3. heredoc 構文確認

Phase 5 §4 / §5 の heredoc は `<<'JSON' ... JSON` 形式で **single-quoted heredoc**（変数展開なし）。`$` を含む値はないため安全。実行前に `bash -n` で構文確認可能（実行はしない）:

```bash
bash -n - <<'EOF'
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{}
JSON
EOF
# exit 0 を期待
```

## 4. 失敗パターン table（runbook）

| 症状 | 原因 | 対処 |
|------|------|------|
| `gh api: HTTP 422: Validation Failed` | payload field 不足（`required_status_checks` 欠落等） | Phase 5 §4 / §5 を逐語コピー |
| `Invalid request. "lighthouse-ci" is not a valid status check.` 系 | context 未登録（3a / 3b 未 merge or run 未成功） | Phase 4 T-3c-3 / T-3c-4 を実行し、登録確認後に再 PUT |
| PR の必須 check が永久 pending | context typo / case mismatch | `gh api .../check-runs` で実 name を確認し payload 修正 → 再 PUT |
| `gh api: HTTP 403` | PAT スコープ不足 | `gh auth refresh -s repo` |
| post snapshot で `required_pull_request_reviews` が `{}` | payload で `null` 指定漏れ | payload を `null` に修正し再 PUT |
| `enforce_admins` が `false` で governance 期待値（`true`）と乖離 | API default に追従済み | Phase 12 で governance 突合し、必要なら別タスクで `true` 化 |

## 5. AC 最終照合

| AC | 検証 jq | 結果（runtime 時） |
|----|---------|--------------------|
| AC-05（dev） | T-3c-5 | post で 5 件完全一致 |
| AC-05（main） | T-3c-6 | post で 5 件完全一致 |
| AC-06（reviews=null） | T-3c-7 | `null` |
| AC-06（lock=false） | T-3c-8 | `false` |
| AC-06（enforce_admins） | T-3c-9 | pre と post で同値 |

## 6. 引き継ぎ（Phase 10 へ）

| 項目 | 内容 |
|------|------|
| 残課題 | governance `enforce_admins=true` 期待との突合（Phase 12） |
| solo self-review 観点 | 順序厳守 / payload 完全性 / evidence 完備 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 9
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3c の品質保証として jq / gh auth / heredoc 構文を確認し、失敗パターン runbook を整備する。

## 実行タスク

- jq クエリ全件の構文を sanity check する。
- `gh auth` スコープ確認手順を確定する。
- 失敗パターン runbook を 6 件整備する。

## 参照資料

- 本サブタスク phase-4.md / phase-5.md / phase-6.md
- CLAUDE.md `## ブランチ戦略`

## 実行手順

1. jq sanity check を実行する。
2. `gh auth status` を確認する。
3. heredoc 構文を `bash -n` で確認する。
4. 失敗パターン table を AC と紐付ける。

## 統合テスト連携

- NON_VISUAL phase は dry-run でのみ検証する。

## 成果物

- 本 phase markdown
- runbook table

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
