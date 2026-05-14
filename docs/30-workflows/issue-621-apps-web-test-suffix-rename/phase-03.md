# Phase 3: 設計 / suffix 分類ルール / glob 移行戦略 / rename 順序 / git mv 専用 commit 戦略

## 目的

Phase 2 で凍結した fixed list を実装に落とすための **設計判断** を確定する。具体的には (1) apps/web 用 suffix 分類ルールの ADR ドラフト、(2) glob 移行戦略の選定（一括移行 vs 過渡期両許容）、(3) `git mv` 70 件の rename 順序、(4) PR 内の commit 分割戦略、(5) lefthook bypass 禁止の担保、(6) rollback 戦略 を決定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | completed |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 3-1 | Phase 2 fixed list を根拠とした apps/web 用 suffix 分類ルールを ADR ドラフトとして確定する |
| 3-2 | glob 移行戦略を案 A（一括移行）/ 案 B（両許容維持）で比較し採用案を決定する |
| 3-3 | `git mv` 70 件の rename 順序を確定する |
| 3-4 | PR 内 commit 分割戦略（rename / config / ADR の 3 commit）を確定する |
| 3-5 | lefthook bypass 禁止と CI gate を整理する |
| 3-6 | rollback 戦略（PR revert 1 発で戻る）を整理する |

## 1. apps/web 用 suffix 分類ルール（ADR ドラフト）

### 5 分類の判別フロー（apps/web 専用）

```
[新規 apps/web test を作成]
   │
   ▼
1. React component の rendering / interaction を test するか? (.tsx 拡張子)
   ├─ Yes → *.component.spec.tsx
   └─ No  → 2 へ
   │
   ▼
2. build output / instrumentation / static invariants / design tokens など
   ランタイム成果物の構造・存在・整合性を検証するか?
   ├─ Yes → *.runtime.spec.ts
   └─ No  → 3 へ
   │
   ▼
3. それ以外（lib / utility / hook / view-model の純粋単体）
   → *.spec.ts
```

### apps/api ADR との対比表

| 観点 | apps/api（#325） | apps/web（#621） |
| --- | --- | --- |
| 分類軸 | 4 種（contract / authz / repository / unit） | 5 種（component / runtime / lib-unit） |
| 中間修飾子 | `.contract` / `.authz` / `.repository` / なし | `.component` / `.runtime` / なし |
| 拡張子 | `.ts` のみ | `.ts` と `.tsx` 両方 |
| 分類根拠 | バックエンド層構造（HTTP route / 認可 / repository / 純粋ロジック） | UI 層構造（React component / runtime artifact / 純粋ロジック） |
| 判別フロー | route handler → authz → repository → unit | .tsx → runtime artifact → unit |
| ADR ファイル | `outputs/phase-12/test-file-suffix-adr.md` | `outputs/phase-12/test-file-suffix-adr-apps-web.md` |
| 件数 | 132 | 70 |

### ADR 採用条件

- 新規 apps/web test 追加時、上記判別フローで分類を 1 つだけ決定する
- 1 ファイル複数分類は禁止（`*.component.runtime.spec.tsx` 等は禁止）
- Storybook / Playwright / E2E は対象外（`tests/e2e/` で別管理）
- `route` / `action` / `hook` 専用分類は将来要請があった時点で ADR を改訂して追加する

## 2. glob 移行戦略（案 A vs 案 B）

| 観点 | 案 A: 一括移行（`*.spec.{ts,tsx}` 単独） | 案 B: 過渡期両許容（`*.{test,spec}.{ts,tsx}`） |
| --- | --- | --- |
| `vitest.config.ts` include | `apps/**/src/**/*.spec.{ts,tsx}` に変更 | 現状維持 |
| 移行リスク | 1 ファイルでも rename 漏れがあれば silent skip | rename 漏れがあっても test が走るが規約違反検出は別途必要 |
| 1 PR 完結性 | 高（規約適用率 100%） | 中（漏れが残る可能性） |
| followup-003 との整合 | followup-003 で同じ操作を再度行う必要がある | followup-003 が本来の収斂タスク |

**採用: 案 B（過渡期両許容を維持）**

理由:
- 本タスクの責務は **apps/web 内の rename + glob 同期 1 点（package.json:19）+ ADR 確定** に絞る
- `vitest.config.ts` の include glob を `*.spec` 単独に絞る作業は **followup-003** として別 issue 化済み。本タスクで先取りすると followup-003 の責務が消失する
- 案 B でも AC-5（残存ゼロ）と件数 assert により rename 漏れは検出可能
- ただし `apps/web/package.json:19` の `verify-design-tokens` script は **直接ファイル名参照** のため、案 A 相当の追従（`tokens.test.ts` → `tokens.runtime.spec.ts`）が必須

