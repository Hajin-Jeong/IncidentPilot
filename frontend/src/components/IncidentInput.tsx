import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { InputTab } from '../types';

interface IncidentInputProps {
  onAnalyze: (input: string, fileName?: string) => void;
  isLoading: boolean;
}

export default function IncidentInput({ onAnalyze, isLoading }: IncidentInputProps) {
  const [activeTab, setActiveTab] = useState<InputTab>('file');
  const [textInput, setTextInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile({ name: file.name, content: e.target?.result as string });
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileRead(file);
    },
    [handleFileRead]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleSubmit = () => {
    if (activeTab === 'file' && uploadedFile) {
      onAnalyze(uploadedFile.content, uploadedFile.name);
    } else if (activeTab === 'text' && textInput.trim()) {
      onAnalyze(textInput);
    }
  };

  const canSubmit =
    !isLoading &&
    ((activeTab === 'file' && uploadedFile !== null) ||
      (activeTab === 'text' && textInput.trim().length > 0));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-slate-800">
        {(['file', 'text'] as InputTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'text-white border-b-2 border-red-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {tab === 'file' ? (
              <>
                <Upload size={15} />
                로그 파일 업로드
              </>
            ) : (
              <>
                <FileText size={15} />
                텍스트 직접 입력
              </>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'file' ? (
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                dragOver
                  ? 'border-red-400 bg-red-400/5'
                  : uploadedFile
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".log,.txt,.json,.out"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <FileText size={24} className="text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-green-400">{uploadedFile.name}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {uploadedFile.content.split('\n').length}줄 로드됨
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">클릭하여 파일 변경</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                    <Upload size={24} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">로그 파일을 드래그하거나 클릭하여 업로드</p>
                    <p className="text-sm text-slate-400 mt-1">.log, .txt, .json, .out 파일 지원</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sample files hint */}
            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <AlertTriangle size={13} className="mt-0.5 text-yellow-500/70 shrink-0" />
              <span>
                데모용 샘플 로그: <code className="bg-slate-800 px-1 py-0.5 rounded">src/data/sample-logs/</code> 에서 확인할 수 있습니다.
              </span>
            </div>
          </div>
        ) : (
          <div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="장애 증상, 에러 메시지, 또는 관련 로그를 붙여넣기 하세요...

예시:
- API 응답 시간이 30초 이상 지연됩니다
- DB 커넥션 풀 고갈 에러가 발생하고 있습니다
- HikariPool: Connection is not available, request timed out after 30000ms"
              className="w-full h-52 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-slate-500 font-mono"
            />
            <p className="mt-2 text-xs text-slate-500">{textInput.length}자 입력됨</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={clsx(
            'mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all',
            canSubmit
              ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              AI 분석 중...
            </>
          ) : (
            <>
              AI 분석 시작
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
