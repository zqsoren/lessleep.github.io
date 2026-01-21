import React, { useState, useEffect } from 'react';
import { GenCategory, GenStyle } from '../types';
import { useAuth } from '../contexts/AuthContext';

// ==========================================
// 🏛️ 核心数据结构 (Data Structure)
// ==========================================

// 1. 基础分类数据 (Categories & Styles)
const GENERATOR_DATA: GenCategory[] = [
    {
        id: 'pre_analysis', name: '前期分析',
        subtypes: [
            {
                id: 'site_status', name: '场地分析', icon: 'fa-map-location-dot', styles: [
                    { id: 'sitestatus_style01', name: 'STYLE 01', preview: '/preview_sitestatus_style01.png', description: '单色、线稿风、竞赛风、圆形图层', prompt: '{ "task": "建筑分析图生成", "meta": { "label": "垂直爆炸分析图", "version": "CN_v3.1_Blue_Grey_Adjust", "aspect_ratio": "9:16" }, "geometry_constraint": { "instruction": "严格遵循输入卫星地图的道路与建筑布局 (Strictly follow the road and building layout of the input satellite map)", "cropping": "对输入地图进行圆形裁切 (Circular crop of the provided map)" }, "style": { "primary_aesthetic": "技术性建筑图解 (Technical Architectural Diagram)", "sub_style": "蓝灰冷色调风格 (Cold Blue & Grey Tone)", "rendering_quality": "CAD线稿风格，完全扁平化，纸张般极薄 (Paper-thin)", "background_color": "纯白背景 (Hex #ffffff)", "visual_treatment": "强调色块与线条的平面构成，无侧面挤压" }, "composition": { "viewpoint": "爆炸轴侧图视角 (Exploded Axonometric)", "layout": "4个圆形切片垂直堆叠", "alignment": "圆心垂直对齐", "details": "使用深灰色细虚线连接各层，线条干练精确" }, "subject": { "main_concept": "建筑场地多维分析分解图 - 蓝灰定制版", "layers": [ { "position": "第1层 (顶部)", "theme": "水文与城市肌理", "elements": "河流与水域显示为工程蓝 (Hex #4091c1)", "context": "水域周边的非水区域显示为白色，建筑部分形成浅灰色 (Hex #e2e1e0) 的建筑肌理，扁平无厚度" }, { "position": "第2层 (上中)", "theme": "道路交通网络", "elements": "工程蓝 (Hex #4091c1) 的精密线条网络，线型锐利", "context": "严谨的CAD线型，区分主次干道，无光晕" }, { "position": "第3层 (中部)", "theme": "绿地景观", "elements": "绿地统一填充为清透的浅蓝色 (Hex #ebf6fc)", "details": "路网和建筑肌理部分用白色(Hex #FFFFFF) 填充", "context": "浅蓝斑块 + 白色的组合" }, { "position": "第4层 (下中)", "theme": "建筑图底 (Figure-Ground)", "elements": "深灰色 (Hex #4c4c4c) 建筑图底，对比度极高", "style": "经典的黑白图底关系，边缘锐利，无立体高度" }' },
                    { id: 'sitestatus_style02', name: 'STYLE 02', preview: 'https://placehold.co/600x400?text=Candy', description: '彩色、清新、马卡龙色系、圆形图层', prompt: '{ "task":"建筑分析图生成", "meta": { "label":"垂直爆炸分析图", "version":"CN_v2.1_Circle_Flat", "aspect_ratio":"9:16" }, "geometry_constraint": { "instruction": "严格遵循输入卫星地图的道路与建筑布局 (Strictly follow the road and building layout of the input satellite map)", "cropping": "对输入地图进行圆形裁切 (Circular crop of the provided map)" }, "style": { "primary_aesthetic":"柔和等轴测信息图表 (Soft Isometric Infographic)", "sub_style":"圆形UI设计风格，磨砂玻璃拟态风格,马卡龙色系 (Circular UI Style & Glassmorphism & Pastel Colors)", "rendering_quality":"完全扁平化，纸张般极薄 (Paper-thin)，无体积感，无三维厚度,半透明材质，柔和全局光", "background_color":"纯白背景 (Hex #ffffff)", "visual_treatment":"切片为二维平面 (2D Planes)，无侧面挤压厚度 (No Extrusion),图层具有半透明通透感" }, "composition": { "viewpoint":"爆炸轴侧图视角 (Exploded Axonometric)", "layout":"5个圆形切片垂直堆叠 (5 Circular Slices Vertical Stack)", "alignment":"圆心垂直对齐", "details":"使用垂直虚线贯穿圆心或边缘，连接各个圆形切片" }, "subject": { "main_concept":"建筑场地多维分析分解图 - 圆形版", "layers": [ { "position":"第1层 (顶部)", "theme":"水文与流动", "elements":"透明青蓝色块 (Hex #AEE2F0) 表示水域，强调流动感", "context":"扁平圆形卡片，格类似参考图中间层的科技感，清透" }, { "position":"第2层 (上中)", "theme":"道路交通网络", "elements":"使用胭脂粉色 (Hex #E85D75) 的线条网络，配合淡粉色光晕 (Hex #FCE4EC)，受圆形边界限制", "context":"模仿参考图顶层的粉色线性风格，主要道路加粗，节点处有圆形标记" }, { "position":"第3层 (中部)", "theme":"绿地景观", "elements":"嫩黄色底座 (Hex #F7F5D8) 搭配清新的草绿色植被 (Hex #9CCC65)，浅米色 (Hex #F5F5DC) 填充非绿地区域作为基底", "details": "叠加纯白色 (Hex #FFFFFF) 的路网线条" "context":"模仿参考图底层的景观风格，树木简化为球形或抽象符号" " }, { "position":"第4层 (下中)", "theme":"建筑图底", "elements":"淡蓝灰色 (Hex #ECEFF1) 的几何色块表示建筑，基于真实建筑轮廓生成", "style":"二维平面图底关系，无立体高度" }, { "position":"第5层 (底部)", "theme":"环境底图", "elements":"经过矢量化简化的浅米色 (Hex #F5F5DC) 场地底图 ", "style":"保留原始地形特征，但色彩统一化" } ] }, "lighting": { "type":"平光/无光照渲染 (Flat Lighting / Unlit)", "shadows":"绝对无投影 (No Drop Shadows)，层与层之间无遮挡阴影", "mood":"干净，清新、治愈、现代图解风格" } }' }
                ]
            },
            { id: 'site_texture', name: '场地底图', icon: 'fa-city', styles: [{ id: 'plan_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Masterplan' }] },
            { id: 'planning', name: '上位规划分析', icon: 'fa-city', styles: [{ id: 'plan_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Masterplan' }] },
            { id: 'crowd', name: '人群分析', icon: 'fa-users', styles: [{ id: 'crowd_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Crowd Analysis' }] },
            { id: 'culture', name: '场地现状分析', icon: 'fa-landmark', styles: [{ id: 'cult_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Cultural Analysis' }] },
        ]
    },
    {
        id: 'design_process', name: '方案分析',
        subtypes: [
            { id: 'process', name: '建筑生成过程', icon: 'fa-cubes', styles: [{ id: 'proc_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Process' }] },
            { id: 'exploded', name: '爆炸图', icon: 'fa-layer-group', styles: [{ id: 'exp_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Exploded View' }] },
            { id: 'section', name: '剖透视', icon: 'fa-house-chimney-crack', styles: [{ id: 'sect_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Section Perspective' }] },
            { id: 'func', name: '建筑功能分析', icon: 'fa-sitemap', styles: [{ id: 'func_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Program Analysis' }] },
            { id: 'flow', name: '建筑流线分析', icon: 'fa-route', styles: [{ id: 'flow_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Circulation' }] },
        ]
    },
    {
        id: 'green', name: '技术分析',
        subtypes: [
            { id: 'wind', name: '风环境分析', icon: 'fa-wind', styles: [{ id: 'wind_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Wind Analysis' }] },
            { id: 'heat', name: '热环境分析', icon: 'fa-temperature-high', styles: [{ id: 'heat_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Heat Analysis' }] },
        ]
    },
    {
        id: 'render', name: '效果图',
        subtypes: [
            { id: 'real', name: '写实风', icon: 'fa-camera', styles: [{ id: 'real_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Realistic' }] },
            { id: 'collage', name: '拼贴风', icon: 'fa-paste', styles: [{ id: 'coll_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Collage' }] },
            { id: 'contest', name: '竞赛风', icon: 'fa-trophy', styles: [{ id: 'cont_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Contest' }] },
        ]
    },
    {
        id: 'tech_dwg', name: '技术图纸',
        subtypes: [
            { id: 'plan', name: '平面图', icon: 'fa-border-all', styles: [{ id: 'plan_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Plan' }] },
            { id: 'elevation', name: '立面图', icon: 'fa-building', styles: [{ id: 'elev_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Elevation' }] },
            { id: 'section_dwg', name: '剖面图', icon: 'fa-grip-lines', styles: [{ id: 'sect_dwg_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Section' }] },
            { id: 'master', name: '总平面图', icon: 'fa-map', styles: [{ id: 'master_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Master Plan' }] },
        ]
    },
];

