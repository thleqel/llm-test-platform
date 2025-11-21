'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Play, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Test Cases', href: '/test-cases', icon: FileText },
  { name: 'Execute', href: '/execute', icon: Play },
  { name: 'Results', href: '/results', icon: BarChart3 },
  { name: 'Configuration', href: '/config', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-72 flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
      {/* Logo/Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-700">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">LLM Test</h1>
          <p className="text-xs text-gray-400">Quality Platform</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-transparent rounded-xl blur-sm"></div>
              )}
              <item.icon className={`relative h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-purple-400'} transition-colors`} />
              <span className="relative">{item.name}</span>
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400 font-medium">System Online</span>
          </div>
          <span className="text-xs text-gray-500">v0.1.0</span>
        </div>
      </div>
    </div>
  );
}
