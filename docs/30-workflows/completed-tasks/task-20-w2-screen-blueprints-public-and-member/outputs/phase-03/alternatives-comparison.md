# 代替案比較

| 案 | 形態 | pros | cons | 判定 |
| --- | --- | --- | --- | --- |
| A | 09-ui-ux.md に全画面統合 | 1 ファイル参照で完結 | task-06 owner と competing edit、ファイルが 2000+ 行に膨張、layer 境界が消失 | NG |
| B | 画面ごと 1 ファイル（09e1〜09e6 / 09f1〜09f2） | 画面単位の差分管理しやすい | ファイル数増（8 ファイル）、9 series 命名規則と乖離、下流 task-11..14 が複数ファイル参照になる | NG |
| C | 公開層 09e / 会員層 09f に分離（採用） | layer 境界明確、9 series 命名規則整合、下流が 1 task 1 ファイル参照、並列 task-21 admin (09g) と層構造一致 | 1 ファイル中規模（700 行前後）になる | **採用** |

## 採用根拠

- ui-prototype-alignment-mvp-recovery の routes 階層（公開 / 会員 / 管理）に対し、spec source 側でも同じ 3 層に分解する方針を維持。
- task-21 (admin = 09g) と本タスク (public = 09e / member = 09f) で記述構造を共通化することで、後続 review コストを下げる。
