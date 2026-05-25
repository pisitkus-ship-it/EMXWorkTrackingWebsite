const Board = (() => {
  let _filters = { search:'', priority:'', tag:'', sort:'default' };
  let _dragTaskId = null;
  let _dragGroupId = null;

  function render() {
    const el = document.getElementById('board-content');
    const groups = Store.getGroups();
    el.innerHTML = '';
    groups.forEach(g => {
      el.appendChild(renderGroup(g));
    });
  }

  function renderGroup(group) {
    const tasks = Store.getTasksByGroup(group.id, _filters);

    const section = document.createElement('div');
    section.className = 'group-section';
    section.dataset.groupId = group.id;
    section.style.setProperty('--group-color', group.color);
    section.setAttribute('draggable', 'true');

    const collapsed = sessionStorage.getItem('collapse_' + group.id) === '1';

    section.innerHTML = `
      <div class="group-header" data-group-id="${group.id}">
        <span class="group-color-dot" style="background:${group.color}"></span>
        <span class="group-name" data-edit-group="${group.id}">${escHtml(group.name)}</span>
        <span class="group-count">${tasks.length}</span>
        <div class="group-actions">
          <button class="group-add-btn" data-add-task="${group.id}">+ งาน</button>
          <button class="group-color-btn" data-group-color="${group.id}"
            style="--group-color:${group.color}" title="เปลี่ยนสีกลุ่ม"></button>
          <button class="group-del-btn" data-del-group="${group.id}" title="ลบกลุ่ม">🗑</button>
          <span class="group-toggle">${collapsed ? '▶' : '▼'}</span>
        </div>
      </div>
      <div class="group-body${collapsed?' collapsed':''} group-drop-zone" data-drop-group="${group.id}">
        ${tasks.length === 0
          ? '<div class="empty-group-hint">ยังไม่มีงาน — คลิก "+ งาน" เพื่อเพิ่ม</div>'
          : tasks.map(t => renderCard(t, group)).join('')
        }
      </div>
    `;

    bindGroupEvents(section, group);
    return section;
  }

  function renderCard(task, group) {
    const p = calcProgress(task.steps);
    const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    const cardColor = task.color || group.color;
    const dueCls = dueDateClass(task.dueDate);
    const tags = (task.tags || []).map(tid => {
      const tag = Store.getTag(tid);
      return tag ? `<span class="tag-chip" style="background:${tag.color}">${escHtml(tag.name)}</span>` : '';
    }).join('');
    const attachCount = (task.attachments||[]).length;

    return `
      <div class="task-card" draggable="true"
        data-task-id="${task.id}" data-group-id="${group.id}"
        style="--card-color:${cardColor};--group-color:${group.color}">
        <div class="card-title">${escHtml(task.name)}</div>
        <div class="card-meta">
          ${task.dueDate
            ? `<span class="card-duedate ${dueCls}">${dueDateLabel(task.dueDate)}</span>`
            : ''}
          <span class="card-priority priority-${task.priority}">${priorityLabel(task.priority)}</span>
          ${tags ? `<div class="card-tags">${tags}</div>` : ''}
          ${attachCount ? `<span class="card-attach-count">📎${attachCount}</span>` : ''}
        </div>
        ${p.total > 0 ? `
          <div class="card-progress">
            <div class="progress-row">
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
              <span class="progress-text">${p.done}/${p.total}</span>
            </div>
          </div>` : ''}
      </div>
    `;
  }

  function bindGroupEvents(section, group) {
    // Group header click → toggle collapse
    const hdr = section.querySelector('.group-header');
    hdr.addEventListener('click', e => {
      if (e.target.closest('[data-add-task],[data-group-color],[data-del-group],[data-edit-group]')) return;
      const body = section.querySelector('.group-body');
      const isCollapsed = body.classList.toggle('collapsed');
      sessionStorage.setItem('collapse_' + group.id, isCollapsed ? '1' : '0');
      section.querySelector('.group-toggle').textContent = isCollapsed ? '▶' : '▼';
    });

    // Inline name edit
    const nameEl = section.querySelector('[data-edit-group]');
    nameEl.addEventListener('dblclick', e => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.className = 'group-name-input';
      input.value = group.name;
      nameEl.replaceWith(input);
      input.focus(); input.select();
      const save = () => {
        const val = input.value.trim() || group.name;
        Store.updateGroup(group.id, { name: val });
        render();
      };
      input.addEventListener('blur', save);
      input.addEventListener('keydown', e => { if (e.key==='Enter') { e.preventDefault(); save(); } });
    });

    // Add task button
    const addBtn = section.querySelector('[data-add-task]');
    addBtn.addEventListener('click', e => {
      e.stopPropagation();
      const id = Store.addTask(group.id);
      Modal.open(id);
      render();
    });

    // Group color
    const colorBtn = section.querySelector('[data-group-color]');
    colorBtn.addEventListener('click', e => {
      e.stopPropagation();
      ColorPicker.show(e.target, group.color, color => {
        Store.updateGroup(group.id, { color });
        render();
      });
    });

    // Delete group
    const delBtn = section.querySelector('[data-del-group]');
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm(`ลบกลุ่ม "${group.name}"?\nงานในกลุ่มจะถูกย้ายไปกลุ่มแรก`)) {
        Store.deleteGroup(group.id);
        render();
      }
    });

    // Task card click → open modal
    const body = section.querySelector('.group-body');
    body.addEventListener('click', e => {
      const card = e.target.closest('.task-card');
      if (card) { Modal.open(card.dataset.taskId); }
    });

    // ─── DRAG DROP: tasks ────
    body.addEventListener('dragover', e => {
      e.preventDefault();
      body.classList.add('drag-over');
      const overCard = e.target.closest('.task-card');
      body.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over-card'));
      if (overCard && overCard.dataset.taskId !== _dragTaskId) {
        overCard.classList.add('drag-over-card');
      }
    });

    body.addEventListener('dragleave', e => {
      if (!body.contains(e.relatedTarget)) {
        body.classList.remove('drag-over');
        body.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over-card'));
      }
    });

    body.addEventListener('drop', e => {
      e.preventDefault();
      body.classList.remove('drag-over');
      body.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over-card'));
      if (!_dragTaskId) return;

      const overCard = e.target.closest('.task-card');
      const beforeId = overCard ? overCard.dataset.taskId : null;
      Store.moveTask(_dragTaskId, group.id, beforeId);
      _dragTaskId = null;
      render();
    });

    // Make cards draggable
    body.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('dragstart', e => {
        _dragTaskId = card.dataset.taskId;
        _dragGroupId = card.dataset.groupId;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      });
    });

    // ─── DRAG DROP: group reorder ────
    section.addEventListener('dragstart', e => {
      if (e.target === section) {
        e.dataTransfer.setData('groupId', group.id);
        e.dataTransfer.effectAllowed = 'move';
      }
    });
  }

  function setFilters(f) {
    _filters = { ..._filters, ...f };
    render();
  }

  function priorityLabel(p) {
    const map = { urgent:'🔴 Urgent', high:'🟠 High', medium:'🔵 Med', low:'⚪ Low' };
    return map[p] || p;
  }

  function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render, setFilters };
})();
