export type ResumeBasic = {
  name: string;
  phone: string;
  email: string;
  city?: string;
  availability?: {
    daysPerWeek?: string;
    internshipDuration?: string;
    baseLocations?: string[];
  };
  links?: string[];
  targetRole: string;
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
  basic: { name: '', phone: '', email: '', city: '', availability: { baseLocations: [] }, links: [], targetRole: '' },
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
    name: b.name || '',
    phone: b.phone || '',
    email: b.email || '',
    city: b.city || '',
    availability: {
      daysPerWeek: b.availability?.daysPerWeek || b.daysPerWeek || '',
      internshipDuration: b.availability?.internshipDuration || b.internshipDuration || '',
      baseLocations: Array.isArray(b.availability?.baseLocations) ? b.availability.baseLocations : Array.isArray(b.baseLocations) ? b.baseLocations : [],
    },
    links: Array.isArray(b.links) ? b.links : [],
    targetRole: b.targetRole || b.target || '',
  };
  // deno-lint-ignore no-explicit-any
  const periodOf = (x: any) => x?.period || [x?.start, x?.end].filter(Boolean).join(' - ');
  const asText = (value: any) => Array.isArray(value) ? value.filter(Boolean).join('、') : value || '';

  const mapList = (arr: any[], key: 'company' | 'name' | 'org'): ResumeItem[] =>
    (Array.isArray(arr) ? arr : []).map((x) => ({
      title: x?.[key] || (key === 'org' ? x?.organization : '') || x?.title || '',
      role: x?.role || '',
      period: periodOf(x),
      bullets: Array.isArray(x?.bullets) ? x.bullets.filter(Boolean) : [],
    }));
  r.education = (Array.isArray(raw.education) ? raw.education : []).map((e: any) => ({
    school: e?.school || '',
    period: periodOf(e),
    degree: [e?.degree, e?.major].filter(Boolean).join(' · '),
    gpa: e?.gpa || '',
    extra: [asText(e?.extra), asText(e?.courses), asText(e?.honors)].filter(Boolean).join('；'),
  }));
  r.experience = mapList(raw.experience, 'company');
  r.projects = mapList(raw.projects, 'name');
  r.campus = mapList(raw.campus, 'org');
  r.skills = Array.isArray(raw.skills) ? raw.skills.filter(Boolean) : [];
  r.certs = [
    ...(Array.isArray(raw.certs) ? raw.certs : []),
    ...(Array.isArray(raw.certificates) ? raw.certificates : []),
    ...(Array.isArray(raw.awards) ? raw.awards : []),
  ].filter(Boolean);
  r.selfEval = raw.selfEval || raw.summary || '';
  return r;
}
