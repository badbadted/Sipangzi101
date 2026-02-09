
import React, { useState } from 'react';
import { RoomRequirement, FLOOR_OPTIONS } from '../types';
import {
  Armchair,
  Paintbrush,
  Image as ImageIcon,
  ExternalLink,
  FileText,
  ChevronRight,
  X,
} from 'lucide-react';

interface BriefingViewProps {
  rooms: RoomRequirement[];
  onPreviewImage: (img: string) => void;
}

const floorColor = (floor: string) => {
  switch (floor) {
    case 'B2':
    case 'B1':
      return { border: 'border-slate-400', badge: 'bg-slate-100 text-slate-600', accent: 'bg-slate-400', bg: 'bg-slate-50', ring: 'ring-slate-400' };
    case '1F':
      return { border: 'border-blue-400', badge: 'bg-blue-100 text-blue-600', accent: 'bg-blue-400', bg: 'bg-blue-50', ring: 'ring-blue-400' };
    case '2F':
      return { border: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-600', accent: 'bg-emerald-400', bg: 'bg-emerald-50', ring: 'ring-emerald-400' };
    case '3F':
      return { border: 'border-violet-400', badge: 'bg-violet-100 text-violet-600', accent: 'bg-violet-400', bg: 'bg-violet-50', ring: 'ring-violet-400' };
    case '4F':
      return { border: 'border-orange-400', badge: 'bg-orange-100 text-orange-600', accent: 'bg-orange-400', bg: 'bg-orange-50', ring: 'ring-orange-400' };
    case '5F':
      return { border: 'border-pink-400', badge: 'bg-pink-100 text-pink-600', accent: 'bg-pink-400', bg: 'bg-pink-50', ring: 'ring-pink-400' };
    case '6F':
      return { border: 'border-cyan-400', badge: 'bg-cyan-100 text-cyan-600', accent: 'bg-cyan-400', bg: 'bg-cyan-50', ring: 'ring-cyan-400' };
    case '7F':
      return { border: 'border-amber-400', badge: 'bg-amber-100 text-amber-600', accent: 'bg-amber-400', bg: 'bg-amber-50', ring: 'ring-amber-400' };
    default:
      return { border: 'border-lime-400', badge: 'bg-lime-100 text-lime-600', accent: 'bg-lime-400', bg: 'bg-lime-50', ring: 'ring-lime-400' };
  }
};

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

const priorityDot = (p: string) => {
  switch (p) {
    case 'High': return 'bg-red-500';
    case 'Medium': return 'bg-amber-500';
    case 'Low': return 'bg-green-500';
    default: return 'bg-slate-400';
  }
};

const getCompleteness = (room: RoomRequirement) => {
  const checks = [
    (room.requirements && room.requirements.length > 0) || !!room.description,
    room.furniture && room.furniture.length > 0,
    room.decorations && room.decorations.length > 0,
    room.images && room.images.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return { filled, total: 4 };
};

export const BriefingView: React.FC<BriefingViewProps> = ({ rooms, onPreviewImage }) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Sort rooms by floor order
  const sortedRooms = [...rooms].sort((a, b) => {
    const ai = FLOOR_OPTIONS.indexOf((a.floor || '1F') as typeof FLOOR_OPTIONS[number]);
    const bi = FLOOR_OPTIONS.indexOf((b.floor || '1F') as typeof FLOOR_OPTIONS[number]);
    return ai - bi;
  });

  // Group rooms by floor
  const floorGroups: { floor: string; rooms: RoomRequirement[] }[] = [];
  for (const room of sortedRooms) {
    const floor = room.floor || '1F';
    const existing = floorGroups.find(g => g.floor === floor);
    if (existing) {
      existing.rooms.push(room);
    } else {
      floorGroups.push({ floor, rooms: [room] });
    }
  }

  // Priority stats
  const highCount = rooms.filter(r => r.priority === 'High').length;
  const medCount = rooms.filter(r => r.priority === 'Medium').length;
  const lowCount = rooms.filter(r => r.priority === 'Low').length;

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;
  const selectedFloor = selectedRoom?.floor || '1F';
  const selectedColors = floorColor(selectedFloor);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Summary Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
              <FileText size={20} className="text-indigo-500" />
              各空間需求清單
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              共 {rooms.length} 個空間 · {floorGroups.length} 層樓
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {highCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${priorityDot('High')}`} />
                <span className="text-slate-600">高 {highCount}</span>
              </span>
            )}
            {medCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${priorityDot('Medium')}`} />
                <span className="text-slate-600">中 {medCount}</span>
              </span>
            )}
            {lowCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${priorityDot('Low')}`} />
                <span className="text-slate-600">低 {lowCount}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard: Cards + Detail Panel */}
      <div className="flex min-h-[400px]">
        {/* Left: Room Cards */}
        <div className={`${selectedRoom ? 'w-80' : 'w-full'} shrink-0 border-r border-slate-100 overflow-y-auto transition-all`}
          style={{ maxHeight: '70vh' }}
        >
          <div className="p-4 space-y-5">
            {floorGroups.map(({ floor, rooms: floorRooms }) => {
              const colors = floorColor(floor);
              return (
                <div key={floor}>
                  {/* Floor label */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-1 h-5 rounded-full ${colors.accent}`} />
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${colors.badge}`}>
                      {floor}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {/* Room cards grid */}
                  <div className={`grid gap-2 ${selectedRoom ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}`}>
                    {floorRooms.map(room => {
                      const { filled, total } = getCompleteness(room);
                      const isSelected = selectedRoomId === room.id;
                      const furCount = (room.furniture || []).length;
                      const decCount = (room.decorations || []).length;

                      return (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoomId(isSelected ? null : room.id)}
                          className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? `${colors.border} ${colors.bg} shadow-md ring-2 ${colors.ring} ring-offset-1`
                              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{room.type}</h4>
                            <ChevronRight size={14} className={`text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                          </div>

                          {/* Priority + Completeness */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColor(room.priority)}`}>
                              {priorityLabel(room.priority)}
                            </span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: total }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${i < filled ? 'bg-indigo-400' : 'bg-slate-200'}`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Quick counts */}
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                            {furCount > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Armchair size={10} /> {furCount}
                              </span>
                            )}
                            {decCount > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Paintbrush size={10} /> {decCount}
                              </span>
                            )}
                            {(room.images || []).length > 0 && (
                              <span className="flex items-center gap-0.5">
                                <ImageIcon size={10} /> {(room.images || []).length}
                              </span>
                            )}
                            {furCount === 0 && decCount === 0 && (room.images || []).length === 0 && (
                              <span className="italic">尚無項目</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {rooms.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="font-medium">尚無空間需求</p>
                <p className="text-sm mt-1">請先編輯專案以新增空間。</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        {selectedRoom && (
          <div className="flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: '70vh' }}>
            <div className="p-6">
              {/* Detail Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-8 rounded-full ${selectedColors.accent}`} />
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedRoom.type}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${selectedColors.badge}`}>
                        {selectedFloor}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${priorityColor(selectedRoom.priority)}`}>
                        {priorityLabel(selectedRoom.priority)} 優先
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRoomId(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Requirements */}
              <section className="mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText size={13} className="text-indigo-400" />
                  需求項目
                </div>
                {selectedRoom.requirements && selectedRoom.requirements.length > 0 ? (
                  <ul className="space-y-2 bg-slate-50 rounded-xl p-4">
                    {selectedRoom.requirements.map(req => (
                      <li key={req.id} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0" />
                        <span className="leading-relaxed">{req.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : selectedRoom.description ? (
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4">{selectedRoom.description}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 rounded-xl p-4">尚未填寫需求</p>
                )}
              </section>

              {/* Furniture */}
              <section className="mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Armchair size={13} className="text-indigo-400" />
                  家電(俱) ({(selectedRoom.furniture || []).length})
                </div>
                {selectedRoom.furniture && selectedRoom.furniture.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRoom.furniture.map(f => (
                      <div key={f.id} className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {f.image ? (
                            <img
                              src={f.image}
                              className="w-full h-full object-cover cursor-zoom-in"
                              onClick={() => onPreviewImage(f.image!)}
                              alt={f.name}
                            />
                          ) : (
                            <Armchair size={20} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800">{f.name}</span>
                            {f.optional && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                                非必要
                              </span>
                            )}
                            {f.url && (
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-500 hover:text-indigo-700 transition-colors"
                                title="查看連結"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                          {f.description && (
                            <p className="text-sm text-slate-500 leading-relaxed mt-1">{f.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 rounded-xl p-4">尚未新增家電(俱)</p>
                )}
              </section>

              {/* Decorations */}
              <section className="mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Paintbrush size={13} className="text-indigo-400" />
                  裝潢項目 ({(selectedRoom.decorations || []).length})
                </div>
                {selectedRoom.decorations && selectedRoom.decorations.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRoom.decorations.map(d => (
                      <div key={d.id} className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {d.image ? (
                            <img
                              src={d.image}
                              className="w-full h-full object-cover cursor-zoom-in"
                              onClick={() => onPreviewImage(d.image!)}
                              alt={d.name}
                            />
                          ) : (
                            <Paintbrush size={20} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800">{d.name}</span>
                            {d.optional && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                                非必要
                              </span>
                            )}
                            {d.url && (
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-500 hover:text-indigo-700 transition-colors"
                                title="查看連結"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                          {d.description && (
                            <p className="text-sm text-slate-500 leading-relaxed mt-1">{d.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 rounded-xl p-4">尚未新增裝潢項目</p>
                )}
              </section>

              {/* Reference Images */}
              <section>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-indigo-400" />
                  參考圖片 ({(selectedRoom.images || []).length})
                </div>
                {selectedRoom.images && selectedRoom.images.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {selectedRoom.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        onClick={() => onPreviewImage(img)}
                        className="w-28 h-28 object-cover rounded-xl border border-slate-100 cursor-zoom-in hover:scale-105 transition-transform shadow-sm"
                        alt="參考圖片"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 rounded-xl p-4">尚未上傳參考圖片</p>
                )}
              </section>
            </div>
          </div>
        )}

        {/* Empty state for detail panel */}
        {!selectedRoom && rooms.length > 0 && (
          <div className="hidden">
            {/* Cards take full width when no room selected */}
          </div>
        )}
      </div>
    </div>
  );
};
