interface InitialContext {
  hasGlobalContext: boolean;
  spaceIdOverride?: string;
}

class ContextStore {
  private context: InitialContext = {
    hasGlobalContext: false,
  };

  setInitialContextLoaded(): void {
    this.context.hasGlobalContext = true;
  }

  hasInitialContext(): boolean {
    return this.context.hasGlobalContext;
  }

  resetInitialContext(): void {
    this.context.hasGlobalContext = false;
  }

  setSpaceIdOverride(spaceId: string): void {
    this.context.spaceIdOverride = spaceId;
  }

  getSpaceIdOverride(): string | undefined {
    return this.context.spaceIdOverride;
  }

  clearSpaceIdOverride(): void {
    this.context.spaceIdOverride = undefined;
  }
}

export const contextStore = new ContextStore();
