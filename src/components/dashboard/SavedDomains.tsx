import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Globe, Loader2 } from 'lucide-react';
import { ScoreTrend } from './ScoreTrend';

interface SavedDomain {
  id: string;
  domain: string;
  created_at: string;
}

interface DomainScan {
  score: number | null;
  created_at: string;
}

export function SavedDomains() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [domains, setDomains] = useState<SavedDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domainScans, setDomainScans] = useState<DomainScan[]>([]);

  useEffect(() => {
    fetchDomains();
  }, [user]);

  useEffect(() => {
    if (selectedDomain) {
      fetchDomainScans(selectedDomain);
    }
  }, [selectedDomain]);

  async function fetchDomains() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('saved_domains')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
      if (data && data.length > 0 && !selectedDomain) {
        setSelectedDomain(data[0].domain);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchDomainScans(domain: string) {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('score, created_at')
        .eq('project_domain', domain)
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) throw error;
      setDomainScans(data || []);
    } catch (error) {
      console.error('Error fetching domain scans:', error);
    }
  }

  async function addDomain() {
    if (!user || !newDomain.trim()) return;
    setIsAdding(true);

    const cleanDomain = newDomain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');

    try {
      const { error } = await supabase
        .from('saved_domains')
        .insert({ user_id: user.id, domain: cleanDomain });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Domain already saved', variant: 'destructive' });
        } else throw error;
      } else {
        setNewDomain('');
        fetchDomains();
        toast({ title: 'Domain added!' });
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      toast({ title: 'Failed to add domain', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  }

  async function removeDomain(id: string) {
    try {
      const { error } = await supabase
        .from('saved_domains')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDomains(prev => prev.filter(d => d.id !== id));
      if (domains.length > 1) {
        const remaining = domains.filter(d => d.id !== id);
        setSelectedDomain(remaining[0]?.domain || null);
      } else {
        setSelectedDomain(null);
      }
      toast({ title: 'Domain removed' });
    } catch (error) {
      console.error('Error removing domain:', error);
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

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-yellow-400" />
            Saved Domains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDomain()}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
            />
            <Button
              onClick={addDomain}
              disabled={isAdding || !newDomain.trim()}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {domains.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              Add your domains to track AI visibility over time.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <Badge
                  key={d.id}
                  className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm ${
                    selectedDomain === d.domain
                      ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedDomain(d.domain)}
                >
                  {d.domain}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeDomain(d.id); }}
                    className="ml-1 opacity-60 hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDomain && (
        <ScoreTrend domain={selectedDomain} scans={domainScans} />
      )}
    </div>
  );
}
