# Phase 8: リファクタリング

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> 実装区分: **条件付き実装仕様書** (CONST_005 / CONST_007)

---

## 1. リファクタリング方針

本サイクルは「周辺強化 5 件を 1 PR で完了する」スコープのため、Phase 5 実装直後に行う最小限の整理に限定する。`apps/` / `packages/` のアプリケーションコードには手を入れない。リファクタリングの目的は (a) shell script の保守性向上、(b) 命名規約統一、(c) 既存 `scripts/cf.sh` との責務分離明確化 の 3 点。機能挙動・exit semantics・YAML semantics は不変に保つ。

## 2. 対象別判定

| 対象 | 判定 | 内容 |
|---|---|---|
| `scripts/oidc/verify-claim-pin.sh` | refactor | 関数化（`parse_args` / `verify_claim` / `print_mismatch`）+ 命名統一 |
| `scripts/redaction-check.sh` | refactor | 追加パターンを配列定義に集約（保守性向上）+ `mask_line` 再利用整理 |
| `.github/workflows/oidc-observation-window.yml` | no refactor | no-op 最小構成のため抽象化不要 |
| `.github/workflows/web-cd.yml` | no refactor | コメント追加のみ |
| `deployment-secrets-management.md` | no refactor | 追記のみ |
| `scripts/cf.sh` | no refactor | 責務分離維持（deploy wrapper であり OIDC verify 責務は持たせない） |

## 3. ディレクトリ命名規約

| 規約 | 採用 | 根拠 |
|---|---|---|
| ディレクトリ名 | kebab-case | 既存 `scripts/hooks/` と整合 |
| 配置 | `scripts/oidc/` 配下に集約 | OIDC 関連 helper の単一所在地。後続実切替時の追加 helper も同ディレクトリに配置予定 |
| ファイル名 | kebab-case + `.sh` | 既存 `scripts/redaction-check.sh` / `scripts/coverage-guard.sh` と整合 |
| テスト配置 | `scripts/oidc/__tests__/` または `scripts/oidc/*.spec.sh` | リポジトリ既存スタイルに準拠（`*.spec.{ts,tsx}` 規約の shell 版） |

## 4. `redaction-check.sh` パターン定義の配列化リファクタ

### 4.1 Before（パターンごとに検出ロジック散在）

```bash
JWT_MATCHES="$(grep -E -n "$JWT_REGEX" "$INPUT_SRC" ...)"
if [ -n "$JWT_MATCHES" ]; then
  echo "::error::JWT-like token detected in log"
  ...
fi

CF_AUD_MATCHES="$(grep -F -n "cloudflare-aud" "$INPUT_SRC" ...)"
if [ -n "$CF_AUD_MATCHES" ]; then
  echo "::error::cloudflare-aud claim detected in log"
  ...
fi
```

### 4.2 After（パターン定義テーブル化）

```bash
# pattern id | mode (E|F) | pattern | error label
PATTERNS=(
  "jwt|E|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|JWT-like token detected in log"
  "cf-aud|F|cloudflare-aud|cloudflare-aud claim detected in log"
)

for entry in "${PATTERNS[@]}"; do
  IFS='|' read -r pid mode pat label <<<"$entry"
  case "$mode" in
    E) matches="$(grep -E -n "$pat" "$INPUT_SRC" 2>/dev/null || true)" ;;
    F) matches="$(grep -F -n "$pat" "$INPUT_SRC" 2>/dev/null || true)" ;;
  esac
  if [ -n "$matches" ]; then
    echo "::error::$label"
    printf '%s\n' "$matches" | mask_line
    LEAK_FOUND=1
  fi
done
```

### 4.3 保証

- exit semantics 不変（`LEAK_FOUND=1` 集約フロー維持）
- 既存 ACCOUNT_ID / token-like 検出フローはそのまま残す（配列化対象は今回追加した 2 パターンのみ。既存ロジックを巻き込むと regression リスク）
- パターン追加時はテーブルに 1 行追記するだけで拡張可能

## 5. `verify-claim-pin.sh` の関数化

| 関数 | 責務 |
|---|---|
| `usage()` | usage 文字列を stderr に出力し exit 2 |
| `parse_args()` | CLI 引数 4 件をパースし変数にセット。欠落・未知オプション時 `usage` 呼び出し |
| `verify_field()` | 単一 field の expected/got 比較。mismatch 時 stderr 出力 + mismatch カウンタ加算 |
| `verify_combination()` | ref と environment の対応一致を検証 |
| `main()` | 上記呼び出し + 最終 exit code 決定（mismatch 数 > 0 → 1） |

各関数は `set -euo pipefail` 配下で動作。副作用なし。

## 6. 責務分離確認（`scripts/cf.sh` との関係）

| script | 責務 | 本サイクルで持たせない責務 |
|---|---|---|
| `scripts/cf.sh` | Cloudflare CLI ラッパー（`op run` + `mise exec` + esbuild 解決） | OIDC claim 検証 / redaction 検証 |
| `scripts/oidc/verify-claim-pin.sh` | subject claim pin の dry-run 検証 | deploy 実行 / token 発行 |
| `scripts/redaction-check.sh` | log の secret leak 検出 | claim 検証 / deploy 実行 |

→ 各 script は単一責務。`scripts/cf.sh` への OIDC verify ロジック混入を禁止する（後続実切替サイクルでも維持）。

## 7. 削除対象

なし。既存 `redaction-check.sh` の ACCOUNT_ID / token-like 検出ロジック、`scripts/cf.sh` の deploy wrapper、`web-cd.yml` の step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路はすべて current safe baseline として維持。

## 8. DoD

- [ ] リファクタリング前後で `verify-claim-pin.sh` の 9 テストケース全 PASS（挙動不変）
- [ ] リファクタリング前後で `redaction-check.sh` の追加 5 ケース + 既存 ACCOUNT_ID regression ケース全 PASS
- [ ] `shellcheck` warn 0 件（リファクタ後も維持）
- [ ] `actionlint` 警告 0 件
- [ ] `git diff -- .github/workflows/web-cd.yml` がコメント行追加のみ
- [ ] `scripts/cf.sh` に OIDC 関連ロジックを混入させていない
