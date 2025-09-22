"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Loader, AlertCircle } from "lucide-react";
import useTodos from "../../hooks/useTodos";

const AdvancedTodoList = () => {
  const {
    lists,
    loading,
    error,
    addList: createList,
    addTask: createTask,
    updateTask,
    toggleTask: toggleTaskStatus,
    deleteTask: removeTask,
    deleteList: removeList,
    reorderTasks,
  } = useTodos();

  const [newListTitle, setNewListTitle] = useState("");
  const [input, setInput] = useState({}); // input per list
  const [editingIdx, setEditingIdx] = useState({ list: null, task: null });
  const [editText, setEditText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Add a new list
  const handleAddList = async () => {
    if (newListTitle.trim() && !submitting) {
      setSubmitting(true);
      try {
        await createList(newListTitle.trim());
        setNewListTitle("");
      } catch (error) {
        console.error('Error creating list:', error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Add a new task to a list
  const handleAddTask = async (list) => {
    const value = input[list._id] || "";
    if (value.trim() && !submitting) {
      setSubmitting(true);
      try {
        await createTask(list._id, value.trim());
        setInput(prev => ({ ...prev, [list._id]: "" }));
        inputRef.current?.focus();
      } catch (error) {
        console.error('Error creating task:', error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Toggle task done
  const handleToggleTask = async (list, task) => {
    try {
      await toggleTaskStatus(list._id, task._id, !task.done);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  // Delete task
  const handleDeleteTask = async (list, task) => {
    try {
      await removeTask(list._id, task._id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Edit task
  const startEdit = (listIdx, taskIdx, task) => {
    setEditingIdx({ list: listIdx, task: taskIdx });
    setEditText(task.text);
  };

  const saveEdit = async (list, task) => {
    if (editText.trim() && !submitting) {
      setSubmitting(true);
      try {
        await updateTask(list._id, task._id, { text: editText.trim() });
        setEditingIdx({ list: null, task: null });
        setEditText("");
      } catch (error) {
        console.error('Error updating task:', error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Drag-and-drop for tasks within a list
  const onDragStart = (e, listIdx, taskIdx) => {
    e.dataTransfer.setData("listIdx", listIdx);
    e.dataTransfer.setData("taskIdx", taskIdx);
  };

  const onDrop = async (e, listIdx, taskIdx) => {
    const fromListIdx = Number(e.dataTransfer.getData("listIdx"));
    const fromTaskIdx = Number(e.dataTransfer.getData("taskIdx"));
    
    if (fromListIdx !== listIdx) return;
    if (fromTaskIdx === taskIdx) return;

    const list = lists[listIdx];
    const reorderedTasks = [...list.tasks];
    const [moved] = reorderedTasks.splice(fromTaskIdx, 1);
    reorderedTasks.splice(taskIdx, 0, moved);

    try {
      await reorderTasks(list._id, reorderedTasks);
    } catch (error) {
      console.error('Error reordering tasks:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader className="animate-spin" size={24} />
          <span>Loading your notes...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <AlertCircle size={24} />
          <span>Error loading notes: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">To-Do / Notes</h2>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            className="border-none bg-gray-100 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="New list title..."
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddList()}
            disabled={submitting}
          />
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-lg font-semibold shadow disabled:opacity-50"
            onClick={handleAddList}
            disabled={submitting || !newListTitle.trim()}
          >
            {submitting ? <Loader size={20} className="animate-spin" /> : <Plus size={20} />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {lists.map((list, listIdx) => (
          <div key={list._id || listIdx} className="">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-purple-700">{list.title}</h3>
              <button
                className="text-gray-400 hover:text-red-500 transition disabled:opacity-25 ml-2"
                onClick={() => removeList(list._id)}
                title="Delete List"
                disabled={submitting}
              >
                <Trash2 size={20} />
              </button>
            </div>
            <div className="mb-4 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 border-none bg-gray-100 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Type and press Enter to add..."
                value={input[list._id] || ""}
                onChange={(e) => setInput(prev => ({ ...prev, [list._id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask(list)}
                disabled={submitting}
              />
              <button
                className="bg-purple-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-base font-semibold shadow disabled:opacity-50"
                onClick={() => handleAddTask(list)}
                disabled={submitting || !(input[list._id] && input[list._id].trim())}
              >
                {submitting ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
            <ul className="divide-y divide-gray-100">
              {list.tasks?.map((task, taskIdx) => (
                <li
                  key={task._id || taskIdx}
                  className="flex items-center group hover:bg-gray-50 px-2 py-3 cursor-pointer"
                  draggable
                  onDragStart={(e) => onDragStart(e, listIdx, taskIdx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, listIdx, taskIdx)}
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => handleToggleTask(list, task)}
                    className="mr-4 w-5 h-5 accent-purple-600 cursor-pointer"
                  />
                  {editingIdx.list === listIdx && editingIdx.task === taskIdx ? (
                    <input
                      type="text"
                      className="flex-1 border-none bg-gray-100 rounded px-2 py-1 text-base focus:outline-none"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => saveEdit(list, task)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(list, task)}
                      autoFocus
                      disabled={submitting}
                    />
                  ) : (
                    <span
                      className={`flex-1 text-base ${task.done ? "line-through text-gray-400" : "text-gray-800"}`}
                      onDoubleClick={() => startEdit(listIdx, taskIdx, task)}
                      title="Double click to edit"
                    >
                      {task.text}
                    </span>
                  )}
                  <button
                    className="ml-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition disabled:opacity-25"
                    onClick={() => handleDeleteTask(list, task)}
                    title="Delete"
                    disabled={submitting}
                  >
                    <Trash2 size={18} />
                  </button>
                  <span className="ml-2 text-xs text-gray-300 group-hover:text-gray-400">⇅</span>
                </li>
              ))}
              {(!list.tasks || list.tasks.length === 0) && (
                <li className="text-center text-gray-400 py-6 text-base">No notes yet. Add your first!</li>
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 text-xs text-gray-400 text-center">Double click a note to edit. Drag to reorder. Add multiple lists for different topics.</div>
    </div>
  );
};

export default AdvancedTodoList;
