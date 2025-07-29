"use client"

import React, { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Copy } from "lucide-react"

interface DiagramViewerProps {
  title: string
  content: string
  description?: string
  validated?: boolean
}

export default function DiagramViewer({ title, content, description, validated = true }: DiagramViewerProps) {
  const diagramRef = useRef<HTMLDivElement>(null)
  const [diagramSvg, setDiagramSvg] = React.useState<string>('')
  const [error, setError] = React.useState<string>('')

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        // Dynamically import mermaid to avoid SSR issues
        const mermaid = await import('mermaid')
        
        // Initialize mermaid with a clean config
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true
          }
        })

        // Generate unique ID for this diagram
        const diagramId = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        
        // Render the diagram
        const { svg } = await mermaid.default.render(diagramId, content)
        setDiagramSvg(svg)
        setError('')
      } catch (err) {
        console.error('Error rendering mermaid diagram:', err)
        setError('Failed to render diagram. Please check the diagram syntax.')
      }
    }

    if (content) {
      renderDiagram()
    }
  }, [content])

  const downloadDiagram = () => {
    if (diagramSvg) {
      const blob = new Blob([diagramSvg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '_')}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const copyDiagramCode = () => {
    navigator.clipboard.writeText(content)
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {validated && (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Validated</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyDiagramCode}
              className="h-8"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadDiagram}
              disabled={!diagramSvg}
              className="h-8"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-2">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <details className="mt-2">
              <summary className="text-red-600 cursor-pointer text-xs">Show diagram code</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-x-auto">
                {content}
              </pre>
            </details>
          </div>
        ) : diagramSvg ? (
          <div 
            ref={diagramRef}
            className="diagram-container flex justify-center items-center p-4 bg-white rounded-lg border"
            dangerouslySetInnerHTML={{ __html: diagramSvg }}
          />
        ) : (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 