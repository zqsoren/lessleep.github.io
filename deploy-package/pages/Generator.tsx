import React, { useState, useEffect } from 'react';
import { GenCategory, GenStyle } from '../types';
import { useAuth } from '../contexts/AuthContext';

// ==========================================
// 🏛️ 核心数据结构 (Data Structure)
// ==========================================

// 1. 基础分类数据 (Categories & Styles) - Now Fetched from API
// import axios from 'axios'; // Removed to use fetch

// 2. 高级设置配置字典 (Advanced Config Map) - 已废弃，改为从API动态获取
// 保留此代码作为备用/向后兼容
/*
const ADVANCED_CONFIG_MAP: Record<string, any> = {
    'site_comp': { // 竞赛风
        layers: [
            { id: 'water', label: '水文分析', default: true },
            { id: 'traffic', label: '道路交通', default: true },
            { id: 'green', label: '绿地景观', default: true },
            { id: 'tex', label: '建筑肌理', default: true },
            { id: 'sat', label: '卫星底图', default: false }
        ],
        colors: [
            { id: 'water_c', label: '河流颜色', default: '#71abbf' },
            { id: 'road_c', label: '道路颜色', default: '#faf2c8' },
            { id: 'green_c', label: '植被颜色', default: '#d4e4bb' },
            { id: 'build_c', label: '建筑肌理', default: '#000000' }
        ]
    },
    'site_candy': { // 糖果风 (带裁切)
        crop: true, // 开启裁切选项
        layers: [
            { id: 'water', label: '水文分析', default: true },
            { id: 'green', label: '绿地景观', default: true },
            { id: 'traffic', label: '道路交通', default: true }
        ],
        colors: [
            { id: 'water_c', label: '河流颜色', default: '#AEE2F0' },
            { id: 'green_c', label: '植被颜色', default: '#9CCC65' },
            { id: 'road_c', label: '道路颜色', default: '#E85D75' }
        ]
    },
    'default': { // 默认配置
        layers: [{ id: 'main', label: '主体要素', default: true }],
        colors: [{ id: 'main_c', label: '主体颜色', default: '#333333' }]
    }
};
*/

// API 地址配置：使用环境变量，生产环境使用 .env.production
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

// ==========================================
// 🎯 组件主体 (Main Component)
// ==========================================

interface GeneratorProps {
    onBack: () => void;
    initialImage?: string; // 从设计文件传入的底图
    source?: 'dashboard' | 'project-detail';
}

