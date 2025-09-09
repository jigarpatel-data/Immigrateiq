
'use server';

import { z } from 'zod';

// Define a schema for your draw data for type safety
// All fields from Airtable are optional initially, as they might be empty.
const DrawFieldsSchema = z.object({
    'Draw Date': z.string(),
    Province: z.string(),
    Category: z.string(),
    Score: z.string().optional(),
    'Total Draw Invitations': z.string().optional(),
    'NOC/Other': z.string(),
    URL: z.string().url(),
});

const AirtableRecordSchema = z.object({
    id: z.string(),
    fields: DrawFieldsSchema,
});

const AirtableResponseSchema = z.array(AirtableRecordSchema);

export type Draw = z.infer<typeof DrawFieldsSchema> & { id: string };

export async function getAirtableDraws(): Promise<{ draws?: {id: string, fields: z.infer<typeof DrawFieldsSchema>}[], error?: string }> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  // =================================================================
  // IMPORTANT: Replace 'YourTableName' with your actual table name.
  // This can be the Table ID or the name of the table as it appears in Airtable.
  // For example: const tableName = 'tblxxxxxxxxxxxxxx';
  // Or: const tableName = 'Immigration Draws';
  // =================================================================
  const tableName = 'YourTableName'; 

  if (!apiKey || !baseId) {
    console.error("Airtable environment variables not set. Please add AIRTABLE_API_KEY and AIRTABLE_BASE_ID to your .env.local file.");
    return { error: 'Server configuration error. The app is not connected to Airtable.' };
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate: 600 } // Re-fetch data from Airtable at most every 10 minutes.
    });

    if (!response.ok) {
      console.error('Failed to fetch from Airtable:', response.statusText);
      const errorBody = await response.json();
      const errorMessage = errorBody?.error?.message || 'Failed to load draw data from Airtable.';
      return { error: errorMessage };
    }

    const data = await response.json();
    
    const validatedData = AirtableResponseSchema.safeParse(data.records);

    if (!validatedData.success) {
        console.error("Airtable data validation error:", validatedData.error.flatten());
        return { error: "Invalid data format received from Airtable. Check that your table columns match the required format." };
    }

    return { draws: validatedData.data };

  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    if (error instanceof TypeError) { // This often indicates a network or DNS issue
        return { error: 'Network error: Could not connect to Airtable.'}
    }
    return { error: 'An unexpected error occurred while fetching data.' };
  }
}
