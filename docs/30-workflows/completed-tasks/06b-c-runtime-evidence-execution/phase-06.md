# Phase 6: screenshot / DOM evidence 検査 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 6 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution） |
| user_approval_required | false |

## 目的

Phase 5 で生成された evidence ファイルが、AC の最低基準（DOM counts = 0 / 解像度 / 件数 / redaction 済）を満たすか検査する。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 5 生成 evidence files、Phase 2 redaction matrix |
| 出力 | `outputs/phase-06/main.md`（検査表）、必要なら `outputs/phase-06/inventory.md` |

## 検査項目 1: DOM dump counts = 0

```bash
for f in docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/dom/*.json; do
  echo "== $f =="
  cat "$f" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('counts'))"
done
```

期待: 各ファイルの `counts` フィールドの全 key（`form`, `input`, `textarea`, `submit`, `editLink`）が `0`。

| Marker × viewport | 期待 counts |
| --- | --- |
| M-09 desktop | form=0, input=0, textarea=0, submit=0, editLink=0 |
| M-09 mobile | form=0, input=0, textarea=0, submit=0, editLink=0 |
| M-10 edit-query-ignored desktop | form=0, input=0, textarea=0, submit=0, editLink=0 |
| M-10 edit-query-ignored mobile | form=0, input=0, textarea=0, submit=0, editLink=0 |

1 つでも 0 でない場合は **invariant 違反**として Phase 7 で `FAIL` に分類し、Phase 12 unassigned-task-detection に follow-up を起票する。

## 検査項目 2: screenshot 件数

```bash
ls docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/
```

期待件数:

| Marker | desktop | mobile | 計 |
| --- | --- | --- | --- |
| M-08 | 1 | 1 | 2 |
| M-10 | 1 | 1 | 2 |
| M-16 | 1（redirect 後 `/login` を撮るので viewport は desktop のみで可） | 0〜1 | 1〜2 |
| 合計 | | | **5 以上** |

5 未満なら Phase 5 を再実行（Phase 10 を参照）。

## 検査項目 3: 解像度 / ファイルサイズ

```bash
for f in docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/*.png; do
  echo "== $f =="
  ls -la "$f" | awk '{print $5}'
  # macOS で解像度確認
  sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null | grep -E "pixelWidth|pixelHeight"
done
```

最低基準:
- desktop screenshot: 幅 ≥ 1280 px / サイズ ≥ 30KB
- mobile screenshot: 幅 ≥ 390 px / サイズ ≥ 15KB
- 完全に真っ白／真っ黒（30KB 未満等）→ FAIL

## 検査項目 4: 目視 redaction チェック

```bash
open docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/*.png
```

各 screenshot で以下が映っていないことを確認:

- email アドレス（Phase 1 で承認したテストアカウントの完全 form を含む）
- Magic Link URL（`?token=...`）
- session cookie 値
- DevTools / Cookie banner の機微情報

漏れている場合は当該 screenshot を `rm` し、Phase 5 を当該 marker のみ再実行する。

## 検査項目 5: ファイル名規則

| 種別 | 命名規則 | 例 |
| --- | --- | --- |
| screenshot | `M-{08|10|16}-{desktop|mobile|redirect}-{YYYYMMDD or ISO}.png` | `M-08-desktop-2026-05-04.png` |
| DOM dump | `M-{09|10}-{no-form|edit-query-ignored}-{desktop|mobile}.json` | `M-09-no-form-desktop.json` |

Playwright `testInfo.attach` 経由で出力される名前に依存するが、最低限「M-XX prefix で marker が判別できる」こと。

## 完了条件チェックリスト

- [ ] DOM dump 4 ファイル全てで `counts` の全 key が 0
- [ ] screenshot 件数 5 以上
- [ ] 各 screenshot の解像度・サイズが基準を満たす
- [ ] 目視 redaction チェック完了（漏洩無し）
- [ ] ファイル名で marker が判別可能
- [ ] 検査結果を `outputs/phase-06/main.md` に表で記録

## 次 Phase への引き渡し

Phase 7 へ検査結果（PASS / FAIL / 解像度・件数・redaction status）を引き渡す。
