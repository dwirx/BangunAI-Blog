import { fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GraphView from "@/components/GraphView";

const mockPosts = vi.hoisted(() => [
  {
    slug: "current-post",
    title: "Current Post",
    summary: "Summary",
    type: "essay",
    category: "Tech",
    tags: ["graph"],
    date: "2026-03-01",
    readingTime: 5,
  },
  {
    slug: "second-post",
    title: "Second Post",
    summary: "Summary",
    type: "note",
    category: "Tech",
    tags: ["graph"],
    date: "2026-03-02",
    readingTime: 4,
  },
  {
    slug: "third-post",
    title: "Third Post",
    summary: "Summary",
    type: "article",
    category: "Tech",
    tags: ["graph"],
    date: "2026-03-03",
    readingTime: 6,
  },
]);

vi.mock("@/content", () => ({
  allPosts: mockPosts,
}));

vi.mock("@/lib/graph-engine", () => ({
  seededUnit: vi.fn(() => 0.5),
  buildPreviewGraph: vi.fn((graph) => graph),
  buildHybridGraph: vi.fn(() => ({
    nodes: mockPosts.map((post) => ({
      id: post.slug,
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      type: post.type,
      category: post.category,
      tags: post.tags,
    })),
    edges: [
      { source: "current-post", target: "second-post", weight: 5, kind: "direct" },
      { source: "second-post", target: "third-post", weight: 4, kind: "semantic" },
    ],
    neighbors: new Map<string, Set<string>>([
      ["current-post", new Set(["second-post"])],
      ["second-post", new Set(["current-post", "third-post"])],
      ["third-post", new Set(["second-post"])],
    ]),
  })),
}));

let graphIsVisible = true;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [0];

  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe = (target: Element) => {
    this.callback(
      [
        {
          isIntersecting: graphIsVisible,
          intersectionRatio: graphIsVisible ? 1 : 0,
          target,
          time: Date.now(),
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
        } as IntersectionObserverEntry,
      ],
      this
    );
  };

  unobserve = () => {};
  disconnect = () => {};
  takeRecords = () => [];
}

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const createContextStub = () => {
  const gradient = { addColorStop: vi.fn() };
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    restore: vi.fn(),
    roundRect: vi.fn(),
    measureText: vi.fn(() => ({ width: 48 })),
    fillText: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    lineCap: "round",
    textAlign: "center",
    font: "12px sans-serif",
  };
};

function renderGraphView() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GraphView currentSlug="current-post" />
    </MemoryRouter>
  );
}

describe("GraphView", () => {
  beforeEach(() => {
    graphIsVisible = true;
    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: MockIntersectionObserver,
    });
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: MockResizeObserver,
    });

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      createContextStub() as unknown as CanvasRenderingContext2D
    );
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps vertical mobile scrolling available on the graph canvas", () => {
    const setPointerCaptureSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      writable: true,
      value: setPointerCaptureSpy,
    });

    const { container } = renderGraphView();
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    if (!canvas) return;

    expect(canvas).toHaveClass("touch-pan-y");

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 24,
      clientY: 24,
    });
    expect(setPointerCaptureSpy).not.toHaveBeenCalled();
  });

  it("does not run the animation loop when graph is outside viewport", () => {
    graphIsVisible = false;
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");

    renderGraphView();

    expect(rafSpy).not.toHaveBeenCalled();
  });
});
