// Utility functions for map-related operations
import { numericToISO } from "../assets/numericToISO";

/**
 * Creates a reverse lookup mapping from ISO A2 codes to UN M49 numeric codes
 * Generated dynamically from the numericToISO mapping
 */
export function createISOToNumericMap(): Record<string, string> {
  const isoToNumeric: Record<string, string> = {};

  Object.entries(numericToISO).forEach(([numeric, iso]) => {
    isoToNumeric[iso] = numeric;
  });

  return isoToNumeric;
}
