import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ER_DIAGRAM = `erDiagram
    profiles ||--o{ conversations : "user_id"
    profiles ||--o{ user_roles : "user_id"
    profiles ||--o{ feedbacks : "user_id"
    profiles ||--o{ analytics : "user_id"
    profiles ||--o{ conversation_folders : "user_id"
    profiles ||--o{ conversation_tags : "user_id"
    profiles ||--o{ knowledge_files : "uploaded_by"

    conversations ||--o{ messages : "conversation_id"
    conversations ||--o{ conversation_tag_assignments : "conversation_id"
    conversations ||--o{ knowledge_usage : "conversation_id"
    conversations }o--|| conversation_folders : "folder_id"

    conversation_tags ||--o{ conversation_tag_assignments : "tag_id"

    messages ||--o{ feedbacks : "message_id"

    knowledge_categories ||--o{ knowledge_files : "category_id"
    knowledge_categories ||--o{ knowledge_categories : "parent_id"
    knowledge_files ||--o{ knowledge_usage : "file_id"

    profiles {
        uuid id PK
        uuid user_id FK
        text display_name
        text avatar_url
        text college
        text grade
        text student_id
        boolean is_verified
    }

    user_roles {
        uuid id PK
        uuid user_id FK
        app_role role
    }

    conversations {
        uuid id PK
        uuid user_id FK
        text title
        text group_id
        uuid folder_id FK
        boolean is_pinned
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        text role
        text content
        boolean is_favorite
    }

    conversation_folders {
        uuid id PK
        uuid user_id FK
        text name
        text icon
        text color
    }

    conversation_tags {
        uuid id PK
        uuid user_id FK
        text name
        text icon
        text color
    }

    conversation_tag_assignments {
        uuid id PK
        uuid conversation_id FK
        uuid tag_id FK
    }

    knowledge_categories {
        uuid id PK
        uuid parent_id FK
        text name
        text description
    }

    knowledge_files {
        uuid id PK
        uuid category_id FK
        uuid uploaded_by FK
        text file_name
        text file_path
        text status
        vector embedding
    }

    knowledge_usage {
        uuid id PK
        uuid file_id FK
        uuid conversation_id FK
        text user_query
        real similarity
    }

    feedbacks {
        uuid id PK
        uuid user_id FK
        uuid message_id FK
        text feedback_type
        text status
        text_array tags
    }

    analytics {
        uuid id PK
        uuid user_id FK
        text event_type
        jsonb metadata
    }

    system_settings {
        uuid id PK
        text key
        jsonb value
    }
`;

const TABLES = [
  { name: "profiles", desc: "用户资料", color: "from-blue-500/20 to-blue-600/10" },
  { name: "user_roles", desc: "用户角色", color: "from-purple-500/20 to-purple-600/10" },
  { name: "conversations", desc: "会话", color: "from-green-500/20 to-green-600/10" },
  { name: "messages", desc: "消息", color: "from-emerald-500/20 to-emerald-600/10" },
  { name: "conversation_folders", desc: "会话文件夹", color: "from-cyan-500/20 to-cyan-600/10" },
  { name: "conversation_tags", desc: "会话标签", color: "from-teal-500/20 to-teal-600/10" },
  { name: "conversation_tag_assignments", desc: "标签关联", color: "from-sky-500/20 to-sky-600/10" },
  { name: "knowledge_categories", desc: "知识分类", color: "from-orange-500/20 to-orange-600/10" },
  { name: "knowledge_files", desc: "知识文件", color: "from-amber-500/20 to-amber-600/10" },
  { name: "knowledge_usage", desc: "引用记录", color: "from-yellow-500/20 to-yellow-600/10" },
  { name: "feedbacks", desc: "反馈", color: "from-pink-500/20 to-pink-600/10" },
  { name: "analytics", desc: "行为埋点", color: "from-rose-500/20 to-rose-600/10" },
  { name: "system_settings", desc: "系统设置", color: "from-slate-500/20 to-slate-600/10" },
];

export default function ERDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        primaryColor: "hsl(var(--primary))",
        primaryTextColor: "#fff",
        primaryBorderColor: "hsl(var(--primary))",
        lineColor: "hsl(var(--primary))",
        background: "transparent",
      },
      er: { useMaxWidth: false },
    });

    (async () => {
      if (!ref.current) return;
      try {
        const { svg } = await mermaid.render("er-graph", ER_DIAGRAM);
        ref.current.innerHTML = svg;
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const downloadSvg = () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "database-er-diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">数据库 ER 关系图</h1>
              <p className="text-sm text-muted-foreground">共 13 张表，可视化展示表与表之间的关联关系</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.max(0.4, s - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm tabular-nums">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.min(2, s + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setScale(1)}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={downloadSvg}>
              <Download className="mr-2 h-4 w-4" />导出 SVG
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {TABLES.map((t) => (
            <Card key={t.name} className={`bg-gradient-to-br ${t.color} border-border/40 p-3`}>
              <div className="text-xs font-mono text-foreground/90">{t.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
            </Card>
          ))}
        </div>

        <Card className="overflow-auto bg-card/50 backdrop-blur p-6">
          <div
            ref={ref}
            className="origin-top-left transition-transform"
            style={{ transform: `scale(${scale})` }}
          />
        </Card>

        <Card className="bg-card/50 backdrop-blur p-4">
          <h2 className="mb-3 text-lg font-semibold">关系说明</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <span className="font-mono text-foreground">profiles</span> 是核心用户表，被多张表通过 <code>user_id</code> 引用</li>
            <li>• <span className="font-mono text-foreground">conversations → messages</span>：一对多，会话包含多条消息</li>
            <li>• <span className="font-mono text-foreground">conversations ↔ conversation_tags</span>：通过 <code>conversation_tag_assignments</code> 多对多</li>
            <li>• <span className="font-mono text-foreground">knowledge_categories</span>：自引用，支持父子分类树</li>
            <li>• <span className="font-mono text-foreground">knowledge_files → knowledge_usage</span>：记录文件被引用情况</li>
            <li>• <span className="font-mono text-foreground">messages → feedbacks</span>：用户对单条消息提交反馈</li>
            <li>• <span className="font-mono text-foreground">system_settings</span>：独立全局配置表，无外键</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
