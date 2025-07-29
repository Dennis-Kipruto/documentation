import { Node, mergeAttributes } from '@tiptap/core'

export interface VideoOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      /**
       * Add a video
       */
      setVideo: (options: { src: string; alt?: string; title?: string }) => ReturnType
    }
  }
}

export const Video = Node.create<VideoOptions>({
  name: 'video',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      controls: {
        default: true,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const attributes = mergeAttributes(
      {
        controls: true,
        class: 'max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700',
      },
      this.options.HTMLAttributes,
      HTMLAttributes
    )

    // Process local video files - add /docs-media/ prefix if not already present
    if (attributes.src && !attributes.src.startsWith('http') && !attributes.src.startsWith('/') && !attributes.src.startsWith('data:')) {
      attributes.src = `/docs-media/${attributes.src}`
    }

    return ['video', attributes]
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})