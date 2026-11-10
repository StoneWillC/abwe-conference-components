import GenericItem from "./GenericItem";

export default interface ApiMethods<T extends GenericItem> {
  load: (
    dependency?: number
  ) => Promise<{ success: boolean; data?: T[]; error?: string }>;
  create: (
    data: Partial<T>,
    dependency?: number
  ) => Promise<{ success: boolean; data?: T; error?: string }>;
  update: (
    id: number,
    data: Partial<T>
  ) => Promise<{ success: boolean; data?: T; error?: string }>;
  delete: (id: number) => Promise<{ success: boolean; error?: string }>;

  // Optional methods for "add existing" functionality
  loadAll?: () => Promise<{ success: boolean; data?: T[]; error?: string }>;
  addExisting?: (
    itemId: number,
    dependency?: number
  ) => Promise<{ success: boolean; data?: T; error?: string }>;
}
