# Phase 7: カバレッジ確認

> **[実装区分: 実装仕様書]**。変更ファイル・変更ブロックに対象を限定してカバレッジを計測し、今サイクルの新規実装が十分に網羅されていることを確認する（FB-BEFORE-QUIT-002 / Feedback 5 準拠）。本タスクは UI 小改修（datalist 追加）であり、**全体 X% ではなく `AuditLogPanel` の action FormField 周辺の追加行に限定**して計測・判定する。

---

## 1. 対象ファイル（今サイクルで編集したファイル）

| 区分 | ファイルパス | カバレッジ対象の関心 |
|---|---|---|
| 編集 | `apps/web/src/components/admin/AuditLogPanel.tsx` | action `<Input>` の `list="audit-action-presets"` 属性付与行 + `<datalist id="audit-action-presets">` の 2 `<option>`（`identity.merge` / `identity.dismiss`）追加行 |

> 変更は実質 1 ファイル。`buildAuditHref`（AuditLogPanel.tsx:91-107）・`name="action"`・URL query 契約・自由入力・server component 構成はいずれも無変更のため、これらの既存行はカバレッジ「新規対象」ではない（既存テストで担保済みの非退化対象 = Phase 9 で確認）。

### 対象外（明示）

| ファイルパス | 対象外理由 |
|---|---|
| `apps/web/src/components/admin/AuditLogPanel.tsx` の `buildAuditHref` 等の既存ロジック | 本サイクルで未変更。新規カバレッジ対象は datalist 追加分の行のみ。既存行の網羅は Phase 9 の既存テスト非退化で確認 |
| `apps/web/app/(admin)/admin/audit/page.tsx`（server component） | コード変更なし（SSR で `defaultValue` を渡す既存導線をそのまま利用）。page.spec.ts への追記は「SSR 復元の契約」確認であり実行コードの新規行ではない |
| `apps/web/src/components/ui/Input.tsx` / `FormField`（既存 primitive） | `list` 属性は HTML 標準属性のパススルーで、primitive 側の新規分岐を生まない |

---

## 2. カバレッジ計測対象と目標

本タスクの新規追加行は「JSX マークアップの追加（属性 + datalist option）」であり分岐ロジックを増やさない。したがって **branch coverage の新規増分はほぼ無く、line coverage で追加 JSX 行が render テストで実行されたことを保証する**方針とする。

### 2.1 datalist option 提示（AC-1）の line/branch カバレッジ

| 計測観点 | 目標 | 根拠 |
|---|---|---|
| 追加行（`list` 属性 + `<datalist>` + 2 `<option>`）の line coverage | **100%** | render テスト（component spec）で AuditLogPanel をマウントすれば datalist 要素は無条件にレンダリングされるため、新規行はすべて到達する |
| branch coverage 増分 | N/A（新規分岐なし） | datalist option は条件分岐を含まない静的 JSX。新規 branch を増やさない |

カバレッジ確認対象の到達点:

```
AuditLogPanel render
├── action <Input list="audit-action-presets" ...>   ← 属性追加行（100% 到達）
└── <datalist id="audit-action-presets">              ← 追加要素（100% 到達）
    ├── <option value="identity.merge" />              ← 追加行（100% 到達）
    └── <option value="identity.dismiss" />            ← 追加行（100% 到達）
```

確認テスト（Phase 4 で追加済みを前提）:
- component spec で `id="audit-action-presets"` の datalist が存在すること
- option の `value` に `identity.merge` / `identity.dismiss` が含まれること
- action `<input>` が `list="audit-action-presets"` を持つこと

### 2.2 自由入力維持（AC-3）の分岐

| 計測観点 | 目標 | 根拠 |
|---|---|---|
| action input の自由入力経路 line coverage | 既存維持（退化なし） | datalist は `<input>` の自由入力を阻害しないため、任意文字列入力 → URL query への反映経路は無変更 |

カバレッジ確認対象:

```
action input change（任意文字列、例 "attendance.add"）
└── buildAuditHref → ?action=<入力値>      ← 既存行・退化していないことを確認（新規行ではない）
```

> 自由入力経路は新規行ではないが、datalist 追加で誤って `<select>` 化・値制約化していないことを「任意文字列がそのまま query に乗る」テストで保証する（AC-3）。

### 2.3 SSR defaultValue 復元（AC-2）

| 計測観点 | 目標 | 根拠 |
|---|---|---|
| `defaultValue` 受け渡し経路 | 既存維持（退化なし） | datalist 追加は uncontrolled input の `defaultValue` 契約に影響しない |

