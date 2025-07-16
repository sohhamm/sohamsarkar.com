export interface YouTubeTrack {
  title: string
  artist: string
  duration: string
  thumbnail: string
  videoId: string
}

export interface PlaylistData {
  title: string
  description: string
  playlistUrl: string
  tracks: YouTubeTrack[]
}

// Format duration from ISO 8601 (PT4M13S) to MM:SS
function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  const totalMinutes = hours * 60 + minutes
  return `${totalMinutes}:${seconds.toString().padStart(2, '0')}`
}

// Extract artist from video title (enhanced patterns)
function extractArtist(title: string): { title: string; artist: string } {
  // Clean up common YouTube prefixes/suffixes
  let cleanTitle = title
    .replace(/\[Official.*?\]/gi, '')
    .replace(/\(Official.*?\)/gi, '')
    .replace(/\[Lyric.*?\]/gi, '')
    .replace(/\(Lyric.*?\)/gi, '')
    .replace(/\[Audio.*?\]/gi, '')
    .replace(/\(Audio.*?\)/gi, '')
    .replace(/\[HD\]/gi, '')
    .replace(/\(HD\)/gi, '')
    .replace(/\[4K\]/gi, '')
    .replace(/\(4K\)/gi, '')
    .trim()

  // Enhanced patterns for artist extraction
  const patterns = [
    // Standard patterns: "Artist - Title", "Artist: Title"
    /^(.+?)\s*[-–—]\s*(.+)$/,
    /^(.+?)\s*:\s*(.+)$/,
    /^(.+?)\s*[|｜]\s*(.+)$/,
    
    // "Title by Artist", "Title - Artist"
    /^(.+?)\s+by\s+(.+)$/i,
    /^(.+?)\s*[-–—]\s*(.+)$/,
    
    // Artist in quotes: '"Title" Artist'
    /^["'](.+?)["']\s+(.+)$/,
    /^(.+?)\s+["'](.+?)["']$/,
    
    // Feat/ft patterns: "Artist feat. Artist2 - Title"
    /^(.+?(?:\s+(?:feat\.?|ft\.?|featuring)\s+.+?))\s*[-–—]\s*(.+)$/i,
    
    // Parentheses patterns: "Artist (Title)" or "Title (Artist)"
    /^(.+?)\s*\((.+?)\)$/,
    
    // "Artist - Title (something)"
    /^(.+?)\s*[-–—]\s*(.+?)\s*\([^)]*\)$/,
  ]
  
  for (const pattern of patterns) {
    const match = cleanTitle.match(pattern)
    if (match) {
      let artist = match[1].trim()
      let songTitle = match[2].trim()
      
      // Check if the first capture group looks more like a title (common with some patterns)
      if (pattern.source.includes('\\((.+?)\\)$') && artist.length > songTitle.length) {
        // Swap for parentheses pattern when artist seems too long
        [artist, songTitle] = [songTitle, artist]
      }
      
      // Clean up common channel suffixes from artist names
      artist = artist
        .replace(/\s*(?:VEVO|Records|Music|Official|Channel)$/gi, '')
        .replace(/\s*(?:Topic)$/gi, '')
        .trim()
      
      // Validate that we extracted something meaningful
      if (artist.length > 0 && artist.length < 100) {
        return {
          artist: artist,
          title: songTitle || cleanTitle
        }
      }
    }
  }
  
  // If no pattern matches, try to extract from common YouTube channel naming
  const channelPatterns = [
    /^(.+?)\s*(?:VEVO|Records|Music|Official|Channel|Topic)$/gi
  ]
  
  for (const pattern of channelPatterns) {
    const match = cleanTitle.match(pattern)
    if (match) {
      return {
        artist: match[1].trim(),
        title: cleanTitle
      }
    }
  }
  
  // If still no match, use the full title and "Unknown Artist"
  return {
    title: cleanTitle,
    artist: 'Unknown Artist'
  }
}

export async function fetchYouTubePlaylist(playlistId: string, apiKey: string): Promise<PlaylistData> {
  try {
    // Fetch playlist details
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`
    )
    
    if (!playlistResponse.ok) {
      throw new Error(`Failed to fetch playlist: ${playlistResponse.statusText}`)
    }
    
    const playlistData = await playlistResponse.json()
    const playlist = playlistData.items?.[0]
    
    if (!playlist) {
      throw new Error('Playlist not found')
    }
    
    // Fetch all playlist items with pagination
    let allItems: any[] = []
    let nextPageToken = ''
    
    do {
      const itemsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}&key=${apiKey}`
      )
      
      if (!itemsResponse.ok) {
        throw new Error(`Failed to fetch playlist items: ${itemsResponse.statusText}`)
      }
      
      const itemsData = await itemsResponse.json()
      allItems = allItems.concat(itemsData.items || [])
      nextPageToken = itemsData.nextPageToken || ''
    } while (nextPageToken)
    
    // Filter out deleted videos first
    const validItems = allItems.filter((item: any) => {
      const title = item.snippet.title || ''
      const isDeleted = title.includes('Deleted video') || 
                       title.includes('Private video') || 
                       title.includes('[Deleted Video]') ||
                       title.includes('[Private Video]') ||
                       !item.snippet.resourceId?.videoId
      return !isDeleted
    })
    
    // Get video IDs and batch them properly (YouTube API supports max 50 IDs per request)
    const videoIds = validItems.map((item: any) => item.snippet.resourceId.videoId)
    
    // Batch video requests in chunks of 50
    const videoDetailsMap = new Map()
    const batchSize = 50
    
    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batchIds = videoIds.slice(i, i + batchSize).join(',')
      
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batchIds}&key=${apiKey}`
      )
      
      if (videosResponse.ok) {
        const videosData = await videosResponse.json()
        const videoDetails = videosData.items || []
        
        videoDetails.forEach((video: any) => {
          videoDetailsMap.set(video.id, video)
        })
      } else {
        console.error(`Failed to fetch video details batch: ${videosResponse.statusText}`)
      }
    }
    
    // Process tracks
    const tracks: YouTubeTrack[] = validItems.map((item: any) => {
        const videoId = item.snippet.resourceId.videoId
        const videoDetail = videoDetailsMap.get(videoId)
        const duration = videoDetail?.contentDetails?.duration || 'PT0S'
        
        const { title, artist } = extractArtist(item.snippet.title)
        const formattedDuration = formatDuration(duration)
        
        return {
          title,
          artist,
          duration: formattedDuration,
          thumbnail: item.snippet.thumbnails?.default?.url || '',
          videoId
        }
      })
    
    return {
      title: playlist.snippet.title,
      description: playlist.snippet.description || 'A curated playlist',
      playlistUrl: `https://music.youtube.com/playlist?list=${playlistId}`,
      tracks
    }
    
  } catch (error) {
    console.error('Error fetching YouTube playlist:', error)
    throw error
  }
}

// Fallback data in case API fails
export const fallbackPlaylistData: PlaylistData = {
  title: 'Your Sonic Identity',
  description: 'A curated playlist that defines my musical taste',
  playlistUrl: 'https://music.youtube.com/playlist?list=PLvU9iXRGj0MQiHp6XSWJ3Q9veSGGrEZyS',
  tracks: [
    {
      title: 'Unable to load playlist',
      artist: 'Check your API configuration',
      duration: '0:00',
      thumbnail: 'https://via.placeholder.com/60x60',
      videoId: ''
    }
  ]
}