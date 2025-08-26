import mermaid from 'mermaid';

// Initialize Mermaid with our preferred configuration
let isInitialized = false;

export const initializeMermaid = async () => {
  if (isInitialized || typeof window === 'undefined') return;
  
  try {
    // Configure Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'inherit',
      themeCSS: `
        .mermaid {
          font-family: var(--font-sans);
          background: transparent !important;
        }
        .node rect, .node circle, .node ellipse, .node polygon, .node path {
          fill: hsl(var(--primary)) !important;
          stroke: hsl(var(--primary)) !important;
        }
        .edgePath path {
          stroke: hsl(var(--muted-foreground)) !important;
        }
      `,
    });
    
    isInitialized = true;
    
    // Add a mutation observer to handle dynamic content
    if (typeof window !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        const shouldRender = mutations.some((mutation) => {
          return mutation.addedNodes.length > 0 && 
                 document.querySelector('.mermaid:not([data-processed])');
        });
        
        if (shouldRender) {
          renderMermaidDiagrams();
        }
      });
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    }
    
  } catch (error) {
    console.error('Error initializing Mermaid:', error);
  }
};

export const renderMermaidDiagrams = async (container: HTMLElement | Document = document) => {
  if (typeof window === 'undefined') return;
  
  try {
    // Find all unprocessed Mermaid diagrams
    const mermaidElements = container.querySelectorAll<HTMLElement>('.mermaid:not([data-processed])');
    
    if (mermaidElements.length === 0) return;
    
    // Process each diagram
    for (const element of Array.from(mermaidElements)) {
      try {
        // Skip if already processed or empty
        if (element.hasAttribute('data-processed') || !element.textContent?.trim()) continue;
        
        // Mark as processed
        element.setAttribute('data-processed', 'true');
        
        // Get the diagram code
        const code = element.textContent.trim();
        
        // Generate SVG
        const { svg } = await mermaid.render(
          `mermaid-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          code
        );
        
        // Replace the content with the SVG
        element.innerHTML = svg;
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        element.innerHTML = `<div class="text-destructive text-sm">Error rendering diagram: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
        element.classList.add('mermaid-error');
      }
    }
  } catch (error) {
    console.error('Error in renderMermaidDiagrams:', error);
  }
};

// Initialize Mermaid when the module is imported
if (typeof window !== 'undefined') {
  initializeMermaid();
}
