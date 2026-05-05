// Phase 6 エッジ fixture: 静的テンプレートリテラルと非 stableKey ダミーリテラル。

// 静的テンプレートリテラル → 違反として検出されるべき
export const fromTemplate = `publicConsent`;

// 非 stableKey の単なる識別子文字列 → 検出されないべき
export const dummy = "fooBarBaz";
