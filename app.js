const App = (() => {
  let _filters = { search:'', priority:'', tag:'', sort:'default' };

  function init() {
    Store.init();
    Modal.bindEvents();
    document.addEventListener('paste', Modal.handlePaste);
    Board.render();
    _bindTabs();
    _bindFilters();
    _bindTagManager();
    _bindAddGroup();
    _populateTagFilter();
  }

  function getFilters() { return { ..._filters }; }

  /* ─── TABS ────────────────────────────────────── */
  function _bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        document.getElementById('view-board').classList.toggle('hidden', view !== 'board');
        document.getElementById('view-dashboard').classList.toggle('hidden', view !== 'dashboard');
        if (view === 'dashboard') Dashboard.render(_filters);
      });
    });
  }

  /* ─── FILTERS ─────────────────────────────────── */
  function _bindFilters() {
    let timer;
    document.getElementById('search-input').addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => { _filters.search = e.target.value; _rerender(); }, 220);
    });

    document.getElementById('filter-priority').addEventListener('change', e => {
      _filters.priority = e.target.value; _rerender();
    });

    document.getElementById('filter-tag').addEventListener('change', e => {
      _filters.tag = e.target.value; _rerender();
    });

    document.getElementById('sort-select').addEventListener('change', e => {
      _filters.sort = e.target.value; _rerender();
    });

    document.getElementById('btn-add-task').addEventListener('click', () => {
      const groups = Store.getGroups();
      if (!groups.length) return;
      const id = Store.addTask(groups[0].id);
      Board.render();
      Modal.open(id);
    });

    document.getElementById('btn-manage-tags').addEventListener('click', () => {
      _renderTagManagerList();
      document.getElementById('tag-manager-overlay').classList.remove('hidden');
    });

    document.getElementById('btn-add-group').addEventListener('click', () => {
      document.getElementById('new-group-name').value = '';
      document.getElementById('add-group-overlay').classList.remove('hidden');
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Reset ข้อมูลทั้งหมดกลับเป็น Default?\nข้อมูลที่แก้ไขและ Attachments จะหายทั้งหมด')) {
        Store.reset();
        _filters = { search:'', priority:'', tag:'', sort:'default' };
        document.getElementById('search-input').value = '';
        document.getElementById('filter-priority').value = '';
        document.getElementById('filter-tag').value = '';
        document.getElementById('sort-select').value = 'default';
        _populateTagFilter();
        Board.render();
        if (!document.getElementById('view-dashboard').classList.contains('hidden')) {
          Dashboard.render(_filters);
        }
      }
    });
  }

  function _rerender() {
    Board.setFilters(_filters);
    if (!document.getElementById('view-dashboard').classList.contains('hidden')) {
      Dashboard.render(_filters);
    }
  }

  function _populateTagFilter() {
    const sel = document.getElementById('filter-tag');
    const saved = sel.value;
    sel.innerHTML = '<option value="">Tags ทั้งหมด</option>' +
      Store.getTags().map(t => `<option value="${t.id}"${t.id===saved?' selected':''}>${esc(t.name)}</option>`).join('');
  }

  /* ─── TAG MANAGER ─────────────────────────────── */
  function _bindTagManager() {
    document.getElementById('close-tag-manager').addEventListener('click', _closeTagManager);
    document.getElementById('tag-manager-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('tag-manager-overlay')) _closeTagManager();
    });
    document.getElementById('btn-create-tag').addEventListener('click', () => {
      const name = document.getElementById('new-tag-name').value.trim();
      const color = document.getElementById('new-tag-color').value;
      if (!name) return;
      Store.addTag(name, color);
      document.getElementById('new-tag-name').value = '';
      _renderTagManagerList();
    });
    document.getElementById('new-tag-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-create-tag').click();
    });
    document.getElementById('go-manage-tags').addEventListener('click', () => {
      TagPicker.hide();
      _renderTagManagerList();
      document.getElementById('tag-manager-overlay').classList.remove('hidden');
    });
  }

  function _closeTagManager() {
    document.getElementById('tag-manager-overlay').classList.add('hidden');
    _populateTagFilter();
    Board.render();
  }

  function _renderTagManagerList() {
    const list = document.getElementById('tag-manager-list');
    const tags = Store.getTags();
    if (tags.length === 0) {
      list.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:4px">ยังไม่มี Tag</div>';
      return;
    }
    list.innerHTML = tags.map(t => `
      <div class="tag-manager-item">
        <span class="tag-manager-swatch" style="background:${t.color}"></span>
        <span class="tag-manager-name">${esc(t.name)}</span>
        <input type="color" value="${t.color}" data-tag-color="${t.id}">
        <button class="tag-manager-del" data-del-tag="${t.id}">🗑</button>
      </div>`
    ).join('');
    list.querySelectorAll('[data-del-tag]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('ลบ Tag "' + btn.closest('.tag-manager-item').querySelector('.tag-manager-name').textContent + '"?')) {
          Store.deleteTag(btn.dataset.delTag);
          _renderTagManagerList();
        }
      });
    });
    list.querySelectorAll('[data-tag-color]').forEach(inp => {
      inp.addEventListener('change', e => {
        Store.updateTag(inp.dataset.tagColor, { color: e.target.value });
        inp.previousElementSibling.style.background = e.target.value;
      });
    });
  }

  /* ─── ADD GROUP ───────────────────────────────── */
  function _bindAddGroup() {
    document.getElementById('close-add-group').addEventListener('click', () => {
      document.getElementById('add-group-overlay').classList.add('hidden');
    });
    document.getElementById('add-group-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('add-group-overlay'))
        document.getElementById('add-group-overlay').classList.add('hidden');
    });
    document.getElementById('btn-create-group').addEventListener('click', () => {
      const name = document.getElementById('new-group-name').value.trim();
      const color = document.getElementById('new-group-color').value;
      if (!name) return;
      Store.addGroup(name, color);
      document.getElementById('add-group-overlay').classList.add('hidden');
      Board.render();
    });
    document.getElementById('new-group-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-create-group').click();
    });
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, getFilters };
})();

document.addEventListener('DOMContentLoaded', App.init);
