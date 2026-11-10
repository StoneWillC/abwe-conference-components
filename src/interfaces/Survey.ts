export default interface Survey {
  id?: number; // Optional ID for compatibility with GenericItem
  name?: string; // For survey templates
  code?: string; // For concrete surveys
  template_id?: number;
  session_id?: number;
  is_active?: boolean;
}
