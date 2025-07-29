/**
 * Simple markdown to HTML conversion utilities for TipTap editor
 */

export function convertMarkdownImages(markdown: string): string {
  // Convert markdown image syntax ![alt](src) to HTML <img> tags
  return markdown.replace(
    /!\[([^\]]*)\]\(([^\)]+)\)/g,
    (match, alt, src) => {
      // Handle local files by adding /docs-media/ prefix
      let imageSrc = src
      if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
        imageSrc = `/docs-media/${src}`
      }
      
      return `<img src="${imageSrc}" alt="${alt}" class="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700" />`
    }
  )
}

export function convertMarkdownVideos(content: string): string {
  // Ensure video tags have proper classes
  return content.replace(
    /<video([^>]*)>/g,
    (match, attributes) => {
      // Add classes if not present
      if (!attributes.includes('class=')) {
        attributes += ' class="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700"'
      }
      // Ensure controls are present
      if (!attributes.includes('controls')) {
        attributes += ' controls'
      }
      return `<video${attributes}>`
    }
  )
}

export function processMarkdownMedia(content: string): string {
  // Process both images and videos
  let processed = convertMarkdownImages(content)
  processed = convertMarkdownVideos(processed)
  return processed
}