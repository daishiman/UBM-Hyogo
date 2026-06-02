# Phase 11 — 手動テスト（VISUAL_ON_EXECUTION）

[実装区分: implementation]

OG 画像は **視覚成果物** であるため、本タスクの成果物種別は **VISUAL_ON_EXECUTION** とする。
本実装サイクルではローカル render / route / build / size gate を証跡化する。Cloudflare staging での実 OG PNG screenshot は deploy 後の user-gated evidence とする。
implemented_local_runtime_pending 時点では runtime pending（実行はuser-gated runtime 検証）。

## 1. VISUAL である理由

| 観点 | 理由 |
|------|------|
| 成果物の性質 | 生成物が 1200×630 PNG（OG 画像）そのもの。テキスト出力では品質を判定できない |
| 主ソース | OG 画像 PNG（`outputs/phase-11/screenshots/`）が証跡の主ソース |
| SNS 連動 | SNS シェアプレビューの見た目が UX 要件。視覚確認が必須 |

## 2. 3 層評価

| 層 | 評価対象 | 確認内容 |
|----|---------|---------|
| Semantic | metadata 内容 | `<meta>` の og:image / twitter:image が OG URL、og:title / description が member 情報、twitterCard = summary_large_image |
| Visual | OG 画像の見た目 | 1200×630、氏名・肩書きの可読性、日本語表示（Noto Sans JP）、BRAND_COLORS 配色、レイアウト崩れなし |
| AI UX | SNS シェアプレビュー | Twitter Card Validator 等でシェアカードが large image として正しく表示される |

## 3. 検証手順

### 手順 ① named OG 画像（member 存在）

```bash
# ローカル or staging の OG Worker から取得
curl -o /tmp/og-named.png "https://<og-worker>/members/<existing-member-id>"
file /tmp/og-named.png        # PNG image data, 1200 x 630 を確認
```
- 1200×630 PNG であること（AC-1）
- 氏名・肩書きが描画され、日本語が文字化けしないこと
- BRAND_COLORS 配色であること
- 証跡を `outputs/phase-11/screenshots/member-og-image-named.png` として保存

### 手順 ② default OG 画像（member 不明）

```bash
curl -o /tmp/og-default.png "https://<og-worker>/members/nonexistent-id"
file /tmp/og-default.png      # PNG image data, 1200 x 630 を確認（200 で返ること）
```
- 不明 id でも 200 image/png（default 画像）で返ること（AC-2）
- 証跡を `outputs/phase-11/screenshots/member-og-image-default.png` として保存

### 手順 ③ metadata / SNS シェアプレビュー

```bash
# member 詳細ページの metadata を確認
curl -s "https://<web>/members/<existing-member-id>" | rg "og:image|twitter:image|twitter:card"
```
- og:image / twitter:image が OG Worker URL であること（AC-6）
- twitter:card が summary_large_image であること（AC-7）
- Twitter Card Validator 等でシェアカードが large image として表示されること
- 証跡を `outputs/phase-11/screenshots/member-og-share-preview.png` として保存

### 手順 ④ /health

```bash
curl -i "https://<og-worker>/health"   # 200（AC-3）
```

## 4. screenshot canonical 名（宣言）

| ファイル名 | 内容 |
|-----------|------|
| `member-og-image-named.png` | member 存在時の named OG 画像（氏名・肩書き入り） |
| `member-og-image-default.png` | member 不明時の default OG 画像 |
| `member-og-share-preview.png` | SNS シェアデバッガでのプレビュー表示 |

> 保存先: `outputs/phase-11/screenshots/`（`.gitkeep` は既存）。
> 詳細結果は `outputs/phase-11/manual-test-result.md` 参照。実行はuser-gated runtime 検証（implemented_local_runtime_pending のため runtime pending）。
