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
            <span class="job-salary">💰 ${job.salary}</span>
          </div>
        </div>
        <div class="job-match">
          <span class="match-number">${job.match}%</span>
          <span class="match-label">匹配度</span>
        </div>
      </div>
      ${matchBar(job.match)}
      <p class="job-outlook">📈 ${job.outlook}</p>
      <div class="skill-tags">${job.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
      <p class="job-detail"><strong>✨ 推荐理由：</strong>${job.reasons.join('；')}</p>
      <p class="job-detail"><strong>🛤️ 成长路径：</strong>${job.path}</p>
    </div>
  `).join('');

  const trendsHTML = data.trends.map(t => {
    const icon = t.trend === '上升' ? '📈' : t.trend === '下降' ? '📉' : '➡️';
    const color = t.trend === '上升' ? '#10b981' : t.trend === '下降' ? '#ef4444' : '#6b7280';
    return `<div class="trend-item">
      <span style="color:${color};font-size:18px;">${icon}</span>
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

  const resourcesHTML = data.resources?.length ? `
    <div class="section resources-section">
      <h3 class="section-title"><span class="section-icon" style="background:rgba(251,146,60,0.1);"><span style="font-size:16px;">🔗</span></span>相关资源</h3>
      <div class="resources-grid">
        ${data.resources.map(r => `
          <a href="${r.url}" target="_blank" class="resource-card">
            <div class="resource-title">${r.title}</div>
            <div class="resource-desc">${r.description}</div>
          </a>
        `).join('')}
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
    gap: 6px;
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
  .job-salary { font-size: 12px; color: #64748b; }
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
  .job-outlook { font-size: 13px; color: #475569; margin: 12px 0; }
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
  .job-detail strong { color: #1e293b; }

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

  /* Resources */
  .resources-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  @media (max-width: 640px) { .resources-grid { grid-template-columns: 1fr; } }
  .resource-card {
    display: block;
    padding: 16px;
    border-radius: 12px;
    background: rgba(251,146,60,0.04);
    border: 1px solid rgba(251,146,60,0.1);
    text-decoration: none;
    transition: all 0.3s;
  }
  .resource-card:hover {
    border-color: rgba(251,146,60,0.25);
    box-shadow: 0 4px 16px -4px rgba(251,146,60,0.12);
    transform: translateY(-1px);
  }
  .resource-title { font-size: 13px; font-weight: 500; color: #1e293b; }
  .resource-desc { font-size: 12px; color: #64748b; margin-top: 4px; }

  /* Footer */
  .report-footer {
    text-align: center;
    padding: 32px 0 0;
    font-size: 12px;
    color: #94a3b8;
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
    gap: 6px;
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
    <h1>🎓 职业规划报告</h1>
    <div class="subtitle">基于AI对话式测评的个性化分析</div>
    <div class="badge">${data.personality.type}</div>
    <div class="date">生成于 ${dateStr} · 华中农业大学</div>
  </div>

  <!-- Personality -->
  <div class="section personality-section">
    <h3 class="section-title">
      <span class="section-icon" style="background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.1));"><span style="font-size:16px;">✨</span></span>
      性格画像
    </h3>
    ${generateRadarSVG(data.personality.traits)}
    <div class="personality-summary">${data.personality.summary}</div>
  </div>

  <!-- Analysis -->
  <div class="analysis-grid">
    <div class="analysis-card strengths">
      <h4>🏆 核心优势</h4>
      <ul>${strengthsHTML}</ul>
    </div>
    <div class="analysis-card interests">
      <h4>🎯 兴趣方向</h4>
      <ul>${interestsHTML}</ul>
    </div>
    <div class="analysis-card values">
      <h4>💎 价值观</h4>
      <ul>${valuesHTML}</ul>
    </div>
  </div>

  <!-- Jobs -->
  <div class="section" style="border-color:rgba(236,72,153,0.12);">
    <h3 class="section-title">
      <span class="section-icon" style="background:linear-gradient(135deg,rgba(236,72,153,0.15),rgba(251,146,60,0.1));"><span style="font-size:16px;">💼</span></span>
      推荐岗位
    </h3>
    ${jobsHTML}
  </div>

  <!-- Trends -->
  <div class="section" style="border-color:rgba(16,185,129,0.12);">
    <h3 class="section-title">
      <span class="section-icon" style="background:rgba(16,185,129,0.1);"><span style="font-size:16px;">📊</span></span>
      行业趋势
    </h3>
    ${trendsHTML}
  </div>

  <!-- Learning Path -->
  <div class="section" style="border-color:rgba(59,130,246,0.12);">
    <h3 class="section-title">
      <span class="section-icon" style="background:rgba(59,130,246,0.1);"><span style="font-size:16px;">📚</span></span>
      学习路径规划
    </h3>
    <div class="path-timeline">
      ${pathHTML}
    </div>
  </div>

  ${resourcesHTML}

  <div class="report-footer">
    <p>本报告由 AI 职业规划助手生成，仅供参考</p>
    <p style="margin-top:4px;">华中农业大学 · 校园AI辅导员</p>
  </div>
</div>

<div class="print-bar no-print">
  <button class="print-btn secondary" onclick="window.print()">🖨️ 打印</button>
  <button class="print-btn primary" onclick="saveAsHTML()">💾 保存</button>
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
