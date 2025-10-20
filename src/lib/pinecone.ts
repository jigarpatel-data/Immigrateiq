
'use server';

import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from 'genkit';
import { ai } from '@/ai/genkit';

// This function queries a Pinecone index.
export async function queryPinecone(embedding: number[], topK: number): Promise<Document[]> {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME;
    const hostUrl = process.env.PINECONE_HOST_URL;
    
    if (!apiKey) {
        throw new Error('Pinecone API key not found in environment variables.');
    }
    if (!indexName) {
        throw new Error('Pinecone index name not configured in environment variables.');
    }
     if (!hostUrl) {
        throw new Error('Pinecone host URL not configured in environment variables.');
    }

    try {
        const pinecone = new Pinecone({ apiKey });
        
        const index = pinecone.index(indexName);

        const queryResponse = await index.query({
            vector: embedding,
            topK,
            includeMetadata: true,
        });

        if (queryResponse.matches) {
            return queryResponse.matches.map(match => {
                const metadata = match.metadata as { text?: string };
                // Reconstruct the Document object in the expected format for Genkit
                return new Document({
                    content: [{ text: metadata?.text || '' }],
                    metadata: match.metadata,
                });
            });
        }
        return [];

    } catch (error) {
        console.error("Error querying Pinecone:", error);
        throw new Error("Failed to query the vector database.");
    }
}

// This function generates an embedding for a given text using Genkit.
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await ai.embed({
    embedder: 'googleai/text-embedding-004',
    content: text,
  });
  return embedding;
}
