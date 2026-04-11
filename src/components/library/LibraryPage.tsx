import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, Copy, ExternalLink, ChevronDown, ChevronRight, Repeat } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';

// Stored in localStorage via settingsStore
export interface TemplateItem {
  id: string;
  category: string; // 문구, 메일, 프로세스, 링크
  title: string;
  content: string;
  url?: string;
}

// Seed templates from Excel 메일 문안
const SEED_TEMPLATES: Omit<TemplateItem, 'id'>[] = [
  {
    category: '메일',
    title: '크리에이터 컨택 - 1차 (제안/비용)',
    content: `안녕하세요.
메이크프렘 박아영입니다.

<000>님 유튜브 협업 문의 건으로 연락드립니다.

하기 내용 확인하시어 진행 여부 회신 부탁드립니다.

==

[상세 내용]

1. 문의 사항

(1) 일정 : 5월 말~6월 초 올영세일
=>어려우실 경우 가능하신 일정 안내 부탁드려요.

(2) 유형 & 비용 : 유튜브 롱폼&숏츠 등 모든 견적 전달 부탁드립니다.

2. 진행 품목 : 핑크톤업 선크림 or PDRN 선세럼
=>제품 장점 및 올리브영 행사 안내

==

살펴보시고 문의사항 있으시면 언제든지 연락주세요.

감사합니다.
박아영 드림`,
  },
  {
    category: '메일',
    title: '크리에이터 컨택 - 2차 (배송주소 요청)',
    content: `안녕하세요.
메이크프렘 박아영입니다.

하기 상세 내용 확인하시어 진행 가능 여부 검토 부탁드립니다:)

또한, 제품 테스트 발송을 위한 배송 정보 회신 부탁드립니다.

==

[상세 내용]

1. 문의 사항

(1) 일정 : 5/31 or 6/1 (올영세일 시작일)
(2) 채널: 쇼츠 + 릴스 : 560만원
(3) 비용: 560만원

2. 진행 품목 : 수딩핑크톤업선크림 40+40+20ml 기획

==

살펴보시고 문의사항 있으시면 언제든지 연락주세요.

감사합니다.
박아영 드림`,
  },
  {
    category: '메일',
    title: '크리에이터 컨택 - 3차 (테스트 발송 안내)',
    content: `안녕하세요.

메이크프렘 박아영 입니다.

전달주신 주소로 금일 테스트 제품 기프트 박스 형태로 퀵 발송드렸습니다.

테스트 결과 및 진행 여부는 ~4/15(수) 까지 회신 부탁드립니다.
=>어려우실 경우 가능하신 일정 안내 부탁드려요.

살펴보시고 문의사항 있으시면 언제든지 말씀해주세요.

감사합니다.
박아영 드림.`,
  },
  {
    category: '프로세스',
    title: '크리에이터 협업 프로세스',
    content: `1. 메일 컨택 (1차 - 제안/비용)
2. 메일 컨택 (2차 - 배송주소 요청)
3. 비용 내부 공유
4. 기안 상신
5. 제품 테스트 발송
6. 계약
7. 기획안 피드백
8. 영상 초안 피드백
9. 영상 최종본 피드백
10. 업로드 체크
11. 비용 정산

* 크리에이터 엑셀 업데이트 (오전 10시 / 오후 2시)`,
  },
  {
    category: '프로세스',
    title: '상세페이지 제작 프로세스',
    content: `1. 컨셉보드 & 교육
2. 연출컷 레퍼런스 서칭
3. 연출컷 기획안 작성
4. 문안 작성
5. 내부 QC
6. 디자인팀 전달`,
  },
  {
    category: '링크',
    title: '올리브영',
    content: '올리브영 공식 사이트',
    url: 'https://www.oliveyoung.co.kr',
  },
  {
    category: '링크',
    title: 'CJ 대한통운 택배 조회',
    content: '택배 배송 조회',
    url: 'https://www.cjlogistics.com/ko/tool/parcel/tracking',
  },
  {
    category: '문구',
    title: '기안 상신 시 참고',
    content: '기안 상신 후 테스트 제품 발송 진행\n퀵발송: 당일 / 택배: 셀프 포장 후 발송\n~회신일까지 진행여부 회신 요청',
  },
];

