// Run from the WWT project directory where node_modules has @supabase/supabase-js
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const supabaseUrl = 'https://orvdpuweicpxvuxcgkbl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydmRwdXdlaWNweHZ1eGNna2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjU0MzIsImV4cCI6MjA4Njc0MTQzMn0.s9edcESACyXIdQ74QEhRzIspO95UEk-guW7sTJWN0bc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const basePath = '/Volumes/WWT01/04. App/WWT/public/images'

// Step 1: Fetch all posts to identify the 4 target posts
console.log('Fetching posts...')
const { data: posts, error: fetchErr } = await supabase
    .from('posts')
    .select('id,title_zh,title_en,slug,published_at,status')
    .order('published_at', { ascending: false })
    .limit(10)

if (fetchErr) {
    console.error('Error fetching posts:', fetchErr)
    process.exit(1)
}

console.log('Recent posts:')
posts.forEach(p => {
    console.log(`  ID: ${p.id} | Title: ${p.title_zh || p.title_en} | Slug: ${p.slug} | Status: ${p.status}`)
})

// Map posts to images based on titles
const imageMap = [
    { titleMatch: 'obsidian', file: 'post-obsidian-skills.png', label: 'Obsidian Skills' },
    { titleMatch: 'jackie', file: 'post-portfolio-design.png', label: 'Jackie Zhang Portfolio' },
    { titleMatch: 'sss', file: 'post-tofu-dishes.png', label: 'Tofu Dishes' },
    { titleMatch: 'asdasdasdasd', file: 'post-premium-content.png', label: 'Premium Content' },
]

for (const mapping of imageMap) {
    const post = posts.find(p =>
        (p.title_zh || '').toLowerCase().includes(mapping.titleMatch) ||
        (p.title_en || '').toLowerCase().includes(mapping.titleMatch) ||
        (p.slug || '').toLowerCase().includes(mapping.titleMatch)
    )

    if (!post) {
        console.log(`\n⚠️  No post found matching "${mapping.titleMatch}"`)
        continue
    }

    console.log(`\n📤 Uploading ${mapping.label} for post: ${post.title_zh || post.title_en} (${post.id})`)

    // Read image file
    const imgPath = resolve(basePath, mapping.file)
    const imgBuffer = readFileSync(imgPath)

    // Upload to Supabase Storage
    const storageName = `featured-${mapping.titleMatch}-${Date.now()}.png`
    const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('media')
        .upload(storageName, imgBuffer, {
            contentType: 'image/png',
            upsert: true
        })

    if (uploadErr) {
        console.error(`  ❌ Upload failed for ${mapping.label}:`, uploadErr.message)
        continue
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(uploadData.path)

    const publicUrl = urlData.publicUrl
    console.log(`  ✅ Uploaded: ${publicUrl}`)

    // Update post's featured_image
    const { error: updateErr } = await supabase
        .from('posts')
        .update({ featured_image: publicUrl })
        .eq('id', post.id)

    if (updateErr) {
        console.error(`  ❌ Update failed for ${mapping.label}:`, updateErr.message)
    } else {
        console.log(`  ✅ Updated post featured_image`)
    }
}

console.log('\n🎉 Done!')
