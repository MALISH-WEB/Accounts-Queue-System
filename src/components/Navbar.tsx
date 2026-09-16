import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Menu,
  Sparkles,
  Shield,
  GraduationCap,
  Briefcase,
  Building2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { UserSession, apiRequest } from '../lib/api';
import { UCULogo } from './UCULogo';

interface NavbarProps {
  session: UserSession | null;
  onSelectUser?: (user: any) => void;
  onOpenLiveQueue: () => void;
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onSelectUser: _onSelectUser,
  onOpenLiveQueue: _onOpenLiveQueue,
  onLogout,
  onToggleSidebar,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = () => {
    if (!session) return;
    apiRequest<{ notifications: any[]; unreadCount: number }>('/system/notifications')
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (session) {
      loadNotifications();
      const timer = setInterval(loadNotifications, 15000);
      return () => clearInterval(timer);
    }
  }, [session]);

  const markAllRead = async () => {
    try {
      await apiRequest('/system/notifications/mark-all-read', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="bg-[#091E3A] text-white border-b border-[#1E3A60] sticky top-0 z-40 shadow-md">
      {/* Top subtle brand strip derived from UCU Logo Crest: Blue -> Magenta -> Gold -> Green */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#091E3A]" />
        <div className="w-20 sm:w-36 bg-[#E6007E]" />
        <div className="w-16 sm:w-28 bg-[#FFCC00]" />
        <div className="w-14 sm:w-24 bg-[#00883E]" />
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 1. Logo & Brand - Official UCU Shield Crest with Live Indicator */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                id="btn-sidebar-toggle"
                onClick={onToggleSidebar}
                title="Toggle Sidebar Navigation"
                className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-[#132E52] rounded-lg transition-colors focus:ring-2 focus:ring-[#FFCC00]"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Official UCU Coat of Arms Crest Logo */}
            <div className="relative flex items-center">
              <div className="h-11 w-11 flex items-center justify-center shrink-0 drop-shadow-md transition-transform hover:scale-105">
                <UCULogo size={42} />
              </div>
              {/* UCU Ribbon Green Live Status Dot (Growth & Life) */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00883E] border-2 border-[#091E3A] rounded-full shadow-xs"
                title="University Accounts Network: Online & Active"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  CampusQ
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#102A4C] text-[#FFD700] border border-[#1E3A60]">
                  <Shield className="w-3 h-3 text-[#FFCC00]" />
                  UCU Accounts Office
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#E6007E]/20 text-[#FCE7F3] border border-[#E6007E]/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E6007E] animate-pulse" />
                  Alpha & Omega
                </span>
              </div>
              <p className="text-xs text-slate-300 font-normal hidden sm:block truncate">
                Uganda Christian University — <span className="text-[#FFD700] font-serif italic">A Centre of Excellence in the Heart of Africa</span>
              </p>
            </div>
          </div>

          {/* Hero Actions: STRICTLY Notification & Profile */}
          <div className="flex items-center gap-3">
            {/* 2. Notification with Charcoal Popover & Gold Accent */}
            <div className="relative" ref={notifRef}>
              <button
                id="btn-notifications-toggle"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-[#132E52] rounded-lg transition-colors border border-transparent hover:border-[#1E3A60] focus:ring-2 focus:ring-[#C69214]"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#C69214] text-[10px] font-black text-[#091E3A] flex items-center justify-center shadow-xs border border-[#091E3A]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-[#1E293B] rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 bg-[#091E3A] text-white flex items-center justify-between border-b border-[#1E3A60]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">Accounts Announcements</span>
                      <span className="text-[10px] bg-[#132E52] text-[#E5B53B] font-bold px-1.5 py-0.5 rounded border border-[#1E3A60]">
                        UCU Finance
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-[#86EFAC] hover:text-[#4ADE80] font-medium flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No new accounts notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-slate-50 transition-colors ${
                            !n.is_read ? 'bg-amber-50/40 border-l-2 border-[#C69214]' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-[#0F172A] text-xs">{n.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[#334155] mt-1 leading-snug text-xs">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Profile - Charcoal, Deep Blue & Gold */}
            <div className="relative" ref={userMenuRef}>
              <button
                id="btn-user-switcher"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-[#102A4C] hover:bg-[#183966] border border-[#1E3A60] transition-colors shadow-xs focus:ring-2 focus:ring-[#C69214]"
              >
                {session?.user.avatarUrl ? (
                  <img
                    src={session.user.avatarUrl}
                    alt={session.user.fullName}
                    className="w-6 h-6 rounded-full object-cover border-2 border-[#C69214]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C69214] to-[#E5B53B] text-[#091E3A] font-black text-xs flex items-center justify-center shadow-xs">
                    {session?.user.fullName ? session.user.fullName[0] : 'U'}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold leading-tight text-white">{session?.user.fullName}</p>
                  <p className="text-[10px] text-[#E5B53B] font-medium leading-none capitalize">
                    {session?.user.role.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-[#1E293B] rounded-xl shadow-2xl border border-slate-200 z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-lg">
                    <p className="text-xs font-bold text-[#0F172A]">{session?.user.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{session?.user.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#091E3A] text-[#E5B53B] border border-[#1E3A60]">
                        {session?.user.role}
                      </span>
                      <span className="text-[10px] font-medium text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC]">
                        Authorized
                      </span>
                    </div>
                  </div>

                  {/* Institutional Identity Card of the Authenticated User */}
                  <div className="py-2.5 px-3 space-y-2 text-xs">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Institutional Identity Details
                    </p>

                    {session?.user.student ? (
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">Access / Reg No:</span>
                          <span className="font-mono text-[11px] font-bold text-[#091E3A]">
                            {session.user.student.registration_number || session.user.student.registrationNumber || 'A92831'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">Student Number:</span>
                          <span className="font-mono text-[10px] font-semibold text-slate-700">
                            {session.user.student.student_number || session.user.student.studentNumber || 'S22B14/001'}
                          </span>
                        </div>
                        <div className="pt-1 border-t border-slate-200/70">
                          <p className="text-[10px] text-slate-500 font-medium">Academic Programme:</p>
                          <p className="text-[11px] font-semibold text-[#091E3A] line-clamp-1">
                            {session.user.student.programme}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold pt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00883E]" />
                          <span>Main Campus Mukono • Active Student</span>
                        </div>
                      </div>
                    ) : session?.user.staff ? (
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">Staff ID:</span>
                          <span className="font-mono text-[11px] font-bold text-[#091E3A]">
                            {session.user.staff.staff_number || session.user.staff.staffNumber || 'UCU-ACC-01'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">Official Title:</span>
                          <span className="text-[10px] font-semibold text-slate-700">
                            {session.user.staff.title || 'Accounts Officer'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                          <span className="text-[10px] text-slate-500 font-medium">Assigned Window:</span>
                          <span className="font-semibold text-[10px] text-[#091E3A] bg-[#FEF9C3] px-1.5 py-0.5 rounded border border-[#FDE047]">
                            {session.user.staff.assigned_counter || 'Counter 1 - General Enquiries'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-blue-700 font-semibold pt-0.5">
                          <ShieldCheck className="w-3 h-3 text-[#0047AB]" />
                          <span>Authorized Finance Staff Operator</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                        <p className="font-semibold text-slate-800">UCU Accounts Office Portal</p>
                        <p className="text-[10px] text-slate-500">Authenticated via Secure University SSO</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      id="btn-logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-2 font-medium transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out / Lock Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
