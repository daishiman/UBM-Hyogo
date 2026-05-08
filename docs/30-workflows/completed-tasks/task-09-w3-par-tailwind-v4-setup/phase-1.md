# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 名称 | 要件定義 |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| タスク種別 | implementation / VISUAL_ON_EXECUTION |
| visualEvidence | VISUAL_ON_EXECUTION（Phase 11 で `preview:cloudflare` 200 + 生成 CSS grep + HEX 0 件 grep） |
| 実装区分 | 実装仕様書 |

## 目的

`apps/web` に Tailwind v4 build pipeline を確立し、task-08 の OKLch tokens を Tailwind utility に bridge することで、後続 task-10..17 が `bg-accent` / `text-info` / `border-warn` 等を **無設定で使える** 状態を作る。Phase 2 着手前に「真の論点」を 1 文で固定する。

## 真の論点（1 文）

> Tailwind v4 の `@theme inline` を介して `--ubm-*` prefix の OKLch tokens を `--color-*` / `--radius-*` / `--shadow-*` / `--font-*` 名前空間に bridge することで、token の正本（task-08）を変更せずに Tailwind utility を生成し、かつ `[data-theme]` 切替に CSS 単独で追従できる構成を作る。

## 入力

- 元タスク: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-09-w3-par-tailwind-v4-setup.md`
- OKLch palette 出典: `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L80
- task-08 仕様: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-08-design-tokens-doc.md`
- 既存撤去対象: `apps/web/app/styles.css`（400 行）
- Cloudflare Workers ビルド規約: `apps/web/wrangler.toml` / `@opennextjs/cloudflare` PostCSS pipeline

## タスク

### T1-1. OKLch tokens inventory の確定

task-08 が確定する CSS 変数群を本タスクの **入力契約** として固定する。

| カテゴリ | token 数 | 命名規約 |
| --- | --- | --- |
| color: surface | 4 | `--ubm-color-surface-bg` / `-bg-2` / `-panel` / `-panel-2` |
| color: text | 3 | `--ubm-color-text-primary` / `-secondary` / `-muted` |
| color: border | 2 | `--ubm-color-border-default` / `-strong` |
| color: accent | 3 | `--ubm-color-accent` / `-soft` / `-ink` |
| color: status | 8 | `ok` / `warn` / `danger` / `info` × `base` / `-soft` |
| color: zone | 5 | `--ubm-color-zone-a..e` |
| radius | 5 | `--ubm-radius-sm` / `-md` / `-lg` / `-xl` / `-2xl` |
| shadow | 4 | `--ubm-shadow-xs` / `-sm` / `-md` / `-lg` |
| font-family | 5 | `--ubm-font-jp` / `-en` / `-serif` / `-body` / `-mono` |
| font-size | 8 | `--ubm-text-xs` / `-sm` / `-base` / `-md` / `-lg` / `-xl` / `-2xl` / `-3xl` |
| spacing | 10 | `--ubm-space-0` / `-1` / `-2` / `-3` / `-4` / `-6` / `-8` / `-12` / `-16` / `-24` |
| duration | 3 | `--ubm-dur-fast` / `-base` / `-slow` |
| easing | 4 | `--ubm-ease-standard` / `-emphasized` / `-decelerate` / `-accelerate` |

> 09b 正本名を **正** とする。互換短縮名（`--ubm-color-bg` / `--ubm-color-ink` 等）は実装側で新規定義しない。本タスクは値を「決めない」「変えない」、**写すだけ**。

### T1-2. 受入条件 (AC) 確定

index.md §「受入条件 (AC)」の AC-1〜AC-12 を Phase 1 完了時に固定。Phase 4 のテストはこの AC を逆算して RED ケースを書く。

### T1-3. visualEvidence 区分の確定

`artifacts.json.metadata.visualEvidence = VISUAL_ON_EXECUTION` を確定。理由: ビルド成果（`.open-next/worker.js`）の生成と Workers preview 200 を **動作証跡として採取する** ため、純粋な NON_VISUAL では Phase 11 縮約テンプレが不適切。

### T1-4. 不変条件の確定

1. token 値は task-08 を **唯一の正本** とする（本タスクは値を写すだけ）
2. `--ubm-*` prefix を厳守し、Tailwind 既定変数名（`--color-*`）への直接定義禁止
3. HEX 直書きは `apps/web/src/` 配下に **0 件**（fallback 専用 `@supports not` ブロック内のみ例外）
4. `apps/api/**` には触れない
5. dark mode は placeholder のみ（値未定で OK）
6. `apps/web/app/styles.css` は本タスクで撤去、prototype class 移行は task-10
7. `tailwind.config.ts` は `content` glob のみ（v4 CSS-first）

## 完了条件

- [ ] OKLch tokens inventory（T1-1 表）が `outputs/phase-1/tokens-inventory.md` に保存されている
- [ ] AC-1〜AC-12 が index.md と本 phase に明記されている
- [ ] `artifacts.json.metadata.visualEvidence = VISUAL_ON_EXECUTION` が固定されている
- [ ] 不変条件 7 点が本 phase に明記されている
- [ ] Phase 2 への入力契約（task-08 → task-09 の token 名リスト）が確定している

## 成果物

- `outputs/phase-1/main.md` — 要件定義サマリ
- `outputs/phase-1/tokens-inventory.md` — T1-1 の確定表
- `outputs/phase-1/ac-matrix.md` — AC-1〜AC-12 と Phase 4 テスト ID の対応
