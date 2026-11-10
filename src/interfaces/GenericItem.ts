export default interface GenericItem {
  id?: number | string; // Support both numeric IDs and string codes
  code?: string; // For entities using code as primary key
  name?: string; // Name might not be present for all entities
  [key: string]: any; // Allow additional properties
}
