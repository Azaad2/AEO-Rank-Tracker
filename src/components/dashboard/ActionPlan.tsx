import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Circle, Loader2, Zap, Clock, Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  tool_link: string | null;
  created_at: string;
  completed_at: string | null;
}

const priorityConfig = {
  high: { label: 'Fix Now', icon: Zap, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  medium: { label: 'Improve Soon', icon: Clock, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  low: { label: 'Nice to Have', icon: Star, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

export function ActionPlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [user]);

  async function fetchTasks() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('optimization_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleTask(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    const completedAt = newStatus === 'done' ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('optimization_tasks')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', id);

      if (error) throw error;
      setTasks(prev =>
        prev.map(t => t.id === id ? { ...t, status: newStatus, completed_at: completedAt } : t)
      );
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Failed to update task', variant: 'destructive' });
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </CardContent>
      </Card>
    );
  }

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const groupedTasks = {
    high: pendingTasks.filter(t => t.priority === 'high'),
    medium: pendingTasks.filter(t => t.priority === 'medium'),
    low: pendingTasks.filter(t => t.priority === 'low'),
  };

  if (tasks.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Action Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">
            Run a scan to generate your personalized action plan with prioritized optimization tasks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Completion</span>
            <span className="text-sm font-bold text-yellow-400">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {doneTasks.length} of {tasks.length} tasks completed
          </p>
        </CardContent>
      </Card>

      {/* Priority groups */}
      {(['high', 'medium', 'low'] as const).map(priority => {
        const group = groupedTasks[priority];
        if (group.length === 0) return null;
        const config = priorityConfig[priority];
        const Icon = config.icon;

        return (
          <Card key={priority} className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {config.label}
                <Badge variant="outline" className={config.color}>
                  {group.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                  <button onClick={() => toggleTask(task.id, task.status)} className="mt-0.5">
                    <Circle className="h-5 w-5 text-gray-500 hover:text-yellow-400 transition-colors" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                    )}
                  </div>
                  {task.tool_link && (
                    <Link to={task.tool_link}>
                      <Button size="sm" variant="ghost" className="text-yellow-400 hover:text-yellow-300">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Completed */}
      {doneTasks.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Completed
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                {doneTasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {doneTasks.slice(0, 5).map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 opacity-60"
              >
                <button onClick={() => toggleTask(task.id, task.status)}>
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </button>
                <p className="text-sm text-gray-400 line-through">{task.title}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
