export type ResumeBasic = {
  name: string;
  school: string;
  major: string;
  grade: string;
  phone: string;
  email: string;
  target: string;
};

export type ResumeEducation = {
  school: string;
  period: string;
  degree: string;
  gpa: string;
  extra: string;
};

export type ResumeItem = {
  // for experience: company; for project: name; for campus: org
  title: string;
  role: string;
  period: string;
  bullets: string[];
};

export type ResumeData = {
  basic: ResumeBasic;
  education: ResumeEducation[];
  experience: ResumeItem[];
  projects: ResumeItem[];
  campus: ResumeItem[];
  skills: string[];
  certs: string[];
  selfEval: string;
};

export const emptyResume = (): ResumeData => ({
  basic: { name: '', school: '', major: '', grade: '', phone: '', email: '', target: '' },
  education: [],
  experience: [],
  projects: [],
  campus: [],
  skills: [],
  certs: [],
  selfEval: '',
});

/** Normalize AI JSON (which uses company/name/org keys) into our flat ResumeItem shape. */
// deno-lint-ignore no-explicit-any
export function normalizeResume(raw: any): ResumeData {
  const r = emptyResume();
  if (!raw || typeof raw !== 'object') return r;
  const b = raw.basic || {};
  r.basic = {
    name: b.name || '', school: b.school || '', major: b.major || '',
    grade: b.grade || '', phone: b.phone || '', email: b.email || '',
    target: b.target || '',
  };
  // deno-lint-ignore no-explicit-any
  const mapList = (arr: any[], key: 'company' | 'name' | 'org'): ResumeItem[] =>
    (Array.isArray(arr) ? arr : []).map((x) => ({
      title: x?.[key] || x?.title || '',
      role: x?.role || '',
      period: x?.period || '',
      bullets: Array.isArray(x?.bullets) ? x.bullets.filter(Boolean) : [],
    }));
  r.education = (Array.isArray(raw.education) ? raw.education : []).map((e: any) => ({
    school: e?.school || '', period: e?.period || '', degree: e?.degree || '',
    gpa: e?.gpa || '', extra: e?.extra || e?.courses || '',
  }));
  r.experience = mapList(raw.experience, 'company');
  r.projects = mapList(raw.projects, 'name');
  r.campus = mapList(raw.campus, 'org');
  r.skills = Array.isArray(raw.skills) ? raw.skills.filter(Boolean) : [];
  r.certs = Array.isArray(raw.certs) ? raw.certs.filter(Boolean) : [];
  r.selfEval = raw.selfEval || '';
  return r;
}
