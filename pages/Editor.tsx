import React, { useState, useEffect, useRef } from 'react';
import { Canvas, Rect, Circle, IText, Image as FabricImage, ActiveSelection, Point, Group, Path, Line } from 'fabric';
import { EditorContext } from '../App';

interface EditorProps {
   onBack: () => void;
   context?: EditorContext | null;
}

type Tool = 'select' | 'hand' | 'text' | 'image' | 'shape' | 'artboard';
type SideTab = 'templates' | 'elements' | 'text' | 'projects' | 'layers';

const MOCK_PROJECT_ASSETS = [
   { id: 1, type: 'img', src: 'https://images.unsplash.com/photo-1543615674-325b8ae78dfb?auto=format&fit=crop&w=300&q=80', name: '场地现状_v1' },
   { id: 2, type: 'img', src: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=300&q=80', name: '热环境分析' },
   { id: 3, type: 'img', src: 'https://images.unsplash.com/photo-1486744849731-ff10101d7d5a?auto=format&fit=crop&w=300&q=80', name: '流线分析_拼贴' },
   { id: 4, type: 'img', src: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=300&q=80', name: '剖透视_竞赛风' },
];

const Editor: React.FC<EditorProps> = ({ onBack, context }) => {
   // === STATE ===
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const fabricCanvas = useRef<Canvas | null>(null);
   const containerRef = useRef<HTMLDivElement>(null);

   const [activeTool, setActiveTool] = useState<Tool>('select');
   const [activeSideTab, setActiveSideTab] = useState<SideTab>('projects');
   const [zoom, setZoom] = useState(100);

   const [projectAssets, setProjectAssets] = useState(MOCK_PROJECT_ASSETS);

   // Load Project Assets
   useEffect(() => {
      if (context?.projectId) {
         try {
            const projects = JSON.parse(localStorage.getItem('archAiProjects') || '[]');
            const currentProject = projects.find((p: any) => p.id === context.projectId);
            if (currentProject && currentProject.analysis && currentProject.analysis.length > 0) {
               // Convert to asset format
               const assets = currentProject.analysis.map((a: any) => ({
                  id: a.id || Date.now() + Math.random(),
                  type: 'img',
                  src: a.src,
                  name: a.prompt || '未命名图片'
               }));
               setProjectAssets((prev) => [...assets, ...MOCK_PROJECT_ASSETS]);
            }
         } catch (e) {
            console.error("Error loading project assets", e);
         }
      }
   }, [context]);

   // Selection State
   const [selectedObject, setSelectedObject] = useState<any>(null); // Fabric object
   const [selectedType, setSelectedType] = useState<'none' | 'activeSelection' | 'group' | 'text' | 'image' | 'rect' | 'circle' | 'path'>('none');

   // Properties State (synced with selection)
   const [props, setProps] = useState({
      fill: '#cccccc',
      opacity: 1,
      stroke: '#000000',
      strokeWidth: 0,
      fontSize: 20,
      fontFamily: 'Arial',
      text: '',
   });

   // History State
   const [history, setHistory] = useState<string[]>([]);
   const [historyIndex, setHistoryIndex] = useState(-1);
   const isHistoryProcessing = useRef(false); // Use ref to avoid re-renders impacting logic or stale closures in callbacks

   // Calculate Display Title
   let displayTitle = "未命名项目 - 新建排版";
   if (context) {
      if (context.type === 'new_project') displayTitle = "未命名新项目 - 初始排版";
      else if (context.type === 'new_layout_in_project') displayTitle = `${context.projectName} - 新建排版`;
      else if (context.type === 'existing_layout') displayTitle = `${context.projectName} - ${context.layoutName}`;
   }

   // === CANVAS INTERACTION (Zoom & Pan) ===

   // Sync Zoom State -> Fabric Canvas
   useEffect(() => {
      if (!fabricCanvas.current) return;
      fabricCanvas.current.setZoom(zoom / 100);
      fabricCanvas.current.renderAll();
   }, [zoom]);

   // Handle Tool Changes (Cursor)
   useEffect(() => {
      if (!fabricCanvas.current) return;
      if (activeTool === 'hand') {
         fabricCanvas.current.defaultCursor = 'grab';
         fabricCanvas.current.hoverCursor = 'grab';
         fabricCanvas.current.selection = false; // Disable selection box
         fabricCanvas.current.discardActiveObject();
         fabricCanvas.current.renderAll();
      } else {
         fabricCanvas.current.defaultCursor = 'default';
         fabricCanvas.current.hoverCursor = 'move';
         fabricCanvas.current.selection = true;
      }
      // Re-add event listeners if needed explicitly for tools
   }, [activeTool]);

   // === INITIALIZATION & EVENTS ===
   useEffect(() => {
      if (!canvasRef.current || !containerRef.current) return;

      // 1. Init Canvas
      const canvas = new Canvas(canvasRef.current, {
         width: containerRef.current.clientWidth,
         height: containerRef.current.clientHeight,
         backgroundColor: '#f3f4f6',
         selection: true,
         preserveObjectStacking: true,
      });

      fabricCanvas.current = canvas;

      // 2. Add "Artboard" (White Paper)
      const artboard = new Rect({
         left: (canvas.width! - 841) / 2,
         top: 50,
         width: 841,
         height: 1189,
         fill: 'white',
         selectable: false,
         evented: false,
         hoverCursor: 'default',
         shadow: { color: 'rgba(0,0,0,0.1)', blur: 20, offsetX: 0, offsetY: 10 } as any
      });
      canvas.add(artboard);
      canvas.centerObject(artboard);
      artboard.setCoords();

      // 3. Pan & Zoom Variables
      let isDragging = false;
      let lastPosX = 0;
      let lastPosY = 0;

      // 4. Input Events
      canvas.on('mouse:down', (opt) => {
         const evt = opt.e as any;
         // Check if Spacebar is held (via boolean or other means) OR Hand tool is active.
         // 'code' property might not exist on MouseEvent directly in TS types without casting to any or KeyboardEvent (if it was key event).
         // But here we rely on 'altKey' or just the hand tool mode.
         const isSpace = evt.code === 'Space';

         if (!canvas.selection || evt.altKey || isSpace) {
            isDragging = true;
            canvas.selection = false;
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
            canvas.defaultCursor = 'grabbing';
            canvas.setCursor('grabbing');
         }
      });

      canvas.on('mouse:move', (opt) => {
         if (isDragging) {
            const evt = opt.e as any;
            const vpt = canvas.viewportTransform!;
            vpt[4] += evt.clientX - lastPosX;
            vpt[5] += evt.clientY - lastPosY;
            canvas.requestRenderAll();
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
         }
      });

      canvas.on('mouse:up', () => {
         if (isDragging) {
            isDragging = false;
            if (canvas.defaultCursor === 'grab') {
               canvas.setCursor('grab');
            } else {
               canvas.selection = true;
               canvas.defaultCursor = 'default';
               canvas.setCursor('default');
            }
         }
      });

      canvas.on('mouse:wheel', (opt) => {
         const delta = opt.e.deltaY;
         let zoom = canvas.getZoom();
         zoom *= 0.999 ** delta;
         if (zoom > 2) zoom = 2;
         if (zoom < 0.1) zoom = 0.1;

         // Center zoom at mouse point
         canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);

         opt.e.preventDefault();
         opt.e.stopPropagation();
      });

      // 5. Selection Events
      const updateSelection = () => {
         const active = canvas.getActiveObject();
         if (active) {
            setSelectedObject(active);
            setSelectedType(active.type as any);
            setProps({
               fill: active.get('fill') as string || '#000000',
               opacity: active.get('opacity') || 1,
               stroke: active.get('stroke') as string || '#000000',
               strokeWidth: active.get('strokeWidth') || 0,
               fontSize: (active as any).fontSize || 20,
               fontFamily: (active as any).fontFamily || 'Arial',
               text: (active as any).text || '',
            });
         } else {
            setSelectedObject(null);
            setSelectedType('none');
         }
      };

      canvas.on('selection:created', updateSelection);
      canvas.on('selection:updated', updateSelection);
      canvas.on('selection:cleared', updateSelection);
      canvas.on('object:modified', updateSelection);

      // 6. Resize Observer
      const ro = new ResizeObserver(() => {
         if (!containerRef.current || !fabricCanvas.current) return;
         fabricCanvas.current.setDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
         });
      });
      ro.observe(containerRef.current);

      return () => {
         ro.disconnect();
         canvas.dispose();
      };
   }, []);

   // === ACTIONS ===

   // === HISTORY ACTIONS ===
   const saveHistory = () => {
      if (!fabricCanvas.current || isHistoryProcessing.current) return;

      // Save minimal state needed? Or full. toJSON() allows properties spec.
      // We should include specific properties we use.
      const json = JSON.stringify(fabricCanvas.current.toJSON());

      setHistory(prev => {
         const newHistory = prev.slice(0, historyIndex + 1);
         newHistory.push(json); // Limit history size?
         if (newHistory.length > 50) newHistory.shift();
         return newHistory;
      });
      setHistoryIndex(prev => {
         const newLen = Math.min(prev + 1, 49); // Adjust if shifted
         // Actually if we shift, index shifts too? Complicated. 
         // Let's keep it simple: no limit for now, or just limit length.
         return prev + 1;
      });
   };

   const undo = () => {
      if (historyIndex <= 0) return;
      isHistoryProcessing.current = true;
      const newIndex = historyIndex - 1;
      const json = history[newIndex];

      fabricCanvas.current?.loadFromJSON(JSON.parse(json)).then(() => {
         fabricCanvas.current?.renderAll();
         isHistoryProcessing.current = false;
         setHistoryIndex(newIndex);
      });
   };

   const redo = () => {
      if (historyIndex >= history.length - 1) return;
      isHistoryProcessing.current = true;
      const newIndex = historyIndex + 1;
      const json = history[newIndex];

      fabricCanvas.current?.loadFromJSON(JSON.parse(json)).then(() => {
         fabricCanvas.current?.renderAll();
         isHistoryProcessing.current = false;
         setHistoryIndex(newIndex);
      });
   };

   // History Event Listeners & Keyboard Shortcuts
   useEffect(() => {
      if (!fabricCanvas.current) return;
      const canvas = fabricCanvas.current;

      const handleSave = () => saveHistory();

      canvas.on('object:modified', handleSave);
      canvas.on('object:added', handleSave);
      canvas.on('object:removed', handleSave);

      // Keyboard Shortcuts (Ctrl+Z, Ctrl+Shift+Z)
      const handleKeyDown = (e: KeyboardEvent) => {
         if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
               redo();
            } else {
               undo();
            }
         }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
         canvas.off('object:modified', handleSave);
         canvas.off('object:added', handleSave);
         canvas.off('object:removed', handleSave);
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, [historyIndex, history]); // Dependencies needed for undo/redo closures?
   // Actually undo/redo functions capture state from scope? 
   // 'undo' uses 'historyIndex' and 'history' from closure.
   // If I don't put them in deps, 'undo' called by keydown will use STALE historyIndex from first render!
   // So I MUST put [historyIndex, history] in deps.
   // But that means I detach/attach listeners on every history change.
   // That's acceptable.

   // Add Shape
   const addShape = (type: 'rect' | 'circle') => {
      if (!fabricCanvas.current) return;

      let shape;
      const center = fabricCanvas.current.getCenter();

      if (type === 'rect') {
         shape = new Rect({
            left: center.left, top: center.top,
            fill: '#e2e8f0', width: 100, height: 100,
            rx: 0, ry: 0
         });
      } else {
         shape = new Circle({
            left: center.left, top: center.top,
            fill: '#e2e8f0', radius: 50
         });
      }

      fabricCanvas.current.add(shape);
      fabricCanvas.current.setActiveObject(shape);
      fabricCanvas.current.renderAll();
   };

   // Add Text
   const addText = () => {
      if (!fabricCanvas.current) return;
      const center = fabricCanvas.current.getCenter();
      const text = new IText('点击编辑文本', {
         left: center.left, top: center.top,
         fontFamily: 'Arial',
         fill: '#333333',
         fontSize: 24
      });
      fabricCanvas.current.add(text);
      fabricCanvas.current.setActiveObject(text);
      fabricCanvas.current.renderAll();
   };

   // Add Image from URL
   const addImage = async (url: string) => {
      if (!fabricCanvas.current) return;
      try {
         const img = await FabricImage.fromURL(url, {
            crossOrigin: 'anonymous',
         });
         // Fit to a reasonable size
         img.scaleToWidth(300);
         const center = fabricCanvas.current.getCenter();
         img.set({ left: center.left, top: center.top });

         fabricCanvas.current.add(img);
         fabricCanvas.current.setActiveObject(img);
         fabricCanvas.current.renderAll();

      } catch (err) {
         console.error("Failed to load image", err);
         alert("无法加载图片，可能是跨域问题");
      }
   };

   // Add Vector Overlay (North Arrow, Scale)
   const addOverlay = (type: 'north_arrow' | 'scale_bar') => {
      if (!fabricCanvas.current) return;
      const center = fabricCanvas.current.getCenter();

      if (type === 'north_arrow') {
         const northText = new IText('N', { fontSize: 20, fontFamily: 'serif', originX: 'center', top: -35, left: 0 });
         const circle = new Circle({ radius: 24, stroke: '#333', strokeWidth: 2, fill: 'transparent', originX: 'center', originY: 'center', top: 0, left: 0 });
         const arrow = new Path('M 0 -20 L 6 0 L 0 20 L -6 0 z', { fill: '#333', stroke: '#333', originX: 'center', originY: 'center' });

         const group = new Group([circle, arrow, northText], {
            left: center.left, top: center.top,
            originX: 'center', originY: 'center'
         });
         fabricCanvas.current.add(group);
         fabricCanvas.current.setActiveObject(group);
      } else if (type === 'scale_bar') {
         // Simple Scale Bar
         const line = new Rect({ width: 200, height: 2, fill: '#000', left: 0, top: 0 });
         const tick1 = new Rect({ width: 2, height: 10, fill: '#000', left: 0, top: -4 });
         const tick2 = new Rect({ width: 2, height: 10, fill: '#000', left: 100, top: -4 });
         const tick3 = new Rect({ width: 2, height: 10, fill: '#000', left: 200, top: -4 });

         const t0 = new IText('0m', { fontSize: 12, left: -10, top: 10 });
         const t50 = new IText('50m', { fontSize: 12, left: 90, top: 10 });
         const t100 = new IText('100m', { fontSize: 12, left: 190, top: 10 });

         const group = new Group([line, tick1, tick2, tick3, t0, t50, t100], {
            left: center.left, top: center.top,
            originX: 'center', originY: 'center'
         });
         fabricCanvas.current.add(group);
         fabricCanvas.current.setActiveObject(group);
      }
      fabricCanvas.current.renderAll();
   };

   // Add Smart Template
   const addTemplate = (type: 'grid_2x2' | 'sidebar_right') => {
      if (!fabricCanvas.current) return;
      // Clear canvas content first? Or add to new page? Let's add to current for now.
      // fabricCanvas.current.clear(); // Too destructive for now.

      const startX = 100;
      const startY = 100;

      if (type === 'grid_2x2') {
         const size = 300;
         const gap = 20;

         [
            { x: 0, y: 0 },
            { x: size + gap, y: 0 },
            { x: 0, y: size + gap },
            { x: size + gap, y: size + gap }
         ].forEach(pos => {
            const rect = new Rect({
               left: startX + pos.x, top: startY + pos.y,
               width: size, height: size,
               fill: '#f0f2f5',
               stroke: '#cbd5e1',
               strokeWidth: 2,
               strokeDashArray: [10, 10]
            });
            fabricCanvas.current?.add(rect);
         });
      } else if (type === 'sidebar_right') {
         // Main view + 3 side views
         const mainW = 600;
         const mainH = 450;
         const sideW = 200;
         const gap = 20;

         const mainRect = new Rect({
            left: startX, top: startY, width: mainW, height: mainH,
            fill: '#f0f2f5', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [10, 10]
         });

         fabricCanvas.current.add(mainRect);

         for (let i = 0; i < 3; i++) {
            const sideRect = new Rect({
               left: startX + mainW + gap, top: startY + i * (150 + gap),
               width: sideW, height: 130 + (i == 2 ? 10 : 0), // approx
               fill: '#f0f2f5', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [10, 10]
            });
            fabricCanvas.current.add(sideRect);
         }
      }
      fabricCanvas.current.requestRenderAll();
   };

   // Update Property
   const updateActiveObject = (key: string, value: any) => {
      if (!fabricCanvas.current || !selectedObject) return;

      selectedObject.set(key, value);

      // Update state immediately for UI responsiveness
      setProps(prev => ({ ...prev, [key]: value }));

      if (key === 'text' && selectedType === 'text') {
         // Special handling for text updates if we had an input field (omitted for now)
      }

      fabricCanvas.current.renderAll();
   };

   // Download / Export
   const handleExport = () => {
      if (!fabricCanvas.current) return;
      // We actually want to export just the artboard area
      // For this demo, we'll just export the whole canvas to dataURL
      const dataURL = fabricCanvas.current.toDataURL({
         format: 'png',
         quality: 1,
         multiplier: 2 // 2x resolution
      });

      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `LesLeep_Export_${Date.now()}.png`;
      link.click();
   };

   // Save Project State
   const saveProject = () => {
      if (!fabricCanvas.current) return;

      const json = fabricCanvas.current.toJSON();
      // const preview = fabricCanvas.current.toDataURL({ format: 'png', multiplier: 0.1 }); // Thumbnail

      try {
         // If we have a context with projectId, save to that.
         // Otherwise, maybe save to a 'draft' or alert.
         if (context?.projectId) {
            const projects = JSON.parse(localStorage.getItem('archAiProjects') || '[]');
            const idx = projects.findIndex((p: any) => p.id === context.projectId);

            if (idx !== -1) {
               projects[idx].layoutData = json; // Save as layoutData
               projects[idx].updatedAt = new Date().toISOString();
               localStorage.setItem('archAiProjects', JSON.stringify(projects));
               alert('项目已保存');
            }
         } else {
            // Standalone mode or unsaved
            console.log("Saving to local storage draft...");
            localStorage.setItem('archAi_draft_canvas', JSON.stringify(json));
            alert('已保存为草稿');
         }
      } catch (e) {
         console.error("Save failed", e);
         alert("保存失败");
      }
   };

   // === UI RENDERERS ===

   const renderSidePanelContent = () => {
      switch (activeSideTab) {
         case 'projects':
            return (
               <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-100">
                     <h3 className="font-bold text-onSurface mb-3 text-sm">项目素材 (Project Assets)</h3>
                     <div className="relative group">
                        <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-xs"></i>
                        <input type="text" placeholder="搜索素材..." className="w-full bg-surface-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-xs focus:border-google-blue focus:bg-white outline-none transition-all" />
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 scrollbar-hide">
                     {projectAssets.map(asset => (
                        <div key={asset.id} className="group relative cursor-pointer" onClick={() => addImage(asset.src)}>
                           <div className="aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 relative shadow-sm group-hover:shadow-md transition-all">
                              <img src={asset.src} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                 <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
                                    <i className="fa-solid fa-plus text-sm"></i>
                                 </div>
                              </div>
                           </div>
                           <p className="text-[10px] text-gray-500 mt-1.5 truncate font-medium text-center">{asset.name}</p>
                        </div>
                     ))}
                  </div>
                  <div className="p-4 border-t border-gray-100">
                     <button className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-google-blue-hover transition-colors shadow-sm flex items-center justify-center gap-2">
                        <i className="fa-solid fa-cloud-arrow-up"></i> 上传新素材
                     </button>
                  </div>
               </div>
            );
         case 'templates':
            return (
               <div className="p-4 space-y-4">
                  <h3 className="font-bold text-onSurface border-b border-gray-100 pb-2 text-sm">智能排版 (Smart Layouts)</h3>
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => addTemplate('grid_2x2')} className="aspect-[3/4] bg-surface-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center hover:bg-white hover:border-primary hover:shadow-md transition-all gap-2 p-2 group">
                        <div className="w-full aspect-square bg-white border border-dashed border-gray-300 rounded grid grid-cols-2 grid-rows-2 gap-1 p-1 group-hover:border-primary/30">
                           <div className="bg-gray-100 rounded-sm"></div><div className="bg-gray-100 rounded-sm"></div>
                           <div className="bg-gray-100 rounded-sm"></div><div className="bg-gray-100 rounded-sm"></div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium group-hover:text-primary">2x2 网格</span>
                     </button>
                     <button onClick={() => addTemplate('sidebar_right')} className="aspect-[3/4] bg-surface-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center hover:bg-white hover:border-primary hover:shadow-md transition-all gap-2 p-2 group">
                        <div className="w-full aspect-square bg-white border border-dashed border-gray-300 rounded flex gap-1 p-1 group-hover:border-primary/30">
                           <div className="flex-1 bg-gray-100 rounded-sm"></div>
                           <div className="w-1/3 flex flex-col gap-1">
                              <div className="flex-1 bg-gray-100 rounded-sm"></div>
                              <div className="flex-1 bg-gray-100 rounded-sm"></div>
                              <div className="flex-1 bg-gray-100 rounded-sm"></div>
                           </div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium group-hover:text-primary">侧边布局</span>
                     </button>
                  </div>
               </div>
            );
         case 'elements':
            return (
               <div className="p-4 space-y-6">
                  <div>
                     <h3 className="font-bold text-onSurface border-b border-gray-100 pb-2 text-sm mb-3">基础图形 (Basic Shapes)</h3>
                     <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => addShape('rect')} className="aspect-square bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center hover:border-primary hover:shadow-sm transition-all group">
                           <div className="w-6 h-6 border-2 border-gray-600 bg-gray-200 rounded-sm group-hover:border-primary group-hover:bg-primary/20"></div>
                        </button>
                        <button onClick={() => addShape('circle')} className="aspect-square bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center hover:border-primary hover:shadow-sm transition-all group">
                           <div className="w-6 h-6 rounded-full border-2 border-gray-600 bg-gray-200 group-hover:border-primary group-hover:bg-primary/20"></div>
                        </button>
                     </div>
                  </div>

                  <div>
                     <h3 className="font-bold text-onSurface border-b border-gray-100 pb-2 text-sm mb-3">建筑符号 (Symbols)</h3>
                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => addOverlay('north_arrow')} className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:border-primary hover:shadow-sm gap-2 transition-all text-gray-600 hover:text-primary">
                           <i className="fa-regular fa-compass text-lg"></i>
                           <span className="text-xs font-medium">指北针</span>
                        </button>
                        <button onClick={() => addOverlay('scale_bar')} className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:border-primary hover:shadow-sm gap-2 transition-all text-gray-600 hover:text-primary">
                           <i className="fa-solid fa-ruler-horizontal text-lg"></i>
                           <span className="text-xs font-medium">比例尺</span>
                        </button>
                     </div>
                  </div>
               </div>
            );
         case 'text':
            return (
               <div className="p-4 space-y-4">
                  <h3 className="font-bold text-onSurface border-b border-gray-100 pb-2 text-sm">文字排版 (Typography)</h3>
                  <button onClick={addText} className="w-full py-4 bg-white border border-gray-200 rounded-xl font-display text-xl font-bold hover:border-primary hover:text-primary hover:shadow-sm transition-all text-gray-800">
                     添加标题 (Heading)
                  </button>
                  <button onClick={addText} className="w-full py-3 bg-white border border-gray-200 rounded-xl font-sans text-sm hover:border-primary hover:text-primary hover:shadow-sm transition-all text-gray-600">
                     添加正文 (Body Text)
                  </button>
               </div>
            );
         case 'layers':
            return (
               <div className="p-2">
                  <h3 className="font-bold text-onSurface px-2 py-3 border-b border-gray-100 mb-2 text-sm">图层管理 (Layers)</h3>
                  <div className="space-y-1">
                     {['主标题', '分析图 A', '装饰线条', '背景底图'].map((l, i) => (
                        <div key={i} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${i === 1 ? 'bg-primary-bg text-primary font-bold' : 'hover:bg-gray-50 text-gray-600'}`}>
                           <i className={`fa-regular ${i === 0 ? 'fa-pen-to-square' : 'fa-image'} ${i === 1 ? 'text-primary' : 'text-gray-400'}`}></i>
                           <span>{l}</span>
                           <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100">
                              <i className="fa-regular fa-eye text-gray-400 hover:text-gray-600"></i>
                              <i className="fa-solid fa-lock text-gray-400 hover:text-gray-600"></i>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            );
         default:
            return <div className="p-8 text-center text-gray-400 text-xs">开发中...</div>;
      }
   };

   return (
      <div className="h-screen w-full flex flex-col bg-surface overflow-hidden">

         {/* 1. Top Toolbar */}
         <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-surface shrink-0 z-30 relative shadow-sm">
            <div className="flex items-center gap-4">
               <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                  <i className="fa-solid fa-arrow-left"></i>
               </button>

               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-bg rounded-xl flex items-center justify-center text-primary font-bold shadow-sm">
                     <i className="fa-solid fa-pen-ruler"></i>
                  </div>
                  <div>
                     <h1 className="text-sm font-bold text-onSurface leading-tight flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                        {displayTitle} <i className="fa-solid fa-pencil text-[10px] text-gray-300"></i>
                     </h1>
                     <p className="text-[10px] text-gray-400 font-mono">已自动保存</p>
                  </div>
               </div>

               <div className="h-8 w-px bg-gray-200 mx-2"></div>

               <nav className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                  {/* Quick Actions */}
                  <button onClick={() => addShape('rect')} className="w-8 h-8 rounded hover:bg-white hover:shadow-sm flex items-center justify-center text-gray-500 hover:text-primary transition-all" title="矩形"><i className="fa-regular fa-square"></i></button>
                  <button onClick={() => addShape('circle')} className="w-8 h-8 rounded hover:bg-white hover:shadow-sm flex items-center justify-center text-gray-500 hover:text-primary transition-all" title="圆形"><i className="fa-regular fa-circle"></i></button>
                  <button onClick={addText} className="w-8 h-8 rounded hover:bg-white hover:shadow-sm flex items-center justify-center text-gray-500 hover:text-primary transition-all" title="文字"><i className="fa-solid fa-font"></i></button>
                  <div className="h-4 w-px bg-gray-300 mx-1"></div>
                  <button onClick={undo} disabled={historyIndex <= 0} className={`w-8 h-8 rounded flex items-center justify-center transition-all ${historyIndex <= 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-white hover:shadow-sm text-gray-600'}`} title="撤销"><i className="fa-solid fa-rotate-left"></i></button>
                  <button onClick={redo} disabled={historyIndex >= history.length - 1} className={`w-8 h-8 rounded flex items-center justify-center transition-all ${historyIndex >= history.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-white hover:shadow-sm text-gray-600'}`} title="重做"><i className="fa-solid fa-rotate-right"></i></button>
               </nav>
            </div>

            <div className="flex items-center gap-3">
               <div className="flex items-center bg-gray-50 rounded-full px-3 py-1.5 border border-gray-200">
                  <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-primary" onClick={() => setZoom(Math.max(10, zoom - 10))}><i className="fa-solid fa-minus text-xs"></i></button>
                  <span className="text-xs w-10 text-center font-mono text-gray-600 font-bold">{zoom}%</span>
                  <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-primary" onClick={() => setZoom(Math.min(200, zoom + 10))}><i className="fa-solid fa-plus text-xs"></i></button>
               </div>

               <button onClick={saveProject} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2">
                  <i className="fa-regular fa-floppy-disk"></i> 保存
               </button>

               <button onClick={handleExport} className="px-5 py-2 bg-gradient-to-r from-google-blue to-blue-600 text-white text-xs font-bold rounded-full hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2">
                  <i className="fa-solid fa-download"></i> 导出
               </button>
            </div>
         </header>

         {/* 2. Main Workspace */}
         <div className="flex-1 flex overflow-hidden">

            {/* Left Sidebar (Icons) */}
            <aside className="w-20 bg-surface border-r border-gray-200 flex flex-col items-center py-6 gap-4 shrink-0 z-20">
               {[
                  { id: 'projects', icon: 'fa-folder-open', label: '素材' },
                  { id: 'templates', icon: 'fa-layer-group', label: '排版' },
                  { id: 'elements', icon: 'fa-shapes', label: '形状' },
                  { id: 'text', icon: 'fa-font', label: '文字' },
                  { id: 'layers', icon: 'fa-list-ul', label: '图层' },
               ].map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveSideTab(tab.id as SideTab)}
                     className={`flex flex-col items-center justify-center gap-1.5 w-14 h-14 rounded-2xl transition-all ${activeSideTab === tab.id ? 'bg-primary-bg text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                     <i className={`fa-solid ${tab.icon} text-lg`}></i>
                     <span className="text-[9px] font-medium">{tab.label}</span>
                  </button>
               ))}
            </aside>

            {/* Left Drawer (Panel) */}
            <aside className="w-80 bg-surface border-r border-gray-200 shrink-0 z-10 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
               {renderSidePanelContent()}
            </aside>

            {/* Canvas Area */}
            <main className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col">
               <div ref={containerRef} className="w-full h-full relative bg-[#F0F2F5]">
                  <canvas ref={canvasRef} />
               </div>
               <div className="absolute bottom-6 left-6 text-[10px] text-gray-400 pointer-events-none bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-gray-200 shadow-sm font-mono">
                  按住空格 + 拖拽移动画布 | 滚轮缩放
               </div>
            </main>

            {/* Right Sidebar (Properties) */}
            <aside className="w-72 bg-surface border-l border-gray-200 shrink-0 z-20 flex flex-col">
               <div className="h-12 border-b border-gray-100 flex items-center px-5 justify-between bg-surface">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">属性 (Properties)</span>
                  <i className="fa-solid fa-sliders text-gray-400 text-xs"></i>
               </div>

               <div className="flex-1 overflow-y-auto p-5 space-y-8">
                  {selectedObject ? (
                     <>
                        <div className="space-y-4">
                           <h4 className="text-xs font-bold text-onSurface flex items-center gap-2">
                              <i className="fa-solid fa-palette text-google-blue"></i> 外观 (Appearance)
                           </h4>

                           {/* Opacity */}
                           <div>
                              <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                 <span>不透明度</span>
                                 <span className="font-mono bg-gray-100 px-1.5 rounded text-gray-700">{Math.round(props.opacity * 100)}%</span>
                              </div>
                              <input type="range" min="0" max="1" step="0.01"
                                 value={props.opacity}
                                 onChange={(e) => updateActiveObject('opacity', parseFloat(e.target.value))}
                                 className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                           </div>

                           {/* Fill Color */}
                           <div>
                              <label className="text-xs text-gray-500 block mb-2">填充颜色</label>
                              <div className="flex items-center gap-2 p-1 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                                 <input type="color"
                                    value={props.fill}
                                    onChange={(e) => updateActiveObject('fill', e.target.value)}
                                    className="w-8 h-8 cursor-pointer rounded border-none p-0 overflow-hidden"
                                 />
                                 <span className="text-xs font-mono text-gray-600 uppercase flex-1">{props.fill}</span>
                              </div>
                           </div>

                           {/* Stroke */}
                           <div>
                              <label className="text-xs text-gray-500 block mb-2 flex justify-between">
                                 <span>Stroke</span>
                                 <span className="text-gray-400 font-mono">{props.strokeWidth}px</span>
                              </label>
                              <div className="flex gap-2 items-center">
                                 <div className="p-0.5 border border-gray-200 rounded-md">
                                    <input type="color"
                                       value={props.stroke}
                                       onChange={(e) => updateActiveObject('stroke', e.target.value)}
                                       className="w-7 h-7 cursor-pointer rounded border-none p-0"
                                    />
                                 </div>
                                 <input type="range" min="0" max="20"
                                    value={props.strokeWidth}
                                    onChange={(e) => updateActiveObject('strokeWidth', parseInt(e.target.value))}
                                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                 />
                              </div>
                           </div>
                        </div>

                        {/* Text Specific */}
                        {(selectedType === 'text' || selectedType === 'i-text') && (
                           <div className="space-y-4 border-t border-gray-100 pt-6">
                              <h4 className="text-xs font-bold text-onSurface flex items-center gap-2">
                                 <i className="fa-solid fa-font text-google-blue"></i> Typography
                              </h4>
                              <div>
                                 <label className="text-xs text-gray-500 block mb-2">Font Size</label>
                                 <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                    <input type="number"
                                       value={props.fontSize}
                                       onChange={(e) => updateActiveObject('fontSize', parseInt(e.target.value))}
                                       className="w-full p-2 text-xs outline-none font-mono"
                                    />
                                    <span className="px-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 py-2">px</span>
                                 </div>
                              </div>
                           </div>
                        )}

                        <div className="border-t border-gray-100 pt-6 mt-auto">
                           <button
                              onClick={() => {
                                 if (!fabricCanvas.current) return;
                                 fabricCanvas.current.getActiveObjects().forEach((obj) => fabricCanvas.current!.remove(obj));
                                 fabricCanvas.current.discardActiveObject();
                                 fabricCanvas.current.requestRenderAll();
                              }}
                              className="w-full py-3 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 hover:shadow-sm transition-all flex items-center justify-center gap-2"
                           >
                              <i className="fa-regular fa-trash-can"></i> Delete Layer
                           </button>
                        </div>
                     </>
                  ) : (
                     <div className="text-center text-gray-300 py-20 flex flex-col items-center justify-center h-full">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                           <i className="fa-regular fa-hand-pointer text-2xl text-gray-200"></i>
                        </div>
                        <p className="text-xs font-medium text-gray-400">Select an element<br />to edit properties</p>
                     </div>
                  )}
               </div>
            </aside>

         </div>
      </div>
   );
};

export default Editor;