# Phase 06 — 異常系検証

実装区分: ドキュメントのみ仕様書（CONST_004 例外適用 — 純粋に markdown 2 件作成のみ）

## 0. 目的

09e / 09f 執筆中・完了後に発生し得る異常系を列挙し、それぞれに検出 grep / 復旧手順を定義する。

## 1. 異常系カタログ

### 1.1 コピー原文ドリフト

**現象**: prototype の文字列を意図せず改変（typo / 全角半角混在 / whitespace 増減）して 09e/09f に転記。

**検出**:

```bash
# prototype 主要 KEY を抽出（固定文字列）
KEYS=( "登録する" "詳細" "ログイン" "送信する" "退会する" )  # 例
for K in "${KEYS[@]}"; do
  grep -F "$K" docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx \
              docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx \
    > /dev/null || echo "MISSING_IN_PROTOTYPE: $K"
  grep -F "$K" docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md \
              docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md \
    > /dev/null || echo "MISSING_IN_BLUEPRINT: $K"
done
```

**復旧**: prototype を再読込し該当行をコピー直し。`Read` tool で prototype の該当行範囲を読み、09e/09f §X.1 / §X.2 を上書き修正する。

### 1.2 API 表ドリフト

**現象**: 現行 API 正本の endpoint × method × route 3 タプルと §X.4 が不一致（query 文字列の差異 / 余分な endpoint 混入 / 欠落）。

**検出**:

```bash
# 現行 API 正本の API 表行を canonical に抽出
grep -E '^\| (GET|POST|PATCH|DELETE) \|' \
  docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md \
  | sort -u > /tmp/phase3-api.txt

# 09e + 09f の §X.4 行を canonical に抽出
grep -hE '^\| (GET|POST|PATCH|DELETE) \|' \
  docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md \
  docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md \
  | sort -u > /tmp/09ef-api.txt

# 集合比較
diff /tmp/phase3-api.txt /tmp/09ef-api.txt
```

**復旧**: apps/api / apps/web BFF / aiworkflow-requirements の現行 API 正本を base に §X.4 を再生成。query 文字列まで揃える。

### 1.3 視覚値混入

**現象**: HEX / oklch / px / bg-arbitrary-class が 09e/09f に混入。

**検出**: Phase 4 §3 T2 grep を実行。

**復旧**:
- prototype 由来の class 内 HEX 直書き → token 名（`bg-ubm-*`）に置換し、本タスクではなく task-08 / task-19 へ token 化漏れとして送り返し（本タスクで token 化はしない）
- spec 内のサンプル説明文に意図せず混入した場合は token 名にリライト

### 1.4 login 5+1 状態欠落

**現象**: 09f §1.3 mermaid に input / sent / unregistered / deleted / rules_declined / error の 5+1 状態が揃わない。

**検出**:

```bash
F=docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md
for S in input sent unregistered deleted error; do
  grep -E "$S" "$F" > /dev/null || echo "MISSING_LOGIN_STATE: $S"
done
```

**復旧**: phase-02 §3.2 の login 5+1 状態 mermaid テンプレを §1.3 に転記し直す。

### 1.5 不採用要素混入

**現象**: §99 にあるべき要素（TweaksPanel / theme switcher / AvatarStoreProvider#localStorage / GAS 由来）が §1〜§N の本編に出現。

**検出**:

```bash
# 本編 §1〜§N（§99 より前）に不採用要素キーワードが混入していないか
NO_PROMOTE=( "TweaksPanel" "theme switcher" "AvatarStoreProvider" "gas-prototype" )
for K in "${NO_PROMOTE[@]}"; do
  awk '/^## 99\. / {exit} {print}' "$F1" | grep -F "$K" \
    && echo "PROMOTE_VIOLATION_09e: $K"
  awk '/^## 99\. / {exit} {print}' "$F2" | grep -F "$K" \
    && echo "PROMOTE_VIOLATION_09f: $K"
done
```

**復旧**: 該当行を §99 へ移動。本編から削除。

### 1.6 mermaid 構文エラー

**現象**: mermaid block 数の不足、または block 内の構文不正。

**検出**:

```bash
# 1 画面 1 mermaid 原則
grep -c '^```mermaid$' "$F1"  # >= 6
grep -c '^```mermaid$' "$F2"  # >= 3

# block の対応 closing fence
grep -cE '^```$' "$F1"
grep -cE '^```$' "$F2"
```

**復旧**: phase-02 §3.1 / §3.2 のテンプレを再投入。

### 1.7 §X.7 link placeholder 残存

**現象**: 9 series 内の §番号が並列タスクで未確定の placeholder（`§TBD`）が残ったまま完了申告。

**検出**:

```bash
grep -nE '§TBD' "$F1" "$F2"
```

**復旧**: 並列タスクの完了通知から §番号を取得して置換。並列タスクが未完了なら本タスクの完了を block する。

### 1.8 行数 inventory 欠落

**現象**: 09e / 09f の実体がなく、`wc-lines.log` に行数が記録されていない。

**検出**: `wc -l "$F1" "$F2"`

**復旧**:
- 過少: §X.1 JSX 転記の不足 / §X.2 コピー原文不足が主因。Phase 5 §2 / §3 を再走
- 過多: 不要な解説コピペや prototype 全体貼りが原因。§X.1 を return JSX のみに絞り、import / boilerplate を除去

### 1.9 不変条件違反

**現象**: consent キー名違い（`publicConsent` 以外を使用） / `responseEmail` を form field として記述 / D1 binding を §X.4 API 表に含める。

**検出**:

```bash
# consent キー
grep -nE 'consent' "$F1" "$F2" | grep -vE 'publicConsent|rulesConsent'
# responseEmail を form field として書いていないか
grep -nE 'responseEmail' "$F1" "$F2"
# D1 binding 名（例: DB binding）が混入していないか
grep -niE '\bD1\b|d1_databases' "$F1" "$F2"
```

**復旧**: 該当箇所を不変条件適合表現に書き直す。

## 2. 異常系優先度

| # | 異常系 | 優先度 | block レベル |
|---|-------|--------|------------|
| 1.1 | コピー原文ドリフト | High | Phase 9 で block |
| 1.2 | API 表ドリフト | High | Phase 9 で block |
| 1.3 | 視覚値混入 | High | Phase 9 で block（AC-9） |
| 1.4 | login 5+1 状態欠落 | High | Phase 9 で block（AC-6） |
| 1.5 | 不採用要素混入 | Mid | Phase 10 で warn |
| 1.6 | mermaid 構文エラー | Mid | Phase 9 で block |
| 1.7 | placeholder 残存 | Mid | Phase 9 で block（AC-13） |
| 1.8 | 行数 inventory 欠落 | Low | Phase 10 で warn（AC-1 / AC-2） |
| 1.9 | 不変条件違反 | High | Phase 9 で block（AC-11） |

## 3. 次フェーズへの引き渡し

phase-07（AC マトリクス）に渡す:

- 異常系 9 カテゴリの検出 grep
- block / warn 区分
- AC との対応関係
