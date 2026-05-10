# Phase 7: 整合性検証 / apps/api ADR 対比 / vitest / lefthook / CI / coverage 閾値

## 目的

Issue #325 で導入した apps/api 側 suffix 規約と本タスクの apps/web rename 結果の **構造的整合** を確認し、`apps/web/package.json` / root `vitest.config.ts` / `lefthook.yml` / `.github/workflows/*.yml` / coverage 設定が新 suffix に追従しているかを grep / diff ベースで検証する。secret leakage / hook bypass / coverage 閾値の不変条件もここで再点検する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | completed |

## 1. apps/api ADR との整合性確認

apps/api 側 ADR（`docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md`）と apps/web 用 ADR が **構造的に互換** であることを確認する。

### 1.1 共通する構造原則（両 ADR で守る）

| 原則 | apps/api | apps/web |
| --- | --- | --- |
| 末尾 suffix `.spec.{ts,tsx}` 統一 | ○ | ○ |
| 中間修飾子で種別を表現 | `.contract` / `.authz` / `.repository` | `.component` / `.route` / `.page` / `.runtime` |
| デフォルト分類は中間修飾子なし | unit | lib-unit |
| 1 ファイル 1 分類 | ○ | ○ |
| `git mv` のみで rename | ○ | ○ |

### 1.2 apps/web 側の差分理由

| 差分 | 理由 |
| --- | --- |
| 分類数（4 vs 5） | UI 層は authz / repository を持たない。component / route / page / runtime / lib-unit で UI 層を網羅 |
| `.tsx` 拡張子の扱い | apps/web のみ React JSX を含む。`.tsx` 保持必須 |
| action / hook 専用分類なし | 現状 70 ファイルに該当独立 test なし。将来採用は ADR 改訂で対応 |

### 1.3 grep 確認

```bash
# apps/api ADR が存在し参照可能であること
test -f docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md

# apps/web ADR が apps/api ADR を参照していること
rg -n "issue-325-test-suffix-rename-migration" \
  docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-12/test-file-suffix-adr-apps-web.md
# 期待: 1 件以上ヒット（対比表で参照される）
```

## 2. vitest config 整合

### 2.1 root `vitest.config.ts`

| 項目 | rename 前 | rename 後 | 整合判定 |
| --- | --- | --- | --- |
| `test.include` | `apps/**/src/**/*.{test,spec}.{ts,tsx}` 等で両許容 | 同上（変更なし） | apps/web の test 70 件すべてが新 include で拾えること |
| `coverage.exclude` | `**/*.test.{ts,tsx}` + `**/*.spec.{ts,tsx}` | 同上 | rename 後も exclude が機能 |
| `coverage.include` | `apps/**/src/**/*.{ts,tsx}` | 同上 | 変更なし |
| `testTimeout` / `hookTimeout` | 既存値 | 既存値 | 変更なし |

> 案 B（過渡期両許容）採用のため `vitest.config.ts` 自体は変更しない。followup-003 で `*.spec` 単独へ収斂する。

### 2.2 `apps/web/vitest.config.ts` の有無

`find apps/web -name 'vitest.config.*'` で確認。存在しなければ root config が一括適用される。存在する場合は §2.1 と同等の確認を行う。

### 2.3 確認コマンド

```bash
rg -n "test\.(include|exclude)|coverage\.(include|exclude)" vitest.config.ts
# 出力に *.{test,spec}.{ts,tsx} 系の glob 行が含まれること
```

## 3. apps/web/package.json 整合

### 3.1 `verify-design-tokens` script

| 項目 | rename 前 | rename 後 |
| --- | --- | --- |
| script 内容 | `vitest run ... apps/web/src/__tests__/tokens.test.ts` | `vitest run ... apps/web/src/__tests__/tokens.runtime.spec.ts` |
| 確認コマンド | `rg -n "tokens\.test\.ts" apps/web/package.json` ヒット 1 | `rg -n "tokens\.runtime\.spec\.ts" apps/web/package.json` ヒット 1 |

### 3.2 その他 script

