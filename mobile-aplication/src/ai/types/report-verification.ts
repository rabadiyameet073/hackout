/**
 * @fileOverview Types for the report verification AI agent.
 *
 * - VerifyReportInput - The input type for the verifyReport function.
 * - VerifyReportOutput - The return type for the verifyReport function.
 */

import {z} from 'zod';

export const VerifyReportInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the incident, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  title: z.string().describe('The title of the report.'),
  description: z.string().describe('The description of the report.'),
});
export type VerifyReportInput = z.infer<typeof VerifyReportInputSchema>;

export const VerifyReportOutputSchema = z.object({
  isSpam: z.boolean().describe('Whether or not the report is considered spam or fake.'),
  spamReason: z.string().describe('The reasoning for the spam determination.'),
  isAiGenerated: z.boolean().describe('Whether or not the image appears to be AI-generated.'),
  aiGeneratedReason: z.string().describe('The reasoning for the AI-generated image determination.'),
});
export type VerifyReportOutput = z.infer<typeof VerifyReportOutputSchema>;
