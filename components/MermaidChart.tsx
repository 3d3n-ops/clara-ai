"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"

interface MermaidChartProps {
  chart: string;
}

const MermaidChart: React.FC<MermaidChartProps> = ({ chart }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    const renderChart = async () => {
      if (chartRef.current && chart) {
        try {
          // Initialize mermaid if not already initialized
          if (!(window as any).mermaidInitialized) {
            mermaid.initialize({
              startOnLoad: false,
              theme: 'default',
              securityLevel: 'loose'
            })
            ;(window as any).mermaidInitialized = true
          }
          
          const { svg } = await mermaid.render(`mermaid-chart-${Date.now()}`, chart)
          setSvg(svg)
        } catch (error) {
          console.error("Mermaid rendering error:", error)
          setSvg(`<pre>${chart}</pre>`) // Fallback to plain text if rendering fails
        }
      }
    }

    renderChart()
  }, [chart])

  if (!chart) {
    return null;
  }

  return (
    <div ref={chartRef} dangerouslySetInnerHTML={{ __html: svg || "Loading diagram..." }} />
  )
}

export default MermaidChart
