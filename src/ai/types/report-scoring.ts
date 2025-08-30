/**
 * @fileOverview Types for the report scoring AI agent.
 *
 * - ScoreReportInput - The input type for the scoreReport function.
 * - ScoreReportOutput - The return type for the scoreReport function.
 */

import {z} from 'zod';

export const ScoreReportInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the incident, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  title: z.string().describe('The title of the report.'),
  description: z.string().describe('The description of the report.'),
  type: z.string().describe('The category of the incident (e.g., Pollution, Deforestation).'),
});
export type ScoreReportInput = z.infer<typeof ScoreReportInputSchema>;

export const ScoreReportOutputSchema = z.object({
  points: z.number().describe('The score assigned to the report, from 1 to 100.'),
  reason: z.string().describe('The justification for the assigned score.'),
});
export type ScoreReportOutput = z.infer<typeof ScoreReportOutputSchema>;
