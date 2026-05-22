# Phase 11: 手動テスト / runtime evidence（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | `blocked_upstream_pending` |
| 親 Issue | #555 |
| 親タスク | issue-516 (FU-01) |
| visualEvidence | NON_VISUAL |
| 状態語彙 | `blocked_upstream_pending`（PASS 単独表記禁止） |

## 目的

NON_VISUAL タスクとして、staging で `AUDIT_CORRELATION_SALT` の rotation を `rotate-salt.sh` で自動実行し、以下 evidence を取得する。

1. dual-hash 期間中の HIGH alert 連続性（rotation 直前 / 直後で同一 actor 検知率 ≥ 99%）
2. fingerprintVersion=1 → 2 移行が staging audit log に観測されること
3. dual-hash grep gate ログ（`fingerprintHashes.v1` と `fingerprintHashes.v2` 双方が同一 record に出現）
4. rotation 完了後（`--end-rotation` 後）に v1 hash の新規生成が停止していること

## ⚠️ blocked_upstream_pending（必須）

本 Phase は **親 FU-01 (issue-516) の live wiring が staging で完了するまで `blocked_upstream_pending` を維持** する。

### 着手解除条件（いずれか満たす）

- [ ] `gh issue view 516 --comments` の最新 comment で FU-01 staging evidence 完了が宣言されている
- [ ] `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/outputs/phase-11/` 配下に staging-evidence の実体配置が確認できる
- [ ] 親タスク artifacts.json の `phases.phase-11.status` が `runtime_evidence_collected` 等の完了系状態に遷移済み

### 着手解除確認コマンド

```bash
# 親 Issue 確認
gh issue view 516 --comments | tee outputs/phase-11/upstream-fu01-status.log

# 親タスク evidence 確認
ls -la docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/outputs/phase-11/ \
  2>&1 | tee -a outputs/phase-11/upstream-fu01-status.log
```

## 環境制約（解除後）

- staging 環境で audit-correlation が live wiring 済み（FU-01 完了）
- `bash scripts/cf.sh whoami` 成功
- Cloudflare Secrets の `AUDIT_CORRELATION_SALT` / `AUDIT_CORRELATION_SALT_PREVIOUS` 操作権限あり
- `scripts/audit-correlation/rotate-salt.sh` が実行可能（chmod +x 済み）

## 変更対象ファイル一覧と種別

本 Phase は evidence 取得のみで、コード変更は伴わない。生成 evidence は以下:

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `outputs/phase-11/staging-evidence.md` | 新規 | rotation 全工程の evidence manifest |
| `outputs/phase-11/dual-hash-grep-gate.log` | 新規 | dual-hash 期間の grep gate 結果 |
| `outputs/phase-11/dry-run.log` | 新規 | `--dry-run` 出力 |
| `outputs/phase-11/apply.log` | 新規 | `--apply` 出力 |
| `outputs/phase-11/end-rotation.log` | 新規 | `--end-rotation` 出力 |
| `outputs/phase-11/high-alert-continuity.md` | 新規 | HIGH alert 連続性 ≥ 99% の数値根拠 |

## 取得手順（着手解除後）

```bash
mkdir -p outputs/phase-11

# 0) 親 FU-01 完了確認（必須）
gh issue view 516 --comments | tee outputs/phase-11/upstream-fu01-status.log

# 1) staging dry-run（副作用なし）
bash scripts/audit-correlation/rotate-salt.sh --dry-run --env staging \
  2>&1 | tee outputs/phase-11/dry-run.log
echo "exit=$?" | tee -a outputs/phase-11/dry-run.log

# 2) ⚠️ user gate（runtime apply）後にのみ実行
bash scripts/audit-correlation/rotate-salt.sh --apply --env staging \
  2>&1 | tee outputs/phase-11/apply.log
echo "exit=$?" | tee -a outputs/phase-11/apply.log

# 3) dual-hash 期間（7 日）監視
#    HIGH alert 連続性 ≥ 99% を high-alert-continuity.md に記録
#    rotation 直前 24h と 直後 24h の同一 actor 検知率を比較

# 4) dual-hash grep gate
#    FU-01 の実 persistence surface が確定するまでは D1 table 名を固定しない。
#    redacted runner output または FU-01 が定義した保存先を対象に v1/v2 同居を確認する。
AUDIT_CORRELATION_EVIDENCE_JSON=/tmp/audit-correlation-rotation-redacted.json
jq -e '.[] | select(.fingerprintVersion == 2 and .fingerprintHashes.v1 and .fingerprintHashes.v2)' \
  "$AUDIT_CORRELATION_EVIDENCE_JSON" \
  2>&1 | tee outputs/phase-11/dual-hash-grep-gate.log

# 5) 7 日経過後 end-rotation
bash scripts/audit-correlation/rotate-salt.sh --end-rotation --env staging \
  2>&1 | tee outputs/phase-11/end-rotation.log
echo "exit=$?" | tee -a outputs/phase-11/end-rotation.log

# 6) end-rotation 後、新規 v1 生成停止確認（48h 観測後の grep）
#    FU-01 の保存先が D1 の場合のみ、その table 名で同等 SQL を追加する。
jq -e '[.[] | select(.observedAfterEndRotation == true and .fingerprintHashes.v1)] | length == 0' \
  "$AUDIT_CORRELATION_EVIDENCE_JSON" \
  2>&1 | tee -a outputs/phase-11/dual-hash-grep-gate.log
# 期待: true
```

