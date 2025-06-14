import React, { useState } from 'react';
import { X, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface ExportResult {
  originalName: string;
  filename?: string;
  downloadUrl?: string;
  success: boolean;
  error?: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ExportResult[];
  isProcessing: boolean;
  progress: number;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  results,
  isProcessing,
  progress
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (downloadUrl: string, filename: string) => {
    setDownloading(filename);
    try {
      const response = await fetch(`http://localhost:3001${downloadUrl}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    const successfulResults = results.filter(r => r.success && r.downloadUrl);
    
    for (const result of successfulResults) {
      if (result.downloadUrl && result.filename) {
        await handleDownload(result.downloadUrl, result.filename);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-600 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <h2 className="text-xl font-semibold text-white">
            {isProcessing ? 'Processing Videos...' : 'Export Results'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {isProcessing ? (
            <div className="text-center py-8">
              <Loader className="w-12 h-12 text-purple-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-white mb-2">Processing Your Videos</h3>
              <p className="text-gray-400 mb-4">
                This may take a few minutes depending on video length and complexity
              </p>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div 
                  className="bg-purple-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{Math.round(progress)}% complete</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {successCount > 0 && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span>{successCount} successful</span>
                      </div>
                    )}
                    {errorCount > 0 && (
                      <div className="flex items-center space-x-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span>{errorCount} failed</span>
                      </div>
                    )}
                  </div>
                  
                  {successCount > 1 && (
                    <button
                      onClick={handleDownloadAll}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-primary hover:bg-purple-600 text-white rounded-lg transition-colors duration-200"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-lg border
                      ${result.success 
                        ? 'bg-green-900/20 border-green-600' 
                        : 'bg-red-900/20 border-red-600'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-white font-medium">{result.originalName}</p>
                          {result.success ? (
                            <p className="text-sm text-green-400">Successfully processed</p>
                          ) : (
                            <p className="text-sm text-red-400">{result.error}</p>
                          )}
                        </div>
                      </div>
                      
                      {result.success && result.downloadUrl && result.filename && (
                        <button
                          onClick={() => handleDownload(result.downloadUrl!, result.filename!)}
                          disabled={downloading === result.filename}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-purple-primary hover:bg-purple-600 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 text-sm"
                        >
                          {downloading === result.filename ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span>
                            {downloading === result.filename ? 'Downloading...' : 'Download'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;