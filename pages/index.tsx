// pages/index.js (Full version with issue management)
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import IssueForm from '../components/IssueForm';
import { Issue } from '../types/issue';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching issues:', error.message);
      alert('Error fetching issues: ' + error.message);
    } else {
      setIssues(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkUserAndFetchIssues = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
      } else {
        setUser(user);
        fetchIssues();
      }
      setLoading(false);
    };

    checkUserAndFetchIssues();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          router.push('/auth');
        } else if (session) {
          setUser(session.user);
          fetchIssues();
        }
      }
    );

    // BONUS: Real-time sync with Supabase subscriptions
    const issuesSubscription = supabase
      .channel('public:issues')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'issues', filter: `user_id=eq.${user?.id}` }, 
        (payload: any) => {
          console.log('Change received!', payload);
          if (payload.eventType === 'INSERT') {
            setIssues((prevIssues) => [payload.new as Issue, ...prevIssues]);
          } else if (payload.eventType === 'UPDATE') {
            setIssues((prevIssues) =>
              prevIssues.map((issue) =>
                issue.id === payload.old.id ? (payload.new as Issue) : issue
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setIssues((prevIssues) =>
              prevIssues.filter((issue) => issue.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      issuesSubscription.unsubscribe();
    };
  }, [router, user?.id, fetchIssues]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      const { error } = await supabase.from('issues').delete().eq('id', id);
      if (error) {
        console.error('Error deleting issue:', error.message);
        alert('Error deleting issue: ' + error.message);
      }
    }
  };

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-center mt-8 text-xl font-semibold">Loading your issues...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800">My Issues ({issues.length})</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => { setShowForm(true); setEditingIssue(null); }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Add New Issue
          </button>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign Out ({user.email})
          </button>
        </div>
      </div>

      {showForm && (
        <IssueForm
          issue={editingIssue}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            setEditingIssue(null);
            fetchIssues();
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {issues.length === 0 ? (
          <p className="text-center text-gray-600 text-lg col-span-full">No issues found. Start by adding a new one!</p>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{issue.title}</h3>
              <p className="text-gray-700 mb-3 text-sm">{issue.description}</p>
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  issue.status === 'Open'
                    ? 'bg-blue-200 text-blue-800'
                    : issue.status === 'In Progress'
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-green-200 text-green-800'
                }`}
              >
                {issue.status}
              </span>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleEdit(issue)}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(issue.id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}