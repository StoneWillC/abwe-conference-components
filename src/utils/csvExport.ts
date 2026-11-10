/**
 * CSV Export Utility for Survey Reports
 * Generates and downloads CSV files from survey response data
 */

import JSZip from "jszip";

export interface ExportData {
  event_title: string;
  event_location: string;
  event_start_date: string;
  event_end_date: string;
  session_title: string;
  survey_title: string;
  questions: Array<{
    question_id: number;
    question_text: string;
    question_type: string;
    survey_question_id: number;
    options: string[];
  }>;
  attendees: Record<
    string,
    { first_name: string; last_name: string; email: string }
  >;
  responses: Record<string, Record<string, string>>;
  winners: Array<{
    question_id: number;
    question_text: string;
    option_index: number | null;
    option_text: string | null;
    name: string;
    email: string;
  }>;
}

/**
 * Escape a CSV field to handle commas, quotes, and newlines
 */
function escapeCSVField(field: string | null | undefined): string {
  if (field === null || field === undefined) {
    return "";
  }
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Format multi-select answer with curly braces instead of square brackets
 */
function formatMultiSelectAnswer(answer: string): string {
  if (!answer) return "";

  try {
    const parsed = JSON.parse(answer);
    if (Array.isArray(parsed)) {
      // Format as {"Option1", "Option2"} instead of ["Option1", "Option2"]
      const formatted = parsed.map((item) => `"${item}"`).join(", ");
      return `{${formatted}}`;
    }
    return answer;
  } catch {
    return answer;
  }
}

/**
 * Format answer based on question type
 * Note: multi_select is handled separately with individual columns
 */
function formatAnswer(answer: string, questionType: string): string {
  if (!answer) return "";

  try {
    const parsed = JSON.parse(answer);

    // For other types, return the value directly
    if (Array.isArray(parsed)) {
      return parsed.join(", ");
    }

    return String(parsed);
  } catch {
    // If not valid JSON, return as-is
    return answer;
  }
}

/**
 * Generate CSV content from export data
 * Includes both survey responses and winners in one file
 */
export function generateCSV(data: ExportData): string {
  const rows: string[] = [];

  // ===== PART 1: SURVEY ENTRIES =====

  // Header Row: fixed columns + question columns
  const headerRow: string[] = [
    "First Name",
    "Last Name",
    "Email",
    "Event Name",
    "Location",
    "Start Date",
    "End Date",
  ];

  // Add question headers (no question type prefix)
  for (const question of data.questions) {
    if (
      question.question_type === "multi_select" &&
      question.options &&
      question.options.length > 0
    ) {
      // For multi-select: first column is question text, then one column per option
      headerRow.push(escapeCSVField(question.question_text));
      for (const option of question.options) {
        headerRow.push(escapeCSVField(option));
      }
    } else {
      headerRow.push(escapeCSVField(question.question_text));
    }
  }
  rows.push(headerRow.join(","));

  // Data rows: one per attendee
  const attendeeIds = Object.keys(data.attendees);

  for (const attendeeId of attendeeIds) {
    const attendee = data.attendees[attendeeId];
    const responseRow: string[] = [
      escapeCSVField(attendee.first_name),
      escapeCSVField(attendee.last_name),
      escapeCSVField(attendee.email),
      escapeCSVField(data.event_title),
      escapeCSVField(data.event_location),
      escapeCSVField(data.event_start_date),
      escapeCSVField(data.event_end_date),
    ];

    // Add responses for each question
    for (const question of data.questions) {
      const surveyQuestionId = String(question.survey_question_id);
      const answer = data.responses[attendeeId]?.[surveyQuestionId] || "";

      if (
        question.question_type === "multi_select" &&
        question.options &&
        question.options.length > 0
      ) {
        // First column: the full answer array with curly braces
        responseRow.push(escapeCSVField(formatMultiSelectAnswer(answer)));

        // Then 1/0 for each option
        let selectedOptions: string[] = [];
        try {
          const parsed = JSON.parse(answer);
          if (Array.isArray(parsed)) {
            selectedOptions = parsed;
          }
        } catch {
          // If not valid JSON, treat as empty
        }

        for (const option of question.options) {
          responseRow.push(selectedOptions.includes(option) ? "1" : "0");
        }
      } else {
        // Single value for other question types
        responseRow.push(
          escapeCSVField(formatAnswer(answer, question.question_type)),
        );
      }
    }

    rows.push(responseRow.join(","));
  }

  // ===== PART 2: WINNERS (only if any exist) =====
  if (data.winners.length > 0) {
    rows.push("");
    rows.push("");
    rows.push("WINNERS");
    rows.push("Question,Option,Name,Email");

    for (const winner of data.winners) {
      rows.push(
        [
          escapeCSVField(winner.question_text),
          escapeCSVField(winner.option_text || ""),
          escapeCSVField(winner.name),
          escapeCSVField(winner.email),
        ].join(","),
      );
    }
  }

  return rows.join("\r\n");
}

/**
 * Generate Winners CSV content
 * Format: Question, Name, Email
 */
export function generateWinnersCSV(data: ExportData): string {
  const rows: string[] = [];

  // Header row
  rows.push("Question,Option,Name,Email");

  // Winner rows
  for (const winner of data.winners) {
    rows.push(
      [
        escapeCSVField(winner.question_text),
        escapeCSVField(winner.option_text || ""),
        escapeCSVField(winner.name),
        escapeCSVField(winner.email),
      ].join(","),
    );
  }

  return rows.join("\r\n");
}

/**
 * Sanitize a string for use in a filename.
 * Lowercases, replaces non-alphanumeric runs with hyphens, trims edge hyphens.
 */
export function sanitizeForFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "survey"
  );
}

