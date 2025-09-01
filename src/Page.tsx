import React, { useState, useEffect } from 'react';
import SettingsScreen from './SettingsScreen';
import PptxGenJS from 'pptxgenjs';
import { ChevronLeft, ChevronRight, Play, Edit3, Eye, Maximize2, Download, Settings, Send } from 'lucide-react';

declare global {
  interface Window {
    mermaid: {
      initialize: (config: any) => void;
      render: (id: string, definition: string) => Promise<{ svg: string }>;
    };
  }
}

const PresentationMaker = () => {
  const [input, setInput] = useState(`{
# Welcome to SlideScript
## The fastest way to create presentations

Write your slides using simple syntax:
- Use "{" to separate slides
- Use # for titles, ## for subtitles
- Use - for bullet points
- Use **bold** and *italic* text
}

{
# Features ✨

## What makes SlideScript special?

- **Lightning Fast**: No complex UI, just type
- **Beautiful Design**: Professional themes built-in
- **Markdown Support**: Familiar syntax
- **Export Ready**: Download as HTML
}

{
# Getting Started 🚀

## Three simple steps:

1. **Write** your content in the editor
2. **Preview** your slides instantly  
3. **Present** or download your slides

> Pro tip: Use emojis to make your slides more engaging!
}

{
# Code Blocks

## Syntax highlighting supported:

\`\`\`javascript
function createSlide(content) {
  return {
    title: content.title,
    body: parseMarkdown(content.body)
  };
}
\`\`\`

Perfect for technical presentations!
}

{
# Thank You! 🎉

## Questions?

**Contact us:**
- Email: hello@slidescript.com
- Twitter: @slidescript
- GitHub: github.com/slidescript

*Made with ❤️ by the SlideScript team*
}`);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mode, setMode] = useState('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [slides, setSlides] = useState<any[]>([]);
  const [quickInput, setQuickInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showProcessingOverlay, setShowProcessingOverlay] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const getSettings = () => {
    const saved = localStorage.getItem('slideScriptSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  };

  const hideProcessingOverlay = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setShowProcessingOverlay(false);
      setIsGenerating(false);
      setIsAnimatingOut(false);
    }, 500);
  };

  const handleSendScenario = async () => {
    if (!quickInput.trim()) return;
    
    const settings = getSettings();
    if (!settings || !settings.selected) {
      alert('Please configure AI model in Settings first');
      return;
    }

    if (settings.selected === 'openrouter' && !settings.openRouterApiKey) {
      alert('Please enter your OpenRouter API key in Settings');
      return;
    }
    
    if (settings.selected === 'localLlama' && !settings.llamaUrl) {
      alert('Please enter your Local Llama URL in Settings');
      return;
    }

    setIsGenerating(true);
    setShowProcessingOverlay(true);
    setIsAnimatingOut(false);
    
    try {
      const systemPrompt = `CRITICAL: You MUST respond with ONLY the presentation content. NO explanations, greetings, markdown blocks, or extra text.

    REQUIRED FORMAT - Follow this EXACT syntax:
    {
    # Slide Title
    ## Subtitle (optional)

    - Bullet point
    - Another point
    **Bold text** and *italic text*
    }

    {
    # Next Slide Title

    Content here with proper spacing
    }

    STRICT RULES:
    1. NEVER wrap output in \`\`\`markdown\`\`\` or any code blocks
    2. NEVER add explanations like "Here's your presentation" or "I hope this helps"
    3. NEVER add greetings or conclusions
    4. Braces { and } MUST be on their own separate lines
    5. Each slide MUST start with { on its own line and end with } on its own line
    6. Use # for main titles, ## for subtitles
    7. Use - for bullet points, or 1. 2. 3. for numbered lists
    8. Support **bold**, *italic*, \`code\`, > quotes, emojis ✨
    9. Add blank lines for proper spacing
    10. Create 5-10 slides maximum
    11. Slide content should be accurate, detailed, well-structured, and relevant to the topic.

    CHART SUPPORT:
    - Use Mermaid charts/diagrams with \`\`\`mermaid code blocks
    - CRITICAL MERMAID SYNTAX RULES:
      * NO spaces around arrows: A-->B (correct), A --> B (wrong)
      * Node IDs must be alphanumeric: A, B1, node2 (correct), A-B, node! (wrong)
      * Quotes for labels: A["Start Process"] or A[Start Process]
      * Direction first: flowchart TD, sequenceDiagram, pie title Chart
      * End each line properly - no trailing characters
    
    SUPPORTED CHART TYPES & CORRECT SYNTAX:
    
    FLOWCHART:
    \`\`\`mermaid
    flowchart TD
        A[Start]-->B{Decision}
        B-->|Yes|C[Action A]
        B-->|No|D[Action B]
        C-->E[End]
        D-->E
    \`\`\`
    
    PIE CHART:
    \`\`\`mermaid
    pie title Market Share
        "Company A" : 42.5
        "Company B" : 35.2
        "Company C" : 22.3
    \`\`\`
    
    SEQUENCE DIAGRAM:
    \`\`\`mermaid
    sequenceDiagram
        participant A as User
        participant B as System
        A->>B: Request
        B-->>A: Response
    \`\`\`
    
    COMMON ERRORS TO AVOID:
    - Never use special characters in node IDs
    - Always start with chart type declaration
    - Use proper arrow syntax (no spaces)
    - Quote multi-word labels
    - Don't mix chart types in one block
    - End lines cleanly without extra punctuation
    
    USE CHARTS FOR: processes, workflows, data visualization, comparisons, timelines, hierarchies

    RESPOND WITH ONLY THE SLIDES - NOTHING ELSE.

    Topic: "${quickInput}"`;

      let response;
      
      if (settings.selected === 'openrouter') {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.openRouterApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: settings.openRouterModelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: quickInput }
            ],
            temperature: 0.7,
          }),
        });
      } else {
        const baseUrl = settings.llamaUrl.endsWith('/') ? settings.llamaUrl.slice(0, -1) : settings.llamaUrl;
        response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: settings.llamaModelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: quickInput }
            ],
            temperature: 0.7,
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      let generatedContent = data.choices[0]?.message?.content;
      
      if (generatedContent) {
        generatedContent = generatedContent
          .replace(/```markdown\s*/g, '')
          .replace(/```\s*$/g, '')
          .replace(/^.*?(?=\{)/s, '')
          .replace(/\}[^{]*$/s, '}')
          .trim();
          
        if (!generatedContent.startsWith('{') || !generatedContent.includes('#')) {
          throw new Error('Invalid presentation format generated');
        }
        
        setInput(generatedContent);
        setQuickInput('');
        hideProcessingOverlay();
      } else {
        throw new Error('No content generated from AI response');
      }
      
    } catch (error) {
      console.error('Error generating presentation:', error);
      let errorMessage = 'Failed to generate presentation. ';
      
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('API Error')) {
        errorMessage += `${errorMsg}. Please check your API key and model settings.`;
      } else if (errorMsg.includes('Failed to fetch')) {
        errorMessage += 'Connection failed. Please check your internet connection or local server.';
      } else {
        errorMessage += 'Please check your settings and try again.';
      }
      
      alert(errorMessage);
      hideProcessingOverlay();
    }
  };
  
  useEffect(() => {
    const parseSlides = () => {
      const linesAll = input.split('\n');
      const blocks: string[] = [];
      let current: string[] = [];
      let inCodeFence = false;

      const flush = () => {
        const text = current.join('\n').trim();
        if (text) blocks.push(text);
        current = [];
      };

      for (let i = 0; i < linesAll.length; i++) {
        const line = linesAll[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('```')) {
          inCodeFence = !inCodeFence;
          current.push(line);
          continue;
        }

        if (!inCodeFence && (trimmed === '{')) {
          if (current.length) flush();
          continue;
        }

        if (!inCodeFence && (trimmed === '}')) {
          flush();
          continue;
        }

        current.push(line);
      }

      if (current.length) flush();

      const newSlides = blocks.map(block => {
        const lines = block.split('\n').filter(line => line.trim() !== '');
        
        const slide = {
          title: '',
          subtitle: '',
          bullets: [] as string[],
          content: [] as any[],
        };

        let inCodeBlock = false;
        let codeBlockContent = '';
        let codeLang = '';

        lines.forEach(line => {
          if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
              if (codeLang === 'mermaid') {
                slide.content.push({ type: 'mermaid', text: codeBlockContent.trim(), lang: codeLang });
              } else {
                slide.content.push({ type: 'code', text: codeBlockContent.trim(), lang: codeLang });
              }
              inCodeBlock = false;
              codeBlockContent = '';
              codeLang = '';
            } else {
              inCodeBlock = true;
              codeLang = line.trim().substring(3);
            }
            return;
          }

          if (inCodeBlock) {
            codeBlockContent += line + '\n';
            return;
          }

          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            slide.title = parseInlineMarkdown(trimmed.substring(2));
          } else if (trimmed.startsWith('## ')) {
            slide.subtitle = parseInlineMarkdown(trimmed.substring(3));
          } else if (trimmed.startsWith('- ')) {
            slide.bullets.push(parseInlineMarkdown(trimmed.substring(2)));
          } else if (trimmed.startsWith('> ')) {
            slide.content.push({ type: 'quote', text: parseInlineMarkdown(trimmed.substring(2)) });
          } else if (trimmed.match(/^\d+\.\s/)) {
            slide.content.push({ type: 'ordered', text: parseInlineMarkdown(trimmed.replace(/^\d+\.\s/, '')) });
          } else if (trimmed) {
            slide.content.push({ type: 'text', text: parseInlineMarkdown(trimmed) });
          }
        });
  return slide;
      });
      setSlides(newSlides);
    };
    
    parseSlides();
  }, [input]);

  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(Math.max(0, slides.length - 1));
    }
  }, [slides.length, currentSlide]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      });

      const mermaidElements = document.querySelectorAll('.mermaid-diagram');
      mermaidElements.forEach((element, index) => {
        const id = `mermaid-${Date.now()}-${index}`;
        element.id = id;
        
        const mermaidCode = element.textContent || '';
        if (mermaidCode.trim()) {
          window.mermaid.render(id + '-svg', mermaidCode)
            .then((result: any) => {
              element.innerHTML = result.svg;
            })
            .catch((error: any) => {
              console.error('Mermaid rendering error:', error);
              element.innerHTML = `<div class="text-red-500 p-4 border border-red-300 rounded">
                <strong>Chart Rendering Error:</strong><br/>
                <code class="text-sm">${error.message || 'Failed to render diagram'}</code>
              </div>`;
            });
        }
      });
    }
  }, [slides, currentSlide]);

  const parseInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
  };

  const renderSlide = (slide: any, index: number) => {
    return (
      <div key={index} className="w-full h-full flex flex-col justify-center items-center p-12 text-center">
        {slide.title && (
          <h1 
            className="text-5xl font-bold mb-6 text-gray-800 leading-tight"
            dangerouslySetInnerHTML={{ __html: slide.title }}
          />
        )}
        
        {slide.subtitle && (
          <h2 
            className="text-3xl font-medium mb-8 text-gray-600"
            dangerouslySetInnerHTML={{ __html: slide.subtitle }}
          />
        )}
        
        {slide.bullets && slide.bullets.length > 0 && (
          <ul className="text-xl space-y-4 text-left max-w-2xl">
            {slide.bullets.map((bullet: string, i: number) => (
                <li 
                  key={i} 
                  className="flex items-start space-x-3"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-3 flex-shrink-0"></span>
                  <span dangerouslySetInnerHTML={{ __html: bullet }} />
                </li>
              ))}
          </ul>
        )}
        
        <div className="max-w-4xl text-left">
          {slide.content && slide.content.map((item: any, i: number) => {
            switch (item.type) {
              case 'quote':
                return (
                  <blockquote key={i} className="border-l-4 border-blue-500 pl-6 my-6 text-xl italic text-gray-700">
                    <span dangerouslySetInnerHTML={{ __html: item.text }} />
                  </blockquote>
                );
              case 'ordered':
                return (
                  <div key={i} className="text-xl my-2 max-w-2xl">
                     <span dangerouslySetInnerHTML={{ __html: item.text }} />
                  </div>
                );
              case 'code':
                return (
                  <div key={i} className="bg-gray-900 rounded-lg p-6 my-6 text-left">
                    <pre className="text-green-400 text-sm overflow-x-auto">
                      <code>{item.text}</code>
                    </pre>
                  </div>
                );
              case 'mermaid':
                return (
                  <div key={i} className="my-6 flex justify-center">
                    <div 
                      className="mermaid-diagram bg-white p-4 rounded-lg shadow-lg max-w-full overflow-x-auto"
                      data-mermaid={item.text}
                      id={`mermaid-${index}-${i}`}
                    >
                      {item.text}
                    </div>
                  </div>
                );
              case 'text':
              default:
                return (
                  <p 
                    key={i} 
                    className="text-xl my-4 text-gray-700 max-w-3xl"
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                );
            }
          })}
        </div>
      </div>
    );
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const convertSvgToDataUrl = async (svgElement: SVGElement, targetWidth?: number, targetHeight?: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const timeout = setTimeout(() => {
          reject(new Error('SVG conversion timed out'));
        }, 10000);

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const svgSVGElement = svgElement as SVGSVGElement;
        const defaultWidth = svgSVGElement.viewBox?.baseVal?.width || svgSVGElement.width?.baseVal?.value || 800;
        const defaultHeight = svgSVGElement.viewBox?.baseVal?.height || svgSVGElement.height?.baseVal?.value || 600;
        
        canvas.width = targetWidth ? Math.round(targetWidth * 96) : Math.min(Math.max(defaultWidth, 800), 1600); // 96 DPI conversion
        canvas.height = targetHeight ? Math.round(targetHeight * 96) : Math.min(Math.max(defaultHeight, 600), 1200);
        
        img.onload = () => {
          try {
            clearTimeout(timeout);
            if (ctx) {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/png');
              URL.revokeObjectURL(img.src);
              resolve(dataUrl);
            } else {
              reject(new Error('Could not get canvas context'));
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load SVG image'));
        };
        
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  };

  const exportToPptx = async () => {
    setIsExporting(true);
    try {
      const pptx = new PptxGenJS();

      for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
        const slideData = slides[slideIndex];
        const slide = pptx.addSlide();

        const cleanTitle = slideData.title.replace(/<[^>]*>?/gm, '');
        const cleanSubtitle = slideData.subtitle.replace(/<[^>]*>?/gm, '');

        let yPosition = 0.5;

        if (cleanTitle) {
          slide.addText(cleanTitle, { 
            x: 0.5, y: yPosition, w: '90%', h: 1, 
            fontSize: 32, bold: true, align: 'center' 
          });
          yPosition += 1.5;
        }

        if (cleanSubtitle) {
          slide.addText(cleanSubtitle, { 
            x: 0.5, y: yPosition, w: '90%', h: 1, 
            fontSize: 24, align: 'center' 
          });
          yPosition += 1.2;
        }

        if (slideData.bullets && slideData.bullets.length > 0) {
          const bulletPoints = slideData.bullets.map((bullet: string) => bullet.replace(/<[^>]*>?/gm, ''));
          slide.addText(bulletPoints.join('\n'), { 
            x: 1, y: yPosition, w: '80%', h: bulletPoints.length * 0.5, 
            fontSize: 18, bullet: true 
          });
          yPosition += bulletPoints.length * 0.5 + 0.5;
        }

        if (slideData.content && slideData.content.length > 0) {
          for (let contentIndex = 0; contentIndex < slideData.content.length; contentIndex++) {
            const item = slideData.content[contentIndex];
            const cleanText = item.text.replace(/<[^>]*>?/gm, '');
            
            switch (item.type) {
              case 'code':
                slide.addText(cleanText, {
                  x: 1, y: yPosition, w: '80%', h: 2,
                  fontSize: 14, fontFace: 'Courier New',
                  color: '00FF00',
                  fill: { color: '1a1a1a' },
                  margin: 0.2
                });
                yPosition += 2.5;
                break;
                
              case 'quote':
                slide.addText(`"${cleanText}"`, {
                  x: 1.5, y: yPosition, w: '70%', h: 1,
                  fontSize: 16, italic: true,
                  color: '666666'
                });
                yPosition += 1.2;
                break;
                
              case 'ordered':
                slide.addText(cleanText, {
                  x: 1, y: yPosition, w: '80%', h: 0.8,
                  fontSize: 16
                });
                yPosition += 1;
                break;
                
              case 'mermaid':
                try {
                  console.log('Processing Mermaid chart for export...');
                  
                  if (!window.mermaid) {
                    throw new Error('Mermaid library not available');
                  }

                  const tempId = `export-mermaid-${slideIndex}-${contentIndex}-${Date.now()}`;
                  
                  const renderPromise = window.mermaid.render(tempId, item.text);
                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Mermaid render timeout')), 5000)
                  );
                  
                  const result = await Promise.race([renderPromise, timeoutPromise]) as any;
                  console.log('Mermaid rendered successfully');
                  
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = result.svg;
                  const svgElement = tempDiv.querySelector('svg') as SVGElement;
                  
                  if (svgElement) {
                    console.log('Converting SVG to image...');
                    
                    const svgSVGElement = svgElement as SVGSVGElement;
                    const svgWidth = svgSVGElement.viewBox?.baseVal?.width || svgSVGElement.width?.baseVal?.value || 800;
                    const svgHeight = svgSVGElement.viewBox?.baseVal?.height || svgSVGElement.height?.baseVal?.value || 600;
                    
                    const maxWidth = 8;
                    const maxHeight = 5;
                    const aspectRatio = svgWidth / svgHeight;
                    
                    let finalWidth = maxWidth;
                    let finalHeight = maxWidth / aspectRatio;
                    
                    if (finalHeight > maxHeight) {
                      finalHeight = maxHeight;
                      finalWidth = maxHeight * aspectRatio;
                    }
                    
                    const xPosition = (10 - finalWidth) / 2;
                    
                    try {
                      const svgString = new XMLSerializer().serializeToString(svgElement);
                      const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
                      
                      slide.addImage({
                        data: svgDataUrl,
                        x: xPosition, 
                        y: yPosition, 
                        w: finalWidth, 
                        h: finalHeight,
                        sizing: { 
                          type: 'contain', 
                          w: finalWidth, 
                          h: finalHeight 
                        }
                      });
                      console.log(`SVG added successfully - Size: ${finalWidth}x${finalHeight}, Position: ${xPosition},${yPosition}`);
                      yPosition += finalHeight + 0.5;
                    } catch (svgError) {
                      console.log('SVG direct embed failed, trying canvas conversion...', svgError);
                      
                      const imageDataUrl = await convertSvgToDataUrl(svgElement, finalWidth, finalHeight);
                      
                      slide.addImage({
                        data: imageDataUrl,
                        x: xPosition, 
                        y: yPosition, 
                        w: finalWidth, 
                        h: finalHeight,
                        sizing: { 
                          type: 'contain', 
                          w: finalWidth, 
                          h: finalHeight 
                        }
                      });
                      console.log(`Canvas conversion successful - Size: ${finalWidth}x${finalHeight}, Position: ${xPosition},${yPosition}`);
                      yPosition += finalHeight + 0.5;
                    }
                  } else {
                    throw new Error('Failed to extract SVG element');
                  }
                } catch (error) {
                  console.error('Error processing Mermaid chart:', error);
                  slide.addText(`[Chart/Diagram - Processing Error]`, {
                    x: 1, y: yPosition, w: '80%', h: 1,
                    fontSize: 16, italic: true,
                    color: 'CC0000',
                    fill: { color: 'FFE6E6' },
                    margin: 0.2
                  });
                  slide.addText(`Diagram Definition:\n${cleanText}`, {
                    x: 1, y: yPosition + 1.2, w: '80%', h: 2,
                    fontSize: 12, fontFace: 'Courier New',
                    color: '666666'
                  });
                  yPosition += 3.5;
                }
                break;
                
              case 'text':
              default:
                slide.addText(cleanText, {
                  x: 1, y: yPosition, w: '80%', h: 0.8,
                  fontSize: 16
                });
                yPosition += 1;
                break;
            }
          }
        }
      }

      await pptx.writeFile({ fileName: 'presentation.pptx' });
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting presentation. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (showSettings) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/10">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full h-full animate-slideup">
            <SettingsScreen onBack={() => setShowSettings(false)} />
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'present') {
    return (
      <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'} bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col`}>
        <div className="flex-1 relative overflow-hidden">
          {slides.length > 0 ? (
            <div className="w-full h-full bg-white shadow-2xl">
              {renderSlide(slides[currentSlide], currentSlide)}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-base sm:text-xl lg:text-2xl px-4 text-center">
              No slides to display. Add content in curly braces {}
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 text-white p-2 sm:p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} className="sm:hidden" />
              <ChevronLeft size={20} className="hidden sm:block" />
            </button>
            
            <span className="text-xs sm:text-sm font-medium">
              {currentSlide + 1} / {slides.length}
            </span>
            
            <button 
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} className="sm:hidden" />
              <ChevronRight size={20} className="hidden sm:block" />
            </button>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Maximize2 size={16} className="sm:hidden" />
              <Maximize2 size={20} className="hidden sm:block" />
            </button>
            <button
              onClick={() => setMode('edit')}
              className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-1 sm:space-x-2"
            >
              <Edit3 size={14} className="sm:hidden" />
              <Edit3 size={16} className="hidden sm:block" />
              <span className="text-sm sm:text-base">Edit</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <img src="/banner.png" alt="SlideScript" className="h-8 sm:h-12 w-auto md:h-14" />
            <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              {slides.length} slides
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-3">
            <button
              onClick={() => exportToPptx().catch(console.error)}
              disabled={isExporting}
              className="hidden sm:flex px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-3xl transition-colors items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              <span>{isExporting ? 'Exporting...' : 'Export PPTX'}</span>
            </button>
            
            <button
              onClick={() => exportToPptx().catch(console.error)}
              disabled={isExporting}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
            </button>

            <button
              onClick={() => setMode('present')}
              className="px-3 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl transition-colors flex items-center space-x-1 sm:space-x-2"
            >
              <Play size={14} className="sm:hidden" />
              <Play size={16} className="hidden sm:block" />
              <span className="text-sm sm:text-base">Present</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2 lg:border-r border-gray-200 order-2 lg:order-1 relative">
          <div className="h-12 sm:h-16 px-3 sm:px-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center space-x-1 sm:space-x-2 text-base sm:text-lg md:text-xl">
              <Edit3 size={16} className="sm:hidden" />
              <Edit3 size={18} className="hidden sm:block" />
              <span>Editor</span>
            </h2>
          </div>
          <div className="px-3 sm:px-4 pb-1 sm:pb-2 bg-gray-50">
            <p className="text-xs sm:text-sm text-gray-600">
              Use {'{}'} on their own lines to separate slides. Braces inside text or code are allowed. Support for # headings, - bullets, **bold**, *italic*, and ```code blocks```
            </p>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-full font-mono text-xs sm:text-sm resize-none border-0 focus:outline-none pt-3 sm:pt-6 px-3 sm:px-6 pb-20 sm:pb-24"
            placeholder={`Type your presentation content here...\n\n{\n# My First Slide\n## This is a subtitle\n\n- First bullet point\n- Second bullet point\n}\n\n{\n# Second Slide\nContent goes here...\n}`}
            style={{ minHeight: 'calc(50vh - 120px)', maxHeight: 'calc(100vh - 180px)' }}
          />

          <div className="pointer-events-none fixed bottom-6 sm:bottom-8 left-0 lg:left-0 right-0 lg:right-1/2 z-30 px-3 sm:px-4">
            <div className="relative pointer-events-auto mx-auto max-w-[500px] sm:max-w-[620px]">
              <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 z-10">
                <img 
                  src="/stars-icon.png" 
                  alt="AI" 
                  className="w-4 h-4 sm:w-5 sm:h-5 opacity-60"
                />
              </div>
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Say anything you want..."
                aria-label="Quick note"
                className="w-full rounded-3xl border border-gray-300 bg-white/95 backdrop-blur-sm shadow-lg pl-10 sm:pl-12 pr-20 sm:pr-24 py-3 sm:py-4 text-sm sm:text-base text-gray-800 placeholder:text-gray-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isGenerating && quickInput.trim()) {
                    handleSendScenario();
                  }
                }}
                disabled={isGenerating}
              />
              <div className="absolute inset-y-0 right-1.5 sm:right-2 flex items-center space-x-1.5 sm:space-x-2">
                <button
                  type="button"
                  aria-label="Settings"
                  className="p-1.5 sm:p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings size={16} className="sm:hidden" />
                  <Settings size={18} className="hidden sm:block" />
                </button>
                <button
                  type="button"
                  aria-label="Send"
                  className="p-1.5 sm:p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50"
                  onClick={handleSendScenario}
                  disabled={isGenerating || !quickInput.trim()}
                >
                  {isGenerating ? (
                    <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Send size={16} className="sm:hidden" />
                      <Send size={18} className="hidden sm:block" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 bg-white flex flex-col order-1 lg:order-2 border-b lg:border-b-0 border-gray-200">
          <div className="h-12 sm:h-16 px-3 sm:px-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center space-x-1 sm:space-x-2 text-base sm:text-lg md:text-xl">
              <Eye size={16} className="sm:hidden" />
              <Eye size={18} className="hidden sm:block" />
              <span>Preview</span>
            </h2>

            {slides.length > 0 && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button 
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} className="sm:hidden" />
                  <ChevronLeft size={16} className="hidden sm:block" />
                </button>
                
                <span className="text-xs sm:text-sm text-gray-600 px-1 sm:px-2">
                  {currentSlide + 1} / {slides.length}
                </span>
                
                <button 
                  onClick={nextSlide}
                  disabled={currentSlide === slides.length - 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} className="sm:hidden" />
                  <ChevronRight size={16} className="hidden sm:block" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            {slides.length > 0 ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
                <div className="bg-white rounded-lg shadow-lg transform origin-top-left w-full h-full lg:w-[133.33%] lg:h-[133.33%] scale-100 sm:scale-95 lg:scale-75">
                  {renderSlide(slides[currentSlide], currentSlide)}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-3xl sm:text-6xl mb-2 sm:mb-4">📝</div>
                  <p className="text-base sm:text-lg">Start typing to see your slides</p>
                  <p className="text-xs sm:text-sm mt-1 sm:mt-2">Use curly braces {} to separate slides</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProcessingOverlay && (
        <div className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center ${
          isAnimatingOut ? 'animate-processingFadeOut' : 'animate-processingFadeIn'
        }`}>
          <div className={`flex flex-col items-center ${
            isAnimatingOut ? 'animate-gifFadeOut' : 'animate-gifFadeIn'
          }`}>
            <img 
              src="/slide-script-processing.gif" 
              alt="Processing..." 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain animate-slowBlink"
            />
            <p className="text-white text-sm sm:text-base mt-4 text-center animate-shinyText">
              Ready in a movement...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationMaker;
