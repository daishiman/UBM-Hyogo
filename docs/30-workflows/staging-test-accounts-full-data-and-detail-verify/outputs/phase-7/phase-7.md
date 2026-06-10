# Phase 7 — カバレッジ確認

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

> 本フェーズは今回のlocal実装が実コードを書いた後に「変更行の保護確認」を行うための、**局所カバレッジ**方針を確定する。
> 本タスクは既存ファイルの拡充が中心（catalog の profile データ追加 / build-seed-sql の汎用性確認 / 公開詳細 adapter・component の検証 + ギャップ時のみ最小修正）であり、**リポジトリ全体の一律閾値ではなく、本サイクルで触れたファイル・関数・ブロックの line/branch 実測のみ**を残す（FB: 「変更行の保護確認」）。

---

## 1. カバレッジ対象範囲（広域指定でなく局所）

本サイクルで実際に編集した箇所のみを対象とする。下表の「対象ブロック」は今回のlocal実装が触れた範囲に応じて確定し、未編集ファイルは対象に含めない。

| 対象 | 種別 | レーン | 期待カバレッジ | 備考 |
|------|------|--------|---------------|------|
| `apps/api/src/testing/test-accounts/catalog.ts` | pure 定数 + 型 | A | Statements / Lines 100% | 拡充した TEST-MEM-01..10 の `profile` リテラルは catalog.spec の参照で到達。実行コードを持たない定数は到達容易 |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | pure 関数 | A | Statements / Lines / Branches **100%**（編集した範囲のみ） | profile 全キーを `response_fields` / `schema_questions`(visibility) へ展開する分岐、空値スキップ分岐、escape 分岐を catalog 10 member で網羅 |
| `apps/web/src/lib/adapters/member-detail.ts` | pure 関数 | B | **変更したブロックのみ** Lines / Branches 100% | ギャップ修正が無ければ既存カバレッジ維持（新規行 0）。KIND_ROUTE / ASSIGNED_DETAIL_KEYS / 全項目入力判定に手を入れた場合のみ、その分岐を fixture full/all-fields/edge で両側踏破 |
| `apps/web/src/components/public/*.tsx` | view component | B | **変更したブロックのみ** Lines 100% | 全項目入力描画・条件付き非表示に手を入れた場合のみ。未編集なら対象外 |

### branch 100% を満たす根拠（catalog / fixture による網羅）

- **build-seed-sql の profile 展開ループ**: フル（01/06/07）が全 31 stable_key の非空側、09 が一部 optional の**空値スキップ側**、10 がエッジ値（長文/絵文字/特殊文字/全 URL）の escape 側をそれぞれ踏む。
- **build-seed-sql の visibility 分岐**: public / member / admin の 3 値すべてが catalog の stable_key にまたがって出現するため、`schema_questions` の visibility 行生成が 3 分岐とも踏破される。
- **member-detail adapter の全項目入力判定**（編集した場合）: 09 fixture（motto/hobbies/otherActivities/recentInterest 空・SNS 一部のみ）が「空 → `—` fallback / 条件付き非表示」側、01/06 fixture（フル）が「値あり → 描画」側を踏む。
- **adapter の visibility 二重防御**（編集した場合）: birthDate/ubmJoinDate/challenges（member/admin）が公開 view から除外される側、public 29 項目が通過する側を踏む。

> ギャップが見つからず Lane B が「検証 + fixture/spec 追補」に縮退した場合、member-detail.ts / components の**新規実行行は 0** となる。その場合は「変更行 0 ＝ 既存カバレッジ維持」を記録し、新規カバレッジ計測は不要（spec 追補によるカバレッジ向上は副次効果として許容するが、閾値ゲートは課さない）。

---

## 2. 確認コマンド（vitest --coverage の targeted）

