[実装区分: 実装仕様書]

# Phase 7: カバレッジ確認

## 目的

51 baseline 全件存在チェック、route カバレッジ、viewport カバレッジを script で証跡化する。

---

## 入力

- `outputs/phase-5/implementation-notes.md`
- `outputs/phase-6/test-additions.md`
- 生成済み baseline ディレクトリ

---

## 1. 51 baseline 全件存在チェック

```bash
# ファイル数チェック
COUNT=$(ls -1 apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png 2>/dev/null | wc -l | tr -d ' ')
echo "baseline count: ${COUNT}"
test "${COUNT}" = "51" || { echo "FAIL: expected 51, got ${COUNT}"; exit 1; }
echo "PASS: 51 baselines exist"
```

期待値: `51`

---

## 2. viewport ごとの内訳

```bash
for vp in desktop tablet mobile; do
  c=$(ls -1 apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*-${vp}-*.png 2>/dev/null | wc -l | tr -d ' ')
  echo "${vp}: ${c}"
  test "${c}" = "17" || { echo "FAIL"; exit 1; }
done
```

期待値: 各 17 ファイル。

---

## 3. route ごとの内訳（17 routes × 3 viewport ペアリング）

```bash
# visual-routes.ts から slug 一覧を抽出
SLUGS=$(grep -oE "slug: '[a-z0-9-]+'" apps/web/playwright/fixtures/visual-routes.ts | sed -E "s/slug: '([^']+)'/\1/")
echo "${SLUGS}" | while read slug; do
  for vp in desktop tablet mobile; do
    f="apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/${slug}-${vp}-visual-full-chromium-linux.png"
    test -f "${f}" || { echo "MISSING: ${f}"; exit 1; }
  done
done
echo "PASS: all 17 × 3 = 51 baselines mapped"
```

---

## 4. CI gate への組み込み（オプション）

`.github/workflows/playwright-visual-full.yml` に追加 step:

```yaml
- name: Assert 51 baselines exist
  run: |
    COUNT=$(ls -1 apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png | wc -l | tr -d ' ')
    test "${COUNT}" = "51"
```

baseline 未取得状態でも fail することで、baseline tracking 漏れを検出。

---

## 5. DoD

1. §1 / §2 / §3 の 3 script が PASS
2. CI gate（§4）が `playwright-visual-full.yml` に組み込まれている
3. baseline ファイル名パターンが `{slug}-{viewport}-visual-full-chromium-linux.png` で統一

---

## 6. 成果物

- `outputs/phase-7/coverage.md`
