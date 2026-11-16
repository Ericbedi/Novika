export type ShippingZoneType = "local" | "expedition" | "not_served";
export type PaymentMode = "cod" | "prepaid" | "cod_pickup";

export interface PickupPoint {
  id: string;
  carrierId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  openingHours: string;
}

export interface Carrier {
  id: string;
  name: string;
  logo?: string;
  whatsapp: string;
  phone: string;
  supportedPaymentModes: PaymentMode[];
  averageDeliveryDays: string;
  pickupPoints: PickupPoint[];
  sellerReferenceRate: number; // Coût supporté par le vendeur (ex: 2500 FCFA), JAMAIS facturé au client
}

export interface CityZoneConfig {
  city: string;
  countryCode: string;
  zoneType: ShippingZoneType;
  paymentMode: PaymentMode;
  carrierId?: string;
  defaultPickupPointId?: string;
  estimatedDeliveryTime: string;
  sellerCost: number; // Coût supporté par le vendeur
  clientDeliveryFee: 0; // Toujours 0 FCFA (règle absolue plateforme)
}

export interface PaymentProof {
  id: string;
  orderId: string;
  orderNumber: string;
  transactionReference: string; // Numéro de transaction unique (infalsifiable)
  paymentMethod: "tmoney" | "flooz" | "wave" | "orange_money" | "mtn_momo" | "bank_transfer";
  senderName: string;
  senderPhone: string;
  amount: number;
  currency: string;
  screenshotUrl?: string;
  status: "pending_verification" | "verified" | "rejected";
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  submittedAt: string;
}

export interface SellerPaymentMethod {
  id: string;
  provider: "tmoney" | "flooz" | "wave" | "orange_money" | "mtn_momo" | "bank_transfer";
  providerName: string;
  accountNumber: string;
  accountName: string;
  instructions: string;
  isActive: boolean;
}
