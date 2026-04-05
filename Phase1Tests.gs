function runPhase1Tests() {
  assertEquals_('abc-123', normalizeProductCode_(' ＡＢＣ 123 ', []), 'product_code 正規化');
  assertEquals_('|683|530|', normalizeCategory_('683,530', []), 'カテゴリ整形');
  assertEquals_('1', resolveTaxRule_('reduced', []).reducedTaxRateFlag, '軽減税率');
  assertEquals_('1480', resolveSalePrice_('', '1480', []), '価格フォールバック');

  const imageErrors = [];
  const images = buildImageBundle_('sample-code', '3', 'png', '1', imageErrors);
  assertEquals_(0, imageErrors.length, '画像生成エラーなし');
  assertEquals_(4, images.urls.length, '画像 URL 数');
  assertEquals_(
    'http://r-asp02.item-robot.com/upload/images/1681/sample-code/w.png',
    images.urls[3],
    '白背景画像 URL'
  );

  const headerCount = IR_ITEM_HEADER.length;
  assertEquals_(393, headerCount, 'ir-item ヘッダ数');

  SpreadsheetApp.getUi().alert('Phase1 テストが完了しました。');
}

function assertEquals_(expected, actual, label) {
  if (expected !== actual) {
    throw new Error(`${label}: expected=${expected}, actual=${actual}`);
  }
}
