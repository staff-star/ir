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
  normalized.productCode = normalizeProductCode_(source.product_code, errors);
  normalized.title = resolveMallTitle_(source.rakuten_title, source.title, 'rakuten_title', '楽天の商品名', errors);
  normalized.category = normalizeCategoryLike_(source.category, 'category', '共通カテゴリ', true, errors);
  normalized.catchcopy = trimToString_(source.rakuten_catchcopy) || trimToString_(source.ai_catchcopy);
  normalized.pcDescription = trimToString_(source.rakuten_pc_desc) || trimToString_(source.ai_description_material);
  normalized.salesDescription = trimToString_(source.rakuten_sales_desc);
  normalized.spDescription = trimToString_(source.rakuten_sp_desc) || trimToString_(source.ai_description_material);
  normalized.salePrice = resolveSalePrice_(source.sale_price, errors);
  normalized.displayPrice = resolveDisplayPrice_(normalized.salePrice);
  normalized.tax = resolveTaxRule_(source.food_flag, errors);
  normalized.janCode = normalizeJanCode_(source.jan_code, errors);
  normalized.imageBundle = buildImageBundle_(normalized.productCode, source.image_count, source.image_ext, errors);
  normalized.deliverySetId = normalizeDigitsField_(source.rakuten_delivery_set_id, 'rakuten_delivery_set_id', '楽天の配送方法セット番号', errors, { required: false, maxDigits: 5 });
  normalized.deliveryLeadTime = normalizeDigitsField_(source.rakuten_delivery_lead_time, 'rakuten_delivery_lead_time', '楽天の在庫あり時納期番号', errors, { required: false, maxDigits: 5 });
  normalized.shippingCode = deriveRakutenShippingCodeFromDeliverySet_(normalized.deliverySetId);
  normalized.saleStart = defaults.saleStart;
  normalized.saleEnd = defaults.saleEnd;
  normalized.stockLeadTime = defaults.stockLeadTime;
  normalized.outOfStockLeadTime = defaults.outOfStockLeadTime;
  normalized.stockManagementId = defaults.stockManagementId;
  normalized.searchVisibleFlag = defaults.searchVisibleFlag;
  normalized.doublePriceText = defaults.doublePriceText;

  const itemsubRow = createEmptyRowFromHeader_(RAKUTEN_ITEMSUB_HEADER);
  itemsubRow['メインデータの商品コード（楽天URL）'] = normalized.productCode;
  itemsubRow['ショップ名'] = PHASE1_CONFIG.mallSettings.rakuten.shopName;
  itemsubRow['商品コード（楽天URL）'] = normalized.productCode;
  itemsubRow['楽天商品番号'] = normalized.productCode;
  itemsubRow['ショップ内カテゴリ'] = normalized.category;
  itemsubRow['商品名'] = normalized.title;
  itemsubRow['PC用キャッチコピー'] = normalized.catchcopy;
  itemsubRow['消費税'] = normalized.tax.taxFlag;
  itemsubRow['販売価格'] = normalized.salePrice;
  itemsubRow['PC用商品説明文'] = normalized.pcDescription;
  itemsubRow['PC用商品説明文改行'] = normalized.pcDescription ? '1' : '0';
  itemsubRow['PC用販売説明文'] = normalized.salesDescription;
  itemsubRow['PC用販売説明文改行'] = normalized.salesDescription ? '1' : '0';
  itemsubRow['スマートフォン用商品説明文'] = normalized.spDescription;
  itemsubRow['スマートフォン用商品説明文改行'] = normalized.spDescription ? '1' : '0';
  itemsubRow['カタログID'] = normalized.janCode;
  itemsubRow['在庫連動'] = normalized.stockManagementId;
  itemsubRow['倉庫指定'] = PHASE1_CONFIG.defaultWarehouseFlag;
  itemsubRow['送料'] = normalized.shippingCode;
  itemsubRow['アップロード対象設定'] = '1';
  itemsubRow['販売期間（開始）'] = normalized.saleStart;
  itemsubRow['販売期間（終了）'] = normalized.saleEnd;
  itemsubRow['表示価格'] = normalized.displayPrice;
  itemsubRow['二重価格文言'] = normalized.doublePriceText;
  itemsubRow['在庫あり時納期管理番号'] = normalized.deliveryLeadTime;
  itemsubRow['在庫切れ時納期管理番号'] = normalized.outOfStockLeadTime;
  itemsubRow['配送方法セット管理番号'] = normalized.deliverySetId;
  itemsubRow['サーチ非表示'] = normalized.searchVisibleFlag;

  normalized.imageBundle.urls.forEach(function (url, index) {
    itemsubRow[`商品画像${index + 1}`] = url;
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
    record.normalized.productCode || '',
    record.normalized.title || '',
    record.normalized.category || '',
    record.source.sale_price || '',
    record.normalized.salePrice || '',
    record.source.rakuten_delivery_set_id || '',
    record.normalized.deliverySetId || '',
    record.normalized.shippingCode || '',
    record.source.rakuten_delivery_lead_time || '',
    record.normalized.deliveryLeadTime || '',
    record.normalized.outOfStockLeadTime || '',
    record.normalized.stockManagementId || '',
    record.normalized.searchVisibleFlag || '',
    record.normalized.doublePriceText || '',
    record.normalized.saleStart || '',
    record.normalized.saleEnd || '',
    record.normalized.imageBundle.urls[0] || '',
    record.normalized.imageBundle.urls[1] || '',
    record.normalized.pcDescription || '',
    record.normalized.salesDescription || '',
    record.normalized.spDescription || '',
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
