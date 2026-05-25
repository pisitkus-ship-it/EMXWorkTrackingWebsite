const Dashboard = (() => {
  const BUCKETS = [
    { key:'overdue',   label:'🔴 Overdue',      cls:'bucket-overdue' },
    { key:'today',     label:'🟡 Today',         cls:'bucket-today' },
    { key:'tomorrow',  label:'🔵 Tomorrow',      cls:'bucket-tomorrow' },
    { key:'week',      label:'📅 สัปดาห์นี้ (7 วัน)', cls:'' },
    { key:'month',     label:'📆 เดือนนี้',       cls:'' },
    { key:'later',     label:'🗓 Later',         cls:'' },
    { key:'no-date',   label:'❓ ยังไม่ได้กำหนด', cls:'' }
  ];

  function render(filters) {
    const el = document.getElementById('dashboard-content');
    const tasks = Store.getAllFilteredTasks(filters || {});

    // Group by bucket
    const bucketMap = {};
    BUCKETS.forEach(b => { bucketMap[b.key] = []; });
    tasks.forEach(t => {
      const b = getDueBucket(t.dueDate);
      if (bucketMap[b]) bucketMap[b].push(t);
    });

    el.innerHTML = '';

    // Summary bar
    const total = tasks.length;
    const done = tasks.filter(t => {
      const p = calcProgress(t.steps);
      return p.total > 0 && p.done === p.total;
    }).length;
    const overdue = bucketMap['overdue'].length;
    const today = bucketMap['today'].length;

    const summaryEl = document.createElement('div');
    summaryEl.style.cssText = 'display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;';
    summaryEl.innerHTML = [
      statCard('📋 ทั้งหมด', total, '#185FA5'),
      statCard('🔴 Overdue', overdue, overdue>0?'#D85A30':'#888780'),
      statCard('🟡 Today', today, today>0?'#BA7517':'#888780'),
      statCard('✅ เสร็จแล้ว', done, '#1D9E75'),
    ].join('');
    el.appendChild(summaryEl);

    BUCKETS.forEach(bucket => {
      const bTasks = bucketMap[bucket.key];
      if (bTasks.length === 0) return;

      const section = document.createElement('div');
      section.className = 'dash-bucket ' + bucket.cls;
      section.innerHTML = `
        <div class="dash-bucket-hdr">
          ${bucket.label}
          <span class="bucket-count">${bTasks.length} งาน</span>
        </div>
        <div class="dash-tasks">
          ${bTasks.map(t => renderDashCard(t)).join('')}
        </div>
      `;
      el.appendChild(section);

      // bind clicks
      section.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('click', () => Modal.open(card.dataset.taskId));
      });
    });

    if (el.children.length <= 1) {
      const empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:60px;color:var(--text-muted);';
      empty.textContent = 'ไม่มีงานที่ตรงกับ Filter';
      el.appendChild(empty);
    }
  }

  function statCard(label, value, color) {
    return `
      <div style="background:white;border-radius:10px;padding:14px 20px;
                  border-left:4px solid ${color};box-shadow:var(--shadow-sm);min-width:120px;">
        <div style="font-size:22px;font-weight:800;color:${color}">${value}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${label}</div>
      </div>
    `;
  }

  function renderDashCard(task) {
    const group = Store.getGroup(task.groupId);
    const cardColor = task.color || (group ? group.color : '#888780');
    const p = calcProgress(task.steps);
    const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    const dueCls = dueDateClass(task.dueDate);
    const tags = (task.tags||[]).map(tid => {
      const tag = Store.getTag(tid);
      return tag ? `<span class="tag-chip" style="background:${tag.color}">${escHtml(tag.name)}</span>` : '';
    }).join('');

    return `
      <div class="task-card" data-task-id="${task.id}"
           style="--card-color:${cardColor};cursor:pointer">
        <div class="card-title">${escHtml(task.name)}</div>
        <div class="card-meta">
          ${task.dueDate
            ? `<span class="card-duedate ${dueCls}">${dueDateLabel(task.dueDate)}</span>`
            : ''}
          ${group ? `<span style="font-size:11px;color:${group.color};font-weight:600">${escHtml(group.name)}</span>` : ''}
          ${tags ? `<div class="card-tags">${tags}</div>` : ''}
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

  function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render };
})();
