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
    Details: z.string().optional(),
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

const checkAirtableConfig = (): { apiKey?: string; baseId?: string; tableName?: string; error?: string } => {
    console.log('Checking Airtable environment variables...');
    console.log(`- AIRTABLE_API_KEY is present: ${!!process.env.AIRTABLE_API_KEY}`);
    console.log(`- AIRTABLE_BASE_ID is present: ${!!process.env.AIRTABLE_BASE_ID}`);
    console.log(`- AIRTABLE_TABLE_NAME is present: ${!!process.env.AIRTABLE_TABLE_NAME}`);

    const requiredVars: Record<string, string | undefined> = {
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_NAME: process.env.AIRTABLE_TABLE_NAME,
    };

    const missingVars = Object.entries(requiredVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        const errorMsg = `Server configuration error. The following Airtable environment variables are not set: ${missingVars.join(', ')}. Please check your App Hosting secrets.`;
        console.error(errorMsg);
        return { error: errorMsg };
    }

    return {
        apiKey: requiredVars.AIRTABLE_API_KEY,
        baseId: requiredVars.AIRTABLE_BASE_ID,
        tableName: requiredVars.AIRTABLE_TABLE_NAME,
    };
};


export async function getAirtableDraws(offset?: string, filters?: FilterOptions): Promise<AirtableResult> {
  const config = checkAirtableConfig();
  if (config.error) {
    return { error: config.error };
  }
  const { apiKey, baseId, tableName } = config;
  
  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName!)}`;

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
  const config = checkAirtableConfig();
  if (config.error) {
    return { error: config.error };
  }
  const { apiKey, baseId, tableName } = config;

  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName!)}`;
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
        // Cache the result for 10 minutes. This is the server-side cache.
        next: { revalidate: 600 } 
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

export async function getDrawDetails(recordId: string): Promise<{ details?: string; error?: string }> {
    const config = checkAirtableConfig();
    if (config.error) {
        return { error: config.error };
    }
    const { apiKey, baseId, tableName } = config;
  
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName!)}/${recordId}`;
  
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 600 }, // Cache for 10 minutes
      });
  
      if (!response.ok) {
        return { error: 'Failed to fetch draw details.' };
      }
  
      const data = await response.json();
      const validated = AirtableRecordSchema.safeParse(data);
  
      if (!validated.success) {
        return { error: 'Invalid data format for draw details.' };
      }
  
      return { details: validated.data.fields.Details || 'No additional details available.' };
    } catch (error) {
      return { error: 'An unexpected error occurred while fetching details.' };
    }
  }
