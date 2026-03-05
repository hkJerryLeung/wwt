import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Fake user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    try {
        await page.goto('https://seeds.com.tw/courses/musicianseacow', { waitUntil: 'networkidle2', timeout: 30000 });

        // Evaluate in page
        const media = await page.evaluate(() => {
            const vids = Array.from(document.querySelectorAll('video')).map(v => ({
                src: v.src || v.querySelector('source')?.src,
                poster: v.poster,
                id: v.id,
                className: v.className
            }));

            const imgs = Array.from(document.querySelectorAll('img'))
                .filter(i => {
                    // get large imgs
                    return i.width > 300 || i.className.includes('hero') || i.className.includes('bg');
                })
                .map(i => ({ src: i.src, alt: i.alt, className: i.className }));

            // Check for inline background-images in first few sections
            const sections = Array.from(document.querySelectorAll('section, div'));
            const bgImages = [];
            for (const el of sections.slice(0, 50)) {
                const bg = window.getComputedStyle(el).backgroundImage;
                if (bg && bg !== 'none') {
                    bgImages.push(bg);
                }
            }

            return { vids, imgs, bgImages: [...new Set(bgImages)] };
        });

        console.log(JSON.stringify(media, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await browser.close();
    }
})();
