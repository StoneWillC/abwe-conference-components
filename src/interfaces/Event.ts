export interface Event {
  id: number;
  event_template_id: number;
  name: string;
  location: string;
  start_date: string;
  end_date: string | null;
}
