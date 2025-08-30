'use server';
/**
 * @fileOverview An AI agent for scoring user-submitted reports.
 *
 * - scoreReport - A function that evaluates a report and assigns it a score.
 */

import {ai} from '@/ai/genkit';
import {
  ScoreReportInputSchema,
  type ScoreReportInput,
  ScoreReportOutputSchema,
  type ScoreReportOutput,
} from '@/ai/types/report-scoring';

export async function scoreReport(input: ScoreReportInput): Promise<ScoreReportOutput> {
  return scoreReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scoreReportPrompt',
  input: {schema: ScoreReportInputSchema},
  output: {schema: ScoreReportOutputSchema},
  prompt: `You are an environmental expert responsible for a community-driven reporting platform. Your task is to evaluate and score user-submitted reports about environmental incidents.

The score should be between 1 and 100, reflecting the quality, urgency, and potential impact of the report.

Use the following criteria for your evaluation:
1.  **Clarity and Detail (40 points):** How well is the incident described? Is the title clear? Is the description detailed enough to be actionable?
2.  **Evidence Quality (30 points):** Does the photo clearly show the incident? Is it high-quality and unambiguous?
3.  **Severity and Urgency (30 points):** How severe is the potential environmental impact? A large-scale oil spill is more severe than a small amount of litter.

Analyze the provided report and provide a score and a brief justification for your score.

Report Title: {{{title}}}
Report Description: {{{description}}}
Report Type: {{{type}}}
Report Photo: {{media url=photoDataUri}}
`,
});

const scoreReportFlow = ai.defineFlow(
  {
    name: 'scoreReportFlow',
    inputSchema: ScoreReportInputSchema,
    outputSchema: ScoreReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
