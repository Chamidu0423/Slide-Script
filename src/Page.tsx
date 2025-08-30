import React, { useState, useEffect, useMemo } from 'react';
import PptxGenJS from 'pptxgenjs';
import { ChevronLeft, ChevronRight, Play, Edit3, Eye, Maximize2, Download } from 'lucide-react';

const PresentationMaker = () => {
  const [input, setInput] = useState(`{
# Welcome to SlideScript
## The fastest way to create presentations

Write your slides using simple syntax:
- Use {} to separate slides
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
  const [mode, setMode] = useState('edit'); // 'edit' or 'present'
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [slides, setSlides] = useState<any[]>([]);
  
  useEffect(() => {
    const parseSlides = () => {
      const slideRegex = /\{([^}]*)\}/gs;
      const matches = [...input.matchAll(slideRegex)];
      const newSlides = matches.map(match => {
        const content = match[1].trim();
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
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
              slide.content.push({ type: 'code', text: codeBlockContent.trim(), lang: codeLang });
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

  const exportToPptx = () => {
    const pptx = new PptxGenJS();

    slides.forEach(slideData => {
      const slide = pptx.addSlide();

      const cleanTitle = slideData.title.replace(/<[^>]*>?/gm, '');
      const cleanSubtitle = slideData.subtitle.replace(/<[^>]*>?/gm, '');

      if (cleanTitle) {
        slide.addText(cleanTitle, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, align: 'center' });
      }
      if (cleanSubtitle) {
        slide.addText(cleanSubtitle, { x: 0.5, y: 1.5, w: '90%', h: 1, fontSize: 24, align: 'center' });
      }

      const bulletPoints = slideData.bullets.map((bullet: string) => bullet.replace(/<[^>]*>?/gm, ''));
      if (bulletPoints.length > 0) {
        slide.addText(bulletPoints.join('\n'), { x: 1, y: 2.5, w: '80%', h: 3, fontSize: 18, bullet: true });
      }
    });

    pptx.writeFile({ fileName: 'presentation.pptx' });
  };

  if (mode === 'present') {
    return (
      <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'} bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col`}>
        <div className="flex-1 relative overflow-hidden">
          {slides.length > 0 ? (
            <div className="w-full h-full bg-white shadow-2xl">
              {renderSlide(slides[currentSlide], currentSlide)}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl">
              No slides to display. Add content in curly braces {}
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <span className="text-sm font-medium">
              {currentSlide + 1} / {slides.length}
            </span>
            
            <button 
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Maximize2 size={20} />
            </button>
            <button
              onClick={() => setMode('edit')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Edit3 size={16} />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/logo.png" alt="SlideScript" className="h-20 w-auto md:h-24" />
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {slides.length} slides
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToPptx}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Export PPTX</span>
            </button>
            
            <button
              onClick={() => setMode('present')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Play size={16} />
              <span>Present</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="w-1/2 border-r border-gray-200">
          <div className="h-16 px-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center space-x-2 text-lg md:text-xl">
              <Edit3 size={18} />
              <span>Editor</span>
            </h2>
          </div>
          <div className="px-4 pb-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              Use {'{}'} to separate slides. Support for # headings, - bullets, **bold**, *italic*, and ```code blocks```
            </p>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-full p-6 font-mono text-sm resize-none border-0 focus:outline-none"
            placeholder={`Type your presentation content here...\n\n{\n# My First Slide\n## This is a subtitle\n\n- First bullet point\n- Second bullet point\n}\n\n{\n# Second Slide\nContent goes here...\n}`}
            style={{ minHeight: 'calc(100vh - 140px)' }}
          />
        </div>

        <div className="w-1/2 bg-white">
          <div className="h-16 px-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center space-x-2 text-lg md:text-xl">
              <Eye size={18} />
              <span>Preview</span>
            </h2>

            {slides.length > 0 && (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="text-sm text-gray-600 px-2">
                  {currentSlide + 1} / {slides.length}
                </span>
                
                <button 
                  onClick={nextSlide}
                  disabled={currentSlide === slides.length - 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
          
          <div className="relative" style={{ height: 'calc(100vh - 140px)' }}>
            {slides.length > 0 ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="w-full h-full bg-white rounded-lg shadow-lg transform scale-75 origin-top-left" 
                     style={{ width: '133.33%', height: '133.33%' }}>
                  {renderSlide(slides[currentSlide], currentSlide)}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-lg">Start typing to see your slides</p>
                  <p className="text-sm mt-2">Use curly braces {} to separate slides</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationMaker;
