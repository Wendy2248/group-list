import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Sparkles,
  Settings2, 
  Shuffle, 
  Copy, 
  Trash2, 
  Check, 
  Info,
  ChevronRight,
  UserPlus,
  FileUp,
  UploadCloud,
  Download,
  FileJson,
  FileText,
  FileSpreadsheet,
  Printer,
  History,
  Clock,
  X
} from 'lucide-react';

interface GroupingHistory {
  id: string;
  title: string;
  timestamp: number;
  groups: string[][];
  namesCount: number;
  operatorId: string;
}

type GroupMode = 'count' | 'size';

export default function App() {
  const [userId, setUserId] = useState<string>(() => localStorage.getItem('grouping_user_id') || '');
  const [loginInput, setLoginInput] = useState('');
  const [namesInput, setNamesInput] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [mode, setMode] = useState<GroupMode>('count');
  const [targetValue, setTargetValue] = useState<number>(2);
  const [groups, setGroups] = useState<string[][]>([]);
  const [history, setHistory] = useState<GroupingHistory[]>(() => {
    const saved = localStorage.getItem('grouping_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExported, setIsExported] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleNames = [
    '陳大文', '林小明', '張美玲', '王大明', '李小華', 
    '趙志強', '許智超', '周杰倫', '蔡依林', '林俊傑',
    '蕭敬騰', '鄧紫棋', '李榮浩', '薛之謙', '陳奕迅'
  ];

  const generateSampleList = () => {
    setNamesInput(sampleNames.join('\n'));
    setGroups([]);
  };

  const parsedNames = useMemo(() => {
    return namesInput
      .split('\n')
      .map(name => name.trim())
      .filter(name => name !== '');
  }, [namesInput]);

  const handleManualAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget;
      const value = input.value.trim();
      if (value) {
        setNamesInput(prev => prev ? `${prev}\n${value}` : value);
        input.value = '';
      }
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      let newNames: string[] = [];

      if (extension === 'csv') {
        // Simple CSV parsing (first column)
        newNames = content
          .split('\n')
          .map(line => line.split(',')[0].trim())
          .filter(name => name !== '');
      } else {
        // Default to TXT style (line by line)
        newNames = content
          .split('\n')
          .map(line => line.trim())
          .filter(name => name !== '');
      }

      if (newNames.length > 0) {
        setNamesInput(prev => {
          const existing = prev.trim();
          return existing ? `${existing}\n${newNames.join('\n')}` : newNames.join('\n');
        });
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const shuffle = () => {
    if (parsedNames.length === 0) return;

    const shuffled = [...parsedNames].sort(() => Math.random() - 0.5);
    let result: string[][] = [];

    if (mode === 'count') {
      // Fixed number of groups
      const groupCount = Math.max(1, Math.min(targetValue, parsedNames.length));
      result = Array.from({ length: groupCount }, () => []);
      shuffled.forEach((name, i) => {
        result[i % groupCount].push(name);
      });
    } else {
      // Fixed people per group
      const groupSize = Math.max(1, targetValue);
      for (let i = 0; i < shuffled.length; i += groupSize) {
        result.push(shuffled.slice(i, i + groupSize));
      }
    }

    setGroups(result);

    // Save to history
    const finalTitle = sessionTitle.trim() || `分組紀錄 ${new Date().toLocaleString('zh-TW', { hour12: false })}`;
    const newHistoryItem: GroupingHistory = {
      id: Math.random().toString(36).substr(2, 9),
      title: finalTitle,
      timestamp: Date.now(),
      groups: result,
      namesCount: parsedNames.length,
      operatorId: userId
    };
    
    const updatedHistory = [newHistoryItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updatedHistory);
    localStorage.setItem('grouping_history', JSON.stringify(updatedHistory));
    
    // Auto clear title or keep it? Let's keep it for visual confirmation but scroll to result
  };

  const copyToClipboard = () => {
    const text = groups
      .map((group, i) => `【第 ${i + 1} 組】\n${group.join(', ')}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
    setShowExportMenu(false);
    
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2000);
  };

  const handlePrint = () => {
    window.print();
    setShowExportMenu(false);
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2000);
  };

  const exportAsTxt = () => {
    const finalTitle = sessionTitle.trim() || "未命名分組";
    const text = `活動名稱：${finalTitle}\n產出時間：${new Date().toLocaleString()}\n\n` + 
      groups.map((group, i) => `【第 ${i + 1} 組】\n${group.join('\n')}`)
      .join('\n\n');
    downloadFile(text, `${finalTitle}_${new Date().getTime()}.txt`, 'text/plain');
  };

  const exportAsCsv = () => {
    const finalTitle = sessionTitle.trim() || "未命名分組";
    // Standard CSV format for spreadsheets
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel compatibility
    csvContent += `活動名稱,${finalTitle}\n`;
    csvContent += `產出時間,${new Date().toLocaleString()}\n\n`;
    csvContent += "組別,成員名單\n";
    groups.forEach((group, i) => {
      csvContent += `第 ${i + 1} 組,"${group.join(', ')}"\n`;
    });
    downloadFile(csvContent, `${finalTitle}_${new Date().getTime()}.csv`, 'text/csv;charset=utf-8');
  };

  const exportAsJson = () => {
    const finalTitle = sessionTitle.trim() || "未命名分組";
    const data = {
      activityTitle: finalTitle,
      exportTime: new Date().toISOString(),
      groups: groups.map((group, i) => ({
        groupIndex: i + 1,
        members: group,
        count: group.length
      }))
    };
    downloadFile(JSON.stringify(data, null, 2), `${finalTitle}_${new Date().getTime()}.json`, 'application/json');
  };

  const clearAll = () => {
    setNamesInput('');
    setGroups([]);
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('grouping_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (window.confirm('確定要清空所有歷史紀錄嗎？')) {
      setHistory([]);
      localStorage.removeItem('grouping_history');
    }
  };

  const loadFromHistory = (item: GroupingHistory) => {
    setGroups(item.groups);
    setSessionTitle(item.title);
    setShowHistory(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.trim()) {
      setUserId(loginInput.trim());
      localStorage.setItem('grouping_user_id', loginInput.trim());
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-brand-secondary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl glass-shadow ring-1 ring-white/50 neo-blur text-center"
        >
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-primary blur-xl opacity-30 animate-pulse" />
              <div className="relative rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary p-5 text-white shadow-2xl">
                <Sparkles size={40} className="animate-pulse" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">員工身分驗證</h1>
          <p className="mt-3 text-sm font-bold text-gray-400">請輸入您的員工編號以開始作業</p>
          
          <form onSubmit={handleLogin} className="mt-10 space-y-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl blur opacity-20 group-focus-within:opacity-50 transition-opacity" />
              <input 
                type="text" 
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="員工編號 (例如: EMP001)"
                className="relative w-full rounded-2xl border border-slate-200 bg-white p-5 text-center text-xl font-black text-slate-800 placeholder-slate-300 focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-xl"
              />
            </div>
            <button
              type="submit"
              className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 py-5 font-black text-white shadow-2xl transition-all hover:bg-slate-800 hover:-translate-y-1 active:translate-y-0 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">驗證身分並開始</span>
              <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <p className="mt-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
            Internal Security Access Control
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden p-4 md:p-8">
      {/* Decorative background elements */}
      <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-brand-secondary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center space-x-3 md:justify-start"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-brand-primary blur-xl opacity-40 group-hover:opacity-60 animate-pulse transition-opacity" />
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                  className="relative rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-3 text-white shadow-xl shadow-brand-primary/20"
                >
                  <Sparkles size={28} className="animate-pulse" />
                </motion.div>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                  分組再出發
              
                </h1>
                <div className="h-1.5 w-12 bg-brand-primary rounded-full mt-1" />
              </div>
            </motion.div>
            <p className="mt-3 text-gray-500 font-medium">快速、公正、具備設計感的人員分配工具</p>
          </div>

          <div className="flex flex-col items-center md:items-end space-y-3">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-black text-gray-600">員工：{userId}</span>
              </div>
              <button 
                onClick={() => {
                  setUserId('');
                  localStorage.removeItem('grouping_user_id');
                }}
                className="text-[10px] font-black text-gray-400 hover:text-brand-accent uppercase tracking-widest transition-colors"
                title="登出並更換編號"
              >
                登出
              </button>
            </div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={generateSampleList}
              className="group flex flex-col items-center md:items-end"
            >
              <div className="flex items-center space-x-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-brand-primary shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-xl hover:-translate-y-1 active:translate-y-0 text-center">
                <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">快速產出範例清單</span>
                <div className="rounded-lg bg-brand-bg p-1 group-hover:rotate-12 transition-transform">
                  <UserPlus size={16} />
                </div>
              </div>
              <span className="mt-2 text-[10px] font-black text-gray-300 uppercase tracking-widest hidden md:block">
                INSTANT DEMO DATA
              </span>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setShowHistory(true)}
              className="group flex items-center space-x-2 rounded-xl bg-white/50 px-4 py-2 text-xs font-bold text-gray-500 hover:text-brand-primary hover:bg-white transition-all shadow-sm ring-1 ring-gray-100"
            >
              <History size={14} />
              <span>查詢歷史分組紀錄 ({history.length})</span>
            </motion.button>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Settings Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5"
          >
            <section className="space-y-6 rounded-[2.5rem] bg-white p-8 shadow-2xl glass-shadow ring-1 ring-white/50 neo-blur">
              {/* Session Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  活動名稱 / 分組主題
                </label>
                <input 
                  type="text" 
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="例如：週五桌遊、專案分組..."
                  className="w-full tech-input rounded-[1.25rem] bg-slate-50 p-4 text-sm font-bold text-slate-700 placeholder-slate-300"
                />
              </div>

              {/* Input Area */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    參與名單 
                    <span className="ml-2 text-brand-primary">({parsedNames.length})</span>
                  </label>
                  <button 
                    onClick={clearAll}
                    className="flex items-center text-[10px] font-black text-slate-400 hover:text-brand-accent transition-colors py-1 px-2 rounded-lg hover:bg-brand-accent/5"
                  >
                    <Trash2 size={12} className="mr-1" /> 清空
                  </button>
                </div>
                
                <div className="relative group">
                  <textarea
                    value={namesInput}
                    onChange={(e) => setNamesInput(e.target.value)}
                    placeholder="請輸入姓名（一行一人）..."
                    className="h-72 w-full tech-input rounded-[1.5rem] bg-slate-50 p-5 text-slate-700 placeholder-slate-400 resize-none font-semibold leading-relaxed shadow-xs"
                  />
                  
                  {/* Drag and Drop Zone Overlay */}
                  <AnimatePresence>
                    {isDragging && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[1.5rem] bg-slate-900/90 text-white backdrop-blur-md border-2 border-dashed border-brand-primary"
                      >
                        <UploadCloud size={48} className="mb-4 animate-bounce text-brand-primary" />
                        <p className="text-xl font-black">放開以匯入文件</p>
                        <p className="mt-2 text-xs font-bold opacity-70">支援 .txt 與 .csv 格式</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {/* Manual Quick Add */}
                    <div className="col-span-2 flex items-center space-x-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100 focus-within:ring-brand-primary/30 transition-all">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-brand-primary">
                        <UserPlus size={18} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="快速新增姓名（按 Enter 鍵）"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-slate-300"
                        onKeyDown={handleManualAdd}
                      />
                    </div>
                    
                    {/* File Upload Button */}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      className="col-span-2 flex items-center justify-center space-x-2 rounded-2xl bg-slate-900 py-3.5 px-4 text-xs font-black text-white hover:bg-slate-800 transition-all group"
                    >
                      <FileUp size={16} className="text-brand-primary group-hover:-translate-y-0.5 transition-transform" />
                      <span>匯入 TXT / CSV 文件</span>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept=".txt,.csv"
                        onChange={handleFileChange}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-gray-50" />

              {/* Configuration */}
              <div className="space-y-5">
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-900">
                  <div className="h-2 w-2 rounded-full bg-brand-primary mr-1" />
                  <span>分組參數設定</span>
                </div>

                <div className="flex rounded-[1rem] bg-brand-bg p-1.5 ring-1 ring-gray-100">
                  <button
                    onClick={() => setMode('count')}
                    className={`flex-1 rounded-[0.75rem] py-2.5 text-sm font-bold transition-all ${
                      mode === 'count' 
                        ? 'bg-white text-brand-primary shadow-md' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    固定組數
                  </button>
                  <button
                    onClick={() => setMode('size')}
                    className={`flex-1 rounded-[0.75rem] py-2.5 text-sm font-bold transition-all ${
                      mode === 'size' 
                        ? 'bg-white text-brand-primary shadow-md' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    每組人數
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {mode === 'count' ? '組數設定' : '每組人數'}
                    </p>
                    <div className="relative group">
                      <input
                        type="number"
                        min="1"
                        max={parsedNames.length || 100}
                        value={targetValue}
                        onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                        className="w-full tech-input rounded-2xl bg-slate-50 p-4 text-2xl font-black text-slate-900 focus:bg-white text-center"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col pointer-events-none text-slate-300 group-focus-within:text-brand-primary transition-colors">
                         <ChevronRight className="-rotate-90" size={16} />
                         <ChevronRight className="rotate-90" size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={shuffle}
                disabled={parsedNames.length < 2}
                className="group relative flex w-full items-center justify-center space-x-3 overflow-hidden rounded-[1.25rem] bg-slate-900 py-5 font-black text-white shadow-2xl transition-all hover:bg-black hover:-translate-y-1 active:translate-y-0 disabled:bg-slate-100 disabled:shadow-none disabled:text-slate-300 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                <Shuffle size={20} className="group-hover:rotate-180 transition-transform duration-700 text-brand-primary" />
                <span className="text-base uppercase tracking-[0.2em]">Execute Partition</span>
              </button>

              {parsedNames.length < 2 && (
                <div className="flex items-center space-x-2 rounded-2xl bg-brand-primary/5 p-4 text-xs font-bold text-brand-primary/70">
                  <div className="shrink-0">
                    <Info size={16} />
                  </div>
                  <p>請輸入至少 2 位成員或匯入文件以開始分組 ✨</p>
                </div>
              )}
            </section>
          </motion.div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {groups.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 flex items-center max-w-md truncate">
                        {sessionTitle.trim() || '分組結果'}
                        <span className="ml-3 rounded-2xl bg-brand-secondary/10 px-4 py-1.5 text-sm font-black text-brand-secondary flex-shrink-0">
                          {groups.length} GROUPS
                        </span>
                      </h2>
                      <div className="h-1.5 w-12 bg-brand-secondary rounded-full mt-2" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          className={`group flex items-center space-x-2 rounded-2xl px-5 py-3 text-sm font-black shadow-sm ring-1 transition-all ${
                            isExported 
                              ? 'bg-green-500 text-white ring-green-500' 
                              : 'bg-white text-gray-700 ring-gray-100 hover:bg-brand-secondary hover:text-white hover:ring-brand-secondary hover:shadow-lg hover:shadow-brand-secondary/20'
                          }`}
                        >
                          {isExported ? <Check size={18} /> : <Download size={18} className={showExportMenu ? 'scale-110' : ''} />}
                          <span>{isExported ? 'EXPORTED' : 'EXPORT'}</span>
                        </button>

                        <AnimatePresence>
                          {showExportMenu && (
                            <>
                              {/* Backdrop to close menu */}
                              <div 
                                className="fixed inset-0 z-20" 
                                onClick={() => setShowExportMenu(false)} 
                              />
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-64 overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl ring-1 ring-black/5 z-30 neo-blur border border-white"
                              >
                                <div className="px-4 py-2 mb-2">
                                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Select Format</p>
                                </div>
                                <button
                                  onClick={exportAsCsv}
                                  className="group/btn flex w-full items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 group-hover/btn:bg-emerald-500 group-hover/btn:text-white transition-colors">
                                    <FileSpreadsheet size={20} />
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <span>Google 試算表 (CSV)</span>
                                    <span className="text-[10px] opacity-60">匯入至 Sheets 或 Excel</span>
                                  </div>
                                </button>
                                <button
                                  onClick={handlePrint}
                                  className="group/btn flex w-full items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-all"
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-400 group-hover/btn:bg-orange-500 group-hover/btn:text-white transition-colors">
                                    <Printer size={20} />
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <span>列印結果 (PDF)</span>
                                    <span className="text-[10px] opacity-60">直接輸出為紙本或檔案</span>
                                  </div>
                                </button>
                                
                                <div className="mt-2 pt-2 border-t border-gray-100 px-2 pb-1">
                                  <a 
                                    href="https://sheets.new" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-gray-50 text-[10px] font-black text-gray-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all uppercase tracking-widest"
                                  >
                                    <span>開啟 Google 試算表官網</span>
                                    <ChevronRight size={12} />
                                  </a>
                                </div>
                                <button
                                  onClick={exportAsTxt}
                                  className="group/btn flex w-full items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 hover:bg-brand-primary/10 hover:text-brand-primary transition-all"
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary group-hover/btn:bg-brand-primary group-hover/btn:text-white transition-colors">
                                    <FileText size={20} />
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <span>純文字 TXT</span>
                                    <span className="text-[10px] opacity-60">易於複製與傳送</span>
                                  </div>
                                </button>
                                <button
                                  onClick={exportAsJson}
                                  className="group/btn flex w-full items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 group-hover/btn:bg-gray-800 group-hover/btn:text-white transition-colors">
                                    <FileJson size={20} />
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <span>數據 JSON</span>
                                    <span className="text-[10px] opacity-60">帶結構的開發者格式</span>
                                  </div>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        onClick={copyToClipboard}
                        className="group flex items-center space-x-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm ring-1 ring-gray-100 transition-all hover:bg-brand-primary hover:text-white hover:ring-brand-primary hover:shadow-lg hover:shadow-brand-primary/20"
                      >
                        {isCopied ? <Check size={18} className="text-brand-secondary" /> : <Copy size={18} className="group-hover:scale-110 transition-transform" />}
                        <span>{isCopied ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {groups.map((group, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group overflow-hidden rounded-[1.5rem] bg-white p-6 shadow-sm border border-slate-100 hover:border-brand-primary/30 transition-all hover:-translate-y-1"
                      >
                        <div className="mb-6 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                              Team Unit
                            </span>
                            <span className="text-xl font-black text-slate-900">
                              Group #{index + 1}
                            </span>
                          </div>
                          <div className="rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider">
                            {group.length} Members
                          </div>
                        </div>
                        <ul className="space-y-2.5">
                          {group.map((name, nameIndex) => (
                            <motion.li 
                              key={nameIndex} 
                              className="flex items-center space-x-3 text-sm font-semibold text-slate-600 group/item"
                            >
                              <div className="h-2 w-2 rounded-full bg-brand-primary/40 group-hover/item:bg-brand-primary transition-colors" />
                              <span className="group-hover/item:text-slate-900 transition-colors">{name}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full min-h-[500px] flex-col items-center justify-center space-y-8 rounded-[2.5rem] border border-slate-200 border-dashed bg-white/40 px-10 text-center neo-blur"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-brand-primary blur-3xl opacity-10 animate-pulse" />
                    <div className="relative rounded-3xl bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
                      <Shuffle size={48} className="text-brand-primary" />
                    </div>
                  </div>
                  <div className="max-w-xs">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Systems Standby</h3>
                    <p className="mt-2 text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                      Waiting for member data input on the left panel to begin partition sequence.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-20 text-center pb-12">
        <div className="flex items-center justify-center space-x-2 mb-4">
           <div className="h-1 w-1 bg-brand-primary rounded-full" />
           <div className="h-1 w-8 bg-brand-primary rounded-full opacity-30" />
           <div className="h-1 w-1 bg-brand-primary rounded-full" />
        </div>
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
          Powered by Randomizer Engine • V2.0
        </p>
      </footer>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden glass-shadow ring-1 ring-white/50"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-xl bg-brand-primary/10 p-2 text-brand-primary">
                    <History size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">歷史分組紀錄</h2>
                    <p className="text-xs font-bold text-gray-400">保留最近 20 筆分組結果</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={clearHistory}
                    disabled={history.length === 0}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                    title="清空歷史"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar bg-slate-50/50">
                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div 
                        key={item.id}
                        className="group flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-brand-primary/20 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-md">
                            <Clock size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 leading-tight truncate">
                              {item.title}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">
                              {new Date(item.timestamp).toLocaleString('zh-TW')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="hidden sm:flex items-center space-x-2">
                             <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md uppercase">
                               {item.groups.length} G
                             </span>
                             <span className="text-[10px] font-black text-slate-400">
                               {item.namesCount} P
                             </span>
                          </div>
                          <button
                            onClick={() => loadFromHistory(item)}
                            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-black hover:bg-brand-primary transition-all uppercase tracking-widest"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="rounded-full bg-gray-50 p-6 text-gray-300">
                      <History size={48} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-400">目前尚無歷史紀錄</p>
                      <p className="text-xs text-gray-300 mt-1">開始進行分組後，結果將自動保存在此處</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
