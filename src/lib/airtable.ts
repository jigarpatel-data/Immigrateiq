'use server';

import { z } from 'zod';

// Define a schema for your draw data for type safety
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
    createdTime: z.string(),
});

const AirtableResponseSchema = z.object({
    records: z.array(AirtableRecordSchema),
    offset: z.string().optional(),
});


export type Draw = z.infer<typeof DrawFieldsSchema> & { id: string };

export async function getAirtableDraws(): Promise<{ draws?: {id: string, fields: z.infer<typeof DrawFieldsSchema>}[], error?: string }> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = 'Draww Tracker'; 

  if (!apiKey || !baseId) {
    console.error("Airtable environment variables not set. Please add AIRTABLE_API_KEY and AIRTABLE_BASE_ID to your .env.local file.");
    return { error: 'Server configuration error. The app is not connected to Airtable.' };
  }
  
  let allRecords: {id: string, fields: z.infer<typeof DrawFieldsSchema>}[] = [];
  let offset: string | undefined = undefined;
  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

  try {
    do {
      const url = new URL(baseUrl);
      if (offset) {
        url.searchParams.append('offset', offset);
      }
      // Airtable sorts by created time by default, which is not ideal for 'newest' draws.
      // We will fetch all and sort manually.
      
      const response = await fetch(url.toString(), {
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
      const validatedResponse = AirtableResponseSchema.safeParse(data);

      if (!validatedResponse.success) {
        console.error("Airtable data validation error:", validatedResponse.error.flatten());
        return { error: "Invalid data format received from Airtable. Check that your table columns match the required format." };
      }
      
      const recordsWithFields = validatedResponse.data.records.map(r => ({id: r.id, fields: r.fields}));
      allRecords.push(...recordsWithFields);
      offset = validatedResponse.data.offset;

    } while (offset);
    
    // Sort all records by "Draw Date" descending after fetching them
    allRecords.sort((a, b) => {
        const dateA = new Date(a.fields["Draw Date"]).getTime();
        const dateB = new Date(b.fields["Draw Date"]).getTime();
        return dateB - dateA;
    });

    return { draws: allRecords };

  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    if (error instanceof TypeError) { // This often indicates a network or DNS issue
        return { error: 'Network error: Could not connect to Airtable.'}
    }
    return { error: 'An unexpected error occurred while fetching data.' };
  }
}
