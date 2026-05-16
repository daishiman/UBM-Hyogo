# Phase 8: ドキュメント反映（spec / SCOPE / changelog 整合）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | PARALLEL-01-NAV |
| タスク名 | parallel-01-navigation — admin 動線（sidebar logo / members→tags drawer link） |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメント反映 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 7 (テスト計画) |
| 次 Phase | 9 (staging 動作確認 / 受入) |
| 状態 | pending |
| 実装区分 | **実装仕様書** |
| taskType | implementation |
| visualEvidence | VISUAL |
| 実装区分 判定根拠 | ソース仕様 `spec.md` の状態を「実装完了」に更新し、`implementation-guide.md` / `documentation-changelog.md` / SCOPE.md の整合を実 markdown diff として確定する Phase。コード変更は伴わないがドキュメント反映そのものが成果物。 |

---

## 目的

実装の完了をドキュメント側に **事故なく** 反映する。具体的には:

1. ソース仕様 `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md` の状態行を「実装完了」に更新する（最終確認日を 2026-05-15 → 実装完了日に置換）。
2. `outputs/phase-12/implementation-guide.md` に G1-1 / G1-2 の確定差分（最終 JSX イメージ・テスト ID 一覧）を記録する。
3. `outputs/phase-12/documentation-changelog.md` に必須エントリ最小セットを記録する。
4. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` の progress 表に該当行があれば「完了」へ書き換える。
5. CLAUDE.md / specs への波及がないことを grep で evidence 化する。

---

## 8-1. ドキュメント変更対象ファイル一覧

| # | ファイル | 変更種別 | 影響度 |
| --- | --- | --- | --- |
| 1 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md` | 末尾「状態」を「仕様書作成完了、実装待ち」→「実装完了」に更新（最終確認日も更新） | 高 |
| 2 | `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-12/implementation-guide.md` | 新規。最終 JSX 差分要約 + Test ID 一覧 + 確認手順 | 高 |
| 3 | `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-12/documentation-changelog.md` | 新規。必須エントリ最小セット（2 件） | 高 |
| 4 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` | progress 表に該当行があれば「完了」に更新（無ければ no-op） | 中 |
| 5 | `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-08/docs-updates.md` | 新規（本 Phase 成果物） | — |
| 6 | `CLAUDE.md` | 影響有無確認のみ（admin sidebar / drawer は不変条件外） | 低 |
| 7 | `docs/00-getting-started-manual/specs/` | 影響有無確認のみ（grep で `AdminSidebar` / `MemberDrawer` の言及確認） | 低 |

---

## 8-2. `spec.md` 状態行の更新

差分（末尾 3 行）:

```markdown
**最終確認日:** 2026-05-15
**作成者:** Claude (task-20260515-090133-wt-1)
**状態:** 実装完了（PARALLEL-01-NAV / 2026-05-15）
```

> 既存セクション §1〜§10 は **上書きしない**。末尾メタ情報の状態行のみ差し替える。

---

## 8-3. `outputs/phase-12/implementation-guide.md` 雛形

新規ファイル。最小構成は以下。

```markdown
# parallel-01-navigation 実装ガイド

## 1. 実装サマリ

| スコープ | 対象ファイル | 主差分 |
| --- | --- | --- |
| G1-1 home wayfinding | apps/web/src/components/layout/AdminSidebar.tsx | `<nav>` 直下に `<Link href="/" aria-label="ホームに戻る">` を追加 |
| G1-2 members→tags | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | drawer 末尾に `<Link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}>` を追加 |

## 2. テスト ID 一覧

| Test ID | ファイル | 観点 |
| --- | --- | --- |
| AS-01〜AS-04 | apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx | href / aria-label / focus / token |
| MD-01〜MD-07 | apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx | href / encode (`@` `/` `#`) / link text / onClose 不発火 / token |
| E2E-NAV-01 / 02 | apps/web/e2e/admin-smoke.spec.ts（or 既存 admin smoke） | logo→`/` / drawer→tags 遷移 |

## 3. 確認手順

1. `mise exec -- pnpm typecheck`
2. `mise exec -- pnpm lint`
3. `mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar`
4. `mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer`
5. `mise exec -- pnpm --filter @ubm-hyogo/web e2e -- admin-smoke`
6. dev server を起動し `/admin` → logo click、`/admin/members` → drawer → タグ管理へ → `/admin/tags?memberId=...` を視認

## 4. 不変条件遵守の証跡

- apps/api 配下に変更なし
- D1 schema 変更なし / 新規 endpoint なし
- HEX 直書き 0 件（spec assertion で担保）
- 新規 primitive 追加なし（prototype primitive を再利用）
```

---

## 8-4. `outputs/phase-12/documentation-changelog.md` 必須エントリ最小セット

新規ファイル。最小 2 エントリ。

```markdown
# parallel-01-navigation documentation changelog

## 2026-05-15 — 実装完了反映
- spec.md の状態行を「実装完了」に更新
- AdminSidebar / MemberDrawer の差分を implementation-guide.md に記録
- Test ID（AS-01〜04 / MD-01〜07 / E2E-NAV-01・02）を確定

## 2026-05-15 — SCOPE 反映確認
- ui-prototype-alignment-mvp-recovery/SCOPE.md の progress 行を確認
- 該当行が存在する場合は「完了」へ更新、無い場合は no-op の旨を記録
```

---

## 8-5. SCOPE.md 反映方針

```bash
grep -n "parallel-01" docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md \
  | tee outputs/phase-08/scope-grep.txt
