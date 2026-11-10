import { Box, Rating as MuiRating, Typography } from "@mui/material";
import { SyntheticEvent } from "react";
import {
  FormQuestionProps,
  RatingQuestion,
} from "../../../types/questionsTypes";

interface RatingProps extends FormQuestionProps {
  question: RatingQuestion;
}

export default function Rating({ question, value, onChange }: RatingProps) {
  const handleChange = (event: SyntheticEvent, newValue: number | null) => {
    onChange(question.id, newValue);
  };

  return (
    <Box>
      {question.label && (
        <Typography sx={{ mb: 0.5 }}>{question.label}</Typography>
      )}
      {question.required && (
        <Typography component="span" color="error" sx={{ ml: 0.5 }}>
          *
        </Typography>
      )}

      <MuiRating
        value={value || 0}
        onChange={handleChange}
        max={5} // Fixed 5-star rating
        size="large"
        sx={{ mt: 1 }}
      />
    </Box>
  );
}
