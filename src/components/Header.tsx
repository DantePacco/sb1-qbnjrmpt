import React, { useState } from 'react';
import { Film, Settings, Download, Clock, X } from 'lucide-react';

interface HeaderProps {
  onExport: () => void;
  onSettings: () => void;
  isExporting: boolean;
  videoCount: number;
  maxDuration: number;
  onMaxDurationChange: (duration: number) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onExport, 
  onSettings, 
  isExporting, 
  videoCount,
  maxDuration,
  onMaxDurationChange
}) => {
  const [showDurationSettings, setShowDurationSettings] = useState(false);
  const [tempDuration, setTempDuration] = useState(maxDuration);

  const handleApplyDuration = () => {
    onMaxDurationChange(tempDuration);
    setShowDurationSettings(false);
  };

  const presetDurations = [15, 30, 60, 90, 120];

  return (
    <header className="bg-dark-800 border-b border-dark-600 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-purple-primary rounded-lg">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Reel Caption Editor</h1>
            <p className="text-sm text-gray-400">
              Professional Instagram Reel Creator
              {videoCount > 0 && ` • ${videoCount} video${videoCount > 1 ? 's' : ''} loaded`}
              {maxDuration < 300 && ` • Max ${maxDuration}s duration`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Duration Limiter Button */}
          <div className="relative">
            <button
              onClick={() => setShowDurationSettings(!showDurationSettings)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200
                ${maxDuration < 300 
                  ? 'bg-purple-primary/20 border border-purple-primary text-purple-primary' 
                  : 'bg-dark-700 hover:bg-dark-600 text-gray-300'
                }
              `}
            >
              <Clock className="w-4 h-4" />
              <span>{maxDuration < 300 ? `${maxDuration}s limit` : 'Duration'}</span>
            </button>

            {/* Duration Settings Dropdown */}
            {showDurationSettings && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-dark-800 border border-dark-600 rounded-xl shadow-xl z-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Video Duration Limit</h3>
                    <button
                      onClick={() => setShowDurationSettings(false)}
                      className="p-1 hover:bg-dark-700 rounded transition-colors duration-200"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Maximum Duration (seconds)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={tempDuration}
                        onChange={(e) => setTempDuration(parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-500 rounded-lg text-white focus:border-purple-primary focus:outline-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Videos longer than this will be trimmed from the beginning
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quick Presets
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {presetDurations.map(duration => (
                          <button
                            key={duration}
                            onClick={() => setTempDuration(duration)}
                            className={`
                              px-3 py-2 rounded-lg text-sm transition-colors duration-200
                              ${tempDuration === duration
                                ? 'bg-purple-primary text-white'
                                : 'bg-dark-700 hover:bg-dark-600 text-gray-300'
                              }
                            `}
                          >
                            {duration}s
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-dark-600">
                      <button
                        onClick={() => {
                          setTempDuration(300);
                          onMaxDurationChange(300);
                          setShowDurationSettings(false);
                        }}
                        className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                      >
                        Remove Limit
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowDurationSettings(false)}
                          className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleApplyDuration}
                          className="px-4 py-2 bg-purple-primary hover:bg-purple-600 text-white rounded-lg transition-colors duration-200"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors duration-200"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          
          <button
            onClick={onExport}
            disabled={isExporting || videoCount === 0}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-primary hover:bg-purple-600 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting 
                ? 'Exporting...' 
                : videoCount > 1 
                  ? `Export All ${videoCount} Reels` 
                  : 'Export Reel'
              }
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;