```

| grep 結果 | 対応 |
| --- | --- |
| `parallel-01-navigation` を含む progress 行が見つかった | 状態を「実装完了 (2026-05-15)」に書き換え、`docs-updates.md` に diff を記録 |
| 該当行が見つからない | SCOPE.md 修正なし。`docs-updates.md` に「SCOPE grep hit 0 件のため修正不要」を明記 |

---

## 8-6. CLAUDE.md / specs 波及確認

```bash
# CLAUDE.md に AdminSidebar / MemberDrawer 直名言及があるか
grep -nE "AdminSidebar|MemberDrawer" CLAUDE.md || echo "OK: CLAUDE.md 直接言及なし"

# specs に同コンポーネント or sidebar logo 動線への言及があるか
grep -rIn -e "AdminSidebar" -e "MemberDrawer" -e "sidebar.*ロゴ" -e "sidebar.*logo" \
  docs/00-getting-started-manual/specs/ \
  | tee outputs/phase-08/specs-grep.txt
```

| 結果 | 対応 |
| --- | --- |
| 直接言及あり | 該当 spec に「動線完了（PARALLEL-01-NAV / 2026-05-15）」を 1 行追記し `docs-updates.md` に diff 記録 |
| 言及なし | `docs-updates.md` に「specs / CLAUDE.md 影響なし」を grep evidence 付きで明記 |

> 期待動向: CLAUDE.md は「UI prototype alignment / MVP recovery」セクションに概況のみ記載があり、個別 component 名は無いはずなので **追記不要** の見込み。grep で確証する。

---

## 8-7. 入出力・副作用

| 入力 | 出力 | 副作用 |
| --- | --- | --- |
| spec.md 状態行（現状） | 「実装完了」に更新した新版 | git 差分のみ |
| `outputs/phase-12/` ディレクトリ未存在 | implementation-guide.md / documentation-changelog.md を新規作成 | ファイル 2 件追加 |
| SCOPE.md grep 結果 | progress 行更新 or no-op | 該当行のみ更新 |
| CLAUDE.md / specs grep | `outputs/phase-08/specs-grep.txt` / `scope-grep.txt` | evidence ファイル |

---

## 8-8. テスト方針 / 検証コマンド

```bash
# 1. spec.md 状態行が正しく更新されたか確認
grep -n "状態:" docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md

# 2. implementation-guide.md / documentation-changelog.md の存在確認
ls docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-12/

# 3. SCOPE / specs grep を再実行し evidence と整合確認
grep -n "parallel-01" docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md
grep -rIn -e "AdminSidebar" -e "MemberDrawer" docs/00-getting-started-manual/specs/

# 4. markdownlint
mise exec -- pnpm exec markdownlint-cli2 \
  "docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-12/*.md" \
  "docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-08/*.md"
```

---

## 8-9. DoD（Definition of Done）

- [ ] `spec.md` 末尾の「状態」行が「実装完了（PARALLEL-01-NAV / 2026-05-15）」に更新されている
- [ ] `outputs/phase-12/implementation-guide.md` が雛形どおりに新規作成されている
- [ ] `outputs/phase-12/documentation-changelog.md` に最小 2 エントリが記録されている
- [ ] `SCOPE.md` の該当行が更新済み or no-op の根拠が `docs-updates.md` に記録されている
- [ ] CLAUDE.md / specs 波及なしの grep evidence が保存されている
- [ ] markdownlint が PASS する
- [ ] `outputs/phase-08/docs-updates.md` に 8-2 / 8-3 / 8-4 / 8-5 / 8-6 の diff 要約が記載されている

---

## 8-10. 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | 状態行更新対象 |
| 必須 | docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md | progress 表更新確認 |
| 必須 | docs/30-workflows/parallel-01-navigation-admin-wayfinding/phase-05.md〜07.md | 反映内容の出典 |
| 参考 | CLAUDE.md「UI prototype alignment / MVP recovery」 | 波及確認 |

---

## 8-11. 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/docs-updates.md | 8-2〜8-6 の diff 要約 + grep evidence の評価 |
| evidence | outputs/phase-08/scope-grep.txt | SCOPE grep 生出力 |
| evidence | outputs/phase-08/specs-grep.txt | specs grep 生出力 |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド本体 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | changelog 必須エントリ |
| メタ | artifacts.json | phase-08 を completed に更新 |

---

## 8-12. 完了条件チェックリスト

- [ ] 8-2 spec.md 状態行 diff が `docs-updates.md` に記載
- [ ] 8-3 implementation-guide.md 雛形が作成済み
- [ ] 8-4 documentation-changelog.md 必須エントリ 2 件が記載
- [ ] 8-5 SCOPE grep evidence が `scope-grep.txt` に保存
- [ ] 8-6 specs / CLAUDE.md 波及確認 evidence が保存
- [ ] 8-9 DoD 全項目が PASS

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-08 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 9（staging 動作確認 / 受入）
- 引き継ぎ事項:
  - 8-3 implementation-guide.md の「確認手順」は Phase 9 受入 AC として転記
  - 8-5 SCOPE 更新の有無は Phase 9 で完了レビュー時に再確認
- ブロック条件: spec.md 既存記述を上書きしてしまった場合は git revert で復旧してから状態行のみ差し替え方式に修正

---

作成日: 2026-05-15
