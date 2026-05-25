const Modal = (() => {
  let _task = null;
  let _taskId = null;
  let _stepAttachStep = null;  // reference to step object being attached to

  /* ─── PUBLIC API ──────────────────────────────── */
  function open(taskId) {
    const task = Store.getTask(taskId);
    if (!task) return;
    _taskId = taskId;
    _task = JSON.parse(JSON.stringify(task));
    _populate();
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-name').focus();
    _bindAttachZones();
  }

  function close() {
    document.getElementById('modal-overlay').classList.add('hidden');
    ColorPicker.hide();
    TagPicker.hide();
    _task = null;
    _taskId = null;
  }

  function save() {
    if (!_task) return;
    _task.name     = (document.getElementById('modal-name').value||'').trim() || '(ไม่มีชื่อ)';
    _task.groupId  = document.getElementById('modal-group').value;
    _task.priority = document.getElementById('modal-priority').value;
    _task.dueDate  = document.getElementById('modal-duedate').value || null;
    _task.notes    = document.getElementById('modal-notes').value;
    Store.updateTask(_taskId, _task);
    close();
    Board.render();
    if (!document.getElementById('view-dashboard').classList.contains('hidden')) {
      if (typeof App !== 'undefined') Dashboard.render(App.getFilters());
    }
  }

  function getTask()   { return _task; }
  function getTaskId() { return _taskId; }

  /* ─── BIND EVENTS (called once at startup) ──── */
  function bindEvents() {
    document.getElementById('modal-close').addEventListener('click', close);
    document.getElementById('modal-cancel').addEventListener('click', close);
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-overlay')) close();
    });
    document.getElementById('modal-save').addEventListener('click', save);

    document.getElementById('modal-delete').addEventListener('click', () => {
      if (!_taskId) return;
      if (confirm('ลบงานนี้?')) {
        const id = _taskId;
        close();
        Store.deleteTask(id);
        Board.render();
      }
    });

    document.getElementById('modal-color-btn').addEventListener('click', e => {
      if (!_task) return;
      ColorPicker.show(e.target, _task.color, color => {
        _task.color = color;
        e.target.style.background = color || '#888780';
      });
    });

    document.getElementById('modal-add-tag').addEventListener('click', e => {
      if (!_task) return;
      TagPicker.show(e.target, _task.tags||[], tid => {
        if (!_task.tags) _task.tags = [];
        if (_task.tags.includes(tid)) {
          _task.tags = _task.tags.filter(id => id !== tid);
        } else {
          _task.tags.push(tid);
        }
        _renderTags();
      });
    });

    document.getElementById('btn-add-step').addEventListener('click', () => {
      if (!_task) return;
      _task.steps.push(migrateStep({ id:uid(), type:'step', name:'New step', status:'pending' }));
      _renderSteps();
    });

    document.getElementById('btn-add-parallel').addEventListener('click', () => {
      if (!_task) return;
      _task.steps.push({
        id:uid(), type:'parallel',
        branches:[
          { id:uid(), name:'Branch A', steps:[] },
          { id:uid(), name:'Branch B', steps:[] }
        ]
      });
      _renderSteps();
    });

    // Step attach modal close
    document.getElementById('close-step-attach').addEventListener('click', () => {
      document.getElementById('step-attach-overlay').classList.add('hidden');
      _stepAttachStep = null;
      _renderSteps();
    });
    document.getElementById('step-attach-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('step-attach-overlay')) {
        document.getElementById('step-attach-overlay').classList.add('hidden');
        _stepAttachStep = null;
        _renderSteps();
      }
    });

    // Step attach: file input
    document.getElementById('step-attach-input').addEventListener('change', e => {
      Array.from(e.target.files).forEach(f => _addFileToStep(f));
      e.target.value = '';
    });
    const stepZone = document.getElementById('step-attach-zone');
    stepZone.addEventListener('dragover', e => { e.preventDefault(); stepZone.classList.add('drag-over'); });
    stepZone.addEventListener('dragleave', () => stepZone.classList.remove('drag-over'));
    stepZone.addEventListener('drop', e => {
      e.preventDefault(); stepZone.classList.remove('drag-over');
      Array.from(e.dataTransfer.files).forEach(f => _addFileToStep(f));
    });

    // Lightbox
    document.addEventListener('click', e => {
      const img = e.target.closest('[data-lightbox]');
      if (!img) return;
      const dataUrl = Store.getAttachment(img.dataset.lightbox);
      if (!dataUrl) return;
      document.getElementById('lightbox-img').src = dataUrl;
      document.getElementById('img-lightbox').classList.remove('hidden');
    });
    document.getElementById('lightbox-close').addEventListener('click', _closeLightbox);
    document.getElementById('img-lightbox').addEventListener('click', e => {
      if (e.target.classList.contains('lightbox-backdrop')) _closeLightbox();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!document.getElementById('img-lightbox').classList.contains('hidden')) {
          _closeLightbox();
        } else if (!document.getElementById('step-attach-overlay').classList.contains('hidden')) {
          document.getElementById('step-attach-overlay').classList.add('hidden');
        } else if (!document.getElementById('modal-overlay').classList.contains('hidden')) {
          close();
        }
      }
      if (e.ctrlKey && e.key === 's') {
        if (!document.getElementById('modal-overlay').classList.contains('hidden')) {
          e.preventDefault(); save();
        }
      }
    });
  }

  /* ─── POPULATE ────────────────────────────────── */
  function _populate() {
    document.getElementById('modal-name').value     = _task.name || '';
    document.getElementById('modal-duedate').value  = _task.dueDate || '';
    document.getElementById('modal-notes').value    = _task.notes || '';
    document.getElementById('modal-priority').value = _task.priority || 'medium';

    const chip = document.getElementById('modal-color-btn');
    chip.style.background = _task.color || '#888780';

    const gSel = document.getElementById('modal-group');
    gSel.innerHTML = Store.getGroups().map(g =>
      `<option value="${g.id}"${g.id===_task.groupId?' selected':''}>${esc(g.name)}</option>`
    ).join('');

    _renderTags();
    _renderSteps();
    _renderTaskAttachList();
  }

  /* ─── TAGS ────────────────────────────────────── */
  function _renderTags() {
    const container = document.getElementById('modal-tags');
    container.innerHTML = (_task.tags||[]).map(tid => {
      const tag = Store.getTag(tid);
      if (!tag) return '';
      return `<span class="modal-tag-chip" style="background:${tag.color}" data-tag-id="${tid}">
        ${esc(tag.name)}
        <span class="remove-tag" data-remove-tag="${tid}">✕</span>
      </span>`;
    }).join('');
    container.querySelectorAll('[data-remove-tag]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _task.tags = (_task.tags||[]).filter(id => id !== btn.dataset.removeTag);
        _renderTags();
      });
    });
  }

  /* ─── STEPS ───────────────────────────────────── */
  function _renderSteps() {
    const container = document.getElementById('steps-list');
    container.innerHTML = '';
    (_task.steps||[]).forEach((step, idx) => {
      container.appendChild(_buildStepEl(step, idx));
    });
    _initStepDnD(container);
  }

  function _buildStepEl(step, idx) {
    if (step.type === 'parallel') return _buildParallelEl(step, idx);
    return _buildSeqEl(step, idx);
  }

  function _buildSeqEl(step, idx) {
    const el = document.createElement('div');
    el.className = 'step-item';
    el.dataset.stepIdx = idx;
    el.setAttribute('draggable', 'true');
    const dueCls = step.dueDate ? dueDateClass(step.dueDate) : '';
    const dueLbl = step.dueDate ? formatDate(step.dueDate) : '';
    const attCnt = (step.attachments||[]).length;
    el.innerHTML = `
      <span class="drag-handle">⋮⋮</span>
      <button class="step-status-btn" data-status="${step.status||'pending'}"></button>
      <div class="step-body">
        <input class="step-name-input${step.status==='done'?' done':''}"
               value="${esc(step.name)}" placeholder="ชื่อ Step...">
        <div class="step-date-row">
          <input type="date" class="step-date-input" value="${step.dueDate||''}">
          ${step.dueDate ? `<span class="step-date-badge ${dueCls}">${dueLbl}</span>` : ''}
          <button class="step-attach-btn${attCnt?' has-attach':''}">📎${attCnt||''}</button>
        </div>
      </div>
      <button class="step-del-btn">✕</button>
    `;
    el.querySelector('.step-status-btn').addEventListener('click', () => {
      const cyc = {pending:'active', active:'done', done:'pending'};
      step.status = cyc[step.status] || 'pending';
      el.querySelector('.step-status-btn').dataset.status = step.status;
      el.querySelector('.step-name-input').classList.toggle('done', step.status==='done');
    });
    el.querySelector('.step-name-input').addEventListener('input', e => { step.name = e.target.value; });
    el.querySelector('.step-date-input').addEventListener('change', e => {
      step.dueDate = e.target.value || null;
      _renderSteps();
    });
    el.querySelector('.step-attach-btn').addEventListener('click', () => _openStepAttach(step));
    el.querySelector('.step-del-btn').addEventListener('click', () => {
      _task.steps.splice(idx, 1); _renderSteps();
    });
    return el;
  }

  function _buildParallelEl(block, idx) {
    const wrap = document.createElement('div');
    wrap.className = 'step-item';
    wrap.dataset.stepIdx = idx;
    wrap.setAttribute('draggable', 'true');
    wrap.style.cssText = 'padding:0;background:transparent;border:none;';

    const inner = document.createElement('div');
    inner.className = 'parallel-block';
    inner.style.width = '100%';
    inner.innerHTML = `
      <div class="parallel-block-hdr">
        <span>⊕ Parallel Block</span>
        <div style="display:flex;gap:4px;align-items:center;">
          <span class="drag-handle" style="margin:0">⋮⋮</span>
          <button class="parallel-del-btn">✕</button>
        </div>
      </div>
      <div class="parallel-branches"></div>
      <div class="parallel-footer">
        <button class="add-branch-btn">+ Branch</button>
      </div>
    `;
    const branchesEl = inner.querySelector('.parallel-branches');
    (block.branches||[]).forEach((branch, bIdx) => {
      branchesEl.appendChild(_buildBranchEl(block, idx, branch, bIdx));
    });
    inner.querySelector('.parallel-del-btn').addEventListener('click', () => {
      _task.steps.splice(idx, 1); _renderSteps();
    });
    inner.querySelector('.add-branch-btn').addEventListener('click', () => {
      block.branches.push({ id:uid(), name:'Branch '+String.fromCharCode(65+block.branches.length), steps:[] });
      _renderSteps();
    });
    wrap.appendChild(inner);
    return wrap;
  }

  function _buildBranchEl(block, blockIdx, branch, bIdx) {
    const el = document.createElement('div');
    el.className = 'parallel-branch';
    el.innerHTML = `
      <input class="branch-name-input" value="${esc(branch.name)}" placeholder="Branch...">
      <div class="branch-steps">
        ${(branch.steps||[]).map((s,sIdx) => `
          <div class="branch-step" data-si="${sIdx}">
            <button class="step-status-btn" data-status="${s.status||'pending'}"></button>
            <div style="flex:1;min-width:0;">
              <input class="branch-step-name${s.status==='done'?' done':''}" value="${esc(s.name)}" placeholder="Step...">
              <div style="display:flex;gap:4px;margin-top:3px;flex-wrap:wrap;">
                <input type="date" class="branch-step-date" value="${s.dueDate||''}">
                <button class="step-attach-btn${(s.attachments||[]).length?' has-attach':''}" style="font-size:10px;padding:1px 5px;">📎${(s.attachments||[]).length||''}</button>
              </div>
            </div>
            <button class="branch-step-del">✕</button>
          </div>`
        ).join('')}
      </div>
      <button class="add-branch-step-btn">+ Step</button>
    `;
    el.querySelector('.branch-name-input').addEventListener('input', e => { branch.name = e.target.value; });

    el.querySelectorAll('.branch-step').forEach(stepEl => {
      const sIdx = parseInt(stepEl.dataset.si);
      const s = branch.steps[sIdx];
      if (!s) return;
      stepEl.querySelector('.step-status-btn').addEventListener('click', () => {
        const cyc = {pending:'active', active:'done', done:'pending'};
        s.status = cyc[s.status] || 'pending';
        stepEl.querySelector('.step-status-btn').dataset.status = s.status;
        stepEl.querySelector('.branch-step-name').classList.toggle('done', s.status==='done');
      });
      stepEl.querySelector('.branch-step-name').addEventListener('input', e => { s.name = e.target.value; });
      stepEl.querySelector('.branch-step-date').addEventListener('change', e => { s.dueDate = e.target.value || null; });
      stepEl.querySelector('.step-attach-btn').addEventListener('click', () => _openStepAttach(s));
      stepEl.querySelector('.branch-step-del').addEventListener('click', () => {
        branch.steps.splice(sIdx, 1); _renderSteps();
      });
    });

    el.querySelector('.add-branch-step-btn').addEventListener('click', () => {
      branch.steps.push(migrateStep({ id:uid(), type:'step', name:'New step', status:'pending' }));
      _renderSteps();
    });
    return el;
  }

  function _initStepDnD(container) {
    let dragIdx = null;
    container.querySelectorAll('.step-item[draggable]').forEach(el => {
      el.addEventListener('dragstart', e => {
        dragIdx = parseInt(el.dataset.stepIdx);
        el.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        container.querySelectorAll('.drag-over-top').forEach(x => x.classList.remove('drag-over-top'));
      });
      el.addEventListener('dragover', e => {
        e.preventDefault(); e.stopPropagation();
        if (dragIdx === null) return;
        const ti = parseInt(el.dataset.stepIdx);
        if (ti !== dragIdx) el.classList.add('drag-over-top');
      });
      el.addEventListener('dragleave', e => {
        if (!el.contains(e.relatedTarget)) el.classList.remove('drag-over-top');
      });
      el.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        el.classList.remove('drag-over-top');
        const ti = parseInt(el.dataset.stepIdx);
        if (dragIdx === null || dragIdx === ti) return;
        const moved = _task.steps.splice(dragIdx, 1)[0];
        _task.steps.splice(ti, 0, moved);
        dragIdx = null;
        _renderSteps();
      });
    });
  }

  /* ─── TASK ATTACHMENTS ────────────────────────── */
  function _bindAttachZones() {
    const inp = document.getElementById('attach-input');
    inp.value = '';
    const newInp = inp.cloneNode(true);
    inp.parentNode.replaceChild(newInp, inp);
    newInp.addEventListener('change', e => {
      Array.from(e.target.files).forEach(f => _addFileToTask(f));
      e.target.value = '';
    });

    const zone = document.getElementById('attach-zone');
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.classList.remove('drag-over');
      Array.from(e.dataTransfer.files).forEach(f => _addFileToTask(f));
    });
  }

  function _addFileToTask(file) {
    _readFile(file, (id) => {
      if (!_task.attachments) _task.attachments = [];
      _task.attachments.push({ id, name:file.name, type:file.type, size:file.size });
      _renderTaskAttachList();
    });
  }

  function _renderTaskAttachList() {
    const list = document.getElementById('attach-list');
    list.innerHTML = _attachItemsHtml(_task.attachments||[]);
    list.querySelectorAll('[data-del-attach]').forEach(btn => {
      btn.addEventListener('click', () => {
        const aid = btn.dataset.delAttach;
        Store.deleteAttachment(aid);
        _task.attachments = (_task.attachments||[]).filter(a => a.id !== aid);
        _renderTaskAttachList();
      });
    });
  }

  /* ─── STEP ATTACHMENTS ────────────────────────── */
  function _openStepAttach(step) {
    _stepAttachStep = step;
    document.getElementById('step-attach-title').textContent = step.name;
    _renderStepAttachList();
    document.getElementById('step-attach-overlay').classList.remove('hidden');
  }

  function _addFileToStep(file) {
    if (!_stepAttachStep) return;
    _readFile(file, (id) => {
      if (!_stepAttachStep.attachments) _stepAttachStep.attachments = [];
      _stepAttachStep.attachments.push({ id, name:file.name, type:file.type, size:file.size });
      _renderStepAttachList();
      _renderSteps();
    });
  }

  function _renderStepAttachList() {
    if (!_stepAttachStep) return;
    const list = document.getElementById('step-attach-list');
    list.innerHTML = _attachItemsHtml(_stepAttachStep.attachments||[]);
    list.querySelectorAll('[data-del-attach]').forEach(btn => {
      btn.addEventListener('click', () => {
        const aid = btn.dataset.delAttach;
        Store.deleteAttachment(aid);
        _stepAttachStep.attachments = (_stepAttachStep.attachments||[]).filter(a => a.id !== aid);
        _renderStepAttachList();
        _renderSteps();
      });
    });
  }

  function _closeLightbox() {
    const lb = document.getElementById('img-lightbox');
    lb.classList.add('hidden');
    document.getElementById('lightbox-img').src = '';
  }

  /* ─── HELPERS ─────────────────────────────────── */
  function _readFile(file, cb) {
    const reader = new FileReader();
    reader.onload = e => {
      const id = uid();
      if (Store.saveAttachment(id, e.target.result)) cb(id);
    };
    reader.readAsDataURL(file);
  }

  function _attachItemsHtml(attachments) {
    return (attachments||[]).map(a => {
      const isImg = (a.type||'').startsWith('image/');
      const isPdf = a.name.toLowerCase().endsWith('.pdf');
      const isEmail = /\.(eml|msg)$/i.test(a.name);
      const dataUrl = Store.getAttachment(a.id);
      const icon = isPdf ? '📄' : isEmail ? '📧' : '📁';
      const thumbHtml = isImg && dataUrl
        ? `<img class="attach-thumb" src="${dataUrl}" alt="${esc(a.name)}"
               data-lightbox="${a.id}" title="คลิกดูรูปเต็ม" style="cursor:zoom-in">`
        : `<div class="attach-icon">${icon}</div>`;
      return `
        <div class="attach-item">
          ${thumbHtml}
          <div class="attach-info">
            <div class="attach-name" title="${esc(a.name)}">${esc(a.name)}</div>
            <div class="attach-size">${fmtBytes(a.size||0)}</div>
          </div>
          <button class="attach-del" data-del-attach="${a.id}">✕</button>
        </div>`;
    }).join('');
  }

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
    return (b/1048576).toFixed(1) + ' MB';
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─── PASTE HANDLER ───────────────────────────── */
  function handlePaste(e) {
    const stepOverlay = document.getElementById('step-attach-overlay');
    const taskOverlay = document.getElementById('modal-overlay');
    if (stepOverlay.classList.contains('hidden') && taskOverlay.classList.contains('hidden')) return;

    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;
        if (!stepOverlay.classList.contains('hidden') && _stepAttachStep) {
          _addFileToStep(file);
        } else if (!taskOverlay.classList.contains('hidden')) {
          _addFileToTask(file);
        }
      }
    }
  }

  return { open, close, save, bindEvents, handlePaste, getTask, getTaskId };
})();

