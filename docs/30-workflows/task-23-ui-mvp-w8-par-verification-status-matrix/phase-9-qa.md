# Phase 9: 品質保証

## 目的

`VERIFICATION-STATUS.md` の構文・参照リンク・サイズ・mirror parity を一括判定する。

---

## 1. チェック項目

| 項目 | 期待 |
|------|------|
| GFM table 構文 | header / separator / 22 データ行が正しく整列 |
| パイプ列数の一貫性 | 全行で同数（7 列）|
| 文字エンコード | UTF-8 |
| 改行コード | LF |
| 末尾改行 | あり |
| line budget | 500 行以内（matrix table + 凡例 + サマリーで十分収まる）|
| 参照リンク健全性 | matrix 内のリンクがすべて 200 相当（ファイル実在）|
| 88 セル充足率 | 100% |
| WARN/FAIL 理由付与率 | 100% |

---

## 2. 検査コマンド（概念）

```bash
# table 列数の一貫性
awk -F'\\|' '/^\| task-/ { print NF }' \
  docs/30-workflows/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md \
  | sort -u
# => 1 値のみ出力されることを期待

# 末尾改行
tail -c1 docs/30-workflows/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md \
  | xxd | grep -q '0a$' && echo OK || echo NG

# line budget
wc -l docs/30-workflows/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md
# => <= 500
```

---

## 3. mirror parity

`.agents/skills/` mirror への影響なし（本タスクは workflow 内 spec のみ）。

---

## 4. 成果物

- `outputs/phase-9/qa.md`
