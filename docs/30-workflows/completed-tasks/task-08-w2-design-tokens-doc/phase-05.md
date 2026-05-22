# Phase 5: 執筆ランブック

実装区分: ドキュメントのみ仕様書（実装ランブック = 執筆手順）

## 執筆順序（ステップバイステップ）

### Step 1. 値の出典確認

```bash
sed -n '1,70p' docs/00-getting-started-manual/claude-design-prototype/styles.css
```

L1-L41: `:root`（stone 既定） / L42-L55: `[data-theme="warm"]` / L56-L70: `[data-theme="cool"]`。値はそのまま転記する。

### Step 2. 新規ファイル作成

```bash
touch docs/00-getting-started-manual/specs/09b-design-tokens.md
```

### Step 3. 章立てスケルトン作成

Phase 2 確定の §1〜§12 を `## ` 見出しのみで先に流し込む（行数感の早期確認用）。

### Step 4. §1 位置づけ執筆

- §1.1 本ファイルが正本である範囲（色 / 余白 / radius / shadow / typography / motion）
- §1.2 `09-ui-ux.md` は契約 / `09a-prototype-map.md` は mapping / 本ファイルは「値」のみ、を明記
- 概ね 30〜40 行

### Step 5. §2 命名規則執筆

phase-02.md の命名規則表を貼り付け、`--ubm-*` prefix の根拠と旧プロトタイプ素朴名からの rename 指針を記述。30〜50 行。

### Step 6. §3 color tokens 執筆（最重要）

#### Step 6.1. §3.1〜§3.3 規範文

- §3.1 surface（bg / bg-2 / panel / panel-2 / border default/strong / text primary/secondary/muted の役割）
- §3.2 accent / status の **テキスト用ではなく面積要素用**規範。テキストは `-ink` variant
- §3.3 zone tokens (a..e) MVP は status alias、将来拡張で独自値置換可能な構造

#### Step 6.2. §3.4 3 テーマ全値表

元仕様 §4.3 の §3.4.1 stone / §3.4.2 warm / §3.4.3 cool 表をそのまま転記。各行に `source` 列で `styles.css` L番号を併記。

> **注意**: warm/cool で `ok/warn/danger/info` は未上書き（stone と共通）。表末尾にこの旨を注記。

#### Step 6.3. §3.5 sRGB fallback

```css
@supports not (color: oklch(0% 0 0)) {
  :root {
    --ubm-color-accent: #b08049;        /* oklch(0.58 0.10 55) ≈ */
    --ubm-color-accent-soft: #f3ece1;
    --ubm-color-accent-ink: #6f4f25;
    --ubm-color-ok: #5e8a5d;
    --ubm-color-warn: #c08540;
    --ubm-color-danger: #b34a3b;
    --ubm-color-info: #4d7da6;
  }
}
```

近似値の正確な算出は task-09 適用タイミングで再計算する旨を注記。

### Step 7. §4 radius / §5 shadow / §6 typography / §7 spacing / §8 motion 執筆

元仕様 §4.6〜§4.10 の表を順に転記。各章 10〜20 行。

### Step 8. §9 JSON サンプル執筆

元仕様 §4.11 の JSON ブロックを **完全な valid JSON** として貼り付け。70〜90 行。`jq .` で parse 通る形を維持。

### Step 9. §10 Tailwind v4 `@theme inline` 直結ガイド執筆

`tokens.css` テンプレ + `globals.css` テンプレを並べる。`@theme inline` の意義（cascade を効かせるため）を 1 段落で説明。50〜70 行。

### Step 10. §11 dark mode placeholder

```css
[data-theme="dark"] {
  /* TODO: 別 workflow で値を確定 */
  --ubm-color-surface-bg: oklch(0.18 0 0);
  --ubm-color-surface-panel: oklch(0.22 0 0);
  --ubm-color-text-primary: oklch(0.95 0 0);
}
```

10〜20 行。

### Step 11. §12 改訂履歴

| Version | Date | Changes |
| --- | --- | --- |
| v2026.05.07-initial | 2026-05-07 | 初版。`styles.css` L1-L70 から OKLch / HEX / radius / shadow / typography / spacing / motion トークンを正本転記。`--ubm-*` prefix 統一、Tailwind v4 `@theme inline` 直結テンプレート、`@supports not` sRGB fallback、dark mode placeholder を提示 |

### Step 12. 自己検証

```bash
# 行数
wc -l docs/00-getting-started-manual/specs/09b-design-tokens.md   # → 380+

# 章立て
grep -c '^## ' docs/00-getting-started-manual/specs/09b-design-tokens.md   # → 12

# token 数
grep -oE '`--ubm-[a-z0-9-]+`' docs/00-getting-started-manual/specs/09b-design-tokens.md | sort -u | wc -l   # → 60+

# JSON parse
awk '/^```json$/,/^```$/' docs/00-getting-started-manual/specs/09b-design-tokens.md | sed '1d;$d' | jq . > /dev/null && echo OK
```

## 想定所要時間

| Step | 想定 |
| --- | --- |
| 1〜3 | 15 min |
| 4〜5 | 20 min |
| 6 | 60 min |
| 7 | 30 min |
| 8 | 20 min |
| 9 | 30 min |
| 10〜11 | 10 min |
| 12 | 15 min |
| **合計** | **約 3 時間** |

> 元仕様の想定工数 0.5 人日 と整合。

## 完了条件

- [ ] Step 1〜12 の手順が確定
- [ ] 各 Step の出力サイズ（行数感）が phase-02.md の章立て設計と整合
- [ ] Step 12 の自己検証コマンドが Phase 9 検証と一致
