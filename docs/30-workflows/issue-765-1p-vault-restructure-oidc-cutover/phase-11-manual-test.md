# Phase 11: 手動テスト・1Password vault restructure 実施

## メタ情報

- phase: 11 / manual-test
- prev: phase-10-final-review
- next: phase-12-documentation
- visualEvidence: NON_VISUAL
- 実装区分: 実装仕様書
- user_approval_required: true（mutation 経路すべて）

## 目的

operator-approved 経路で 1Password vault `UBM-Hyogo/Cloudflare` 配下の API token item を canonical 2 path（`api_token_staging` / `api_token_production`）に整理し、legacy 6 path を archive 状態へ移し、canonical path 経由で `bash scripts/cf.sh whoami` および grep gate が green になることを redacted evidence として記録する。現時点では aiworkflow current contract により blocked であり、OIDC supported deploy path / production cutover evidence / user approval が揃うまで実 mutation は行わない。物理 delete は別 sub-gate（Gate B'）で実施する。

## 実行タスク

1. operator approval marker を確認する
2. 1Password item status before/after と grep gate result を redacted evidence として記録する
3. `bash scripts/cf.sh whoami` の user-gated smoke result を token 値なしで記録する

## 前提

- Phase 10 GO 判定済み（Gate B 承認）
- 親タスク Issue #762 / #763 / #718 すべて closed
- legacy token は Issue #718 Phase 11 で revoked 済（active token は新 OIDC cutover 後の token のみ）
- operator が 1Password vault `UBM-Hyogo/Cloudflare` への item create / archive / delete 権限を保持

## 不変条件（evidence 記録時）

- 1Password item 値・vault URI 値・token preview は **absolute に記録しない**（path 識別子のみ）
- `op item get` の出力をそのまま貼り付けない（item name と status のみ抽出して記録）
- `bash scripts/cf.sh whoami` の出力は account_id 以外 redact（email / token suffix / api token hash は記録禁止）

## 参照資料

- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`
- `phase-10-final-review.md`
- `scripts/cf.sh`

## 実行手順

### Step 11.1: mutation 直前 inventory snapshot（read-only）

1Password dashboard 上で vault `UBM-Hyogo/Cloudflare` の item 一覧を operator が目視確認し、以下のみ記録する:

```
# outputs/phase-11/onepassword-item-status-before.md（記録形式例）
[2026-MM-DDThh:mm:ssZ] vault=UBM-Hyogo/Cloudflare
  - item_name=<legacy item name 1>   status=active   role=legacy
  - item_name=<legacy item name 2>   status=active   role=legacy
  - item_name=<legacy item name 3>   status=active   role=legacy
  - item_name=<legacy item name 4>   status=active   role=legacy
  - item_name=<legacy item name 5>   status=active   role=legacy
  - item_name=<legacy item name 6>   status=active   role=legacy
  - item_name=api_token_staging      status=<absent|active>   role=canonical
  - item_name=api_token_production   status=<absent|active>   role=canonical
```

item secret reference の中身（token 値）は記録しない。

### Step 11.2: operator approval 取得

operator に以下を伝え approval を取得:

- 対象 vault: `UBM-Hyogo/Cloudflare`
- 作成 / 確認対象 canonical item: `api_token_staging` / `api_token_production`
- archive 対象 legacy item 6 種（name のみ、token 値は伝達物に含めない）
- 実施経路（1Password dashboard 経路 / `op item edit --archive` 経路のいずれか）
- 実施時刻

approval 内容を `outputs/phase-11/operator-approval-record.md` に記録（item name / role / 承認者識別 / 経路区分のみ。token 値 / URI 値 / vault item secret reference 中身は記録しない）。

### Step 11.3: canonical item の作成 / 確認

operator が以下のいずれかを実施:

1. canonical item `api_token_staging` / `api_token_production` が既存の場合: token field が active token に整合していることを operator が dashboard 上でのみ確認
2. 未存在の場合: legacy item から active token 値を canonical item に移し替え（dashboard 経路）

> 注意: token 値は operator 端末上の dashboard 内のみで扱う。値を clipboard 履歴に残さない、ログに出さない、ドキュメントに記載しないこと。

### Step 11.4: legacy item を archive 状態へ

operator が 1Password dashboard 上で legacy 6 item を archive 状態へ移行する。実コマンド名 / item ID は記録せず、結果のみを redacted 形式で記録:

```
# outputs/phase-11/onepassword-item-status-after.md（記録形式例）
[2026-MM-DDThh:mm:ssZ] vault=UBM-Hyogo/Cloudflare
  - item_name=api_token_staging      status=active     role=canonical
  - item_name=api_token_production   status=active     role=canonical
  - item_name=<legacy item name 1>   status=archived   role=legacy_archived
  - item_name=<legacy item name 2>   status=archived   role=legacy_archived
  - item_name=<legacy item name 3>   status=archived   role=legacy_archived
  - item_name=<legacy item name 4>   status=archived   role=legacy_archived
  - item_name=<legacy item name 5>   status=archived   role=legacy_archived
  - item_name=<legacy item name 6>   status=archived   role=legacy_archived
