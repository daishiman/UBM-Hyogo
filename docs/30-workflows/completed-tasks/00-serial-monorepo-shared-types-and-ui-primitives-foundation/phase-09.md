# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 9 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 8 (DRY 化) |
| 下流 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

無料枠見積もり、secret hygiene、a11y、型安全 / lint / test の最終確認を行う。Wave 0 はランタイム資源を消費しないため無料枠は「将来枠」として記録するに留め、secret hygiene と a11y を中心に確認する。

## 実行タスク

1. 無料枠見積もり（このタスクは 0 消費、後続 Wave で実体化）
2. secret hygiene チェックリスト（このタスクで導入される secret = 0 を確認）
3. a11y 最低基準チェック（primitives 15 種 × 16-component-library.md の a11y 表）
4. 型安全 / lint / test の最終 sanity
5. outputs/phase-09/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | a11y 最低基準 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠定義 |
| 必須 | CLAUDE.md | secret 管理ポリシー |

## 実行手順

### ステップ 1: 無料枠見積もり
- D1: 0 reads / 0 writes（このタスクで未使用）
- Workers: 0 req（healthz は manual smoke でのみ叩く想定）
- Pages: 0 build（CI は別タスク）
- 後続 Wave で順次見積もり

### ステップ 2: secret hygiene
- このタスクで導入する secret: 0 件
- `.env` を生成しないことを確認
- `wrangler.toml` に secret 値を直書きしない placeholder

### ステップ 3: a11y チェック
- 16-component-library.md の a11y 表 6 行を primitive smoke test 設計に反映済みか確認

### ステップ 4: 最終 sanity
- typecheck / lint / test / scaffold-smoke の 4 軸で全 PASS

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO の根拠 |
| Phase 11 | manual smoke の実行リスト |

## 多角的チェック観点（不変条件参照）

- **#1**: 型 4 層 export を全パッケージで typecheck pass
- **#5**: ESLint RuleTester で blocker rule 動作確認
- **#6**: primitive smoke で localStorage 呼び出しゼロ
- **#8**: Avatar 決定論性確認
- **#10（無料枠）**: 0 消費確認
- **a11y**: Drawer/Modal/Switch/Field/Input/Textarea/Select/Avatar/LinkPills の role / aria-* 確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積もり | 9 | pending | このタスク 0 件 |
| 2 | secret hygiene | 9 | pending | secret 0 件 |
| 3 | a11y チェック | 9 | pending | 6 項目 |
| 4 | 最終 sanity | 9 | pending | 4 軸 PASS |
| 5 | outputs 作成 | 9 | pending | outputs/phase-09/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質保証レポート |
| メタ | artifacts.json | Phase 9 を completed |

## 完了条件

- [ ] 無料枠見積もり表に 0 消費が記録
- [ ] secret hygiene チェックリストが 0 件で確定
- [ ] a11y 6 項目すべてが primitive smoke に紐付き
- [ ] typecheck / lint / test / scaffold-smoke の 4 軸が全 PASS

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs/phase-09/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 10（最終レビュー）
- 引き継ぎ事項: 4 軸 PASS の根拠 → GO 判定
- ブロック条件: いずれかの軸が NG

## 無料枠見積もり

| サービス | 上限/日 | このタスク消費 | 余裕 |
| --- | --- | --- | --- |
| D1 reads | 500,000 | 0 | 100% |
| D1 writes | 100,000 | 0 | 100% |
| D1 storage | 5 GB | 0 | 100% |
| Workers req | 100,000 | 0（manual smoke のみ） | ≈100% |
| Pages build | 制限なし（無料枠内） | 0 | 100% |

後続 Wave 1〜9 で順次見積もりを更新する。

## Secret Hygiene チェックリスト

| 項目 | 結果 |
| --- | --- |
| このタスクで導入する Cloudflare Secret | 0 件 |
| このタスクで導入する GitHub Secret | 0 件 |
| `.env` を生成しているか | NO |
| `wrangler.toml` に secret 値を直書きしているか | NO（database_id は placeholder） |
| `next.config.js` に API key を埋め込んでいるか | NO |

## a11y チェック（16-component-library.md 完全準拠）

| 項目 | 対応 primitive | smoke test |
| --- | --- | --- |
| Drawer / Modal: `dialog` role + `aria-labelledby` + focus trap | Drawer, Modal | `role="dialog"` 出現確認、Escape close |
| Button: `aria-busy`（loading） | Button | `loading=true` で `aria-busy="true"` |
| Switch: `role="switch"` + `aria-checked` | Switch | role / aria-checked 確認 |
| Field / Input: `id` ↔ `htmlFor` + `aria-describedby` | Field, Input, Textarea, Select | DOM relation 確認 |
| Avatar 画像なし: `aria-label` 氏名 | Avatar | `aria-label={name}` |
| LinkPills: アイコンのみは `aria-label` で URL 先 | LinkPills | `aria-label` 出現 |

## 最終 Sanity（4 軸）

| 軸 | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `pnpm -w typecheck` | exit 0 |
| lint | `pnpm -w lint && pnpm --filter @ubm/eslint-config test` | exit 0 |
| test | `pnpm -w test` | exit 0 |
| scaffold-smoke | `curl localhost:8787/healthz`、`import * from '@ubm/web/components/ui'` | 200 + 15 keys |
