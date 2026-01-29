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


export async function generateText(req: PollinationsRequest): Promise<string> {
    try {
        return await generateTextPollinations(req);
    } catch (error) {
        console.warn('⚠️ Pollinations AI failed, falling back to OpenAI...', error);
        return await generateTextOpenAI(req);
    }
}

async function generateTextPollinations({
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
        throw error;
    }
}

async function generateTextOpenAI({
    messages,
    jsonMode = false,
}: PollinationsRequest): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not defined in environment variables.');
    }

    console.log(`Calling OpenAI API [${model}]...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

/**
 * Generate an image using Pollinations AI.
 * Returns the image as a Buffer (binary data).
 * Requires POLLINATIONS_API_KEY.
 */
export async function generateImageBuffer(prompt: string, model: string = 'zimage'): Promise<Buffer> {
    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (!apiKey) {
        throw new Error('POLLINATIONS_API_KEY is required for authenticated image generation.');
    }

    const width = 1024;
    const height = 768;
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);

    const url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

    console.log(`   🎨 Calling Pollinations Image Gen [${model}]...`);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pollinations Image error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Returns the URL (legacy support, but note it might not be viewable without Auth)
 */
export function getImageUrl(prompt: string, model: string = 'zimage'): string {
    const width = 1024;
    const height = 768;
    const seed = Math.floor(Math.random() * 1000000);
    return `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;
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
                model: 'nova-fast'
            });
            console.log('\n--- AI Response ---');
            console.log(response);

            console.log('\n🚀 Testing generateImageBuffer...');
            const buffer = await generateImageBuffer('Liverpool vs Wolves match atmosphere, tactical diagram style', 'zimage');
            console.log(`✅ Received image buffer: ${buffer.length} bytes`);

            console.log('\n✅ Test completed successfully.');
        } catch (error) {
            console.error('\n❌ Test failed!');
        }
    })();
}