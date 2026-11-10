import { Box, TextField, Typography } from "@mui/material";
import { type ChangeEvent } from "react";
import {
  FormQuestionProps,
  TextInputQuestion,
} from "../../../types/questionsTypes";

interface TextInputProps extends FormQuestionProps {
  question: TextInputQuestion;
  value: string;
}

export default function TextInput({
  question,
  value,
  onChange,
}: TextInputProps) {
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(question.id, e.target.value);
  };

  return (
    <Box>
      <Typography sx={{ mb: 0.5 }}>{question.label}</Typography>
      <TextField
        label={question.floatingLabel}
        name={question.id}
        value={value || ""}
        onChange={handleChange}
        fullWidth
        required={question.required}
        type={question.inputType || "text"}
        placeholder={question.placeholder}
        multiline={question.multiline}
        rows={question.rows}
      />
    </Box>
  );
}
