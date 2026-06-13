---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 7
phase_name: カバレッジ
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 7: カバレッジ確認

## メタ情報

| キー | 値 |
|------|----|
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 対象 | 変更 2 実装ファイル（`AdminAccessNotice.tsx` 新規 / `page.tsx` 編集）に限定した focused coverage |
| 方針 | カバレッジ対象を**変更ファイルに限定**（`apps/web` 全体へ一律閾値を新規に課さない）[Feedback BEFORE-QUIT-002] |
| 紐づく AC | AC-1 / AC-3（page.tsx 条件分岐 true/false 両カバー）・AC-9（focused Vitest 全 GREEN の裏付け） |
| wave 前提 | **implemented_local_evidence_captured（実装・local test 完了。staging/PR は user-gated）**。計測の実行は実装サイクルで行う |

---

## 目的

変更 2 実装ファイルに限定してカバレッジを可視化し、新規分岐（`me.user.isAdmin` の true/false）が両側実測されていることを機械確認する。

## カバレッジ対象範囲（変更ファイルに限定）

> 本タスクで**新規追加・改変する実装ファイルのみ**をカバレッジ評価対象とする。既存の `apps/web` 全ファイルへ一律閾値を課すと、本タスク無関係ファイルの未カバレッジで偽 fail する（[Feedback BEFORE-QUIT-002]）。spec ファイル自体（`*.spec.tsx`）は計測母数に含めない。

| # | 対象ファイル | 種別 | カバレッジ評価 |
|---|------------|------|--------------|
| 1 | `apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx` | 新規 | **line 100% 期待**。props なし・条件分岐なしの静的 server component のため、T-C1〜T-C3（+ T-P1 経由の mount）の render で全行が実行される。branch は分岐 0 のため評価対象分岐なし（カバレッジレポート上 100% または N/A） |
| 2 | `apps/web/app/(member)/profile/page.tsx` | 編集 | **追加分岐の branch 両側 100%**: `{me.user.isAdmin ? <AdminAccessNotice /> : null}` の true 側 = T-P1 / false 側 = T-P2 で両カバー。ファイル全体の line/branch は既存テスト（degrade 404/410/5xx/transport・401 redirect・notFound）との合算で実測し、**本変更前の水準から低下させない**（既存未カバー行への新規閾値は課さない） |

> `AdminAccessNotice.component.spec.tsx` / `page.spec.tsx`（テストコード）と CSS / トークンは計測対象外。CSS 差分はそもそもゼロ（AC-7・Phase 2 CSS 設計）。

## ファイル別 line/branch 目標

| ファイル | line 目標 | branch 目標 | branch を構成する分岐（実測対象） |
|---------|----------|------------|--------------------------------|
| `AdminAccessNotice.tsx` | **100%** | —（分岐なし） | なし（入力なし・条件描画なし・静的 JSX のみ。100% 未満なら spec の import/render 漏れを疑う） |
| `page.tsx` | 既存水準以上（実測値を記録） | **新規分岐 `me.user.isAdmin` の true/false 両側カバー必須** | `isAdmin` 条件描画（T-P1/T-P2）に加え、既存分岐 = `meResult.ok` 真偽 / `AuthRequiredError` rethrow / `profileResult` 404・非404 / `statsResult.ok` 真偽（既存テスト + T-P1〜T-P3 で実測） |

> 判定の主眼は「**新規に増やした分岐が両側実測されている**こと」。`page.tsx` の既存行（degrade 文言組み立て等）は既存テストの守備範囲であり、本タスクで新たな数値閾値を課さない（変更ファイル限定方針の中でも、評価対象は**本タスクが追加した差分**に焦点を置く）。

## カバレッジ実行コマンド（対象 include に限定）

```bash
# /profile 配下の focused Vitest を対象 2 ファイルの include に絞ってカバレッジ計測
mise exec -- pnpm vitest run --config vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/app/(member)/profile/page.tsx' \
  --coverage.include='apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx' \
  --coverage.reporter=text \
  --coverage.reporter=json-summary \
  "apps/web/app/(member)/profile"
```

- `--coverage.include` で**変更 2 ファイルのみ**を母数にし、無関係ファイルの未カバレッジで fail しない（[Feedback BEFORE-QUIT-002]）。
- focused run はルートの `vitest.config.ts` を使い、spec パスを**リポジトリルートからのフルパス**で指定する（package dir 相対 filter は include glob 非マッチ・既知教訓）。
- 実行対象 spec（Phase 6 で作成済みのもの + 既存）:
  - `apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx`（T-C1〜T-C3）
  - `apps/web/app/(member)/profile/page.spec.tsx`（既存全件 + T-P1〜T-P3）
  - `/profile` 配下の既存 `_components` spec 群（回帰）
