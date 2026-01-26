/**
 * Pollinations AI API client for text generation.
 * Reference: https://pollinations.ai/
 * 
    gemini-fast	✅ 可用	推荐使用，速度快且稳定
    openai	✅ 可用	可用
    qwen-coder	✅ 可用	适合代码相关任务
    perplexity-fast	✅ 可用	适合联网搜索任务
    grok	✅ 可用	可用
 */

const POLLINATIONS_ENDPOINT = 'https://gen.pollinations.ai/v1/chat/completions';

export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface PollinationsRequest {
    messages: Message[];
    model?: string;
    seed?: number;
    jsonMode?: boolean;
}

export interface PollinationsResponse {
    choices: {
        message: {
            content: string;
            role: string;
        };
    }[];
}


export async function generateText({
    messages,
    model = 'gemini-fast',
    seed,
    jsonMode = false,
}: PollinationsRequest): Promise<string> {
    const apiKey = process.env.POLLINATIONS_API_KEY;

    if (!apiKey) {
        console.warn('POLLINATIONS_API_KEY is not defined in environment variables. Using hardcoded fallback.');
    }

    try {
        console.log(`Calling Pollinations AI [${model}]...`);

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(POLLINATIONS_ENDPOINT, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                messages,
                model,
                seed,
                ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pollinations AI error (${response.status}): ${errorText}`);
        }

        const data: PollinationsResponse = await response.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (error) {
        console.error('Error calling Pollinations AI:', error);
        throw error;
    }
}

// Alias for my new API to avoid breaking it
export const generateAnalysis = generateText;

/**
 * Manual Test Script
 * Note: If you have a .env file, run it with:
 * npx tsx --env-file=.env apps/web/lib/pollinations.ts
 */
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
    (async () => {
        console.log('🚀 Starting Pollinations AI self-test...');
        try {
            const response = await generateText({
                messages: [
                    { role: 'system', content: 'You are a football tactician.' },
                    { role: 'user', content: 'Give me a 1-sentence summary of why high-pressing is effective.' }
                ],
                model: 'grok'
            });
            console.log('\n--- AI Response ---');
            console.log(response);
            console.log('\n✅ Test completed successfully.');
        } catch (error) {
            console.error('\n❌ Test failed!');
        }
    })();
}