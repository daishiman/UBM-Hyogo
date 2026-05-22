# Phase 10: 単体テスト実装仕様（vitest + shellcheck）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec_created |
| 親 Issue | #555 |
| 親タスク | issue-516 (FU-01) |
| visualEvidence | NON_VISUAL |

## 目的

`AUDIT_CORRELATION_SALT` rotation 自動化（dual-hash 機構 / fingerprintVersion=2 移行）について、以下を vitest で決定論的に検証する。

1. dual-hash 期間中（`AUDIT_CORRELATION_SALT_PREVIOUS` 併存）に v1 / v2 双方の fingerprint hash を生成すること
2. 単一期（PREVIOUS なし）に v2 のみを生成すること
3. rollback 後（PREVIOUS のみ採用）の hash が rotation 前の hash と一致すること
4. v1 hash で identify された record と v2 hash で identify された別 record が同一 actor として merge されること

加えて `scripts/audit-correlation/rotate-salt.sh` を `shellcheck` で静的検証し、CI gate 候補として記録する。

## Step 0: P50 チェック（必須）

- [ ] `apps/api/src/audit-correlation/redact.ts` 存在
- [ ] `apps/api/src/audit-correlation/correlate.ts` 存在
- [ ] `apps/api/src/audit-correlation/__tests__/redact.test.ts` のパス確認
- [ ] `apps/api/src/audit-correlation/__tests__/correlate.test.ts` のパス確認
- [ ] `scripts/audit-correlation/rotate-salt.sh` 存在
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test --run --list` で対象 suite が解決される
- [ ] log: `outputs/phase-10/local-evidence/p50-precheck.log`

## 変更対象ファイル一覧と種別

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/audit-correlation/__tests__/redact.test.ts` | 編集 | dual-hash / single / rollback の 3 ケース追加 |
| `apps/api/src/audit-correlation/__tests__/correlate.test.ts` | 編集 | cross-version merge の 1 ケース追加 |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/baseline.json` | 新規 | rotation 前 fixture（v1 のみ） |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/dual-hash-window.json` | 新規 | dual-hash 期間 fixture（v1 + v2） |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/post-rotation.json` | 新規 | rotation 後 fixture（v2 のみ） |
| `scripts/audit-correlation/rotate-salt.sh` | 既存（変更なし） | shellcheck 対象として参照のみ |

## vitest テストケース仕様

### redact.test.ts 追加ケース

| # | test case 名 | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-01 | `dual-hash window emits v1 and v2 fingerprint hashes` | env: `AUDIT_CORRELATION_SALT=NEW`, `AUDIT_CORRELATION_SALT_PREVIOUS=OLD`、actor identifier 任意 | `fingerprintHashes.v1` / `fingerprintHashes.v2` が双方とも 64 文字 SHA-256 hex / 値が異なる / `fingerprintVersion=2` |
| TC-02 | `single salt window emits only v2` | env: `AUDIT_CORRELATION_SALT=NEW` のみ（PREVIOUS 未設定） | `fingerprintHashes.v2` のみ存在 / `fingerprintHashes.v1` undefined / `fingerprintVersion=2` |
| TC-03 | `rollback yields hash identical to pre-rotation baseline` | rotation 前 hash を baseline.json から読み込み、rollback 後 env（`SALT=OLD` 単独）で再計算 | rollback 後の `fingerprintHashes.v2`（OLD で計算）が baseline.json の v1 hash と一致 |

### correlate.test.ts 追加ケース

| # | test case 名 | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-04 | `v1 hash record and v2 hash record merge into same actor` | record A: `fingerprintHashes={v1: H1}`、record B: `fingerprintHashes={v1: H1, v2: H2}`、record C: `fingerprintHashes={v2: H2}` | A / B / C が同一 actor cluster に merge / cluster size = 3 / 決定論的 cluster id |

## fixture 仕様

```json
// fixtures/rotation/baseline.json (rotation 前: v1 only)
{
  "salt": "OLD",
  "actor": "user@example.com",
  "fingerprintVersion": 1,
  "fingerprintHashes": { "v1": "<SHA-256 hex 64 chars>" }
}

