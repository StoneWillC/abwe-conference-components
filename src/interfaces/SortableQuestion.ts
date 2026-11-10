type SortableQuestionField = "value" | "displayText" | "displayIcon";

export default interface SortableQuestionProps {
  id: string;
  option: SortableQuestionOptionData;
  index: number;
  onUpdate: (
    index: number,
    field: SortableQuestionField,
    value: string,
  ) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  disableValue?: boolean;
}


export interface SortableQuestionOptionData {
  id: string;
  value: string;
  displayText?: string;
  displayIcon?: string;
}