```

### Step 11.5: canonical path 経由の health check

`.env` / `.dev.vars.example` が canonical path に統一されている状態で以下を実行:

```bash
bash scripts/cf.sh whoami > outputs/phase-11/cf-whoami-after.log 2>&1
echo "exit=$?" >> outputs/phase-11/cf-whoami-after.log
```

期待: exit 0。log は account_id 以外を redact（email / token suffix / API key hash 等は手動で `<REDACTED>` 置換してから commit）。

### Step 11.6: grep gate 確認

```bash
bash scripts/verify-onepassword-op-uri-canonical.sh \
    > outputs/phase-11/grep-gate-after.log 2>&1
echo "exit=$?" >> outputs/phase-11/grep-gate-after.log
```

期待: exit 0。canonical 2 path のみが検出され、legacy 6 path 参照が docs / scripts 配下に残存しないこと。

### Step 11.7: evidence ledger 分離

`outputs/phase-11/evidence-ledger.md` に read-only evidence と mutation evidence を分離記録:

| ledger | file |
|------|------|
| read-only | `main.md`, `onepassword-item-status-before.md`, `cf-whoami-after.log`, `grep-gate-after.log` |
| mutation | `operator-approval-record.md`, `onepassword-item-status-after.md` |

### Step 11.8: redaction 最終確認

```bash
bash scripts/redaction-check.sh outputs/phase-11/
```

期待: exit 0。token 値 / URI 値 / vault item secret reference 中身の検出 0 件。

### Step 11.9: 物理 delete の deferral 記録

物理 delete は Gate B'（archive 後の deprecation window 経過後・別 sub-gate）で実施する旨を `outputs/phase-11/main.md` の末尾に明記する。Phase 11 本体では archive 段階で stop。

## 統合テスト連携

- `bash scripts/verify-onepassword-op-uri-canonical.sh` と `bash scripts/cf.sh whoami` を NON_VISUAL runtime smoke として扱う
- user approval 未取得時は `pending_user_approval` evidence placeholder を残し、runtime PASS と混同しない

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/operator-approval-record.md`
- `outputs/phase-11/onepassword-item-status-before.md`
- `outputs/phase-11/onepassword-item-status-after.md`
- `outputs/phase-11/cf-whoami-after.log`（account_id 以外 redact）
- `outputs/phase-11/grep-gate-after.log`
- `outputs/phase-11/evidence-ledger.md`

## 完了条件

- [ ] canonical 2 item が `active` 状態
- [ ] legacy 6 item が `archived` 状態
- [ ] `bash scripts/cf.sh whoami` が canonical path 経由で exit 0
- [ ] `verify-onepassword-op-uri-canonical.sh` が exit 0
- [ ] evidence ledger に read-only / mutation 分離が明示
- [ ] redaction check exit 0
- [ ] 物理 delete は Gate B' に deferred と明記

## タスク100%実行確認【必須】

- [ ] 成果物 7 ファイルすべて作成
- [ ] evidence に token 値・URI 値・vault item secret reference 中身が混入していない（path 識別子のみ）
- [ ] operator approval record に approval timestamp / 承認者識別が記録されている

## 次Phase

phase-12-documentation.md
