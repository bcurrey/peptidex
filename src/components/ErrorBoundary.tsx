import React, { ReactNode } from "react";
import { resetState } from "../lib/storage";

export class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell">
          <section className="glass-card empty-state app-error">
            <strong>PeptideX had trouble loading this view.</strong>
            <span>Your saved browser data may be from an older build. Resetting local demo data usually fixes this.</span>
            <button
              className="btn"
              onClick={() => {
                resetState();
                window.location.reload();
              }}
            >
              Reset local data
            </button>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}
