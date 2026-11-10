import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import { type ChangeEvent } from "react";
import {
  FormQuestionProps,
  MultiSelectQuestion,
} from "../../../types/questionsTypes";

interface MultiSelectProps extends FormQuestionProps {
  question: MultiSelectQuestion;
  value: string[];
}

export default function MultiSelect({
  question,
  value,
  onChange,
}: MultiSelectProps) {
  const currentValues = Array.isArray(value) ? value : [];

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { checked, value: optionValue } = e.target;
    const newValues = checked
      ? [...currentValues, optionValue]
      : currentValues.filter((v) => v !== optionValue);

    onChange(question.id, newValues);
  };

  return (
    <Box>
      <Typography sx={{ mb: 0.5 }}>{question.label}</Typography>
      <Box>
        <FormGroup>
          {question.options.map((option) => (
            <FormControlLabel
              key={option}
              control={
                <Checkbox
                  checked={currentValues.includes(option)}
                  onChange={handleChange}
                  name={question.id}
                  value={option}
                  required={question.required && value.length === 0}
                />
              }
              label={option}
              sx={{ mb: 1.5, alignItems: "flex-start", "& .MuiCheckbox-root": { pt: "2px" } }}
            />
          ))}
        </FormGroup>
      </Box>
    </Box>
  );
}