## 3. `git mv` 70 件の rename 順序

### 順序戦略: `oldPath` alphabetical 昇順

理由:
- 順序に依存性なし（rename 同士は独立操作）
- レビュー時に CSV と実 commit の `git diff --diff-filter=R --summary` を行単位で突き合わせやすい
- bash while ループで CSV を上から流す自然な実装と一致

### 実装擬似コード（Phase 6 で詳細化）

```bash
while IFS=, read -r old new cls just; do
  [[ "$old" == "old_path" ]] && continue
  git mv "$old" "$new"
done < outputs/phase-11/rename-mapping.csv
```

## 4. PR 内 commit 分割戦略（3 commit）

| # | commit message | 内容 | 検証コマンド |
| --- | --- | --- | --- |
| 1 | `refactor(web): rename *.test.ts(x) to suffix-classified *.spec.ts(x) (Refs #621)` | `git mv` 70 件のみ | `git log -1 --diff-filter=R --summary HEAD \| wc -l` = 70、`git diff --stat HEAD~..HEAD` の `+`/`-` が 0 |
| 2 | `chore(web): sync test glob to *.spec.ts(x) (Refs #621)` | `apps/web/package.json:19` の glob 同期、`.github/workflows/ci.yml:159` のコメント追従 | `git diff HEAD~..HEAD -- 'apps/web/src/**'` が空 |
| 3 | `docs(web): add apps/web test file suffix ADR (Refs #621)` | `outputs/phase-12/test-file-suffix-adr-apps-web.md` 追加 + Phase 12 系 evidence | runtime / config に一切触らない |

### 3 commit 分割の根拠

- レビュアーが「rename 部分は機械的（diff 0）」を一目で確認できる
- 万一の rollback 時、commit 1 のみ revert すれば内容変更を含まない元状態に戻せる
- ADR 内容のレビューと rename 結果のレビューを分離できる
- squash merge は **禁止**（merge commit で 3 commit 構造を保つ）

## 5. lefthook bypass 禁止と CI gate

| Hook | rename 時の挙動 | 対処 |
| --- | --- | --- |
| pre-commit `staged-task-dir-guard` | 70 件の `apps/web/src/**` rename を「無関係 task の混入」として誤検出する可能性 | E-13（Phase 8）。許可 path に rename-only モードで `apps/web/src/**` を明示するか、guard の rename detection を改善。`--no-verify` 禁止 |
| pre-push `coverage-guard` | rename commit はrename commit pure → coverage 不変 | 通常 PASS。誤検出時は CLAUDE.md sync-merge ポリシーに準じて hook 側を改善 |
| CI `verify-design-tokens` | `tokens.test.ts` 参照のままだと FAIL | commit 2 で同期。commit 1 単独 push 時は意図的に FAIL（commit 2 で復旧） |
| CI `verify-indexes-up-to-date` | rename と無関係 | 影響なし |

`--no-verify` / `--no-gpg-sign` を使わない。Hook が誤検出する場合は **hook 自体を改善** する。

## 6. rollback 戦略

### Pattern A: PR merge 前

`git reset --hard origin/dev` でブランチ破棄。

### Pattern B: PR merge 後

3 commit 個別 revert:

```bash
git revert --no-edit <commit-3-sha>   # ADR
git revert --no-edit <commit-2-sha>   # config 同期
git revert --no-edit <commit-1-sha>   # rename
```

commit 1 は pure rename のため revert で元の `.test.ts(x)` 名に完全復元される。

### Pattern C: 部分復旧（CSV と物理乖離）

Phase 8 §2.2 を参照。CSV を再生成して残差のみ追加 rename する。

## 7. 設計判断サマリ

| 判断 | 結果 |
| --- | --- |
| 分類軸 | 5 種（component / runtime / lib-unit）。route/action/hook は将来採用 |
| glob 戦略 | 案 B（両許容維持）+ package.json:19 のみ追従 |
| rename 順序 | alphabetical 昇順 |
| commit 分割 | 3 commit（rename / config / ADR） |
| merge 方式 | merge commit（squash 禁止） |
| hook bypass | 禁止 |
| rollback | 3 commit 個別 revert |

## 完了条件チェック

- [ ] apps/web 用判別フローと apps/api ADR との対比表が記述されている
- [ ] glob 移行戦略の案 A/B 比較と採用根拠（案 B + package.json 追従）が明記されている
- [ ] rename 順序が alphabetical 昇順で確定している
- [ ] 3 commit 分割（rename / config / ADR）が確定している
- [ ] hook bypass 禁止と誤検出時の対処方針が明記されている
- [ ] rollback 3 パターン（merge 前 / merge 後 / 部分復旧）が記述されている
