/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * APAAR Identity Validation Service
 * 
 * COMPLIANCE MANDATE:
 * APAAR identity verification and admission verification are separate checks.
 * Identity validation verifies format and student registry existence.
 * It does NOT verify or guarantee admission validity or graduation status.
 */

export interface ApaarFormatValidationResult {
  valid: boolean;
  cleanApaar: string;
  maskedApaar: string;
  formattedApaar: string;
  reason?: string;
}

export function validateApaarFormat(apaarInput: string): ApaarFormatValidationResult {
  if (!apaarInput) {
    return {
      valid: false,
      cleanApaar: '',
      maskedApaar: '',
      formattedApaar: '',
      reason: 'APAAR identifier is missing or blank',
    };
  }

  // Strip hyphens, spaces, and non-numeric characters
  const clean = apaarInput.replace(/[^0-9]/g, '');

  if (clean.length !== 12) {
    return {
      valid: false,
      cleanApaar: clean,
      maskedApaar: clean.length >= 4 ? `XXXX-XXXX-${clean.slice(-4)}` : 'INVALID',
      formattedApaar: clean,
      reason: `APAAR must be exactly 12 numeric digits (received ${clean.length} digits)`,
    };
  }

  // Verhoeff checksum or numeric pattern check
  if (/^(\d)\1{11}$/.test(clean)) {
    return {
      valid: false,
      cleanApaar: clean,
      maskedApaar: `XXXX-XXXX-${clean.slice(-4)}`,
      formattedApaar: `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`,
      reason: 'APAAR cannot consist of 12 repeating identical digits',
    };
  }

  const masked = `XXXX-XXXX-${clean.slice(-4)}`;
  const formatted = `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;

  return {
    valid: true,
    cleanApaar: clean,
    maskedApaar: masked,
    formattedApaar: formatted,
  };
}

export interface ApaarRegistryCheckResult {
  status: 'VALID' | 'NOT_FOUND' | 'FORMAT_INVALID';
  apaarMasked: string;
  checkedAt: string;
  registryAuthority: string;
  disclaimer: string;
  note: string;
}

/**
 * Mocked APAAR Identity Registry adapter.
 * Deterministic based on seeded database patterns.
 */
export function verifyApaarIdentityAdapter(apaar: string): ApaarRegistryCheckResult {
  const format = validateApaarFormat(apaar);
  const checkedAt = new Date().toISOString();
  const registryAuthority = 'Ministry of Education - APAAR / ABC Registry (Simulated)';
  const disclaimer = 'IDENTITY CHECK ONLY: APAAR identity verification confirms student registry identity. It does not authenticate institutional admission or course enrolment.';

  if (!format.valid) {
    return {
      status: 'FORMAT_INVALID',
      apaarMasked: format.maskedApaar || 'XXXX-XXXX-????',
      checkedAt,
      registryAuthority,
      disclaimer,
      note: format.reason || 'Invalid 12-digit format',
    };
  }

  // Deterministic mock logic: APAAR ending with '0000' or '9999' simulated as NOT_FOUND
  if (format.cleanApaar.endsWith('0000') || format.cleanApaar.endsWith('9999')) {
    return {
      status: 'NOT_FOUND',
      apaarMasked: format.maskedApaar,
      checkedAt,
      registryAuthority,
      disclaimer,
      note: 'Identifier not found in central APAAR registry database',
    };
  }

  return {
    status: 'VALID',
    apaarMasked: format.maskedApaar,
    checkedAt,
    registryAuthority,
    disclaimer,
    note: 'Active APAAR identity record found with matched demographic identity',
  };
}
