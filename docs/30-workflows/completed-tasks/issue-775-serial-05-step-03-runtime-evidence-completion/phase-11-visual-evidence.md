# Phase 11: ビジュアルエビデンス

[実装区分: 実装仕様書]

## 1. Canonical evidence path

**正本は親 workflow に集約する**:

```
docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/
├── evidence/
│   └── playwright.log
├── screenshots/  ← 11 valid PNG + legacy placeholder text
└── manifest.json  ← pass: true / verdict: PASS
```

本 workflow root (`docs/30-workflows/issue-775-.../outputs/phase-11/`) には **README.md のみ** 配置し、正本 path への pointer を記載する（PNG 物理コピーしない）。

## 2. 取得手順サマリ

詳細は Phase 4 §1 参照。

1. Playwright config が `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` を注入し、web dev server を起動する
2. `adminPage` fixture が admin session cookie を注入する
3. `playwright test --config=playwright.admin-schema-diff.config.ts`
4. evidence path に 11 valid PNG + log 出力。legacy placeholder text は PASS inventory から除外
5. manifest.json 更新

## 3. 視覚的整合チェック

- OKLch トークンとの整合（HEX 直書きが render 結果に出ていない目視確認）
- mobile viewport で table が横スクロールせず column が縮退している
- toast が overlay 上に正しく重なり、modal trap focus が機能している
- diff status badge の日本語ラベルが切れていない（`aria-describedby` 紐付け確認）

## 4. README.md (本 workflow root 配置用)

`docs/30-workflows/issue-775-.../outputs/phase-11/README.md`:

```markdown
# Phase 11 Evidence Pointer (Refs #775)

このディレクトリは pointer のみで、実 evidence は親 workflow に集約されています。

## 実 evidence path

- screenshots: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/`
- logs: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/`
- manifest: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/manifest.json`

## なぜ pointer 形式か

親 workflow が既に `completed-tasks/` 配下に存在し、Phase 11 evidence path が定着しているため、
本 issue-775 recovery workflow では evidence を二重管理せず親 workflow の正本 path に追記する。
本 workflow root は **gate / phase 文書のみ** 管理する責務とする。
```