```bash
rg -n "(test|spec)\.ts" apps/web/package.json
# 期待: verify-design-tokens 1 行のみ（test / dev / build / lint script は glob を vitest config 経由）
```

## 4. lefthook.yml 整合

```bash
rg -n "\.test\.|\.spec\." lefthook.yml
# 期待: 0 件（直接参照なし）
```

事前調査結果と一致することを確認。0 件であれば変更不要。

## 5. .github/workflows 整合

### 5.1 全 workflow ファイルの test/spec 出現

```bash
rg -n "apps/web.*\.test\." .github/workflows/
# 期待: コメント以外ヒット 0 件
```

### 5.2 ci.yml:159 周辺コメント

| 項目 | rename 前 | rename 後 |
| --- | --- | --- |
| job 名 / コメント | `build-output.test.ts` 言及 | `build-output.runtime.spec.ts` 言及 |
| 確認コマンド | `rg -n "build-output\." .github/workflows/ci.yml` |

軽微なコメント追従だが本タスクの commit 2 で同期する。

## 6. coverage 閾値整合

| 項目 | rename 前後 | 確認 |
| --- | --- | --- |
| `vitest.config.ts` の `coverage.thresholds` | 変更なし | rename commit はrename commit pureのため line/branch/func/stmt の値が動かない |
| `scripts/coverage-guard.sh` の閾値 | 変更なし | hook 側修正は本タスク責務外 |

rename 後に coverage 数値が変動した場合は Phase 8 E-7（致命）として扱う。

## 7. secret leakage / hook bypass 不変条件

### 7.1 secret leakage

```bash
rg -n "(apikey|secret|token|password)\s*=" apps/web/src --glob '*.spec.ts' --glob '*.spec.tsx'
# 既知 dummy 値以外ゼロ
```

rename で値は変わらないため、既存のクリーン状態が維持される前提。新規ヒットがあれば既存資産の問題として別 issue 化し、本 PR は rename のみで進める。

### 7.2 hook bypass 禁止

```bash
git log <commit-1>..<commit-3> --pretty=format:'%H %s' | grep -i 'no.verify\|skip.hook'
# 期待: 0 件
```

`--no-verify` / `--no-gpg-sign` を使った形跡がコミットメッセージにないことを確認。

## 8. 整合性検証チェックリスト

| # | 検証 | コマンド | 合格条件 |
| --- | --- | --- | --- |
| C-1 | apps/api ADR 参照 | `rg "issue-325" outputs/phase-12/test-file-suffix-adr-apps-web.md` | ヒット ≥ 1 |
| C-2 | vitest include 両許容維持 | `rg "test,spec" vitest.config.ts` | ヒット ≥ 1 |
| C-3 | package.json 同期 | `rg "tokens\.runtime\.spec\.ts" apps/web/package.json` | ヒット = 1 |
| C-4 | package.json 旧参照ゼロ | `rg "tokens\.test\.ts" apps/web/package.json` | ヒット = 0 |
| C-5 | lefthook 直接参照ゼロ | `rg "\.test\." lefthook.yml` | ヒット = 0 |
| C-6 | workflow apps/web `.test.` ゼロ | `rg "apps/web.*\.test\." .github/workflows/` | ヒット = 0 |
| C-7 | coverage 閾値不変 | rename 前後の `vitest run --coverage` 数値比較 | line/branch/func/stmt 完全一致 |
| C-8 | secret leakage ゼロ | §7.1 grep | 既知 dummy 値以外ゼロ |
| C-9 | hook bypass ゼロ | §7.2 grep | ヒット = 0 |

## 完了条件チェック

- [ ] apps/api ADR との構造的整合表が記述されている
- [ ] vitest.config.ts が両許容のまま変更不要であることが明記されている
- [ ] apps/web/package.json:19 の同期確認コマンドが定義されている
- [ ] lefthook / workflows の grep 確認コマンドが定義されている
- [ ] coverage 閾値が rename で動かないことが明記されている
- [ ] secret leakage / hook bypass の確認手順が定義されている
- [ ] 整合性検証チェックリスト C-1〜C-9 が網羅されている
