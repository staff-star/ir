function refreshRakutenConfirmationSheet() {
  const result = buildRakutenPhase2Result_();
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.rakutenReview, result.reviewRows, 1);
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.rakutenErrors, result.errorRows, 1);
}

function exportRakutenItemsubCsv() {
  const result = buildRakutenPhase2Result_();
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.rakutenReview, result.reviewRows, 1);
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.rakutenErrors, result.errorRows, 1);

  const exportRows = result.records
    .filter(function (record) { return record.shouldExport; })
    .map(function (record) {
      return RAKUTEN_ITEMSUB_HEADER.map(function (header) {
        return normalizeCellValue_(record.itemsubRow[header]);
      });
    });

  if (exportRows.length === 0) {
    throw new Error('楽天 itemsub の出力対象がありません。publish_rakuten と 楽天エラー一覧 を確認してください。');
  }

  downloadCsvFile_(
    buildExportFileName_('ir-itemsub_楽天', 'csv'),
    [RAKUTEN_ITEMSUB_HEADER].concat(exportRows),
    PHASE1_CONFIG.exportEncoding.rakutenItemsub
  );
}

function buildRakutenPhase2Result_() {
  const sourceRows = readInputRows_();
  const records = sourceRows.map(function (sourceRow, index) {
    return buildRakutenItemsubRecord_(sourceRow, index + 3);
  });

  appendDuplicateProductCodeErrorsByPublishFlag_(records);

  return {
    records: records,
    reviewRows: [RAKUTEN_REVIEW_SCHEMA].concat(records.map(buildRakutenReviewRow_)),
    errorRows: buildErrorRowsFromRecords_(records, RAKUTEN_ERROR_SCHEMA, 'publish_rakuten')
  };
}

