# Phase 7: テストカバレッジ確認

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- 前提: Phase 4（テスト計画）/ Phase 5（実装手順）/ Phase 6（テスト拡充・collapsed/expanded class assertion）
- workflow_state: `implemented_local_evidence_captured`（実装・focused vitest・local screenshot 取得済み。カバレッジ詳細は focused test と Phase 11 evidence で確認）
- 本 Phase の責務: 本タスクで **変更した shell コンポーネント（`SidebarNavItem` / `SidebarUserMenu` / `SidebarBrand` / `SidebarShell`）のみ** に対象を限定し、変更行（collapsed className 分岐）の line/branch カバレッジを focused test で担保する方針を定義する

## 目的

`coverage-standards.md`（正本）の **workspace 一律 80%**（lines / branches / functions / statements ≥ 80%、推奨 90%）に対し、本タスクで **変更したコードのみ** が満たすことをlocal 実行で確認する。
プロジェクト全体閾値は既存負債の影響を受けるため、`coverage-standards.md` §「個別ファイルカバレッジ計測」に従い、変更ファイルを `--coverage.include` で **絞り込んで個別計測** する。

> **対象範囲の明示限定**（[Feedback BEFORE-QUIT-002] / [Feedback 5]）: 本タスクの計測対象は **変更した shell コンポーネント 4 ファイルのみ**。`apps/web/src/components/shell/` 配下の他コンポーネント（`SidebarUserAvatar` / `SidebarTooltip` / `SidebarNav` など）や、CSS 正本（`globals.css` / `tokens.css`）はカバレッジ対象に含めない（前者は無変更、後者は jsdom 非カバレッジ）。スコープ外ファイルの全体閾値割れを本タスクの責務に含めない。

## 実行タスク

### 1. カバレッジ目標（coverage-standards.md 整合）

| 指標 | 最低基準 | 推奨基準 | 本タスク対象 |
| --- | --- | --- | --- |
| Line Coverage | 80% | 90% | 変更した shell コンポーネント 4 ファイル |
| Branch Coverage | 80% | 90% | 同上（特に collapsed=true / collapsed=false 両分岐） |
| Function Coverage | 80% | 90% | 同上 |
| Statement Coverage | 80% | 90% | 同上 |

> 本タスクは UI レイアウト編集タスクであり実装テストが発生する（pure-docs ではない）ため「coverage AC 適用外」には該当しない。閾値（80%）は `index.md` メタ情報および本 Phase 完了条件に記載する（coverage-standards.md §「全タスク必須 AC」）。

### 2. カバレッジ対象ファイルと評価方針（変更 4 ファイルに限定）

| ファイル | カバレッジ評価 | 評価方針 |
| --- | --- | --- |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | 計測対象（80%+） | L30 `itemClassName` の `${collapsed ? ...}` 三項分岐。collapsed=true / collapsed=false の **両分岐** を focused spec で通す。active（`data-[active=true]`）分岐も collapsed と組合せて通す |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | 計測対象（80%+） | L54 `summary` の collapsed 三項分岐。collapsed=true（avatar 40px 枠中央）/ collapsed=false（gap-2）の両分岐 + popover open/close 分岐を網羅 |
| `apps/web/src/components/shell/SidebarBrand.tsx` | 計測対象（80%+） | **新設 collapsed 分岐**（L16/L24）。collapsed=true（`px-0 justify-center`）/ collapsed=false（`gap-2 px-3`）+ text span の sr-only 分岐の両方を新規/更新 spec で網羅 |
| `apps/web/src/components/shell/SidebarShell.tsx` | 計測対象（80%+） | L32 `AdminPublicReturn` の collapsed 三項分岐。collapsed=true / collapsed=false の両分岐。なお `SidebarShell` 全体（aside / footer / drawer）は本タスクで変更しない部分が多く、focused 計測の主対象は AdminPublicReturn の変更行 |

> CSS 正本（`globals.css` / `tokens.css`）は **カバレッジ対象外**。CSS は jsdom で実行されずカバレッジに現れない（`vitest.config.ts` の `include` は `apps/**/src/**/*.{ts,tsx}` で `.css` 非含有）。collapsed レイアウトの「見え方」（はみ出し解消・中央軸一致）は Phase 11 staging 視覚確認（user-gated）で担保する。jsdom 単体では DOM 上の className（`px-0` / `w-full` / `justify-center`）の存在を assert するに留まる。
>
> `SidebarUserAvatar.tsx`（無変更・36px の現行サイズ参照のみ）・`SidebarNav.tsx`（原則無変更、§D-5）は本タスクで分岐ロジックを増やさないため focused 計測の主対象に含めない。

### 3. vitest coverage 設定方針（既存設定の確認）

ルート `vitest.config.ts` の `test.coverage` を既定とし **変更しない**:

| 設定 | 想定値 | 意味 |
| --- | --- | --- |
| `provider` | `v8` | V8 カバレッジ |
| `reporter` | `["text", "json-summary", ...]` | text で即時確認・json-summary で機械集計 |
| `include` | `apps/**/src/**/*.{ts,tsx}` ほか | `.css` は非含有（CSS 非計測） |
| `exclude` | `**/*.spec.{ts,tsx}` ほか | spec 除外 |

> 本タスクで `vitest.config.ts` は変更しない。閾値判定は `scripts/coverage-guard.sh` が package 単位で 80% を強制する（`coverage-standards.md` §「workspace 一律 80% 強制経路」）。
> vitest config の root は **repo ルート**。targeted run は対象パスを指定し `--root=.` を付ける（`--root` 省略で No test files になる罠。`_shared-context.md` §8 と一致）。

