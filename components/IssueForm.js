// components/IssueForm.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function IssueForm({ issue, onClose, onSave }) {
  const [title, setTitle] = useState(issue?.title || '');
  const [description, setDescription] = useState(issue?.description || '');
  const [status, setStatus] = useState(issue?.status || 'Open');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description);
      setStatus(issue.status);
    }
  }, [issue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const user = await supabase.auth.getUser();
    const user_id = user.data.user.id;

    const newIssue = { title, description, status, user_id };

    let error = null;
    if (issue) {
      // Update existing issue
      ({ error } = await supabase
        .from('issues')
        .update(newIssue)
        .eq('id', issue.id));
    } else {
      // Add new issue
      ({ error } = await supabase
        .from('issues')
        .insert([newIssue]));
    }

    if (error) {
      console.error('Error saving issue:', error.message);
      alert('Error saving issue: ' + error.message);
    } else {
      onSave(); // Notify parent component to refresh issues
      onClose(); // Close the form
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-4">
      <h2 className="text-2xl font-bold mb-4">{issue ? 'Edit Issue' : 'Add New Issue'}</h2>
      <div className="mb-4">
        <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
          Title:
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
          Description:
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">
          Status:
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Issue'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}