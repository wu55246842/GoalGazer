import Replicate from "replicate";

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
const POIXE_API_URL = "https://api.poixe.com/v1/chat/completions";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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

/**
 * Utility to retry an async function with a fixed 5-second interval.
 */
async function tryWithRetries<T>(name: string, fn: () => Promise<T>, retries: number): Promise<T | null> {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            console.warn(`⚠️ [${name}] attempt ${i + 1}/${retries + 1} failed:`, (error as Error).message);
            if (i < retries) {
                console.log(`   Waiting 5 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    return null;
}

export async function generateText(req: PollinationsRequest): Promise<string> {
    // 1. Pollinations (Priority 1 - 3 Retries)
    const pollinationsResult = await tryWithRetries("Pollinations", async () => {
        return await generateTextPollinations(req);
    }, 3);
    if (pollinationsResult) return pollinationsResult;

    // 2. Poixe (Priority 2 - 3 Retries)
    if (process.env.POIXE_API_KEY) {
        console.log("Fallback: Switching to Poixe API...");
        const poixeResult = await tryWithRetries("Poixe", async () => {
            return await generateTextPoixe(req);
        }, 3);
        if (poixeResult) return poixeResult;
    }

    // 3. OpenRouter (Priority 3 - 3 Retries)
    if (process.env.OPENROUTER_API_KEY) {
        console.log("Fallback: Switching to OpenRouter API...");
        const openRouterResult = await tryWithRetries("OpenRouter", async () => {
            return await generateTextOpenRouter(req);
        }, 3);
        if (openRouterResult) return openRouterResult;
    }

    // 4. OpenAI (Priority 4 - Final Attempt)
    if (process.env.OPENAI_API_KEY) {
        console.log("Fallback: Switching to OpenAI AI...");
        try {
            return await generateTextOpenAI(req);
        } catch (error) {
            console.error("OpenAI fallback failed:", (error as Error).message);
        }
    }

    return "Error generating analysis. All providers failed. Please try again later.";
}

async function generateTextPollinations({
    messages,
    model = 'gemini-fast',
    seed,
    jsonMode = false,
}: PollinationsRequest): Promise<string> {
    const apiKey = process.env.POLLINATIONS_API_KEY;

    console.log(`   Calling Pollinations AI [${model}]...`);

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
            json: !jsonMode, // Pollinations specific if not jsonMode
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
    }

    // Pollinations can return raw text or JSON depending on 'json' parameter
    const text = await response.text();
    try {
        const data = JSON.parse(text);
        return data.choices?.[0]?.message?.content || data.content || text;
    } catch {
        return text;
    }
}

async function generateTextPoixe({
    messages,
    jsonMode = false,
}: PollinationsRequest): Promise<string> {
    const apiKey = process.env.POIXE_API_KEY;
    const model = "gemini-3-flash-preview:free";

    console.log(`   Calling Poixe API [${model}]...`);

    const response = await fetch(POIXE_API_URL, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages,
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

async function generateTextOpenRouter({
    messages,
    jsonMode = false,
}: PollinationsRequest): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = "google/gemini-3-flash-preview";

    console.log(`   Calling OpenRouter API [${model}]...`);

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://goalgazer.xyz",
            "X-Title": "GoalGazer",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model,
            messages,
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

async function generateTextOpenAI({
    messages,
    jsonMode = false,
}: PollinationsRequest): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not defined.');
    }

    console.log(`   Calling OpenAI API [${model}]...`);

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
        throw new Error(`Status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

/**
 * Generate an image using Pollinations AI with fallback to Replicate.
 * Returns the image as a Buffer (binary data).
 */
export async function generateImageBuffer(prompt: string, model: string = 'zimage'): Promise<Buffer> {
    try {
        return await generateImagePollinations(prompt, model);
    } catch (error) {
        console.warn('⚠️ Pollinations Image Generation failed, falling back to Replicate...', (error as Error).message);
        if (process.env.REPLICATE_API_TOKEN) {
            return await generateImageReplicate(prompt);
        }
        throw error;
    }
}

async function generateImagePollinations(prompt: string, model: string = 'zimage'): Promise<Buffer> {
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

async function generateImageReplicate(prompt: string, aspectRatio: string = '16:9'): Promise<Buffer> {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
        throw new Error('REPLICATE_API_TOKEN is not configured.');
    }

    console.log(`   🎨 Calling Replicate [flux-schnell]...`);

    const replicate = new Replicate({
        auth: apiKey,
    });

    const input = {
        prompt,
        aspect_ratio: aspectRatio,
        disable_safety_checker: true,
        output_format: 'jpg',
        go_fast: true
    };

    const output = await replicate.run("black-forest-labs/flux-schnell", { input });
    let imageUrl: string;

    if (Array.isArray(output) && output.length > 0) {
        imageUrl = String(output[0]);
    } else {
        imageUrl = String(output);
    }

    console.log(`   📥 Fetching image from Replicate: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from Replicate: ${response.statusText}`);
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