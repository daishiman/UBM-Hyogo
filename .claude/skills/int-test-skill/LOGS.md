# Skill Usage Logs

このファイルにはスキルの使用記録が追記されます。

---

## 2026-04-27 - 02b same-wave: fake D1 repository pattern 追加

- `references/fake-d1-repository-pattern.md` を新規作成
- 02b で確立した fake D1 surface（`prepare → bind → all/first/run` の in-memory 再現 / `apps/api/src/repository/_shared/__fakes__/fakeD1.ts`）を repository 単体テストの正本テンプレとして登録
- 3 軸チェックリスト（状態遷移 / queue 整合性 / not-found guard）と不変条件 #13/#14/#15 のテスト担保マッピングを記録
- Miniflare D1 統合テストへの handoff 先（`02b-followup-003`、08a 担当）を明示

