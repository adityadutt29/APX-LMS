'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, MessageCircle, BookOpen, Users, Calendar, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const dropdownRef = useRef(null);
  
  const {
    notifications = [],
    unreadCount = 0,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  // Debug logging
  useEffect(() => {
    console.log('NotificationDropdown - notifications:', notifications);
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show badge animation when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setShowBadge(true);
      // Add bounce animation
      const timer = setTimeout(() => setShowBadge(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'chat':
      case 'message':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'announcement':
        return <BookOpen size={16} className="text-purple-500" />;
      case 'assignment':
        return <Calendar size={16} className="text-orange-500" />;
      case 'grade':
        return <Users size={16} className="text-green-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'chat':
      case 'message':
        return 'border-l-blue-500 bg-blue-50';
      case 'announcement':
        return 'border-l-purple-500 bg-purple-50';
      case 'assignment':
        return 'border-l-orange-500 bg-orange-50';
      case 'grade':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead && notification._id) {
      await markAsRead(notification._id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'chat' || notification.type === 'message') {
      window.location.href = '/teacher/chat';
    } else if (notification.metadata?.courseId) {
      window.location.href = `/classroom/${notification.metadata.courseId}`;
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 hover:bg-gray-100 rounded-full transition-all duration-200 ${
          showBadge ? 'animate-bounce' : ''
        }`}
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'} />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <p className="text-xs text-gray-500">{unreadCount} unread notifications</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications
                  .filter(notification => notification && notification._id)
                  .slice(0, 10)
                  .map((notification, index) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    } ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium text-gray-800 truncate ${
                            !notification.isRead ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => handleDeleteNotification(e, notification._id)}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          
                          {notification.metadata?.courseTitle && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {notification.metadata.courseTitle}
                            </span>
                          )}
                        </div>
                        
                        {!notification.isRead && (
                          <div className="absolute top-3 left-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/teacher/notifications';
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
