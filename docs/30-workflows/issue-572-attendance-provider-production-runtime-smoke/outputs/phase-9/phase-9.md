# Phase 9 正本: ビルド／品質ゲート

[実装区分: 実装仕様書（CONST_004 / CONST_005 準拠）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 親 Issue | #572 (CLOSED) |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5-8 の差分（`apps/api/scripts/runtime-smoke/` / `docs/30-workflows/runbooks/` / aiworkflow-requirements 整合）が以下 5 種の gate をすべて clean で通る条件を仕様化する:

1. typecheck
2. lint
3. build
4. shell 履歴漏洩 grep gate（本タスク新設）
5. redact filter 偽陰性 0 hit gate（本タスク新設, production 固有値カバー）

## Step 0: 前提確認

```bash
mise --version
mise exec -- node -v   # v24.15.0 期待
mise exec -- pnpm -v   # 10.33.2 期待
which rg               # ripgrep 必須
```

## 変更対象ファイル（gate 観点での影響範囲）

| パス | 変更種別 | gate 観点 |
| --- | --- | --- |
| `apps/api/scripts/runtime-smoke/run-smoke.sh` | 新規 / 編集 | shellcheck / 履歴漏洩 |
| `apps/api/scripts/runtime-smoke/redact.jq` | 新規 / 編集 | redact 拡張対象 |
| `apps/api/scripts/runtime-smoke/expectations.jq` | 新規 / 編集 | jq syntax 検証 |
| `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | 新規 | redact / 履歴漏洩 grep 対象 |
| `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/**` | 新規 | redact / 履歴漏洩 grep 対象 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | secret 命名整合 |

## gate 一覧

### Q-01: typecheck

```bash
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-9/typecheck.log
echo "exit=$?" | tee -a outputs/phase-9/typecheck.log
```

期待: exit 0。`apps/web` / `apps/api` 双方 PASS。

### Q-02: lint

```bash
mise exec -- pnpm lint 2>&1 | tee outputs/phase-9/lint.log
echo "exit=$?" | tee -a outputs/phase-9/lint.log
```

期待: exit 0。新規追加 shell スクリプトについては shellcheck が走る経路を確認。

### Q-03: build

```bash
mise exec -- pnpm build 2>&1 | tee outputs/phase-9/build.log
echo "exit=$?" | tee -a outputs/phase-9/build.log
```

期待: exit 0。`apps/api` / `apps/web` ともに `@opennextjs/cloudflare` / Hono の出力が生成される。

### Q-04: shell 履歴漏洩 grep gate（本タスク新設）

production session 値（cookie / Bearer / OAuth secret / `__Secure-*` 実値）が docs / outputs / scripts / 履歴ファイル類似位置に残らないことを 0 hit で gate する。

```bash
# 検出 pattern（実値ではなく shape）
rg -n --hidden \
  -e '__Secure-next-auth\.session-token=[A-Za-z0-9._\-]{20,}' \
  -e 'Authorization: Bearer [A-Za-z0-9._\-]{20,}' \
  -e 'cf-access-jwt-assertion=[A-Za-z0-9._\-]{20,}' \
  -e '_cfuvid=[A-Za-z0-9._\-]{20,}' \
  -e '_cf_bm=[A-Za-z0-9._\-]{20,}' \
  docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke \
  apps/api/scripts/runtime-smoke \
  docs/30-workflows/runbooks/production-runtime-smoke-attendance.md \
  2>&1 | tee outputs/phase-9/history-leak-grep.log

# 期待: 0 hit（rg は 0 hit 時 exit 1 → grep gate としては逆判定にする）
test -s outputs/phase-9/history-leak-grep.log && echo "FAIL" || echo "PASS"
```

> 値の長さ閾値（20 文字以上の base64-like）で実値疑いを拾う。pattern 文字列自体（runbook 上のテンプレ表記 `__Secure-next-auth.session-token=<REDACTED>`）は 0 hit として通る設計。

### Q-05: redact filter 偽陰性 0 hit gate（本タスク新設）

production 固有の Cloudflare / Auth.js 由来 key が redact 対象に含まれているか確認:

```bash
# redact 対象 key のリストを出力する jq script を実行し、必須 key の存在を確認
jq -r '.[]' apps/api/scripts/runtime-smoke/redact-keys.json \
  > outputs/phase-9/redact-keys-effective.log

REQUIRED=(cf-ray cf-cache-status __Secure- _cfuvid _cf_bm authorization cookie set-cookie email fullName)
MISSING=()
for k in "${REQUIRED[@]}"; do
  grep -q "$k" outputs/phase-9/redact-keys-effective.log || MISSING+=("$k")
done

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "PASS: all required redact keys present"
else
  echo "FAIL: missing keys: ${MISSING[*]}"
fi | tee outputs/phase-9/redact-coverage.log
```

> 実装が `redact.jq` 単体の場合は jq AST から key 集合を抽出する経路に置き換える。本仕様では **redact 対象 key の SSOT を JSON で持ち、jq から読み込む** 設計を推奨する。

### Q-06: 既存 grep gate との非干渉

```bash
# design-tokens / d1-direct-access の既存 gate が引き続き 0 hit
mise exec -- pnpm verify:design-tokens 2>&1 | tee outputs/phase-9/verify-design-tokens.log
# d1-direct-access gate（apps/web から D1 binding 直接アクセスがないこと）
rg -n 'env\.DB|c\.env\.DB' apps/web/src 2>&1 | tee outputs/phase-9/d1-direct-grep.log
test -s outputs/phase-9/d1-direct-grep.log && echo "FAIL" || echo "PASS"
```

## 失敗時の戻り先

| Q-ID | 戻り先 | 対応 |
| --- | --- | --- |
| Q-01 | Phase 5 | 型エラー修正 |
| Q-02 | Phase 5 | lint 違反修正（shellcheck 含む） |
| Q-03 | Phase 5 | build エラー修正 |
| Q-04 | Phase 8 / Phase 11 直前 | 実値混入箇所を redact し再 commit、必要なら force overwrite で履歴含めスクラブ |
| Q-05 | Phase 8 | redact 対象キーを SSOT に追加 |
| Q-06 | 該当 既存 gate 仕様 | 既存仕様の SSOT 確認 |

## ローカル/リモート実行コマンド

```bash
# ローカル一括
mise exec -- pnpm typecheck && \
mise exec -- pnpm lint && \
mise exec -- pnpm build

# リモート（CI / `.github/workflows/`）
# 既存の verify-* job + 新設 redact / history grep job を gate に追加
```

## 入出力 / 副作用

| 項目 | 値 |
| --- | --- |
| 入力 | Phase 5-8 差分 |
| 出力 | `outputs/phase-9/{typecheck,lint,build,history-leak-grep,redact-coverage,verify-design-tokens,d1-direct-grep}.log` |
| 副作用 | なし（read-only / 静的検証のみ） |

## DoD（完了定義）

- [ ] Q-01〜Q-06 が exit 0 / PASS で揃う条件が仕様化
- [ ] shell 履歴漏洩 grep の pattern と log 保存先が確定
- [ ] redact 対象 key の SSOT 化方式と必須 key リストが確定
- [ ] 失敗時の戻り先 mapping が確定
- [ ] CI gate への追加経路（`.github/workflows/` 該当 job）が示唆されている

## 次 Phase の前提条件

Phase 10（user gate / production 実行 runbook）着手は本 Phase 全 gate clean が必須。
