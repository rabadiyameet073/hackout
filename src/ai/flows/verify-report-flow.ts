'use server';
/**
 * @fileOverview A report verification AI agent.
 *
 * - verifyReport - A function that handles the report verification process.
 */

import {ai} from '@/ai/genkit';
import {
  VerifyReportInputSchema,
  type VerifyReportInput,
  VerifyReportOutputSchema,
  type VerifyReportOutput,
} from '@/ai/types/report-verification';

export async function verifyReport(input: VerifyReportInput): Promise<VerifyReportOutput> {
  return verifyReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyReportPrompt',
  input: {schema: VerifyReportInputSchema},
  output: {schema: VerifyReportOutputSchema},
  prompt: `You are an expert at identifying spam and fake user-submitted content. You also have expertise in detecting AI-generated images.

Analyze the provided report details and the image to determine if the report is likely spam/fake and if the image is AI-generated.

Report Title: {{{title}}}
Report Description: {{{description}}}
Report Photo: {{media url=photoDataUri}}

Consider the text content: is it coherent? Is it relevant to an environmental incident? Does it seem like an advertisement or malicious?
Consider the image: Does it look realistic? Are there any tell-tale signs of AI generation (e.g., strange artifacts, incorrect details, unusual lighting)?

Based on your analysis, provide a determination for isSpam and isAiGenerated, along with a brief reason for each.`,
});

const verifyReportFlow = ai.defineFlow(
  {
    name: 'verifyReportFlow',
    inputSchema: VerifyReportInputSchema,
    outputSchema: VerifyReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
