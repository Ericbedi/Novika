import { OfflineAction } from "@/server/data/vague1-types";

const OFFLINE_QUEUE_KEY = "afribuilder_offline_queue";

/**
 * Génère une clé d'idempotence unique par action.
 */
export function generateIdempotencyKey(actionType: string, orderId: string, timestamp: number): string {
  return `idemp_${actionType}_${orderId}_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Récupère les actions hors-ligne en attente.
 */
export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Erreur lecture file hors-ligne :", err);
    return [];
  }
}

/**
 * Ajoute une action à la file d'attente hors-ligne locale.
 */
export function enqueueOfflineAction(action: Omit<OfflineAction, "id" | "idempotencyKey" | "clientTimestamp" | "status">): OfflineAction {
  const queue = getOfflineQueue();
  const now = Date.now();
  const newAction: OfflineAction = {
    ...action,
    id: `act_${now}_${Math.random().toString(36).slice(2, 7)}`,
    idempotencyKey: generateIdempotencyKey(action.actionType, action.payload.orderId || "unknown", now),
    clientTimestamp: new Date().toISOString(),
    status: "pending",
  };

  queue.push(newAction);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn("Échec écriture localStorage :", e);
    }
  }

  return newAction;
}

/**
 * Vide ou met à jour la file après synchronisation.
 */
export function saveOfflineQueue(queue: OfflineAction[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Erreur sauvegarde file :", err);
  }
}

/**
 * Simule le rejeu sécurisé et idempotent des actions hors-ligne vers le serveur.
 */
export async function syncOfflineQueueWithServer(
  currentOrders: Array<{ id: string; status: string; updatedAt: string }>
): Promise<{ syncedCount: number; conflictCount: number; remainingQueue: OfflineAction[] }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, conflictCount: 0, remainingQueue: [] };

  let synced = 0;
  let conflicts = 0;
  const processedKeys = new Set<string>();

  const updatedQueue: OfflineAction[] = [];

  for (const item of queue) {
    // 1. Détection anti-rejeu par clé d'idempotence
    if (processedKeys.has(item.idempotencyKey)) {
      conflicts++;
      continue;
    }
    processedKeys.add(item.idempotencyKey);

    // 2. Vérification de l'état du serveur (résolution de conflit)
    const targetOrder = currentOrders.find((o) => o.id === item.payload.orderId);

    if (!targetOrder) {
      item.status = "failed";
      item.errorMessage = "Commande introuvable sur le serveur";
      updatedQueue.push(item);
      continue;
    }

    // Si la commande est déjà dans un statut terminal différent
    if (targetOrder.status === "delivered" && item.actionType === "mark_delivery_failure") {
      // Conflit : déjà livrée côté serveur, on ne rejoue pas l'échec
      item.status = "conflict_skipped";
      item.errorMessage = "Action ignorée : La commande a déjà été marquée comme livrée côté serveur.";
      conflicts++;
      updatedQueue.push(item);
      continue;
    }

    if ((targetOrder.status === "cancelled" || targetOrder.status === "rejected") && item.actionType === "mark_delivered") {
      item.status = "conflict_skipped";
      item.errorMessage = "Action ignorée : La commande a été annulée/rejetée entre-temps.";
      conflicts++;
      updatedQueue.push(item);
      continue;
    }

    // Succès de la synchronisation
    item.status = "synced";
    item.serverSyncedAt = new Date().toISOString();
    synced++;
    // Les actions synchronisées avec succès peuvent être purgées ou conservées archivées
  }

  // Filtrer les éléments synchronisés pour ne garder que ceux en échec ou une trace récente
  const remaining = updatedQueue.filter((a) => a.status !== "synced");
  saveOfflineQueue(remaining);

  return {
    syncedCount: synced,
    conflictCount: conflicts,
    remainingQueue: remaining,
  };
}
