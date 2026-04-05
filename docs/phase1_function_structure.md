# GAS の関数構成

## エントリポイント
- `onOpen()`: カスタムメニュー追加
- `initializePhase1Workbook()`: 3 シート初期化
- `refreshConfirmationSheet()`: 整形・検証・確認用/エラー一覧更新
- `exportIntermediateCsv()`: 中間入力を UTF-8 CSV として Drive 出力
- `exportIrItemCsv()`: `ir-item.csv` を Shift_JIS / CRLF で Drive 出力
- `runPhase1Tests()`: 純関数の簡易テスト

## 主要内部関数
- `buildPhase1Result_()`: 全行処理とレビュー行/エラー行組み立て
- `buildPhase1Record_()`: 1 行分の整形と `ir-item.csv` 行生成
- `appendDuplicateProductCodeErrors_()`: publish 対象内の重複検出
- `readInputRows_()`: `中間入力` シート読取
- `createCsvFile_()`: CSV Blob を Drive 出力

## 正規化関数
- `normalizeProductCode_()`
- `resolveTitle_()`
- `normalizeCategory_()`
- `resolveSalePrice_()`
- `resolveDisplayPrice_()`
- `resolveTaxRule_()`
- `normalizeZeroOneField_()`
- `normalizeJanCode_()`
- `buildImageBundle_()`
