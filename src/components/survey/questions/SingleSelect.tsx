import {
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { type ChangeEvent } from "react";
import {
  FormQuestionProps,
  SingleSelectQuestion,
} from "../../../types/questionsTypes";

interface SingleSelectProps extends FormQuestionProps {
  question: SingleSelectQuestion;
  value: string;
}

export default function SingleSelect({
  question,
  value,
  onChange,
}: SingleSelectProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(question.id, e.target.value);
  };

  return (
    <Box>
      <Typography sx={{ mb: 0.5 }}>{question.label}</Typography>
      <RadioGroup
        name={question.id}
        value={value || ""}
        onChange={handleChange}
      >
        {question.options.map((option) => (
          <FormControlLabel
            key={option}
            value={option}
            control={<Radio required={question.required} />}
            label={option}
            sx={{ mb: 1.5, alignItems: "flex-start", "& .MuiRadio-root": { pt: "2px" } }}
          />
        ))}
      </RadioGroup>
    </Box>
  );
}
