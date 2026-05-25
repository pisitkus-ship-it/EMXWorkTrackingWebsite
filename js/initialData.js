const INITIAL_DATA = {
  groups: [
    { id: "g-urgent", name: "Urgent Today",    color: "#D85A30" },
    { id: "g-high",   name: "High Priority",   color: "#BA7517" },
    { id: "g-active", name: "In Progress",     color: "#185FA5" },
    { id: "g-future", name: "Future / Pending",color: "#888780" },
    { id: "g-done",   name: "Completed",       color: "#1D9E75" }
  ],
  tags: [],
  tasks: [
    {
      id:"t1", name:"TBE ส่งให้หมด + DDR ที่เหลือ",
      groupId:"g-urgent", priority:"urgent", dueDate:"2026-05-22",
      tags:[], color:null, attachments:[],
      notes:"KPI: TBE ≤ 3 วัน, DDR ≤ 2 วัน — ต้องเคลียร์วันนี้",
      steps:[
        { id:"s1", type:"step", name:"Clear งาน DDR ที่ยังค้างแล้วเป็น Not start", status:"pending", dueDate:null, attachments:[] },
        { id:"sg0", type:"parallel", branches:[
          { id:"_0h7icfd", name:"Valve สั่งมา Spec ไม่ตรงเพราะ TBE ผิดฉบับ", steps:[
            { id:"_iftjrnp", type:"step", name:"OC02 PO. 3400057667 ==> (INSP Report no. SIT2026-066)", status:"pending", dueDate:null, attachments:[] },
            { id:"_06gyfpq", type:"step", name:"ส่งขอ Technical information จากพี่ติ๋ม", status:"pending", dueDate:null, attachments:[] }
          ]},
          { id:"_9rofbe3", name:"Branch B", steps:[
            { id:"_g1nu2ls", type:"step", name:"PO3400061889", status:"pending", dueDate:null, attachments:[] },
            { id:"_hbnqrt3", type:"step", name:"ส่งไฟล์ Cer3.1แบบ Full ของ GMS ให้ Thomasmade เช็คให้", status:"pending", dueDate:null, attachments:[] }
          ]}
        ]},
        { id:"_yo36vqt", type:"step", name:"Review list งาน TBE ที่ยังค้าง", status:"pending", dueDate:null, attachments:[] },
        { id:"sg1", type:"parallel", branches:[
          { id:"b1", name:"TBE Track", steps:[
            { id:"bs1", type:"step", name:"ให้ AI ช่วยกรอก TBE ให้", status:"active", dueDate:null, attachments:[] },
            { id:"bs2", type:"step", name:"Review", status:"pending", dueDate:null, attachments:[] }
          ]},
          { id:"b2", name:"DDR Track", steps:[
            { id:"bs3", type:"step", name:"ให้ AI Gen reason file ให้", status:"active", dueDate:null, attachments:[] },
            { id:"bs4", type:"step", name:"Review", status:"pending", dueDate:null, attachments:[] }
          ]}
        ]},
        { id:"s3", type:"step", name:"Submit ทั้ง TBE + DDR ให้ครบ", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t2", name:"เช็ค Spare งาน PSD ใน SAP",
      groupId:"g-urgent", priority:"urgent", dueDate:null,
      tags:[], color:null, attachments:[],
      notes:"กลัวเบิกของไม่ทัน — ต้องรีบเช็กก่อนอื่น",
      steps:[
        { id:"s10", type:"step", name:"เข้า SAP เช็ค Material อยู่ใน Stock ไหม", status:"active", dueDate:null, attachments:[] },
        { id:"s11", type:"step", name:"Confirm Lead Time vs วันที่ต้องการ", status:"pending", dueDate:null, attachments:[] },
        { id:"s12", type:"step", name:"ออก PR/PO ถ้าต้องสั่งซื้อ", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t3", name:"สไลด์ให้พี่ SAN",
      groupId:"g-high", priority:"high", dueDate:"2026-05-22",
      tags:[], color:null, attachments:[],
      notes:"AI gen structure ไว้แล้ว — ต้องเข้าไปเติม content + ตรวจทาน",
      steps:[
        { id:"s20", type:"step", name:"AI generate slide structure", status:"done", dueDate:null, attachments:[] },
        { id:"s21", type:"step", name:"เติม Content + ข้อมูลจริง", status:"active", dueDate:null, attachments:[] },
        { id:"s22", type:"step", name:"ตรวจทาน + จัด Format", status:"pending", dueDate:null, attachments:[] },
        { id:"s23", type:"step", name:"ส่งให้พี่ SAN", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t4", name:"เบิกเงินก่อนสิ้นเดือน",
      groupId:"g-high", priority:"high", dueDate:"2026-05-31",
      tags:[], color:null, attachments:[], notes:"",
      steps:[
        { id:"s30", type:"step", name:"เตรียมเอกสาร Claim", status:"active", dueDate:null, attachments:[] },
        { id:"s31", type:"step", name:"Submit ผ่านระบบ", status:"pending", dueDate:null, attachments:[] },
        { id:"s32", type:"step", name:"รอ Approval", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t5", name:"งาน Stock others — ส่งให้ Stock Team",
      groupId:"g-high", priority:"high", dueDate:"2026-05-31",
      tags:[], color:null, attachments:[],
      notes:"Type \"others\" ใน List",
      steps:[
        { id:"s40", type:"step", name:"รวบรวมข้อมูล Stock others", status:"active", dueDate:null, attachments:[] },
        { id:"s41", type:"step", name:"Review + Verify", status:"pending", dueDate:null, attachments:[] },
        { id:"s42", type:"step", name:"ส่งให้ Stock Team", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"_yfhyoue", name:"GBN PSD",
      groupId:"g-high", priority:"high", dueDate:"2026-05-31",
      tags:[], color:null, attachments:[], notes:"",
      steps:[
        { id:"_bxw5khm", type:"step", name:"New step", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t6", name:"เคลียร์ Folder Training",
      groupId:"g-active", priority:"medium", dueDate:null,
      tags:[], color:null, attachments:[],
      notes:"เหลือขั้นตอนสุดท้าย — ทำหน้าปก Hyperlink",
      steps:[
        { id:"s50", type:"step", name:"จัด Structure Folder", status:"done", dueDate:null, attachments:[] },
        { id:"s51", type:"step", name:"Upload Content ทุก Sub-folder", status:"done", dueDate:null, attachments:[] },
        { id:"s52", type:"step", name:"สร้างหน้าปก Hyperlink สำหรับ Access", status:"active", dueDate:null, attachments:[] },
        { id:"s53", type:"step", name:"Test ลิงก์ทุกอัน", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t7", name:"คุยพี่สด — Plan ไป GBN June",
      groupId:"g-active", priority:"medium", dueDate:null,
      tags:[], color:null, attachments:[],
      notes:"ต้องถาม detail ว่าต้องเตรียมอะไรบ้าง",
      steps:[
        { id:"s60", type:"step", name:"นัด Meeting กับพี่สด", status:"active", dueDate:null, attachments:[] },
        { id:"s61", type:"step", name:"สอบถาม Scope งาน + ของที่ต้องเตรียม", status:"pending", dueDate:null, attachments:[] },
        { id:"s62", type:"step", name:"จัด Checklist ก่อนไป GBN", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t8", name:"เช็ค MESC ให้พี่เจริญ",
      groupId:"g-active", priority:"medium", dueDate:null,
      tags:[], color:null, attachments:[], notes:"",
      steps:[
        { id:"s70", type:"step", name:"เช็ค MESC Code ใน System", status:"active", dueDate:null, attachments:[] },
        { id:"s71", type:"step", name:"Report ผลให้พี่เจริญ", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"_3l2xpq7", name:"ทำ MOM ให้ S1",
      groupId:"g-active", priority:"high", dueDate:"2026-05-22",
      tags:[], color:null, attachments:[], notes:"",
      steps:[
        { id:"_x8aax0w", type:"step", name:"ส่ง Excel แบ่งงาน", status:"pending", dueDate:null, attachments:[] },
        { id:"_eqjy17p", type:"step", name:"ส่ง Vendor contact", status:"pending", dueDate:null, attachments:[] },
        { id:"_x7grbzl", type:"step", name:"MOM ของมีตติ้งเมื่อเช้า", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t9", name:"Milestone Lean Stock ให้พี่เอ",
      groupId:"g-future", priority:"low", dueDate:"2026-06-10",
      tags:[], color:null, attachments:[],
      notes:"ต้องคุยกับ Digital Team ก่อนว่าสรุปจะให้ทำยังไง",
      steps:[
        { id:"s80", type:"step", name:"นัดคุย Digital Team", status:"active", dueDate:null, attachments:[] },
        { id:"s81", type:"step", name:"Confirm Scope + Approach", status:"pending", dueDate:null, attachments:[] },
        { id:"s82", type:"step", name:"จัด Milestone Document", status:"pending", dueDate:null, attachments:[] },
        { id:"s83", type:"step", name:"ส่งให้พี่เอ", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t10", name:"Clean Data Valveberry ก่อน Go-live",
      groupId:"g-future", priority:"low", dueDate:"2026-06-01",
      tags:[], color:null, attachments:[],
      notes:"ไม่เร่งด่วนแต่ควรทำก่อน Go-live",
      steps:[
        { id:"s90", type:"step", name:"Audit ข้อมูลที่มีใน Valveberry", status:"active", dueDate:null, attachments:[] },
        { id:"s91", type:"step", name:"Clean / Correct ข้อมูลผิดพลาด", status:"pending", dueDate:null, attachments:[] },
        { id:"s92", type:"step", name:"Verify + Confirm พร้อม Go-live", status:"pending", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t11", name:"เช็ครายชื่อ Valve GBN ให้พี่อ๋อง",
      groupId:"g-done", priority:"low", dueDate:null,
      tags:[], color:null, attachments:[], notes:"",
      steps:[
        { id:"sd1", type:"step", name:"รวบรวมรายชื่อ Valve GBN", status:"done", dueDate:null, attachments:[] },
        { id:"sd2", type:"step", name:"ส่งให้พี่อ๋อง", status:"done", dueDate:null, attachments:[] }
      ]
    },
    {
      id:"t12", name:"คุยพี่ตูน — ART Memguard Valve Correlation",
      groupId:"g-done", priority:"low", dueDate:null,
      tags:[], color:null, attachments:[],
      notes:"KPI: ART Memguard Valve on track",
      steps:[
        { id:"sd3", type:"step", name:"เตรียม Data Correlation", status:"done", dueDate:null, attachments:[] },
        { id:"sd4", type:"step", name:"ประชุม + ตกลง Approach กับพี่ตูน", status:"done", dueDate:null, attachments:[] }
      ]
    }
  ]
};

const PRESET_COLORS = [
  "#D85A30","#BA7517","#185FA5","#1D9E75",
  "#888780","#8B5CF6","#EC4899","#06B6D4",
  "#F59E0B","#EF4444","#10B981","#6366F1"
];

function calcProgress(steps) {
  let total = 0, done = 0;
  (steps || []).forEach(s => {
    if (s.type === 'parallel') {
      (s.branches || []).forEach(b => {
        (b.steps || []).forEach(bs => { total++; if (bs.status === 'done') done++; });
      });
    } else {
      total++;
      if (s.status === 'done') done++;
    }
  });
  return { total, done };
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function dueDateClass(iso) {
  if (!iso) return '';
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(iso + 'T00:00:00');
  const diff = Math.floor((d - today) / 86400000);
  if (diff < 0)  return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 3)  return 'soon';
  return 'normal';
}

function dueDateLabel(iso) {
  if (!iso) return '';
  const cls = dueDateClass(iso);
  if (cls === 'overdue') return '🔴 ' + formatDate(iso);
  if (cls === 'today')   return '🟡 Today';
  if (cls === 'soon')    return '🔵 ' + formatDate(iso);
  return '📅 ' + formatDate(iso);
}

function getDueBucket(iso) {
  if (!iso) return 'no-date';
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(iso + 'T00:00:00');
  const diff = Math.floor((d - today) / 86400000);
  if (diff < 0)   return 'overdue';
  if (diff === 0)  return 'today';
  if (diff === 1)  return 'tomorrow';
  if (diff <= 7)   return 'week';
  if (diff <= 30)  return 'month';
  return 'later';
}

function uid() {
  return '_' + Math.random().toString(36).slice(2, 9);
}

function migrateStep(step) {
  if (!step) return step;
  if (step.type === 'parallel') {
    return {
      ...step,
      branches: (step.branches || []).map(b => ({
        ...b,
        steps: (b.steps || []).map(migrateStep)
      }))
    };
  }
  return {
    type: 'step',
    dueDate: null,
    attachments: [],
    notes: '',
    ...step
  };
}

function migrateTask(t) {
  return {
    tags: [],
    color: null,
    attachments: [],
    createdAt: Date.now(),
    notes: '',
    ...t,
    steps: (t.steps || []).map(migrateStep)
  };
}
