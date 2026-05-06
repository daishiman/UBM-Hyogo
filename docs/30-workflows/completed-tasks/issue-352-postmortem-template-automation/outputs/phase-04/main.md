# Phase 04 — テスト戦略

## テスト分類
- **Unit (Vitest)**: `scripts/postmortem/__tests__/generate-postmortem.test.ts`
- **Smoke (CLI)**: `pnpm postmortem:generate -- --help` および合成入力での CLI 実行

## Unit テストケース
1. `validateInput` — 必須 CLI フィールド受領 + hyphenated 名の正規化
2. `validateInput` — release / commit 不正値を `{ ok: false, reason }` で拒否
3. `validateInput` — evidence 欠落 / occurred-at 不正値の拒否
4. `ensureEvidencePathExists` — 存在 / 欠落 / `main.md` 欠落
5. `renderTemplate` — 固定見出しが順序通り出力される
6. `renderTemplate` — 同一入力で同一出力 / `undefined` リーク無し
7. `generatePostmortem` ≡ `renderTemplate`（pure 関数等価）
8. blame 表現 grep gate（`responsible|blame|fault|責任|誰が悪い` を出力に含めない）

## カバレッジ目標
- line ≥ 80% / branch ≥ 60%（AC-10）
- pure 関数を中心に網羅

## 実行コマンド
```bash
mise exec -- pnpm vitest run scripts/postmortem
```

## 結果
- 8 tests passed（Phase 09 evidence で記録）
