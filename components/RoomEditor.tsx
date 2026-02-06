
import React, { useState, useRef } from 'react';
import { RoomRequirement, RoomType, FurnitureItem } from '../types';
import { Plus, Trash2, Armchair, X, Image as ImageIcon, Upload, FileText, Link as LinkIcon } from 'lucide-react';

interface RoomEditorProps {
  rooms: RoomRequirement[];
  onChange: (rooms: RoomRequirement[]) => void;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({ rooms, onChange }) => {
  const [editingFurniture, setEditingFurniture] = useState<{ roomId: string, furniture: Partial<FurnitureItem> } | null>(null);
  const fileInputRefs = useRef<{ [roomId: string]: HTMLInputElement | null }>({});
  const furnitureImageRef = useRef<HTMLInputElement | null>(null);

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
  };

  const removeRoom = (id: string) => {
    onChange(rooms.filter(r => r.id !== id));
  };

  const updateRoom = (id: string, updates: Partial<RoomRequirement>) => {
    onChange(rooms.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const startAddingFurniture = (roomId: string) => {
    setEditingFurniture({
      roomId,
      furniture: { name: '', description: '', image: '', url: '' }
    });
  };

  const saveFurniture = () => {
    if (!editingFurniture || !editingFurniture.furniture.name) return;

    const { roomId, furniture } = editingFurniture;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Normalize URL
    let finalUrl = furniture.url || '';
    if (finalUrl && !finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`;
    }

    const newFurniture: FurnitureItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: furniture.name || '',
      description: furniture.description,
      image: furniture.image,
      url: finalUrl
    };

    updateRoom(roomId, {
      furniture: [...(room.furniture || []), newFurniture]
    });

    setEditingFurniture(null);
  };

  const removeFurniture = (roomId: string, furnitureId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    updateRoom(roomId, {
      furniture: (room.furniture || []).filter(f => f.id !== furnitureId)
    });
  };

  const handleFurnitureImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingFurniture) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingFurniture({
        ...editingFurniture,
        furniture: { ...editingFurniture.furniture, image: reader.result as string }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRoomImageUpload = (roomId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const currentImages = room.images || [];
        updateRoom(roomId, {
          images: [...currentImages, reader.result as string]
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeRoomImage = (roomId: string, index: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const newImages = [...(room.images || [])];
    newImages.splice(index, 1);
    updateRoom(roomId, { images: newImages });
  };

  return (
    <div className="space-y-6">
      {/* Furniture Modal Overlay */}
      {editingFurniture && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Armchair size={18} className="mr-2 text-indigo-600" /> 新增家俱細節
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
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditingFurniture(null)} className="px-4 py-2 text-slate-600 font-medium text-sm">取消</button>
              <button 
                onClick={saveFurniture}
                disabled={!editingFurniture.furniture.name}
                className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:bg-slate-300 transition-colors text-sm"
              >
                儲存家具
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
      ) : (
        <div className="space-y-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/4">
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">空間類型</label>
                  <select
                    value={room.type}
                    onChange={(e) => updateRoom(room.id, { type: e.target.value as RoomType })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {Object.values(RoomType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-1/4">
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">優先級</label>
                  <select
                    value={room.priority}
                    onChange={(e) => updateRoom(room.id, { priority: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="High">高 (優先滿足)</option>
                    <option value="Medium">中 (盡量滿足)</option>
                    <option value="Low">低 (視預算調整)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">詳細需求描述</label>
                  <textarea
                    value={room.description}
                    onChange={(e) => updateRoom(room.id, { description: e.target.value })}
                    placeholder="例如：需要開放式廚房、大量收納、充足採光..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 h-20 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
                <div className="flex items-start pt-6">
                  {/* Fixed: Referencing 'room.id' correctly within the map loop */}
                  <button
                    onClick={() => removeRoom(room.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="刪除空間"
                  >
                    <Trash2 size={20} />
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
                      onClick={() => startAddingFurniture(room.id)}
                      className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100"
                    >
                      + 新增家具
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {room.furniture?.map((f) => (
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
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{f.description || '無描述'}</p>
                        </div>
                        <button 
                          onClick={() => removeFurniture(room.id, f.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {(!room.furniture || room.furniture.length === 0) && (
                      <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl italic">
                        尚未加入家具項目
                      </div>
                    )}
                  </div>
                </div>

                {/* Room Image Section */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                    <ImageIcon size={14} className="mr-1 text-indigo-500" /> 空間參考圖
                  </label>
                  
                  <div className="flex flex-wrap gap-3">
                    {room.images?.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 group">
                        <img 
                          src={img} 
                          className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm" 
                          alt="空間參考" 
                        />
                        <button 
                          onClick={() => removeRoomImage(room.id, idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => fileInputRefs.current[room.id]?.click()}
                      className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all bg-slate-50/50"
                    >
                      <Upload size={20} />
                      <span className="text-[10px] mt-1 font-bold">上傳</span>
                    </button>
                    <input 
                      type="file" 
                      ref={el => fileInputRefs.current[room.id] = el}
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={(e) => handleRoomImageUpload(room.id, e)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
