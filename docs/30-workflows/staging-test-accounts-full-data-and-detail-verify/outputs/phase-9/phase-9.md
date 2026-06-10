# Phase 9 — 品質保証

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

> 本フェーズは今回のlocal実装が実コードを書いた後に実行すべき検証コマンドと合格基準を確定する。
> 本タスクは VISUAL_ON_EXECUTION（公開詳細ページの目視確認が成果）だが、QA ゲートは **型 / lint / verify-design-tokens / 生成物 drift guard / artifacts parity / seed contract spec** で構成する。色トークンは Lane B のギャップ修正が発生した場合のみ接触し、既存トークンの範囲に閉じる。

---

## 1. 検証コマンド（一括判定）

```bash
# 1. 型チェック（全 workspace）
mise exec -- pnpm typecheck

# 2. lint（全 workspace）
mise exec -- pnpm lint

# 3. 生成物 drift guard（再生成して committed と byte 一致か検証）
node --import tsx scripts/gen-test-accounts-seed.mjs        # 3 生成物を上書き再生成
git diff --exit-code apps/api/migrations/seed/test-accounts-seed.sql \
  apps/api/migrations/seed/test-accounts-cleanup.sql \
  apps/api/migrations/seed/test-accounts.manifest.json      # drift 0 を exit code で判定

# 4. Lane A seed 関連 vitest（catalog 不変条件 / build 出力 / profile 展開）
mise exec -- pnpm exec vitest run \
  apps/api/src/testing/test-accounts \
  --config=vitest.config.ts

# 5. Lane A in-memory D1 投入 + drift guard contract
mise exec -- pnpm exec vitest run \
  apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts \
  --config=vitest.d1.config.ts

# 6. Lane B 公開詳細 adapter / component spec
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/adapters/__tests__/member-detail.spec.ts \
  apps/web/src/components/public/__tests__ \
  --config=vitest.config.ts

# 7. PR pre-flight（phase12-compliance / gate-metadata / indexes drift の一括検証）
bash scripts/verify-pr-ready.sh
```

> §3 の drift guard は `node --import tsx scripts/gen-test-accounts-seed.mjs` で実際に書き出した後、`git diff --exit-code` で committed 版との差分が無いことを判定する（`--check` フラグが scripts 側で実装済みならそれを優先利用可）。
> `--config=vitest.d1.config.ts` は in-memory D1（`setupD1`）を使う seed 適用テストに必須。これを付けないと D1 binding が無く公開項目検証 / 冪等検証が走らない。

---

## 2. 品質ゲート

| 項目 | 合格基準 | 対応 AC |
|------|----------|---------|
| typecheck | error 0（catalog / build-seed-sql / spec / adapter / fixture すべて型解決） | AC-8 |
| lint | violation 0（apps/api・apps/web。stable_key リテラル直書き 0 = lint-stablekey-literal green） | AC-8 |
| 生成物 drift | 再生成した seed/cleanup/manifest が committed 版と **byte 一致**（`git diff --exit-code` が exit 0） | AC-4 |
| catalog 不変条件 spec | `catalog.spec.ts` 全 PASS。TEST-MEM-01..10 の `profile` が表示バリエーション・マトリクス通り（フル/中/全項目入力/エッジ）。member/admin 項目（birthDate/ubmJoinDate/challenges）もデータとして存在 | AC-1, AC-2, AC-3 |
| build 出力 spec | `build-seed-sql.spec.ts` 全 PASS。各 member の profile 全キーが `response_fields` 行へ、各 stable_key の visibility が `schema_questions` 行へ展開される | AC-2, AC-5 |
| seed 適用 / 冪等 / 公開項目 spec | `test-accounts-seed.contract.spec.ts` 全 PASS。in-memory D1 へ seed 2 回適用で件数不変、cleanup 後 0 件、公開掲載 5 件（01,06,07,09,10）の公開項目が全取得でき、member/admin 項目が公開 view に漏れない | AC-5, AC-9 |
| adapter / component spec | `member-detail.spec.ts` 他全 PASS。full（01/06/07）/ all-fields（09）/ edge（10）fixture で全 public 項目が 5 セクション描画、空項目は `—` fallback / 条件付き非表示、member/admin 項目は公開 view 非表示（二重防御） | AC-6 |
| verify-design-tokens | **Lane B ギャップ修正時のみ判定対象**。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0。新規 primitive 0。既存 OKLch トークンのみ。ギャップなしなら UI ファイル差分 0 で自明 green | AC-8 |
| API/D1/Form 不変 | `git diff` で `apps/api/src/routes/` / `apps/api/migrations/`（seed 以外）/ `packages/shared/src/zod/` に変更が無い | AC-7 |
| verify-pr-ready | `bash scripts/verify-pr-ready.sh` が green（phase12-compliance ok / gate-metadata ERROR 0 / indexes drift 0） | — |

