import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Something went wrong while rendering this page.",
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-content">
          <section className="card empty-state" role="alert">
            <h2>Something went wrong</h2>
            <p className="muted">{this.state.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: "" });
                window.location.assign("/");
              }}
            >
              Return home
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
