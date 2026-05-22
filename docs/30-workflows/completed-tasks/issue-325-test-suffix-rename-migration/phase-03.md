# Phase 3: 設計 / suffix 分類ルール / glob 移行戦略 / rename 順序 / git mv 専用 commit 戦略

## 目的

Phase 2 で凍結した fixed list を実装に落とすための **設計判断** を確定する。具体的には (1) suffix 分類ルールの ADR ドラフト、(2) glob 移行戦略の選定（一括移行 vs 過渡期両許容）、(3) `git mv` rename 順序、(4) PR 内の commit 分割戦略、(5) lefthook bypass 禁止の担保、(6) rollback 戦略 を決定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implementation_completed |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 3-1 | Phase 2 fixed list を根拠とした suffix 分類ルールを ADR ドラフトとして確定する |
| 3-2 | glob 移行戦略を案 A（一括移行）/ 案 B（両許容）で比較し採用案を決定する |
| 3-3 | `git mv` 132 件の rename 順序を確定する |
| 3-4 | PR 内 commit 分割戦略（rename / config / ADR の 3 commit）を確定する |
| 3-5 | lefthook bypass 禁止と CI gate を整理する |
| 3-6 | rollback 戦略（PR revert 1 発で戻る）を整理する |

## 1. suffix 分類ルール（ADR ドラフト）

### 4 分類の判別フロー

新規 test 追加時にも適用する判別フロー（Phase 12 ADR の核）。

```
[新規 test を作成]
   │
   ▼
1. HTTP route handler / Cloudflare Workflow trigger / 外部 API contract を直接呼ぶ?
   ├─ Yes → *.contract.spec.ts
   └─ No  → 2 へ
   │
   ▼
2. 認可 (authz) / session 解決 / rate limit など権限境界を test するか?
   ├─ Yes → *.authz.spec.ts
   └─ No  → 3 へ
   │
   ▼
3. apps/api/src/repository/ 配下に置かれているか?
   ├─ Yes → *.repository.spec.ts
   └─ No  → 4 へ
   │
   ▼
4. 上記いずれにも該当しない（utils / services / use-cases / view-models / schemas 等）
   → *.spec.ts（unit）
```

### 中間修飾子の保持ルール

既存ファイル名に意味を持つ中間修飾子（`.diagnostics` / `.verify` / `.types`）が含まれる場合は **保持** し、suffix の直前に挿入する:

- `builder.diagnostics.test.ts` → `builder.diagnostics.repository.spec.ts`
- `static-manifest.verify.test.ts` → `static-manifest.verify.repository.spec.ts`
- `sync-forms-responses.types.test.ts` → `sync-forms-responses.types.contract.spec.ts`

ただし suffix 役割と重複する `.contract` 中間修飾子は除去する:

- `alias-queue-adapter.contract.test.ts` → `alias-queue-adapter.repository.spec.ts`（中間 `.contract` を除去し repository に統合）

### 配置による分類の優先

`apps/api/src/repository/` 配下は **すべて repository 分類** とする（中の test が contract 性を含んでも repository 統一）。理由は配置 path = 1 次分類の単純なルールを維持するため。

## 2. glob 移行戦略（案比較と採用）

### 案 A: 一括移行（`*.test.ts` glob を `*.spec.ts` glob へ完全置換）

| 項目 | 内容 |
| --- | --- |
| 変更点 | `vitest.config.ts` / `lefthook.yml` / `.github/workflows/*.yml` の `*.test.ts` 参照をすべて `*.spec.ts` に置換 |
| pros | 規約の意義（種別判別 100%）が即達成。混在を許す余地が残らない。後続 task が誤って `*.test.ts` で書いた場合は即 silent skip → CI が test 件数差で fail（早期検出） |
| cons | rename と config 同期が完全同期しないと CI が一時 red。1 PR 内で必ず両方完結させる必要がある（本タスクの前提と一致） |

### 案 B: 過渡期として両許容（`*.{test,spec}.ts` を許容）

| 項目 | 内容 |
| --- | --- |
| 変更点 | glob を `*.{test,spec}.ts` に拡張し、両拡張子が pickup される状態を維持。後続 task で `*.test.ts` を完全削除 |
| pros | 段階移行が可能。rename と config 同期の time window で CI 落ちが起きにくい |
| cons | (1) 規約の意義「種別判別」を半減させる、(2) 後続 task が `.test.ts` で書き続けても CI 通過してしまい規約が形骸化する、(3) 完全削除のための後続 task が必要 |

### 採用: **案 A（一括移行）**

理由:

1. **規約の意義の保全**: 両許容は「混在を許容する」状態への逆戻り。本タスクの目的（08a 規約の後追い完全適用）と矛盾する
2. **race window 排除**: 1 PR 内で rename と config 同期を必ず完結させる前提（CONST_007 で先送りしない）が確立しているため、案 A の唯一のリスク（一時 red）は構造的に発生しない
3. **後続 silent skip の早期検出**: 後続 task が `.test.ts` で test を追加した場合、CI で当該 test が pickup されず `Test Files X | Tests Y` の Y が想定より小さくなることで PR レビュアー / 作者が気づける（案 B では気づかない）

## 3. `git mv` rename 順序

### 採用方針: **alphabetical 一括 rename（単一 rename commit）**

