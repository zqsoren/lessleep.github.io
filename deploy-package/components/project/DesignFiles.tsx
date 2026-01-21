import React, { useState, useEffect } from 'react';

interface DesignFile {
    id: string;
    projectId: number;
    name: string;
    url: string;
    format: string;
    size: number;
    uploadTime: string;
}

interface DesignFilesProps {
    projectId: number;
    onOpenGenerator: (imageUrl?: string) => void;
}

const DesignFiles: React.FC<DesignFilesProps> = ({ projectId, onOpenGenerator }) => {
    const [files, setFiles] = useState<DesignFile[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadFiles();
    }, [projectId]);

    const loadFiles = () => {
        try {
            const stored = localStorage.getItem(`project_${projectId}_files`);
            if (stored) {
                setFiles(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load files', e);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('仅支持图片格式文件');
            return;
        }

        // 验证文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('单张图片大小不可超过5MB,请重新选择');
            return;
        }

        setUploading(true);

        try {
            // 转换为base64
            const reader = new FileReader();
            reader.onload = (event) => {
                const newFile: DesignFile = {
                    id: Date.now().toString(),
                    projectId,
                    name: file.name,
                    url: event.target?.result as string,
                    format: file.type.split('/')[1].toUpperCase(),
                    size: file.size,
                    uploadTime: new Date().toISOString(),
                };

                const updatedFiles = [...files, newFile];
                setFiles(updatedFiles);
                localStorage.setItem(`project_${projectId}_files`, JSON.stringify(updatedFiles));
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Upload failed', error);
            alert('上传失败,请重试');
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 60) return `${minutes}分钟前`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
        return `${Math.floor(minutes / 1440)}天前`;
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">

                    {/* 加号上传卡 */}
                    <label className="aspect-[3/4] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-google-blue hover:text-google-blue hover:bg-blue-50/30 transition-all cursor-pointer group relative overflow-hidden">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all mb-3 shadow-sm">
                            <i className="fa-solid fa-plus text-2xl"></i>
                        </div>
                        <span className="text-sm font-bold">上传图片</span>
                        {uploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <i className="fa-solid fa-spinner fa-spin text-google-blue text-2xl"></i>
                            </div>
                        )}
                    </label>

                    {/* 文件卡片 */}
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="aspect-[3/4] rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-xl transition-all"
                        >
                            {/* 图片背景 */}
                            <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                            />

                            {/* Hover遮罩 + "去AI绘图"图标 */}
                            <div
                                onClick={() => onOpenGenerator(file.url)}
                                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"
                            >
                                <div className="opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                                    <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                        <i className="fa-solid fa-wand-magic-sparkles text-google-blue text-xl"></i>
                                    </div>
                                    <p className="text-white text-xs font-bold text-center mt-2">去AI绘图</p>
                                </div>
                            </div>

                            {/* 右下角信息 */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                <div className="flex items-end justify-between">
                                    <div className="text-white text-[10px] space-y-0.5">
                                        <div className="font-bold">{file.format}</div>
                                        <div className="opacity-80">{formatFileSize(file.size)}</div>
                                    </div>
                                    <div className="text-white text-[10px] opacity-80">
                                        {formatTime(file.uploadTime)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DesignFiles;
