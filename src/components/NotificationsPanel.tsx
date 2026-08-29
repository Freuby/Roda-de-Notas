import React from 'react';
import { NotificationItem } from '../types';
import { fmtDate } from '../lib/utils';
import { CheckCheck, MessageSquare } from 'lucide-react';

interface NotificationsPanelProps {
  notifications: NotificationItem[];
  profileMap: Record<string, string>;
  onSelectNotif: (notif: NotificationItem) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  profileMap,
  onSelectNotif,
  onMarkAllRead,
}) => {
  const unreadCount = notifications.filter((n) => !n.seen).length;

  return (
    <div className="absolute bottom-14 left-3 right-3 bg-surface border border-border rounded-xl shadow-2xl z-40 overflow-hidden flex flex-col max-h-80 animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="p-3 border-b border-border flex items-center justify-between bg-bg/40">
        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-green" />
          <span>Commentaires récents</span>
        </span>
        {unreadCount > 0 ? (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] font-semibold text-green hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-3 h-3" />
            <span>Tout marquer lu</span>
          </button>
        ) : (
          <span className="text-[11px] text-muted font-medium">Tout lu ✓</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted italic">
            Aucun commentaire de vos collègues pour l'instant.
          </div>
        ) : (
          notifications.map((n) => {
            const author = profileMap[n.user_id] || 'Inconnu';
            return (
              <button
                key={n.id}
                onClick={() => onSelectNotif(n)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors ${
                  !n.seen ? 'bg-terracotta-soft/70 hover:bg-terracotta-soft' : 'hover:bg-bg'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-green">{author}</span>
                  <span className="text-muted">{fmtDate(n.created_at)}</span>
                </div>
                <div className="text-[11px] font-medium text-muted truncate mb-1">
                  📄 {n.page_title || 'Cours'}
                </div>
                <div className="text-ink text-xs line-clamp-2 italic">
                  « {n.content} »
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};