### 4. 個別ファイルカバレッジ計測コマンド（実行済み）

変更した shell コンポーネント 4 ファイルに `--coverage.include` で絞って個別計測する（`coverage-standards.md` §「個別ファイルカバレッジ計測」）。

```bash
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/src/components/shell/SidebarNavItem.tsx' \
  --coverage.include='apps/web/src/components/shell/SidebarUserMenu.tsx' \
  --coverage.include='apps/web/src/components/shell/SidebarBrand.tsx' \
  --coverage.include='apps/web/src/components/shell/SidebarShell.tsx' \
  apps/web/src/components/shell/__tests__
```

text reporter の出力で対象 4 ファイルの `% Stmts` / `% Branch` / `% Funcs` / `% Lines` が **80% 以上**であることを確認する。

### 5. collapsed=true / collapsed=false 両分岐の必達

変更行はすべて `${collapsed ? "..." : "..."}` 三項分岐であり、**branch カバレッジは collapsed の 2 値を必ず両方通すことで担保する**。

| コンポーネント | collapsed=true 側で通す経路 | collapsed=false 側で通す経路 |
| --- | --- | --- |
| `SidebarNavItem` | `px-0 w-full justify-center` + icon 40px 枠中央 が描画される | `gap-3 px-3 py-2` の expanded 配置が描画される |
| `SidebarUserMenu` | `px-0 w-full justify-center` + avatar 40px 枠中央 が描画される | `gap-2 px-3 py-2` + displayName/role 表示が描画される |
| `SidebarBrand` | 新設分岐 `px-0 justify-center` + mark 40px 枠中央、text span は sr-only | `gap-2 px-3 py-2` + brand text が表示される |
| `SidebarShell`（AdminPublicReturn） | `px-0 w-full justify-center` が描画される | `gap-3 px-3 py-2` が描画される |

> collapsed は **external prop**（`SidebarShell` から各子へ伝播。internal state ではない。Phase 3 [VSCPKR-03] 対策）であるため、テストは「`collapsed` prop を `true` / `false` で 2 回 render して className を assert」する形を取る。これにより両分岐を確実に通す。

### 6. テスト数の実測記録（coverage-standards.md §テスト数記載基準）

実装サイクル実行時に実測値を取得する（推定値禁止）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  --reporter=verbose \
  apps/web/src/components/shell/__tests__
```

> 想定 spec 構成（`_shared-context.md` §5）: `SidebarNavItem.spec.tsx`（既存 + collapsed class assertion 追加）/ `SidebarUserMenu.spec.tsx`（既存 + collapsed class assertion 追加）/ `SidebarShell.spec.tsx`（既存 + collapsed レイアウト contract 追加）/ `SidebarShell.spec.tsx`（新規。既存が無ければ新設）。**実数は実行時の verbose 出力で確定する**。

## 実測値の扱い

focused vitest と local screenshot は取得済み。カバレッジ詳細コマンドは必要時に再実行できるよう §4/§6 に保持し、staging visual baseline のみ Phase 13 user-gated として分離する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| カバレッジ基準（正本） | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 閾値・個別計測・テスト数記載基準 |
| vitest 設定 | `vitest.config.ts`（ルート） | coverage provider / include / exclude |
| coverage guard | `scripts/coverage-guard.sh` | package 単位 80% 強制 |
| 共有設計 | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/_shared-context.md` | §5 変更ファイル・§8 検証コマンド |
| 変更対象 | `apps/web/src/components/shell/{SidebarNavItem,SidebarUserMenu,SidebarBrand,SidebarShell}.tsx` | カバレッジ計測対象 4 ファイル |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/` 内 design tokens / UI 仕様 | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | shell ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 7 仕様書 | 文書 | 計測対象 4 ファイル限定・両分岐担保方針・計測コマンド・CSS 非カバレッジ方針 |
| 個別カバレッジ計測結果 | runtime（取得済み） | 対象 4 ファイルの Stmts/Branch/Funcs/Lines（≥80%）を Phase 11 記録に転記 |
| テスト数実測値 | runtime（取得済み） | `--reporter=verbose` の実行結果・コマンド・日時 |

## 統合テスト連携

- Phase 6 の collapsed/expanded class assertion が Green の状態で本 Phase の個別計測を実施し、不足 branch があれば Phase 6 へ戻して補完する。
- Phase 9 QA でテスト数実測値と focused vitest PASS を AC-9 判定根拠に用いる。
- Phase 11（user-gated）で CSS（jsdom 非カバレッジ）の実描画（collapsed はみ出し解消・中央軸一致）を staging 実機で視覚確認し、カバレッジで担保できない領域を補完する。

## 完了条件

1. 計測対象が **変更した shell コンポーネント 4 ファイルのみ** に限定されている（他コンポーネント / CSS を含めない）。
2. 各ファイルの個別カバレッジが Line/Branch/Function/Statement とも **80% 以上**（推奨 90%）であることをlocal 実行で確認する手順が定義されている。
3. collapsed=true / collapsed=false の **両分岐を必ず通す** ことが branch カバレッジ担保方針として明記されている。
4. CSS（globals.css / tokens.css）は jsdom 非カバレッジであり、collapsed の見え方を Phase 11 視覚で担保する旨が明記されている。
5. local evidence は取得済みであり、staging visual baseline のみ user-gated として分離されている。
6. カバレッジ閾値（80%）が `index.md` メタ情報および本 Phase 完了条件に記載されている。
