
import React from 'react';
import { RoomRequirement, FLOOR_OPTIONS } from '../types';
import {
  Armchair,
  Paintbrush,
  Image as ImageIcon,
  ExternalLink,
  FileText,
} from 'lucide-react';

interface BriefingViewProps {
  rooms: RoomRequirement[];
  onPreviewImage: (img: string) => void;
}

const floorColor = (floor: string) => {
  switch (floor) {
    case 'B2':
    case 'B1':
      return { border: 'border-l-slate-400', badge: 'bg-slate-100 text-slate-600', accent: 'bg-slate-400' };
    case '1F':
      return { border: 'border-l-blue-400', badge: 'bg-blue-100 text-blue-600', accent: 'bg-blue-400' };
    case '2F':
      return { border: 'border-l-emerald-400', badge: 'bg-emerald-100 text-emerald-600', accent: 'bg-emerald-400' };
    case '3F':
      return { border: 'border-l-violet-400', badge: 'bg-violet-100 text-violet-600', accent: 'bg-violet-400' };
    case '4F':
      return { border: 'border-l-orange-400', badge: 'bg-orange-100 text-orange-600', accent: 'bg-orange-400' };
    case '5F':
      return { border: 'border-l-pink-400', badge: 'bg-pink-100 text-pink-600', accent: 'bg-pink-400' };
    case '6F':
      return { border: 'border-l-cyan-400', badge: 'bg-cyan-100 text-cyan-600', accent: 'bg-cyan-400' };
    case '7F':
      return { border: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-600', accent: 'bg-amber-400' };
    default:
      return { border: 'border-l-lime-400', badge: 'bg-lime-100 text-lime-600', accent: 'bg-lime-400' };
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

export const BriefingView: React.FC<BriefingViewProps> = ({ rooms, onPreviewImage }) => {
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

  const hasContent = (room: RoomRequirement) => {
    return (room.requirements && room.requirements.length > 0) ||
      (room.furniture && room.furniture.length > 0) ||
      (room.decorations && room.decorations.length > 0) ||
      (room.images && room.images.length > 0) ||
      room.description;
  };

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

      {/* Floor Groups */}
      <div className="p-6 space-y-8">
        {floorGroups.map(({ floor, rooms: floorRooms }) => {
          const colors = floorColor(floor);
          return (
            <div key={floor}>
              {/* Floor Banner */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-1 h-6 rounded-full ${colors.accent}`} />
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${colors.badge}`}>
                  {floor}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">
                  {floorRooms.length} 個空間
                </span>
              </div>

              {/* Room Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {floorRooms.map(room => {
                  const furCount = (room.furniture || []).length;
                  const decCount = (room.decorations || []).length;

                  return (
                    <div
                      key={room.id}
                      className={`bg-white border border-slate-200 border-l-4 ${colors.border} rounded-xl shadow-sm hover:shadow-md transition-shadow`}
                    >
                      <div className="p-5">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-slate-800 text-lg">{room.type}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                              {floor}
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${priorityColor(room.priority)}`}>
                              {priorityLabel(room.priority)}
                            </span>
                          </div>
                        </div>

                        {!hasContent(room) ? (
                          <p className="text-sm text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                            此空間尚未填寫詳細需求
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {/* Requirements */}
                            {room.requirements && room.requirements.length > 0 && (
                              <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <FileText size={12} className="text-indigo-400" />
                                  需求項目
                                </div>
                                <ul className="space-y-1.5">
                                  {room.requirements.map(req => (
                                    <li key={req.id} className="flex items-start gap-2 text-sm text-slate-600">
                                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0" />
                                      <span className="leading-relaxed">{req.text}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Furniture & Decorations side by side */}
                            {(furCount > 0 || decCount > 0) && (
                              <div className="border-t border-slate-100 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* Furniture */}
                                  {furCount > 0 && (
                                    <div>
                                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Armchair size={12} className="text-indigo-400" />
                                        家俱 ({furCount})
                                      </div>
                                      <div className="space-y-2">
                                        {room.furniture!.map(f => (
                                          <div key={f.id} className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                              {f.image ? (
                                                <img
                                                  src={f.image}
                                                  className="w-full h-full object-cover cursor-zoom-in"
                                                  onClick={() => onPreviewImage(f.image!)}
                                                  alt={f.name}
                                                />
                                              ) : (
                                                <Armchair size={14} className="text-slate-300" />
                                              )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-sm font-medium text-slate-700 truncate">{f.name}</span>
                                                {f.optional && (
                                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                                                    非必要
                                                  </span>
                                                )}
                                                {f.url && (
                                                  <a
                                                    href={f.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-400 hover:text-indigo-600 shrink-0"
                                                    title="查看連結"
                                                  >
                                                    <ExternalLink size={12} />
                                                  </a>
                                                )}
                                              </div>
                                              {f.description && (
                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{f.description}</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Decorations */}
                                  {decCount > 0 && (
                                    <div>
                                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Paintbrush size={12} className="text-indigo-400" />
                                        裝潢 ({decCount})
                                      </div>
                                      <div className="space-y-2">
                                        {room.decorations!.map(d => (
                                          <div key={d.id} className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                              {d.image ? (
                                                <img
                                                  src={d.image}
                                                  className="w-full h-full object-cover cursor-zoom-in"
                                                  onClick={() => onPreviewImage(d.image!)}
                                                  alt={d.name}
                                                />
                                              ) : (
                                                <Paintbrush size={14} className="text-slate-300" />
                                              )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-sm font-medium text-slate-700 truncate">{d.name}</span>
                                                {d.optional && (
                                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                                                    非必要
                                                  </span>
                                                )}
                                                {d.url && (
                                                  <a
                                                    href={d.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-400 hover:text-indigo-600 shrink-0"
                                                    title="查看連結"
                                                  >
                                                    <ExternalLink size={12} />
                                                  </a>
                                                )}
                                              </div>
                                              {d.description && (
                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{d.description}</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Reference Images */}
                            {room.images && room.images.length > 0 && (
                              <div className="border-t border-slate-100 pt-4">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <ImageIcon size={12} className="text-indigo-400" />
                                  參考圖片
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {room.images.map((img, idx) => (
                                    <img
                                      key={idx}
                                      src={img}
                                      onClick={() => onPreviewImage(img)}
                                      className="w-20 h-20 object-cover rounded-lg border border-slate-100 cursor-zoom-in hover:scale-105 transition-transform shadow-sm"
                                      alt="參考圖片"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
  );
};