```bash
# Lane A: pure ロジック（catalog / build-seed-sql）を test-accounts 配下に限定して計測
mise exec -- pnpm exec vitest run --coverage \
  --coverage.include="apps/api/src/testing/test-accounts/**/*.ts" \
  apps/api/src/testing/test-accounts \
  --config=vitest.config.ts

# Lane A: in-memory D1 投入 + drift guard（カバレッジは付けず機能検証）
mise exec -- pnpm exec vitest run \
  apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts \
  --config=vitest.d1.config.ts

# Lane B: 公開詳細 adapter を限定して計測（ギャップ修正した場合のみ実値を残す）
mise exec -- pnpm exec vitest run --coverage \
  --coverage.include="apps/web/src/lib/adapters/member-detail.ts" \
  apps/web/src/lib/adapters/__tests__/member-detail.spec.ts \
  --config=vitest.config.ts

# Lane B: 公開 component（全項目入力描画に手を入れた場合のみ）
mise exec -- pnpm exec vitest run --coverage \
  --coverage.include="apps/web/src/components/public/**/*.tsx" \
  apps/web/src/components/public/__tests__ \
  --config=vitest.config.ts
```

- `--coverage.include` で対象を**本サイクルで触れたファイルに限定**し、広域な一律閾値計測を避ける。
- Lane B でギャップ修正が無い（新規実行行 0）場合、4 番目以降のコマンドは「既存 spec が全 PASS する」ことの確認に留め、カバレッジ実値は「変更行なし＝維持」と記録する。

---

## 3. カバレッジ対象外（別カウント・本タスクでは計上しない）

| 対象 | 理由 |
|------|------|
| `scripts/seed-test-accounts.sh` | shell スクリプト。vitest の line coverage 対象外。production 拒否分岐は Phase 9 の手順（`--env production` 拒否確認）で別途検証 |
| `scripts/gen-test-accounts-seed.mjs` | node スクリプト（書き出し I/O）。実行系は drift guard（再生成 byte 一致 / `--check` exit code）で機能保証し、行カバレッジは計上しない |
| `apps/web/src/fixtures/public-member-profile.ts` | テスト fixture（データ定義）。spec から参照されるデータであり、プロダクションコードの被計測対象ではない |
| `apps/api/migrations/seed/test-accounts-seed.sql` 等 生成物 | SQL データファイル。コードではないため line coverage 対象外。投入後の挙動は contract.spec が機能保証 |

---

## 4. 変更行の保護確認方針

- 本タスクの編集は (1) catalog.ts の `profile` リテラル拡充（データ）、(2) build-seed-sql.ts の汎用性確認 + 必要時の最小一般化、(3) Lane B のギャップ時最小修正、が中心。**いずれも局所**であり、変更したブロック・分岐のみを保護確認の対象とする。
- 局所カバレッジが 100% に満たない行が出た場合の対応:
  - 到達不能な防御分岐（理論上起き得ない `default` / `throw`）→ Phase 8 リファクタで削減、または `/* v8 ignore */` を最小範囲で付与し理由をコメント。
  - ケース不足（fixture が分岐を踏ませていない）→ Phase 6 へ戻り full/all-fields/edge fixture にケースを追加して branch を踏ませる（catalog / fixture の網羅性で踏破する方針を優先し、人工的な mock 増殖はしない）。
- Lane B がギャップなしで縮退した場合は「member-detail.ts / public components の変更行 0 ＝ 既存カバレッジ維持」を Phase 7 の結論として明記する。

---

## 5. ゲート（DoD 連動）

- [ ] `catalog.ts` の拡充箇所が catalog.spec の参照で全到達（Statements / Lines 100%）
- [ ] `build-seed-sql.ts` の編集ブロックが Statements / Lines / Branches 100%（profile 展開 / visibility 3 分岐 / escape を catalog 10 member で踏破）
- [ ] contract.spec（in-memory D1 投入 + drift guard）が全 PASS
- [ ] Lane B でギャップ修正した場合、`member-detail.ts` の変更ブロックが Lines / Branches 100%（full/all-fields/edge fixture で全項目入力と二重防御の両側踏破）。ギャップなしの場合は「変更行 0 ＝ 維持」を記録
- [ ] 局所計測のみで、リポジトリ全体の一律閾値計測は課していないこと

## 完了条件

- 本サイクルで触れた catalog.ts / build-seed-sql.ts / （ギャップ時のみ）member-detail.ts・public components の**局所** line/branch カバレッジ実測方針を確定した。広域指定でなく `--coverage.include` で対象を限定する targeted コマンドを定義した。変更行の保護確認方針（縮退時は「変更行 0 ＝ 維持」記録）を明記した。Phase 8 リファクタリングへ進む。