カバレッジ確認対象:

```
SSR: page.tsx が searchParams.action を AuditLogPanel に渡す
└── <Input ... defaultValue={action} list="audit-action-presets"> ← defaultValue と list が共存し復元が壊れない
```

> page.page.spec.ts の追記で「`?action=identity.merge` 付き URL でレンダリングすると input 初期値が復元される」ことを確認する。これは新規行ではなく既存契約の非退化確認だが、Phase 7 では「datalist 追加によって SSR 復元行のカバレッジが落ちていない」ことを証跡として残す。

---

## 3. カバレッジ取得コマンド

対象 spec のみを `--coverage.include` で `AuditLogPanel.tsx` に絞って計測する（モノリポ全体ではなく変更ファイル限定）。

```bash
# AuditLogPanel component spec を対象に、AuditLogPanel.tsx のみ coverage include
mise exec -- pnpm exec vitest run \
  --coverage \
  --coverage.include="apps/web/src/components/admin/AuditLogPanel.tsx" \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
```

page.spec の SSR 復元確認を含めて計測する場合:

```bash
mise exec -- pnpm exec vitest run \
  --coverage \
  --coverage.include="apps/web/src/components/admin/AuditLogPanel.tsx" \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/audit/page.page.spec.ts"
```

出力先: `./coverage/` ディレクトリ（web パッケージの vitest coverage 既定値）。HTML レポートは `./coverage/index.html` で AuditLogPanel.tsx の行ハイライトを確認する。

---

## 4. カバレッジ証跡欄

実行後に以下を記入する（datalist 追加行の line coverage = 100% を目標値とする）。

| 計測観点 | 目標 | 実測値 | 判定 |
|---|---|---|---|
| datalist 追加行（`list` 属性 + `<datalist>` + 2 `<option>`）line coverage | 100% | （実行後記入） | — |
| action 自由入力経路（AC-3）の非退化 | 退化なし | （実行後記入） | — |
| SSR `defaultValue` 復元行（AC-2）の非退化 | 退化なし | （実行後記入） | — |
| component spec 全テスト | PASS | （実行後記入） | — |

> **coverage gate ポリシー**: 本 workflow はモノリポ全体の coverage gate（`scripts/coverage-guard.sh`）とは独立し、変更ファイル限定で確認する。全体 gate の閾値変更は行わない（FB-BEFORE-QUIT-002 / Feedback 5: 対象範囲を限定明示する）。

---

## 5. カバレッジ不足時の対応方針

| ケース | 対応 |
|---|---|
| datalist 追加行が render テストで到達していない（< 100%） | component spec が AuditLogPanel を実際にマウントしているか確認。マウント済みなら datalist の `id` / option `value` を assert するケースを追加して確実に走査させる |
| 自由入力経路の line が落ちている | datalist 追加で `<input>` を `<select>` 等へ誤って置換していないか実装を確認（AC-3 退化）。退化していれば実装を `<input list=...>` に戻す |
| SSR 復元行のカバレッジ低下 | `defaultValue` 受け渡しを削っていないか確認。`list` 属性追加は `defaultValue` と共存可能で削除不要 |

---

## 完了条件（Phase 7）

- [ ] datalist 追加行（`list` 属性 + `<datalist>` + 2 `<option>`）の line coverage を §3 のコマンドで実測し、100% を確認している
- [ ] action 自由入力経路（AC-3）が datalist 追加で退化していないことをカバレッジ + テストで確認している
- [ ] SSR `defaultValue` 復元行（AC-2）のカバレッジが低下していないことを確認している
- [ ] §4 の証跡欄に実測値を記録している
- [ ] `AuditLogPanel.component.spec.tsx` の全テストが PASS している
- [ ] 計測対象を変更ファイル（`AuditLogPanel.tsx`）に限定し、全体カバレッジで判定していない（範囲限定明示済み）

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
datalist 追加分の新規行が render テストで完全に走査されていること、および AC-2/AC-3 の既存契約行が退化していないことを変更ファイル限定で確認する。

## 実行タスク
- `AuditLogPanel.tsx` 限定でカバレッジを計測する。
- datalist 追加行 100% と自由入力 / SSR 復元の非退化を証跡化する。

## 参照資料
- `phase-6.md`
- `phase-3.md`（M-1: getByLabelText 非複数マッチ / M-2: YAGNI）

## 成果物
- Phase 7 カバレッジ確認仕様

## 統合テスト連携
Phase 9 の品質ゲートは本 Phase の coverage 結果（datalist 行 100%・非退化）を前提にする。