function buildRakutenItemsubRecord_(source, sourceRowNumber) {
  const errors = [];
  const normalized = {};
  const defaults = PHASE1_CONFIG.mallSettings.rakuten.defaults;

  normalized.publishFlag = normalizePublishFlag_(source.publish_rakuten);
  normalized.mainProductCode = normalizeProductCode_(source.product_code, errors);
  normalized.mainTitle = resolveTitle_(source, errors);
  normalized.shopName = PHASE1_CONFIG.mallSettings.rakuten.shopName;
  normalized.productCode = normalized.mainProductCode;
  normalized.category = normalizeCategoryLike_(source.category, 'category', '共通カテゴリ', true, errors);
  normalized.rakutenGenreId = normalizeRakutenGenreId_(source.rakuten_genre_id, errors);
  normalized.title = resolveMallTitle_(source.rakuten_title, source.title, 'rakuten_title', '楽天の商品名', errors);
  normalized.catchcopy = trimToString_(source.rakuten_catchcopy) || trimToString_(source.ai_catchcopy);
  normalized.tax = resolveTaxRule_(source.food_flag, errors);
  normalized.salePrice = resolveSalePrice_(source.sale_price, errors);
  normalized.pcDescription = trimToString_(source.rakuten_pc_desc) || trimToString_(source.ai_description_material);
  normalized.salesDescription = trimToString_(source.rakuten_sales_desc);
  normalized.spDescription = trimToString_(source.rakuten_sp_desc) || trimToString_(source.ai_description_material);
  normalized.janCode = normalizeJanCode_(source.jan_code, errors);
  normalized.imageBundle = buildImageBundle_(normalized.productCode, source.image_count, source.image_ext, errors);
  normalized.attributeTemplateKey = trimToString_(source.attribute_template_key);
  normalized.uploadTargetFlag = defaults.uploadTargetFlag;
  normalized.saleStart = defaults.saleStart;
  normalized.saleEnd = defaults.saleEnd;
  normalized.displayPrice = resolveRakutenDisplayPrice_(source.rakuten_display_price, normalized.salePrice, errors);
  normalized.doublePriceTextMode = normalizeRakutenDoublePriceTextMode_(
    source.rakuten_double_price_text_mode,
    defaults.defaultDoublePriceTextMode,
    errors
  );
  normalized.stockReturnFlag = defaults.stockReturnFlag;
  normalized.stockLeadTime = defaults.shippingLeadTimeLabel;
  normalized.availableLeadTimeNumber = defaults.availableLeadTimeCode;
  normalized.outOfStockLeadTime = defaults.outOfStockLeadTime;
  normalized.deliverySetId = normalizeDigitsField_(source.rakuten_delivery_set_id, 'rakuten_delivery_set_id', '楽天の配送方法セット番号', errors, { required: false, maxDigits: 5 });
  normalized.deliveryLeadTime = defaults.deliveryLeadTime;
  normalized.searchVisibleFlag = defaults.searchVisibleFlag;
  normalized.catalogIdNoneReason = defaults.catalogIdNoneReason;
  normalized.pageTemplate = defaults.pageTemplate;
  normalized.headerFooterLeftNavi = defaults.headerFooterLeftNavi;
  normalized.displayOrder = defaults.displayOrder;
  normalized.commonDescSmall = defaults.commonDescSmall;
  normalized.commonDescLarge = defaults.commonDescLarge;
  normalized.shippingCode = deriveRakutenShippingCodeFromDeliverySet_(normalized.deliverySetId);
  normalized.attributeBundle = buildRakutenAttributeBundle_();

  const itemsubRow = createEmptyRowFromHeader_(RAKUTEN_ITEMSUB_HEADER);
  itemsubRow['メインデータの商品コード（楽天URL）'] = normalized.mainProductCode;
  itemsubRow['メインデータの商品名'] = normalized.mainTitle;
  itemsubRow['ショップ名'] = normalized.shopName;
  itemsubRow['商品コード（楽天URL）'] = normalized.productCode;
  itemsubRow['表示先カテゴリ'] = '';
  // 楽天ジャンルIDは ir-item 側で管理するため itemsub では出さない。
  itemsubRow['楽天ジャンルID'] = '';
  itemsubRow['商品名'] = normalized.title;
  itemsubRow['PC用キャッチコピー'] = normalized.catchcopy;
  itemsubRow['消費税'] = normalized.tax.taxFlag;
  itemsubRow['通常購入販売価格'] = normalized.salePrice;
  itemsubRow['PC用商品説明文'] = normalized.pcDescription;
  itemsubRow['PC用商品説明文改行'] = '0';
  itemsubRow['PC用販売説明文'] = normalized.salesDescription;
  itemsubRow['PC用販売説明文改行'] = '0';
  itemsubRow['スマートフォン用商品説明文'] = normalized.spDescription;
  itemsubRow['スマートフォン用商品説明文改行'] = '0';
  itemsubRow['カタログID'] = '';
  itemsubRow['倉庫指定'] = PHASE1_CONFIG.defaultWarehouseFlag;
  itemsubRow['送料'] = normalized.shippingCode;
  itemsubRow['アップロード対象設定'] = normalized.uploadTargetFlag;
  itemsubRow['販売期間（開始）'] = normalized.saleStart;
  itemsubRow['販売期間（終了）'] = normalized.saleEnd;
  itemsubRow['表示価格'] = normalized.displayPrice;
  itemsubRow['二重価格文言'] = normalized.doublePriceTextMode;
  itemsubRow['在庫戻し設定'] = normalized.stockReturnFlag;
  itemsubRow['在庫あり時出荷リードタイム'] = normalized.stockLeadTime;
  itemsubRow['在庫あり時納期管理番号'] = normalized.availableLeadTimeNumber;
  itemsubRow['在庫切れ時納期管理番号'] = normalized.outOfStockLeadTime;
  itemsubRow['配送方法セット管理番号'] = normalized.deliverySetId;
  itemsubRow['配送リードタイム'] = normalized.deliveryLeadTime;
  itemsubRow['サーチ表示'] = normalized.searchVisibleFlag;
  itemsubRow['カタログIDなしの理由'] = normalized.catalogIdNoneReason;
  itemsubRow['商品ページテンプレート'] = normalized.pageTemplate;
  itemsubRow['ヘッダー・フッター・レフトナビ'] = normalized.headerFooterLeftNavi;
  itemsubRow['表示項目の並び順'] = normalized.displayOrder;
  itemsubRow['共通説明文（小）'] = normalized.commonDescSmall;
  itemsubRow['共通説明文（大）'] = normalized.commonDescLarge;

  normalized.attributeBundle.items.forEach(function (item, index) {
    itemsubRow[`商品属性（項目）${index + 1}`] = item.name;
    itemsubRow[`商品属性（値）${index + 1}`] = item.value;
    itemsubRow[`商品属性（単位）${index + 1}`] = item.unit;
  });

  return {
    sourceRowNumber: sourceRowNumber,
    source: source,
    normalized: normalized,
    itemsubRow: itemsubRow,
    errors: errors,
    shouldExport: normalized.publishFlag === '1' && errors.length === 0
  };
}

