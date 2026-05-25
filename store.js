const Store = (() => {
  const KEY = 'qfb_v2';
  const ATTACH_PREFIX = 'qfb_att_';
  let _data = null;

  function init() {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try { _data = JSON.parse(saved); } catch(e) { _data = _default(); }
    } else {
      _data = _default();
    }
    _migrate();
    return _data;
  }

  function _default() {
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  function _migrate() {
    _data.tags = _data.tags || [];
    _data.tasks = (_data.tasks || []).map(migrateTask);
    _save();
  }

  function _save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(_data));
    } catch(e) {
      alert('⚠️ Storage เต็ม! กรุณาลบ Attachments เก่าออกก่อน');
    }
  }

  /* ─── GETTERS ─────────────────────────────────── */
  function getGroups()     { return _data.groups; }
  function getTasks()      { return _data.tasks; }
  function getTags()       { return _data.tags; }
  function getTask(id)     { return _data.tasks.find(t => t.id === id); }
  function getGroup(id)    { return _data.groups.find(g => g.id === id); }
  function getTag(id)      { return _data.tags.find(t => t.id === id); }

  function getTasksByGroup(groupId, filters) {
    let tasks = _data.tasks.filter(t => t.groupId === groupId);
    return applyFilters(tasks, filters);
  }

  function getAllFilteredTasks(filters) {
    return applyFilters([..._data.tasks], filters);
  }

  function applyFilters(tasks, filters) {
    if (!filters) return tasks;
    let result = tasks;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.notes||'').toLowerCase().includes(q)
      );
    }
    if (filters.priority) {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters.tag) {
      result = result.filter(t => (t.tags||[]).includes(filters.tag));
    }

    const sortMap = { urgent:0, high:1, medium:2, low:3 };
    switch (filters.sort) {
      case 'dueDate':
        result = result.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
        break;
      case 'priority':
        result = result.sort((a, b) =>
          (sortMap[a.priority]??99) - (sortMap[b.priority]??99)
        );
        break;
      case 'name':
        result = result.sort((a, b) => a.name.localeCompare(b.name, 'th'));
        break;
      case 'progress':
        result = result.sort((a, b) => {
          const pa = calcProgress(a.steps), pb = calcProgress(b.steps);
          const ra = pa.total ? pa.done/pa.total : 0;
          const rb = pb.total ? pb.done/pb.total : 0;
          return rb - ra;
        });
        break;
    }
    return result;
  }

  /* ─── TASK CRUD ───────────────────────────────── */
  function addTask(groupId) {
    const id = uid();
    const task = migrateTask({
      id, name:'งานใหม่', groupId,
      priority:'medium', dueDate:null,
      steps:[], createdAt:Date.now()
    });
    _data.tasks.push(task);
    _save();
    return id;
  }

  function updateTask(id, updates) {
    const idx = _data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    _data.tasks[idx] = { ..._data.tasks[idx], ...updates };
    _save();
  }

  function deleteTask(id) {
    const task = getTask(id);
    if (task) {
      (task.attachments||[]).forEach(a => deleteAttachment(a.id));
      (task.steps||[]).forEach(s => {
        if (s.type === 'parallel') {
          (s.branches||[]).forEach(b =>
            (b.steps||[]).forEach(bs =>
              (bs.attachments||[]).forEach(a => deleteAttachment(a.id))
            )
          );
        } else {
          (s.attachments||[]).forEach(a => deleteAttachment(a.id));
        }
      });
    }
    _data.tasks = _data.tasks.filter(t => t.id !== id);
    _save();
  }

  function moveTask(taskId, newGroupId, beforeTaskId) {
    const idx = _data.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const task = { ..._data.tasks[idx], groupId: newGroupId };
    _data.tasks.splice(idx, 1);

    if (beforeTaskId) {
      const beforeIdx = _data.tasks.findIndex(t => t.id === beforeTaskId);
      if (beforeIdx !== -1) {
        _data.tasks.splice(beforeIdx, 0, task);
      } else {
        _data.tasks.push(task);
      }
    } else {
      _data.tasks.push(task);
    }
    _save();
  }

  function reorderTask(taskId, beforeTaskId) {
    const task = getTask(taskId);
    if (!task) return;
    moveTask(taskId, task.groupId, beforeTaskId);
  }

  /* ─── GROUP CRUD ──────────────────────────────── */
  function addGroup(name, color) {
    const id = 'g-' + uid();
    _data.groups.push({ id, name, color: color || '#888780' });
    _save();
    return id;
  }

  function updateGroup(id, updates) {
    const idx = _data.groups.findIndex(g => g.id === id);
    if (idx === -1) return;
    _data.groups[idx] = { ..._data.groups[idx], ...updates };
    _save();
  }

  function deleteGroup(id) {
    const fallback = _data.groups.find(g => g.id !== id);
    if (fallback) {
      _data.tasks = _data.tasks.map(t =>
        t.groupId === id ? { ...t, groupId: fallback.id } : t
      );
    }
    _data.groups = _data.groups.filter(g => g.id !== id);
    _save();
  }

  function reorderGroups(newOrder) {
    const map = Object.fromEntries(_data.groups.map(g => [g.id, g]));
    _data.groups = newOrder.map(id => map[id]).filter(Boolean);
    _save();
  }

  /* ─── TAG CRUD ────────────────────────────────── */
  function addTag(name, color) {
    const id = 'tag-' + uid();
    _data.tags.push({ id, name, color: color || '#4A90D9' });
    _save();
    return id;
  }

  function updateTag(id, updates) {
    const idx = _data.tags.findIndex(t => t.id === id);
    if (idx === -1) return;
    _data.tags[idx] = { ..._data.tags[idx], ...updates };
    _save();
  }

  function deleteTag(id) {
    _data.tasks = _data.tasks.map(t => ({
      ...t, tags: (t.tags||[]).filter(tid => tid !== id)
    }));
    _data.tags = _data.tags.filter(t => t.id !== id);
    _save();
  }

  /* ─── ATTACHMENTS ─────────────────────────────── */
  function saveAttachment(id, dataUrl) {
    try {
      localStorage.setItem(ATTACH_PREFIX + id, dataUrl);
      return true;
    } catch(e) {
      alert('⚠️ Storage เต็ม! กรุณาลบ Attachments เก่าออก');
      return false;
    }
  }

  function getAttachment(id) {
    return localStorage.getItem(ATTACH_PREFIX + id);
  }

  function deleteAttachment(id) {
    localStorage.removeItem(ATTACH_PREFIX + id);
  }

  /* ─── RESET ───────────────────────────────────── */
  function reset() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('qfb_'))
      .forEach(k => localStorage.removeItem(k));
    _data = _default();
    _migrate();
  }

  return {
    init, reset,
    getGroups, getTasks, getTags, getTask, getGroup, getTag,
    getTasksByGroup, getAllFilteredTasks,
    addTask, updateTask, deleteTask, moveTask, reorderTask,
    addGroup, updateGroup, deleteGroup, reorderGroups,
    addTag, updateTag, deleteTag,
    saveAttachment, getAttachment, deleteAttachment
  };
})();
