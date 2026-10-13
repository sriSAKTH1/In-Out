import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9F7F2] text-[#2D2926] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-stone-200 shadow-xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-black">Something went wrong</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              An unexpected error occurred while loading the application view.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200 text-left overflow-x-auto max-h-32">
                <code className="text-[11px] font-mono text-rose-700 block whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3.5 rounded-2xl bg-[#5A5A40] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:bg-[#484833] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear App Data & Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
