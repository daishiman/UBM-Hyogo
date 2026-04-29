# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化 (ut-gov-001-github-branch-protection-apply) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-28 |
| 前 Phase | 8 (リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / github_governance |

## 目的

Phase 8 で SSOT 化した命名規則・adapter 関数分解・runbook テンプレ・rollback 3 経路を前提に、本タスク固有の品質保証チェックを行う。具体的には (1) payload JSON の **schema 検証**（`PUT /repos/{owner}/{repo}/branches/{branch}/protection` 仕様適合）、(2) `gh api` GET 応答との **照合**（snapshot ↔ adapter 入出力の一致）、(3) **CLAUDE.md ブランチ戦略との grep 一致**（solo 運用 / `required_pull_request_reviews=null`）、(4) **UT-GOV-004 contexts 同期確認**（実在 job 名のみ採用）を観点固定で実施する。本ワークフローは spec_created に閉じるため、無料枠見積・secret hygiene・a11y は対象外（`gh` CLI 既存認証の流用 / UI 非導入 / Cloudflare resource 非消費）と明記する。検証コマンド SSOT は本仕様書 §検証コマンドに集約。

## 実行タスク

1. payload JSON の schema 検証手順を確定する（完了条件: GitHub REST `PUT branches/{branch}/protection` 公式 schema との照合手順が記述され、必須 field / 型 / 許容値が表に列挙されている）。
2. `gh api` GET 応答と snapshot / adapter 入出力との照合手順を確定する（完了条件: GET 直後の snapshot と adapter 通過後の rollback payload の field レベル diff チェック手順が記述）。
3. CLAUDE.md ブランチ戦略との grep 一致確認手順を確定する（完了条件: `required_pull_request_reviews=null` と `feature/* → dev → main` 戦略の grep コマンドが両方含まれる）。
4. UT-GOV-004 contexts 同期確認手順を確定する（完了条件: payload の `required_status_checks.contexts` が UT-GOV-004 成果物との積集合になっていることの突合手順が記述、または 2 段階適用フォールバック時は `[]` 確認手順）。
5. 対象外項目（無料枠 / secret hygiene / a11y）を明記する（完了条件: 3 項目すべて対象外と理由が記述）。
6. line budget / link 整合 / navigation drift を `validate-phase-output.js` で機械検証する（完了条件: exit 0 を期待値として記述、spec_created 段階では NOT EXECUTED 許容）。
7. outputs/phase-09/main.md に QA チェックリスト結果を集約する（完了条件: 1 ファイルにすべて記述、spec_created のためプレースホルダ可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-08.md | DRY 化済みの SSOT |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-08/main.md | SSOT 集約先 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/index.md | AC-1〜AC-14 / Phase 一覧 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/artifacts.json | path 整合の起点 |
| 必須 | CLAUDE.md（ブランチ戦略） | grep 突合対象 |
| 必須 | https://docs.github.com/en/rest/branches/branch-protection | PUT schema 公式 |
| 必須 | .claude/skills/task-specification-creator/scripts/validate-phase-output.js | 機械検証スクリプト |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-09.md | QA phase の構造参照 |

## QA 観点 1: payload JSON schema 検証

### 1.1 必須 field / 型 / 許容値

| field | 型 | 許容値 | 検証方法 |
| --- | --- | --- | --- |
| `required_status_checks` | object \| null | `{strict: bool, contexts: [string...]}` または null | `jq -e '.required_status_checks | (. == null) or (has("strict") and has("contexts"))'` |
| `enforce_admins` | bool | true / false | `jq -e '.enforce_admins | type == "boolean"'` |
| `required_pull_request_reviews` | null | **null 固定** | `jq -e '.required_pull_request_reviews == null'` |
| `restrictions` | object \| null | `{users:[string...], teams:[string...], apps:[string...]}` または null | `jq -e '.restrictions | (. == null) or (has("users") and has("teams") and has("apps"))'` |
| `required_linear_history` | bool | true / false | `jq -e '.required_linear_history | type == "boolean"'` |
| `allow_force_pushes` | bool | **false 固定** | `jq -e '.allow_force_pushes == false'` |
| `allow_deletions` | bool | **false 固定** | `jq -e '.allow_deletions == false'` |
| `required_conversation_resolution` | bool | true / false | `jq -e '.required_conversation_resolution | type == "boolean"'` |
| `lock_branch` | bool | **false 固定**（§8.3） | `jq -e '.lock_branch == false'` |
| `allow_fork_syncing` | bool | true / false | `jq -e '.allow_fork_syncing | type == "boolean"'` |

### 1.2 検証スクリプト（spec_created の擬似）

```bash
validate_payload() {
  local f="$1"
  jq -e '
    (.required_status_checks | (. == null) or (has("strict") and has("contexts"))) and
    (.enforce_admins | type == "boolean") and
    (.required_pull_request_reviews == null) and
    (.restrictions | (. == null) or (has("users") and has("teams") and has("apps"))) and
    (.required_linear_history | type == "boolean") and
    (.allow_force_pushes == false) and
    (.allow_deletions == false) and
    (.required_conversation_resolution | type == "boolean") and
    (.lock_branch == false) and
    (.allow_fork_syncing | type == "boolean")
  ' "$f" > /dev/null && echo "OK $f" || echo "NG $f"
}
for branch in dev main; do
  validate_payload "branch-protection-payload-${branch}.json"
  validate_payload "branch-protection-rollback-${branch}.json"
done
```

### 1.3 期待結果

- 4 ファイル（payload × 2 + rollback × 2）すべて `OK`。
- 1 件でも `NG` があれば Phase 10 で blocker B 化、Phase 5 ランブックに差し戻し。

## QA 観点 2: `gh api` GET 応答との照合

### 2.1 照合対象

| 比較ペア | 期待 |
| --- | --- |
| `snapshot-{branch}.json` ↔ `gh api ... GET` 直後出力 | 完全一致（取得時点保全） |
| `rollback-{branch}.json` ↔ `map_get_to_put(snapshot-{branch}.json)` 出力 | 完全一致（adapter 決定論性） |
| `applied-{branch}.json` ↔ `gh api ... GET`（適用後） | adapter で正規化した形での field 一致（GET / PUT 形式差を除く） |

### 2.2 検証手順

```bash
# (1) snapshot と直近 GET の一致
diff <(jq -S . snapshot-dev.json) <(gh api repos/{owner}/{repo}/branches/dev/protection | jq -S .)

# (2) adapter の冪等性: snapshot を 2 回通しても結果が同じ
diff \
  <(map_get_to_put snapshot-dev.json | jq -S .) \
  <(map_get_to_put snapshot-dev.json | jq -S .)

# (3) 適用後の GET から再 adapter が rollback と一致
diff \
  <(gh api repos/{owner}/{repo}/branches/dev/protection | map_get_to_put /dev/stdin | jq -S .) \
  <(jq -S . payload-dev.json)
```

### 2.3 期待結果

- (1) は適用前のみ一致（適用後は drift があり得る）。
- (2) は常に空 diff（adapter 冪等）。
- (3) は適用直後に空 diff（適用結果が payload と一致）。

## QA 観点 3: CLAUDE.md ブランチ戦略との grep 一致

### 3.1 突合対象

| CLAUDE.md 記述 | 期待される GitHub 実値 | grep コマンド |
| --- | --- | --- |
| `required_pull_request_reviews` 必須レビュアー数 0 | `null` | `grep -nE 'required_pull_request_reviews' CLAUDE.md` |
| ブランチ戦略 `feature/* → dev → main` | dev / main 両方が protected | `grep -nE 'feature/\*.*--PR-->.*dev.*--PR-->.*main' CLAUDE.md` |
| 線形履歴必須 (`required_linear_history`) | `true` | `grep -nE 'required_linear_history' CLAUDE.md` |
| 会話解決必須 (`required_conversation_resolution`) | `true` | `grep -nE 'required_conversation_resolution' CLAUDE.md` |
| force-push & 削除禁止 | `allow_force_pushes=false` / `allow_deletions=false` | `grep -nE 'force-push.*禁止|allow_force_pushes' CLAUDE.md` |

### 3.2 検証スクリプト

```bash
verify_claude_md_consistency() {
  local rc=0
  grep -qE 'required_pull_request_reviews' CLAUDE.md          || { echo "miss: required_pull_request_reviews"; rc=1; }
  grep -qE 'feature/\*' CLAUDE.md                              || { echo "miss: branch strategy"; rc=1; }
  grep -qE 'required_linear_history' CLAUDE.md                 || { echo "miss: required_linear_history"; rc=1; }
  grep -qE 'required_conversation_resolution' CLAUDE.md        || { echo "miss: required_conversation_resolution"; rc=1; }
  grep -qE 'force-push' CLAUDE.md                              || { echo "miss: force-push policy"; rc=1; }
  return $rc
}
```

### 3.3 期待結果

- すべて hit。1 件でも miss があれば CLAUDE.md 側を更新するか、payload 側を再検討する判断を Phase 10 で確定。

## QA 観点 4: UT-GOV-004 contexts 同期確認

### 4.1 確認パターン

| パターン | 確認内容 | 期待結果 |
| --- | --- | --- |
| A: UT-GOV-004 completed 単独 | payload `required_status_checks.contexts` ⊆ UT-GOV-004 成果物 contexts | 積集合のみ採用、未出現値ゼロ |
| B: UT-GOV-004 同時完了 / 2 段階適用フォールバック | 第 1 段階の payload `required_status_checks.contexts == []` | 空配列固定、第 2 段階の再 PUT 計画が Phase 13 完了条件に明記 |

### 4.2 突合手順（パターン A）

```bash
# UT-GOV-004 成果物（実在 job 名リスト）
ut_gov_004_contexts=$(jq -r '.contexts[]' \
  docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-XX/contexts.json 2>/dev/null \
  | sort -u)

# payload 側
payload_contexts=$(jq -r '.required_status_checks.contexts[]' \
  branch-protection-payload-dev.json | sort -u)

# 差集合（payload にあって UT-GOV-004 に無いものは ZERO 期待）
comm -23 \
  <(echo "$payload_contexts") \
  <(echo "$ut_gov_004_contexts")
```

### 4.3 期待結果

- パターン A: 差集合が空（payload contexts ⊆ UT-GOV-004 contexts）。
- パターン B: dev / main 両 payload で `contexts == []` かつ Phase 13 にて第 2 段階の再 PUT トリガが runbook に記述。

## QA 観点 5: line budget / link 整合 / navigation drift

| チェック | 方法 | 期待 |
| --- | --- | --- |
| line budget (phase-NN.md) | `wc -l docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-*.md` | 各 100〜500 行 |
| line budget (index.md) | 同上 | 250 行以内（既存 186 行 → PASS 余裕） |
| line budget (outputs/main.md) | 同上 | 50〜400 行 |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| Phase 13 outputs 9 ファイル | 8 JSON + runbook | 一致 |
| 相対参照リンク切れ | `grep -rn ']\(\.\./'` + ls 突合 | 0 |
| `validate-phase-output.js` | 実走 | exit 0 |

## 対象外項目（明記）

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 無料枠見積（Workers / D1 / Sheets） | 対象外 | 本タスクは Cloudflare resource を消費しない。GitHub REST API のみで完結 |
| secret hygiene（新規 secret 導入時の管理経路） | 対象外 | 既存 `gh` CLI 認証（OAuth または `GH_TOKEN`）を流用、新規 secret 0 |
| a11y (WCAG 2.1) | 対象外 | UI なし。`apps/web` を触らない |
| free-tier-estimation.md | 不要 | 上記 3 項目が対象外のため別ファイル化しない |

## 検証コマンド（SSOT）

```bash
# 1. payload schema 検証
for branch in dev main; do
  for kind in payload rollback; do
    f="outputs/phase-13/branch-protection-${kind}-${branch}.json"
    [ -f "$f" ] && validate_payload "$f" || echo "SKIP (spec_created): $f"
  done
done

# 2. snapshot ↔ GET 一致 / adapter 冪等性 / 適用後一致（spec_created では SKIP）
echo "SKIP: GET 系は Phase 11 / 13 実走時に検証"

# 3. CLAUDE.md grep 一致
grep -nE 'required_pull_request_reviews|feature/\*|required_linear_history|required_conversation_resolution|force-push' CLAUDE.md

# 4. UT-GOV-004 contexts 突合（spec_created では SKIP / UT-GOV-004 完了後に実走）
echo "SKIP: UT-GOV-004 完了後に実走"

# 5. line budget
wc -l docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-*.md \
      docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-*/main.md

# 6. link 切れ検出（相対参照）
grep -rn '\](\.\./\|\](\./\|](outputs/' \
  docs/30-workflows/ut-gov-001-github-branch-protection-apply/

# 7. validate-phase-output.js
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  --workflow docs/30-workflows/ut-gov-001-github-branch-protection-apply
```

## QA チェックリスト（サマリー）

> 詳細は `outputs/phase-09/main.md`。本仕様書には観点のみ記載。

| # | 観点 | 判定基準 | 結果プレースホルダ |
| --- | --- | --- | --- |
| 1 | payload schema (10 field) | 全 field 型・許容値一致 | spec_created（Phase 5 実装後に実走） |
| 2 | snapshot ↔ GET 一致 | diff 空 | spec_created（Phase 11 実走） |
| 3 | adapter 冪等性 | 2 回適用で diff 空 | spec_created（Phase 11 実走） |
| 4 | 適用後 GET ↔ payload 一致 | adapter 通過で diff 空 | spec_created（Phase 13 実走） |
| 5 | CLAUDE.md grep（5 項目） | 全 hit | 実走可（spec_created でも実施） |
| 6 | UT-GOV-004 contexts 積集合 | 差集合空 | UT-GOV-004 完了後 |
| 7 | line budget | 範囲内 | 実走可 |
| 8 | link 切れ | 0 | 実走可 |
| 9 | navigation drift | 0 | 実走可 |
| 10 | 無料枠 | 対象外 | resource 消費なし |
| 11 | secret hygiene | 対象外 | 新規 secret 0 |
| 12 | a11y | 対象外 | UI なし |
| 13 | validate-phase-output.js | exit 0 | 実走可 |

## 実行手順

### ステップ 1: payload schema 検証手順の固定
- 10 field の型・許容値・jq 検証式を表化。

### ステップ 2: GET 応答照合手順の固定
- snapshot ↔ GET / adapter 冪等性 / 適用後 ↔ payload の 3 ペアを記述。

### ステップ 3: CLAUDE.md grep 5 項目の確定
- `required_pull_request_reviews` / branch 戦略 / linear history / conversation resolution / force-push の 5 項目。

### ステップ 4: UT-GOV-004 contexts 突合手順の固定
- パターン A（completed 単独）/ パターン B（2 段階適用）両方を記述。

### ステップ 5: 対象外 3 項目の明記
- 無料枠 / secret / a11y を理由付きで対象外と確定。

### ステップ 6: line budget / link 整合 / drift 確認
- `wc -l` / `grep` / `validate-phase-output.js` の 3 ツールで確認。

### ステップ 7: outputs/phase-09/main.md 集約
- QA 13 項目を 1 ファイルに集約（spec_created プレースホルダ可）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | QA 13 項目の判定結果を GO/NO-GO 根拠に使用 |
| Phase 11 | GET 応答照合 / adapter 冪等性を smoke リハーサルで実走 |
| Phase 12 | implementation-guide.md に検証コマンドを転記 |
| Phase 13 | PR description に QA サマリーを転記、本適用後の verify_no_drift() 実走 |

## 多角的チェック観点

- 価値性: payload schema / GET 照合 / CLAUDE.md grep / UT-GOV-004 contexts の 4 観点で 422 / merge 不能 / drift 事故を Phase 10 GO/NO-GO 前に検知できる。
- 実現性: jq / grep / `gh api` / 既存 validate-phase-output.js で完結、新規依存なし。
- 整合性: 不変条件 #5 を侵害しない / Phase 8 SSOT を維持 / CLAUDE.md と GitHub 実値の二重正本 drift を grep で検出。
- 運用性: 検証コマンドが SSOT 化されており再現可能。
- 認可境界: 新規 secret 0、対象外明記。
- 無料枠: resource 消費なし、対象外明記。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | payload schema 検証手順 | 9 | spec_created | 10 field |
| 2 | GET 応答照合手順 | 9 | spec_created | 3 ペア |
| 3 | CLAUDE.md grep 5 項目 | 9 | spec_created | 全 hit 期待 |
| 4 | UT-GOV-004 contexts 突合 | 9 | spec_created | パターン A / B |
| 5 | 対象外 3 項目明記 | 9 | spec_created | 無料枠 / secret / a11y |
| 6 | line budget / link / drift | 9 | spec_created | validate-phase-output.js |
| 7 | outputs/phase-09/main.md 集約 | 9 | spec_created | QA 13 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA チェックリスト 13 項目の結果集約 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] payload schema 検証手順が 10 field 全件で記述されている
- [ ] GET 応答照合手順が 3 ペア（snapshot ↔ GET / adapter 冪等 / 適用後 ↔ payload）で記述
- [ ] CLAUDE.md grep 5 項目が確定
- [ ] UT-GOV-004 contexts 突合手順が パターン A / B 両方で記述
- [ ] 対象外 3 項目（無料枠 / secret / a11y）が理由付きで明記
- [ ] line budget / link 切れ / navigation drift の確認手順が記述
- [ ] validate-phase-output.js の期待値（exit 0）が記述
- [ ] outputs/phase-09/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-09/main.md` 配置予定
- 対象外 3 項目が明記
- 検証コマンド SSOT が 1 箇所に集約
- artifacts.json の `phases[8].status` が `spec_created`

## 苦戦防止メモ

- payload schema 検証は jq 1 行に詰め込みすぎず、`validate_payload()` 関数として SSOT 化（Phase 8 §3 と整合）。Phase 5 で実装する場合も同関数を流用。
- UT-GOV-004 contexts の突合では「typo / 大文字小文字 / job 名末尾の数字」が落とし穴になりやすい。`sort -u` で正規化してから `comm -23` で差集合を取ること。
- CLAUDE.md grep は表記揺れに弱い。grep の正規表現は OR で広めに取り、hit 数が 0 でなければ PASS 扱いにする。
- spec_created 段階では GET 系・UT-GOV-004 突合・実走系は SKIP 表記で許容。Phase 11 / 13 で実走に切り替える。

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - QA 13 項目の判定結果（spec_created プレースホルダ）
  - payload schema 検証式（10 field）
  - CLAUDE.md grep 5 項目
  - UT-GOV-004 contexts 突合手順（パターン A / B）
  - 対象外 3 項目（無料枠 / secret / a11y）
- ブロック条件:
  - payload schema が 10 field 未満
  - CLAUDE.md grep が 5 項目未満
  - UT-GOV-004 突合手順がパターン A / B のいずれか欠落
  - 対象外 3 項目のいずれかが未明記
