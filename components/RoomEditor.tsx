
import React, { useState, useRef } from 'react';
import { RoomRequirement, RoomType, FurnitureItem, DecorationItem, RequirementItem, FLOOR_OPTIONS } from '../types';
import { Plus, Trash2, Armchair, Paintbrush, X, Image as ImageIcon, Upload, FileText, Link as LinkIcon, Edit, Check, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Compress image to reduce size for Firestore storage
 * @param file - Image file to compress
 * @param maxWidth - Maximum width (default 800px)
 * @param quality - JPEG quality 0-1 (default 0.7)
 * @returns Promise with base64 string
 */
const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

interface RoomEditorProps {
  rooms: RoomRequirement[];
  onChange: (rooms: RoomRequirement[]) => void;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({ rooms, onChange }) => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [expandedRoomIds, setExpandedRoomIds] = useState<Set<string>>(new Set());
  const [editingFurniture, setEditingFurniture] = useState<{ roomId: string, furniture: Partial<FurnitureItem>, isEditing: boolean } | null>(null);
  const [editingDecoration, setEditingDecoration] = useState<{ roomId: string, decoration: Partial<DecorationItem>, isEditing: boolean } | null>(null);
  const [editingRequirement, setEditingRequirement] = useState<{ roomId: string, reqId: string, text: string } | null>(null);
  const [newRequirementText, setNewRequirementText] = useState<{ [roomId: string]: string }>({});
  const fileInputRefs = useRef<{ [roomId: string]: HTMLInputElement | null }>({});
  const furnitureImageRef = useRef<HTMLInputElement | null>(null);
  const decorationImageRef = useRef<HTMLInputElement | null>(null);

  const addRoom = () => {
    const newRoom: RoomRequirement = {
      id: Math.random().toString(36).substr(2, 9),
      type: RoomType.LIVING_ROOM,
      description: '',
      priority: 'Medium',
      furniture: [],
      images: [],
    };
    onChange([...rooms, newRoom]);
    setActiveRoomId(newRoom.id);
  };

  const removeRoom = (id: string) => {
    if (activeRoomId === id) setActiveRoomId(null);
    onChange(rooms.filter(r => r.id !== id));
  };

  const updateRoom = (id: string, updates: Partial<RoomRequirement>) => {
    onChange(rooms.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addRequirement = (roomId: string) => {
    const text = newRequirementText[roomId]?.trim();
    if (!text) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const newReq: RequirementItem = {
      id: Math.random().toString(36).substr(2, 9),
      text
    };
    updateRoom(roomId, { requirements: [...(room.requirements || []), newReq] });
    setNewRequirementText({ ...newRequirementText, [roomId]: '' });
  };

  const removeRequirement = (roomId: string, reqId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    updateRoom(roomId, { requirements: (room.requirements || []).filter(r => r.id !== reqId) });
  };

  const saveRequirementEdit = () => {
    if (!editingRequirement) return;
    const { roomId, reqId, text } = editingRequirement;
    if (!text.trim()) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    updateRoom(roomId, {
      requirements: (room.requirements || []).map(r => r.id === reqId ? { ...r, text: text.trim() } : r)
    });
    setEditingRequirement(null);
  };

  const startAddingFurniture = (roomId: string) => {
    setEditingFurniture({
      roomId,
      furniture: { name: '', description: '', image: '', url: '' },
      isEditing: false
    });
  };

  const startEditingFurniture = (roomId: string, furniture: FurnitureItem) => {
    setEditingFurniture({
      roomId,
      furniture: { ...furniture },
      isEditing: true
    });
  };

  const saveFurniture = () => {
    if (!editingFurniture || !editingFurniture.furniture.name) return;

    const { roomId, furniture, isEditing } = editingFurniture;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Normalize URL
    let finalUrl = furniture.url || '';
    if (finalUrl && !finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`;
    }

    if (isEditing && furniture.id) {
      // Update existing furniture
      const updatedFurniture = (room.furniture || []).map(f =>
        f.id === furniture.id
          ? { ...f, name: furniture.name || '', description: furniture.description, image: furniture.image, url: finalUrl, optional: furniture.optional }
          : f
      );
      updateRoom(roomId, { furniture: updatedFurniture });
    } else {
      // Create new furniture
      const newFurniture: FurnitureItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: furniture.name || '',
        description: furniture.description,
        image: furniture.image,
        url: finalUrl,
        optional: furniture.optional
      };
      updateRoom(roomId, {
        furniture: [...(room.furniture || []), newFurniture]
      });
    }

    setEditingFurniture(null);
  };

  const removeFurniture = (roomId: string, furnitureId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    updateRoom(roomId, {
      furniture: (room.furniture || []).filter(f => f.id !== furnitureId)
    });
  };

  const handleFurnitureImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingFurniture) return;

    try {
      const compressedImage = await compressImage(file);
      setEditingFurniture({
        ...editingFurniture,
        furniture: { ...editingFurniture.furniture, image: compressedImage }
      });
    } catch (error) {
      console.error('Failed to compress image:', error);
    }
  };

  const startAddingDecoration = (roomId: string) => {
    setEditingDecoration({
      roomId,
      decoration: { name: '', description: '', image: '', url: '' },
      isEditing: false
    });
  };

  const startEditingDecoration = (roomId: string, decoration: DecorationItem) => {
    setEditingDecoration({
      roomId,
      decoration: { ...decoration },
      isEditing: true
    });
  };

  const saveDecoration = () => {
    if (!editingDecoration || !editingDecoration.decoration.name) return;

    const { roomId, decoration, isEditing } = editingDecoration;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    let finalUrl = decoration.url || '';
    if (finalUrl && !finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`;
    }

    if (isEditing && decoration.id) {
      const updatedDecorations = (room.decorations || []).map(d =>
        d.id === decoration.id
          ? { ...d, name: decoration.name || '', description: decoration.description, image: decoration.image, url: finalUrl, optional: decoration.optional }
          : d
      );
      updateRoom(roomId, { decorations: updatedDecorations });
    } else {
      const newDecoration: DecorationItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: decoration.name || '',
        description: decoration.description,
        image: decoration.image,
        url: finalUrl,
        optional: decoration.optional
      };
      updateRoom(roomId, {
        decorations: [...(room.decorations || []), newDecoration]
      });
    }

    setEditingDecoration(null);
  };

  const removeDecoration = (roomId: string, decorationId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    updateRoom(roomId, {
      decorations: (room.decorations || []).filter(d => d.id !== decorationId)
    });
  };

  const handleDecorationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDecoration) return;

    try {
      const compressedImage = await compressImage(file);
      setEditingDecoration({
        ...editingDecoration,
        decoration: { ...editingDecoration.decoration, image: compressedImage }
      });
    } catch (error) {
      console.error('Failed to compress image:', error);
    }
  };

  const handleRoomImageUpload = async (roomId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    for (const file of Array.from(files)) {
      try {
        const compressedImage = await compressImage(file);
        const currentRoom = rooms.find(r => r.id === roomId);
        if (currentRoom) {
          const currentImages = currentRoom.images || [];
          updateRoom(roomId, {
            images: [...currentImages, compressedImage]
          });
        }
      } catch (error) {
        console.error('Failed to compress image:', error);
      }
    }
    e.target.value = '';
  };

  const removeRoomImage = (roomId: string, index: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const newImages = [...(room.images || [])];
    newImages.splice(index, 1);
    updateRoom(roomId, { images: newImages });
  };

  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) ?? null : null;

  const priorityLabel = (p: string) => {
    switch (p) {
      case 'High': return '高';
      case 'Medium': return '中';
      case 'Low': return '低';
      default: return p;
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-amber-100 text-amber-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const floorColor = (floor: string) => {
    switch (floor) {
      case 'B2':
      case 'B1':
        return { border: 'border-l-slate-400', badge: 'bg-slate-100 text-slate-600' };
      case '1F':
        return { border: 'border-l-blue-400', badge: 'bg-blue-100 text-blue-600' };
      case '2F':
        return { border: 'border-l-emerald-400', badge: 'bg-emerald-100 text-emerald-600' };
      case '3F':
        return { border: 'border-l-violet-400', badge: 'bg-violet-100 text-violet-600' };
      case '4F':
        return { border: 'border-l-orange-400', badge: 'bg-orange-100 text-orange-600' };
      case '5F':
        return { border: 'border-l-pink-400', badge: 'bg-pink-100 text-pink-600' };
      case '6F':
        return { border: 'border-l-cyan-400', badge: 'bg-cyan-100 text-cyan-600' };
      case '7F':
        return { border: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-600' };
      default:
        return { border: 'border-l-lime-400', badge: 'bg-lime-100 text-lime-600' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Furniture Modal Overlay */}
      {editingFurniture && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Armchair size={18} className="mr-2 text-indigo-600" /> {editingFurniture.isEditing ? '編輯家俱' : '新增家俱細節'}
              </h3>
              <button onClick={() => setEditingFurniture(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div
                  onClick={() => furnitureImageRef.current?.click()}
                  className="w-full sm:w-32 h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 group transition-all shrink-0 overflow-hidden relative bg-white"
                >
                  {editingFurniture.furniture.image ? (
                    <img src={editingFurniture.furniture.image} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-300 group-hover:text-indigo-500 mb-1" />
                      <span className="text-xs text-slate-400">家俱圖片</span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={furnitureImageRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFurnitureImageUpload}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">家俱名稱</label>
                    <input
                      type="text"
                      placeholder="例如：北歐風布質沙發"
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm text-slate-900"
                      value={editingFurniture.furniture.name}
                      onChange={e => setEditingFurniture({...editingFurniture, furniture: {...editingFurniture.furniture, name: e.target.value}})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">參考網址 / 連結</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <LinkIcon size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder="https://ikea.com/product/..."
                        className="w-full p-2.5 pl-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm text-slate-900"
                        value={editingFurniture.furniture.url}
                        onChange={e => setEditingFurniture({...editingFurniture, furniture: {...editingFurniture.furniture, url: e.target.value}})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">備註 / 規格描述</label>
                <textarea
                  placeholder="詳細尺寸、顏色代碼、材質偏好..."
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none text-sm bg-white text-slate-900"
                  value={editingFurniture.furniture.description}
                  onChange={e => setEditingFurniture({...editingFurniture, furniture: {...editingFurniture.furniture, description: e.target.value}})}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingFurniture.furniture.optional || false}
                  onChange={e => setEditingFurniture({...editingFurniture, furniture: {...editingFurniture.furniture, optional: e.target.checked}})}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">非必要項目</span>
                <span className="text-[10px] text-slate-400">（視預算決定是否採購）</span>
              </label>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditingFurniture(null)} className="px-4 py-2 text-slate-600 font-medium text-sm">取消</button>
              <button
                onClick={saveFurniture}
                disabled={!editingFurniture.furniture.name}
                className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:bg-slate-300 transition-colors text-sm"
              >
                {editingFurniture.isEditing ? '更新家具' : '儲存家具'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decoration Modal Overlay */}
      {editingDecoration && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Paintbrush size={18} className="mr-2 text-indigo-600" /> {editingDecoration.isEditing ? '編輯裝潢' : '新增裝潢細節'}
              </h3>
              <button onClick={() => setEditingDecoration(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div
                  onClick={() => decorationImageRef.current?.click()}
                  className="w-full sm:w-32 h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 group transition-all shrink-0 overflow-hidden relative bg-white"
                >
                  {editingDecoration.decoration.image ? (
                    <img src={editingDecoration.decoration.image} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-300 group-hover:text-indigo-500 mb-1" />
                      <span className="text-xs text-slate-400">裝潢圖片</span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={decorationImageRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleDecorationImageUpload}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">裝潢名稱</label>
                    <input
                      type="text"
                      placeholder="例如：超耐磨木地板"
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm text-slate-900"
                      value={editingDecoration.decoration.name}
                      onChange={e => setEditingDecoration({...editingDecoration, decoration: {...editingDecoration.decoration, name: e.target.value}})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">參考網址 / 連結</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <LinkIcon size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder="https://example.com/product/..."
                        className="w-full p-2.5 pl-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm text-slate-900"
                        value={editingDecoration.decoration.url}
                        onChange={e => setEditingDecoration({...editingDecoration, decoration: {...editingDecoration.decoration, url: e.target.value}})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">備註 / 規格描述</label>
                <textarea
                  placeholder="詳細規格、色號、材質偏好..."
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none text-sm bg-white text-slate-900"
                  value={editingDecoration.decoration.description}
                  onChange={e => setEditingDecoration({...editingDecoration, decoration: {...editingDecoration.decoration, description: e.target.value}})}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingDecoration.decoration.optional || false}
                  onChange={e => setEditingDecoration({...editingDecoration, decoration: {...editingDecoration.decoration, optional: e.target.checked}})}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">非必要項目</span>
                <span className="text-[10px] text-slate-400">（視預算決定是否施作）</span>
              </label>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditingDecoration(null)} className="px-4 py-2 text-slate-600 font-medium text-sm">取消</button>
              <button
                onClick={saveDecoration}
                disabled={!editingDecoration.decoration.name}
                className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:bg-slate-300 transition-colors text-sm"
              >
                {editingDecoration.isEditing ? '更新裝潢' : '儲存裝潢'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">空間需求明細</h2>
        <button
          onClick={addRoom}
          className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
        >
          <Plus size={16} className="mr-2" />
          新增空間
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <p className="text-slate-400">目前尚無空間需求，點擊上方按鈕開始新增。</p>
        </div>
      ) : activeRoom ? (
        /* ===== Single Room Edit Mode ===== */
        <div className="space-y-6">
          <button
            onClick={() => setActiveRoomId(null)}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <ChevronLeft size={18} className="mr-1" />
            返回空間列表
          </button>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/4">
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">空間類型</label>
                <select
                  value={activeRoom.type}
                  onChange={(e) => updateRoom(activeRoom.id, { type: e.target.value as RoomType })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {Object.values(RoomType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-1/6">
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">樓層</label>
                <select
                  value={activeRoom.floor || '1F'}
                  onChange={(e) => updateRoom(activeRoom.id, { floor: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {FLOOR_OPTIONS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-1/4">
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">優先級</label>
                <select
                  value={activeRoom.priority}
                  onChange={(e) => updateRoom(activeRoom.id, { priority: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="High">高 (優先滿足)</option>
                  <option value="Medium">中 (盡量滿足)</option>
                  <option value="Low">低 (視預算調整)</option>
                </select>
              </div>
              <div className="flex items-start pt-6">
                <button
                  onClick={() => removeRoom(activeRoom.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="刪除空間"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Multi-item Requirements Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <FileText size={14} className="mr-1 text-indigo-500" /> 需求項目
              </label>
              <div className="space-y-2">
                {(activeRoom.requirements || []).map((req) => (
                  <div key={req.id} className="flex items-center gap-2 group">
                    {editingRequirement?.reqId === req.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 p-2 bg-white border border-indigo-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={editingRequirement.text}
                          onChange={(e) => setEditingRequirement({ ...editingRequirement, text: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveRequirementEdit(); if (e.key === 'Escape') setEditingRequirement(null); }}
                          autoFocus
                        />
                        <button onClick={saveRequirementEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="儲存">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingRequirement(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="取消">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0"></span>
                        <span className="flex-1 text-sm text-slate-700">{req.text}</span>
                        <button
                          onClick={() => setEditingRequirement({ roomId: activeRoom.id, reqId: req.id, text: req.text })}
                          className="p-1 text-slate-300 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="編輯需求"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => removeRequirement(activeRoom.id, req.id)}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="刪除需求"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="輸入新需求，例如：需要開放式廚房..."
                  className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newRequirementText[activeRoom.id] || ''}
                  onChange={(e) => setNewRequirementText({ ...newRequirementText, [activeRoom.id]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') addRequirement(activeRoom.id); }}
                />
                <button
                  onClick={() => addRequirement(activeRoom.id)}
                  disabled={!newRequirementText[activeRoom.id]?.trim()}
                  className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
              {/* Furniture Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                    <Armchair size={14} className="mr-1 text-indigo-500" /> 家俱清單
                  </label>
                  <button
                    onClick={() => startAddingFurniture(activeRoom.id)}
                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100"
                  >
                    + 新增家具
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {activeRoom.furniture?.map((f) => (
                    <div key={f.id} className="group relative flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {f.image ? (
                          <img src={f.image} className="w-full h-full object-cover" />
                        ) : (
                          <Armchair size={18} className="text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{f.name}</h4>
                          {f.url && <LinkIcon size={10} className="text-indigo-400" />}
                          {f.optional && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500 shrink-0">非必要</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{f.description || '無描述'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditingFurniture(activeRoom.id, f)}
                          className="p-1.5 text-slate-300 hover:text-indigo-500 transition-colors"
                          title="編輯家具"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => removeFurniture(activeRoom.id, f.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                          title="刪除家具"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!activeRoom.furniture || activeRoom.furniture.length === 0) && (
                    <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl italic">
                      尚未加入家具項目
                    </div>
                  )}
                </div>
              </div>

              {/* Decoration Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                    <Paintbrush size={14} className="mr-1 text-indigo-500" /> 裝潢清單
                  </label>
                  <button
                    onClick={() => startAddingDecoration(activeRoom.id)}
                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100"
                  >
                    + 新增裝潢
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {activeRoom.decorations?.map((d) => (
                    <div key={d.id} className="group relative flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {d.image ? (
                          <img src={d.image} className="w-full h-full object-cover" />
                        ) : (
                          <Paintbrush size={18} className="text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{d.name}</h4>
                          {d.url && <LinkIcon size={10} className="text-indigo-400" />}
                          {d.optional && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500 shrink-0">非必要</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{d.description || '無描述'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditingDecoration(activeRoom.id, d)}
                          className="p-1.5 text-slate-300 hover:text-indigo-500 transition-colors"
                          title="編輯裝潢"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => removeDecoration(activeRoom.id, d.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                          title="刪除裝潢"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!activeRoom.decorations || activeRoom.decorations.length === 0) && (
                    <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl italic">
                      尚未加入裝潢項目
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
              {/* Room Image Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <ImageIcon size={14} className="mr-1 text-indigo-500" /> 空間參考圖
                </label>

                <div className="flex flex-wrap gap-3">
                  {activeRoom.images?.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 group">
                      <img
                        src={img}
                        className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm"
                        alt="空間參考"
                      />
                      <button
                        onClick={() => removeRoomImage(activeRoom.id, idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => fileInputRefs.current[activeRoom.id]?.click()}
                    className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all bg-slate-50/50"
                  >
                    <Upload size={20} />
                    <span className="text-[10px] mt-1 font-bold">上傳</span>
                  </button>
                  <input
                    type="file"
                    ref={el => fileInputRefs.current[activeRoom.id] = el}
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleRoomImageUpload(activeRoom.id, e)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ===== Room Overview Mode ===== */
        <div className="space-y-2">
          {(() => {
            const sortedRooms = [...rooms].sort((a, b) => {
              const ai = FLOOR_OPTIONS.indexOf((a.floor || '1F') as any);
              const bi = FLOOR_OPTIONS.indexOf((b.floor || '1F') as any);
              return ai - bi;
            });
            let lastFloor = '';
            return sortedRooms.map((room) => {
              const reqCount = (room.requirements || []).length;
              const furCount = (room.furniture || []).length;
              const decCount = (room.decorations || []).length;
              const imgCount = (room.images || []).length;
              const floor = room.floor || '1F';
              const colors = floorColor(floor);
              const showHeader = floor !== lastFloor;
              lastFloor = floor;
              return (
                <React.Fragment key={room.id}>
                  {showHeader && (
                    <div className="flex items-center gap-3 pt-3 pb-1">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-xs font-bold text-slate-400 tracking-wider">{floor}</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  )}
                  <div
                    className={`bg-white border border-slate-200 border-l-4 ${colors.border} rounded-xl shadow-sm hover:shadow-md transition-all group`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-800">{room.type}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>{floor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColor(room.priority)}`}>
                            {priorityLabel(room.priority)}
                          </span>
                          <button
                            onClick={() => setActiveRoomId(room.id)}
                            className="px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="編輯空間"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setExpandedRoomIds(prev => {
                                const next = new Set(prev);
                                if (next.has(room.id)) {
                                  next.delete(room.id);
                                } else {
                                  next.add(room.id);
                                }
                                return next;
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                            title={expandedRoomIds.has(room.id) ? '收合' : '展開'}
                          >
                            {expandedRoomIds.has(room.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            onClick={() => removeRoom(room.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="刪除空間"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {reqCount > 0 && (
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                            <FileText size={12} /> {reqCount} 需求
                          </span>
                        )}
                        {furCount > 0 && (
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Armchair size={12} /> {furCount} 家具
                          </span>
                        )}
                        {decCount > 0 && (
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Paintbrush size={12} /> {decCount} 裝潢
                          </span>
                        )}
                        {imgCount > 0 && (
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                            <ImageIcon size={12} /> {imgCount} 圖片
                          </span>
                        )}
                        {reqCount === 0 && furCount === 0 && decCount === 0 && imgCount === 0 && (
                          <span className="text-slate-400 italic">尚未填寫</span>
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Section */}
                    {expandedRoomIds.has(room.id) && (reqCount > 0 || furCount > 0 || decCount > 0 || imgCount > 0) && (
                      <div className="px-4 pb-4 pt-0 space-y-3">
                        <div className="border-t border-slate-100 pt-3" />

                        {reqCount > 0 && (
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <FileText size={11} /> 需求項目
                            </h4>
                            <ul className="space-y-1">
                              {(room.requirements || []).map(req => (
                                <li key={req.id} className="flex items-start gap-2 text-sm text-slate-600">
                                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                                  {req.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {furCount > 0 && (
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Armchair size={11} /> 家俱清單
                            </h4>
                            <ul className="space-y-1">
                              {(room.furniture || []).map(f => (
                                <li key={f.id} className="flex items-center gap-2 text-sm text-slate-600">
                                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                                  <span>{f.name}</span>
                                  {f.optional && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500">非必要</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {decCount > 0 && (
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Paintbrush size={11} /> 裝潢清單
                            </h4>
                            <ul className="space-y-1">
                              {(room.decorations || []).map(d => (
                                <li key={d.id} className="flex items-center gap-2 text-sm text-slate-600">
                                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                                  <span>{d.name}</span>
                                  {d.optional && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500">非必要</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {imgCount > 0 && (
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <ImageIcon size={11} /> 參考圖片
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {(room.images || []).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                                  alt="參考圖片"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};
