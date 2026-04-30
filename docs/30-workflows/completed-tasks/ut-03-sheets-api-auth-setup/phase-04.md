# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed（実装・仕様書フェーズ完了。workflow root は `completed`） |

## 目的

UT-03 認証モジュールに対する単体テスト・契約テスト・疎通スモークの 3 層を定義し、AC-1〜AC-10 のうちテストで検証可能な項目を網羅する。Web Crypto API による JWT 署名・トークンキャッシュ TTL・Service Account JSON parse の異常系を unit で固め、Sheets API への実疎通は Phase 11 manual smoke に逃がす。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-04/test-strategy.md | 3 層テスト構成・mock 方針・coverage 目標・トレース表 |

## テスト 3 層

| 層 | 対象 | ツール | 環境 |
| --- | --- | --- | --- |
| Unit | JWT 署名 / token cache / JSON parse 失敗 | Vitest + @repo/shared Mock provider | Node + miniflare |
| 契約 | `getSheetsAccessToken()` 公開 API shape | Vitest contract test | miniflare |
| Smoke | 実 Sheets API 疎通（Phase 11 へ委譲） | curl / wrangler dev | local + dev |

## 完了条件

- [ ] Unit / 契約 / Smoke の 3 層が test-strategy.md に明記
- [ ] AC-1〜AC-10 のうち test 検証分が trace 表に紐付け
- [ ] coverage 目標（80% line / 100% branch on auth module）を明記
- [ ] `@repo/shared` Mock provider 利用方針を記述
- [ ] Sheets 実 API には unit test から打たない（quota 浪費禁止）

## 次 Phase への引き渡し

- Phase 5: テスト容易性を反映した module 構成（pure function 化、依存注入）
- Phase 11: smoke 用 curl コマンドの placeholder
