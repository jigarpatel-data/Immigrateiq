
import { config } from 'dotenv';
config();

import '@/ai/flows/immigration-chatbot.ts';
import '@/ai/flows/search-term-extractor.ts';
import '@/ai/flows/crs-calculator-chatbot.ts';
import '@/ai/flows/noc-finder-chatbot.ts';
import '@/ai/tools/noc-lookup.ts';
    
