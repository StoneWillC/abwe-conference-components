import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { type SyntheticEvent } from "react";
import {
  DropdownQuestion,
  FormQuestionProps,
} from "../../../types/questionsTypes";

interface DropdownProps extends FormQuestionProps {
  question: DropdownQuestion;
  value: string;
}

export default function Dropdown({ question, value, onChange }: DropdownProps) {
  const handleChange = (event: SyntheticEvent, newValue: string | null) => {
    onChange(question.id, newValue || "");
  };

  return (
    <Box>
      <Typography sx={{ mb: 0.5 }}>{question.label}</Typography>
      <Autocomplete
        disablePortal
        options={question.options}
        value={value || ""}
        onChange={handleChange}
        renderInput={(params) => (
          <TextField
            {...params}
            required={question.required}
            name={question.id}
            label={question.floatingLabel}
          />
        )}
      />
    </Box>
  );
}
