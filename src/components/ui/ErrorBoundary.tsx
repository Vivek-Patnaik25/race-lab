import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Production console error logging
    console.error('RaceLab uncaught UI exception:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/app';
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-background text-text-primary flex items-center justify-center p-6"
        >
          <div className="w-full max-w-xl bg-surface border border-rose-900/60 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-rose-400">
                  Simulation Studio Interrupted
                </h1>
                <p className="text-xs text-text-muted mt-0.5">
                  An unexpected client-side error occurred during component rendering.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-raised border border-border/70 space-y-2">
              <div className="text-xs font-mono text-rose-300 font-medium">Error message</div>
              <p className="text-sm font-mono text-text-primary break-words">
                {this.state.error?.message || 'Unknown runtime error'}
              </p>
            </div>

            {this.state.errorInfo && (
              <div>
                <button
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-mono transition-colors"
                >
                  {this.state.showDetails ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" /> Hide stack trace
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" /> Show component stack
                    </>
                  )}
                </button>

                {this.state.showDetails && (
                  <pre className="mt-2 p-3 bg-black/60 rounded-lg border border-border text-[11px] font-mono text-text-muted overflow-x-auto max-h-48 whitespace-pre-wrap">
                    {this.state.error?.stack}
                    {'\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Recover Session
              </button>

              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-surface-raised hover:bg-surface border border-border text-text-primary rounded-lg text-xs font-medium flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Reload Window
              </button>

              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-surface-raised hover:bg-surface border border-border text-text-secondary hover:text-text-primary rounded-lg text-xs font-medium flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Home className="w-3.5 h-3.5" /> Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
