import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Radar,
  History,
  Sparkles,
  Swords,
  TrendingUp,
  FileText,
  MessageSquare,
  BarChart3,
  Bot,
  Globe,
  Crown,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface DashboardSidebarProps {
  activeTab: string;
  onSelect: (tab: string) => void;
  planName: string;
}

const GROUPS: { label: string; items: { id: string; label: string; icon: any }[] }[] = [
  {
    label: 'Home',
    items: [{ id: 'home', label: 'Overview', icon: Home }],
  },
  {
    label: 'Scan',
    items: [
      { id: 'scan', label: 'New scan', icon: Radar },
      { id: 'scans', label: 'Scan history', icon: History },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
      { id: 'competitors', label: 'Competitors', icon: Swords },
      { id: 'benchmark', label: 'Benchmark', icon: TrendingUp },
      { id: 'citations', label: 'Citations', icon: FileText },
      { id: 'prompts', label: 'Prompts', icon: MessageSquare },
      { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
      { id: 'domains', label: 'Domains', icon: Globe },
    ],
  },
];

export function DashboardSidebar({ activeTab, onSelect, planName }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuth();
  const isPro = planName.toLowerCase() !== 'free';

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-800 bg-gray-950 !top-14 !h-[calc(100svh-3.5rem)]">
      <SidebarContent className="bg-gray-950">
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-gray-500 text-[10px] tracking-widest uppercase">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onSelect(item.id)}
                        isActive={isActive}
                        className={
                          isActive
                            ? 'bg-yellow-400/15 text-yellow-400 hover:bg-yellow-400/20 hover:text-yellow-400 border border-yellow-400/30'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }
                        tooltip={item.label}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-sm">{item.label}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="bg-gray-950 border-t border-gray-800 p-3 space-y-2">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2 px-1">
              <div className="w-8 h-8 rounded-full bg-gray-800 border border-yellow-400/50 flex items-center justify-center text-yellow-400 text-sm font-bold shrink-0">
                {user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-300 truncate">{user?.email}</p>
                <Badge
                  className={`text-[10px] px-1.5 py-0 ${isPro ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                >
                  {isPro && <Crown className="h-2.5 w-2.5 mr-0.5" />}
                  {planName}
                </Badge>
              </div>
            </div>
            {!isPro && (
              <Link to="/pricing" className="block">
                <Button size="sm" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-xs h-8">
                  <Crown className="mr-1 h-3 w-3" />
                  Upgrade to Pro
                </Button>
              </Link>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={signOut}
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs h-8"
            >
              <LogOut className="mr-1 h-3 w-3" />
              Sign out
            </Button>
          </>
        ) : (
          <Button size="icon" variant="ghost" onClick={signOut} className="w-full text-gray-400 hover:text-white">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
