import type { GlutenStatusValue, SoketoCategory } from "./types";

export type BridgeEvent =
  | {
      type: "analysis_completed";
      productName: string;
      ketoScore: number;
      scores: {
        keto: number;
        lowCarb: number;
        diabetic: number;
        lowGI: number;
      };
      glutenStatus: GlutenStatusValue;
      soketoCategory: SoketoCategory;
    }
  | {
      type: "soketo_cta_clicked";
      productId: string | null;
      productUrl: string;
    }
  | { type: "lead_captured"; email: string }
  | { type: "error"; message: string };

type IOSBridge = {
  webkit?: {
    messageHandlers?: {
      soketoApp?: {
        postMessage: (event: BridgeEvent) => void;
      };
    };
  };
};

type AndroidBridge = {
  SoKetoApp?: {
    postMessage: (json: string) => void;
  };
};

export function postToNative(event: BridgeEvent): void {
  if (typeof window === "undefined") return;

  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage(event, "*");
    } catch {
      // ignore — parent frame may have refused
    }
  }

  const ios = window as unknown as IOSBridge;
  const handler = ios.webkit?.messageHandlers?.soketoApp;
  if (handler && typeof handler.postMessage === "function") {
    try {
      handler.postMessage(event);
    } catch {
      // ignore
    }
  }

  const android = window as unknown as AndroidBridge;
  if (android.SoKetoApp && typeof android.SoKetoApp.postMessage === "function") {
    try {
      android.SoKetoApp.postMessage(JSON.stringify(event));
    } catch {
      // ignore
    }
  }
}