const CATEGORIES = ['문구', '메일', '프로세스', '링크'];

export function LibraryPage() {
  const templates = useSettingsStore((s) => s.templates ?? []);
  const setTemplates = useSettingsStore((s) => s.setTemplates);

  const [activeTab, setActiveTab] = useState('전체');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState('문구');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const tabs = ['전체', ...CATEGORIES];

  const filtered = activeTab === '전체' ? templates : templates.filter((t) => t.category === activeTab);

  const handleSave = () => {
    if (!formTitle.trim()) return;
    const item: TemplateItem = {
      id: editingId ?? crypto.randomUUID(),
      category: formCategory,
      title: formTitle.trim(),
      content: formContent.trim(),
      url: formUrl.trim() || undefined,
    };
    if (editingId) {
      setTemplates(templates.map((t) => (t.id === editingId ? item : t)));
    } else {
      setTemplates([...templates, item]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormCategory('문구');
    setFormTitle('');
    setFormContent('');
    setFormUrl('');
  };

  const startEdit = (item: TemplateItem) => {
    setEditingId(item.id);
    setFormCategory(item.category);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormUrl(item.url ?? '');
    setShowAddForm(true);
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = () => {
    if (deleteId) {
      setTemplates(templates.filter((t) => t.id !== deleteId));
      setDeleteId(null);
    }
  };

  const handleSeedLoad = () => {
    if (templates.length > 0) return;
    setTemplates(SEED_TEMPLATES.map((t) => ({ ...t, id: crypto.randomUUID() })));
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case '메일': return '✉️';
      case '프로세스': return '🔄';
      case '링크': return '🔗';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">자료실</h1>
          <p className="text-sm text-muted-foreground">자주 쓰는 문구, 메일 템플릿, 프로세스, 유용한 링크</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} /> 추가
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
            {tab !== '전체' && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({templates.filter((t) => t.category === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Add/Edit form */}
      {showAddForm && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{editingId ? '수정' : '새 항목 추가'}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">분류</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">제목</label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="제목" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          {formCategory === '링크' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">URL</label>
              <input type="url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">내용</label>
            <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={formCategory === '메일' ? 10 : 4} placeholder="내용을 입력하세요..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!formTitle.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              <Check size={14} /> {editingId ? '수정' : '추가'}
            </button>
            <button onClick={resetForm} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">취소</button>
          </div>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {activeTab === '전체' ? '아직 저장된 자료가 없습니다.' : `${activeTab} 항목이 없습니다.`}
            </p>
          </div>
          {templates.length === 0 && (
            <button onClick={handleSeedLoad} className="w-full rounded-lg border border-dashed border-border py-4 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
              샘플 데이터 로드 (메일 템플릿, 프로세스, 링크)
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className="rounded-lg border border-border bg-card overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                  <span className="text-base shrink-0">{getCategoryIcon(item.category)}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{item.category}</span>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleCopy(item.content, item.id)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground" title="복사">
                      {copiedId === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground" title="링크 열기">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button onClick={() => startEdit(item)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteId(item.id)} className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 size={14} /></button>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 bg-muted/20">
                    {item.category === '프로세스' ? (
                      <div className="space-y-2">
                        {item.content.split('\n').filter(Boolean).map((line, i) => {
                          const isStep = /^\d+\./.test(line.trim());
                          return (
                            <div key={i} className={cn('flex items-start gap-2', isStep ? '' : 'ml-6')}>
                              {isStep && (
                                <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Repeat size={10} className="text-primary" />
                                </div>
                              )}
                              <span className={cn('text-sm', isStep ? 'font-medium text-foreground' : 'text-muted-foreground text-xs')}>{line}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{item.content}</pre>
                    )}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink size={12} /> {item.url}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="항목 삭제"
        description="이 항목을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
      />
    </div>
  );
}
