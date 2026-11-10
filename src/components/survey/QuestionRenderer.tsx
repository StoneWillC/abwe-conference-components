import { FormQuestion } from "../../types/questionsTypes";
import Dropdown from "./questions/Dropdown";
import MultiSelect from "./questions/MultiSelect";
import Rating from "./questions/Rating";
import SingleSelect from "./questions/SingleSelect";
import TextInput from "./questions/TextInput";

interface QuestionRendererProps {
  question: FormQuestion;
  value: any;
  onChange: (questionId: string, value: any) => void;
}

export const QuestionRenderer = ({
  question,
  value,
  onChange,
}: QuestionRendererProps) => {
  switch (question.type) {
    case "text_input":
      return (
        <TextInput question={question} value={value} onChange={onChange} />
      );
    case "single_select":
      return (
        <SingleSelect question={question} value={value} onChange={onChange} />
      );
    case "multi_select":
      return (
        <MultiSelect question={question} value={value} onChange={onChange} />
      );
    case "dropdown":
      return <Dropdown question={question} value={value} onChange={onChange} />;
    case "rating":
      return <Rating question={question} value={value} onChange={onChange} />;
    default:
      return null;
  }
};