// fixtures/rotation/dual-hash-window.json (rotation 中: v1 + v2)
{
  "saltCurrent": "NEW",
  "saltPrevious": "OLD",
  "actor": "user@example.com",
  "fingerprintVersion": 2,
  "fingerprintHashes": {
    "v1": "<SHA-256 hex with OLD>",
    "v2": "<SHA-256 hex with NEW>"
  }
}

// fixtures/rotation/post-rotation.json (rotation 完了: v2 only)
{
  "salt": "NEW",
  "actor": "user@example.com",
  "fingerprintVersion": 2,
  "fingerprintHashes": { "v2": "<SHA-256 hex with NEW>" }
}
```

## ローカル実行コマンド

```bash
mkdir -p outputs/phase-10/local-evidence

# 1) typecheck
mise exec -- pnpm typecheck \
  2>&1 | tee outputs/phase-10/local-evidence/typecheck.log
echo "exit=$?" | tee -a outputs/phase-10/local-evidence/typecheck.log

# 2) lint
mise exec -- pnpm lint \
  2>&1 | tee outputs/phase-10/local-evidence/lint.log
echo "exit=$?" | tee -a outputs/phase-10/local-evidence/lint.log

# 3) vitest（@ubm-hyogo/api filter）
mise exec -- pnpm --filter @ubm-hyogo/api test \
  2>&1 | tee outputs/phase-10/local-evidence/test.log
echo "exit=$?" | tee -a outputs/phase-10/local-evidence/test.log

# 4) shellcheck
shellcheck scripts/audit-correlation/rotate-salt.sh \
  2>&1 | tee outputs/phase-10/local-evidence/shellcheck.log
echo "exit=$?" | tee -a outputs/phase-10/local-evidence/shellcheck.log
```

## 入力 / 出力 / 副作用

- 入力: `AUDIT_CORRELATION_SALT` / `AUDIT_CORRELATION_SALT_PREVIOUS`（テスト内で env stub）、fixture JSON 3 種
- 出力: vitest result + 4 ログファイル
- 副作用: ファイル書き込みは `outputs/phase-10/local-evidence/` 配下のみ。D1 / Cloudflare API への副作用なし（local 完結）

## CI gate 候補（提案 / 本タスクで gate 化はしない）

`shellcheck scripts/audit-correlation/rotate-salt.sh` を将来的に `.github/workflows/verify-shell.yml` に追加する候補として記録。本タスクスコープでは local 実行のみ。

## parity 要件

- 既存 vitest（`audit-correlation` 配下）が壊れていないこと（regression 防止）
- fingerprintVersion=1 単独入力での後方互換が保たれること（TC-03 で検証）

## assert すべき決定論性

- `fingerprintHashes.v1` / `fingerprintHashes.v2` の hex 値（SHA-256 64 文字）
- `fingerprintVersion` 整数値（1 → 2 の遷移）
- correlate cluster の決定論的 id（同一入力で同一 id）

## 期待 coverage 増分

best-effort（強制値は要求しない）:
- `apps/api/src/audit-correlation/redact.ts` の line coverage +5pt
- dual-hash 分岐 / rollback 分岐 / single 分岐の branch coverage 100%

## 成果物

- `outputs/phase-10/phase-10.md`（本ファイル）
- `outputs/phase-10/local-evidence/typecheck.log`
- `outputs/phase-10/local-evidence/lint.log`
- `outputs/phase-10/local-evidence/test.log`
- `outputs/phase-10/local-evidence/shellcheck.log`
- `outputs/phase-10/local-evidence/p50-precheck.log`

## DoD

- [ ] vitest 4 ケース（redact 3 + correlate 1）すべて exit 0
- [ ] typecheck / lint exit 0
- [ ] shellcheck exit 0（warning なし、または許容理由付き）
- [ ] fixture 3 ファイルが実体配置され、test 内で参照される
- [ ] 4 ログが `outputs/phase-10/local-evidence/` に保存

## 次 Phase の前提条件

vitest / shellcheck すべて exit 0。Phase 11 は加えて親 FU-01 (issue-516) の staging live wiring 完了が必要（`blocked_upstream_pending`）。
