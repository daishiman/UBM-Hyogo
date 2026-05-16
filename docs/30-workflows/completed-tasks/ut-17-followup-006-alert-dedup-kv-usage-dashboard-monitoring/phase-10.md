# Phase 10: リリース準備（staging apply + 擬似発火準備）

[実装区分: 実装仕様書]

## 1. 目的

staging Cloudflare account へ user 承認後に `apply --yes` を実行し、KV policy を `enabled: false` で着地させる。続けて Phase 11 の短時間 runtime smoke 準備を行う。5 営業日 baseline 後の本運用 `enabled: true` 切替は、この Phase の完了条件に含めない。

> **user-gated**: Cloudflare API への書き込み（`apply --yes`）はユーザー明示承認が必要。本 Phase は read-only / dry-run 完了後、承認取得した上で実行する。

## 2. 実行手順

### Step 1: dry-run 最終確認（user 承認前）

```bash
mise exec -- pnpm cf:alerts:diff   # missing 1+ 件
bash scripts/cf.sh alerts apply    # dry-run、operations 表示
```

### Step 2: user 承認取得

- 承認対象: `bash scripts/cf.sh alerts apply --yes`（webhook → policy 順、新 KV policy 1-2 件 create）
- 承認 evidence: `outputs/phase-10/user-approval.md` に承認日時 / 承認者 / 適用範囲を記録

### Step 3: staging apply 実行（承認後）

```bash
bash scripts/cf.sh alerts apply --yes
```

出力を `outputs/phase-10/apply.log` に保存。

### Step 4: 冪等性確認

```bash
bash scripts/cf.sh alerts apply --yes   # 2 回目
mise exec -- pnpm cf:alerts:diff        # 空に収束
```

### Step 5: 擬似発火準備

policy は `enabled: false` で着地済のため Phase 11 では runtime smoke 専用に 2 通りのうちいずれかを選択:

- **5a**: 一時的に `enabled: true` + 閾値を極小化（`percentage: 0.001`）した検証用 policy をローカルで作成、再 apply。発火確認後に元の `enabled: false` に戻して再 apply（冪等で収束）
- **5b**: KV write を一時的に大量発生させる負荷スクリプト（`scripts/devops/kv-write-burst.sh` 案）を作成し staging の `/internal/alert-relay` 経路から write を誘発。実 baseline 値を超えれば発火

Phase 2 staging-rollout-plan で 5a / 5b を確定。どちらも 5 営業日 baseline を完了条件にせず、Slack delivery path の疎通確認に限定する。

## 3. ロールバック

- `apply --yes` 後の policy 削除: `bash scripts/cf.sh alerts apply --yes --remove-extra`（remove フラグの実装有無を Phase 1 で確認、無ければ Dashboard 経由削除 + repo から JSON 削除）
- 旧 5 policy への影響: なし（追加 only）

## 4. 成果物

| パス | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-10/user-approval.md` | 新規 | 承認 evidence |
| `outputs/phase-10/apply.log` | 新規 | 1 回目 apply 出力 |
| `outputs/phase-10/apply-2nd.log` | 新規 | 2 回目 apply 出力（冪等性） |
| `outputs/phase-10/diff-after-apply.log` | 新規 | apply 後の diff（空であること） |

## 5. 完了条件 (DoD)

- [ ] user 承認 evidence 取得
- [ ] 1 回目 apply 成功（exit 0）
- [ ] 2 回目 apply 後 diff が空
- [ ] Cloudflare staging account 上に KV policy が `enabled: false` で存在する
- [ ] Phase 11 擬似発火方式（5a / 5b）の選択が記録されている
- [ ] 5 営業日 baseline と `enabled:true` 本運用切替が別 wave / Phase 13 承認後作業として記録されている
