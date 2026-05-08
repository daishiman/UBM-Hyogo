# Phase 04 — テスト戦略

実装区分: ドキュメントのみ仕様書（CONST_004 例外適用 — 純粋に markdown 2 件作成のみ）

## 0. テスト方針総論

本タスクは docs-only であり、ビルド / typecheck / unit test 不要。検証は **markdown 構造 grep / 視覚値混入禁止 grep / API trace check / コピー原文 grep / mermaid block count / markdown validation / 行数 inventory / link check** の 8 種で構成する。markdown lint script が未定義の場合は `PASS_WITH_SUBSTITUTION` として JSON parse + grep gates を代替証跡にする。

## 1. 検証カテゴリ

| # | カテゴリ | 検証対象 | 想定 evidence |
|---|---------|----------|--------------|
| T1 | markdown 構造 | §1〜§N + §99 章立て数 | `grep-section-count.log` |
| T2 | 視覚値混入禁止 | HEX / oklch / px / bg-arbitrary-class | `grep-visual-values.log` |
| T3 | API trace | 現行 API 正本（apps/api + apps/web BFF + aiworkflow-requirements）と §X.4 一致 | `grep-api-trace.log` |
| T4 | コピー原文 | prototype 主要文字列の hit | `grep-copy-text.log` |
| T5 | mermaid block | mermaid block 数（8 画面分 + login 派生） | `grep-mermaid-count.log` |
| T6 | markdown validation | lint script 未定義時は代替証跡 PASS | `markdown-lint.log` |
| T7 | 行数 inventory | 09e / 09f 実体あり、行数を証跡化 | `wc-lines.log` |
| T8 | link check | 9 series link の placeholder 解決 / dead link 0 | `link-check.log` |

## 2. T1 — markdown 構造検証

```bash
F1=docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md
F2=docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md

# 09e: §1〜§6 + §99 = 7 件
test "$(grep -cE '^## [0-9]+\. ' "$F1")" = "7"

# 09f: §1〜§2 + §99 = 3 件
test "$(grep -cE '^## [0-9]+\. ' "$F2")" = "3"

# 各画面 X.1〜X.7 が揃うことを sub-section grep で確認
# 09e: 6 画面 × 7 節 = 42 件（§99 は除外）
# 09f: 2 画面 × 7 節 = 14 件
```

期待: 09e で `^## [0-9]+\. ` が 7 件、09f で 3 件。

## 3. T2 — 視覚値混入禁止 grep（4 種）

```bash
for F in "$F1" "$F2"; do
  grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" && exit 1 || true
  grep -nE 'oklch\(' "$F" && exit 1 || true
  grep -nE '\b[0-9]+px\b' "$F" && exit 1 || true
  grep -nE '\bbg-\[' "$F" && exit 1 || true
done
```

期待: 全 4 パターンで検出件数 0。

注: prototype JSX 内に視覚値が含まれる行があった場合は transcription source の事実として転記するが、その場合は token 化未済として task-08 / task-19 への送り返し対象になる（本タスクで token 化はしない、検出は Phase 11 evidence に記録）。

## 4. T3 — API trace check

現行 API 正本と、09e/09f の §X.4 表を **行レベル trace（method × endpoint × route）で完全一致**を確認。

```bash
# 現行 API 正本から API 行を抽出
grep -E '^\| (GET|POST|PATCH|DELETE) \|' \
  docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md \
  > /tmp/phase3-api.txt

# 09e + 09f から API 行を抽出
grep -hE '^\| (GET|POST|PATCH|DELETE) \|' "$F1" "$F2" \
  > /tmp/09ef-api.txt

# 集合比較（route × method × endpoint の 3 タプル）
# diff /tmp/phase3-api-keys.txt /tmp/09ef-api-keys.txt
```

期待: 現行 API 正本の全 endpoint × method × route が §X.4 に出現、逆も成立。phase-3 §2 の古い endpoint 名は historical input として扱い、現行実装で上書きする。

対象 endpoint（元タスク §0.4）:
- `GET /public/stats` / `GET /public/members[?...]` / `GET /public/members/:id` / `GET /public/form-preview`
- `POST /api/auth/magic-link` / `GET /api/auth/gate-state` / Auth.js signout
- `GET /api/me/profile` / `POST /api/me/visibility-request` / `POST /api/me/delete-request`

## 5. T4 — コピー原文一致

