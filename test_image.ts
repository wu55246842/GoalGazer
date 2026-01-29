import { generateImageBuffer } from './apps/web/lib/pollinations';
import fs from 'fs';

async function test() {
    try {
        const prompt = "真实的比赛图片, A stylized football match illustration representing Liverpool vs Wolves, Premier League match atmosphere, abstract players in motion, no identifiable faces, stadium lights, crowd as soft silhouettes, tactical diagrams and data visualization overlays, editorial illustration style, clean and modern, no logos, no team badges, no text";
        console.log('🚀 Generating image buffer (auth)...');
        const buffer = await generateImageBuffer(prompt, 'zimage');
        fs.writeFileSync('test_output.png', buffer);
        console.log(`✅ Success! Saved to test_output.png (${buffer.length} bytes)`);
    } catch (e) {
        console.error('❌ Failed:', e);
    }
}

test();
