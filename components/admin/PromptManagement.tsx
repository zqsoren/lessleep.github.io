import React, { useState, useEffect } from 'react';

// API 地址配置
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

interface Category {
    id: string;
    name: string;
    sort_order: number;
}

interface Subtype {
    id: string;
    category_id: string;
    name: string;
    icon: string;
    sort_order: number;
}

interface Style {
    id: string;
    subtype_id: string;
    name: string;
    description: string;
    preview: string;
    prompt_content?: string;
    sort_order: number;
}

interface AdvancedConfigGroup {
    id: string;
    label: string;
    type: 'text' | 'color' | 'checkbox' | 'radio' | 'select' | 'toggle';
    options?: { value: string; label: string; default?: boolean }[];
    default?: any;
}

interface AdvancedConfig {
    groups: AdvancedConfigGroup[];
}

const PromptManagement: React.FC = () => {
    // === STATE ===
    const [categories, setCategories] = useState<Category[]>([]);
    const [subtypes, setSubtypes] = useState<Subtype[]>([]);
    const [styles, setStyles] = useState<Style[]>([]);

    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedSubtype, setSelectedSubtype] = useState<Subtype | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);

    const [jsonEditorContent, setJsonEditorContent] = useState('');
    const [loading, setLoading] = useState(false);

    // === 高级设置状态 ===
    const [advancedMode, setAdvancedMode] = useState<'preview' | 'edit'>('preview');
    const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({ groups: [] });
    const [isPublished, setIsPublished] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null); // 新增状态消息
    const [showAddGroupModal, setShowAddGroupModal] = useState(false);

    // 添加组弹窗状态
    const [deleteItemTarget, setDeleteItemTarget] = useState<{ type: 'category' | 'subtype' | 'style', id: string, name?: string } | null>(null); // 新增：通用删除确认状态
    const [deleteConfirmGroupId, setDeleteConfirmGroupId] = useState<string | null>(null); // 新增：删除确认状态
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null); // 新增：正在编辑的组ID
    const [newGroupLabel, setNewGroupLabel] = useState('');
    const [newGroupType, setNewGroupType] = useState<AdvancedConfigGroup['type']>('text');
    const [newGroupDefault, setNewGroupDefault] = useState('');
    const [newGroupOptions, setNewGroupOptions] = useState<{ value: string; label: string; default?: boolean }[]>([]);
    const [newOptionLabel, setNewOptionLabel] = useState(''); // 新增：新选项标签输入
    const [newOptionValue, setNewOptionValue] = useState(''); // 新增：新选项值输入

    const [systemPromptTemplate, setSystemPromptTemplate] = useState(''); // 新增：Prompt 模板状态
    const [previewRequirement, setPreviewRequirement] = useState(''); // 新增：需求预览状态

    const DEFAULT_TEMPLATE = `Role: Architectural AI Assistant.

    Task: You are updating a configuration JSON for an image generator.
        Your goal is update the "Base JSON" based on the "User Requirements".
        
        --- INPUT DATA-- -
    1. Base JSON(Current Settings):
        {{BASE_JSON}}

2. User Requirements(HIGHEST PRIORITY):
- Aspect Ratio: {{ASPECT_RATIO}}
- User Description: "{{USER_DESC}}"
    - Detailed Specs(Colors / Layers):
        {{ADVANCED_SETTINGS}}

            --- INSTRUCTIONS-- -
                1. ** OVERWRITE ** any matching fields in Base JSON with values from "Detailed Specs". 
            (e.g.If Detailed Specs says "River Color: #FF0000", you MUST update the river color field in JSON to #FF0000).
        2. Keep the JSON structure valid.
        3. Do NOT wrap the output in markdown.Return ONLY the raw JSON string.`;

    // === EFFECTS ===
    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchSubtypes(selectedCategory.id);
            setSubtypes([]);
            setStyles([]);
            setSelectedSubtype(null);
            setSelectedStyle(null);
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedSubtype) {
            fetchStyles(selectedSubtype.id);
            setStyles([]);
            setSelectedStyle(null);
        }
    }, [selectedSubtype]);

    useEffect(() => {
        if (selectedStyle) {
            // Load prompt content into editor
            setJsonEditorContent(selectedStyle.prompt_content || '{}');
            // Load system prompt template
            setSystemPromptTemplate((selectedStyle as any).system_prompt_template || DEFAULT_TEMPLATE);
            // Load advanced settings
            fetchAdvancedSettings(selectedStyle.id);
        }
    }, [selectedStyle]);

    // === API CALLS ===
    const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
            'Authorization': `Bearer ${token}`
        };
        if (body) headers['Content-Type'] = 'application/json';

        try {
            const res = await fetch(`${API_URL}/api/admin/${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });
            if (!res.ok) throw new Error('API Error');
            return await res.json();
        } catch (error) {
            console.error(error);
            // alert('操作失败'); // Remove default alert to handle errors locally
            return null;
        }
    };

    const fetchCategories = async () => {
        setLoading(true);
        const data = await apiCall('categories');
        if (data) setCategories(data);
        setLoading(false);
    };

    const fetchSubtypes = async (catId: string) => {
        const data = await apiCall(`subtypes?category_id=${catId}`);
        if (data) setSubtypes(data);
    };

    const fetchStyles = async (subId: string) => {
        const data = await apiCall(`styles?subtype_id=${subId}`);
        if (data) setStyles(data);
    };

    // 获取高级设置
    const fetchAdvancedSettings = async (styleId: string) => {
        const data = await apiCall(`advanced-settings/${encodeURIComponent(styleId)}`);
        if (data) {
            setAdvancedConfig(data.config || { groups: [] });
            setIsPublished(data.isPublished || false);
            setStatusMsg(null); // 清除旧消息
        }
    };

    // calculate preview whenever advancedConfig changes
    useEffect(() => {
        if (!advancedConfig) return;
        let p = "";
        advancedConfig.groups.forEach(group => {
            let valStr = "";
            if (group.type === 'checkbox' && group.options) {
                const defaults = group.options.filter(o => o.default).map(o => o.value);
                if (defaults.length > 0) valStr = defaults.join(', ');
            } else if ((group.type === 'radio' || group.type === 'select') && group.options) {
                const def = group.options.find(o => o.default);
                if (def) valStr = def.value;
            } else if (group.type === 'toggle') {
                valStr = group.default ? '开启' : '关闭';
            } else {
                valStr = group.default || '';
            }

            if (valStr) p += `${group.label}: ${valStr}\n`;
        });
        if (!p) p = "使用默认配置。";
        setPreviewRequirement(p);
    }, [advancedConfig]);

    const handleSaveTemplate = async () => {
        if (!selectedStyle) return;
        try {
            await apiCall(`styles/${selectedStyle.id}`, 'PUT', {
                system_prompt_template: systemPromptTemplate
            });
            alert('Prompt 模板已保存！');
        } catch (e) {
            alert('保存失败');
        }
    };

    // 保存高级设置
    const saveAdvancedSettings = async () => {
        if (!selectedStyle) return;
        const data = await apiCall(`advanced-settings/${encodeURIComponent(selectedStyle.id)}`, 'PUT', {
            config: advancedConfig
        });
        if (data) {
            alert('配置已保存！');
        }
    };

    // 发布高级设置
    const publishAdvancedSettings = async (e?: React.MouseEvent) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!selectedStyle) return;

        setStatusMsg({ type: 'info', text: '正在发布... (1/2 保存)' });

        try {
            // 1. 先保存当前配置 (Auto-save before publish)
            const saveUrl = `advanced-settings/${encodeURIComponent(selectedStyle.id)}`;
            // alert(`[Debug] 鍑嗗璋冪敤淇濆瓨鎺ュ彛: ${saveUrl}`);

            const saveRes = await apiCall(saveUrl, 'PUT', {
                config: advancedConfig
            });



            if (!saveRes) {
                const msg = '自动保存失败，无法继续发布。请检查网络。';
                setStatusMsg({ type: 'error', text: msg });

                return;
            }

            setStatusMsg({ type: 'info', text: '正在发布... (2/2 发布)' });

            // 2. 再执行发布
            const pubUrl = `advanced-settings/${encodeURIComponent(selectedStyle.id)}/publish`;
            // alert(`[Debug] 准备调用发布接口: ${pubUrl}`);

            const res = await apiCall(pubUrl, 'POST');



            if (res) {
                const msg = '发布成功！配置已更新并上线。';
                setStatusMsg({ type: 'success', text: msg });

                setIsPublished(true);
                setTimeout(() => setStatusMsg(null), 3000);
            } else {
                const msg = '发布接口调用失败，请重试。';
                setStatusMsg({ type: 'error', text: msg });

            }
        } catch (error: any) {
            console.error(error);
            const msg = '发布过程发生详情错误: ' + error.message;
            setStatusMsg({ type: 'error', text: msg });

        }
    };

    // === HANDLERS ===

    // --- Category Handlers ---
    const handleAddCategory = async () => {
        const name = prompt('请输入新分类名称 (Level 1):');
        if (!name) return;
        const id = prompt('请输入分类ID (英文,如"architecture"):');
        if (!id) return;

        const res = await apiCall('categories', 'POST', { id, name });
        if (res) fetchCategories();
    };

    const handleDeleteCategory = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setDeleteItemTarget({ type: 'category', id });
    };

    // --- Subtype Handlers ---
    const handleAddSubtype = async () => {
        if (!selectedCategory) return;
        const name = prompt('请输入子类名称 (Level 2):');
        if (!name) return;
        const id = prompt('请输入子类ID (英文,如"site_plan"):');
        if (!id) return;
        const icon = prompt('请输入FontAwesome图标代码 (如"fa-building"):') || 'fa-folder';

        const res = await apiCall('subtypes', 'POST', {
            id,
            category_id: selectedCategory.id,
            name,
            icon
        });
        if (res) fetchSubtypes(selectedCategory.id);
    };

    const handleDeleteSubtype = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setDeleteItemTarget({ type: 'subtype', id });
    };

    // --- Style Handlers ---
    const handleAddStyle = async () => {
        if (!selectedSubtype) return;
        const name = prompt('请输入风格名称 (Level 3):');
        if (!name) return;
        const id = prompt('请输入风格ID (唯一,如"site_iso_01"):');
        if (!id) return;

        const res = await apiCall('styles', 'POST', {
            id,
            subtype_id: selectedSubtype.id,
            name,
            description: '新风格描述',
            preview: 'https://via.placeholder.com/300'
        });
        if (res) fetchStyles(selectedSubtype.id);
    };

    const handleDeleteStyle = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setDeleteItemTarget({ type: 'style', id });
    };

    const confirmDeleteItem = async () => {
        if (!deleteItemTarget) return;
        const { type, id } = deleteItemTarget;

        try {
            if (type === 'category') {
                await apiCall(`categories/${id}`, 'DELETE');
                fetchCategories();
                if (selectedCategory?.id === id) setSelectedCategory(null);
            } else if (type === 'subtype') {
                await apiCall(`subtypes/${id}`, 'DELETE');
                if (selectedCategory) fetchSubtypes(selectedCategory.id);
                if (selectedSubtype?.id === id) setSelectedSubtype(null);
            } else if (type === 'style') {
                await apiCall(`styles/${id}`, 'DELETE');
                if (selectedSubtype) fetchStyles(selectedSubtype.id);
                if (selectedStyle?.id === id) setSelectedStyle(null);
            }
            setStatusMsg({ type: 'success', text: '鍒犻櫎鎴愬姛' });
            setTimeout(() => setStatusMsg(null), 2000);
        } catch (error) {
            console.error('Delete failed:', error);
            setStatusMsg({ type: 'error', text: '鍒犻櫎澶辫触锛岃閲嶈瘯' });
        } finally {
            setDeleteItemTarget(null);
        }
    };

    // --- Editor Handler ---
    // --- Editor Handler ---
    const handleSaveJson = async () => {
        if (!selectedStyle) return;

        // 用户要求：强制移除 JSON 校验，哪怕格式错误也允许保存
        const content = jsonEditorContent;

        try {
            await apiCall(`styles/${selectedStyle.id}`, 'PUT', {
                prompt_content: content
            });
            alert('Base Content 已保存 (未校验 JSON 格式)！');
            fetchStyles(selectedStyle.subtype_id);
        } catch (e: any) {
            console.error("Save Error:", e);
            alert(`保存失败: ${e.message}`);
        }
    };

    // --- 高级设置 Handlers ---
    const handleEditGroup = (group: AdvancedConfigGroup) => {
        setEditingGroupId(group.id);
        setNewGroupLabel(group.label);
        setNewGroupType(group.type);
        setNewGroupDefault(group.default || '');
        setNewGroupOptions(group.options || []);
        setShowAddGroupModal(true);
    };

    const handleSaveGroup = () => {
        if (!newGroupLabel) {
            alert('请输入组标签');
            return;
        }

        const newGroup: AdvancedConfigGroup = {
            id: editingGroupId || `group_${Date.now()}`,
            label: newGroupLabel,
            type: newGroupType,
        };

        // 根据类型添加额外字段
        if (['radio', 'checkbox', 'select'].includes(newGroupType)) {
            newGroup.options = newGroupOptions.length > 0 ? newGroupOptions : [{ value: 'option1', label: '选项1' }];
        } else if (newGroupType === 'color') {
            newGroup.default = newGroupDefault || '#000000';
        } else if (newGroupType === 'toggle') {
            newGroup.default = newGroupDefault === 'true' || newGroupDefault === true; // Handle potential string/bool mismatch
        } else {
            newGroup.default = newGroupDefault;
        }

        if (editingGroupId) {
            // Update existing
            setAdvancedConfig({
                groups: advancedConfig.groups.map(g => g.id === editingGroupId ? newGroup : g)
            });
        } else {
            // Create new
            setAdvancedConfig({
                groups: [...advancedConfig.groups, newGroup]
            });
        }

        // 重置弹窗
        setEditingGroupId(null);
        setNewGroupLabel('');
        setNewGroupType('text');
        setNewGroupDefault('');
        setNewGroupOptions([]);
        setNewOptionLabel('');
        setNewOptionValue('');
        setShowAddGroupModal(false);
    };

    const handleDeleteGroup = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setDeleteConfirmGroupId(groupId);
    };

    const confirmDeleteGroup = () => {
        if (!deleteConfirmGroupId) return;
        setAdvancedConfig({
            groups: advancedConfig.groups.filter(g => g.id !== deleteConfirmGroupId)
        });
        setDeleteConfirmGroupId(null);
    };

    const handleAddOption = () => {
        if (!newOptionLabel || !newOptionValue) {
            alert('请输入选项标签和值');
            return;
        }
        setNewGroupOptions([...newGroupOptions, { value: newOptionValue, label: newOptionLabel, default: false }]);
        setNewOptionLabel('');
        setNewOptionValue('');
    };

    const handleToggleOptionDefault = (index: number) => {
        const updatedOptions = [...newGroupOptions];
        const currentOption = updatedOptions[index];

        if (newGroupType === 'checkbox') {
            // Checkbox: 允许对应多选
            currentOption.default = !currentOption.default;
        } else {
            // Radio/Select: 单选，互斥
            const newOptions = updatedOptions.map((opt, i) => {
                const newOpt = { ...opt }; // Shallow copy item
                // 对于 radio/select，支持取消选中当前项，实现"无默认值"的状态
                // 当前逻辑：点击未选中项 -> 选中；点击已选中项 -> 取消选中
                if (i === index) {
                    newOpt.default = !newOpt.default;
                } else {
                    newOpt.default = false;
                }
                return newOpt;
            });
            setNewGroupOptions(newOptions);
            return; // Return early since we set state
        }
    };

    const renderGroupPreview = (group: AdvancedConfigGroup) => {
        switch (group.type) {
            case 'radio':
            case 'checkbox':
                return (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {group.options?.map((opt, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-md text-xs bg-gray-100 border border-gray-200">
                                {opt.label}
                            </span>
                        ))}
                    </div>
                );
            case 'color':
                return (
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-8 h-8 rounded border border-gray-200" style={{ backgroundColor: group.default }}></div>
                        <span className="text-xs text-gray-500 font-mono">{group.default}</span>
                    </div>
                );
            case 'toggle':
                return <span className="text-xs text-gray-500 mt-2 block">布尔值开关</span>;
            case 'select':
                return (
                    <select disabled className="mt-2 px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50">
                        {group.options?.map((opt, idx) => (
                            <option key={idx}>{opt.label}</option>
                        ))}
                    </select>
                );
            default:
                return <input readOnly value={group.default || ''} className="mt-2 px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 w-full" />;
        }
    };

    return (
        <div className="p-6 h-full flex flex-col overflow-auto">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">提示词层级管理</h1>
                    <p className="text-sm text-slate-500">管理 Generator 的分类树、Base JSON 和高级设置</p>
                </div>
            </div>

            <div className="flex gap-4 mb-4" style={{ height: '400px' }}>

                {/* COLUMN 1: CATEGORIES */}
                <div className="w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <span className="font-bold text-slate-700">1. 一级分类</span>
                        <button onClick={handleAddCategory} className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"><i className="fa-solid fa-plus text-xs"></i></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading && <div className="text-center p-4 text-xs">加载中...</div>}
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat)}
                                className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-all ${selectedCategory?.id === cat.id ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm border' : 'hover:bg-gray-50 border border-transparent'}`}
                            >
                                <span className="font-medium text-sm">{cat.name}</span>
                                <button type="button" onClick={(e) => handleDeleteCategory(cat.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><i className="fa-solid fa-trash text-xs"></i></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMN 2: SUBTYPES */}
                <div className="w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <span className="font-bold text-slate-700">2. 二级选项</span>
                        {selectedCategory && (
                            <button onClick={handleAddSubtype} className="w-6 h-6 rounded bg-green-500 text-white flex items-center justify-center hover:bg-green-600"><i className="fa-solid fa-plus text-xs"></i></button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {!selectedCategory ? (
                            <div className="text-center p-8 text-gray-400 text-xs">请先选择一级分类</div>
                        ) : subtypes.length === 0 ? (
                            <div className="text-center p-8 text-gray-400 text-xs">暂无二级选项</div>
                        ) : (
                            subtypes.map(sub => (
                                <div
                                    key={sub.id}
                                    onClick={() => setSelectedSubtype(sub)}
                                    className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-all ${selectedSubtype?.id === sub.id ? 'bg-green-50 border-green-200 text-green-700 shadow-sm border' : 'hover:bg-gray-50 border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <i className={`fa-solid ${sub.icon} w-4 text-xs opacity-70`}></i>
                                        <span className="font-medium text-sm">{sub.name}</span>
                                    </div>
                                    <button type="button" onClick={(e) => handleDeleteSubtype(sub.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><i className="fa-solid fa-trash text-xs"></i></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* COLUMN 3: STYLES */}
                <div className="w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <span className="font-bold text-slate-700">3. 三级选项 (Style)</span>
                        {selectedSubtype && (
                            <button onClick={handleAddStyle} className="w-6 h-6 rounded bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600"><i className="fa-solid fa-plus text-xs"></i></button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {!selectedSubtype ? (
                            <div className="text-center p-8 text-gray-400 text-xs">请先选择二级选项</div>
                        ) : styles.length === 0 ? (
                            <div className="text-center p-8 text-gray-400 text-xs">暂无三级选项</div>
                        ) : (
                            styles.map(style => (
                                <div
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style)}
                                    className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-all ${selectedStyle?.id === style.id ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm border' : 'hover:bg-gray-50 border border-transparent'}`}
                                >
                                    <span className="font-medium text-sm truncate">{style.name}</span>
                                    <button type="button" onClick={(e) => handleDeleteStyle(style.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><i className="fa-solid fa-trash text-xs"></i></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* COLUMN 4: BASE JSON EDITOR */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                        <span className="font-bold text-slate-700">Base JSON 编辑器</span>
                    </div>
                    <div className="flex-1 p-0 flex flex-col relative">
                        {!selectedStyle ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                                请选择一个三级选项进行编辑
                            </div>
                        ) : (
                            <>
                                <textarea
                                    className="flex-1 w-full bg-[#1e1e1e] text-green-400 font-mono text-xs p-4 resize-none outline-none"
                                    value={jsonEditorContent}
                                    onChange={(e) => setJsonEditorContent(e.target.value)}
                                    spellCheck="false"
                                ></textarea>
                                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                                    <button onClick={() => setJsonEditorContent(selectedStyle.prompt_content || '{}')} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">重置</button>
                                    <button onClick={handleSaveJson} className="px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 shadow-md">保存 Base JSON</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

            </div>

            {/* === 高级设置 & Prompt 管理区域 === */}
            {selectedStyle && (
                <div className="mt-4 flex gap-4 h-[600px]">
                    {/* Left: Advanced Settings Manager */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col min-w-0">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <i className="fa-solid fa-sliders text-blue-500"></i> 高级设置管理
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">配置 Generator 页面的高级设置选项</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAdvancedMode('preview')}
                                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${advancedMode === 'preview' ? 'bg-gray-200 text-gray-800' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        <i className="fa-solid fa-eye mr-1"></i> 预览
                                    </button>
                                    <button
                                        onClick={() => setAdvancedMode('edit')}
                                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${advancedMode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        <i className="fa-solid fa-pen mr-1"></i> 修改
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 配置组列表 */}
                        <div className="space-y-3 mb-4 flex-1 overflow-y-auto">
                            {advancedConfig.groups.length === 0 ? (
                                <div className="text-center p-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                    暂无高级设置配置，点击"添加组"开始配置
                                </div>
                            ) : (
                                advancedConfig.groups.map((group) => (
                                    <div key={group.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative group/item">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-sm text-slate-700">{group.label}</h3>
                                                <span className="text-xs text-gray-400 uppercase">{group.type}</span>
                                                {renderGroupPreview(group)}
                                            </div>
                                            {advancedMode === 'edit' && (
                                                <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditGroup(group)}
                                                        className="text-blue-400 hover:text-blue-600"
                                                    >
                                                        <i className="fa-solid fa-pen text-sm"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDeleteGroup(group.id, e)}
                                                        className="text-red-400 hover:text-red-600"
                                                    >
                                                        <i className="fa-solid fa-trash text-sm"></i>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-3">
                                {/* 状态消息显示区 (底部) */}
                                {statusMsg && (
                                    <div className={`text-xs px-3 py-1 rounded-full font-bold ${statusMsg.type === 'success' ? 'bg-green-100 text-green-700' :
                                        statusMsg.type === 'error' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {statusMsg.type === 'success' && <i className="fa-solid fa-check mr-1"></i>}
                                        {statusMsg.type === 'error' && <i className="fa-solid fa-triangle-exclamation mr-1"></i>}
                                        {statusMsg.type === 'info' && <i className="fa-solid fa-spinner fa-spin mr-1"></i>}
                                        {statusMsg.text}
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setEditingGroupId(null);
                                        setNewGroupLabel('');
                                        setNewGroupType('text');
                                        setNewGroupDefault('');
                                        setNewGroupOptions([]);
                                        setShowAddGroupModal(true);
                                    }}
                                    className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600"
                                >
                                    <i className="fa-solid fa-plus mr-1"></i> 添加组
                                </button>
                            </div>
                            <div className="flex gap-3">
                                {isPublished && <span className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center"><i className="fa-solid fa-check-circle mr-1"></i> 已发布</span>}
                                <button
                                    type="button"
                                    onClick={saveAdvancedSettings}
                                    disabled={advancedMode === 'preview'}
                                    className="px-6 py-2 bg-gray-600 text-white text-sm font-bold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className="fa-solid fa-save mr-1"></i> 保存草稿
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => publishAdvancedSettings(e)}
                                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                                >
                                    <i className="fa-solid fa-rocket mr-1"></i> 发布
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Preview */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col min-w-0">
                        <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-list-check text-green-500"></i> 需求预览 (Preview)
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">基于当前默认选项生成的自然语言描述</p>
                        <textarea
                            readOnly
                            className="flex-1 w-full bg-gray-50 text-xs p-3 rounded-lg border border-gray-200 resize-none outline-none text-gray-600"
                            value={previewRequirement}
                        ></textarea>
                    </div>

                    {/* Right: Core Prompt Template */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col min-w-0">
                        <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-code text-purple-500"></i> 核心 Prompt 模板
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">支持变量: <code>{'{{BASE_JSON}}'}</code>, <code>{'{{USER_DESC}}'}</code>, <code>{'{{ASPECT_RATIO}}'}</code>, <code>{'{{ADVANCED_SETTINGS}}'}</code></p>
                        <textarea
                            className="flex-1 w-full bg-[#1e1e1e] text-yellow-400 font-mono text-xs p-3 rounded-lg resize-none outline-none mb-3"
                            value={systemPromptTemplate}
                            onChange={(e) => setSystemPromptTemplate(e.target.value)}
                            spellCheck="false"
                        ></textarea>
                        <button
                            onClick={handleSaveTemplate}
                            className="w-full py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700"
                        >
                            保存模板配置
                        </button>
                    </div>
                </div>
            )}

            {/* 添加组弹窗 */}
            {showAddGroupModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold">{editingGroupId ? '编辑配置组' : '添加配置组'}</h3>
                            <button onClick={() => setShowAddGroupModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">组标签</label>
                                <input
                                    type="text"
                                    value={newGroupLabel}
                                    onChange={(e) => setNewGroupLabel(e.target.value)}
                                    placeholder="例如：图片比例"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">选项类型</label>
                                <select
                                    value={newGroupType}
                                    onChange={(e) => setNewGroupType(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                >
                                    <option value="text">文本框</option>
                                    <option value="color">取色器</option>
                                    <option value="checkbox">复选框</option>
                                    <option value="radio">单选按钮</option>
                                    <option value="select">下拉框</option>
                                    <option value="toggle">拨动开关</option>
                                </select>
                            </div>

                            {/* 根据类型显示不同的配置 */}
                            {['radio', 'checkbox', 'select'].includes(newGroupType) ? (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">选项列表</label>
                                    <div className="space-y-2 mb-2">
                                        {newGroupOptions.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2 mr-2 border-r border-gray-200 pr-3">
                                                    <input
                                                        type={newGroupType === 'checkbox' ? 'checkbox' : 'radio'}
                                                        name="option_default_group"
                                                        checked={!!opt.default}
                                                        onChange={() => handleToggleOptionDefault(idx)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                        title="设为默认选中"
                                                    />
                                                    <span className="text-xs text-slate-400">默认</span>
                                                </div>
                                                <span className="flex-1 text-sm">{opt.label} <span className="text-xs text-gray-400 font-mono">({opt.value})</span></span>
                                                <button
                                                    onClick={() => setNewGroupOptions(newGroupOptions.filter((_, i) => i !== idx))}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <i className="fa-solid fa-trash text-xs"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            placeholder="选项标签 (Label)"
                                            value={newOptionLabel}
                                            onChange={(e) => setNewOptionLabel(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="选项值 (Value)"
                                            value={newOptionValue}
                                            onChange={(e) => setNewOptionValue(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none"
                                        />
                                        <button
                                            onClick={handleAddOption}
                                            className="px-3 py-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 text-xs font-bold"
                                        >
                                            <i className="fa-solid fa-plus"></i> 添加
                                        </button>
                                    </div>
                                </div>
                            ) : newGroupType === 'color' ? (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">默认颜色</label>
                                    <input
                                        type="color"
                                        value={newGroupDefault || '#000000'}
                                        onChange={(e) => setNewGroupDefault(e.target.value)}
                                        className="w-20 h-10 rounded cursor-pointer"
                                    />
                                </div>
                            ) : newGroupType === 'text' ? (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">默认值</label>
                                    <input
                                        type="text"
                                        value={newGroupDefault}
                                        onChange={(e) => setNewGroupDefault(e.target.value)}
                                        placeholder="默认文本"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                    />
                                </div>
                            ) : null}
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddGroupModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveGroup}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                {editingGroupId ? '更新' : '添加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 通用删除确认弹窗 (Categories/Subtypes/Styles) */}
            {deleteItemTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                            <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                            <h3 className="text-lg font-bold">确认删除</h3>
                        </div>
                        <p className="text-gray-600 mb-6 text-sm">
                            {deleteItemTarget.type === 'category' ? '确定删除此分类吗？包含的所有子类也将无法访问。' :
                                deleteItemTarget.type === 'subtype' ? '确定删除此子类吗？' :
                                    '确定删除此风格吗？'}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteItemTarget(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteItem}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-bold shadow-md"
                            >
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 删除确认弹窗 (高级配置组) */}
            {deleteConfirmGroupId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                            <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                            <h3 className="text-lg font-bold">确认删除</h3>
                        </div>
                        <p className="text-gray-600 mb-6 text-sm">
                            确定要删除这个配置组吗？<br />
                            操作后需要点击<b>"保存草稿"</b>或<b>"发布"</b>才能永久生效。
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmGroupId(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteGroup}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-bold shadow-md"
                            >
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PromptManagement;
