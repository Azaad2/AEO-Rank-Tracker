import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logScanError } from "@/lib/errorLogger";

interface Props {
  children: React.ReactNode;
  component?: string;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logScanError({
      error,
      component: this.props.component || "ErrorBoundary",
      errorType: error.name || "ReactError",
      metadata: { componentStack: info.componentStack },
    });
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="my-6 p-6 rounded-lg border border-red-500/40 bg-red-950/30 text-white">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-300">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              We hit an unexpected error and logged it for our team. You can
              try again — your data is safe.
            </p>
            <p className="text-xs text-gray-500 mt-2 break-all">
              {this.state.error.message}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={this.handleReset}
                size="sm"
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Try again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-200 hover:bg-gray-800"
              >
                Reload page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
