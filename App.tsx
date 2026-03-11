import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Shield } from 'lucide-react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ControlPanel } from './components/ControlPanel';
import { CanvasPreview, CanvasPreviewHandle } from './components/CanvasPreview';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { generatePinVariations, generatePinImage } from './services/geminiService';
import { PinVariation, PinConfig, FONTS } from './types';

export default function App() {
  const canvasPreviewRef = useRef<CanvasPreviewHandle>(null);
  const navigate = useNavigate();

  // Data State
  const [keyword, setKeyword] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [variations, setVariations] = useState<PinVariation[]>([]);
  const [currentVarIndex, setCurrentVarIndex] = useState(0);
  
  // UI State
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const [errorMsg, setErrorMsg] = useState('');

  // Configuration State
  const [config, setConfig] = useState<PinConfig>({
    headline: 'Your Catchy Headline Here',
    ctaText: 'Check it out',
    showCta: true,
    brandText: '',
    fontFamily: FONTS[0].value,
    textColor: '#000000',
    outlineColor: '#ffffff',
    brandColor: '#ffffff',
    ctaBgColor: '#e60023',
    ctaTextColor: '#ffffff',
    textYPos: 45,
    colorScheme: 'standard'
  });

  const handleGenerate = async () => {
    if (!keyword.trim()) return;
    setIsGeneratingText(true);
    setErrorMsg('');
    setVariations([]);
    setLoadingImages({});

    try {
      const data = await generatePinVariations(keyword);
      if (data.variations && data.variations.length > 0) {
        const newVariations: PinVariation[] = data.variations.map(v => ({
          ...v,
          imageUrl: null,
          fallbackMode: false
        }));
        setVariations(newVariations);
        setCurrentVarIndex(0);
        const firstVar = newVariations[0];
        setConfig(prev => ({
          ...prev,
          headline: firstVar.headline,
          ctaText: firstVar.ctaText,
          showCta: true
        }));
      } else {
        throw new Error("No variations generated.");
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to generate content.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleUpdateSEO = (newSeo: { title: string, description: string, hashtags: string }) => {
    setVariations(prev => {
      const updated = [...prev];
      if (updated[currentVarIndex]) {
        updated[currentVarIndex] = {
          ...updated[currentVarIndex],
          seoTitle: newSeo.title,
          seoDescription: newSeo.description,
          hashtags: newSeo.hashtags
        };
      }
      return updated;
    });
  };

  const handleSelectVariation = (index: number) => {
    setCurrentVarIndex(index);
    const selectedVar = variations[index];
    if (selectedVar) {
      setConfig(prev => ({
        ...prev,
        headline: selectedVar.headline,
        ctaText: selectedVar.ctaText
      }));
    }
  };

  useEffect(() => {
    const generateImageIfNeeded = async () => {
      const currentVar = variations[currentVarIndex];
      if (currentVar && !currentVar.imageUrl && !currentVar.fallbackMode && !loadingImages[currentVarIndex] && !isGeneratingText) {
        setLoadingImages(prev => ({ ...prev, [currentVarIndex]: true }));
        try {
          const base64Image = await generatePinImage(currentVar.imagePrompt);
          setVariations(prev => {
            const newVars = [...prev];
            newVars[currentVarIndex] = { ...newVars[currentVarIndex], imageUrl: base64Image };
            return newVars;
          });
        } catch (e) {
          setVariations(prev => {
            const newVars = [...prev];
            newVars[currentVarIndex] = { ...newVars[currentVarIndex], fallbackMode: true };
            return newVars;
          });
        } finally {
          setLoadingImages(prev => ({ ...prev, [currentVarIndex]: false }));
        }
      }
    };
    generateImageIfNeeded();
  }, [currentVarIndex, variations, loadingImages, isGeneratingText]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-red-100 selection:text-red-600 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-red-600 p-2 rounded-full shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">PinGenius AI</h1>
          </Link>
          <div className="hidden md:flex items-center gap-4">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">PRO</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/privacypolicy" element={<PrivacyPolicy />} />
          <Route path="/" element={
            <main className="flex-1 max-w-7xl mx-auto p-4 lg:p-8 w-full flex flex-col lg:flex-row gap-8 overflow-hidden">
              <div className="w-full lg:w-1/3 lg:h-[calc(100vh-12rem)] lg:overflow-hidden flex flex-col order-2 lg:order-1">
                <ControlPanel 
                  keyword={keyword}
                  setKeyword={setKeyword}
                  baseUrl={baseUrl}
                  setBaseUrl={setBaseUrl}
                  onGenerate={handleGenerate}
                  onUpdateSEO={handleUpdateSEO}
                  isGenerating={isGeneratingText}
                  variations={variations}
                  currentVarIndex={currentVarIndex}
                  onSelectVariation={handleSelectVariation}
                  config={config}
                  setConfig={setConfig}
                  loadingImages={loadingImages}
                  errorMsg={errorMsg}
                />
              </div>
              <div className="w-full lg:w-2/3 order-1 lg:order-2 flex flex-col items-center justify-start lg:pt-4">
                <CanvasPreview 
                  ref={canvasPreviewRef}
                  variation={variations[currentVarIndex] || null}
                  config={config}
                  imageUrl={variations[currentVarIndex]?.imageUrl}
                  isLoadingImage={loadingImages[currentVarIndex]}
                  isGeneratingText={isGeneratingText}
                />
              </div>
            </main>
          } />
        </Routes>
      </div>

      <footer className="bg-white border-t border-slate-200 py-10 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>PinGenius AI</span>
            </div>
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} AI-powered design for Pinterest creators.</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            <Link to="/privacypolicy" className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Privacy Policy
            </Link>
            <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">Google Gemini</a>
            <span className="hidden md:inline text-slate-200">|</span>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Pinterest Authorized</p>
          </div>
        </div>
      </footer>
    </div>
  );
}