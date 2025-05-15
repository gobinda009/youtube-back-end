const express = require('express')
const cors = require('cors')
const ytdl = require('@distube/ytdl-core')
const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())
app.use(cors({
  origin: '*'
}))
app.get('/', (req, res) => {
  res.send('YouTube Downloader API is running')
})

app.post('/getFormats', async (req, res) => {
  const videoUrl = req.body.url

  if (!videoUrl || !ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' })
  }

  try {
    const info = await ytdl.getInfo(videoUrl)
    
    const formats = {
      videoWithAudio: info.formats
        .filter(f => f.hasVideo && f.hasAudio)
        .map(f => ({ itag: f.itag, qualityLabel: f.qualityLabel || `${f.container} (${f.quality})` })),
      videoOnly: info.formats
        .filter(f => f.hasVideo && !f.hasAudio)
        .map(f => ({ itag: f.itag, qualityLabel: f.qualityLabel || `${f.container} (${f.quality})` })),
      audioOnly: info.formats
        .filter(f => !f.hasVideo && f.hasAudio)
        .map(f => ({ itag: f.itag, qualityLabel: `${f.audioBitrate}kbps (${f.container})` }))
    }

    res.json(formats)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch video formats' })
  }
})

app.get('/download', async (req, res) => {
  const { url, itag } = req.query

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' })
  }

  try {
    const info = await ytdl.getInfo(url)
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '') // Clean filename

    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`)
    
    ytdl(url, {
      quality: itag || 'highest',
      filter: format => itag ? format.itag == itag : format.container === 'mp4'
    }).pipe(res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to process video' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})
