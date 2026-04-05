function runPhase1Tests() {
  assertEquals_('abc-123', normalizeProductCode_('ABC 123', []), 'product_code 正規化');
  assertEquals_('サンプル商品', resolveTitle_({ title: 'サンプル商品' }, []), '共通商品名');
  assertEquals_('|683|530|', normalizeCategory_('683,530', []), 'カテゴリ整形');
  assertEquals_('100227', normalizeRakutenGenreId_('100227', []), '楽天ジャンルID');
  assertEquals_('1001100', normalizeYahooProductCategory_('1001100', []), 'Yahooカテゴリ');
  assertEquals_('1480', resolveSalePrice_('1480', []), '販売価格');
  assertEquals_('1480', resolveRakutenDisplayPrice_('', '1480', []), '楽天表示価格 fallback');
  assertEquals_('1280', resolveRakutenDisplayPrice_('1280', '1480', []), '楽天表示価格の個別値');
  assertEquals_('2', normalizeRakutenDoublePriceTextMode_('2', '', []), '楽天二重価格文言 2');
  assertEquals_('1', resolveTaxRule_('1', []).reducedTaxRateFlag, 'food_flag=1');
  assertEquals_('10', resolveTaxRule_('0', []).taxRate, 'food_flag=0');
  assertEquals_('1', deriveRakutenShippingCodeFromDeliverySet_('5'), '楽天配送セット 5');
  assertEquals_('0', deriveRakutenShippingCodeFromDeliverySet_('2'), '楽天配送セット 2');
  assertEquals_('', deriveRakutenShippingCodeFromDeliverySet_('9'), '楽天配送セット その他');

  const imageErrors = [];
  const images = buildImageBundle_('sample-code', '3', 'png', imageErrors);
  assertEquals_(0, imageErrors.length, '画像生成エラー');
  assertEquals_(3, images.urls.length, '画像URL数');
  assertTrue_(images.urls.every(function (url) { return url.indexOf('/w.') === -1; }), '白背景画像なし');

  const phase1Record = buildPhase1Record_({
    product_code: 'sample-product',
    title: 'サンプル商品',
    category: '683|530',
    rakuten_genre_id: '100227',
    yahoo_product_category: '1001100',
    sale_price: '1480',
    jan_code: '4542320580542',
    food_flag: '1',
    image_count: '3',
    image_ext: 'png',
    ai_catchcopy: '毎日使いやすい',
    ai_description_material: '説明文',
    attribute_template_key: '',
    note: '',
    publish_phase1: '1',
    publish_rakuten: '1',
    publish_yahoo: '1'
  }, 3);
  assertEquals_('100227', phase1Record.irItemRow['楽天ジャンルID'], 'ir-item 楽天ジャンルID');
  assertEquals_('1001100', phase1Record.irItemRow['yahooプロダクトカテゴリ'], 'ir-item Yahooカテゴリ');
  assertEquals_(0, phase1Record.errors.length, 'Phase1 record errors');

  const originalLoadRakutenAttributeTemplateRows = loadRakutenAttributeTemplateRows_;
  try {
    loadRakutenAttributeTemplateRows_ = function () { return []; };
    const rakutenErrorRecord = buildRakutenItemsubRecord_({
      product_code: 'sample-product',
      title: '共通商品名',
      category: '683|530',
      rakuten_genre_id: '100227',
      yahoo_product_category: '1001100',
      sale_price: '1480',
      jan_code: '4542320580542',
      food_flag: '1',
      image_count: '2',
      image_ext: 'jpg',
      ai_catchcopy: '共通キャッチ',
      ai_description_material: '共通説明',
      rakuten_title: '楽天商品名',
      rakuten_catchcopy: '楽天キャッチ',
      rakuten_pc_desc: '楽天PC説明',
      rakuten_sales_desc: '楽天販売説明',
      rakuten_sp_desc: '楽天スマホ説明',
      rakuten_delivery_set_id: '5',
      attribute_template_key: 'default',
      publish_rakuten: '1'
    }, 3);
    assertTrue_(
      rakutenErrorRecord.errors.some(function (error) { return error.code === 'RAKUTEN_GENRE_REQUIRES_ATTRIBUTES'; }),
      '楽天ジャンルIDだけで属性なしはエラー'
    );

    loadRakutenAttributeTemplateRows_ = function () {
      return [
        { sourceRowNumber: 2, sortNo: '2', name: '内容量', value: '200', unit: 'g' },
        { sourceRowNumber: 3, sortNo: '1', name: '原産地', value: '京都', unit: '府' }
      ];
    };

    const rakutenRecord = buildRakutenItemsubRecord_({
      product_code: 'sample-product',
      title: '共通商品名',
      category: '683|530',
      rakuten_genre_id: '100227',
      yahoo_product_category: '1001100',
      sale_price: '1480',
      jan_code: '4542320580542',
      food_flag: '1',
      image_count: '2',
      image_ext: 'jpg',
      ai_catchcopy: '共通キャッチ',
      ai_description_material: '共通説明',
      rakuten_title: '楽天商品名',
      rakuten_catchcopy: '楽天キャッチ',
      rakuten_pc_desc: '楽天PC説明',
      rakuten_sales_desc: '楽天販売説明',
      rakuten_sp_desc: '楽天スマホ説明',
      rakuten_delivery_set_id: '5',
      rakuten_display_price: '1280',
      rakuten_double_price_text_mode: '1',
      attribute_template_key: 'default',
      publish_rakuten: '1'
    }, 3);
    assertEquals_('sample-product', rakutenRecord.itemsubRow['メインデータの商品コード（楽天URL）'], '楽天 先頭1列');
    assertEquals_('共通商品名', rakutenRecord.itemsubRow['メインデータの商品名'], '楽天 先頭2列');
    assertEquals_('美味セレクト楽天市場店', rakutenRecord.itemsubRow['ショップ名'], '楽天 先頭3列');
    assertEquals_('100227', rakutenRecord.itemsubRow['楽天ジャンルID'], '楽天 genre');
    assertEquals_('1480', rakutenRecord.itemsubRow['通常購入販売価格'], '楽天 通常価格');
    assertEquals_('1280', rakutenRecord.itemsubRow['表示価格'], '楽天 表示価格');
    assertEquals_('1', rakutenRecord.itemsubRow['二重価格文言'], '楽天 二重価格文言');
    assertEquals_('1', rakutenRecord.itemsubRow['送料'], '楽天 送料導出');
    assertEquals_('原産地', rakutenRecord.itemsubRow['商品属性（項目）1'], '楽天 属性1 項目');
    assertEquals_('京都', rakutenRecord.itemsubRow['商品属性（値）1'], '楽天 属性1 値');
    assertEquals_('府', rakutenRecord.itemsubRow['商品属性（単位）1'], '楽天 属性1 単位');
    assertEquals_('内容量', rakutenRecord.itemsubRow['商品属性（項目）2'], '楽天 属性2 項目');
    assertEquals_('200', rakutenRecord.itemsubRow['商品属性（値）2'], '楽天 属性2 値');
    assertEquals_('g', rakutenRecord.itemsubRow['商品属性（単位）2'], '楽天 属性2 単位');
    assertEquals_('0', rakutenRecord.itemsubRow['PC用商品説明文改行'], '楽天 改行0');
    assertEquals_('1', rakutenRecord.itemsubRow['サーチ表示'], '楽天 サーチ表示');
    assertEquals_(0, rakutenRecord.errors.length, '楽天 record errors');

    const rakutenFallbackRecord = buildRakutenItemsubRecord_({
      product_code: 'sample-fallback',
      title: '共通商品名',
      category: '683|530',
      rakuten_genre_id: '100227',
      yahoo_product_category: '1001100',
      sale_price: '1980',
      jan_code: '4542320580542',
      food_flag: '1',
      image_count: '1',
      image_ext: 'jpg',
      ai_catchcopy: '共通キャッチ',
      ai_description_material: '共通説明',
      rakuten_delivery_set_id: '2',
      attribute_template_key: 'default',
      publish_rakuten: '1'
    }, 4);
    assertEquals_('1980', rakutenFallbackRecord.itemsubRow['表示価格'], '楽天 表示価格 fallback');

    const yahooRecord = buildYahooItemsubRecord_({
      product_code: 'sample-product',
      title: '共通商品名',
      category: '683|530',
      yahoo_product_category: '1001100',
      sale_price: '1480',
      jan_code: '4542320580542',
      food_flag: '1',
      ai_catchcopy: '共通キャッチ',
      ai_description_material: '共通説明',
      yahoo_title: 'Yahoo商品名',
      yahoo_catchcopy: 'Yahooキャッチ',
      yahoo_desc: 'Yahoo説明',
      yahoo_sp_free: 'Yahooスマホ',
      yahoo_shipping_group_id: '2',
      publish_yahoo: '1'
    }, 3);
    assertEquals_('sample-product', yahooRecord.itemsubRow['メインデータの商品コード（楽天URL）'], 'Yahoo 先頭1列');
    assertEquals_('共通商品名', yahooRecord.itemsubRow['メインデータの商品名'], 'Yahoo 先頭2列');
    assertEquals_('美味セレクト Yahoo店', yahooRecord.itemsubRow['ショップ名'], 'Yahoo 先頭3列');
    assertEquals_('0', yahooRecord.itemsubRow['隠しページ設定'], 'Yahoo 隠しページ設定');
    assertEquals_('', yahooRecord.itemsubRow['ページ公開'], 'Yahoo ページ公開');
    assertEquals_('0', yahooRecord.itemsubRow['商品情報改行フラグ'], 'Yahoo 商品情報改行');
    assertEquals_('0', yahooRecord.itemsubRow['商品説明改行フラグ'], 'Yahoo 商品説明改行');
    assertEquals_('0', yahooRecord.itemsubRow['フリースペース（スマホのみ）改行フラグ'], 'Yahoo フリースペース改行');
    assertEquals_('1', yahooRecord.itemsubRow['ポイント倍率設定区分'], 'Yahoo ポイント区分');
    assertEquals_('0', yahooRecord.itemsubRow['商品別ポイント倍率'], 'Yahoo ポイント倍率');
    assertEquals_('0', yahooRecord.itemsubRow['在庫数を超えた注文'], 'Yahoo 在庫超過');
    assertEquals_(0, yahooRecord.errors.length, 'Yahoo record errors');
  } finally {
    loadRakutenAttributeTemplateRows_ = originalLoadRakutenAttributeTemplateRows;
  }

  assertEquals_(393, IR_ITEM_HEADER.length, 'ir-item ヘッダ数');
  assertEquals_(117, RAKUTEN_ITEMSUB_HEADER.length, '楽天 itemsub ヘッダ数');
  assertEquals_(24, YAHOO_ITEMSUB_HEADER.length, 'Yahoo itemsub ヘッダ数');
  assertEquals_(30, PHASE1_INPUT_SCHEMA.length, '中間入力列数');
  assertEquals_(5, RAKUTEN_ATTRIBUTE_TEMPLATE_HEADER.length, '楽天属性テンプレート列数');

  SpreadsheetApp.getUi().alert('Phase1 / Phase2 のテストが完了しました。');
}

function assertEquals_(expected, actual, label) {
  if (expected !== actual) {
    throw new Error(`${label}: expected=${expected}, actual=${actual}`);
  }
}

function assertTrue_(condition, label) {
  if (!condition) {
    throw new Error(`${label}: expected true`);
  }
}
