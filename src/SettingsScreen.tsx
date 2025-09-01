import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const SettingsScreen = ({ onBack }: { onBack: () => void }) => {
  const [selected, setSelected] = useState<'openrouter' | 'llama' | null>(null);
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [openRouterModelName, setOpenRouterModelName] = useState('');
  const [llamaModelName, setLlamaModelName] = useState('');
  const [llamaUrl, setLlamaUrl] = useState('http://localhost:11434');

  useEffect(() => {
    const saved = localStorage.getItem('slideScriptSettings');
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        setSelected(obj.selected || null);
        setOpenRouterApiKey(obj.openRouterApiKey || '');
        setOpenRouterModelName(obj.openRouterModelName || '');
        setLlamaModelName(obj.llamaModelName || '');
        setLlamaUrl(obj.llamaUrl || 'http://localhost:11434');
      } catch {}
    }
  }, []);

  const [justSaved, setJustSaved] = useState(false);
  const [showingIcon, setShowingIcon] = useState<string | null>(null);

  const handleCardSelection = (cardType: 'openrouter' | 'llama') => {
    setSelected(cardType);
    const iconPath = cardType === 'openrouter' ? '/open-router.png' : '/ollama-gray.png';
    setShowingIcon(iconPath);
    setTimeout(() => setShowingIcon(null), 2000);
  };

  const handleSave = () => {
    const obj = {
      selected,
      openRouterApiKey,
      openRouterModelName,
      llamaModelName,
      llamaUrl,
    };
    localStorage.setItem('slideScriptSettings', JSON.stringify(obj));
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      <header className="w-full py-6 px-4 sm:px-8 bg-white border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-3xl font-semibold text-base hover:bg-blue-700 transition-colors shadow"
            style={{ minWidth: 80 }}
            onClick={handleSave}
          >
            {justSaved ? 'Saved!' : 'Save'}
          </button>
          <button
            className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            aria-label="Close settings"
            onClick={onBack}
          >
            <X size={24} />
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <form className="w-full max-w-2xl flex flex-col gap-8 items-stretch justify-center" onSubmit={e => e.preventDefault()}>
          <div className={`bg-white border rounded-2xl p-6 flex-1 flex flex-col shadow-sm ${selected === 'openrouter' ? 'border-green-500' : 'border-gray-200'}`}> 
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <img src="/open-router.png" alt="OpenRouter" className="w-7 h-7 object-contain" />
                OpenRouter Model
              </span>
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full border-2 cursor-pointer ${selected === 'openrouter' ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'} transition-colors duration-150`}
                onClick={() => handleCardSelection('openrouter')}
                tabIndex={0}
                role="radio"
                aria-checked={selected === 'openrouter'}
              >
                {selected === 'openrouter' && <Check size={18} className="text-white" />}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="text"
                  placeholder="Enter your OpenRouter API key"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={openRouterApiKey}
                  onChange={e => setOpenRouterApiKey(e.target.value)}
                  disabled={selected !== 'openrouter'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. openrouter/mistral-7b"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={openRouterModelName}
                  onChange={e => setOpenRouterModelName(e.target.value)}
                  disabled={selected !== 'openrouter'}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">Base URL: <span className="font-mono">https://openrouter.ai/api/v1</span></div>
            </div>
          </div>
          <div className={`bg-white border rounded-2xl p-6 flex-1 flex flex-col shadow-sm ${selected === 'llama' ? 'border-green-500' : 'border-gray-200'}`}> 
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <img src="/ollama.png" alt="Ollama" className="w-7 h-7 object-contain" />
                Local Llama Model
              </span>
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full border-2 cursor-pointer ${selected === 'llama' ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'} transition-colors duration-150`}
                onClick={() => handleCardSelection('llama')}
                tabIndex={0}
                role="radio"
                aria-checked={selected === 'llama'}
              >
                {selected === 'llama' && <Check size={18} className="text-white" />}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                <input
                  type="text"
                  placeholder="http://localhost:11434"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={llamaUrl}
                  onChange={e => setLlamaUrl(e.target.value)}
                  disabled={selected !== 'llama'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. llama3.2, codellama"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={llamaModelName}
                  onChange={e => setLlamaModelName(e.target.value)}
                  disabled={selected !== 'llama'}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Make sure Ollama is running locally. Default port is 11434.
              </div>
            </div>
          </div>
        </form>
      </main>
      {showingIcon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-iconFade">
            <img 
              src={showingIcon} 
              alt="Selected model" 
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsScreen;
