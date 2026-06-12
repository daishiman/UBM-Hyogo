---
spec_classification: implementation_spec
state: spec_created
phase: 7
phase_name: カバレッジ確認
task_id: public-member-common-ui-card-unification
---

# Phase 7: カバレッジ確認

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| 対象 | Lane A 新層6+1ファイル（PageShell / PageHeader / SectionCard / ContentCard / Prose / index / ButtonLink） |
| 方針 | カバレッジ対象を**変更ファイルに限定**（全ファイル一律閾値を新規に課さない）[Feedback BEFORE-QUIT-002] |
| 紐づく AC | AC-11（新プリミティブ5種＋ButtonLink に spec が存在し GREEN）/ AC-1 / AC-2 |

---


## 目的

変更ファイル（新層7ファイル）に限定してカバレッジを可視化し、variant/tone/padding/href の branch を実測する。

## カバレッジ対象範囲（変更ファイルに限定）

> 本タスクで**新規追加・改変するファイルのみ**をカバレッジ評価対象とする。既存の `apps/web` 全ファイルへ一律閾値を課すと、本タスク無関係ファイルの未カバレッジで偽 fail する（[Feedback BEFORE-QUIT-002]）。Lane B/C の画面移行（page.tsx / `_components/*`）は既存 component spec の GREEN 維持（AC-7）で担保し、本 Phase の**数値カバレッジ目標は Lane A 新層7ファイルに限定**する。

| # | 対象ファイル | 種別 | カバレッジ評価 |
|---|------------|------|--------------|
| 1 | `apps/web/src/components/ui/layout/PageShell.tsx` | 新規 | line/branch 目標あり |
| 2 | `apps/web/src/components/ui/layout/PageHeader.tsx` | 新規 | line/branch 目標あり |
| 3 | `apps/web/src/components/ui/layout/SectionCard.tsx` | 新規 | line/branch 目標あり |
| 4 | `apps/web/src/components/ui/layout/ContentCard.tsx` | 新規 | line/branch 目標あり |
| 5 | `apps/web/src/components/ui/layout/Prose.tsx` | 新規 | line/branch 目標あり |
| 6 | `apps/web/src/components/ui/layout/index.ts` | 新規 | re-export のみ（line 100%・branch 評価なし） |
| 7 | `apps/web/src/components/ui/ButtonLink.tsx` | 新規 | line/branch 目標あり |

> `apps/web/src/styles/layout-primitives.css`（CSS）はカバレッジ計測対象外（vitest は CSS の分岐を計測しない）。CSS の検証は Phase 9（`verify:tokens` / inline style）と Phase 11（視覚証跡）で担保する。

---

## プリミティブ別 line/branch カバレッジ目標

> branch は **variant / tone / padding の分岐**および **href 有無・title 有無・eyebrow/lead 有無の条件描画**を実測する。「全 variant・全 tone・全 padding の data 属性が正しく出る」「href あり＝`<a>` / href なし＝`<article>`」を網羅する spec を Phase 6 で用意済み（AC-11）。

| ファイル | line 目標 | branch 目標 | branch を構成する分岐（実測対象） |
|---------|----------|------------|--------------------------------|
| `PageShell.tsx` | ≥ 95% | ≥ 90% | `maxWidth`(narrow/default/wide)・`background`(base/subtle/bare)・`gap`(sm/md/lg)・`className` 有無 |
| `PageHeader.tsx` | ≥ 95% | ≥ 90% | `eyebrow` 有無・`lead` 有無・`actions` 有無・`align`(start/center) の条件描画 |
| `SectionCard.tsx` | ≥ 95% | ≥ 90% | `title` 有無（head 描画分岐）・`tone`(default/subtle/accent)・`padding`(sm/md/lg)・`as`(section/article/div)・`id` 透過 |
| `ContentCard.tsx` | ≥ 95% | ≥ 90% | `href` 有無（`<a>` vs `<article>`）・`interactive`・`heading`/`media`/`footer` 有無・`tone`・`padding` |
| `Prose.tsx` | ≥ 95% | ≥ 85% | `size`(default/compact)・`className` 有無 |
| `index.ts` | 100%（re-export） | — | 分岐なし |
| `ButtonLink.tsx` | ≥ 95% | ≥ 90% | `variant`(primary/accent/ghost/soft/danger)・`size`(sm/md/lg)・`block`・`leftIcon`/`rightIcon` 有無・`...rest` 透過 |

> 集約目標: 上記7ファイル合算で **line ≥ 95% / branch ≥ 90%**（index.ts を含む）。1ファイルでも branch 目標を下回る場合は Phase 6 に未網羅分岐の spec ケースを追加して再実行する。

---

## カバレッジ実行コマンド（対象 glob に限定）

