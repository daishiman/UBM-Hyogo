# Phase 11: 手動テスト（VISUAL_ON_EXECUTION）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 名称 | 手動テスト |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| visualEvidence | VISUAL_ON_EXECUTION |
| 実装区分 | 実装仕様書 |

## 目的

Tailwind utility が OKLch tokens から正しく生成され、Cloudflare Workers preview 上で `/` が 200 を返すことを **動作証跡として採取** する。純粋な NON_VISUAL ではなく、ビルド + preview 200 + 生成 CSS grep を最低証跡とする。

## 採取証跡

### E11-1. preview:cloudflare の起動ログと 200 確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web preview:cloudflare > outputs/phase-11/evidence/preview-stdout.log 2>&1 &
PID=$!
sleep 5
curl -s -i http://localhost:8788/ > outputs/phase-11/evidence/preview-curl-full.log
echo "HTTP $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8788/)" \
  > outputs/phase-11/evidence/preview-200.log
kill $PID || true
```

期待: `preview-200.log` に `HTTP 200`。

### E11-2. 生成 CSS の grep（var(--color-*) / oklch( 含有確認）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 \
  > outputs/phase-11/evidence/build.log

# 生成 CSS を集約 grep
find apps/web/.open-next -name "*.css" -exec grep -l "var(--ubm-color-accent)" {} \; \
  > outputs/phase-11/evidence/generated-css-with-bridge.log

find apps/web/.open-next -name "*.css" -exec grep -l "oklch(" {} \; \
  > outputs/phase-11/evidence/generated-css-with-oklch.log
```

期待: 両ログにそれぞれ最低 1 ファイルパス。

### E11-3. HEX 直書き 0 件確認

```bash
bash docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-4/hex-grep-gate.sh apps/web/src \
  > outputs/phase-11/evidence/hex-grep-zero.log 2>&1
echo "exit=$?" >> outputs/phase-11/evidence/hex-grep-zero.log
```

期待: `exit=0` + `HEX 直書き 0 件（OK）` を含む。

### E11-4. utility-probe の content scan 取り込み確認

```bash
grep -c "bg-accent\|text-info\|bg-zone-a" \
  $(find apps/web/.open-next -name "*.css") \
  > outputs/phase-11/evidence/utility-class-emitted.log || true
```

期待: 各 utility class が生成 CSS に出現（class selector としての `.bg-accent` 等）。

### E11-5. ブラウザ表示の補助確認（任意）

`http://localhost:8788/` をブラウザで開き、以下のスクリーンショットを `outputs/phase-11/screenshots/` に保存:

- `01-top-light.png` — light mode 既定表示
- （任意）`02-top-warm.png` — DevTools で `<html data-theme="warm">` を一時付与した状態

> dark mode は placeholder のため見た目の正解はない。**透明化していない**ことだけ確認。

## main.md 構成

```markdown
# Phase 11 Main — task-09 Tailwind v4 setup

## 状態
- visualEvidence: VISUAL_ON_EXECUTION
- 動作確認: LOCAL_PASS_IMPLEMENTED（実装・local preview 証跡取得済み。PR のみ user approval 待ち）

## 採取証跡
- preview-200.log: HTTP 200
- generated-css-with-bridge.log: 1 ファイル（`var(--ubm-color-accent)`）
- generated-css-with-oklch.log: 1 ファイル
- hex-grep-zero.log: exit=0
- utility-class-emitted.log: bg-accent / text-info / bg-zone-a 検出

## 既知の一時影響
- `apps/web/app/styles.css` 撤去により、prototype class 依存ページ（あれば）の見た目が一時的に崩れる。
  task-10 で primitive 化により解消する想定。本 PR の DoD には含めない。
```

## 完了条件

- [ ] E11-1〜E11-4 の証跡がすべて採取されている
- [ ] `outputs/phase-11/main.md` が記述されている
- [ ] preview HTTP 200 を確認
- [ ] 生成 CSS に `.bg-accent` / `var(--ubm-color-accent)` / `oklch(` が含まれる
- [ ] HEX 直書き 0 件確認

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence/preview-200.log`
- `outputs/phase-11/evidence/preview-curl-full.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/evidence/generated-css-with-bridge.log`
- `outputs/phase-11/evidence/generated-css-with-oklch.log`
- `outputs/phase-11/evidence/hex-grep-zero.log`
- `outputs/phase-11/evidence/utility-class-emitted.log`
- （任意）`outputs/phase-11/screenshots/01-top-light.png`
