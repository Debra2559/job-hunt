import { forwardRef } from 'react';
import type { ResumeData, ResumeItem } from '@/lib/resumeTypes';

type Props = { data: ResumeData };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-4">
    <h2 className="text-[13px] font-bold tracking-wide text-sky-700 border-b border-sky-300 pb-1 mb-2 uppercase">
      {title}
    </h2>
    {children}
  </section>
);

const ItemBlock = ({ it, leadLabel }: { it: ResumeItem; leadLabel?: string }) => (
  <div className="mb-2.5 last:mb-0">
    <div className="flex justify-between gap-2 items-baseline">
      <div className="text-[12.5px] font-semibold text-foreground">
        {it.title || '—'}
        {it.role && <span className="font-normal text-foreground/70"> · {it.role}</span>}
      </div>
      <div className="text-[11px] text-muted-foreground shrink-0">{it.period}</div>
    </div>
    {it.bullets.filter(Boolean).length > 0 && (
      <ul className="mt-1 list-disc pl-5 space-y-0.5">
        {it.bullets.filter(Boolean).map((b, i) => (
          <li key={i} className="text-[12px] leading-snug text-foreground/85">{b}</li>
        ))}
      </ul>
    )}
  </div>
);

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const { basic, education, experience, projects, campus, skills, certs, selfEval } = data;
  const contactLine = [basic.phone, basic.email].filter(Boolean).join(' · ');
  const schoolLine = [basic.school, basic.major, basic.grade].filter(Boolean).join(' · ');

  return (
    <div ref={ref} className="resume-print bg-white text-foreground p-8 mx-auto shadow-md rounded-md" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="mb-5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{basic.name || '你的姓名'}</h1>
        {schoolLine && <div className="text-[12px] text-foreground/75 mt-1">{schoolLine}</div>}
        {contactLine && <div className="text-[12px] text-foreground/75 mt-0.5">{contactLine}</div>}
        {basic.target && (
          <div className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
            求职意向：{basic.target}
          </div>
        )}
      </header>

      {education.length > 0 && (
        <Section title="教育背景">
          {education.map((e, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between items-baseline">
                <div className="text-[12.5px] font-semibold">
                  {e.school || '—'}
                  {e.degree && <span className="font-normal text-foreground/70"> · {e.degree}</span>}
                </div>
                <div className="text-[11px] text-muted-foreground">{e.period}</div>
              </div>
              {(e.gpa || e.extra) && (
                <div className="text-[11.5px] text-foreground/75 mt-0.5">
                  {[e.gpa && `GPA：${e.gpa}`, e.extra].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="实习 / 工作经历">{experience.map((it, i) => <ItemBlock key={i} it={it} />)}</Section>
      )}
      {projects.length > 0 && (
        <Section title="项目经历">{projects.map((it, i) => <ItemBlock key={i} it={it} />)}</Section>
      )}
      {campus.length > 0 && (
        <Section title="校园经历">{campus.map((it, i) => <ItemBlock key={i} it={it} />)}</Section>
      )}

      {(skills.length > 0 || certs.length > 0) && (
        <Section title="技能 & 证书">
          {skills.length > 0 && (
            <div className="text-[12px] mb-1"><span className="font-semibold">技能：</span>{skills.join(' · ')}</div>
          )}
          {certs.length > 0 && (
            <div className="text-[12px]"><span className="font-semibold">证书：</span>{certs.join(' · ')}</div>
          )}
        </Section>
      )}

      {selfEval && (
        <Section title="自我评价">
          <p className="text-[12px] leading-relaxed text-foreground/85 whitespace-pre-wrap">{selfEval}</p>
        </Section>
      )}
    </div>
  );
});
ResumePreview.displayName = 'ResumePreview';
export default ResumePreview;
