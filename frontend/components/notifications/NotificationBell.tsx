"use client";

import { useState, useEffect, useCallback } from "react";
import { notificationService, type Notification } from "@/lib/services/notificationService";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Bell, Trash2, CheckCheck } from "lucide-react";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications({ limit: 10 });
      setNotifications(result.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadUnreadCount, loadNotifications]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    loadUnreadCount();
    
    const interval = setInterval(() => {
      loadUnreadCount();
      if (isOpen) {
        loadNotifications();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [isOpen, loadUnreadCount, loadNotifications]);


  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      await loadUnreadCount();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadUnreadCount();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      await loadUnreadCount();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20';
      case 'high':
        return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
      case 'medium':
        return 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#64748B]" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 sm:h-5 sm:w-5 bg-[#DC2626] text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1 sm:translate-x-0.5 sm:-translate-y-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="fixed top-[4.5rem] right-4 left-4 sm:left-auto sm:absolute sm:top-auto sm:right-0 sm:mt-2 w-auto sm:w-80 md:w-96 lg:w-[28rem] xl:w-[32rem] max-w-none sm:max-w-80 md:max-w-96 lg:max-w-[28rem] xl:max-w-[32rem] bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-[calc(100vh-6rem)] sm:max-h-[600px] overflow-hidden flex flex-col">
            <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-4">
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">Notifications</h3>
              {notifications.filter(n => !n.read).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs whitespace-nowrap px-2 sm:px-3 py-1 sm:py-1.5"
                >
                  <span className="hidden sm:inline">Mark all read</span>
                  <span className="sm:hidden">Read all</span>
                </Button>
              )}
            </div>
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {loading ? (
                <div className="p-6 sm:p-8 text-center text-[#64748B] text-sm sm:text-base">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-[#64748B]">
                  <p className="text-xs sm:text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id || notification._id}
                      className={`p-3 sm:p-4 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                            <Badge className={`${getPriorityColor(notification.priority)} text-xs px-1.5 sm:px-2 py-0.5`}>
                              <span className="capitalize text-[10px] sm:text-xs">{notification.priority}</span>
                            </Badge>
                            {!notification.read && (
                              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#2563EB] rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 break-words">
                            {notification.title}
                          </h4>
                          <p className="text-[10px] sm:text-xs text-[#64748B] mb-1.5 sm:mb-2 break-words line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] sm:text-xs text-[#64748B] mb-1 sm:mb-0">
                            {formatTime(notification.createdAt)}
                          </p>
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-[10px] sm:text-xs text-[#2563EB] hover:underline mt-1 inline-block break-all"
                              onClick={() => setIsOpen(false)}
                            >
                              {notification.actionLabel || 'View'}
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 sm:gap-1.5 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id || notification._id)}
                              className="text-[10px] sm:text-xs text-[#2563EB] hover:underline whitespace-nowrap text-right"
                              aria-label="Mark as read"
                            >
                              Read
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id || notification._id)}
                            className="text-[10px] sm:text-xs text-[#DC2626] hover:underline whitespace-nowrap text-right"
                            aria-label="Delete notification"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