```bash
# apps/web vitest を対象ファイル glob に絞ってカバレッジ計測（変更ファイル限定）
mise exec -- pnpm --filter @ubm/web exec vitest run \
  --coverage \
  --coverage.include='src/components/ui/layout/**' \
  --coverage.include='src/components/ui/ButtonLink.tsx' \
  --coverage.reporter=text \
  --coverage.reporter=json-summary \
  src/components/ui/layout src/components/ui/ButtonLink.spec.tsx
```

- `--coverage.include` で**対象ファイルのみ**を母数にし、無関係ファイルの未カバレッジで fail しない（[Feedback BEFORE-QUIT-002]）。
- 実行対象 spec（Phase 6 で作成済み）:
  - `apps/web/src/components/ui/layout/PageShell.spec.tsx`
  - `apps/web/src/components/ui/layout/PageHeader.spec.tsx`
  - `apps/web/src/components/ui/layout/SectionCard.spec.tsx`
  - `apps/web/src/components/ui/layout/ContentCard.spec.tsx`
  - `apps/web/src/components/ui/layout/Prose.spec.tsx`
  - `apps/web/src/components/ui/ButtonLink.spec.tsx`
- `json-summary` reporter の `coverage/coverage-summary.json` を読み、上表の line/branch 目標と突合する。

> 注: 既存の `apps/web` vitest config に global coverage 閾値が設定されている場合でも、本 Phase は上記 `--coverage.include` で母数を絞った targeted run の数値を判定根拠とする（全件 run の global 閾値は AC-10 の GREEN 判定で別途担保）。

---

## concern × dependency edge 可視化表（プリミティブ → 利用画面）

> 各プリミティブが「どの画面から依存されるか」を edge として可視化し、カバレッジ不足が波及する画面を特定する。あるプリミティブの branch が未網羅なら、その下流画面（依存先）全てが影響を受ける。

| プリミティブ（concern） | 依存する画面（dependency edge） | 影響度 |
|----------------------|-------------------------------|--------|
| `PageShell` | `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms`, `/profile`, `/login`（全8画面） | 最大（全画面の背景/枠の正本） |
| `PageHeader` | `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms`, `/profile`（7画面） | 高 |
| `SectionCard` | `/`(Hero/Stats/About/Featured/Timeline/CTA), `/members`(filters), `/members/[id]`(各section), `/register`, `/privacy`, `/terms`, `/profile`(各section), `/login`(auth card) | 最大 |
| `ContentCard` | `/`(Stats×4/About×2/Timeline rows), `/members`(MemberCard 基盤), `/members/[id]`(自己紹介/メッセージ), `/profile`(反映タイミング注記) | 高 |
| `Prose` | `/privacy`, `/terms`（LegalProse 縮退先） | 中 |
| `ButtonLink` | `/`(CTA), `/members/[id]`(戻る/リンク), `/register`, `/profile`(EditCta), `/login`（アンカー型ボタン全て） | 高 |

> 読み方: `PageShell` / `SectionCard` は全画面に波及するため branch 目標未達は最優先で解消する。`Prose` は privacy/terms の2画面のみだが本文タイポの正本のため line ≥ 95% を必須とする。

---

## 実行タスク

1. 上記 `--coverage.include` 限定コマンドで Lane A 新層7ファイルのカバレッジを計測する。
2. `coverage-summary.json` の line/branch を本ファイルの目標表と突合し、未達ファイルを特定する。
3. branch 未達がある場合、未網羅分岐（variant/tone/padding/href 有無等）を Phase 6 の spec に追記して再計測する。
4. concern × dependency edge 表で、未達プリミティブの下流画面影響を Phase 10 へ申し送る。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| Phase 6 | `phase-6-test-additions.md` | 対象 spec ファイルの実体・分岐網羅ケース |
| 設計 | `phase-2-design.md` | props/data 属性（branch を構成する分岐の定義元） |
| 要件 | `phase-1-requirements.md` | AC-11 / カード化マッピング（依存 edge の根拠） |
| vitest config | `apps/web/vitest.config.ts`（または相当） | coverage reporter / include 設定 |

---


## 成果物

- `phase-7-coverage.md`（カバレッジ対象 glob / line・branch 目標表 / プリミティブ→利用画面 依存エッジ表）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] Lane A 新層7ファイルの line/branch が本ファイルの目標を全て満たす（集約 line ≥ 95% / branch ≥ 90%）。
- [ ] カバレッジ母数が `--coverage.include` で変更ファイルに限定され、無関係ファイルの未カバレッジで fail していない。
- [ ] concern × dependency edge 表が確定し、未達プリミティブの下流影響が Phase 10 へ申し送られている。