// 2. 高级设置配置字典 (Advanced Config Map)
// key = style.id
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

// API 地址配置：使用环境变量，生产环境使用 .env.production
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

// ==========================================
// 🎯 组件主体 (Main Component)
// ==========================================

interface GeneratorProps {
    onBack: () => void;
    initialImage?: string; // 从设计文件传入的底图
}

const Generator: React.FC<GeneratorProps> = ({ onBack, initialImage }) => {
    // === AUTH ===
    const { user } = useAuth();

    // === STATE ===
    const [activeTabId, setActiveTabId] = useState<string>('pre_analysis');
    const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<GenStyle | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ========== 初始化:自动填充底图 ==========
    useEffect(() => {
        if (initialImage) {
            setUploadedImage(initialImage);
        }
    }, [initialImage]);
    // Inputs
    const [userDesc, setUserDesc] = useState('');
    const [aspectRatio, setAspectRatio] = useState('default');
    const [customRatio, setCustomRatio] = useState('');
    const [qualityMode, setQualityMode] = useState('fast');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    // Advanced Settings State
    const [isAdvancedEnabled, setIsAdvancedEnabled] = useState(false);
    const [selectedLayers, setSelectedLayers] = useState<string[]>([]); // 存图层ID
    const [layerColors, setLayerColors] = useState<Record<string, string>>({}); // 存颜色
    const [customLayers, setCustomLayers] = useState<string[]>([]); // 用户手输的图层
    const [newLayerName, setNewLayerName] = useState(''); // 输入框临时态
    const [showLayerInput, setShowLayerInput] = useState(false);
    const [cropShape, setCropShape] = useState('none');

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
    const currentCategory = GENERATOR_DATA.find(c => c.id === activeTabId);
    const currentSubtypeData = currentCategory?.subtypes.find(s => s.id === selectedSubtype);
    const currentConfig = (selectedStyle && ADVANCED_CONFIG_MAP[selectedStyle.id]) || ADVANCED_CONFIG_MAP['default'];

    // === HANDLERS ===

    const handleSubtypeClick = (subtypeId: string) => {
        setSelectedSubtype(subtypeId);
        setIsModalOpen(true);
    };

    const handleStyleSelect = (style: GenStyle) => {
        setSelectedStyle(style);
        setIsModalOpen(false);

        // Reset Settings
        const config = ADVANCED_CONFIG_MAP[style.id] || ADVANCED_CONFIG_MAP['default'];
        const initialLayers = config.layers ? config.layers.filter((l: any) => l.default).map((l: any) => l.label) : [];
        setSelectedLayers(initialLayers);
        setCustomLayers([]);
        const initialColors: Record<string, string> = {};
        if (config.colors) {
            config.colors.forEach((c: any) => initialColors[c.label] = c.default);
        }
        setLayerColors(initialColors);
        setIsAdvancedEnabled(false); // Default OFF
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
            // --- A. 组装详细需求 ---
            let detailedRequirements = "";
            if (isAdvancedEnabled) {
                const allLayers = [...selectedLayers, ...customLayers];
                detailedRequirements += `图层选择：${allLayers.length} 个图层堆叠(${allLayers.join(', ')}).\n`;
                detailedRequirements += `颜色定义(Color Overrides)：\n`;
                Object.entries(layerColors).forEach(([label, color]) => {
                    detailedRequirements += `- ${label}: ${color} \n`;
                });
                if (currentConfig.crop && cropShape !== 'none') {
                    detailedRequirements += `形状裁切：${cropShape === 'circle' ? '圆形' : '方向'} `;
                }
            } else {
                detailedRequirements = "使用默认配置。";
            }

            const ratioStr = aspectRatio === 'custom' ? customRatio : (aspectRatio === 'default' ? '4:3' : aspectRatio);

            // --- B. 构造发给 Gemini 的文本指令 (超级强硬版) ---
            const instruction = `
Role: Architectural AI Assistant.

    Task: You are updating a configuration JSON for an image generator.
        Your goal is update the "Base JSON" based on the "User Requirements".
        
        --- INPUT DATA-- -
    1. Base JSON(Current Settings):
        ${selectedStyle.prompt}

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
                        prompt: finalPrompt
                    });
                    console.log("✅ Image auto-saved to server");
                } catch (saveError) {
                    console.error("Failed to auto-save image:", saveError);
                    // Don't block the UI if save fails
                }
            }

        } catch (error: any) {
            console.error(error);
            alert(`生成失败: ${error.message}`);
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
        const data = await response.json();
        if (!data.candidates) return selectedStyle?.prompt || "{}";
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
                        <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 text-gray-500 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center shadow-sm">
                            <i className="fa-solid fa-house text-sm"></i>
                        </button>
                        <div className="flex items-center gap-2 group cursor-pointer">
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
                    </div>
                    <h2 className="text-onSurface-muted text-xs font-bold uppercase tracking-widest pl-1 mb-2">分类 (Category)</h2>
                </div>

                {/* Level 1: Categories */}
                <div className="px-6 pb-4 flex flex-wrap gap-2">
                    {GENERATOR_DATA.map((cat) => (
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
                    {/* Upload */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-700 mb-2">底图上传 (Base Image)</h3>
                        <label className="border border-dashed border-gray-300 rounded-xl h-24 bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:border-google-blue hover:text-google-blue cursor-pointer transition-colors relative overflow-hidden group">
                            {uploadedImage ? <img src={uploadedImage} className="w-full h-full object-contain" /> : <><i className="fa-solid fa-cloud-arrow-up text-lg mb-1 group-hover:-translate-y-1 transition-transform"></i><span className="text-[10px]">点击上传图片</span></>}
                            <input type="file" hidden onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => setUploadedImage(e.target?.result as string);
                                    reader.readAsDataURL(file);
                                }
                            }} accept="image/*" />
                            {uploadedImage && <button onClick={(e) => { e.preventDefault(); setUploadedImage(null); }} className="absolute top-1 right-1 bg-gray-200 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors">&times;</button>}
                        </label>
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

                        <div className={`p-4 space-y-5 transition-all duration-300 ${isAdvancedEnabled ? 'opacity-100 max-h-[500px]' : 'opacity-40 pointer-events-none max-h-20 overflow-hidden'}`}>

                            {/* 1. Ratio */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-wide">图片比例 (Ratio)</label>
                                <div className="flex gap-2">
                                    {['default', '1:1', '16:9', 'custom'].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setAspectRatio(r)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${aspectRatio === r ? 'bg-primary-bg text-primary border-primary-bg' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {r === 'default' ? '4:3' : r}
                                        </button>
                                    ))}
                                </div>
                                {aspectRatio === 'custom' && <input type="text" placeholder="宽:高 (例如 2:1)" value={customRatio} onChange={(e) => setCustomRatio(e.target.value)} className="w-full text-xs p-2 mt-2 rounded-lg border border-gray-200 focus:border-google-blue outline-none" />}
                            </div>

                            {/* 2. Layers (Dynamic) */}
                            {currentConfig.layers && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-wide">图层 (Layers: {selectedLayers.length + customLayers.length})</label>
                                    <div className="flex flex-wrap gap-2">
                                        {currentConfig.layers.map((l: any) => (
                                            <button key={l.id} onClick={() => {
                                                if (selectedLayers.includes(l.label)) setSelectedLayers(selectedLayers.filter(x => x !== l.label));
                                                else setSelectedLayers([...selectedLayers, l.label]);
                                            }} className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all ${selectedLayers.includes(l.label) ? 'bg-primary-bg border-primary-bg text-primary' : 'bg-white border-gray-200 text-gray-500 hover:border-google-blue hover:text-google-blue'}`}>
                                                {l.label}
                                            </button>
                                        ))}
                                        {/* Custom Add */}
                                        {customLayers.map(l => <span key={l} className="px-2.5 py-1 rounded-md text-[10px] bg-primary-bg border border-primary-bg text-primary">{l}</span>)}
                                        <button onClick={() => setShowLayerInput(!showLayerInput)} className="px-2.5 py-1 rounded-md text-[10px] border border-dashed text-gray-400 hover:text-google-blue hover:border-google-blue bg-white"><i className="fa-solid fa-plus"></i></button>
                                    </div>
                                    {showLayerInput && (
                                        <div className="mt-2 flex gap-1 animate-in fade-in slide-in-from-top-1">
                                            <input className="w-full text-xs border border-gray-200 p-1.5 rounded bg-white outline-none focus:border-google-blue" placeholder="输入图层名称..." value={newLayerName} onChange={e => setNewLayerName(e.target.value)} />
                                            <button onClick={() => {
                                                if (newLayerName) { setCustomLayers([...customLayers, newLayerName]); setNewLayerName(''); setShowLayerInput(false); }
                                            }} className="bg-primary text-white px-3 rounded text-xs hover:bg-google-blue-hover">添加</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. Colors (Dynamic) */}
                            {currentConfig.colors && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-wide">颜色 (Colors)</label>
                                    <div className="space-y-1.5">
                                        {currentConfig.colors.map((c: any) => (
                                            <div key={c.id} className="flex items-center justify-between bg-white p-1.5 px-3 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                                                <span className="text-[11px] text-gray-600">{c.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-400 uppercase font-mono">{layerColors[c.label] || c.default}</span>
                                                    <input type="color" className="w-5 h-5 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                                        value={layerColors[c.label] || c.default}
                                                        onChange={(e) => setLayerColors({ ...layerColors, [c.label]: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 4. Crop (Optional) */}
                            {currentConfig.crop && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-wide">形状裁切 (Crop)</label>
                                    <select value={cropShape} onChange={(e) => setCropShape(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white focus:border-google-blue outline-none">
                                        <option value="none">无 (None)</option>
                                        <option value="circle">圆形裁切 (Circle)</option>
                                        <option value="direction">方向性裁切 (Directional)</option>
                                    </select>
                                </div>
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