/* ─── COLOR PICKER ────────────────────────────── */
const ColorPicker = (() => {
  let _cb = null;

  function show(anchor, currentColor, cb) {
    _cb = cb;
    const pop = document.getElementById('color-popover');
    const grid = document.getElementById('color-grid');
    grid.innerHTML = PRESET_COLORS.map(c =>
      `<div class="color-swatch${c===currentColor?' selected':''}"
            style="background:${c||'#fff'};${!c?'border:1px dashed #ccc':''}"
            data-color="${c||''}"></div>`
    ).join('');
    grid.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => _apply(sw.dataset.color || null));
    });
    const customInp = document.getElementById('custom-color');
    customInp.value = currentColor || '#888780';
    customInp.oninput = e => _apply(e.target.value);
    document.getElementById('color-clear').onclick = () => _apply(null);

    const rect = anchor.getBoundingClientRect();
    pop.style.left = Math.min(rect.left, window.innerWidth-190) + 'px';
    pop.style.top  = (rect.bottom + 4) + 'px';
    pop.classList.remove('hidden');
    setTimeout(() => document.addEventListener('click', _outside, { once:true }), 50);
  }

  function _apply(color) {
    if (_cb) _cb(color);
    hide();
  }

  function hide() {
    document.getElementById('color-popover').classList.add('hidden');
    document.removeEventListener('click', _outside);
  }

  function _outside(e) {
    if (!document.getElementById('color-popover').contains(e.target)) hide();
  }

  return { show, hide };
})();