const Generator: React.FC<GeneratorProps> = ({ onBack, initialImage, source = 'dashboard' }) => {
    // === AUTH ===
    const { user } = useAuth();

    // === REFS ===
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // === STATE ===
    const [categories, setCategories] = useState<GenCategory[]>([]);
    const [loadingPrompts, setLoadingPrompts] = useState(true);

    const [activeTabId, setActiveTabId] = useState<string>('pre_analysis');
    const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<GenStyle | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch Prompts
    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const res = await fetch(`${API_URL}/api/prompts/tree`);
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                    if (data.length > 0) {
                        // Optional: Set default tab if needed
                    }
                }
            } catch (error) {
                console.error("Failed to fetch prompts", error);
            } finally {
                setLoadingPrompts(false);
            }
        };
        fetchPrompts();
    }, []);

    // ========== 初始化:自动填充底图 ==========
    // ========== 初始化:自动填充底图 ==========
    useEffect(() => {
        setUploadedImage(initialImage || null);
    }, [initialImage]);
    // Inputs
    const [userDesc, setUserDesc] = useState('');
    const [aspectRatio, setAspectRatio] = useState('default');
    const [customRatio, setCustomRatio] = useState('');
    const [qualityMode, setQualityMode] = useState('fast');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    // Advanced Settings State - 统一的动态配置值
    const [isAdvancedEnabled, setIsAdvancedEnabled] = useState(false);
    const [advancedValues, setAdvancedValues] = useState<Record<string, any>>({});

    // 动态高级设置配置（从API获取）
    const [advancedConfig, setAdvancedConfig] = useState<any>(null);
    const [loadingAdvanced, setLoadingAdvanced] = useState(false);

    // Process State
    const [isGenerating, setIsGenerating] = useState(false);
    const [processStep, setProcessStep] = useState(''); // 'optimizing' | 'drawing'
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [finalPrompt, setFinalPrompt] = useState('');

    // Modals
    const [showSaveFormatMenu, setShowSaveFormatMenu] = useState(false);
    const [showSaveProjectMenu, setShowSaveProjectMenu] = useState(false);
    const [showPromptPreview, setShowPromptPreview] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    // Derived
    const currentCategory = categories.find(c => c.id === activeTabId);
    const currentSubtypeData = currentCategory?.subtypes.find(s => s.id === selectedSubtype);
    // 使用动态配置，如果没有则使用空配置
    const currentConfig = advancedConfig || { groups: [] };

    // === HANDLERS ===

    // Handle Base Image Upload
    const handleBaseImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Trigger hidden file input
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubtypeClick = (subtypeId: string) => {
        setSelectedSubtype(subtypeId);
        setIsModalOpen(true);
    };

    const handleStyleSelect = async (style: GenStyle) => {
        setSelectedStyle(style);
        setIsModalOpen(false);

        // 重置高级设置状态
        setAdvancedValues({});
        setIsAdvancedEnabled(false);

        // 从API获取高级设置配置
        await fetchAdvancedConfig(style.id);
    };

    // 获取高级设置配置
    const fetchAdvancedConfig = async (styleId: string) => {
        setLoadingAdvanced(true);
        try {
            // 添加时间戳防止缓存
            const res = await fetch(`${API_URL}/api/advanced-settings/${encodeURIComponent(styleId)}?_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setAdvancedConfig(data.config);
                // 初始化默认值
                if (data.config && data.config.groups) {
                    const defaultValues: Record<string, any> = {};
                    data.config.groups.forEach((group: any) => {
                        if (group.type === 'checkbox' && group.options) {
                            // 复选框：收集所有 default 为 true 的选项
                            defaultValues[group.id] = group.options
                                .filter((opt: any) => opt.default)
                                .map((opt: any) => opt.value);
                        } else if (group.type === 'radio' && group.options) {
                            // 单选按钮：找到 default 为 true 的选项
                            const defaultOpt = group.options.find((opt: any) => opt.default);
                            defaultValues[group.id] = defaultOpt ? defaultOpt.value : (group.options[0]?.value || '');
                        } else if (group.type === 'select' && group.options) {
                            // 下拉框：找到 default 为 true 的选项
                            const defaultOpt = group.options.find((opt: any) => opt.default);
                            defaultValues[group.id] = defaultOpt ? defaultOpt.value : (group.options[0]?.value || '');
                        } else if (group.type === 'toggle') {
                            // 拨动开关：使用 default 布尔值
                            defaultValues[group.id] = group.default || false;
                        } else {
                            // text, color: 使用 default 字符串值
                            defaultValues[group.id] = group.default || '';
                        }
                    });
                    setAdvancedValues(defaultValues);
                }
            } else {
                setAdvancedConfig({ groups: [] });
                setAdvancedValues({});
            }
        } catch (error) {
            console.error('Failed to fetch advanced config:', error);
            setAdvancedConfig({ groups: [] });
            setAdvancedValues({});
        } finally {
            setLoadingAdvanced(false);
        }
    };

    // Load projects from API
    useEffect(() => {
        const loadProjects = async () => {
            if (!user) return;

            try {
                // 使用全局 API_URL 变量
                const token = localStorage.getItem('auth_token');
                const response = await fetch(`${API_URL}/api/projects`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setProjects(data.projects || []);
                }
            } catch (error) {
                console.error('Failed to load projects:', error);
            }
        };

        loadProjects();
    }, [user]);

    // --- 核心修复：加强版指令 ---
    const handleGenerate = async () => {
        if (!selectedStyle) { alert("请先选择一种风格样式"); return; }

        setIsGenerating(true);
        setProcessStep('optimizing');
        setResultImage(null);

        try {
            // --- A. 组装详细需求（使用动态配置值）---
            let detailedRequirements = "";
            if (isAdvancedEnabled && advancedConfig && advancedConfig.groups) {
                advancedConfig.groups.forEach((group: any) => {
                    const value = advancedValues[group.id];

                    // 跳过空值
                    if (value === undefined || value === null || value === '' ||
                        (Array.isArray(value) && value.length === 0)) {
                        return;
                    }

                    // 根据类型格式化输出
                    if (group.type === 'checkbox' && Array.isArray(value)) {
                        detailedRequirements += `${group.label}: ${value.join(', ')}\n`;
                    } else if (group.type === 'toggle') {
                        detailedRequirements += `${group.label}: ${value ? '开启' : '关闭'}\n`;
                    } else if (group.type === 'color') {
                        detailedRequirements += `${group.label}: ${value}\n`;
                    } else {
                        detailedRequirements += `${group.label}: ${value}\n`;
                    }
                });
            } else {
                detailedRequirements = "使用默认配置。";
            }

            const ratioStr = aspectRatio === 'custom' ? customRatio : (aspectRatio === 'default' ? '4:3' : aspectRatio);

            // --- B. 构造发给 Gemini 的文本指令 (超级强硬版 - 动态模板支持) ---
            let instruction = "";
            const template = (selectedStyle as any).system_prompt_template;

            // Helper to ensure JSON string
            const baseJsonStr = typeof selectedStyle.prompt === 'string'
                ? selectedStyle.prompt
                : JSON.stringify(selectedStyle.prompt || {}, null, 2);

            if (template) {
                // 使用后台配置的动态模板
                instruction = template
                    .replace('{{BASE_JSON}}', baseJsonStr)
                    .replace('{{USER_DESC}}', userDesc || 'None')
                    .replace('{{ASPECT_RATIO}}', ratioStr)
                    .replace('{{ADVANCED_SETTINGS}}', detailedRequirements);
            } else {
                // Fallback: 默认硬编码模板 (Original Full Prompt)
                instruction = `
Role: Architectural AI Assistant.

    Task: You are updating a configuration JSON for an image generator.
        Your goal is update the "Base JSON" based on the "User Requirements".
        
        --- INPUT DATA-- -
    1. Base JSON(Current Settings):
        ${baseJsonStr}

2. User Requirements(HIGHEST PRIORITY):
- Aspect Ratio: ${ratioStr}
- User Description: "${userDesc || 'None'}"
    - Detailed Specs(Colors / Layers):
        ${detailedRequirements}

            --- INSTRUCTIONS-- -
                1. ** OVERWRITE ** any matching fields in Base JSON with values from "Detailed Specs". 
            (e.g.If Detailed Specs says "River Color: #FF0000", you MUST update the river color field in JSON to #FF0000).
        2. Keep the JSON structure valid.
        3. Do NOT wrap the output in markdown.Return ONLY the raw JSON string.
        `;
            }

            console.log("📡 [Step 1] Sending Text Req:", instruction);
            const optimizedJson = await callGeminiText(instruction);
            setFinalPrompt(optimizedJson);
            console.log("✅ [Step 1] Optimized JSON:", optimizedJson);

            // --- C. 发送生图指令 ---
            setProcessStep('drawing');

            const imageInstruction = `
        Please generate a high - quality architectural analysis diagram based on the following JSON configuration:
        
        ${optimizedJson}
        
        STRICT REQUIREMENT: Generate an IMAGE.Do NOT explain the JSON.
        `;

            console.log("📡 [Step 2] Sending Image Req...");
            const imageData = await callGeminiImage(imageInstruction, uploadedImage);
            console.log("✅ [Step 2] Image Generated!");

            setResultImage(imageData);

            // Auto-save image to server
            if (user && imageData) {
                try {
                    await saveImageToServer({
                        imageData,
                        userId: user.id,
                        categoryId: activeTabId,
                        subtypeId: selectedSubtype || '',
                        styleId: selectedStyle?.id || '',
                        prompt: optimizedJson,
                        // New extended fields
                        baseJson: baseJsonStr,
                        userDesc: userDesc,
                        advancedSettings: detailedRequirements,
                        aspectRatio: ratioStr,
                        fullPrompt: instruction,
                    });
                    console.log("✅ Image auto-saved to server with details:", { baseJsonStr, userDesc, detailedRequirements, ratioStr, instruction });
                    // 暂时移除强制刷新，改为前端状态更新或静默处理，避免跳转回首页
                    // window.location.reload(); 
                } catch (saveError) {
                    console.error("Failed to auto-save image:", saveError);
                    // Don't block the UI if save fails
                }
            }

        } catch (error: any) {
            console.error(error);
            alert(`生成失败: ${error.message} `);
        } finally {
            setIsGenerating(false);
            setProcessStep('');
        }
    };

    // --- API Functions ---
    async function callGeminiText(instruction: string) {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/api/gemini/generate-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ instruction })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`文本生成API错误 (${response.status}): ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) {
            console.error("Gemini Text API returned no candidates:", data);
            // ❌ 移除由于调用失败导致的静默回退 (Silent Fallback)
            // 🛑 改为显式抛出错误，让用户知道 AI 没有工作
            throw new Error("提示词优化失败: AI 未返回任何结果。请检查模型配置或 API Key。");
            // return selectedStyle?.prompt || "{}";
        }
        let text = data.candidates[0].content.parts[0].text;
        return text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    async function callGeminiImage(prompt: string, base64Image: string | null) {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/api/gemini/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                prompt,
                base64Image
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`图片生成API错误 (${response.status}): ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();

        // Parser
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const parts = data.candidates[0].content.parts;
            for (const part of parts) {
                if (part.inline_data) return `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("AI未生成图片,请重试");
    }

    // Save image to server
    async function saveImageToServer(data: {
        imageData: string;
        userId: number;
        categoryId: string;
        subtypeId: string;
        styleId: string;
        prompt: string;
        // Optional extended fields
        baseJson?: string;
        userDesc?: string;
        advancedSettings?: string;
        aspectRatio?: string;
        fullPrompt?: string;
    }) {
        // 使用全局 API_URL 变量
        const token = localStorage.getItem('auth_token');

        const response = await fetch(`${API_URL}/api/images/save`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to save image');
        }

        return await response.json();
    }

    // --- 保存功能 ---
    const handleDownload = (format: string) => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `Zzzap_Gen_${Date.now()}.${format === 'jpg' ? 'jpg' : 'png'}`;
        if (format === 'svg' || format === 'ai') {
            alert('矢量转换功能开发中，暂时为您下载 PNG 原图。');
        }
        link.click();
        setShowSaveFormatMenu(false);
    };

    const handleSaveToProject = async (isNew: boolean, existingId?: number) => {
        if (!resultImage || !user) return;

        try {
            // 使用全局 API_URL 变量
            const token = localStorage.getItem('auth_token');

            if (isNew) {
                const response = await fetch(`${API_URL}/api/projects`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: `新项目 ${Date.now()}`,
                        description: `从Generator创建 - ${currentCategory?.name || '未分类'}`
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    alert(`项目创建成功: ${data.project.name}`);
                } else {
                    const error = await response.json();
                    alert(`创建项目失败: ${error.error}`);
                }
            } else if (existingId) {
                alert('保存到现有项目功能开发中...');
            }
            setShowSaveProjectMenu(false);
        } catch (error) {
            console.error('Save to project error:', error);
            alert('保存失败,请重试');
        }
    };

    return (
        <div className="w-full h-screen overflow-hidden flex bg-surface relative">

            {/* COLUMN 1: NAVIGATION */}
            <div className="w-[300px] bg-surface border-r border-gray-200 flex flex-col z-20 shadow-soft">
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 text-gray-500 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center shadow-sm" title={source === 'project-detail' ? "返回项目" : "返回首页"}>
                            {source === 'project-detail' ? <i className="fa-solid fa-arrow-left text-sm"></i> : <i className="fa-solid fa-house text-sm"></i>}
                        </button>

                        {source === 'dashboard' ? (
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={onBack}>
                                {/* Logo Icon - Geometric House with Eyes - Rainbow Stroke */}
                                <div className="w-8 h-8 relative">
                                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                                        <defs>
                                            <linearGradient id="rainbowGradGen" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#4285F4" />
                                                <stop offset="50%" stopColor="#EA4335" />
                                                <stop offset="100%" stopColor="#FBBC04" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M50 10 L90 50 L90 90 L10 90 L10 50 Z" fill="#1e293b" />
                                        <circle cx="35" cy="55" r="8" fill="white" />
                                        <circle cx="65" cy="55" r="8" fill="white" />
                                        <circle cx="37" cy="55" r="3" fill="#1e293b" />
                                        <circle cx="63" cy="55" r="3" fill="#1e293b" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="font-display text-xl font-black tracking-tighter text-slate-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:via-red-500 group-hover:to-yellow-500 transition-all">
                                        Zzzap
                                    </h1>
                                    <p className="text-[9px] text-onSurface-variant tracking-wider uppercase">AI 工作台</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col cursor-pointer" onClick={onBack}>
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <i className="fa-solid fa-folder-open text-sm"></i>
                                    <span>返回项目</span>
                                </div>
                                <p className="text-[10px] text-gray-400">Back to Project</p>
                            </div>
                        )}
                    </div>
                    <h2 className="text-onSurface-muted text-xs font-bold uppercase tracking-widest pl-1 mb-2">分类 (Category)</h2>
                </div>

                {/* Level 1: Categories */}
                <div className="px-6 pb-4 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button key={cat.id} onClick={() => setActiveTabId(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${activeTabId === cat.id ? 'bg-primary-bg text-primary border-primary-bg' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Level 2: Subtypes */}
                <div className="flex-1 overflow-y-auto px-6 py-2 scrollbar-hide">
                    <div className="grid grid-cols-2 gap-3">
                        {currentCategory?.subtypes.map((sub) => (
                            <button key={sub.id} onClick={() => handleSubtypeClick(sub.id)}
                                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${selectedSubtype === sub.id ? 'border-primary bg-primary-bg shadow-sm' : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200'}`}>
                                <i className={`fa-solid ${sub.icon} text-lg ${selectedSubtype === sub.id ? 'text-primary' : 'text-gray-400'}`}></i>
                                <span className={`text-[10px] font-medium ${selectedSubtype === sub.id ? 'text-primary' : 'text-gray-500'}`}>{sub.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div className="p-6 bg-surface-50 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">当前选择 (Selected)</p>
                    <div className="w-full aspect-video rounded-xl bg-white border border-gray-200 overflow-hidden relative shadow-sm group">
                        {selectedStyle ? (
                            <>
                                <img src={selectedStyle.preview} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent">
                                    <span className="text-white font-bold text-xs">{selectedStyle.name}</span>
                                </div>
                            </>
                        ) : <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] bg-gray-50">请选择风格</div>}
                    </div>
                </div>
            </div>

            {/* COLUMN 2: CONFIGURATION */}
            <div className="w-[380px] bg-surface border-r border-gray-200 flex flex-col z-10 w-96 max-w-sm">
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                    <h2 className="text-base font-medium text-onSurface">配置 (Configuration)</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload (Base Image) */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-700 mb-2 flex justify-between items-center">
                            底图 (Base Image)
                            {uploadedImage && <button onClick={() => setUploadedImage(null)} className="text-[10px] text-red-400 hover:text-red-500">清除</button>}
                        </h3>
                        <div
                            onClick={handleUploadClick}
                            className={`border border-dashed rounded-xl h-24 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden cursor-pointer transition-colors group ${uploadedImage ? 'border-primary' : 'border-gray-300 hover:border-google-blue hover:bg-blue-50/50'}`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleBaseImageUpload}
                            />

                            {uploadedImage ? (
                                <>
                                    <img src={uploadedImage} className="w-full h-full object-contain p-1" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-[10px] font-bold"><i className="fa-solid fa-pen mr-1"></i> 点击替换</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-2 group-hover:scale-105 transition-transform">
                                    <i className="fa-solid fa-cloud-arrow-up text-lg mb-1 group-hover:text-google-blue transition-colors"></i>
                                    <p className="text-[10px] group-hover:text-google-blue transition-colors">点击上传参考图</p>
                                    <p className="text-[9px] text-gray-400 mt-1">(支持 JPG, PNG)</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Prompt */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-700 mb-2">描述 (Description)</h3>
                        <textarea
                            className="w-full h-24 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:border-google-blue focus:bg-white outline-none resize-none transition-all placeholder:text-gray-400"
                            placeholder="描述你的设计意图、风格偏好..."
                            value={userDesc} onChange={(e) => setUserDesc(e.target.value)}
                        ></textarea>
                    </section>

                    {/* Advanced Settings */}
                    <section className="bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                <i className="fa-solid fa-sliders text-google-blue"></i> 高级设置 (Advanced)
                            </h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isAdvancedEnabled} onChange={(e) => setIsAdvancedEnabled(e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-google-blue"></div>
                            </label>
                        </div>

                        <div className={`p-4 space-y-5 transition-all duration-300 ${isAdvancedEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                            {loadingAdvanced ? (
                                <div className="text-center text-xs text-gray-400 py-4">
                                    <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                                    加载配置中...
                                </div>
                            ) : !advancedConfig || !advancedConfig.groups || advancedConfig.groups.length === 0 ? (
                                <div className="text-center text-xs text-gray-400 py-4">
                                    该风格暂无高级设置
                                    {/* DEBUG INFO */}
                                    <div className="mt-2 text-[10px] text-red-300 font-mono text-left bg-black/5 p-2 rounded overflow-auto max-h-20">
                                        DEBUG: {JSON.stringify(advancedConfig)}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* DEBUG INFO REMOVED */}
                                    {advancedConfig.groups.map((group: any) => (
                                        <div key={group.id}>
                                            <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-wide">
                                                {group.label}
                                            </label>

                                            {/* Text Input */}
                                            {group.type === 'text' && (
                                                <input
                                                    type="text"
                                                    className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-google-blue outline-none"
                                                    placeholder={group.default || ''}
                                                    value={advancedValues[group.id] || ''}
                                                    onChange={(e) => setAdvancedValues({ ...advancedValues, [group.id]: e.target.value })}
                                                />
                                            )}

                                            {/* Color Picker */}
                                            {group.type === 'color' && (
                                                <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                                                    <span className="text-[10px] text-gray-400 uppercase font-mono">
                                                        {advancedValues[group.id] || group.default || '#000000'}
                                                    </span>
                                                    <input
                                                        type="color"
                                                        className="w-6 h-6 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                                        value={advancedValues[group.id] || group.default || '#000000'}
                                                        onChange={(e) => setAdvancedValues({ ...advancedValues, [group.id]: e.target.value })}
                                                    />
                                                </div>
                                            )}

                                            {/* Checkbox (多选按钮) */}
                                            {group.type === 'checkbox' && group.options && (
                                                <div className="flex flex-wrap gap-2">
                                                    {group.options.map((opt: any) => {
                                                        const isSelected = (advancedValues[group.id] || []).includes(opt.value);
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => {
                                                                    const current = advancedValues[group.id] || [];
                                                                    if (isSelected) {
                                                                        setAdvancedValues({
                                                                            ...advancedValues,
                                                                            [group.id]: current.filter((v: string) => v !== opt.value)
                                                                        });
                                                                    } else {
                                                                        setAdvancedValues({
                                                                            ...advancedValues,
                                                                            [group.id]: [...current, opt.value]
                                                                        });
                                                                    }
                                                                }}
                                                                className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all ${isSelected
                                                                    ? 'bg-primary-bg border-primary-bg text-primary'
                                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-google-blue hover:text-google-blue'
                                                                    }`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Radio (单选按钮) */}
                                            {group.type === 'radio' && group.options && (
                                                <div className="flex gap-2">
                                                    {group.options.map((opt: any) => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => setAdvancedValues({ ...advancedValues, [group.id]: opt.value })}
                                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${advancedValues[group.id] === opt.value
                                                                ? 'bg-primary-bg text-primary border-primary-bg'
                                                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Select (下拉框) */}
                                            {group.type === 'select' && group.options && (
                                                <select
                                                    value={advancedValues[group.id] || ''}
                                                    onChange={(e) => setAdvancedValues({ ...advancedValues, [group.id]: e.target.value })}
                                                    className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white focus:border-google-blue outline-none"
                                                >
                                                    {group.options.map((opt: any) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {/* Toggle (拨动开关) */}
                                            {group.type === 'toggle' && (
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={advancedValues[group.id] || false}
                                                        onChange={(e) => setAdvancedValues({ ...advancedValues, [group.id]: e.target.checked })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-google-blue"></div>
                                                </label>
                                            )}
                                        </div>
                                    ))}</>
                            )}
                        </div>
                    </section>
                </div>

                {/* Generate Button */}
                <div className="p-6 border-t border-gray-100 bg-surface">
                    <button
                        onClick={handleGenerate} disabled={isGenerating}
                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md hover:shadow-lg text-sm group relative overflow-hidden ${isGenerating ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white hover:bg-google-blue-hover'}`}
                    >
                        {isGenerating ? (
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                                <span>{processStep === 'optimizing' ? '优化指令中...' : 'AI 绘图中...'}</span>
                            </div>
                        ) : (
                            <>
                                <span className="relative z-10">立即生成 (Generate)</span>
                                <i className="fa-solid fa-wand-magic-sparkles text-yellow-300 relative z-10 group-hover:rotate-12 transition-transform"></i>
                                {/* Rainbow Sparkle Effect on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-google-blue via-google-red to-google-yellow opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            </>
                        )}
                    </button>
                    {isGenerating && (
                        <div className="w-full h-1 bg-gray-100 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-google-blue via-google-red to-google-yellow animate-width-scan"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMN 3: RESULT */}
            <div className="flex-1 bg-surface-50 flex flex-col relative justify-center items-center">
                {resultImage ? (
                    <div className="relative group max-w-[90%] max-h-[80%] shadow-card rounded-lg overflow-hidden">
                        <img src={resultImage} className="w-full h-full object-contain bg-white" />
                    </div>
                ) : (
                    <div className="text-center opacity-20 select-none">
                        <i className="fa-brands fa-google text-6xl mb-4 text-gray-400"></i>
                        <p className="font-sans font-medium text-lg text-gray-400 tracking-wide">Gemini 3.0 Pro</p>
                        <p className="text-sm">准备生成 (Ready)</p>
                    </div>
                )}

                {/* Bottom Actions */}
                <div className="absolute bottom-8 bg-white/90 backdrop-blur rounded-2xl shadow-float border border-white p-2 flex items-center gap-4 transition-all">
                    <button onClick={() => setShowPromptPreview(true)} disabled={!finalPrompt} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 hover:text-primary transition-colors disabled:opacity-30" title="查看 Prompt">
                        <i className="fa-solid fa-code"></i>
                    </button>

                    <div className="w-px h-6 bg-gray-200"></div>

                    {/* Save Image */}
                    <div className="relative">
                        <button onClick={() => setShowSaveFormatMenu(!showSaveFormatMenu)} disabled={!resultImage} className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-onSurface font-medium text-sm border border-gray-200 hover:border-gray-300 transition-all flex items-center gap-2 disabled:opacity-50">
                            <i className="fa-solid fa-download text-gray-400"></i> 下载
                        </button>
                        {showSaveFormatMenu && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                                {['jpg', 'png', 'ai', 'svg'].map(fmt => (
                                    <button key={fmt} onClick={() => handleDownload(fmt)} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 uppercase font-medium text-gray-600 hover:text-primary">{fmt}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Save Project */}
                    <div className="relative">
                        <button onClick={() => setShowSaveProjectMenu(!showSaveProjectMenu)} disabled={!resultImage} className="px-4 py-2 rounded-xl bg-primary hover:bg-google-blue-hover text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none">
                            <i className="fa-solid fa-folder-plus"></i> 保存未项目
                        </button>
                        {showSaveProjectMenu && (
                            <div className="absolute bottom-full mb-2 right-0 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 overflow-hidden">
                                <button onClick={() => handleSaveToProject(true)} className="w-full text-left px-4 py-3 text-xs font-bold text-primary bg-primary-bg border-b border-primary-bg hover:bg-blue-100 transition-colors">
                                    <i className="fa-solid fa-plus mr-2"></i> 创建新项目
                                </button>
                                <div className="max-h-48 overflow-y-auto">
                                    {projects.map((p: any) => (
                                        <button key={p.id} onClick={() => handleSaveToProject(false, p.id)} className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 text-gray-600 truncate border-b border-gray-50 last:border-0">
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Style Modal */}
            {isModalOpen && currentSubtypeData && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-20 animate-in fade-in duration-200">
                    <div className="bg-surface w-full h-full rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 border border-gray-200 ring-1 ring-black/5">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-surface-50">
                            <div>
                                <h3 className="text-2xl font-display font-bold text-onSurface">{currentSubtypeData.name}</h3>
                                <p className="text-sm text-gray-400">Select a style preset to continue</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><i className="fa-solid fa-xmark text-gray-500"></i></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-4 gap-8 bg-surface">
                            {currentSubtypeData.styles.map(style => (
                                <div key={style.id} onClick={() => handleStyleSelect(style)} className="group cursor-pointer">
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 relative shadow-card group-hover:shadow-float group-hover:scale-[1.02] transition-all border border-gray-100">
                                        <img src={style.preview} className="w-full h-full object-contain bg-white" />
                                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors"></div>
                                        {/* Rainbow selection border on hover */}
                                        <div className="absolute inset-0 border-4 border-transparent group-hover:border-primary/20 rounded-2xl transition-colors"></div>
                                    </div>
                                    <h4 className="font-medium text-lg text-center text-onSurface group-hover:text-primary transition-colors">{style.name}</h4>
                                    <p className="text-xs text-center text-gray-400 mt-1">{style.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Prompt Preview */}
            {showPromptPreview && (
                <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl w-[600px] overflow-hidden animate-in zoom-in-95 border border-gray-300">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2"><i className="fa-solid fa-code text-google-green"></i> Prompt Instructions</h3>
                            <button onClick={() => setShowPromptPreview(false)}><i className="fa-solid fa-xmark text-gray-400 hover:text-gray-600"></i></button>
                        </div>
                        <div className="p-0 bg-[#1e1e1e] overflow-auto max-h-[400px]">
                            <pre className="text-xs font-mono text-gray-300 p-6 leading-relaxed whitespace-pre-wrap">{finalPrompt}</pre>
                        </div>
                        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button onClick={() => navigator.clipboard.writeText(finalPrompt)} className="text-xs font-bold text-gray-500 hover:text-primary px-3 py-1">Copy to Clipboard</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Generator;
