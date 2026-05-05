# Phase 5: 実装ランブック（最小差分での修復順序）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 名称 | 実装ランブック |
| status | spec_created |
| 入力 | `outputs/phase-2/main.md` / `outputs/phase-4/main.md` |
| 出力 | `outputs/phase-5/main.md` |

## 目的

Phase 2 で確定した修復順序に従い、setup → 共通 mock → 個別 impl の順で 13 件 failure を解消する。各ステップで targeted run を回し RED → GREEN を確認する。

## 実装計画（必須記載）

| カテゴリ | ファイルパス | 操作 | 想定差分行 |
| --- | --- | --- | --- |
| 新規作成 | （該当あれば） | create | |
| 修正 | `apps/api/test/setup.ts`（setup drift がある場合） | edit | +N / -M |
| 修正 | `apps/api/src/repository/__tests__/_mocks/*.ts`（mock contract drift） | edit | +N / -M |
| 修正 | `apps/api/src/routes/admin/*.ts`（impl bug） | edit | +N / -M |
| 修正 | `apps/api/src/jobs/sync-forms-responses.ts` | edit | +N / -M |
| 修正 | `apps/api/src/workflows/*.ts` | edit | +N / -M |
| 修正 | `apps/api/src/middleware/*.ts` | edit | +N / -M |
| 修正 | 該当 `*.test.ts`（test stale） | edit | +N / -M |

> 実際のファイルは Phase 1 / Phase 2 マトリクスから確定する。先回りで全列挙する必要はないが Phase 5 着手時に必ず明記すること。

## 実行タスク

### Step 1: 修復ステージ 1（setup 修正）

```bash
# RED 確認
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 | grep -E "(FAIL|Tests)" | head -30
```

`apps/api/test/setup.ts` 等に修正適用 → 該当 failure 群を targeted run で GREEN 確認。

### Step 2: 修復ステージ 2（共通 mock 修正）

Phase 2 Step 2 で抽出した共通修復パターンを適用。

```bash
# 共通修正後の影響確認（admin 系 routes 全件）
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/admin
```

### Step 3: 修復ステージ 3（個別 impl bug 修正）

残った failure それぞれに対し以下のサイクル:

1. baseline log の assertion / stack を読む
2. impl ファイル修正
3. targeted run で当該 test を GREEN
4. その file 内の他 test に regression が無いことを確認

### Step 4: 修復後 全件 run（Phase 6 で詳細確認するが Phase 5 末で予備確認）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 | tee outputs/phase-5/api-test-stage-end.log
```

期待: failures 0 件、または残存 failure があれば Phase 6 へ持ち越し。

### Step 5: 修復対象の最小性チェック

各修正に対し以下を確認:

- 修正行は failure 解消に直接寄与するか（無関係な refactor を含めない）
- スタイル変更を混ぜない（diff を最小化）
- `it.skip` / `describe.skip` を使っていない
- `@ts-ignore` / `@ts-expect-error` の追加は禁止（既存があり外せない場合のみ Phase 12 で記録）

### Step 6: snapshot 更新（該当時）

snapshot test が含まれる場合:

```bash
# 初回または意図的更新
mise exec -- pnpm --filter @ubm-hyogo/api test -u <target>
# diff 確認
git diff -- apps/api/src/**/__snapshots__/
```

更新理由を `outputs/phase-5/main.md` に明記。

## 完了条件

- [ ] 13 件 failure のうち 0 件 / 13 件が PASS（残存があれば Phase 6 で対応）
- [ ] `outputs/phase-5/api-test-stage-end.log` が保存
- [ ] `outputs/phase-5/main.md` に修復対象ファイル一覧（新規/修正）が記録
- [ ] 修正行が最小性チェックを通過
- [ ] `it.skip` / `describe.skip` が新規追加されていない（`grep -rn "\.skip" apps/api/src` で baseline と差分 0）

## 多角的レビュー観点

- 因果: setup 修復が他 test に意図せぬ side effect を起こしていないか（Phase 6 で全件 run）
- 戦略: 修正行を最小化することで Task D coverage 補強時の merge conflict リスク低減
