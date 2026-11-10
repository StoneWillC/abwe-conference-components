// Presenter Console Types

export interface WinnerResult {
  question_id: number;
  option_index: number | null;
  option_text: string | null;
  winner: {
    id: number;
    name: string;
    email: string;
  };
  selected_at: string;
}

export interface WinnerInfo {
  question_id: number;
  question_text: string;
  option_index: number | null;
  option_text: string | null;
  winner: {
    id: number;
    name: string;
    email: string;
  };
  selected_at: string;
}

// Optimize Winners Types — commented out

// export interface OptimizeSlotRequest {
//   question_id: number;
//   option_index: number | null;
//   count: number;
// }
//
// export interface OptimizeUnfilledSlot {
//   question_id: number;
//   option_index: number | null;
//   reason: string;
// }
//
// export interface OptimizeWinnersResponse {
//   winners: WinnerResult[];
//   unfilled: OptimizeUnfilledSlot[];
//   committed: boolean;
// }
//
// export interface ValidateSlotResult {
//   question_id: number;
//   option_index: number | null;
//   requested: number;
//   max_achievable: number;
//   pool_size: number;
//   reason: string | null;
// }
//
// export interface ValidateConfigResponse {
//   feasible: boolean;
//   slots: ValidateSlotResult[];
//   total_requested: number;
//   total_achievable: number;
// }
