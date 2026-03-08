import { type CareerReportData } from './CareerReport';

function generateRadarSVG(traits: { name: string; score: number }[]): string {
  const size = 300;
  const center = size / 2;
  const radius = 110;
  const levels = 4;
  const angleStep = (2 * Math.PI) / traits.length;

  const gridPolygons = Array.from({ length: levels }, (_, i) => {
    const r = (radius * (i + 1)) / levels;
    const pts = traits.map((_, j) => {
      const angle = angleStep * j - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="rgba(139,92,246,0.15)" stroke-width="1"/>`;
  }).join('');

  const axisLines = traits.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return `<line x1="${center}" y1="${center}" x2="${center + radius * Math.cos(angle)}" y2="${center + radius * Math.sin(angle)}" stroke="rgba(139,92,246,0.15)" stroke-width="1"/>`;
  }).join('');

  const dataPoints = traits.map((t, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (t.score / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  });
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const labels = traits.map((t, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const lx = center + (radius + 35) * Math.cos(angle);
    const ly = center + (radius + 35) * Math.sin(angle);
    return `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#64748b" font-size="12" font-weight="500">${t.name}</text>
    <text x="${lx}" y="${ly + 16}" text-anchor="middle" dominant-baseline="middle" fill="#8b5cf6" font-size="11" font-weight="600">${t.score}</text>`;
  }).join('');

  const dots = dataPoints.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#8b5cf6" stroke="white" stroke-width="2.5"/>`).join('');

  return `<svg viewBox="0 0 ${size} ${size}" width="300" height="300" style="margin:0 auto;display:block;">
    <defs>
      <linearGradient id="rf" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#ec4899" stop-opacity="0.1"/>
      </linearGradient>
      <linearGradient id="rs" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8b5cf6"/>
        <stop offset="100%" stop-color="#ec4899"/>
      </linearGradient>
    </defs>
    ${gridPolygons}${axisLines}
    <polygon points="${polygon}" fill="url(#rf)" stroke="url(#rs)" stroke-width="2.5"/>
    ${dots}${labels}
  </svg>`;
}

function matchBar(match: number): string {
  return `<div style="display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:10px;border-radius:99px;background:rgba(139,92,246,0.1);overflow:hidden;">
      <div style="width:${match}%;height:100%;border-radius:99px;background:linear-gradient(90deg,#8b5cf6,#ec4899);transition:width 1s;"></div>
    </div>
    <span style="font-size:15px;font-weight:700;background:linear-gradient(90deg,#8b5cf6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${match}%</span>
  </div>`;
}

// Premium SVG icons (Lucide-style, 20x20)
const icons = {
  graduation: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`,
  sparkles: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/></svg>`,
  trophy: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
  target: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  gem: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>`,
  briefcase: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>`,
  barChart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>`,
  bookOpen: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  link: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  trendUp: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  trendDown: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`,
  arrowRight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  coins: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>`,
  chartLine: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
  lightbulb: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  route: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>`,
  printer: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>`,
  download: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
};

export function generateCareerReportHTML(data: CareerReportData): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  const strengthsHTML = data.analysis.strengths.map(s => `<li>${s}</li>`).join('');
  const interestsHTML = data.analysis.interests.map(s => `<li>${s}</li>`).join('');
  const valuesHTML = data.analysis.values.map(s => `<li>${s}</li>`).join('');

  const jobsHTML = data.recommendations.map((job, i) => `
    <div class="job-card">
      <div class="job-header">
        <div>
          <h4 class="job-title">${job.title}</h4>
          <div class="job-meta">
            <span class="job-tag">${job.category}</span>
            <span class="job-salary"><span class="inline-icon" style="color:#8b5cf6;">${icons.coins}</span> ${job.salary}</span>
          </div>
        </div>
        <div class="job-match">
          <span class="match-number">${job.match}%</span>
          <span class="match-label">匹配度</span>
        </div>
      </div>
      ${matchBar(job.match)}
      <p class="job-outlook"><span class="inline-icon" style="color:#10b981;">${icons.chartLine}</span> ${job.outlook}</p>
      <div class="skill-tags">${job.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
      <p class="job-detail"><strong><span class="inline-icon" style="color:#8b5cf6;">${icons.lightbulb}</span> 推荐理由：</strong>${job.reasons.join('；')}</p>
      <p class="job-detail"><strong><span class="inline-icon" style="color:#ec4899;">${icons.route}</span> 成长路径：</strong>${job.path}</p>
      <a href="https://www.zhipin.com/web/geek/job?query=${encodeURIComponent(job.title)}" target="_blank" rel="noopener noreferrer" class="boss-search-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        在Boss直聘搜索该岗位 →
      </a>
    </div>
  `).join('');

  const trendsHTML = data.trends.map(t => {
    const icon = t.trend === '上升' ? icons.trendUp : t.trend === '下降' ? icons.trendDown : icons.arrowRight;
    const color = t.trend === '上升' ? '#10b981' : t.trend === '下降' ? '#ef4444' : '#6b7280';
    return `<div class="trend-item">
      <span class="trend-icon-wrap" style="color:${color};background:${color}12;">${icon}</span>
      <div><div class="trend-name">${t.industry}</div><div class="trend-desc">${t.description}</div></div>
    </div>`;
  }).join('');

  const pathHTML = data.learningPath.map((phase, i) => `
    <div class="path-item">
      <div class="path-dot"></div>
      <div>
        <div class="path-title">${phase.phase} <span class="path-duration">(${phase.duration})</span></div>
        <ul class="path-actions">${phase.actions.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
    </div>
  `).join('');


  // Boss直聘 job listings section
  const bossJobsHTML = data.jobListings?.length ? `
    <div class="section boss-section">
      <h3 class="section-title">
        <span class="section-icon" style="background:linear-gradient(135deg,rgba(0,190,75,0.12),rgba(0,150,60,0.08));color:#00be4b;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </span>
        热招岗位 · BOSS直聘
        <span style="font-size:12px;font-weight:400;color:#94a3b8;margin-left:auto;">实时数据</span>
      </h3>
      <div class="boss-jobs-grid">
        ${data.jobListings.map(job => `
          <a href="${job.url}" target="_blank" rel="noopener noreferrer" class="boss-job-card">
            <div class="boss-job-top">
              <div class="boss-job-title">${job.title}</div>
              ${job.salary ? `<span class="boss-job-salary">${job.salary}</span>` : ''}
            </div>
            <div class="boss-job-meta">
              ${job.company ? `<span class="boss-job-company">${job.company}</span>` : ''}
              ${job.location ? `<span class="boss-job-location">📍 ${job.location}</span>` : ''}
            </div>
            <div class="boss-job-tags">
              ${job.tags.map(t => `<span class="boss-tag">${t}</span>`).join('')}
            </div>
            <span class="boss-job-link">查看详情 →</span>
          </a>
        `).join('')}
      </div>
      <div style="text-align:center;margin-top:16px;">
        <a href="https://www.zhipin.com" target="_blank" rel="noopener noreferrer" class="boss-more-link">
          前往BOSS直聘查看更多岗位 →
        </a>
      </div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>职业规划报告 - ${dateStr}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap');
  
  * { margin:0; padding:0; box-sizing:border-box; }
  
  body {
    font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 30%, #eff6ff 60%, #f0fdf4 100%);
    color: #1e293b;
    min-height: 100vh;
    padding: 0;
  }

  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 24px 60px;
  }

  .inline-icon {
    display: inline-flex;
    vertical-align: middle;
    margin-right: 3px;
    position: relative;
    top: -1px;
  }

  /* Header */
  .report-header {
    text-align: center;
    padding: 48px 32px;
    background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.06), rgba(59,130,246,0.05));
    border-radius: 24px;
    border: 1px solid rgba(139,92,246,0.12);
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }
  .report-header::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(139,92,246,0.08), transparent);
    border-radius: 50%;
  }
  .report-header::after {
    content: '';
    position: absolute;
    bottom: -40px; left: -40px;
    width: 150px; height: 150px;
    background: radial-gradient(circle, rgba(236,72,153,0.06), transparent);
    border-radius: 50%;
  }
  .header-icon {
    width: 56px; height: 56px;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    color: #7c3aed;
    position: relative;
  }
  .report-header h1 {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 8px;
    position: relative;
  }
  .report-header .subtitle {
    color: #64748b;
    font-size: 14px;
    position: relative;
  }
  .report-header .date {
    margin-top: 16px;
    font-size: 13px;
    color: #94a3b8;
    position: relative;
  }
  .report-header .badge {
    display: inline-block;
    margin-top: 12px;
    padding: 6px 20px;
    border-radius: 99px;
    font-size: 16px;
    font-weight: 700;
    background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08));
    color: #7c3aed;
    border: 1px solid rgba(139,92,246,0.2);
    position: relative;
  }

  /* Sections */
  .section {
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    border: 1px solid rgba(139,92,246,0.1);
    padding: 28px;
    margin-bottom: 20px;
    transition: box-shadow 0.3s;
  }
  .section:hover {
    box-shadow: 0 8px 30px -8px rgba(139,92,246,0.1);
  }
  .section-title {
    font-size: 17px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    color: #1e293b;
  }
  .section-icon {
    width: 36px; height: 36px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Personality */
  .personality-section { border-color: rgba(139,92,246,0.15); }
  .personality-summary {
    font-size: 14px;
    line-height: 1.8;
    color: #475569;
    margin-top: 20px;
    padding: 16px;
    background: rgba(139,92,246,0.04);
    border-radius: 12px;
    border-left: 3px solid rgba(139,92,246,0.3);
  }

  /* Analysis cards */
  .analysis-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }
  @media (max-width: 640px) {
    .analysis-grid { grid-template-columns: 1fr; }
  }
  .analysis-card {
    padding: 20px;
    border-radius: 16px;
    border: 1px solid;
  }
  .analysis-card.strengths {
    background: linear-gradient(135deg, rgba(139,92,246,0.06), rgba(255,255,255,0.8));
    border-color: rgba(139,92,246,0.12);
  }
  .analysis-card.interests {
    background: linear-gradient(135deg, rgba(236,72,153,0.06), rgba(255,255,255,0.8));
    border-color: rgba(236,72,153,0.12);
  }
  .analysis-card.values {
    background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(255,255,255,0.8));
    border-color: rgba(59,130,246,0.12);
  }
  .analysis-card h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .analysis-card .card-icon {
    width: 28px; height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .analysis-card ul {
    list-style: none;
    padding: 0;
  }
  .analysis-card li {
    font-size: 13px;
    color: #475569;
    padding: 4px 0;
    padding-left: 16px;
    position: relative;
  }
  .analysis-card li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    transform: translateY(-50%);
  }
  .analysis-card.strengths li::before { background: rgba(139,92,246,0.4); }
  .analysis-card.interests li::before { background: rgba(236,72,153,0.4); }
  .analysis-card.values li::before { background: rgba(59,130,246,0.4); }

  /* Jobs */
  .job-card {
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(236,72,153,0.12);
    background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(236,72,153,0.03));
    margin-bottom: 16px;
  }
  .job-card:last-child { margin-bottom: 0; }
  .job-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
  }
  .job-title { font-size: 16px; font-weight: 600; color: #1e293b; }
  .job-meta { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
  .job-tag {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 99px;
    background: rgba(139,92,246,0.08);
    color: #7c3aed;
    border: 1px solid rgba(139,92,246,0.12);
  }
  .job-salary { font-size: 12px; color: #64748b; display: flex; align-items: center; }
  .job-match { text-align: right; }
  .match-number {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(90deg, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: block;
    line-height: 1;
  }
  .match-label { font-size: 11px; color: #94a3b8; }
  .job-outlook { font-size: 13px; color: #475569; margin: 12px 0; display: flex; align-items: center; }
  .skill-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
  .skill-tag {
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 99px;
    background: rgba(59,130,246,0.08);
    color: #3b82f6;
    border: 1px solid rgba(59,130,246,0.12);
  }
  .job-detail { font-size: 13px; color: #475569; margin-top: 8px; line-height: 1.7; }
  .job-detail strong { color: #1e293b; display: inline-flex; align-items: center; }

  /* Trends */
  .trend-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    background: rgba(16,185,129,0.04);
    border: 1px solid rgba(16,185,129,0.08);
    margin-bottom: 10px;
  }
  .trend-item:last-child { margin-bottom: 0; }
  .trend-icon-wrap {
    width: 32px; height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .trend-name { font-size: 14px; font-weight: 500; color: #1e293b; }
  .trend-desc { font-size: 12px; color: #64748b; margin-top: 2px; }

  /* Learning Path */
  .path-timeline { position: relative; padding-left: 28px; }
  .path-timeline::before {
    content: '';
    position: absolute;
    left: 7px; top: 8px; bottom: 8px;
    width: 2px;
    background: linear-gradient(to bottom, #8b5cf6, #ec4899, #3b82f6);
    opacity: 0.3;
    border-radius: 99px;
  }
  .path-item {
    position: relative;
    margin-bottom: 20px;
  }
  .path-item:last-child { margin-bottom: 0; }
  .path-dot {
    position: absolute;
    left: -24px; top: 4px;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    border: 2.5px solid white;
    box-shadow: 0 0 0 2px rgba(139,92,246,0.2);
  }
  .path-title { font-size: 14px; font-weight: 500; color: #1e293b; }
  .path-duration { font-weight: 400; color: #64748b; }
  .path-actions {
    list-style: none;
    padding: 0;
    margin-top: 6px;
  }
  .path-actions li {
    font-size: 13px;
    color: #475569;
    padding: 2px 0;
  }
  .path-actions li::before { content: '• '; color: #8b5cf6; }


  /* Footer */
  .report-footer {
    text-align: center;
    padding: 32px 0 0;
    font-size: 12px;
    color: #94a3b8;
  }

  /* Boss直聘 */
  .boss-section { border-color: rgba(0,190,75,0.15); }
  .boss-jobs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  @media (max-width: 640px) { .boss-jobs-grid { grid-template-columns: 1fr; } }
  .boss-job-card {
    display: block;
    padding: 18px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(0,190,75,0.04), rgba(255,255,255,0.9));
    border: 1px solid rgba(0,190,75,0.12);
    text-decoration: none;
    transition: all 0.3s;
    position: relative;
  }
  .boss-job-card:hover {
    border-color: rgba(0,190,75,0.3);
    box-shadow: 0 6px 20px -6px rgba(0,190,75,0.15);
    transform: translateY(-2px);
  }
  .boss-job-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .boss-job-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .boss-job-salary {
    font-size: 13px;
    font-weight: 700;
    color: #00be4b;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .boss-job-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
    font-size: 12px;
    color: #64748b;
  }
  .boss-job-company { font-weight: 500; }
  .boss-job-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 10px;
  }
  .boss-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 99px;
    background: rgba(0,190,75,0.08);
    color: #059669;
    border: 1px solid rgba(0,190,75,0.1);
  }
  .boss-job-link {
    display: block;
    margin-top: 10px;
    font-size: 12px;
    color: #00be4b;
    font-weight: 500;
  }
  .boss-more-link {
    display: inline-block;
    padding: 10px 24px;
    border-radius: 99px;
    background: linear-gradient(135deg, #00be4b, #059669);
    color: white;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.3s;
  }
  .boss-more-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px -4px rgba(0,190,75,0.4);
  }

  /* Print */
  @media print {
    body { background: white; padding: 0; }
    .page { padding: 20px 0; }
    .section { break-inside: avoid; box-shadow: none; }
    .no-print { display: none; }
  }

  /* Print button */
  .print-bar {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 100;
    display: flex;
    gap: 10px;
  }
  .print-btn {
    padding: 12px 24px;
    border-radius: 99px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .print-btn.primary {
    background: linear-gradient(135deg, #7c3aed, #db2777);
    color: white;
    box-shadow: 0 4px 20px -4px rgba(124,58,237,0.4);
  }
  .print-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px -4px rgba(124,58,237,0.5);
  }
  .print-btn.secondary {
    background: rgba(255,255,255,0.9);
    color: #475569;
    border: 1px solid rgba(0,0,0,0.1);
    backdrop-filter: blur(10px);
  }
  .print-btn.secondary:hover {
    background: white;
    transform: translateY(-2px);
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="report-header">
    <div class="header-icon">${icons.graduation}</div>
    <h1>职业规划报告</h1>
    <div class="subtitle">基于AI对话式测评的个性化分析</div>
    <div class="badge">${data.personality.type}</div>
    <div class="date">生成于 ${dateStr} · 华中农业大学</div>
  </div>

  <!-- Personality -->
  <div class="section personality-section">
    <h3 class="section-title">
      <span class="section-icon" style="background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.1));color:#8b5cf6;">${icons.sparkles}</span>
      性格画像
    </h3>
    ${generateRadarSVG(data.personality.traits)}
    <div class="personality-summary">${data.personality.summary}</div>
  </div>

  <!-- Analysis -->
  <div class="analysis-grid">
    <div class="analysis-card strengths">
      <h4><span class="card-icon" style="background:rgba(139,92,246,0.1);color:#8b5cf6;">${icons.trophy}</span> 核心优势</h4>
      <ul>${strengthsHTML}</ul>
    </div>
    <div class="analysis-card interests">
      <h4><span class="card-icon" style="background:rgba(236,72,153,0.1);color:#ec4899;">${icons.target}</span> 兴趣方向</h4>
      <ul>${interestsHTML}</ul>
    </div>
    <div class="analysis-card values">
      <h4><span class="card-icon" style="background:rgba(59,130,246,0.1);color:#3b82f6;">${icons.gem}</span> 价值观</h4>
      <ul>${valuesHTML}</ul>
    </div>
  </div>

  <!-- Jobs -->
  <div class="section" style="border-color:rgba(236,72,153,0.12);">
    <h3 class="section-title">
      <span class="section-icon" style="background:linear-gradient(135deg,rgba(236,72,153,0.15),rgba(251,146,60,0.1));color:#ec4899;">${icons.briefcase}</span>
      推荐岗位
    </h3>
    ${jobsHTML}
  </div>

  <!-- Trends -->
  <div class="section" style="border-color:rgba(16,185,129,0.12);">
    <h3 class="section-title">
      <span class="section-icon" style="background:rgba(16,185,129,0.1);color:#10b981;">${icons.barChart}</span>
      行业趋势
    </h3>
    ${trendsHTML}
  </div>

  <!-- Learning Path -->
  <div class="section" style="border-color:rgba(59,130,246,0.12);">
    <h3 class="section-title">
      <span class="section-icon" style="background:rgba(59,130,246,0.1);color:#3b82f6;">${icons.bookOpen}</span>
      学习路径规划
    </h3>
    <div class="path-timeline">
      ${pathHTML}
    </div>
  </div>

  

  ${bossJobsHTML}

  <div class="report-footer">
    <p>本报告由 AI 职业规划助手生成，仅供参考</p>
    <p style="margin-top:4px;">华中农业大学 · 校园AI辅导员</p>
  </div>
</div>

<div class="print-bar no-print">
  <button class="print-btn secondary" onclick="window.print()">${icons.printer} 打印</button>
  <button class="print-btn primary" onclick="saveAsHTML()">${icons.download} 保存</button>
</div>

<script>
function saveAsHTML() {
  const el = document.querySelector('.print-bar');
  if (el) el.style.display = 'none';
  const html = document.documentElement.outerHTML;
  if (el) el.style.display = '';
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '职业规划报告_${dateStr}.html';
  a.click();
  URL.revokeObjectURL(a.href);
}
</script>
</body>
</html>`;
}

export function openCareerReportPage(data: CareerReportData) {
  const html = generateCareerReportHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
