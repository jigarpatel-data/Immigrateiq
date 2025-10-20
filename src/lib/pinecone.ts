
'use server';

import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from 'genkit';
import { ai } from '@/ai/genkit';

let pinecone: Pinecone | null = null;

const getPineconeClient = async () => {
    if (!pinecone) {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            throw new Error('Pinecone API key not found in environment variables.');
        }
        pinecone = new Pinecone({ apiKey });
    }
    return pinecone;
};

export async function queryPinecone(embedding: number[], topK: number): Promise<Document[]> {
    const client = await getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME;
    const hostUrl = process.env.PINECONE_HOST_URL;
    
    if (!indexName || !hostUrl) {
        throw new Error('Pinecone index name or host URL not configured.');
    }
    
    const index = client.index(indexName);

    try {
        const queryResponse = await index.query({
            vector: embedding,
            topK,
            includeMetadata: true,
        });

        if (queryResponse.matches) {
            return queryResponse.matches.map(match => {
                const metadata = match.metadata as { text?: string };
                return Document.fromText(metadata?.text || '', match.metadata);
            });
        }
        return [];

    } catch (error) {
        console.error("Error querying Pinecone:", error);
        throw new Error("Failed to query the vector database.");
    }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await ai.embed({
    embedder: 'googleai/text-embedding-004',
    content: text,
  });
  return embedding;
}
