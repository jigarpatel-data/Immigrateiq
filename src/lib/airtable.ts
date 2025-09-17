
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


// Schema for fetching unique values, which returns partial records
const UniqueValueFieldsSchema = z.record(z.string(), z.string().optional());

const AirtableUniqueValueRecordSchema = z.object({
    id: z.string(),
    fields: UniqueValueFieldsSchema,
    createdTime: z.string(),
});

const AirtableUniqueValueResponseSchema = z.object({
    records: z.array(AirtableUniqueValueRecordSchema),
    offset: z.string().optional(),
});


export type Draw = z.infer<typeof DrawFieldsSchema> & { id: string };

type AirtableResult = { 
  draws?: {id: string, fields: z.infer<typeof DrawFieldsSchema>}[], 
  error?: string,
  offset?: string 
};

type FilterOptions = {
    province?: string;
    category?: string;
    search?: string;
}

export async function getAirtableDraws(offset?: string, filters?: FilterOptions): Promise<AirtableResult> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = 'Draww Tracker';

  if (!apiKey || !baseId) {
    console.error("Airtable environment variables not set. Please add AIRTABLE_API_KEY and AIRTABLE_BASE_ID to your .env.local file.");
    return { error: 'Server configuration error. The app is not connected to Airtable.' };
  }
  
  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

  try {
    const url = new URL(baseUrl);
    url.searchParams.append('pageSize', '10');
    url.searchParams.append('sort[0][field]', 'Draw Date');
    url.searchParams.append('sort[0][direction]', 'desc');
    
    if (offset) {
      url.searchParams.append('offset', offset);
    }

    const filterParts: string[] = [];
    if(filters?.province && filters.province !== 'All') {
        filterParts.push(`{Province} = "${filters.province}"`);
    }
    if(filters?.category && filters.category !== 'All') {
        filterParts.push(`{Category} = "${filters.category}"`);
    }
    if(filters?.search) {
        const searchLower = filters.search.toLowerCase().replace(/"/g, '\\"');
        filterParts.push(`OR(
            SEARCH("${searchLower}", LOWER({NOC/Other})),
            SEARCH("${searchLower}", LOWER({Category})),
            SEARCH("${searchLower}", LOWER({Province}))
        )`);
    }

    if (filterParts.length > 0) {
        url.searchParams.append('filterByFormula', `AND(${filterParts.join(', ')})`);
    }
    
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

    return { draws: recordsWithFields, offset: validatedResponse.data.offset };

  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    if (error instanceof TypeError) { // This often indicates a network or DNS issue
        return { error: 'Network error: Could not connect to Airtable.'}
    }
    return { error: 'An unexpected error occurred while fetching data.' };
  }
}

export async function getUniqueFieldValues(field: 'Province' | 'Category'): Promise<{ values?: string[], error?: string }> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = 'Draww Tracker';

  if (!apiKey || !baseId) {
    return { error: 'Server configuration error.' };
  }

  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const uniqueValues = new Set<string>();
  let offset: string | undefined;

  try {
    do {
      const url = new URL(baseUrl);
      url.searchParams.append('fields[]', field);
      
      if (offset) {
        url.searchParams.append('offset', offset);
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
        // Cache the result for 1 hour. This is the server-side cache.
        next: { revalidate: 3600 } 
      });

      if (!response.ok) {
        const errorBody = await response.json();
        return { error: errorBody?.error?.message || 'Failed to load filter options.' };
      }

      const data = await response.json();
      const validated = AirtableUniqueValueResponseSchema.safeParse(data);
      if(!validated.success) {
        console.error(`Airtable filter data validation error for field ${field}:`, validated.error.flatten());
        return { error: 'Invalid data format for filter options.'}
      }

      validated.data.records.forEach(record => {
        const value = record.fields[field];
        if (value) {
          uniqueValues.add(value);
        }
      });

      offset = validated.data.offset;
    } while (offset);

    return { values: Array.from(uniqueValues).sort() };
  } catch (error) {
    console.error(`Error fetching unique values for ${field}:`, error);
    return { error: 'An unexpected error occurred while fetching filter options.' };
  }
}

    