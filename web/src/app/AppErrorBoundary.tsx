import { Component, type ReactNode } from 'react';
import './app-error.css';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error" aria-labelledby="app-error-title">
          <p className="app-error-kicker">Dos Hermanos Catering</p>
          <h1 id="app-error-title">This page could not finish loading.</h1>
          <p>
            Your submitted data was not changed by this screen error. Reload the application to try again.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
