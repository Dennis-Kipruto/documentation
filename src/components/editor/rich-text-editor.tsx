'use client'

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import { createLowlight } from 'lowlight'
import { useCallback, useEffect } from 'react'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  FileText
} from 'lucide-react'
import { Video } from './video-extension'
import { processMarkdownMedia } from '@/lib/markdown-utils'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ 
  content, 
  onChange, 
  onSave: _onSave, 
  placeholder = "Start writing...",
  className = ""
}: RichTextEditorProps) {
  const lowlight = createLowlight()
  
  // Custom extension to handle markdown paste
  const MarkdownPasteHandler = Extension.create({
    name: 'markdownPasteHandler',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('markdownPasteHandler'),
          props: {
            handlePaste: (view, event, _slice) => {
              const text = event.clipboardData?.getData('text/plain')
              if (!text) return false

              // Check if text contains markdown image syntax
              if (text.includes('![') && text.includes('](')) {
                // Process the markdown and insert as HTML
                const processedHtml = processMarkdownMedia(text)
                
                // Use a setTimeout to ensure the editor is ready
                setTimeout(() => {
                  // Get editor instance from the view
                  const editorInstance = (view as any).editor
                  if (editorInstance) {
                    editorInstance.commands.insertContent(processedHtml)
                  }
                }, 0)
                
                return true
              }

              return false
            },
          },
        }),
      ]
    },
  })
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700',
        },
        allowBase64: true,
        inline: false,
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            src: {
              default: null,
              parseHTML: element => {
                const src = element.getAttribute('src')
                // Handle local files
                if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
                  return `/docs-media/${src}`
                }
                return src
              },
              renderHTML: attributes => {
                let src = attributes.src
                // Handle local files
                if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
                  src = `/docs-media/${src}`
                }
                return { src }
              },
            },
          }
        },
      }),
      Video.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Typography,
      Placeholder.configure({
        placeholder,
      }),
      MarkdownPasteHandler,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl prose-enhanced mx-auto focus:outline-none min-h-[400px] p-4 dark:prose-invert',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Process markdown media before setting content
      const processedContent = processMarkdownMedia(content)
      editor.commands.setContent(processedContent)
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    const input = window.prompt('Image URL or markdown syntax (![alt](src))')
    if (input) {
      // Check if input is markdown image syntax
      const markdownMatch = input.match(/!\[([^\]]*)\]\(([^\)]+)\)/)
      if (markdownMatch) {
        const [, alt, src] = markdownMatch
        let imageSrc = src
        // Handle local files
        if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
          imageSrc = `/docs-media/${src}`
        }
        editor?.chain().focus().setImage({ src: imageSrc, alt }).run()
      } else {
        // Treat as direct URL
        editor?.chain().focus().setImage({ src: input }).run()
      }
    }
  }, [editor])

  const addVideo = useCallback(() => {
    const url = window.prompt('Video URL or filename')
    if (url) {
      editor?.chain().focus().setVideo({ src: url }).run()
    }
  }, [editor])


  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const parseMarkdown = useCallback(() => {
    const markdownText = window.prompt('Paste markdown content (with images/videos):')
    if (markdownText) {
      const processedHtml = processMarkdownMedia(markdownText)
      editor?.commands.insertContent(processedHtml)
    }
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={`border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-2">
        <div className="flex flex-wrap gap-1">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('strike') ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('code') ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Code"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>

          {/* Block Elements */}
          <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('blockquote') ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('codeBlock') ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Horizontal Rule"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Media & Links */}
          <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-2">
            <button
              onClick={setLink}
              className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                editor.isActive('link') ? 'bg-slate-200 dark:bg-slate-700' : ''
              }`}
              title="Add Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={addImage}
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Add Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={addVideo}
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Add Video"
            >
              <VideoIcon className="w-4 h-4" />
            </button>
            <button
              onClick={addTable}
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Add Table"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={parseMarkdown}
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Parse Markdown"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-white dark:bg-slate-900">
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                editor.isActive('bold') ? 'bg-slate-100 dark:bg-slate-700' : ''
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                editor.isActive('italic') ? 'bg-slate-100 dark:bg-slate-700' : ''
              }`}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={setLink}
              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                editor.isActive('link') ? 'bg-slate-100 dark:bg-slate-700' : ''
              }`}
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
        </BubbleMenu>

        <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-slate-100 dark:bg-slate-700' : ''
              }`}
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                editor.isActive('bulletList') ? 'bg-slate-100 dark:bg-slate-700' : ''
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                editor.isActive('blockquote') ? 'bg-slate-100 dark:bg-slate-700' : ''
              }`}
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>
        </FloatingMenu>

        <EditorContent editor={editor} />
      </div>

      {/* Save shortcut hint */}
      <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-2">
        <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
          <span>Press Ctrl+S to save</span>
          <span>{editor.storage.characterCount?.characters() || 0} characters</span>
        </div>
      </div>
    </div>
  )
}