/* ─── TAG PICKER ──────────────────────────────── */
const TagPicker = (() => {
  let _onToggle = null;
  let _currentTags = [];

  function show(anchor, currentTags, onToggle) {
    _onToggle = onToggle;
    _currentTags = [...(currentTags||[])];
    _render();
    const picker = document.getElementById('tag-picker');
    const rect = anchor.getBoundingClientRect();
    picker.style.left = Math.min(rect.left, window.innerWidth-230) + 'px';
    picker.style.top  = (rect.bottom + 4) + 'px';
    picker.classList.remove('hidden');
    setTimeout(() => document.addEventListener('click', _outside, { once:true }), 50);
  }

  function _render() {
    const list = document.getElementById('tag-picker-list');
    const tags = Store.getTags();
    if (tags.length === 0) {
      list.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:12px">ยังไม่มี Tag</div>';
      return;
    }
    list.innerHTML = tags.map(t => `
      <div class="tag-picker-item${_currentTags.includes(t.id)?' selected':''}" data-tag-id="${t.id}">
        <span class="tag-picker-swatch" style="background:${t.color}"></span>
        <span>${esc(t.name)}</span>
        ${_currentTags.includes(t.id) ? '<span style="margin-left:auto">✓</span>' : ''}
      </div>`
    ).join('');
    list.querySelectorAll('[data-tag-id]').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        const tid = item.dataset.tagId;
        if (_onToggle) _onToggle(tid);
        if (_currentTags.includes(tid)) {
          _currentTags = _currentTags.filter(id => id !== tid);
        } else {
          _currentTags = [..._currentTags, tid];
        }
        _render();
      });
    });
  }

  function hide() {
    document.getElementById('tag-picker').classList.add('hidden');
    document.removeEventListener('click', _outside);
  }

  function _outside(e) {
    const el = document.getElementById('tag-picker');
    if (!el.contains(e.target)) hide();
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { show, hide };
})();
