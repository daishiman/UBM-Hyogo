# Phase 9: リスクと緩和策

| ID | リスク | 影響 | 緩和策 |
|----|--------|------|--------|
| R-01 | `DISPLAYABLE_KINDS` allowlist が `FieldKindZ` enum 拡張に追従しない | 新 kind が detail UI に出ない | Phase 5 注記で記録し、enum 変更時は adapter test へ display / non-display の期待を追加 |
| R-02 | adapter 移管で render 順序が変わり visual snapshot diff 発生 | snapshot CI fail | Phase 6 で「順序保存」を明文化、`map → filter` 順で実装 |
| R-03 | `allSections` を `MemberLinks` / `MemberActivity` に渡すと既存挙動が変わる | 描画差分 | 既存も `profile.publicSections` 全件を渡していたため等価。ユニット/visual で確認 |
| R-04 | adapter 内 spread (`{ ...s }`) でも `fields` 参照は共有のため mutation で漏出 | pure function 違反 | filter は新配列を返すため安全。TC-A-06 で immutability 検証 |
| R-05 | `MemberDetailSections.component.spec.tsx` の既存 TC-U-03 削除で coverage 低下 | カバレッジ gate 警告 | adapter TC-A-03 で代替、合計カバレッジは増加方向 |

## 撤退条件

- visual snapshot diff が render 不変前提を破る場合は、render 順序を element 単位で比較し adapter ロジックを修正。snapshot baseline 更新は実施しない。
