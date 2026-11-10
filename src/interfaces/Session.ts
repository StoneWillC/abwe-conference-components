export default interface Session {
  id: number;
  event_id?: number;
  template_id?: number;
  name: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
}
