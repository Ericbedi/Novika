import {
  ProductReceiptContent,
  Receipt,
  ReceiptMessageTemplate,
  ReceiptSettings,
  MessageOptout,
} from "@/server/data/receipt-types";
import { DEFAULT_RECEIPT_SETTINGS, DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/receipts-engine";

export const MOCK_RECEIPT_SETTINGS: ReceiptSettings = {
  ...DEFAULT_RECEIPT_SETTINGS,
  storeId: "store_lome_01",
};

export const MOCK_PRODUCT_RECEIPT_CONTENTS: Record<string, ProductReceiptContent> = {};

export const MOCK_MESSAGE_OPTOUTS: MessageOptout[] = [];

export const MOCK_RECEIPTS_DATA: Receipt[] = [];
