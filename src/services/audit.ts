/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditEvent, Role } from '../types';

/**
 * Deterministic hash calculation for tamper-evident audit ledger chain.
 * Uses a polynomial string hash algorithm formatted as 64-char hex string.
 */
export function computeHash(content: string, prevHash: string): string {
  const combined = `${prevHash}::${content}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  let h3 = 0x9e3779b9;
  let h4 = 0x85ebca6b;

  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812015801);
    h4 = Math.imul(h4 ^ ch, 2147483647);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const p4 = (h4 >>> 0).toString(16).padStart(8, '0');

  // Double to 64 hex characters like a SHA-256 digest
  return `${p1}${p2}${p3}${p4}${p2}${p1}${p4}${p3}`.toLowerCase();
}

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export function createAuditEvent(
  actorRole: Role,
  actorName: string,
  eventType: AuditEvent['eventType'],
  targetEntity: string,
  targetId: string,
  details: Record<string, any>,
  prevHash: string = GENESIS_HASH
): AuditEvent {
  const timestamp = new Date().toISOString();
  const id = `AUD-${Math.floor(100000 + Math.random() * 900000)}`;

  const canonicalPayload = JSON.stringify({
    id,
    timestamp,
    actorRole,
    actorName,
    eventType,
    targetEntity,
    targetId,
    details,
  });

  const hash = computeHash(canonicalPayload, prevHash);

  return {
    id,
    timestamp,
    actorRole,
    actorName,
    eventType,
    targetEntity,
    targetId,
    details,
    prevHash,
    hash,
  };
}

/**
 * Validates the cryptographic integrity of the entire audit ledger chain.
 */
export function verifyAuditChain(events: AuditEvent[]): {
  valid: boolean;
  totalEvents: number;
  brokenAtIndex?: number;
  error?: string;
  verifiedAt: string;
} {
  const verifiedAt = new Date().toISOString();

  if (events.length === 0) {
    return { valid: true, totalEvents: 0, verifiedAt };
  }

  for (let i = 0; i < events.length; i++) {
    const current = events[i];

    // Check prevHash linkage
    if (i === 0) {
      if (current.prevHash !== GENESIS_HASH) {
        return {
          valid: false,
          totalEvents: events.length,
          brokenAtIndex: 0,
          error: `Genesis block does not link to GENESIS_HASH (got: ${current.prevHash})`,
          verifiedAt,
        };
      }
    } else {
      const prev = events[i - 1];
      if (current.prevHash !== prev.hash) {
        return {
          valid: false,
          totalEvents: events.length,
          brokenAtIndex: i,
          error: `Chain broken at event #${i} (${current.id}): prevHash '${current.prevHash.slice(0, 12)}...' does not match block #${i - 1} hash '${prev.hash.slice(0, 12)}...'`,
          verifiedAt,
        };
      }
    }

    // Verify recalculation of current block's hash
    const canonicalPayload = JSON.stringify({
      id: current.id,
      timestamp: current.timestamp,
      actorRole: current.actorRole,
      actorName: current.actorName,
      eventType: current.eventType,
      targetEntity: current.targetEntity,
      targetId: current.targetId,
      details: current.details,
    });

    const expectedHash = computeHash(canonicalPayload, current.prevHash);
    if (current.hash !== expectedHash) {
      return {
        valid: false,
        totalEvents: events.length,
        brokenAtIndex: i,
        error: `Payload tamper detected at event #${i} (${current.id}): recorded hash does not match computed digest.`,
        verifiedAt,
      };
    }
  }

  return {
    valid: true,
    totalEvents: events.length,
    verifiedAt,
  };
}

/**
 * Recomputes hash chain sequentially from genesis to restore cryptographic linkage.
 */
export function recomputeAuditChain(events: AuditEvent[]): AuditEvent[] {
  let prevHash = GENESIS_HASH;
  return events.map((ev) => {
    const canonicalPayload = JSON.stringify({
      id: ev.id,
      timestamp: ev.timestamp,
      actorRole: ev.actorRole,
      actorName: ev.actorName,
      eventType: ev.eventType,
      targetEntity: ev.targetEntity,
      targetId: ev.targetId,
      details: ev.details,
    });
    const hash = computeHash(canonicalPayload, prevHash);
    const updated: AuditEvent = { ...ev, prevHash, hash };
    prevHash = hash;
    return updated;
  });
}