function buildRakutenReviewRow_(record) {
  return [
    record.sourceRowNumber,
    record.source.publish_rakuten || '',
    record.shouldExport ? '1' : '0',
    record.normalized.mainProductCode || '',
    record.normalized.mainTitle || '',
    record.normalized.shopName || '',
    itemsubValue_(record, '表示先カテゴリ'),
    record.source.rakuten_genre_id || '',
    itemsubValue_(record, '楽天ジャンルID'),
    record.normalized.salePrice || '',
    record.source.rakuten_display_price || '',
    record.normalized.displayPrice || '',
    record.source.rakuten_double_price_text_mode || '',
    record.normalized.doublePriceTextMode || '',
    record.normalized.deliverySetId || '',
    record.normalized.shippingCode || '',
    record.normalized.stockReturnFlag || '',
    record.normalized.stockLeadTime || '',
    record.normalized.availableLeadTimeNumber || '',
    record.normalized.outOfStockLeadTime || '',
    record.normalized.deliveryLeadTime || '',
    record.normalized.searchVisibleFlag || '',
    record.normalized.pageTemplate || '',
    record.normalized.headerFooterLeftNavi || '',
    record.normalized.displayOrder || '',
    record.normalized.commonDescSmall || '',
    record.normalized.commonDescLarge || '',
    record.normalized.attributeTemplateKey || '',
    String(record.normalized.attributeBundle.count || 0),
    itemsubValue_(record, '商品属性（項目）1'),
    itemsubValue_(record, '商品属性（値）1'),
    itemsubValue_(record, '商品属性（単位）1'),
    itemsubValue_(record, 'PC用商品説明文改行'),
    itemsubValue_(record, 'PC用販売説明文改行'),
    itemsubValue_(record, 'スマートフォン用商品説明文改行'),
    String(record.errors.length),
    buildErrorMessages_(record.errors)
  ];
}

function deriveRakutenShippingCodeFromDeliverySet_(deliverySetId) {
  if (deliverySetId === '5') {
    return '1';
  }
  if (deliverySetId === '2') {
    return '0';
  }
  return '';
}

function resolveRakutenDisplayPrice_(displayPriceValue, salePrice, errors) {
  const normalizedValue = normalizeDigitsField_(
    displayPriceValue,
    'rakuten_display_price',
    '楽天の表示価格',
    errors,
    { required: false, maxDigits: PHASE1_CONFIG.maxPriceDigits }
  );
  return normalizedValue || salePrice || '';
}

function normalizeRakutenDoublePriceTextMode_(value, defaultValue, errors) {
  return normalizeChoiceField_(
    value,
    'rakuten_double_price_text_mode',
    '楽天の二重価格文言',
    errors,
    ['0', '1', '2'],
    { defaultValue: trimToString_(defaultValue) }
  );
}

function buildRakutenAttributeBundle_() {
  return {
    count: 0,
    items: []
  };
}

function itemsubValue_(record, key) {
  return record.itemsubRow[key] || '';
}