---

## 3. 削除 / stub 確認

**原則該当なし。**

理由: 本タスクは **既存ファイルの拡充・検証が中心**（catalog.ts の profile データ追加 / build-seed-sql.ts の汎用性確認 / 公開詳細 adapter・component の検証 + ギャップ時のみ最小修正 / fixture 更新）であり、ファイル削除・機能 stub 化・互換シム導入を伴わない。Phase 8 の重複削減（`buildSnsUrls` 等のローカルヘルパ集約）も**既存挙動を保つ内部整理**であり、外部から参照される API/関数の削除や stub 置換ではない。

- 削除確認（孤立 import / dangling 参照の残骸チェック）は本タスクでは不要。万一 Phase 5 で build-seed-sql の TEST-MEM-01 専用ハードコードを汎用化した際に旧専用分岐を削った場合は、その箇所のみ「旧分岐参照 0」を `git grep` で確認する（局所）。
- stub 確認（未実装 throw / TODO の残置）も対象外。今回のlocal実装は spec の全項目を実装し切ること。

---

## 4. HEX 直書き 0・新規 primitive 0 の確認手順（grep）

Lane B でギャップ修正が発生した場合のみ実施（ギャップなしなら UI 差分 0 で自明 green）。

```bash
# HEX 直書き（#rgb / #rrggbb）の検出 — 0 件であること
git diff dev...HEAD --name-only -- 'apps/web/src/**/*.tsx' 'apps/web/src/**/*.ts' \
  | xargs -r grep -nE '#[0-9a-fA-F]{3,8}\b' || echo "HEX 直書き 0: OK"

# Tailwind 任意値の色直書き（bg-[#...] / text-[#...] / border-[#...]）— 0 件であること
git diff dev...HEAD --name-only -- 'apps/web/src/**/*.tsx' \
  | xargs -r grep -nE '(bg|text|border|ring|fill|stroke)-\[#' || echo "任意値色直書き 0: OK"

# 新規 primitive 追加の検出 — apps/web/src/components/ui/ に新規ファイルが無いこと
git diff dev...HEAD --name-status -- 'apps/web/src/components/ui/' \
  | grep -E '^A' && echo "WARN: 新規 primitive が追加されている（要レビュー）" || echo "新規 primitive 0: OK"

# 公式 verify-design-tokens gate（CI 相当）
mise exec -- pnpm verify:design-tokens 2>/dev/null || \
  mise exec -- pnpm lint   # design-tokens gate が lint に統合されている場合
```

- HEX 直書き・任意値色直書きが 1 件でも出た場合は、`apps/web/src/styles/tokens.css` の既存 OKLch トークンへ置換する（新規トークン定義はしない）。
- `apps/web/src/components/ui/` への新規ファイル追加（`^A`）が出た場合は、既存 primitives で代替できないか再検討する（不変条件 #5: 新規 primitive を生やさない）。

---

## 5. artifacts parity

- Phase 12 strict 7 ファイル（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）と `outputs/phase-12/artifacts.json` の parity を `bash scripts/verify-pr-ready.sh`（gate-metadata:validate）で判定する。
- 生成物 parity（catalog → seed/cleanup/manifest の再生成 byte 一致）は §1-3 の drift guard が本タスクにおける parity の実体。SSOT（catalog）と生成物が常に一致することを保証する。
- mirror parity（`.agents/skills` ↔ `.claude/skills` の symlink）は **該当なし**（skill ディレクトリ非接触）。

---

## 6. ゲート判定（今回のlocal実装確認用）

- [ ] §1 の 7 コマンドがすべて green（typecheck 0 / lint 0 / drift 0 / Lane A spec PASS / D1 contract PASS / Lane B spec PASS / verify-pr-ready 通過）
- [ ] §2 の各ゲートが対応 AC とともに満たされている
- [ ] §3 削除/stub 確認は原則該当なし（既存ファイル編集中心）であることを確認
- [ ] §4 HEX 直書き 0・新規 primitive 0（Lane B ギャップ修正時）を grep で確認、ギャップなしなら UI 差分 0
- [ ] §5 artifacts parity（strict 7 ↔ artifacts.json）green、生成物 drift 0

## 完了条件

- typecheck / lint / verify-design-tokens / drift guard / artifacts parity / seed contract spec の一括判定コマンドと合格基準を確定した。削除/stub 確認は既存ファイル編集中心ゆえ原則該当なしと明記した。HEX 直書き 0・新規 primitive 0 の grep 確認手順を定義した。Phase 10 最終レビューへ進む。