prototype の主要文字列（Hero タイトル / CTA ラベル / login error message）を `grep -F` で 09e/09f に検索し全件 hit を確認。

```bash
# 主要コピー候補（prototype 由来、固定文字列で grep）
KEYS=(
  # 公開トップ
  "UBM Hyogo"  # 仮例。実際の固定文字列は prototype から抽出
  # login 5+1 状態
  "確認メールを送信しました"
  "ご登録が見つかりませんでした"
  "退会済みアカウントです"
  # profile 4 領域
  "banner" "summary" "request" "delete"
)
# 各 key について grep -F で 09e or 09f に hit することを確認
```

期待: 全 key が 09e or 09f に最低 1 件 hit。

> 注: 上記 KEYS の実値は Phase 5 ランブック内で prototype から抽出して確定する。本仕様書段階では grep ロジックの形のみ確定。

## 6. T5 — mermaid block 数

```bash
# 09e: 公開 6 画面 + (register / privacy / terms は派生だが mermaid あり想定) = 6 以上
test "$(grep -c '^```mermaid$' "$F1")" -ge 6

# 09f: login + profile + login 派生 = 3 以上
test "$(grep -c '^```mermaid$' "$F2")" -ge 3
```

期待: 09e 6 以上、09f 3 以上。

## 7. T6 — markdown validation

```bash
node -e 'JSON.parse(require("fs").readFileSync("docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/artifacts.json","utf8")); console.log("PASS_WITH_SUBSTITUTION")'
```

期待: markdown lint script がある場合は error 0。未定義の場合は artifacts JSON parse + grep gates による `PASS_WITH_SUBSTITUTION`。

## 8. T7 — 行数 check

```bash
wc -l "$F1" "$F2"
```

期待: 実体あり、行数を evidence 化。完全 blueprint と凍結 prototype 転記を優先するため、行数は AC の hard gate ではない。

## 9. T8 — link check

09e / 09f が 09a / 09b / 09c / 09d / phase-3 / pages-*.jsx を link する箇所について、§番号 placeholder（`§TBD`）が残存しないことを確認。

```bash
grep -nE '§TBD' "$F1" "$F2"
# 期待: 検出 0 件
```

dead link は markdown lint の rule で吸収するか、別途 `markdown-link-check` を実行。

## 10. AC × 検証マッピング（Phase 7 で詳細化）

| AC | 主検証 | evidence |
|----|--------|---------|
| AC-1 / AC-2 | T7 行数 inventory | `wc-lines.log` |
| AC-3 / AC-4 | T1 章立て数 | `grep-section-count.log` |
| AC-5 | T1 sub-section grep | `grep-section-count.log` |
| AC-6 | T4 コピー原文 5+1 状態 | `grep-copy-text.log` |
| AC-7 | T4 コピー原文 4 領域 | `grep-copy-text.log` |
| AC-8 | 視覚 review（phase-3 §3 §5.2 派生ルール転記） | review note |
| AC-9 | T2 視覚値 4 種 | `grep-visual-values.log` |
| AC-10 | T3 API trace | `grep-api-trace.log` |
| AC-11 | grep（consent / responseEmail / D1） | `grep-invariants.log` |
| AC-12 | T6 markdown validation | `markdown-lint.log` |
| AC-13 | T8 link check | `link-check.log` |

## 11. 異常系テスト（Phase 6 で詳細化）

| 異常系 | 検出方法 | 復旧 |
|-------|---------|------|
| コピー原文ドリフト | T4 grep miss | prototype を再読込し転記し直す |
| API 表ドリフト | T3 diff non-zero | 現行 API 正本を base に §X.4 を再生成 |
| 視覚値混入 | T2 grep hit | token 名（`--ubm-*`）に置換 |
| login 5+1 状態欠落 | T4 で `unregistered` / `rules_declined` / `deleted` 等が miss | 09f §1.3 mermaid を補修 |
| 不採用要素混入 | grep `TweaksPanel` 等が §1〜§N に出現 | §99 へ移動 |
| mermaid 構文エラー | T5 block 数不足 / mermaid lint | template から再生成 |

## 12. 次フェーズへの引き渡し

phase-05（実装ランブック）に渡す:

- 8 種検証カテゴリ T1〜T8 の grep ロジック
- AC × evidence マッピング表
- 異常系 6 パターンと復旧手順
