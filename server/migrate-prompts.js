import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database.db');
const sqlite3pkg = sqlite3.verbose();
const db = new sqlite3pkg.Database(dbPath);

const GENERATOR_DATA = [
    {
        id: 'pre_analysis', name: '前期分析',
        subtypes: [
            {
                id: 'site_status', name: '场地分析', icon: 'fa-map-location-dot', styles: [
                    { id: 'sitestatus_style01', name: 'STYLE 01', preview: '/preview_sitestatus_style01.png', description: '单色、线稿风、竞赛风、圆形图层', prompt: '{ "task": "建筑分析图生成", "meta": { "label": "垂直爆炸分析图", "version": "CN_v3.1_Blue_Grey_Adjust", "aspect_ratio": "9:16" }, "geometry_constraint": { "instruction": "严格遵循输入卫星地图的道路与建筑布局 (Strictly follow the road and building layout of the input satellite map)", "cropping": "对输入地图进行圆形裁切 (Circular crop of the provided map)" }, "style": { "primary_aesthetic": "技术性建筑图解 (Technical Architectural Diagram)", "sub_style": "蓝灰冷色调风格 (Cold Blue & Grey Tone)", "rendering_quality": "CAD线稿风格，完全扁平化，纸张般极薄 (Paper-thin)", "background_color": "纯白背景 (Hex #ffffff)", "visual_treatment": "强调色块与线条的平面构成，无侧面挤压" }, "composition": { "viewpoint": "爆炸轴侧图视角 (Exploded Axonometric)", "layout": "4个圆形切片垂直堆叠", "alignment": "圆心垂直对齐", "details": "使用深灰色细虚线连接各层，线条干练精确" }, "subject": { "main_concept": "建筑场地多维分析分解图 - 蓝灰定制版", "layers": [ { "position": "第1层 (顶部)", "theme": "水文与城市肌理", "elements": "河流与水域显示为工程蓝 (Hex #4091c1)", "context": "水域周边的非水区域显示为白色，建筑部分形成浅灰色 (Hex #e2e1e0) 的建筑肌理，扁平无厚度" }, { "position": "第2层 (上中)", "theme": "道路交通网络", "elements": "工程蓝 (Hex #4091c1) 的精密线条网络，线型锐利", "context": "严谨的CAD线型，区分主次干道，无光晕" }, { "position": "第3层 (中部)", "theme": "绿地景观", "elements": "绿地统一填充为清透的浅蓝色 (Hex #ebf6fc)", "details": "路网和建筑肌理部分用白色(Hex #FFFFFF) 填充", "context": "浅蓝斑块 + 白色的组合" }, { "position": "第4层 (下中)", "theme": "建筑图底 (Figure-Ground)", "elements": "深灰色 (Hex #4c4c4c) 建筑图底，对比度极高", "style": "经典的黑白图底关系，边缘锐利，无立体高度" }' },
                    { id: 'sitestatus_style02', name: 'STYLE 02', preview: 'https://placehold.co/600x400?text=Candy', description: '彩色、清新、马卡龙色系、圆形图层', prompt: '{ "task":"建筑分析图生成", "meta": { "label":"垂直爆炸分析图", "version":"CN_v2.1_Circle_Flat", "aspect_ratio":"9:16" }, "geometry_constraint": { "instruction": "严格遵循输入卫星地图的道路与建筑布局 (Strictly follow the road and building layout of the input satellite map)", "cropping": "对输入地图进行圆形裁切 (Circular crop of the provided map)" }, "style": { "primary_aesthetic":"柔和等轴测信息图表 (Soft Isometric Infographic)", "sub_style":"圆形UI设计风格，磨砂玻璃拟态风格,马卡龙色系 (Circular UI Style & Glassmorphism & Pastel Colors)", "rendering_quality":"完全扁平化，纸张般极薄 (Paper-thin)，无体积感，无三维厚度,半透明材质，柔和全局光", "background_color":"纯白背景 (Hex #ffffff)", "visual_treatment":"切片为二维平面 (2D Planes)，无侧面挤压厚度 (No Extrusion),图层具有半透明通透感" }, "composition": { "viewpoint":"爆炸轴侧图视角 (Exploded Axonometric)", "layout":"5个圆形切片垂直堆叠 (5 Circular Slices Vertical Stack)", "alignment":"圆心垂直对齐", "details":"使用垂直虚线贯穿圆心或边缘，连接各个圆形切片" }, "subject": { "main_concept":"建筑场地多维分析分解图 - 圆形版", "layers": [ { "position":"第1层 (顶部)", "theme":"水文与流动", "elements":"透明青蓝色块 (Hex #AEE2F0) 表示水域，强调流动感", "context":"扁平圆形卡片，格类似参考图中间层的科技感，清透" }, { "position":"第2层 (上中)", "theme":"道路交通网络", "elements":"使用胭脂粉色 (Hex #E85D75) 的线条网络，配合淡粉色光晕 (Hex #FCE4EC)，受圆形边界限制", "context":"模仿参考图顶层的粉色线性风格，主要道路加粗，节点处有圆形标记" }, { "position":"第3层 (中部)", "theme":"绿地景观", "elements":"嫩黄色底座 (Hex #F7F5D8) 搭配清新的草绿色植被 (Hex #9CCC65)，浅米色 (Hex #F5F5DC) 填充非绿地区域作为基底", "details": "叠加纯白色 (Hex #FFFFFF) 的路网线条" "context":"模仿参考图底层的景观风格，树木简化为球形或抽象符号" " }, { "position":"第4层 (下中)", "theme":"建筑图底", "elements":"淡蓝灰色 (Hex #ECEFF1) 的几何色块表示建筑，基于真实建筑轮廓生成", "style":"二维平面图底关系，无立体高度" }, { "position":"第5层 (底部)", "theme":"环境底图", "elements":"经过矢量化简化的浅米色 (Hex #F5F5DC) 场地底图 ", "style":"保留原始地形特征，但色彩统一化" } ] }, "lighting": { "type":"平光/无光照渲染 (Flat Lighting / Unlit)", "shadows":"绝对无投影 (No Drop Shadows)，层与层之间无遮挡阴影", "mood":"干净，清新、治愈、现代图解风格" } }' }
                ]
            },
            { id: 'site_texture', name: '场地底图', icon: 'fa-city', styles: [{ id: 'site_texture_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Masterplan' }] },
            { id: 'planning', name: '上位规划分析', icon: 'fa-city', styles: [{ id: 'planning_def', name: '默认', preview: 'https://placehold.co/600x400', description: 'Default Style', prompt: 'Masterplan' }] },
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

async function migrate() {
    console.log('Starting migration...');

    // Clear existing tables
    await run('DELETE FROM prompt_styles');
    await run('DELETE FROM prompt_subtypes');
    await run('DELETE FROM prompt_categories');

    for (let cIndex = 0; cIndex < GENERATOR_DATA.length; cIndex++) {
        const category = GENERATOR_DATA[cIndex];
        console.log(`Migrating Category: ${category.name}`);
        await run('INSERT INTO prompt_categories (id, name, sort_order) VALUES (?, ?, ?)', [category.id, category.name, cIndex]);

        if (category.subtypes) {
            for (let sIndex = 0; sIndex < category.subtypes.length; sIndex++) {
                const subtype = category.subtypes[sIndex];
                console.log(`  Migrating Subtype: ${subtype.name}`);
                await run('INSERT INTO prompt_subtypes (id, category_id, name, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
                    [subtype.id, category.id, subtype.name, subtype.icon, sIndex]);

                if (subtype.styles) {
                    for (let stIndex = 0; stIndex < subtype.styles.length; stIndex++) {
                        const style = subtype.styles[stIndex];
                        console.log(`    Migrating Style: ${style.name}`);

                        // Use provided prompt or description if prompt is missing, handling JSON
                        let promptContent = style.prompt || style.description;
                        if (typeof promptContent !== 'string') {
                            promptContent = JSON.stringify(promptContent);
                        }

                        await run('INSERT INTO prompt_styles (id, subtype_id, name, preview, description, prompt_content, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [style.id, subtype.id, style.name, style.preview, style.description, promptContent, stIndex]);
                    }
                }
            }
        }
    }
    console.log('Migration completed successfully!');
    db.close();
}

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// Run valid query to check if tables exist, then migrate
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='prompt_categories'", (err, row) => {
    if (err) {
        console.error("Database error:", err);
        return;
    }
    if (!row) {
        console.log("Tables not found. Please run the server first to create tables.");
        db.close();
    } else {
        migrate().catch(console.error);
    }
});