```bash
# rename 実行（132 件をワンスクリプトで）
sort outputs/phase-11/rename-mapping.csv | tail -n +2 | while IFS=, read -r old new _ _; do
  git mv -- "$old" "$new"
done
```

### 順序の根拠

| 候補順序 | 採否 | 理由 |
| --- | --- | --- |
| alphabetical（採用） | ○ | レビュアーが `git log --diff-filter=R --summary` で追跡しやすい。決定論的 |
| 分類別（contract → authz → ...） | × | rename commit を 4 commit に分割すると config 同期との対応が複雑化。本タスクは「内容変更ゼロ」を強調すべきで分類の commit 分割は余計 |
| ファイルサイズ降順 | × | 意味なし |

### 単一 commit にまとめる根拠

- `git log --diff-filter=R --summary HEAD~N..HEAD` を 1 commit に対して実行すれば 132 件の `rename` 行が一覧でき、レビュアーが「pure rename か」を即判定できる
- 132 件を別 commit に割ると検証が PR 横断になり、AC-2（diff 0）の検証コストが増える

## 4. PR 内 commit 分割戦略

採用: **3 commit 構成**。

| commit | 内容 | 検証ポイント |
| --- | --- | --- |
| `refactor: rename apps/api tests to suffix policy (git mv only)` | 132 ファイル `git mv` のみ。`-x R` で `git log --diff-filter=R --summary` が 132 行 | `git diff --stat HEAD~1` の +/- が 0 |
| `chore: sync test glob to *.spec.ts (vitest/lefthook/CI)` | `vitest.config.ts` / `lefthook.yml` / `.github/workflows/*.yml` / 必要なら `package.json` の glob 同期 | rename commit 後の glob 残存を `rg` で 0 件に |
| `docs: add test file suffix ADR (issue-325)` | `outputs/phase-12/test-file-suffix-adr.md` 等の Phase 12 documentation を追加 | ADR 内容の整合性 |

### 1 commit 案との比較

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 3 commit（採用） | ○ | 責務が分離され、PR レビュー時に「rename 部分だけ pure か」を `git show` で 1 commit に対して検証できる |
| 1 commit（rename + config + ADR 全部） | × | rename diff と config diff が混ざり、`git diff --stat` が pure rename 検証に使えない |
| 132+1+1 commit（per-file rename） | × | レビュー負荷増。rename を per-commit にするメリットは無い |

### commit message 末尾

各 commit に `Refs #325`（Closes は禁止）を含める。

## 5. lefthook bypass 禁止の担保

### 不変条件

- `--no-verify` を使用しない
- lefthook が rename + config 同期を block しない設計を確認する

### 確認手順（Phase 7 整合性検証で実行）

1. `lefthook.yml` の `pre-commit` / `pre-push` の test path filter が、rename 後 `*.spec.ts` を pickup できるか確認
2. 局所動作確認: `rename commit 直後 → pre-push` で lefthook が green になることを localで一度実行
3. CI で `verify-lefthook-config`（既存 gate があれば）が green

bypass が必要に見える状況（hook が誤検知）が発生したら、本タスクでは hook 自体を修正することで対応する（CLAUDE.md ポリシーに従う）。

## 6. rollback 戦略

### 1 PR revert で戻す

採用方針: PR を 1 つに閉じることで `gh pr revert` 相当 / `git revert -m 1 <merge-commit>` で完全に元に戻せる状態を維持する。

| 観点 | 担保 |
| --- | --- |
| revert で test が正しく戻るか | rename は `git mv` のため `git revert` で `*.spec.ts` → `*.test.ts` に逆 rename される |
| revert で config が正しく戻るか | config 同期 commit も同 PR 内のため revert で旧 glob に戻る |
| revert で ADR が正しく戻るか | ADR は別 commit のため revert すれば削除される |
| revert 後の test 件数 | rename 前と一致（128 行 evidence で snapshot 保持） |

### partial rollback の禁止

「config だけ revert して rename は残す」のような部分 revert は禁止する（CI が silent skip する状態に戻る）。revert する場合は PR 全体を revert する。

## 7. 設計の不変条件まとめ

- D-1: rename は `git mv` のみ。テキストエディタ編集禁止
- D-2: rename commit は単一 commit / alphabetical / 132 件
- D-3: glob 移行は案 A（一括移行）。両許容は採用しない
- D-4: PR 内 commit は 3 つ（rename / config / ADR）
- D-5: 中間修飾子（`.diagnostics` / `.verify` / `.types`）は保持。`.contract` のみ repository 統合時に除去
- D-6: `apps/api/src/repository/` 配下は配置で repository 分類確定
- D-7: lefthook bypass 禁止
- D-8: rollback は PR 全体 revert のみ

## 完了条件チェック

- [ ] suffix 分類判別フロー（4 段階）が記述されている
- [ ] 中間修飾子保持ルールが明示されている
- [ ] glob 移行戦略が案 A 採用で根拠付きで決定されている
- [ ] rename 順序が alphabetical 単一 commit と確定している
- [ ] commit 分割が 3 commit 構成と確定している
- [ ] lefthook bypass 禁止と rollback 戦略が記述されている
- [ ] 設計の不変条件 D-1..D-8 がリスト化されている