export interface ReportingEventExport {
  event: {
    name: string;
    location: string;
    start_date: string;
    end_date?: string | null;
  };
  surveys: ExportData[];
}

/**
 * Generate a flat reporting CSV where event metadata is included as columns
 * on each row rather than as section headers.
 */
export function generateReportingCSV(events: ReportingEventExport[]): string {
  const rows: string[] = [];

  const headers = [
    "record_type",
    "event_name",
    "event_location",
    "event_start_date",
    "event_end_date",
    "session_title",
    "survey_title",
    "attendee_name",
    "attendee_email",
    "question_id",
    "question_text",
    "question_type",
    "answer",
    "winner_name",
    "winner_email",
    "winner_option",
  ];

  rows.push(headers.map((header) => escapeCSVField(header)).join(","));

  events.forEach((entry) => {
    const { event } = entry;
    const eventEnd = event.end_date || event.start_date;

    (entry.surveys || []).forEach((surveyData) => {
      const questionsBySurveyQuestionId = new Map<
        number,
        ExportData["questions"][number]
      >();
      surveyData.questions.forEach((question) => {
        questionsBySurveyQuestionId.set(question.survey_question_id, question);
      });

      Object.keys(surveyData.attendees).forEach((attendeeId) => {
        const attendee = surveyData.attendees[attendeeId];
        const attendeeResponses = surveyData.responses[attendeeId] || {};

        Object.entries(attendeeResponses).forEach(
          ([surveyQuestionId, rawAnswer]) => {
            const question = questionsBySurveyQuestionId.get(
              Number(surveyQuestionId),
            );
            if (!question) {
              return;
            }

            const answer =
              question.question_type === "multi_select"
                ? formatMultiSelectAnswer(rawAnswer)
                : formatAnswer(rawAnswer, question.question_type);

            rows.push(
              [
                "response",
                event.name,
                event.location,
                event.start_date,
                eventEnd,
                surveyData.session_title,
                surveyData.survey_title,
                `${attendee.first_name} ${attendee.last_name}`,
                attendee.email,
                String(question.question_id),
                question.question_text,
                question.question_type,
                answer,
                "",
                "",
                "",
              ]
                .map((value) => escapeCSVField(value))
                .join(","),
            );
          },
        );
      });

      (surveyData.winners || []).forEach((winner) => {
        const winnerQuestion = surveyData.questions.find(
          (question) => question.question_id === winner.question_id,
        );

        rows.push(
          [
            "winner",
            event.name,
            event.location,
            event.start_date,
            eventEnd,
            surveyData.session_title,
            surveyData.survey_title,
            "",
            "",
            String(winner.question_id),
            winner.question_text,
            winnerQuestion?.question_type || "",
            "",
            winner.name,
            winner.email,
            winner.option_text || "",
          ]
            .map((value) => escapeCSVField(value))
            .join(","),
        );
      });
    });
  });

  return rows.join("\r\n");
}

/**
 * Trigger browser download of CSV content
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Download reporting surveys as a zip file with one CSV per survey
 * Each CSV uses the standard survey format with headers + data rows + winners section
 */
export async function downloadReportingZip(
  surveys: ExportData[],
  templateName: string,
): Promise<void> {
  if (!surveys || surveys.length === 0) {
    throw new Error("No surveys provided for export");
  }

  try {
    const zip = new JSZip();
    const filenameCounts: Record<string, number> = {};

    // Add one CSV file per survey
    for (const surveyData of surveys) {
      try {
        const csvContent = generateCSV(surveyData);
        const baseName =
          sanitizeForFilename(surveyData.survey_title) || "survey-export";
        const seen = filenameCounts[baseName] || 0;
        filenameCounts[baseName] = seen + 1;
        const suffix = seen > 0 ? `-${seen + 1}` : "";
        const surveyFilename = `${baseName}${suffix}.csv`;
        zip.file(surveyFilename, csvContent);
      } catch (csvError) {
        console.error(
          `Failed to generate CSV for survey: ${surveyData.survey_title}`,
          csvError,
        );
        throw new Error(
          `Failed to generate CSV for survey "${surveyData.survey_title}": ${csvError instanceof Error ? csvError.message : String(csvError)}`,
        );
      }
    }

    // Generate zip blob and trigger download
    let blob: Blob;
    try {
      blob = await zip.generateAsync({ type: "blob" });
    } catch (zipError) {
      console.error("Failed to generate zip blob:", zipError);
      throw new Error(
        `Failed to generate zip file: ${zipError instanceof Error ? zipError.message : String(zipError)}`,
      );
    }

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split("T")[0];
    const zipFilename = `${sanitizeForFilename(templateName)}-reporting-${today}.zip`;

    link.setAttribute("href", url);
    link.setAttribute("download", zipFilename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
}
