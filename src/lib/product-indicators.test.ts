import { describe, it, expect } from "vitest";
import {
  calculateProductIndicators,
  filterDeliveredOrdersByPeriod,
  IndicatorPeriod,
} from "./product-indicators";
import { Product, Order } from "@/server/data/types";

describe("Prompt 17 - Product Indicators Calculator", () => {
  const mockProducts: Product[] = [
    {
      id: "prod-1",
      name: "Sérum Éclat Vitamine C",
      slug: "serum-eclat-vitamine-c",
      description: "Sérum éclat",
      category: "Soins Visage",
      collection: "Soins",
      salePrice: 15000,
      costPrice: 5000,
      stock: 50,
      availableStock: 50,
      status: "in_stock",
      trackQuantity: true,
      variants: [],
      images: [],
      quantityOffers: [],
      badgesConfig: {} as any,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prod-2",
      name: "Crème Hydratante Karité",
      slug: "creme-hydratante-karite",
      description: "Crème karité",
      category: "Soins Visage",
      collection: "Soins",
      salePrice: 10000,
      costPrice: 3000,
      stock: 10,
      availableStock: 10,
      status: "in_stock",
      trackQuantity: true,
      variants: [],
      images: [],
      quantityOffers: [],
      badgesConfig: {} as any,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prod-3",
      name: "Savon Noir Purifiant",
      slug: "savon-noir-purifiant",
      description: "Savon purifiant",
      category: "Hygiène",
      collection: "Corps",
      salePrice: 5000,
      costPrice: 1500,
      stock: 5,
      availableStock: 5,
      status: "in_stock",
      trackQuantity: true,
      variants: [],
      images: [],
      quantityOffers: [],
      badgesConfig: {} as any,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];

  const referenceNow = new Date("2026-11-20T12:00:00Z").getTime();
  const dateWithin2Days = new Date("2026-11-19T10:00:00Z").toISOString();
  const dateWithin10Days = new Date("2026-11-12T10:00:00Z").toISOString();
  const dateOld = new Date("2026-06-01T10:00:00Z").toISOString();

  const mockOrders = [
    {
      id: "ord-1",
      orderNumber: "NOV-001",
      customerName: "Amina Diallo",
      customerPhone: "+22890000001",
      city: "Lomé",
      deliveryAddress: "Centre ville",
      status: "delivered", // LIVRÉE
      totalAmount: 30000,
      items: [
        {
          id: "it-1",
          productId: "prod-1",
          productName: "Sérum",
          quantity: 2,
          unitPrice: 15000,
          totalPrice: 30000,
        },
      ],
      createdAt: dateWithin2Days,
      updatedAt: dateWithin2Days,
    },
    {
      id: "ord-2",
      orderNumber: "NOV-002",
      customerName: "Koffi Mensah",
      customerPhone: "+22890000002",
      city: "Lomé",
      deliveryAddress: "Agbalépédogan",
      status: "delivered", // LIVRÉE
      totalAmount: 20000,
      items: [
        {
          id: "it-2",
          productId: "prod-2",
          productName: "Crème",
          quantity: 2,
          unitPrice: 10000,
          totalPrice: 20000,
        },
      ],
      createdAt: dateWithin10Days,
      updatedAt: dateWithin10Days,
    },
    {
      id: "ord-3",
      orderNumber: "NOV-003",
      customerName: "Fatou Sow",
      customerPhone: "+22890000003",
      city: "Dakar",
      deliveryAddress: "Plateau",
      status: "cancelled", // NON LIVRÉE -> DOIT ÊTRE EXCLUE
      totalAmount: 15000,
      items: [
        {
          id: "it-3",
          productId: "prod-1",
          productName: "Sérum",
          quantity: 1,
          unitPrice: 15000,
          totalPrice: 15000,
        },
      ],
      createdAt: dateWithin2Days,
      updatedAt: dateWithin2Days,
    },
    {
      id: "ord-4",
      orderNumber: "NOV-004",
      customerName: "Paul Lawson",
      customerPhone: "+22890000004",
      city: "Lomé",
      deliveryAddress: "Bè",
      status: "delivered", // LIVRÉE MAIS ANCIENNE (> 90j)
      totalAmount: 5000,
      items: [
        {
          id: "it-4",
          productId: "prod-3",
          productName: "Savon",
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000,
        },
      ],
      createdAt: dateOld,
      updatedAt: dateOld,
    },
  ] as unknown as Order[];

  it("filtre strictement les commandes livrées selon la période", () => {
    // 7 jours : ord-1 (il y a 1 jour)
    const orders7d = filterDeliveredOrdersByPeriod(mockOrders, "7d", referenceNow);
    expect(orders7d.length).toBe(1);
    expect(orders7d[0].id).toBe("ord-1");

    // 30 jours : ord-1 (1 j) et ord-2 (8 j)
    const orders30d = filterDeliveredOrdersByPeriod(mockOrders, "30d", referenceNow);
    expect(orders30d.length).toBe(2);
    expect(orders30d.map((o) => o.id)).toEqual(["ord-1", "ord-2"]);

    // ord-3 est annulée donc JAMAIS incluse
    expect(orders30d.some((o) => o.id === "ord-3")).toBe(false);
  });

  it("affiche 'Aucune donnée' lorsqu'aucune commande n'est livrée", () => {
    const res = calculateProductIndicators(mockProducts, [], "30d", referenceNow);
    expect(res.deliveredOrdersCount).toBe(0);
    expect(res.sellThrough.hasData).toBe(false);
    expect(res.sellThrough.formattedRate).toBe("Aucune donnée");
    expect(res.runway.hasData).toBe(false);
    expect(res.runway.summaryText).toBe("Aucune donnée");
    expect(res.abc.hasData).toBe(false);
    expect(res.abc.summaryText).toBe("Aucune donnée");
  });

  it("calcule exactement le Taux de vente moyen sur les commandes livrées", () => {
    // Période 30 jours :
    // ord-1 : 2 unités de prod-1
    // ord-2 : 2 unités de prod-2
    // totalSoldUnits = 4
    // totalRemainingStock = 50 + 10 + 5 = 65
    // Dénominateur = 4 + 65 = 69
    // Taux = (4 / 69) * 100 = 5.797% -> 5,8 %
    const res = calculateProductIndicators(mockProducts, mockOrders, "30d", referenceNow);
    expect(res.sellThrough.hasData).toBe(true);
    expect(res.sellThrough.totalSoldUnits).toBe(4);
    expect(res.sellThrough.totalRemainingStock).toBe(65);
    expect(res.sellThrough.ratePercent).toBeCloseTo(5.8, 1);
    expect(res.sellThrough.formattedRate).toContain("5,8");
  });

  it("calcule les Jours de stock restants et détecte les alertes de rupture", () => {
    // Période 30 jours :
    // prod-2 a vendu 2 unités sur 30 jours -> rythme = 2 / 30 = 0.0667 u/j
    // stock restant = 10 -> jours restants = 10 / 0.0667 = 150 jours
    const res = calculateProductIndicators(mockProducts, mockOrders, "30d", referenceNow);
    expect(res.runway.hasData).toBe(true);
    expect(res.runway.summaryText).toBeDefined();
    expect(res.runway.summaryText).not.toBe("Aucune donnée");
  });

  it("calcule l'analyse ABC selon la loi de Pareto (80% / 15% / 5%)", () => {
    // ord-1 : 30 000 FCFA (prod-1)
    // ord-2 : 20 000 FCFA (prod-2)
    // Total CA livré sur 30j = 50 000 FCFA
    // prod-1 = 30 000 / 50 000 = 60 % -> Classe A
    // prod-2 = cumul 100 % -> Classe B
    const res = calculateProductIndicators(mockProducts, mockOrders, "30d", referenceNow);
    expect(res.abc.hasData).toBe(true);
    expect(res.abc.totalRevenue).toBe(50000);
    expect(res.abc.classACount).toBeGreaterThanOrEqual(1);
    expect(res.abc.summaryText).toContain("A:");
  });
});