## 入力 / 出力 / 副作用

- 入力: 親 FU-01 staging wiring 完了 / `AUDIT_CORRELATION_SALT_NEW` の事前生成（1Password に保管）
- 出力: 6 evidence ファイル
- 副作用: Cloudflare Secrets `AUDIT_CORRELATION_SALT` / `AUDIT_CORRELATION_SALT_PREVIOUS` の更新 / staging audit log への dual-hash record 追加

## 期待結果

| ファイル | 期待 |
| --- | --- |
| `staging-evidence.md` | dry-run / apply / 7-day window / end-rotation の各段階の evidence manifest |
| `dual-hash-grep-gate.log` | dual-hash 期間中: v1 + v2 同居 record ≥ 1 件 / end-rotation 後 48h: v1 新規 0 件 |
| `high-alert-continuity.md` | rotation 直前 24h vs 直後 24h で同一 actor 検知率 ≥ 99% の数値 |
| `dry-run.log` / `apply.log` / `end-rotation.log` | 各 exit 0 / Cloudflare Secrets 操作の成功記録（値は出力しない） |
| `upstream-fu01-status.log` | 親 FU-01 完了 evidence |

## 不変条件 / 禁止事項

- production rotation は本タスクスコープ**外**。Cloudflare Secrets `--env production` への操作は禁止。
- `AUDIT_CORRELATION_SALT` の実値を log / evidence ファイルに記録しない（grep / SOP の慣性事故防止）。`rotate-salt.sh` 側で値マスクが効いていることを前提とする。
- Issue #555 は CLOSED のまま。本 Phase で reopen / close 操作をしない。

## DoD

- [ ] 親 FU-01 完了 evidence が `upstream-fu01-status.log` に記録
- [ ] `dry-run.log` / `apply.log` / `end-rotation.log` 全て exit 0
- [ ] `dual-hash-grep-gate.log` で dual-hash 期間中 ≥ 1 件、end-rotation 48h 後 0 件
- [ ] `high-alert-continuity.md` で連続性 ≥ 99% を数値で証明
- [ ] `staging-evidence.md` が manifest として 6 ファイルを参照
- [ ] production rotation の操作が一切行われていない（git diff 確認）

## 状態遷移

- spec 作成完了時: `blocked_upstream_pending`
- 親 FU-01 完了 + user runtime apply 承認時: 解除して evidence 取得開始
- evidence 取得完了時: `runtime_evidence_collected`
- それ以前は PASS 単独表記しない

## 成果物

- `outputs/phase-11/phase-11.md`（本ファイル）
- `outputs/phase-11/staging-evidence.md`（解除後生成）
- `outputs/phase-11/dual-hash-grep-gate.log`（解除後生成）
- `outputs/phase-11/dry-run.log` / `apply.log` / `end-rotation.log`（解除後生成）
- `outputs/phase-11/high-alert-continuity.md`（解除後生成）
- `outputs/phase-11/upstream-fu01-status.log`（解除確認用）

## 次 Phase の前提条件

evidence 6 ファイルの実体配置と DoD 全項目 PASS。Phase 12 implementation-guide / system-spec-update-summary に rotation 結果（連続性数値 / fingerprintVersion=2 移行完了時刻）を反映する。
