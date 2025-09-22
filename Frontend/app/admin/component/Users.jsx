import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit, Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/api';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    section: '',
    department: '',
    studentId: '',
    employeeId: '',
    phone: '',
    year: '',
    major: '',
    teachingSections: []
  });
  const [editingUser, setEditingUser] = useState(null);

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const data = await response.json();
      setUsers([...users, data.data]);
      setShowAddForm(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: '',
        section: '',
        department: '',
        studentId: '',
        employeeId: '',
        phone: '',
        year: '',
        major: ''
      });
      alert('User created successfully!');
    } catch (err) {
      alert(err.message);
      console.error('Error creating user:', err);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(user => user._id !== userId));
      alert('User deleted successfully!');
    } catch (err) {
      alert(err.message);
      console.error('Error deleting user:', err);
    }
  };

  // Edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const data = await response.json();
      setUsers(users.map(user => user._id === editingUser._id ? data.data : user));
      setShowEditForm(false);
      setEditingUser(null);
      alert('User updated successfully!');
    } catch (err) {
      alert(err.message);
      console.error('Error updating user:', err);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser({ 
      ...user, 
      teachingSections: user.teachingSections || [] 
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center text-red-600">Error: {error}</div>
        <button 
          onClick={fetchUsers}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">User Management</h3>
          <button
            onClick={() => {
              setShowAddForm(true);
              setShowEditForm(false);
              setEditingUser(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium">Students</h4>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter(user => user.role === 'student').length}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium">Teachers</h4>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(user => user.role === 'teacher').length}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium">Admins</h4>
            <p className="text-2xl font-bold text-green-600">
              {users.filter(user => user.role === 'admin').length}
            </p>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">Add New User</h4>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              className="p-2 border rounded"
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="p-2 border rounded"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="p-2 border rounded w-full pr-10"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <select
              className="p-2 border rounded"
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              required
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            
            {newUser.role === 'student' && (
              <>
                <input
                  type="text"
                  placeholder="Student ID"
                  className="p-2 border rounded"
                  value={newUser.studentId}
                  onChange={(e) => setNewUser({...newUser, studentId: e.target.value})}
                  required
                />
                <select
                  className="p-2 border rounded"
                  value={newUser.section}
                  onChange={(e) => setNewUser({...newUser, section: e.target.value})}
                  required
                >
                  <option value="">Select Section</option>
                  <option value="SEM I">SEM I</option>
                  <option value="SEM II">SEM II</option>
                  <option value="SEM III">SEM III</option>
                  <option value="SEM IV">SEM IV</option>
                  <option value="SEM V">SEM V</option>
                  <option value="SEM VI">SEM VI</option>
                  <option value="SEM VII">SEM VII</option>
                  <option value="SEM VIII">SEM VIII</option>
                </select>
                <select
                  className="p-2 border rounded"
                  value={newUser.year}
                  onChange={(e) => setNewUser({...newUser, year: e.target.value})}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                <input
                  type="text"
                  placeholder="Major/Specialization"
                  className="p-2 border rounded"
                  value={newUser.major}
                  onChange={(e) => setNewUser({...newUser, major: e.target.value})}
                />
              </>
            )}
            
            {newUser.role === 'teacher' && (
              <>
                <input
                  type="text"
                  placeholder="Employee ID"
                  className="p-2 border rounded"
                  value={newUser.employeeId}
                  onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})}
                  required
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Teaching Sections</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['SEM I', 'SEM II', 'SEM III', 'SEM IV', 'SEM V', 'SEM VI', 'SEM VII', 'SEM VIII'].map(sem => (
                      <label key={sem} className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-1"
                          checked={newUser.teachingSections.includes(sem)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({...newUser, teachingSections: [...newUser.teachingSections, sem]});
                            } else {
                              setNewUser({...newUser, teachingSections: newUser.teachingSections.filter(s => s !== sem)});
                            }
                          }}
                        />
                        <span className="text-sm">{sem}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <input
              type="text"
              placeholder="Department"
              className="p-2 border rounded"
              value={newUser.department}
              onChange={(e) => setNewUser({...newUser, department: e.target.value})}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="p-2 border rounded"
              value={newUser.phone}
              onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
            />
            
            <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded"
              >
                Add User
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditForm && editingUser && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">Edit User</h4>
          <form onSubmit={handleEditUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              className="p-2 border rounded"
              value={editingUser.name}
              onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="p-2 border rounded"
              value={editingUser.email}
              onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
              required
            />
            <select
              className="p-2 border rounded"
              value={editingUser.role}
              onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
              required
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            
            {editingUser.role === 'student' && (
              <>
                <input
                  type="text"
                  placeholder="Student ID"
                  className="p-2 border rounded"
                  value={editingUser.studentId || ''}
                  onChange={(e) => setEditingUser({...editingUser, studentId: e.target.value})}
                />
                <select
                  className="p-2 border rounded"
                  value={editingUser.section || ''}
                  onChange={(e) => setEditingUser({...editingUser, section: e.target.value})}
                >
                  <option value="">Select Section</option>
                  <option value="SEM I">SEM I</option>
                  <option value="SEM II">SEM II</option>
                  <option value="SEM III">SEM III</option>
                  <option value="SEM IV">SEM IV</option>
                  <option value="SEM V">SEM V</option>
                  <option value="SEM VI">SEM VI</option>
                  <option value="SEM VII">SEM VII</option>
                  <option value="SEM VIII">SEM VIII</option>
                </select>
                <select
                  className="p-2 border rounded"
                  value={editingUser.year || ''}
                  onChange={(e) => setEditingUser({...editingUser, year: e.target.value})}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                <input
                  type="text"
                  placeholder="Major/Specialization"
                  className="p-2 border rounded"
                  value={editingUser.major || ''}
                  onChange={(e) => setEditingUser({...editingUser, major: e.target.value})}
                />
              </>
            )}
            
            {editingUser.role === 'teacher' && (
              <input
                type="text"
                placeholder="Employee ID"
                className="p-2 border rounded"
                value={editingUser.employeeId || ''}
                onChange={(e) => setEditingUser({...editingUser, employeeId: e.target.value})}
              />
            )}
            
            <input
              type="text"
              placeholder="Department"
              className="p-2 border rounded"
              value={editingUser.department || ''}
              onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="p-2 border rounded"
              value={editingUser.phone || ''}
              onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
            />
            <select
              className="p-2 border rounded"
              value={editingUser.isActive ? 'active' : 'inactive'}
              onChange={(e) => setEditingUser({...editingUser, isActive: e.target.value === 'active'})}
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Update User
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">ID Number</th>
              <th className="text-left p-4">Section/Department</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className="border-t">
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'admin' ? 'bg-green-100 text-green-800' :
                    user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  {user.role === 'student' ? user.studentId : 
                   user.role === 'teacher' ? user.employeeId : 'N/A'}
                </td>
                <td className="p-4">
                  {user.role === 'student' ? `${user.section || 'N/A'} (Year ${user.year || 'N/A'})` : 
                   user.department || 'N/A'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit User"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found. Add your first user to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;