# Phase 12 Output: Implementation Guide

## Part 1: 中学生でもわかる説明

なぜ必要か: 今の状態では、必要なチェック名が空のまま branch protection が設定される可能性があります。たとえば、門番はいるのに確認する名簿が空だと、誰を止めるべきか判断できません。

何をするか: UT-GOV-004 が確定した実在チェック名を使い、dev と main の branch protection をもう一度 PUT して、空の名簿を正しい名簿に置き換えます。

### 日常の例え話

1. branch protection は、学校の保健室にある「この検査に合格していないと体育祭に出られない」チェックリストです。リストが空だと、合格証なしで出場できてしまいます。
2. `contexts=[]` は、鍵付きの部屋なのに「どの鍵が必要か」が空欄の状態です。見た目は守っていても、実際には守れていません。
3. UT-GOV-004 は、先生が本当に存在する検査名を確認してくれた作業です。今回はその確定リストを保健室のリストへ写します。
4. dev と main は、保健室と職員室のように別々の部屋です。片方だけ失敗しても混乱しないように、1 部屋ずつ順番に書き換えます。
5. 適用前 GET と適用後 GET は、書き換える前後に写真を撮ることです。写真がないと、本当に直ったかあとで説明できません。

### 専門用語セルフチェック

| 専門用語 | Part 1 での言い換え |
| --- | --- |
| branch protection | 大事なブランチを勝手に変更されないようにする守り設定 |
| required_status_checks.contexts | 合格しないと merge できないテストのリスト |
| PUT / GET | リストを書き換えに行く / リストを見に行く |
| enforce_admins | 管理者でも例外なくこのルールを守る設定 |
| drift | ドキュメントと実際の設定がずれていること |

### 今回作ったもの

| 作ったもの | 役割 |
| --- | --- |
| `expected-contexts-dev.json` / `expected-contexts-main.json` | 正しいチェック名の名簿 |
| `apply-runbook-second-stage.md` | 承認後に実行する手順書 |
| `drift-check.md` | GitHub 側と文書側がずれていないか見る表 |
| `phase13` evidence files | 実行前後の GET 結果を残す場所 |

## Part 2: 技術者向け

### TypeScript 型定義

```ts
// GitHub REST API BranchProtection response shape subset.
type BranchName = "dev" | "main";

interface ExpectedContexts {
  branch: BranchName;
  contexts: string[];
}

interface BranchProtectionEvidence {
  branch: BranchName;
  currentPath: string;
  payloadPath: string;
  appliedPath: string;
  approvedBy: string;
}
```

独自の永続型は追加しません。実行時は GitHub REST API の `GET /repos/{owner}/{repo}/branches/{branch}/protection` 応答を source of truth とし、必要な subset だけを jq / payload template で扱います。

### CLIシグネチャ

```bash
gh api repos/{owner}/{repo}/branches/{branch}/protection
gh api --method PUT repos/{owner}/{repo}/branches/{branch}/protection --input outputs/phase-13/branch-protection-payload-{branch}.json
```

実行前に `gh auth status` で admin scope を確認します。scope 不足時は停止し、`op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN` から再取得します。token 実値は docs / logs / shell history に残しません。

### 使用例

```bash
jq '.required_status_checks.contexts | sort' \
  outputs/phase-13/branch-protection-applied-dev.json \
  > /tmp/applied-dev.contexts.json

jq '. | sort' outputs/phase-02/expected-contexts-dev.json \
  > /tmp/expected-dev.contexts.json

diff /tmp/applied-dev.contexts.json /tmp/expected-dev.contexts.json
```

1. `outputs/phase-02/expected-contexts-{dev,main}.json` を唯一の expected contexts とする。
2. Phase 13 で current protection を GET する。
3. current JSON の `required_status_checks.contexts` だけを expected contexts に差し替える。
4. `dev` PUT 後に GET して集合一致を確認する。
5. `main` PUT 後に GET して集合一致を確認する。
6. 6 値 drift を `outputs/phase-09/drift-check.md` と照合する。
7. token 実値は記録しない。
8. user approval なしに実 PUT、commit、push、PR は実行しない。

### エラーハンドリング

| エラー | 対応 |
| --- | --- |
| `403` scope不足 | 実行停止。admin権限を持つ token で再承認する |
| `422` payload schema 不正 / typo context | 当該 branch の PUT を停止し、UT-GOV-004 成果物を再点検する |
| `404` branch不在 | branch名を確認し、PUTしない |
| applied contexts 不一致 | 当該branchをrollback payloadで戻す |
| token値混入 | ファイルから削除し、漏洩可能性があればrotateする |

### エッジケース

| ケース | 扱い |
| --- | --- |
| UT-GOV-004 の context が空 | Phase 13 NO-GO |
| dev は成功、main は失敗 | mainのみrollback判断。dev証跡は上書きしない |
| `--include` でheader付き保存 | JSON証跡には使わず、HTTP status logを別ファイルに分離 |
| open PR がcheck未走行 | admin block回避のためPUT前に停止 |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| `OWNER` | `daishiman` |
| `REPO` | `UBM-Hyogo` |
| branches | `dev`, `main` |
| expected contexts | `ci`, `Validate Build`, `verify-indexes-up-to-date` |
| evidence root | `outputs/phase-13/` |

### テスト構成

| 層 | 検証 |
| --- | --- |
| L1 | artifacts parity と path 存在確認 |
| L2 | expected contexts のJSON妥当性 |
| L3 | payload/current の contexts 以外差分ゼロ |
| L4 | applied contexts と expected contexts の集合一致 |
