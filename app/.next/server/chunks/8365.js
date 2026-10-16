"use strict";exports.id=8365,exports.ids=[8365],exports.modules={2616:(a,b,c)=>{c.d(b,{Ll:()=>f,Qb:()=>g,Vu:()=>h});var d=c(76760),e=c.n(d);function f(){return process.env.QUIZ_DB_PATH||e().join(process.cwd(),"data","quiz","quiz.db")}function g(){return process.env.QUIZ_SEED_DIR||e().join(process.cwd(),"public","data","quiz")}function h(){return e().dirname(f())}},24277:(a,b,c)=>{c.d(b,{Y:()=>j});var d=c(73024),e=c(87550),f=c.n(e);let g=`
CREATE TABLE IF NOT EXISTS quiz_subjects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  code        TEXT,
  icon        TEXT,
  color       TEXT,
  position    INTEGER DEFAULT 0,
  curso       INTEGER,
  cuatrimestre INTEGER,
  entry_mode  TEXT NOT NULL DEFAULT 'standard',
  materials_json TEXT,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id    TEXT NOT NULL REFERENCES quiz_subjects(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  q             TEXT NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'choice',
  options_json  TEXT NOT NULL DEFAULT '[]',
  correct_json  TEXT NOT NULL DEFAULT 'null',
  accept_json   TEXT,
  cuatrimestre  INTEGER,
  context       TEXT,
  code          TEXT,
  is_vocab      INTEGER DEFAULT 0,
  category      TEXT,
  evidence      TEXT,
  hint          TEXT,
  explanation_correct TEXT,
  explanation_wrong   TEXT,
  group_name    TEXT,
  image         TEXT
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id      TEXT NOT NULL,
  client_id       TEXT NOT NULL,
  score_pct       INTEGER NOT NULL,
  correct         INTEGER NOT NULL,
  incorrect       INTEGER NOT NULL,
  unanswered      INTEGER NOT NULL,
  total           INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  finished_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_seed_state (
  subject_id   TEXT PRIMARY KEY,
  file_mtime   INTEGER NOT NULL,
  seeded_at    INTEGER NOT NULL,
  question_count INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_subject ON quiz_questions(subject_id, position);
CREATE INDEX IF NOT EXISTS idx_quiz_results_client    ON quiz_results(client_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_subject   ON quiz_results(subject_id, finished_at DESC);
`;var h=c(2616);let i=null;function j(){if(i)return i;(0,d.mkdirSync)((0,h.Vu)(),{recursive:!0});let a=new(f())((0,h.Ll)());a.pragma("journal_mode = WAL"),a.pragma("foreign_keys = ON"),a.exec(g);let b=a.prepare("PRAGMA table_info(quiz_questions)").all(),c=a=>b.some(b=>b.name===a);c("kind")||a.exec("ALTER TABLE quiz_questions ADD COLUMN kind TEXT NOT NULL DEFAULT 'choice'"),c("accept_json")||a.exec("ALTER TABLE quiz_questions ADD COLUMN accept_json TEXT"),c("cuatrimestre")||a.exec("ALTER TABLE quiz_questions ADD COLUMN cuatrimestre INTEGER"),c("context")||a.exec("ALTER TABLE quiz_questions ADD COLUMN context TEXT"),c("evidence")||a.exec("ALTER TABLE quiz_questions ADD COLUMN evidence TEXT"),c("hint")||a.exec("ALTER TABLE quiz_questions ADD COLUMN hint TEXT"),c("explanation_correct")||a.exec("ALTER TABLE quiz_questions ADD COLUMN explanation_correct TEXT"),c("explanation_wrong")||a.exec("ALTER TABLE quiz_questions ADD COLUMN explanation_wrong TEXT"),c("group_name")||a.exec("ALTER TABLE quiz_questions ADD COLUMN group_name TEXT"),c("image")||a.exec("ALTER TABLE quiz_questions ADD COLUMN image TEXT");let e=a.prepare("PRAGMA table_info(quiz_subjects)").all(),j=a=>e.some(b=>b.name===a);return j("code")||a.exec("ALTER TABLE quiz_subjects ADD COLUMN code TEXT"),j("curso")||a.exec("ALTER TABLE quiz_subjects ADD COLUMN curso INTEGER"),j("cuatrimestre")||a.exec("ALTER TABLE quiz_subjects ADD COLUMN cuatrimestre INTEGER"),j("entry_mode")||a.exec("ALTER TABLE quiz_subjects ADD COLUMN entry_mode TEXT NOT NULL DEFAULT 'standard'"),j("materials_json")||a.exec("ALTER TABLE quiz_subjects ADD COLUMN materials_json TEXT"),i=a,a}},33106:(a,b,c)=>{c.d(b,{A:()=>o});var d=c(73024),e=c(76760),f=c.n(e),g=c(24277),h=c(2616),i=c(51309);async function j(){let a=f().join((0,h.Qb)(),"_subjects.json");return JSON.parse(await d.promises.readFile(a,"utf8")).map((a,b)=>({...i.v7.parse(a),position:a.position??b}))}async function k(a){try{return Math.floor((await d.promises.stat(a)).mtimeMs)}catch{return 0}}async function l(a,b){let c=f().join((0,h.Qb)(),`${b.id}.json`),e=await k(c);if(!e)return;let g=a.prepare("SELECT file_mtime FROM quiz_seed_state WHERE subject_id=?").get(b.id);if(g&&g.file_mtime===e)return;let j=await d.promises.readFile(c,"utf8"),l=i.rr.parse(JSON.parse(j));a.transaction(()=>{a.prepare("DELETE FROM quiz_questions WHERE subject_id=?").run(b.id),l.forEach((c,d)=>(function(a,b,c,d){let e="choice"===c.kind;a.prepare(`INSERT INTO quiz_questions
    (subject_id,position,q,kind,options_json,correct_json,accept_json,cuatrimestre,context,code,is_vocab,category,evidence,hint,explanation_correct,explanation_wrong,group_name,image)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(b,d,c.q,c.kind,e?JSON.stringify(c.options):"[]",e?JSON.stringify(c.correctIndex):"null",e?null:JSON.stringify(c.accept),c.cuatrimestre??null,c.context??null,c.code??null,+!!c.isVocab,c.category??null,c.evidence??null,c.hint??null,c.explanationCorrect??null,c.explanationWrong??null,c.group??null,c.image??null)})(a,b.id,c,d)),a.prepare(`INSERT INTO quiz_seed_state(subject_id,file_mtime,seeded_at,question_count)
                VALUES(?,?,?,?)
                ON CONFLICT(subject_id) DO UPDATE SET file_mtime=excluded.file_mtime,
                  seeded_at=excluded.seeded_at, question_count=excluded.question_count`).run(b.id,e,Date.now(),l.length)})()}async function m(){let a,b=(0,g.Y)();try{a=await j()}catch(a){return console.error("[quiz seed] _subjects.json invalid:",a),{subjects:0,ingested:[],errors:[{id:"_subjects.json",message:a.message}]}}let c=[],d=[];for(let e of a)try{b.prepare(`INSERT INTO quiz_subjects(id,name,description,code,icon,color,position,curso,cuatrimestre,entry_mode,materials_json,updated_at)
              VALUES(@id,@name,@description,@code,@icon,@color,@position,@curso,@cuatrimestre,@entry_mode,@materials_json,@updated_at)
              ON CONFLICT(id) DO UPDATE SET
                name=excluded.name, description=excluded.description,
                code=excluded.code,
                icon=excluded.icon, color=excluded.color,
                position=excluded.position, curso=excluded.curso,
                cuatrimestre=excluded.cuatrimestre,
                entry_mode=excluded.entry_mode,
                materials_json=excluded.materials_json,
                updated_at=excluded.updated_at`).run({...e,code:e.code??null,position:e.position??0,curso:e.curso??null,cuatrimestre:e.cuatrimestre??null,entry_mode:e.entryMode??"standard",materials_json:e.materials&&e.materials.length?JSON.stringify(e.materials):null,updated_at:Date.now()});let a=b.prepare("SELECT file_mtime FROM quiz_seed_state WHERE subject_id=?").get(e.id)?.file_mtime??0;await l(b,e),(b.prepare("SELECT file_mtime FROM quiz_seed_state WHERE subject_id=?").get(e.id)?.file_mtime??0)!==a&&c.push(e.id)}catch(a){console.error(`[quiz seed] subject "${e.id}" failed:`,a),d.push({id:e.id,message:a.message})}return{subjects:a.length,ingested:c,errors:d}}let n=null;function o(){return n||(n=m().then(()=>void 0).catch(a=>{throw n=null,a})),n}},37930:(a,b,c)=>{c.d(b,{UV:()=>l,ZY:()=>m,aE:()=>q,bB:()=>p,mL:()=>o});var d=c(73024),e=c(76760),f=c.n(e),g=c(24277),h=c(2616),i=c(51309);function j(a){try{let b=f().join((0,h.Qb)(),`${a}.json`),c=JSON.parse((0,d.readFileSync)(b,"utf8"));return i.rr.parse(c)}catch{return[]}}function k(a){return Array.from(new Set(a.map(a=>a.cuatrimestre??1))).sort((a,b)=>a-b)}function l(){let a=(0,g.Y)().prepare(`
    SELECT s.id, s.name, s.description, s.code, s.icon, s.color, s.position, s.curso, s.cuatrimestre, s.entry_mode, s.materials_json,
           (SELECT COUNT(*) FROM quiz_questions q WHERE q.subject_id=s.id) AS question_count,
           (SELECT GROUP_CONCAT(DISTINCT IFNULL(cuatrimestre, 1))
              FROM quiz_questions q WHERE q.subject_id=s.id) AS cuatrimestres_csv
    FROM quiz_subjects s
    ORDER BY s.curso ASC, s.position ASC, s.name ASC
  `).all();return 0===a.length?(function(){try{let a=f().join((0,h.Qb)(),"_subjects.json"),b=JSON.parse((0,d.readFileSync)(a,"utf8"));if(!Array.isArray(b))return[];return b.map((a,b)=>i.v7.parse({...a,position:a.position??b}))}catch{return[]}})().map(a=>{let b=j(a.id);return{...a,entryMode:a.entryMode??"standard",questionCount:b.length,cuatrimestres:k(b)}}):a.map(a=>{var b;let c=0===a.question_count?j(a.id):null;return{id:a.id,name:a.name,description:a.description??"",code:a.code??void 0,icon:a.icon??"\xf0Ÿ“\x9d",color:a.color??"#3a6ea5",position:a.position??0,curso:a.curso??void 0,cuatrimestre:a.cuatrimestre??void 0,entryMode:a.entry_mode??"standard",materials:function(a){if(a)try{let b=i.Be.array().parse(JSON.parse(a));return b.length?b:void 0}catch{return}}(a.materials_json),questionCount:a.question_count||c?.length||0,cuatrimestres:a.cuatrimestres_csv?(b=a.cuatrimestres_csv)?Array.from(new Set(b.split(",").map(a=>Number(a.trim())).filter(a=>Number.isFinite(a)))).sort():[]:k(c??[])}})}function m(a){return l().find(b=>b.id===a)??null}function n(a){let b={q:a.q,cuatrimestre:a.cuatrimestre??void 0,context:a.context??void 0,code:a.code??void 0,isVocab:!!a.is_vocab,category:a.category??void 0,evidence:a.evidence??void 0,hint:a.hint??void 0,explanationCorrect:a.explanation_correct??void 0,explanationWrong:a.explanation_wrong??void 0,group:a.group_name??void 0,image:a.image??void 0};return"fill"===a.kind?{...b,kind:"fill",accept:JSON.parse(a.accept_json??'""')}:{...b,kind:"choice",options:JSON.parse(a.options_json),correctIndex:JSON.parse(a.correct_json)}}function o(a){let b=(0,g.Y)().prepare(`SELECT q, kind, options_json, correct_json, accept_json,
      cuatrimestre, context, code, is_vocab, category, evidence,
      hint, explanation_correct, explanation_wrong, group_name, image
    FROM quiz_questions WHERE subject_id=? ORDER BY position ASC`).all(a),c=0===b.length?j(a):b.map(n);return"ingles"!==a?c:[...c,...function(){try{let a=f().join((0,h.Qb)(),"english-latest-test.json");return JSON.parse((0,d.readFileSync)(a,"utf8")).map(a=>{let b=a.respuestas.map(a=>a.texto),c=a.respuestas.findIndex(b=>b.letra.toLowerCase()===a.correcta.toLowerCase());return{kind:"choice",q:a.pregunta,options:b,correctIndex:c>=0?c:0,group:"latest-test"}})}catch{return[]}}()]}function p(a){let b=(0,g.Y)(),c=a.total?Math.round(a.correct/a.total*100):0;return Number(b.prepare(`INSERT INTO quiz_results
    (subject_id,client_id,score_pct,correct,incorrect,unanswered,total,duration_seconds,finished_at)
    VALUES(?,?,?,?,?,?,?,?,?)`).run(a.subjectId,a.clientId,c,a.correct,a.incorrect,a.unanswered,a.total,a.durationSeconds,Date.now()).lastInsertRowid)}function q(a,b=10){return(0,g.Y)().prepare(`SELECT subject_id AS subjectId, score_pct AS scorePct, correct, total,
    duration_seconds AS durationSeconds, finished_at AS finishedAt
    FROM quiz_results WHERE client_id=? ORDER BY finished_at DESC LIMIT ?`).all(a,b)}},51309:(a,b,c)=>{c.d(b,{Be:()=>e,Sx:()=>t,fS:()=>v,lV:()=>p,rr:()=>l,v7:()=>f});var d=c(87579);let e=d.Ik({title:d.Yj().min(1),url:d.Yj().min(1),icon:d.Yj().min(1).optional()}),f=d.Ik({id:d.Yj().regex(/^[a-z0-9-]+$/,"lowercase, dashes, digits only"),name:d.Yj().min(1),description:d.Yj().default(""),code:d.Yj().min(1).optional(),icon:d.Yj().default("\uD83D\uDCDD"),color:d.Yj().default("#3a6ea5"),position:d.ai().int().optional(),curso:d.ai().int().min(1).max(6).optional(),cuatrimestre:d.ai().int().min(1).max(2).optional(),entryMode:d.k5(["standard","hub"]).optional().default("standard"),materials:d.YO(e).optional()}),g=d.KC([d.ai().int().min(0),d.YO(d.ai().int().min(0)).min(1)]),h=d.KC([d.Yj().min(1),d.YO(d.Yj().min(1)).min(1)]),i={q:d.Yj().min(1),context:d.Yj().optional(),code:d.Yj().optional(),category:d.Yj().optional(),group:d.Yj().optional(),image:d.Yj().min(1).optional(),cuatrimestre:d.ai().int().min(1).max(2).optional(),isVocab:d.zM().optional(),sourceFile:d.Yj().min(1).optional(),sourceType:d.Yj().min(1).optional(),sourcePage:d.ai().int().min(1).optional(),sourceSlide:d.ai().int().min(1).optional(),evidence:d.Yj().min(1).optional(),hint:d.Yj().min(1).optional(),explanationCorrect:d.Yj().min(1).optional(),explanationWrong:d.Yj().min(1).optional()},j=d.Ik({...i,kind:d.eu("choice"),options:d.YO(d.Yj()).min(2).max(8),correctIndex:g}),k=d.Ik({...i,kind:d.eu("fill"),accept:h,hint:d.Yj().optional()}),l=d.YO(d.vk(a=>!a||"object"!=typeof a||"kind"in a?a:{...a,kind:"choice"},d.gM("kind",[j,k]))),m=d.Ik({id:d.Yj().min(1),title:d.Yj().min(1),sourceFile:d.Yj().min(1),sourceType:d.Yj().min(1),questionCount:d.ai().int().min(0).default(0)}),n=d.Ik({id:d.Yj().min(1),topic:d.ai().int().min(1),title:d.Yj().min(1),sourceFile:d.Yj().min(1),sourceType:d.Yj().min(1).optional(),questionCount:d.ai().int().min(0),questions:l}),o=d.Ik({id:d.Yj().min(1),topic:d.ai().int().min(1),title:d.Yj().min(1),supportMaterials:d.YO(m).optional().default([]),quizzes:d.YO(n)}),p=d.Ik({subjectId:d.eu("redes"),topics:d.YO(o)}),q=d.Ik({x:d.ai().min(0).max(100),y:d.ai().min(0).max(100),w:d.ai().min(0).max(100),h:d.ai().min(0).max(100),label:d.Yj().min(1)}),r=d.Ik({id:d.Yj().min(1),page:d.ai().int().min(1),title:d.Yj().min(1),highlights:d.YO(q).min(1),explanation:d.Yj().min(1),examRelevance:d.Yj().min(1),searchText:d.Yj().min(1)}),s=d.Ik({id:d.Yj().min(1),topic:d.ai().int().min(1),title:d.Yj().min(1),pdfUrl:d.Yj().min(1),pageCount:d.ai().int().min(1),slides:d.YO(r).min(1)}),t=d.Ik({subjectId:d.eu("redes"),topics:d.YO(s)}),u=d.Ik({id:d.Yj().min(1),topic:d.ai().int().min(1),title:d.Yj().min(1),questionCount:d.ai().int().min(0)}),v=d.Ik({subjectId:d.eu("redes"),topics:d.YO(u),questions:l})}};