const VIDEO_FILE_PATTERN = /\.(mp4|mov|webm)(?:$|[?#])/i
export const MAX_JOB_VIDEO_DURATION_SECONDS = 30

export function isVideoUrl(url = '') {
  return VIDEO_FILE_PATTERN.test(url)
}

export function getLeadMedia(imageUrls = []) {
  return imageUrls
    .filter((url) => typeof url === 'string' && url.trim())
    .slice(0, 10)
    .map((url) => ({ url, type: isVideoUrl(url) ? 'video' : 'image' }))
}

function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Unable to read video duration for ${file.name}.`))
    }
    video.src = objectUrl
  })
}

export async function validateJobMediaFiles(
  files,
  getVideoDuration = readVideoDuration,
) {
  for (const file of files) {
    if (!file.type?.startsWith('video/')) continue
    const duration = await getVideoDuration(file)
    if (duration > MAX_JOB_VIDEO_DURATION_SECONDS) {
      throw new Error('Job videos must be 30 seconds or shorter.')
    }
  }
}
