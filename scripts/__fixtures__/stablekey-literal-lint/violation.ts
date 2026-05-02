// Phase 6 違反 fixture: stableKey を直書きしている（許可外モジュール）。
// このファイルは scope 外（__fixtures__/）なので本番 lint では無視される。
// テスト時にだけ rule に渡して FAIL することを確認する。

export const wrong = {
  fullName: "fullName",
  nickname: "nickname",
  ubmZone: "ubmZone",
};