- `json-summary` reporter の `coverage/coverage-summary.json` を読み、上表の目標と突合する。

### 閾値運用

| 項目 | 運用 |
|------|------|
| 判定根拠 | 上記 `--coverage.include` で母数を絞った **targeted run の数値**（global 閾値を本タスクで新設・変更しない） |
| `AdminAccessNotice.tsx` line < 100% | spec の render 漏れ（T-C1〜T-C3 の it 単位欠落）として Phase 6 へ差し戻し |
| `page.tsx` 新規分岐の片側未カバー | T-P1（true）/ T-P2（false）のいずれかが skip / 未到達。mock fixture の resolve 順（`/me` → `/me/profile`）を確認して再実行 |
| 既存 vitest config に global coverage 閾値がある場合 | targeted run の数値を本 Phase の判定根拠とし、全件 run の global 閾値は AC-9（focused Vitest GREEN）側で別途担保 |

## concern × dependency edge 可視化表（変更ファイル → 利用画面）

| concern（変更ファイル） | dependency edge（依存元 → 依存先） | 影響半径 |
|------------------------|-----------------------------------|---------|
| `AdminAccessNotice.tsx` | `page.tsx`（`/profile` 成功描画・isAdmin=true 時のみ）→ `SectionCard` / `ButtonLink`（既存 primitives・本タスク非接触） | `/profile` 1 route のみ。逆依存・循環なし（Phase 3 俯瞰図） |
| `page.tsx` 条件描画 | `/profile` route 本体。degrade 分岐・他 route・shell / middleware / api への edge なし | 条件描画の false 側は DOM 出力ゼロ（member 描画不変・AC-3） |

> 読み方: カバレッジ未達が出ても波及先は `/profile` 1 route に閉じる。`SectionCard` / `ButtonLink` の branch は landed 済み既存 spec が保有しており、本 Phase の母数に含めない（include 2 ファイル限定の根拠）。

## 実行タスク（local 実装サイクルで実施済み）

1. Phase 5/6 の実装完了後、上記 `--coverage.include` 限定コマンドでカバレッジを計測する。
2. `coverage-summary.json` の line/branch を目標表と突合する（`AdminAccessNotice.tsx` line 100% / `page.tsx` 新規分岐両側カバー）。
3. 未達がある場合は閾値運用表に従い Phase 6 の spec を補強して再計測する（実装側は変えない）。
4. 実測値を記録し、Phase 9 QA → Phase 10 の AC 充足突合へ申し送る。

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| テスト追加 | `phase-6-test-additions.md` | 計測を駆動する spec の実体（T-C1〜T-C3 / T-P1〜T-P3） |
| 実装 | `phase-5-implementation.md` §1-3 | 計測対象 2 ファイルと新規分岐の定義元 |
| 設計 | `phase-2-design.md` §D-1/D-2 | 「分岐なし静的」「条件描画 1 箇所のみ」の設計根拠 |
| テスト計画 | `phase-4-test-plan.md` §3 | AC↔テスト対応（AC-1↔T-P1 / AC-3↔T-P2）のトレース元 |
| vitest config | `vitest.config.ts`（リポジトリルート） | focused run の `--config` 指定先 / coverage reporter 設定 |

## 成果物

- `phase-7-coverage.md`（カバレッジ対象 2 ファイル限定の include / line・branch 目標表 / 閾値運用 / concern × dependency edge 表）

## 統合テスト連携

本タスクは apps/web 表現層への極小追加であり、統合観点の検証は focused Vitest（`/profile` 配下）と Phase 11 の視覚証跡計画で行う。apps/api との統合 contract は変更しない（AC-8・Phase 9 V-5 で機械保証）。本 Phase のカバレッジ実測は Phase 9 QA の V-3 判定と Phase 10 の AC 充足突合へ連結する（AC trace: Phase 1 → 4 → 6 → 7 → 9/10 → 11）。

## 完了条件

- [x] カバレッジ母数が `--coverage.include` で変更 2 実装ファイルに限定されている（無関係ファイルで偽 fail しない設計）。
- [x] `AdminAccessNotice.tsx` の line 100% 期待（分岐なし静的）と根拠が明記されている。
- [x] `page.tsx` の新規分岐 true/false 両側カバー（T-P1/T-P2）が判定基準として確定している。
- [x] カバレッジ確認コマンドと閾値運用・未達時の差し戻し先（Phase 6）が確定している。
- [ ] （実装サイクル）実測値が目標を満たし、Phase 9/10 へ申し送られている。
