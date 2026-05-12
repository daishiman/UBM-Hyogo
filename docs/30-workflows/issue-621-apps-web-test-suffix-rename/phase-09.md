# Phase 9: テスト計画 / rename 妥当性検証 / glob coverage grep / smoke

## 目的

本タスクは「rename + config 同期」のみで新規ロジックを含まないため、**新規 test を追加しない**。代わりに rename と config 同期の妥当性を保証する **検証 step 群を CI 必須化**し、Phase 11 evidence へ機械的に書き出す形を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | completed |

## 1. 方針: 新規テストは追加しない

| 観点 | 判断 |
| --- | --- |
| rename 自体の正しさ | 既存 70 件の test が rename 後も green であることで保証 |
| config 同期の正しさ | 件数 assert (`Test Files X` / `Tests Y`) で保証、`verify-design-tokens` exit 0 で追加保証 |
| 内容差分ゼロ | `git diff --diff-filter=R --numstat HEAD` の全行 `0\t0` で保証 |
| ADR 内容 | レビューで保証（自動 test 不要） |

新規 unit test / fixture / smoke test を追加しない。**追加するとそれ自体が rename PR の diff を増やし、AC-2「rename commit pure diff」を侵食する**。

## 2. CI 必須 検証 step（rename 後に実行する 9 step）

| # | step | コマンド | 合格条件 |
| --- | --- | --- | --- |
| V-1 | apps/web test green + 件数同一 | `mise exec -- pnpm --filter @ubm-hyogo/web test --reporter=verbose` | exit 0 / `Tests Y` 値が rename 前と一致 |
| V-2 | 残存 `*.test.ts(x)` ゼロ | `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print \| wc -l` | `0` |
| V-3 | rename 後 spec 件数 = 87 | `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.spec.ts' -o -name '*.spec.tsx' \) -print \| wc -l` | `87` |
| V-4 | config glob 残存 grep | `rg -n "apps/web.*\.test\." --glob '!**/node_modules/**' --glob '!docs/**'` | apps/web 関連ヒットゼロ |
| V-5 | 内容 diff ゼロ | `git diff --diff-filter=R --numstat <commit-1>~..<commit-1>` | 全行 `0\t0\t...` |
| V-6 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| V-7 | lint | `mise exec -- pnpm lint` | exit 0 |
| V-8 | secret leakage grep | `rg -n "(apikey\|secret\|token\|password)\s*=" apps/web/src --glob '*.spec.ts' --glob '*.spec.tsx'` | 既知 dummy 値以外ゼロ |
| V-9 | verify-design-tokens | `mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens` | exit 0 |

V-1〜V-9 を Phase 11 で順に実行し、出力をすべて `outputs/phase-11/` に保存する。

## 3. smoke vitest（任意）

reporter が rename 後も動作することを軽量確認するため、各分類から 1 ファイル単独で実行:

```bash
# component smoke
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  apps/web/src/components/ui/__tests__/Button.component.spec.tsx

# runtime smoke
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  apps/web/src/__tests__/tokens.runtime.spec.ts

# lib-unit smoke
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  apps/web/src/lib/__tests__/env.spec.ts
```

5 分類すべて pass すれば reporter / vitest config の動作確認が完了。

## 4. jsdom 環境注釈の保持確認

```bash
# rename 後の component spec ファイル先頭 5 行に jsdom 注釈が保持されていること
for f in $(find apps/web -path '*/node_modules' -prune -o -type f -name '*.component.spec.tsx' -print); do
  head -5 "$f" | grep -q "@vitest-environment jsdom" && continue
  # 元ファイルが jsdom を必要としていたか CSV から逆引き
  # 必要だったのに無ければ E-19 として致命
done
```

`git mv` はファイル本文を変更しないため、rename 前から `jsdom` 注釈があれば rename 後も保持される。Phase 11 で確認のみ実施。

## 5. テスト計画チェックリスト

- [ ] V-1〜V-9 すべて PASS
- [ ] smoke vitest 5 分類すべて PASS
- [ ] jsdom 環境注釈が rename 後も保持されている
- [ ] 新規 test ファイルを追加していない（rename PR の diff 純度維持）

## 完了条件チェック

- [ ] 新規 test 追加なし方針が明記されている
- [ ] V-1〜V-9 の検証 step 表が apps/web 固有の verify-design-tokens を含めて記述されている
- [ ] smoke vitest が 5 分類すべてカバーしている
- [ ] jsdom 環境注釈の保持確認手順が定義されている
