import { useState, useEffect } from 'react';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/api';

const useTodos = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // API helper function
  const apiRequest = async (url, options = {}) => {
    const token = getAuthToken();
    
    // Debug logging
    console.log('Making API request to:', `${API_BASE_URL}${url}`);
    console.log('Token available:', !!token);
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        
        // Try to parse as JSON, but fall back to text if it fails
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: `Server error: ${response.status}` };
        }
        
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  };

  // Fetch todos from server
  const fetchTodos = async () => {
    if (isFetching) {
      console.log('Already fetching, skipping...');
      return;
    }
    
    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      console.log('Token available:', !!token);
      
      if (!token) {
        // If no token, use default demo data to maintain functionality
        console.log('No token found, using demo data');
        setLists([
          {
            _id: 'demo-list-1',
            title: "My First List",
            tasks: [
              { _id: 'demo-task-1', text: "Grade assignments for Section A", done: false },
              { _id: 'demo-task-2', text: "Prepare slides for next class", done: false },
            ],
          }
        ]);
        setLoading(false);
        return;
      }
      
      const response = await apiRequest('/todos');
      console.log('Fetched todos:', response);
      setLists(response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching todos:', err);
      
      // Fallback to demo data on error
      setLists([
        {
          _id: 'demo-list-1',
          title: "My First List",
          tasks: [
            { _id: 'demo-task-1', text: "Grade assignments for Section A", done: false },
            { _id: 'demo-task-2', text: "Prepare slides for next class", done: false },
          ],
        }
      ]);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Create a new list
  const addList = async (title) => {
    const token = getAuthToken();
    console.log('addList called with:', { title, hasToken: !!token });
    if (!token) {
      // Demo mode - just add to local state
      console.log('Using demo mode for addList');
      const newList = {
        _id: `demo-list-${Date.now()}`,
        title,
        tasks: []
      };
      setLists(prev => [...prev, newList]);
      return newList;
    }
    console.log('Making API call to add list');
    setLoading(true); // Set loading while creating
    try {
      const response = await apiRequest('/todos/lists', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      if (!response || !response.data) {
        throw new Error('No data returned from addList API');
      }
      setLists(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('Error in addList:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add task to a list
  const addTask = async (listId, text) => {
    const token = getAuthToken();
    console.log('addTask called with:', { listId, text, hasToken: !!token });
    
    // Check if this is a demo list or if we don't have a token
    if (!token || (listId && listId.startsWith('demo-'))) {
      console.log('Using demo mode for addTask');
      const newTask = {
        _id: `demo-task-${Date.now()}`,
        text,
        done: false
      };
      setLists(prev => prev.map(list =>
        list._id === listId
          ? { ...list, tasks: [...list.tasks, newTask] }
          : list
      ));
      return newTask;
    }
    
    // Check if the list exists locally
    const list = lists.find(l => l._id === listId);
    if (!list) {
      console.warn('addTask: List does not exist locally, cannot add task');
      throw new Error('List not found locally');
    }
    
    console.log('Making API call to add task');
    try {
      const response = await apiRequest(`/todos/lists/${listId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      
      if (!response || !response.data) {
        throw new Error('No data returned from addTask API');
      }
      
      // Update local state with the new task
      setLists(prev => prev.map(list =>
        list._id === listId
          ? { ...list, tasks: [...list.tasks, response.data] }
          : list
      ));
      return response.data;
    } catch (err) {
      console.error('API addTask failed, adding to local state only:', err);
      
      // If API fails (like "List not found"), still add to local state
      const newTask = {
        _id: `local-task-${Date.now()}`,
        text,
        done: false
      };
      
      setLists(prev => prev.map(list =>
        list._id === listId
          ? { ...list, tasks: [...list.tasks, newTask] }
          : list
      ));
      
      console.warn('Task creation failed on server but added locally');
      return newTask;
    }
  };

  // Update list title
  const updateListTitle = async (listId, title) => {
    const token = getAuthToken();
    const isDemoList = listId && listId.startsWith('demo-');
    
    if (!token || isDemoList) {
      // Demo mode - just update local state
      setLists(prev => prev.map(list => 
        list._id === listId ? { ...list, title } : list
      ));
      return { title };
    }
    
    try {
      const response = await apiRequest(`/todos/lists/${listId}`, {
        method: 'PUT',
        body: JSON.stringify({ title }),
      });

      // Update the list in state
      setLists(prev => prev.map(list => 
        list._id === listId ? { ...list, title } : list
      ));
      return response.data;
    } catch (err) {
      console.error('API updateListTitle failed, updating local state only:', err);
      
      // If API fails, still update local state
      setLists(prev => prev.map(list => 
        list._id === listId ? { ...list, title } : list
      ));
      
      console.warn('List title update failed on server but updated locally');
      return { title };
    }
  };

  // Delete a list and all its tasks
  const deleteList = async (listId) => {
    const token = getAuthToken();
    const isDemoList = listId && listId.startsWith('demo-');
    
    if (!token || isDemoList) {
      // Demo mode - just remove from local state
      setLists(prev => prev.filter(list => list._id !== listId));
      return;
    }
    
    try {
      await apiRequest(`/todos/lists/${listId}`, {
        method: 'DELETE',
      });
      
      // Remove the list from state
      setLists(prev => prev.filter(list => list._id !== listId));
    } catch (err) {
      console.error('API deleteList failed, updating local state only:', err);
      
      // If API fails, still remove from local state
      setLists(prev => prev.filter(list => list._id !== listId));
      
      console.warn('List deletion failed on server but removed locally');
    }
  };

  // Update task
  const updateTask = async (listId, taskId, updates) => {
    const token = getAuthToken();
    const isDemoList = listId && listId.startsWith('demo-');
    const isDemoTask = taskId && taskId.startsWith('demo-');
    
    // Check if the task exists in the list before making API call
    const list = lists.find(l => l._id === listId);
    const taskExists = list && list.tasks.some(t => t._id === taskId);
    
    if (!token || isDemoList || isDemoTask || !taskExists) {
      if (!taskExists && token && !isDemoList && !isDemoTask) {
        console.warn('updateTask: Task does not exist in this list, updating local state only.');
      }
      // Update local state regardless
      setLists(prev => prev.map(list =>
        list._id === listId
          ? {
              ...list,
              tasks: list.tasks.map(task =>
                task._id === taskId ? { ...task, ...updates } : task
              )
            }
          : list
      ));
      return updates;
    }
    
    try {
      const response = await apiRequest(`/todos/lists/${listId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      // Update local state with the response
      setLists(prev => prev.map(list =>
        list._id === listId
          ? {
              ...list,
              tasks: list.tasks.map(task =>
                task._id === taskId ? { ...task, ...updates } : task
              )
            }
          : list
      ));
      return response.data;
    } catch (err) {
      console.error('API updateTask failed, updating local state only:', err);
      
      // If API fails, still update local state to maintain UI consistency
      setLists(prev => prev.map(list =>
        list._id === listId
          ? {
              ...list,
              tasks: list.tasks.map(task =>
                task._id === taskId ? { ...task, ...updates } : task
              )
            }
          : list
      ));
      
      // Don't throw the error to prevent UI breaking
      console.warn('Task update failed on server but updated locally');
      return updates;
    }
  };

  // Toggle task done status
  const toggleTask = async (listId, taskId, done) => {
    const token = getAuthToken();
    const isDemoList = listId && listId.startsWith('demo-');
    const isDemoTask = taskId && taskId.startsWith('demo-');
    
    // Check if the task exists in the list
    const list = lists.find(l => l._id === listId);
    const taskExists = list && list.tasks.some(t => t._id === taskId);
    
    if (!token || isDemoList || isDemoTask || !taskExists) {
      // Update local state directly for demo mode or non-existent tasks
      setLists(prev => prev.map(list =>
        list._id === listId
          ? {
              ...list,
              tasks: list.tasks.map(task =>
                task._id === taskId ? { ...task, done } : task
              )
            }
          : list
      ));
      return;
    }
    
    // Use updateTask which now handles errors gracefully
    return updateTask(listId, taskId, { done });
  };

  // Delete task
  const deleteTask = async (listId, taskId) => {
    const token = getAuthToken();
    const isDemoList = listId && listId.startsWith('demo-');
    const isDemoTask = taskId && taskId.startsWith('demo-');
    
    // Check if the task exists in the list
    const list = lists.find(l => l._id === listId);
    const taskExists = list && list.tasks.some(t => t._id === taskId);
    
    if (!token || isDemoList || isDemoTask || !taskExists) {
      if (!taskExists && token && !isDemoList && !isDemoTask) {
        console.warn('deleteTask: Task does not exist in this list, updating local state only.');
      }
      // Remove from local state
      setLists(prev => prev.map(list =>
        list._id === listId
          ? { ...list, tasks: list.tasks.filter(task => task._id !== taskId) }
          : list
      ));
      return;
    }
    
    try {
      await apiRequest(`/todos/lists/${listId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      // Remove the task from state on successful API call
      setLists(prev => prev.map(list =>
        list._id === listId
          ? { ...list, tasks: list.tasks.filter(task => task._id !== taskId) }
          : list
      ));
    } catch (err) {
      console.error('API deleteTask failed, updating local state only:', err);
      
      // If API fails, still update local state
      setLists(prev => prev.map(list =>
        list._id === listId
          ? { ...list, tasks: list.tasks.filter(task => task._id !== taskId) }
          : list
      ));
      
      console.warn('Task deletion failed on server but removed locally');
    }
  };

  // Reorder tasks (for drag and drop)
  const reorderTasks = async (listId, reorderedTasks) => {
    const token = getAuthToken();
    
    // Check if this is a demo list (they have demo- prefix)
    if (!token || listId.startsWith('demo-')) {
      // Demo mode - just update local state
      setLists(prev => prev.map(list => 
        list._id === listId 
          ? { ...list, tasks: reorderedTasks }
          : list
      ));
      return;
    }
    
    try {
      const tasksUpdate = reorderedTasks.map((task, index) => ({
        id: task._id,
        order: index
      }));

      await apiRequest(`/todos/lists/${listId}/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ tasks: tasksUpdate }),
      });

      // Update the task order in state
      setLists(prev => prev.map(list => 
        list._id === listId 
          ? { ...list, tasks: reorderedTasks }
          : list
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Load todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  return {
    lists,
    loading,
    error,
    refreshTodos: fetchTodos,
    addList,
    updateListTitle,
    deleteList,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    reorderTasks,
  };
};

export default useTodos;
